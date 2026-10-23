import test from 'node:test';
import assert from 'node:assert/strict';
import {promises as fs} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn, execFile} from 'node:child_process';
import {promisify} from 'node:util';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {initialize, run, status, control, specHash, atomicJson, validateSpec} from '../tools/improvement/engine.mjs';
import {claudePreflight} from '../tools/improvement/claude-adapter.mjs';
const exec = promisify(execFile);
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CLI = path.join(ROOT, 'tools/improvement/cli.mjs');
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
const json = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const waitFor = async predicate => { const until = Date.now() + 5000; while (Date.now() < until) { if (await predicate()) return; await new Promise(r => setTimeout(r, 20)); } throw new Error('test deadline'); };
async function fixture(t, edit = () => {}) {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'improvement-test-'));
  t.after(() => fs.rm(temp, {recursive: true, force: true}));
  const workspace = path.join(temp, 'repo'), stateDir = path.join(temp, 'run'), specPath = path.join(temp, 'spec.json');
  await fs.mkdir(path.join(workspace, 'docs'), {recursive: true});
  await fs.mkdir(path.join(workspace, 'checks'));
  await fs.writeFile(path.join(workspace, 'docs/note.md'), 'before\n');
  await fs.writeFile(path.join(workspace, 'checks/acceptance.json'), '{"approved":true}\n');
  await exec('git', ['init', '-q', workspace]);
  await exec('git', ['-C', workspace, 'add', '.']);
  await exec('git', ['-C', workspace, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'fixture']);
  const spec = {version: 1, id: 'doc-improvement', dataClass: 'synthetic', background: 'Synthetic documentation task.', goal: 'Replace the fixture paragraph.', inputs: ['docs/note.md', 'checks/acceptance.json'], allowedFiles: ['docs/note.md'], acceptance: [{id: 'approved-copy', type: 'sha256', path: 'docs/note.md', sha256: hash('after\n')}], humanChecks: [], budget: {maxAttempts: 3, maxWallTimeMs: 15000, maxAttemptMs: 5000}, adapter: {kind: 'fixture', steps: [{mode: 'write', path: 'docs/note.md', content: 'after\n'}]}};
  edit(spec);
  await atomicJson(specPath, spec);
  await initialize({specPath, workspace, stateDir, approvedHash: specHash(spec)});
  return {temp, workspace, stateDir, specPath, spec};
}
function cli(args) {
  const child = spawn(process.execPath, [CLI, ...args], {cwd: ROOT, env: {PATH: process.env.PATH}, stdio: ['ignore', 'pipe', 'pipe']});
  let stdout = '', stderr = '';
  child.stdout.on('data', c => { stdout += c; }); child.stderr.on('data', c => { stderr += c; });
  child.done = new Promise(resolve => child.on('close', code => resolve({code, stdout, stderr})));
  return child;
}

test('real CLI makes a finite repair loop, binds evidence, and leaves source checkout unchanged', async t => {
  const f = await fixture(t, s => { s.adapter.steps.unshift({mode: 'write', path: 'docs/note.md', content: 'incorrect\n'}); });
  const first = cli(['run', '--state', f.stateDir]);
  const result = await first.done;
  assert.equal(result.code, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, 'candidate'); assert.equal(output.attempts, 2); assert.equal(output.publicationAllowed, false);
  assert.equal(await fs.readFile(path.join(f.workspace, 'docs/note.md'), 'utf8'), 'before\n');
  const candidate = await json(path.join(f.stateDir, 'candidate.json'));
  assert.equal(candidate.specHash, specHash(f.spec)); assert.equal(candidate.manifest['docs/note.md'], hash('after\n'));
  assert.equal(candidate.baseCommit, (await exec('git', ['-C', f.workspace, 'rev-parse', 'HEAD'])).stdout.trim());
  const handoff = await json(path.join(f.stateDir, 'handoff.json'));
  assert.equal(handoff.next, 'human-review'); assert.deepEqual(handoff.changedFiles, ['docs/note.md']);
  const events = (await fs.readFile(path.join(f.stateDir, 'events.jsonl'), 'utf8')).trim().split('\n').map(JSON.parse);
  assert.ok(events.some(e => e.kind === 'acceptance-failed'));
  assert.ok(!JSON.stringify(events).includes('incorrect')); assert.ok(!JSON.stringify(events).includes('Replace the fixture'));
});

