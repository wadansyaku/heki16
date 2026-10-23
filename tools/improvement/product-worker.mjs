import {promises as fs} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {loadProductProfile, validateProductCandidate, treeManifest, sha256} from './product-profile.mjs';
import {verifyUiFlow} from '../../scripts/ui-flow.mjs';

let input = '';
for await (const chunk of process.stdin) input += chunk;
const job = JSON.parse(input);
let work, server, browser;
const report = {version: 1, profileSha256: job.profileSha256, candidateSha256: job.candidateSha256, passed: false, checks: [], screenshots: []};
const execute = (args, cwd, env, timeout = 120000) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, args, {cwd, env, stdio: ['ignore', 'pipe', 'pipe']});
  let bytes = 0;
  const timer = setTimeout(() => { child.kill('SIGKILL'); reject(Error('PRODUCT_COMMAND_TIMEOUT')); }, timeout);
  const consume = chunk => { bytes += chunk.length; if (bytes > 1e6) child.kill('SIGKILL'); };
  child.stdout.on('data', consume); child.stderr.on('data', consume);
  child.on('error', () => { clearTimeout(timer); reject(Error('PRODUCT_RUNTIME_UNAVAILABLE')); });
  child.on('close', code => { clearTimeout(timer); resolve(code === 0 && bytes <= 1e6); });
});
const freePort = () => new Promise((resolve, reject) => {
  const socket = net.createServer(); socket.on('error', reject);
  socket.listen(0, '127.0.0.1', () => { const port = socket.address().port; socket.close(() => resolve(port)); });
});
try {
  const profile = await loadProductProfile(job.profilePath, job.profileSha256);
  if (profile.kind !== 'nocturne-css-v1') throw Error('PRODUCT_SANDBOX_REQUIRED');
  const manifest = await validateProductCandidate(job.stage, job.baseline, job.allowedFiles, profile);
  if (sha256(JSON.stringify(manifest)) !== job.candidateSha256) throw Error('PRODUCT_CANDIDATE_CHANGED');
  work = await fs.mkdtemp(path.join(os.tmpdir(), 'nocturne-product-'));
  const root = path.join(work, 'repo'), home = path.join(work, 'home');
  await fs.cp(profile.baseline, root, {recursive: true});
  await fs.mkdir(home);
  await fs.symlink(profile.dependencies, path.join(root, 'node_modules'), 'dir');
  for (const file of job.allowedFiles) await fs.copyFile(path.join(job.stage, file), path.join(root, file));
  const monetization = JSON.parse(await fs.readFile(path.join(root, 'config/monetization.json'), 'utf8'));
  if (monetization.enabled || monetization.campaigns.some(c => c.enabled || c.creativeApproved)) throw Error('PRODUCT_ADS_MUST_STAY_OFF');
  const env = {PATH: process.env.PATH, HOME: home, TMPDIR: work, CI: 'true', WRANGLER_SEND_METRICS: 'false', NO_UPDATE_NOTIFIER: '1', XDG_CONFIG_HOME: home, XDG_CACHE_HOME: home};
  const testFiles = (await fs.readdir(path.join(root, 'tests'))).filter(f => f.endsWith('.test.mjs')).sort().map(f => 'tests/' + f);
  const commands = [
    ['build', ['scripts/prepare-deploy.cjs']],
    ['legacy-tests', ['tests/core.cjs', 'src/legacy.html']],
    ['node-tests', ['--test', ...testFiles]],
    ['monetization-tests', ['tests/monetization.cjs']],
    ['deployment-tests', ['tests/deployment.cjs']]
  ];
  for (const [id, args] of commands) {
    const passed = await execute(args, root, env); report.checks.push({id, passed});
    if (!passed) throw Error('PRODUCT_REGRESSION_FAILED');
  }
  const port = await freePort(), origin = `http://127.0.0.1:${port}`;
  const config = JSON.parse(await fs.readFile(path.join(root, 'wrangler.jsonc'), 'utf8'));
  config.name = 'nocturne-local-qa'; config.routes = []; config.triggers = {crons: []};
  config.main = path.join(root, config.main); config.assets.directory = path.join(root, config.assets.directory);
  config.vars = {...config.vars, SITE_ORIGIN: origin, LOCAL_TEST_MODE: 'true'};
  for (const db of config.d1_databases) { db.database_name = 'nocturne-local-qa'; db.database_id = '00000000-0000-0000-0000-000000000000'; db.migrations_dir = path.join(root, 'migrations'); }
  for (const bucket of config.r2_buckets) bucket.bucket_name = 'nocturne-local-qa';
  const configPath = path.join(work, 'wrangler.json'), persist = path.join(work, 'state');
  await fs.writeFile(configPath, JSON.stringify(config), {mode: 0o600});
  const wrangler = path.join(root, 'node_modules/wrangler/bin/wrangler.js');
  const migrated = await execute([wrangler, 'd1', 'migrations', 'apply', 'DB', '--local', '--config', configPath, '--persist-to', persist], root, env);
  report.checks.push({id: 'local-migrations', passed: migrated}); if (!migrated) throw Error('PRODUCT_LOCAL_DATABASE_FAILED');
  server = spawn(process.execPath, [wrangler, 'dev', '--local', '--config', configPath, '--ip', '127.0.0.1', '--port', String(port), '--persist-to', persist], {cwd: root, env, stdio: 'ignore'});
  let serverError = false; server.on('error', () => { serverError = true; });
  const until = Date.now() + 30000;
  let ready = false;
  while (Date.now() < until && server.exitCode === null && !serverError) {
    try { const r = await fetch(origin + '/api/config', {signal: AbortSignal.timeout(1000)}); const value = await r.json(); if (r.ok && value.localTest === true) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  if (!ready) throw Error('PRODUCT_LOCAL_SERVER_UNAVAILABLE');
  const {chromium} = await import(pathToFileURL(path.join(profile.playwrightModule, 'index.mjs')).href);
  browser = await chromium.launch({executablePath: profile.browserExecutable, headless: true, chromiumSandbox: true, env, args: ['--disable-background-networking']});
  const ui = await verifyUiFlow({browser, origin, outputDir: job.outputDir});
  report.checks.push(...ui.checks); report.screenshots = ui.screenshots;
  if (!ui.passed) throw Error('PRODUCT_UI_FAILED');
  if (JSON.stringify(await treeManifest(job.stage)) !== JSON.stringify(manifest)) throw Error('PRODUCT_CANDIDATE_CHANGED');
  await loadProductProfile(job.profilePath, job.profileSha256);
  report.passed = true;
} catch (error) {
  report.reason = /^PRODUCT_[A-Z_]+$/.test(error.code || error.message) ? error.code || error.message : 'PRODUCT_CHECK_FAILED';
  if (report.checks.every(check => check.passed)) report.checks.push({id: 'product-runtime', passed: false});
} finally {
  await browser?.close().catch(() => {});
  if (server && server.exitCode === null) {
    server.kill('SIGTERM');
    await Promise.race([new Promise(resolve => server.once('close', resolve)), new Promise(resolve => setTimeout(resolve, 3000))]);
    if (server.exitCode === null) server.kill('SIGKILL');
  }
  if (work) await fs.rm(work, {recursive: true, force: true});
}
report.artifacts = [];
for (const file of report.screenshots) report.artifacts.push({file, sha256: sha256(await fs.readFile(path.join(job.outputDir, file)))});
process.stdout.write(JSON.stringify(report));
