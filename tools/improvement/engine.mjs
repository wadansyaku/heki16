import {promises as fs} from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import {spawn, execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {claudePreflight, runClaude, validateClaudeConfig} from './claude-adapter.mjs';
import {loadProductProfile, validateProductCandidate, PRODUCT_PATCHES, containerPatchAllowed} from './product-profile.mjs';
import {runContainerGate} from './container-gate.mjs';
import {cleanupContainerRuntime} from './container-runtime.mjs';

const exec = promisify(execFile);
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const HASH = /^[a-f0-9]{64}$/;
const ID = /^[a-z][a-z0-9-]{0,63}$/;
const denyPath = /(^|\/)(?:\.git|\.claude|\.codex|node_modules|sources|data|backups|private|secrets?|answers?|responses?)(\/|$)|(^|\/)(?:\.env[^/]*|\.dev\.vars[^/]*|[^/]*\.(?:pem|key|sqlite|sqlite3|db)|credentials[^/]*|wrangler[^/]*|package(?:-lock)?\.json)(?:$|\/)/i;
const safeText = text => !/-----BEGIN .*PRIVATE KEY-----|\b(?:sk-ant-|sk-proj-|AKIA)[A-Za-z0-9_-]{12,}|"(?:rawAnswers|apiKey|accessToken|refreshToken|password)"\s*:/i.test(text);
const TERMINAL = new Set(['candidate', 'awaiting_human', 'stopped', 'killed']);

export class EngineError extends Error {
  constructor(code) { super(code); this.code = code; }
}
const fail = code => { throw new EngineError(code); };
const exists = async file => fs.access(file).then(() => true, () => false);
const readJson = async file => JSON.parse(await fs.readFile(file, 'utf8'));
export const specHash = spec => digest(JSON.stringify(spec));

export async function atomicJson(file, value) {
  const temp = `${file}.${crypto.randomUUID()}.tmp`;
  const handle = await fs.open(temp, 'wx', 0o600);
  try { await handle.writeFile(`${JSON.stringify(value, null, 2)}\n`); await handle.sync(); }
  finally { await handle.close(); }
  await fs.rename(temp, file);
  const dir = await fs.open(path.dirname(file), 'r');
  try { await dir.sync(); } finally { await dir.close(); }
}
function relativeFile(file) {
  if (typeof file !== 'string' || file.length > 200 || path.isAbsolute(file) || file.includes('\\') || file.split('/').some(p => !p || p === '.' || p === '..') || denyPath.test(file)) fail('FORBIDDEN_PATH');
  return file;
}
function exactKeys(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !keys.includes(k))) fail('INVALID_SPEC');
}
export function validateSpec(spec) {
  exactKeys(spec, ['version', 'id', 'dataClass', 'background', 'goal', 'inputs', 'allowedFiles', 'acceptance', 'humanChecks', 'budget', 'adapter']);
  if (spec.version !== 1 || !ID.test(spec.id) || !['synthetic', 'public-source'].includes(spec.dataClass)) fail('INVALID_SPEC');
  if (!['background', 'goal'].every(k => typeof spec[k] === 'string' && spec[k].length > 0 && spec[k].length <= 4000 && safeText(spec[k]))) fail('INVALID_SPEC');
  for (const key of ['inputs', 'allowedFiles']) {
    if (!Array.isArray(spec[key]) || !spec[key].length || spec[key].length > 30 || new Set(spec[key]).size !== spec[key].length) fail('INVALID_SPEC');
    spec[key].forEach(relativeFile);
  }
  // Enforcement/config/tests are supplied by the controller, never edited by an agent.
  if (spec.allowedFiles.some(f => /(^|\/)(?:tests?|tools|\.github|automation)(\/|$)|(?:AGENTS|CLAUDE)\.md$|(?:^|\/)acceptance\.[^/]+$/i.test(f))) fail('PROTECTED_FILE');
  if (!Array.isArray(spec.acceptance) || !spec.acceptance.length || spec.acceptance.length > 30) fail('INVALID_SPEC');
  const ids = new Set();
  for (const check of spec.acceptance) {
    exactKeys(check, ['id', 'type', 'path', 'sha256', 'text']);
    if (!ID.test(check.id) || ids.has(check.id) || !['sha256', 'contains', 'not-contains', 'node-syntax', 'nocturne-product', 'nocturne-container'].includes(check.type)) fail('INVALID_SPEC');
    ids.add(check.id);
    if (['nocturne-product','nocturne-container'].includes(check.type)) {
      if (check.path !== undefined || check.text !== undefined || !HASH.test(check.sha256) || spec.allowedFiles.some(file => check.type === 'nocturne-container' ? !containerPatchAllowed(file) : !PRODUCT_PATCHES.includes(file))) fail('PRODUCT_EXECUTABLE_PATCH_REQUIRES_SANDBOX');
      continue;
    }
    relativeFile(check.path);
    if (!spec.allowedFiles.includes(check.path) && !spec.inputs.includes(check.path)) fail('INVALID_SPEC');
    if (check.type === 'node-syntax') {
      if (!/\.(?:mjs|cjs|js)$/.test(check.path) || check.text !== undefined || check.sha256 !== undefined) fail('INVALID_SPEC');
    } else if (check.type === 'sha256' ? !HASH.test(check.sha256) || check.text !== undefined : typeof check.text !== 'string' || !check.text || check.text.length > 4000 || !safeText(check.text) || check.sha256 !== undefined) fail('INVALID_SPEC');
  }
  if (!Array.isArray(spec.humanChecks) || spec.humanChecks.length > 30 || new Set(spec.humanChecks).size !== spec.humanChecks.length || spec.humanChecks.some(id => !ID.test(id) || ids.has(id))) fail('INVALID_SPEC');
  exactKeys(spec.budget, ['maxAttempts', 'maxWallTimeMs', 'maxAttemptMs', 'maxCostUsd']);
  const b = spec.budget;
  if (!Number.isInteger(b.maxAttempts) || b.maxAttempts < 1 || b.maxAttempts > 3 || !Number.isInteger(b.maxWallTimeMs) || b.maxWallTimeMs < 100 || b.maxWallTimeMs > 1800000 || !Number.isInteger(b.maxAttemptMs) || b.maxAttemptMs < 50 || b.maxAttemptMs > b.maxWallTimeMs) fail('INVALID_BUDGET');
  if (b.maxCostUsd !== undefined && (!Number.isFinite(b.maxCostUsd) || b.maxCostUsd < 0 || b.maxCostUsd > 100)) fail('INVALID_BUDGET');
  if (!spec.adapter || !['fixture', 'claude-docker'].includes(spec.adapter.kind)) fail('INVALID_ADAPTER');
  if (spec.adapter.kind === 'claude-docker') validateClaudeConfig(spec);
  if (spec.adapter.kind === 'fixture') {
    exactKeys(spec.adapter, ['kind', 'steps']);
    if (!Array.isArray(spec.adapter.steps) || !spec.adapter.steps.length || spec.adapter.steps.length > 3) fail('INVALID_ADAPTER');
    for (const step of spec.adapter.steps) {
      exactKeys(step, ['mode', 'path', 'content', 'files', 'delayMs', 'costUsd']);
      if (!['write', 'write-many', 'noop', 'exit', 'hang', 'forbidden', 'tamper-check'].includes(step.mode)) fail('INVALID_ADAPTER');
      if (step.mode === 'write-many') {
        if (step.path !== undefined || step.content !== undefined || !Array.isArray(step.files) || !step.files.length || step.files.length > 3 || new Set(step.files.map(f => f.path)).size !== step.files.length) fail('INVALID_ADAPTER');
        for (const file of step.files) { exactKeys(file, ['path', 'content']); relativeFile(file.path); if (typeof file.content !== 'string' || file.content.length > 100000 || !safeText(file.content)) fail('UNSAFE_CONTENT'); }
      } else if (step.files !== undefined) fail('INVALID_ADAPTER');
      if (step.path !== undefined) relativeFile(step.path);
      if (step.content !== undefined && (typeof step.content !== 'string' || step.content.length > 100000 || !safeText(step.content))) fail('UNSAFE_CONTENT');
      if (step.delayMs !== undefined && (!Number.isInteger(step.delayMs) || step.delayMs < 0 || step.delayMs > 60000)) fail('INVALID_ADAPTER');
      if (step.costUsd !== undefined && (!Number.isFinite(step.costUsd) || step.costUsd < 0)) fail('INVALID_BUDGET');
    }
  }
  return spec;
}
async function checkedFile(root, file, {optional = false} = {}) {
  relativeFile(file);
  let current = root;
  for (const segment of file.split('/')) {
    current = path.join(current, segment);
    let stat;
    try { stat = await fs.lstat(current); } catch (error) { if (optional && error.code === 'ENOENT') return null; throw error; }
    if (stat.isSymbolicLink()) fail('SYMLINK_REJECTED');
  }
  const stat = await fs.stat(current);
  if (!stat.isFile() || stat.size > 1000000) fail('UNSAFE_INPUT');
  return fs.readFile(current);
}
async function git(root, args) {
  try { return (await exec('git', ['-C', root, ...args], {encoding: 'utf8', maxBuffer: 2e6, env: {PATH: process.env.PATH, HOME: '/nonexistent', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null'}})).stdout.trim(); }
  catch { fail('GIT_CHECK_FAILED'); }
}
async function checkWorkspace(root) {
  if (await fs.realpath(root) !== root || await git(root, ['rev-parse', '--show-toplevel']) !== root) fail('DEDICATED_CHECKOUT_REQUIRED');
  if (await git(root, ['status', '--porcelain', '--untracked-files=all'])) fail('WORKSPACE_DIRTY');
  return git(root, ['rev-parse', 'HEAD']);
}
async function fingerprints(root, files, optional = false) {
  const result = Object.create(null);
  for (const file of files) {
    const content = await checkedFile(root, file, {optional});
    if (content !== null && !safeText(content.toString('utf8'))) fail('UNSAFE_CONTENT');
    result[file] = content === null ? null : digest(content);
  }
  return result;
}
async function checkpoint(dir, state, kind, reason = null) {
  state.updatedAt = new Date().toISOString();
  state.events.push({seq: state.events.length + 1, at: state.updatedAt, kind, status: state.status, phase: state.phase, attempt: state.attempts, reason, reservedCostUsd: state.reservedCostUsd, actualCostUsd: state.actualCostUsd});
  await atomicJson(path.join(dir, 'state.json'), state);
  // State is authoritative; mirrors are replaceable if a crash interrupts this write.
  await atomicJson(path.join(dir, 'handoff.json'), {version: 1, id: state.id, specHash: state.specHash, baseCommit: state.baseCommit, status: state.status, phase: state.phase, attempts: state.attempts, reservedCostUsd: state.reservedCostUsd, actualCostUsd: state.actualCostUsd, reason: state.reason, changedFiles: state.changedFiles, verification: state.verification, humanChecks: state.humanChecks, next: TERMINAL.has(state.status) ? 'human-review' : state.phase === 'verifying' ? 'verify-fixed-acceptance' : 'run-or-resume', publicationAllowed: false});
  const temp = path.join(dir, `events.${crypto.randomUUID()}.tmp`);
  await fs.writeFile(temp, state.events.map(event => JSON.stringify(event)).join('\n') + '\n', {mode: 0o600});
  await fs.rename(temp, path.join(dir, 'events.jsonl'));
}
export async function initialize({specPath, workspace, stateDir, approvedHash}) {
  const spec = validateSpec(await readJson(specPath));
  const hash = specHash(spec);
  if (approvedHash !== hash) fail('APPROVAL_HASH_REQUIRED');
  workspace = await fs.realpath(workspace);
  stateDir = path.resolve(stateDir);
  stateDir = path.join(await fs.realpath(path.dirname(stateDir)), path.basename(stateDir));
  if (stateDir === workspace || stateDir.startsWith(workspace + path.sep)) fail('STATE_MUST_BE_OUTSIDE_WORKSPACE');
  const baseCommit = await checkWorkspace(workspace);
  for (const file of spec.inputs) if (!(await git(workspace, ['ls-files', '--error-unmatch', '--', file]))) fail('UNTRACKED_INPUT');
  const inputHashes = await fingerprints(workspace, spec.inputs);
  await fs.mkdir(stateDir, {mode: 0o700});
  await atomicJson(path.join(stateDir, 'sealed-spec.json'), spec);
  const state = {version: 1, id: spec.id, specPath: path.resolve(specPath), specHash: hash, workspace, baseCommit, inputHashes, status: 'ready', phase: 'implementing', attempts: 0, reservedCostUsd: 0, actualCostUsd: null, startedAt: null, deadline: null, attempt: null, activeRuntime: [], reason: null, failures: [], changedFiles: [], verification: [], humanChecks: spec.humanChecks, events: []};
  await checkpoint(stateDir, state, 'initialized');
  return summary(state);
}
export const summary = state => ({id: state.id, status: state.status, phase: state.phase, attempts: state.attempts, reservedCostUsd: state.reservedCostUsd, actualCostUsd: state.actualCostUsd, reason: state.reason, verification: state.verification, humanChecks: state.humanChecks, publicationAllowed: false});
export async function status(stateDir) { return summary(await readJson(path.join(stateDir, 'state.json'))); }
export async function control(stateDir, action) {
  if (!['pause', 'resume', 'kill'].includes(action)) fail('INVALID_CONTROL');
  const dir = path.resolve(stateDir);
  await readJson(path.join(dir, 'state.json'));
  const existing = await readControl(dir);
  if (existing === 'kill' && action !== 'kill') fail('KILL_IS_TERMINAL');
  await atomicJson(path.join(dir, 'control.json'), {action, at: new Date().toISOString()});
  return {action};
}
async function readControl(dir) {
  try { const value = await readJson(path.join(dir, 'control.json')); if (!['pause', 'resume', 'kill'].includes(value.action)) fail('CONTROL_READ_FAILED'); return value.action; }
  catch (error) { if (error.code === 'ENOENT') return null; fail('CONTROL_READ_FAILED'); }
}
async function acquireLock(dir, leaseMs) {
  const lock = path.join(dir, 'lease');
  const owner = {token: crypto.randomUUID(), pid: process.pid, expiresAt: Date.now() + leaseMs};
  for (let trial = 0; trial < 3; trial++) {
    try { await fs.mkdir(lock, {mode: 0o700}); await atomicJson(path.join(lock, 'owner.json'), owner); break; }
    catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const previous = await readJson(path.join(lock, 'owner.json')).catch(() => null);
      const stat = await fs.stat(lock).catch(() => null);
      let alive = false;
      if (previous?.pid) { try { process.kill(previous.pid, 0); alive = true; } catch (e) { alive = e.code !== 'ESRCH'; } }
      if (alive || (previous?.expiresAt ?? (stat?.mtimeMs ?? Date.now()) + leaseMs) >= Date.now()) fail('BUSY');
      const reaper = path.join(dir, 'lease-reclaim');
      try { await fs.mkdir(reaper, {mode: 0o700}); } catch { fail('BUSY'); }
      try {
        const current = await readJson(path.join(lock, 'owner.json')).catch(() => null);
        if (current?.token !== previous?.token) fail('BUSY');
        const stale = `${lock}.stale.${crypto.randomUUID()}`;
        await fs.rename(lock, stale); await fs.rm(stale, {recursive: true, force: true});
      } finally { await fs.rm(reaper, {recursive: true, force: true}); }
      if (trial === 2) fail('BUSY');
    }
  }
  let refreshing = false;
  const timer = setInterval(async () => {
    if (refreshing) return;
    refreshing = true;
    try {
      if ((await readJson(path.join(lock, 'owner.json'))).token === owner.token) { owner.expiresAt = Date.now() + leaseMs; await atomicJson(path.join(lock, 'owner.json'), owner); }
    } catch { /* The next controlled boundary verifies ownership. */ }
    finally { refreshing = false; }
  }, Math.max(50, Math.floor(leaseMs / 3)));
  timer.unref();
  return {
    assert: async () => { if ((await readJson(path.join(lock, 'owner.json'))).token !== owner.token) fail('LOCK_LOST'); },
    release: async () => { clearInterval(timer); while (refreshing) await new Promise(r => setTimeout(r, 5)); if ((await readJson(path.join(lock, 'owner.json')).catch(() => null))?.token === owner.token) await fs.rm(lock, {recursive: true, force: true}); }
  };
}
async function verifyInputs(dir, state, spec) {
  if (specHash(spec) !== state.specHash || specHash(await readJson(state.specPath)) !== state.specHash) fail('SPEC_CHANGED');
  if (await checkWorkspace(state.workspace) !== state.baseCommit) fail('COMMIT_CHANGED');
  if (JSON.stringify(await fingerprints(state.workspace, spec.inputs)) !== JSON.stringify(state.inputHashes)) fail('INPUTS_CHANGED');
}
async function scan(root, prefix = '') {
  const result = Object.create(null);
  for (const entry of await fs.readdir(path.join(root, prefix), {withFileTypes: true})) {
    const file = prefix ? `${prefix}/${entry.name}` : entry.name;
    relativeFile(file);
    if (entry.isSymbolicLink()) fail('SYMLINK_REJECTED');
    if (entry.isDirectory()) Object.assign(result, await scan(root, file));
    else if (entry.isFile()) { const content = await checkedFile(root, file); if (!safeText(content.toString('utf8'))) fail('UNSAFE_CONTENT'); result[file] = digest(content); }
    else fail('UNSAFE_OUTPUT');
  }
  return Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
}
async function prepareStage(dir, state, spec) {
  const stage = path.join(dir, 'attempts', String(state.attempts).padStart(3, '0'), 'workspace');
  await fs.mkdir(stage, {recursive: true, mode: 0o700});
  for (const file of spec.inputs) {
    const content = await checkedFile(state.workspace, file);
    await fs.mkdir(path.dirname(path.join(stage, file)), {recursive: true});
    await fs.writeFile(path.join(stage, file), content, {mode: 0o600});
  }
  return stage;
}
async function acceptance(stage, spec, baseline, options) {
  const manifest = await scan(stage);
  const changedFiles = [...new Set([...Object.keys(baseline), ...Object.keys(manifest)])].filter(file => manifest[file] !== baseline[file]);
  if (changedFiles.some(file => !spec.allowedFiles.includes(file))) fail('FORBIDDEN_FILE_CHANGED');
  const checks = [];
  for (const check of spec.acceptance) {
    if (['nocturne-product','nocturne-container'].includes(check.type)) {
      const profile = await loadProductProfile(options.productProfile, check.sha256);
      if (profile.kind !== (check.type === 'nocturne-container' ? 'nocturne-container-v1' : 'nocturne-css-v1')) fail('PRODUCT_SANDBOX_REQUIRED');
      await validateProductCandidate(stage, baseline, spec.allowedFiles, profile);
      const outputDir = path.join(path.dirname(stage), `product-${check.id}`);
      await fs.mkdir(outputDir, {recursive: true, mode: 0o700});
      const candidateSha256 = digest(JSON.stringify(manifest));
      if (check.type === 'nocturne-container') {
        const report = await runContainerGate({profilePath: options.productProfile, profileSha256: check.sha256, candidateSha256, stage, baseline, allowedFiles: spec.allowedFiles, outputDir}, {...options, runProcess, register: options.register});
        const evidence = path.join(outputDir, 'verification.json'); await atomicJson(evidence, report);
        checks.push({id: check.id, passed: report.passed, failedChecks: report.checks.filter(c => !c.passed).map(c => c.id), evidence, evidenceSha256: digest(JSON.stringify(report))});
        continue;
      }
      const result = await runProcess(process.execPath, [path.join(ROOT, 'product-worker.mjs')], {
        cwd: ROOT, timeoutMs: Math.max(1, options.deadline - Date.now()), shouldStop: options.shouldStop,
        // No API keys, provider login, production DB bindings, or user's HOME are inherited.
        env: {PLAYWRIGHT_BROWSERS_PATH: profile.browserCache},
        input: JSON.stringify({profilePath: options.productProfile, profileSha256: check.sha256, candidateSha256, stage, baseline, allowedFiles: spec.allowedFiles, outputDir})
      });
      if (result.stopReason) fail(result.stopReason);
      let report; try { report = JSON.parse(result.output); } catch { fail('PRODUCT_REPORT_INVALID'); }
      if (report.version !== 1 || report.profileSha256 !== check.sha256 || report.candidateSha256 !== candidateSha256 || typeof report.passed !== 'boolean' || !Array.isArray(report.checks) || !report.checks.length || report.passed !== report.checks.every(c => c.passed === true)) fail('PRODUCT_REPORT_INVALID');
      if (digest(JSON.stringify(await scan(stage))) !== candidateSha256) fail('CANDIDATE_CHANGED');
      await loadProductProfile(options.productProfile, check.sha256);
      const evidence = path.join(outputDir, 'verification.json'); await atomicJson(evidence, report);
      checks.push({id: check.id, passed: result.code === 0 && report.passed, evidence, evidenceSha256: digest(JSON.stringify(report))});
      continue;
    }
    const content = await checkedFile(stage, check.path, {optional: true});
    let passed = false;
    if (content !== null && check.type === 'node-syntax') {
      const result = await runProcess(process.execPath, ['--max-old-space-size=128', '--check', path.join(stage, check.path)], {cwd: stage, timeoutMs: Math.max(1, Math.min(3000, options.deadline - Date.now())), shouldStop: options.shouldStop});
      if (result.stopReason) fail(result.stopReason);
      passed = result.code === 0;
    } else if (content !== null) passed = check.type === 'sha256' ? digest(content) === check.sha256 : check.type === 'contains' ? content.toString('utf8').includes(check.text) : !content.toString('utf8').includes(check.text);
    checks.push({id: check.id, passed});
  }
  return {manifest, changedFiles, checks};
}
export async function runProcess(command, args, {cwd, input, timeoutMs, shouldStop, env = {}, onSpawn} = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {cwd, env: {PATH: process.env.PATH, ...env}, detached: process.platform !== 'win32', stdio: ['pipe', 'pipe', 'pipe']});
    let output = '', bytes = 0, stopReason = null, ended = false, checking = false;
    const kill = reason => {
      if (stopReason) return;
      stopReason = reason;
      try { if (process.platform === 'win32') child.kill('SIGKILL'); else process.kill(-child.pid, 'SIGKILL'); } catch { /* Already exited. */ }
    };
    const timer = setTimeout(() => kill('ATTEMPT_TIMEOUT'), timeoutMs);
    const poll = setInterval(async () => { if (checking || ended) return; checking = true; try { const reason = await shouldStop?.(); if (reason) kill(reason); } catch { kill('CONTROL_READ_FAILED'); } finally { checking = false; } }, 30);
    const consume = (chunk, save) => { bytes += chunk.length; if (bytes > 1000000) kill('OUTPUT_LIMIT'); else if (save) output += chunk.toString('utf8'); };
    child.stdout.on('data', chunk => consume(chunk, true));
    child.stderr.on('data', chunk => consume(chunk, false)); // Raw output is never persisted or printed.
    child.stdin.on('error', () => {});
    child.on('error', () => { ended = true; clearTimeout(timer); clearInterval(poll); reject(new EngineError('SUBPROCESS_UNAVAILABLE')); });
    child.on('close', code => { ended = true; clearTimeout(timer); clearInterval(poll); resolve({code, output, stopReason}); });
    onSpawn?.(child.pid);
    child.stdin.end(input);
  });
}
async function fixture(spec, state, stage, options) {
  const step = spec.adapter.steps[Math.min(state.attempts - 1, spec.adapter.steps.length - 1)];
  return runProcess(process.execPath, [path.join(ROOT, 'fixture-worker.mjs')], {...options, cwd: stage, input: JSON.stringify(step)});
}
async function cleanupRuntime(state) {
  if (!state.activeRuntime.length) return;
  // Only names generated by this controller can be removed; never read names from agent output.
  for (const name of state.activeRuntime) {
    if (!/^improvement-[a-f0-9]{24}-(?:agent|proxy|net)$/.test(name)) fail('RUNTIME_STATE_INVALID');
    const args = name.endsWith('-net') ? ['network', 'rm', name] : ['rm', '-f', name];
    await exec('docker', args, {timeout: 10000, env: {PATH: process.env.PATH}, maxBuffer: 10000}).catch(() => {});
    const inspect = name.endsWith('-net') ? ['network', 'inspect', name] : ['inspect', name];
    try { await exec('docker', inspect, {timeout: 10000, env: {PATH: process.env.PATH}, maxBuffer: 10000}); fail('RUNTIME_CLEANUP_FAILED'); }
    catch (error) { if (error instanceof EngineError || !/No such (?:object|network|container)|network .* not found/i.test(error.stderr ?? '')) fail('RUNTIME_CLEANUP_FAILED'); }
  }
  state.activeRuntime = [];
}
export async function run(stateDir, {allowPaid = false, allowExternal = false, oneStep = false, leaseMs = 5000, productProfile} = {}) {
  const dir = await fs.realpath(stateDir);
  const lock = await acquireLock(dir, leaseMs);
  let state, spec, workspaceLock, signaled = false;
  const signal = () => { signaled = true; };
  process.on('SIGTERM', signal); process.on('SIGINT', signal);
  try {
    state = await readJson(path.join(dir, 'state.json'));
    const registry = path.join(process.platform === 'win32' ? os.tmpdir() : '/tmp', `nocturne-improvement-leases-${process.getuid?.() ?? 'user'}`, digest(state.workspace));
    await fs.mkdir(registry, {recursive: true, mode: 0o700});
    workspaceLock = await acquireLock(registry, leaseMs);
    spec = validateSpec(await readJson(path.join(dir, 'sealed-spec.json')));
    await verifyInputs(dir, state, spec);
    if (state.productRuntime) { await cleanupContainerRuntime(state.productRuntime); state.productRuntime = null; await checkpoint(dir, state, 'verification-runtime-recovered'); }
    for (const check of state.verification.filter(c => c.evidence && c.passed)) {
      try {
        const report = await readJson(check.evidence);
        if (digest(JSON.stringify(report)) !== check.evidenceSha256) fail('PRODUCT_EVIDENCE_CHANGED');
        for (const artifact of report.artifacts || []) {
          if (!/^[a-z0-9-]+\.png$/.test(artifact.file) || digest(await fs.readFile(path.join(path.dirname(check.evidence), artifact.file))) !== artifact.sha256) fail('PRODUCT_EVIDENCE_CHANGED');
        }
      } catch { fail('PRODUCT_EVIDENCE_CHANGED'); }
    }
    if (state.candidate && ['candidate','awaiting_human'].includes(state.status)) {
      if (digest(JSON.stringify(await scan(state.candidate.stage))) !== digest(JSON.stringify(state.candidate.manifest))) fail('CANDIDATE_CHANGED');
      for (const check of spec.acceptance.filter(c => ['nocturne-product','nocturne-container'].includes(c.type))) await loadProductProfile(productProfile, check.sha256);
    }
    if (TERMINAL.has(state.status)) return summary(state);
    if (!state.startedAt) { state.startedAt = Date.now(); state.deadline = state.startedAt + spec.budget.maxWallTimeMs; }
    const stop = async () => {
      await lock.assert(); await workspaceLock.assert();
      const command = await readControl(dir);
      return command === 'kill' ? 'KILLED' : signaled || command === 'pause' ? 'PAUSED' : Date.now() >= state.deadline ? 'WALL_TIME_LIMIT' : null;
    };
    if (state.attempt && state.phase === 'implementing') {
      await cleanupRuntime(state);
      state.failures.push('INTERRUPTED'); state.attempt = null;
      await checkpoint(dir, state, 'interrupted-attempt', 'INTERRUPTED');
    }
    while (true) {
      let reason = await stop();
      if (reason) { state.status = reason === 'KILLED' ? 'killed' : reason === 'PAUSED' ? 'paused' : 'stopped'; state.reason = reason; await checkpoint(dir, state, 'stopped', reason); return summary(state); }
      await verifyInputs(dir, state, spec);
      if (state.phase === 'implementing') {
        if (state.attempts >= spec.budget.maxAttempts) fail('ATTEMPT_LIMIT');
        let cost;
        if (spec.adapter.kind === 'claude-docker') {
          await claudePreflight(spec, {allowPaid, allowExternal, timeoutMs: state.deadline - Date.now()});
          const stoppedAfterPreflight = await stop(); if (stoppedAfterPreflight) fail(stoppedAfterPreflight);
          cost = spec.budget.maxCostUsd / spec.budget.maxAttempts;
        } else cost = spec.adapter.steps[Math.min(state.attempts, spec.adapter.steps.length - 1)].costUsd || 0;
        if (cost > 0 && spec.budget.maxCostUsd === undefined) fail('COST_BUDGET_REQUIRED');
        if (state.reservedCostUsd + cost > (spec.budget.maxCostUsd ?? 0) + 1e-9) fail('COST_LIMIT');
        state.attempts++; state.reservedCostUsd += cost; state.status = 'running'; state.reason = null;
        const stage = await prepareStage(dir, state, spec);
        state.attempt = {number: state.attempts, stage, baseline: await scan(stage), reservedCostUsd: cost, manifestHash: null};
        if (spec.adapter.kind === 'claude-docker') {
          const runtime = `improvement-${crypto.randomBytes(12).toString('hex')}`;
          state.activeRuntime = [`${runtime}-agent`, `${runtime}-proxy`, `${runtime}-net`];
        }
        await checkpoint(dir, state, 'attempt-started');
        const options = {timeoutMs: Math.min(spec.budget.maxAttemptMs, state.deadline - Date.now()), shouldStop: stop};
        let result;
        try {
          result = spec.adapter.kind === 'fixture' ? await fixture(spec, state, stage, options) : await runClaude(spec, state, stage, {...options, runProcess});
        } finally { await cleanupRuntime(state); }
        if (result.stopReason) fail(result.stopReason);
        if (result.code === 124) fail('ATTEMPT_TIMEOUT');
        if (result.code !== 0) {
          state.verification = [{id: 'implementation-exit', passed: false}];
          state.failures.push('IMPLEMENTATION_EXIT');
          state.attempt = null;
          if (state.failures.at(-2) === state.failures.at(-1)) fail('REPEATED_FAILURE');
          await checkpoint(dir, state, 'attempt-failed', 'IMPLEMENTATION_EXIT');
          continue;
        }
        // A model's success/result text has no authority. Only the controller's checks below count.
        state.attempt.manifestHash = digest(JSON.stringify(await scan(stage)));
        state.phase = 'verifying';
        await checkpoint(dir, state, 'implementation-finished');
        if (oneStep) { state.status = 'paused'; await checkpoint(dir, state, 'checkpoint'); return summary(state); }
      }
      if (state.phase === 'verifying') {
        if (!state.attempt || digest(JSON.stringify(await scan(state.attempt.stage))) !== state.attempt.manifestHash) fail('CANDIDATE_CHANGED');
        const result = await acceptance(state.attempt.stage, spec, state.attempt.baseline, {deadline: state.deadline, shouldStop: stop, productProfile, register: async value => { state.productRuntime = value; await checkpoint(dir, state, value ? 'verification-runtime-started' : 'verification-runtime-cleared'); }});
        state.verification = result.checks; state.changedFiles = result.changedFiles;
        if (result.checks.every(check => check.passed)) {
          state.status = spec.humanChecks.length ? 'awaiting_human' : 'candidate';
          state.reason = spec.humanChecks.length ? 'HUMAN_ACCEPTANCE_REQUIRED' : null;
          state.candidate = {baseCommit: state.baseCommit, specHash: state.specHash, inputHashes: state.inputHashes, manifest: result.manifest, stage: state.attempt.stage};
          await atomicJson(path.join(dir, 'candidate.json'), state.candidate);
          await checkpoint(dir, state, 'verified');
          return summary(state);
        }
        const failure = digest(JSON.stringify(result.checks.filter(check => !check.passed).map(check => [check.id, ...(check.failedChecks || []).slice().sort()]).sort()));
        state.failures.push(failure); state.phase = 'implementing'; state.attempt = null;
        await checkpoint(dir, state, 'acceptance-failed');
        if (state.failures.at(-2) === failure) fail('REPEATED_FAILURE');
      }
    }
  } catch (error) {
    let reason = error instanceof EngineError || /^[A-Z_]{3,64}$/.test(error.code ?? '') ? error.code : 'CONTROLLER_ERROR';
    if (reason === 'BUSY') throw new EngineError(reason);
    if (state) {
      state.status = reason === 'KILLED' ? 'killed' : reason === 'PAUSED' ? 'paused' : 'stopped'; state.reason = reason;
      try { await cleanupRuntime(state); if (state.productRuntime) { await cleanupContainerRuntime(state.productRuntime); state.productRuntime = null; } } catch { reason = 'RUNTIME_CLEANUP_FAILED'; state.reason = reason; }
      await checkpoint(dir, state, 'stopped', reason);
      return summary(state);
    }
    throw new EngineError(reason);
  } finally {
    process.off('SIGTERM', signal); process.off('SIGINT', signal);
    if (workspaceLock) await workspaceLock.release();
    await lock.release();
  }
}