test('compaction equivalent: a new CLI process resumes fixed verification without repeating implementation', async t => {
  const f = await fixture(t);
  const first = await cli(['run', '--state', f.stateDir, '--one-step']).done;
  assert.equal(JSON.parse(first.stdout).phase, 'verifying');
  const second = await cli(['run', '--state', f.stateDir]).done;
  assert.equal(JSON.parse(second.stdout).status, 'candidate'); assert.equal(JSON.parse(second.stdout).attempts, 1);
});

test('a reviewed fixture can change multiple allowed files without applying them to the checkout', async t => {
  const f=await fixture(t,s=>{s.allowedFiles.push('docs/extra.md');s.acceptance.push({id:'extra-file',type:'sha256',path:'docs/extra.md',sha256:hash('extra\n')});s.adapter.steps=[{mode:'write-many',files:[{path:'docs/note.md',content:'after\n'},{path:'docs/extra.md',content:'extra\n'}]}];});
  const result=await run(f.stateDir);assert.equal(result.status,'candidate');
  assert.equal(await fs.readFile(path.join(f.workspace,'docs/note.md'),'utf8'),'before\n');
  await assert.rejects(fs.access(path.join(f.workspace,'docs/extra.md')));
  const bad=structuredClone(f.spec);bad.adapter.steps[0].files.push(bad.adapter.steps[0].files[0]);
  assert.throws(()=>validateSpec(bad),/INVALID_ADAPTER/);
});

test('simultaneous run is refused and pause kills the active subprocess; resume keeps attempt budget', async t => {
  const f = await fixture(t, s => { s.adapter.steps[0].delayMs = 2000; });
  const first = cli(['run', '--state', f.stateDir]);
  await waitFor(async () => (await json(path.join(f.stateDir, 'state.json'))).attempts === 1);
  const duplicate = await cli(['run', '--state', f.stateDir]).done;
  assert.equal(duplicate.code, 3); assert.equal(JSON.parse(duplicate.stderr).error, 'BUSY');
  await control(f.stateDir, 'pause');
  assert.equal(JSON.parse((await first.done).stdout).status, 'paused');
  await control(f.stateDir, 'resume');
  assert.equal((await run(f.stateDir)).status, 'candidate');
  assert.equal((await status(f.stateDir)).attempts, 2);
});

test('crash + stale lease recover in a different process without reusing uncertain attempt', async t => {
  const f = await fixture(t, s => { s.adapter.steps[0].delayMs = 1000; });
  const first = cli(['run', '--state', f.stateDir]);
  await waitFor(async () => (await json(path.join(f.stateDir, 'state.json'))).attempts === 1);
  first.kill('SIGKILL'); await first.done;
  // The killed controller's trusted offline fixture may finish; it can only touch attempt 1.
  const lockFile = path.join(f.stateDir, 'lease/owner.json');
  const owner = await json(lockFile); owner.expiresAt = Date.now() - 1; await atomicJson(lockFile, owner);
  const workspaceLease = path.join(process.platform === 'win32' ? os.tmpdir() : '/tmp', `nocturne-improvement-leases-${process.getuid?.() ?? 'user'}`, hash(await fs.realpath(f.workspace)), 'lease/owner.json');
  const workspaceOwner = await json(workspaceLease); workspaceOwner.expiresAt = Date.now() - 1; await atomicJson(workspaceLease, workspaceOwner);
  const second = await cli(['run', '--state', f.stateDir]).done;
  const result = JSON.parse(second.stdout);
  assert.equal(result.status, 'candidate'); assert.equal(result.attempts, 2);
  const state = await json(path.join(f.stateDir, 'state.json'));
  assert.ok(state.events.some(e => e.reason === 'INTERRUPTED'));
});

