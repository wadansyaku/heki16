import {promises as fs} from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {loadProductProfile, validateProductCandidate, treeManifest, sha256} from './product-profile.mjs';
import {docker, bind, containerArgs, cleanupContainerRuntime, inspectIsolation} from './container-runtime.mjs';
const fail = code => { const e = Error(code); e.code = code; throw e; };
const DIRS = ['src','tests','tools','scripts','config','migrations'];
const FILES = ['package.json','package-lock.json','wrangler.jsonc','THIRD_PARTY_NOTICES.md'];
export async function runContainerGate(job, {runProcess, shouldStop, deadline, register = async () => {}}) {
  const profile = await loadProductProfile(job.profilePath, job.profileSha256);
  if (profile.kind !== 'nocturne-container-v1') fail('PRODUCT_SANDBOX_REQUIRED');
  const manifest = await validateProductCandidate(job.stage, job.baseline, job.allowedFiles, profile);
  if (sha256(JSON.stringify(manifest)) !== job.candidateSha256) fail('PRODUCT_CANDIDATE_CHANGED');
  const runtime = profile.runtime, prefix = `improvement-${crypto.randomBytes(12).toString('hex')}`;
  const names = Object.fromEntries(['audit','tests','app','browser'].map(role => [role, `${prefix}-${role}`]));
  const record = {runtime, names: Object.values(names), owner: job.profileSha256};
  const report = {version: 1, profileSha256: job.profileSha256, candidateSha256: job.candidateSha256, passed: false, checks: [], screenshots: [], artifacts: [], isolation: null};
  const user = `${process.getuid()}:${process.getgid()}`;
  if (process.getuid() === 0) fail('NONROOT_OPERATOR_REQUIRED');
  const [image] = JSON.parse(await docker(runtime, ['image','inspect',runtime.image]));
  if (image.Id !== runtime.image || Object.keys(image.Config.Volumes || {}).length || (image.Config.Env || []).some(e => !/^(PATH|PLAYWRIGHT_BROWSERS_PATH)=/.test(e))) fail('CONTAINER_IMAGE_REJECTED');
  const mounts = [...bind(profile.baseline, '/trusted')];
  for (const dir of DIRS) mounts.push(...bind(path.join(profile.baseline, dir), '/project/' + dir));
  for (const file of FILES) mounts.push(...bind(path.join(profile.baseline, file), '/project/' + file));
  for (const file of job.allowedFiles) mounts.push(...bind(path.join(job.stage, file), '/project/' + file));
  const timeout = () => `${Math.max(1, Math.ceil((deadline - Date.now()) / 1000))}s`;
  const argsFor = (role, command, extra = []) => [
    ...containerArgs(runtime, {name: names[role], network: role === 'browser' ? `container:${names.app}` : 'none', user, role}),
    '--label', `nocturne.verification.owner=${job.profileSha256}`,
    ...(role === 'browser' ? bind(profile.baseline, '/trusted') : mounts), ...extra,
    '--entrypoint', '/usr/bin/timeout', runtime.image, '--kill-after=5s', timeout(), 'node', ...command
  ];
  const execute = async args => {
    const stop = await shouldStop?.(); if (stop) fail(stop);
    if (Date.now() >= deadline) fail('WALL_TIME_LIMIT');
    const r = await runProcess('docker', args, {timeoutMs: Math.max(1, deadline - Date.now()), shouldStop});
    if (r.stopReason) fail(r.stopReason);
    return r;
  };
  const parse = value => { try { const r = JSON.parse(value); if (!Array.isArray(r.checks) || !r.checks.length || typeof r.passed !== 'boolean' || r.passed !== r.checks.every(c => c.passed === true)) throw Error(); return r; } catch { fail('CONTAINER_REPORT_INVALID'); } };
  await register(record);
  try {
    const probe = await execute(argsFor('audit', ['/trusted/tools/improvement/container-probe.mjs']));
    const audit = parse(probe.output);
    report.checks.push({id: 'runtime-isolation', passed: probe.code === 0 && audit.passed}); report.isolation = {probes: audit.checks};
    report.isolation.settings = await inspectIsolation(runtime, names.audit, 'none');
    if (!audit.passed || probe.code !== 0) fail('CONTAINER_PROBE_FAILED');
    const tested = await execute(argsFor('tests', ['/trusted/tools/improvement/container-app.mjs','tests']));
    const tests = parse(tested.output); report.checks.push(...tests.checks);
    await inspectIsolation(runtime, names.tests, 'none');
    if (tested.code !== 0 || !tests.passed) fail('PRODUCT_REGRESSION_FAILED');
    const appArgs = argsFor('app', ['/trusted/tools/improvement/container-app.mjs','server']);
    appArgs.splice(appArgs.indexOf('run') + 1, 0, '-d');
    const app = await execute(appArgs); if (app.code !== 0) fail('CONTAINER_APP_UNAVAILABLE');
    await inspectIsolation(runtime, names.app, 'none');
    const browsed = await execute(argsFor('browser', ['/trusted/tools/improvement/container-browser.mjs'], bind(job.outputDir, '/artifacts', false)));
    const ui = parse(browsed.output); report.checks.push(...ui.checks); report.screenshots = ui.screenshots || [];
    const appInfo = JSON.parse(await docker(runtime, ['inspect',names.app]));
    await inspectIsolation(runtime, names.browser, 'container:' + appInfo[0].Id);
    if (browsed.code !== 0 || !ui.passed) fail('PRODUCT_UI_FAILED');
    if (sha256(JSON.stringify(await treeManifest(job.stage))) !== job.candidateSha256) fail('CANDIDATE_CHANGED');
    await loadProductProfile(job.profilePath, job.profileSha256);
    report.passed = true;
  } catch (e) {
    if (['PAUSED','KILLED','WALL_TIME_LIMIT','ATTEMPT_TIMEOUT','CONTROL_READ_FAILED'].includes(e.code)) throw e;
    report.reason = /^[A-Z_]{3,64}$/.test(e.code || '') ? e.code : 'CONTAINER_VERIFICATION_FAILED';
    if (report.checks.every(c => c.passed)) report.checks.push({id: 'container-runtime', passed: false});
  } finally { await cleanupContainerRuntime(record); await register(null); }
  for (const file of report.screenshots) {
    if (!/^[a-z0-9-]+\.png$/.test(file)) fail('PRODUCT_ARTIFACT_INVALID');
    const target = path.join(job.outputDir, file), stat = await fs.lstat(target);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 2e6) fail('PRODUCT_ARTIFACT_INVALID');
    const bytes = await fs.readFile(target);
    if (bytes.toString('hex', 0, 8) !== '89504e470d0a1a0a') fail('PRODUCT_ARTIFACT_INVALID');
    report.artifacts.push({file, sha256: sha256(bytes)});
  }
  return report;
}
