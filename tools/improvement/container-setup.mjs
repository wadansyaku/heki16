#!/usr/bin/env node
import {promises as fs} from 'node:fs';
import path from 'node:path';
import {spawn, execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {sha256} from './product-profile.mjs';
const exec = promisify(execFile), ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
try {
  const a = process.argv.slice(2);
  if (a.length !== 6 || a[0] !== '--output' || a[2] !== '--docker-host' || a[4] !== '--playwright-module' || !/^unix:\/[^,\r\n]+$/.test(a[3])) throw Error('INVALID_ARGUMENT');
  const out = path.resolve(a[1]), host = a[3], sdk = await fs.realpath(a[5]);
  const pw = JSON.parse(await fs.readFile(path.join(sdk, 'package.json'), 'utf8'));
  if (pw.name !== 'playwright' || !/^\d+\.\d+\.\d+$/.test(pw.version)) throw Error('PLAYWRIGHT_REQUIRED');
  const call = async args => (await exec('docker', ['--host', host, ...args], {maxBuffer: 1e6})).stdout.trim();
  const tag = `mcr.microsoft.com/playwright:v${pw.version}-noble`;
  const [base] = JSON.parse(await call(['image', 'inspect', tag]));
  const reference = base.RepoDigests.find(ref => ref.startsWith('mcr.microsoft.com/playwright@sha256:'));
  if (!reference) throw Error('OFFICIAL_LOCAL_IMAGE_REQUIRED');
  await fs.mkdir(out, {mode: 0o700}); const context = path.join(out, 'build'); await fs.mkdir(context);
  const pkg = JSON.parse(await fs.readFile(path.join(ROOT, 'package.json'), 'utf8')); pkg.scripts = {};
  await fs.writeFile(path.join(context, 'package.json'), JSON.stringify(pkg));
  const lock = await fs.readFile(path.join(ROOT, 'package-lock.json')); await fs.writeFile(path.join(context, 'package-lock.json'), lock);
  await fs.cp(sdk, path.join(context, 'sdk/playwright'), {recursive: true});
  await fs.cp(path.join(path.dirname(sdk), 'playwright-core'), path.join(context, 'sdk/playwright-core'), {recursive: true});
  const seccompResponse = await fetch(`https://raw.githubusercontent.com/microsoft/playwright/v${pw.version}/utils/docker/seccomp_profile.json`);
  if (!seccompResponse.ok) throw Error('SECCOMP_SOURCE_UNAVAILABLE');
  const sourceSeccomp = await seccompResponse.text(); const parsed = JSON.parse(sourceSeccomp);
  if (parsed.defaultAction !== 'SCMP_ACT_ERRNO' || !Array.isArray(parsed.syscalls)) throw Error('SECCOMP_PROFILE_INVALID');
  // Chromium chroots inside its own unprivileged user namespace. Do not grant a container capability.
  parsed.syscalls.unshift({names:['chroot'],action:'SCMP_ACT_ALLOW',args:[],includes:{},excludes:{}});
  const seccomp = JSON.stringify(parsed, null, 2) + '\n';
  const seccompPath = path.join(out, 'seccomp.json'); await fs.writeFile(seccompPath, seccomp, {mode: 0o600});
  const dockerfile = `FROM ${reference}\nWORKDIR /opt/nocturne\nCOPY package.json package-lock.json ./\nRUN npm ci --ignore-scripts --no-audit --no-fund && npm cache clean --force\nCOPY sdk/ /opt/runtime/node_modules/\nRUN mkdir -p /project/src /project/tests /project/tools /project/scripts /project/config /project/migrations /project/dist && touch /project/package.json /project/package-lock.json /project/wrangler.jsonc /project/THIRD_PARTY_NOTICES.md && ln -s /opt/nocturne/node_modules /project/node_modules && rm -rf /ms-playwright/firefox-* /ms-playwright/webkit-*\nENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright\nWORKDIR /project\n`;
  await fs.writeFile(path.join(context, 'Dockerfile'), dockerfile);
  const idFile = path.join(out, 'image-id');
  const build = spawn('docker', ['--host', host, 'build', '--pull=false', '--iidfile', idFile, context], {stdio: 'inherit'});
  const code = await new Promise(resolve => build.on('close', resolve)); if (code !== 0) throw Error('CONTAINER_BUILD_FAILED');
  const intermediate = (await fs.readFile(idFile, 'utf8')).trim();
  // Flatten our own intermediate image so unused browsers don't remain as retained base layers.
  const pack = `nocturne-runtime-pack-${Date.now()}`; await call(['create', '--name', pack, intermediate, '/bin/true']);
  let image;
  try {
    const exporter = spawn('docker', ['--host', host, 'export', pack], {stdio: ['ignore', 'pipe', 'pipe']});
    const importer = spawn('docker', ['--host', host, 'import', '--change', 'ENV PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin', '--change', 'ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright', '--change', 'WORKDIR /project', '-'], {stdio: ['pipe', 'pipe', 'pipe']});
    exporter.stdout.pipe(importer.stdin); exporter.stderr.resume(); importer.stderr.resume(); importer.stdin.on('error', () => {});
    let result = ''; importer.stdout.on('data', b => { result += b; });
    const [e, i] = await Promise.all([new Promise(r => exporter.on('close', r)), new Promise(r => importer.on('close', r))]);
    if (e !== 0 || i !== 0 || !/^sha256:[a-f0-9]{64}$/.test(result.trim())) throw Error('CONTAINER_PACK_FAILED'); image = result.trim();
  } finally { await call(['rm', '-f', pack]); }
  await call(['image', 'rm', intermediate]);
  const runtime = {version: 1, dockerHost: host, image, lockSha256: sha256(lock), playwrightVersion: pw.version, baseReference: reference, seccompPath, seccompSha256: sha256(seccomp), sourceSeccompSha256: sha256(sourceSeccomp)};
  const file = path.join(out, 'runtime.json'); await fs.writeFile(file, JSON.stringify(runtime, null, 2) + '\n', {mode: 0o600});
  await fs.rm(context, {recursive: true, force: true});
  console.log(JSON.stringify({runtimeFile: file, image, baseReference: reference, additionalPurchases: 0}));
} catch (e) { console.error(JSON.stringify({error: /^[A-Z_]+$/.test(e.code || e.message) ? e.code || e.message : 'CONTAINER_SETUP_FAILED'})); process.exitCode = 2; }