test('model success claims do not satisfy host acceptance; repeated identical failures stop', async t => {
  const f = await fixture(t, s => { s.adapter.steps = [{mode: 'noop'}]; });
  const output = await run(f.stateDir);
  assert.equal(output.status, 'stopped'); assert.equal(output.reason, 'REPEATED_FAILURE'); assert.equal(output.attempts, 2);
  assert.equal(output.verification[0].passed, false);
});

test('attempt count remains finite when failures differ', async t => {
  const f = await fixture(t, s => { s.budget.maxAttempts = 1; s.adapter.steps = [{mode: 'noop'}]; });
  const output = await run(f.stateDir);
  assert.equal(output.reason, 'ATTEMPT_LIMIT'); assert.equal(output.attempts, 1);
});

test('subprocess timeout is a stop, not an unbounded retry', async t => {
  const f = await fixture(t, s => { s.budget.maxAttemptMs = 120; s.adapter.steps = [{mode: 'hang'}]; });
  const start = Date.now(); const output = await run(f.stateDir);
  assert.equal(output.reason, 'ATTEMPT_TIMEOUT'); assert.equal(output.attempts, 1); assert.ok(Date.now() - start < 3000);
});

test('absolute job deadline survives pauses and process boundaries', async t => {
  const f = await fixture(t);
  const state = await json(path.join(f.stateDir, 'state.json'));
  state.startedAt = Date.now() - 20000; state.deadline = Date.now() - 1; await atomicJson(path.join(f.stateDir, 'state.json'), state);
  assert.equal((await run(f.stateDir)).reason, 'WALL_TIME_LIMIT');
  assert.equal((await status(f.stateDir)).attempts, 0);
});

test('cost is reserved before every attempt and never reset by a restart', async t => {
  const f = await fixture(t, s => { s.budget.maxCostUsd = 1; s.adapter.steps = [{mode: 'noop', costUsd: 0.6}]; });
  const output = await run(f.stateDir);
  assert.equal(output.reason, 'COST_LIMIT'); assert.equal(output.attempts, 1); assert.equal(output.reservedCostUsd, 0.6); assert.equal(output.actualCostUsd, null);
  assert.equal((await run(f.stateDir)).reservedCostUsd, 0.6);
});

test('nonzero simulated spend needs an explicit budget', async t => {
  const f = await fixture(t, s => { s.adapter.steps[0].costUsd = 0.1; });
  assert.equal((await run(f.stateDir)).reason, 'COST_BUDGET_REQUIRED');
});

test('changed source or sealed acceptance/spec stops instead of weakening criteria', async t => {
  for (const variant of ['source', 'sealed']) {
    const f = await fixture(t);
    const file = variant === 'source' ? f.specPath : path.join(f.stateDir, 'sealed-spec.json');
    const changed = await json(file); changed.acceptance[0].sha256 = hash('before\n'); await atomicJson(file, changed);
    const output = await run(f.stateDir);
    assert.equal(output.reason, 'SPEC_CHANGED'); assert.equal(output.attempts, 0);
  }
});

test('forbidden changes and acceptance-file edits stop independently of model output', async t => {
  for (const mode of ['forbidden', 'tamper-check', 'prototype-file']) {
    const f = await fixture(t, s => { s.adapter.steps = [mode === 'prototype-file' ? {mode: 'write', path: '__proto__', content: 'unexpected'} : {mode}]; });
    const output = await run(f.stateDir);
    assert.equal(output.reason, 'FORBIDDEN_FILE_CHANGED'); assert.equal(output.attempts, 1);
  }
});

test('modified checkpoints and completed candidates are invalidated on resume', async t => {
  for (const oneStep of [true,false]) {
    const f = await fixture(t); await run(f.stateDir, {oneStep});
    const state = await json(path.join(f.stateDir, 'state.json'));
    await fs.writeFile(path.join(state.attempt.stage, 'docs/note.md'), 'later mutation\n');
    assert.equal((await run(f.stateDir)).reason, 'CANDIDATE_CHANGED');
  }
});

test('commit and dirty source changes invalidate resume before implementation', async t => {
  const dirty = await fixture(t); await fs.writeFile(path.join(dirty.workspace, 'docs/note.md'), 'human edit\n');
  assert.equal((await run(dirty.stateDir)).reason, 'WORKSPACE_DIRTY');
  const moved = await fixture(t);
  await exec('git', ['-C', moved.workspace, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '--allow-empty', '-qm', 'new base']);
  assert.equal((await run(moved.stateDir)).reason, 'COMMIT_CHANGED');
});

test('human acceptance remains pending and the engine has no publication path', async t => {
  const f = await fixture(t, s => { s.humanChecks = ['reader-understands']; });
  const output = await run(f.stateDir);
  assert.equal(output.status, 'awaiting_human'); assert.equal(output.reason, 'HUMAN_ACCEPTANCE_REQUIRED');
  assert.deepEqual(output.humanChecks, ['reader-understands']); assert.equal(output.publicationAllowed, false);
  assert.equal((await run(f.stateDir)).attempts, 1);
});

test('a completed verification cannot retain success after its report or screenshot changes', async t => {
  for (const changed of ['report', 'image']) {
    const f = await fixture(t); await run(f.stateDir);
    const imageFile = path.join(f.temp, 'screen.png'), reportFile = path.join(f.temp, 'verification.json');
    await fs.writeFile(imageFile, 'synthetic image');
    const report = {passed: true, artifacts: [{file: 'screen.png', sha256: hash('synthetic image')}]};
    await atomicJson(reportFile, report);
    const state = await json(path.join(f.stateDir, 'state.json'));
    state.verification[0] = {...state.verification[0], evidence: reportFile, evidenceSha256: hash(JSON.stringify(report))};
    await atomicJson(path.join(f.stateDir, 'state.json'), state);
    assert.equal((await run(f.stateDir)).status, 'candidate');
    await fs.writeFile(changed === 'report' ? reportFile : imageFile, changed === 'report' ? '{"passed":true}' : 'replaced image');
    const result = await run(f.stateDir); assert.equal(result.status, 'stopped'); assert.equal(result.reason, 'PRODUCT_EVIDENCE_CHANGED');
  }
});

test('kill switch is terminal and cannot silently resume', async t => {
  const f = await fixture(t); await control(f.stateDir, 'kill');
  assert.equal((await run(f.stateDir)).status, 'killed');
  await assert.rejects(control(f.stateDir, 'resume'), /KILL_IS_TERMINAL/);
  assert.equal((await status(f.stateDir)).attempts, 0);
});

test('approval, path restrictions, sensitive data and protected checks fail closed', async t => {
  const f = await fixture(t);
  await assert.rejects(initialize({specPath: f.specPath, workspace: f.workspace, stateDir: path.join(f.temp, 'unapproved'), approvedHash: 'wrong'}), /APPROVAL_HASH_REQUIRED/);
  for (const file of ['../escape.md', '/etc/passwd', '.env', 'sources/reference.md', 'data/answers.json', 'tests/test.mjs', 'tools/policy.mjs', 'checks/acceptance.json']) {
    const s = structuredClone(f.spec); s.allowedFiles = [file];
    assert.throws(() => validateSpec(s), /FORBIDDEN_PATH|PROTECTED_FILE/);
  }
  await fs.writeFile(path.join(f.workspace, 'docs/note.md'), '-----BEGIN PRIVATE KEY-----\n');
  await exec('git', ['-C', f.workspace, 'add', '.']);
  await exec('git', ['-C', f.workspace, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'unsafe fixture']);
  await assert.rejects(initialize({specPath: f.specPath, workspace: f.workspace, stateDir: path.join(f.temp, 'unsafe'), approvedHash: specHash(f.spec)}), /UNSAFE_CONTENT/);
});

test('Claude remains disabled without explicit paid/external authority, budget, billing guard and dedicated key', async t => {
  const f = await fixture(t);
  const s = structuredClone(f.spec);
  s.adapter = {kind: 'claude-docker', image: `sha256:${'a'.repeat(64)}`, claudeVersion: '2.1.292', model: 'claude-sonnet-4-6'};
  await assert.rejects(claudePreflight(s, {}), /EXTERNAL_PAID_DISABLED/);
  await assert.rejects(claudePreflight(s, {allowPaid: true, allowExternal: true}), /COST_BUDGET_REQUIRED/);
  s.budget.maxCostUsd = 1;
  await assert.rejects(claudePreflight(s, {allowPaid: true, allowExternal: true}), /PROVIDER_HARD_CAP_REQUIRED/);
  s.adapter.providerHardCapUsd = 1;
  const saved = process.env.IMPROVEMENT_ANTHROPIC_API_KEY; delete process.env.IMPROVEMENT_ANTHROPIC_API_KEY;
  try { await assert.rejects(claudePreflight(s, {allowPaid: true, allowExternal: true}), /DEDICATED_API_KEY_REQUIRED/); }
  finally { if (saved !== undefined) process.env.IMPROVEMENT_ANTHROPIC_API_KEY = saved; }
});

test('network proxy rejects all destinations except the exact Anthropic TLS endpoint', async t => {
  const {allowedTarget, createProxy} = await import('../tools/improvement/egress-proxy.mjs');
  const net = await import('node:net');
  assert.equal(allowedTarget('api.anthropic.com:443'), true);
  for (const target of ['api.anthropic.com:80', 'api.anthropic.com.evil.test:443', 'api.anthropic.com@evil.test:443', '127.0.0.1:443', 'metadata.google.internal:80', 'API.ANTHROPIC.COM:443']) assert.equal(allowedTarget(target), false);
  let connections = 0;
  const server = createProxy({connect: () => { connections++; throw new Error('must not connect'); }});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const response = await new Promise((resolve, reject) => {
    const client = net.connect(server.address().port, '127.0.0.1');
    let data = ''; client.on('error', reject); client.on('data', chunk => { data += chunk; }); client.on('end', () => resolve(data));
    client.on('connect', () => client.write('CONNECT example.invalid:443 HTTP/1.1\r\nHost: example.invalid:443\r\n\r\n'));
  });
  assert.match(response, /403 Forbidden/); assert.equal(connections, 0);
});

test('Docker adapter builds least-privilege runtime commands through a stub without paid or external execution', async t => {
  const f = await fixture(t), bin = path.join(f.temp, 'bin'); await fs.mkdir(bin);
  const dockerFile = path.join(bin, 'docker');
  await fs.writeFile(dockerFile, `#!${process.execPath}\nconst a=process.argv.slice(2);const image='sha256:'+ 'a'.repeat(64);if(a[0]==='image')process.stdout.write(JSON.stringify([{Id:image,Config:{Env:['PATH=/usr/bin'],Volumes:null}}]));else if(a.includes('--version'))process.stdout.write('2.1.292 (Claude Code)');else if(a.includes('--help'))process.stdout.write('--bare --max-budget-usd --max-turns --tools --strict-mcp-config --permission-mode');else if(a[0]==='network'&&a[1]==='inspect')process.stdout.write('[{"Internal":true}]');else if(a[0]==='inspect')process.stdout.write(JSON.stringify({['improvement-'+ 'a'.repeat(24)+'-net']:{IPAddress:'172.29.0.2'}}));else process.stdout.write('ok');\n`, {mode: 0o700});
  const savedPath = process.env.PATH, savedKey = process.env.IMPROVEMENT_ANTHROPIC_API_KEY;
  process.env.PATH = bin + path.delimiter + savedPath; process.env.IMPROVEMENT_ANTHROPIC_API_KEY = 'synthetic-fixture-key';
  t.after(() => { process.env.PATH = savedPath; if (savedKey === undefined) delete process.env.IMPROVEMENT_ANTHROPIC_API_KEY; else process.env.IMPROVEMENT_ANTHROPIC_API_KEY = savedKey; });
  const s = structuredClone(f.spec); s.budget.maxCostUsd = 1;
  s.adapter = {kind: 'claude-docker', image: `sha256:${'a'.repeat(64)}`, claudeVersion: '2.1.292', model: 'claude-sonnet-4-6', providerHardCapUsd: 1};
  const preflight = await claudePreflight(s, {allowPaid: true, allowExternal: true});
  assert.equal(preflight.cliVersion, '2.1.292');
  const {runClaude} = await import('../tools/improvement/claude-adapter.mjs');
  const runtime = `improvement-${'a'.repeat(24)}`;
  let captured;
  await runClaude(s, {activeRuntime: [`${runtime}-agent`, `${runtime}-proxy`, `${runtime}-net`], attempt: {reservedCostUsd: 0.3}, verification: []}, f.workspace, {timeoutMs: 5000, shouldStop: async () => null, runProcess: async (command, args, options) => { captured = {command, args, options}; return {code: 0, output: '{}'}; }});
  assert.equal(captured.command, 'docker');
  for (const flag of ['--log-driver', '--read-only', '--cap-drop', '--security-opt', '--user', '--pids-limit', '--memory', '--network', '--dns', '--bare', '--strict-mcp-config', '--max-budget-usd']) assert.ok(captured.args.includes(flag), flag);
  assert.ok(captured.args.includes('ALL')); assert.ok(captured.args.includes('no-new-privileges'));
  assert.ok(!captured.args.some(arg => /Bash|skip-permissions|docker.sock|\.ssh|\.claude/.test(arg)));
  assert.equal(captured.args[captured.args.indexOf('--tools') + 1], 'Read,Edit,Write,Glob,Grep');
  assert.equal(captured.args[captured.args.indexOf('--network') + 1], `${runtime}-net`);
  assert.equal(captured.options.env.ANTHROPIC_API_KEY, 'synthetic-fixture-key');
  assert.ok(!JSON.stringify(captured.args).includes('synthetic-fixture-key'));
  assert.ok(!JSON.stringify(captured.options.env).includes('CLOUDFLARE'));
});

test('separate run directories cannot process the same checkout simultaneously', async t => {
  const f = await fixture(t, s => { s.adapter.steps[0].delayMs = 1000; });
  const secondDir = path.join(f.temp, 'second-run');
  await initialize({specPath: f.specPath, workspace: f.workspace, stateDir: secondDir, approvedHash: specHash(f.spec)});
  const first = cli(['run', '--state', f.stateDir]);
  await waitFor(async () => (await json(path.join(f.stateDir, 'state.json'))).attempts === 1);
  const second = await cli(['run', '--state', secondDir]).done;
  assert.equal(second.code, 3); assert.equal(JSON.parse(second.stderr).error, 'BUSY');
  assert.equal((await status(secondDir)).attempts, 0);
  assert.equal(JSON.parse((await first.done).stdout).status, 'candidate');
});

test('corrupt control file cannot silently disable a stop instruction', async t => {
  const f = await fixture(t); await fs.writeFile(path.join(f.stateDir, 'control.json'), '{broken');
  assert.equal((await run(f.stateDir)).reason, 'CONTROL_READ_FAILED');
  await assert.rejects(control(f.stateDir, 'resume'), /CONTROL_READ_FAILED/);
});

test('fixed Node syntax acceptance repairs parse errors without executing candidate code', async t => {
  const f = await fixture(t, s => {
    s.allowedFiles = ['src/check.mjs'];
    s.acceptance = [{id: 'syntax-valid', type: 'node-syntax', path: 'src/check.mjs'}];
    s.adapter.steps = [
      {mode: 'write', path: 'src/check.mjs', content: 'export const = ;\n'},
      {mode: 'write', path: 'src/check.mjs', content: "throw new Error('executing this code must fail');\nexport const ready = true;\n"}
    ];
  });
  const output = await run(f.stateDir);
  assert.equal(output.status, 'candidate'); assert.equal(output.attempts, 2);
  assert.deepEqual(output.verification, [{id: 'syntax-valid', passed: true}]);
  assert.equal(output.actualCostUsd, null); assert.equal(output.reservedCostUsd, 0);
  assert.equal(await fs.access(path.join(f.workspace, 'src/check.mjs')).then(() => true, () => false), false);
});
