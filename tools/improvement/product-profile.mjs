import {promises as fs} from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {validateRuntime} from './container-runtime.mjs';

export const PRODUCT_PATCHES = ['src/app.css'];
export const containerPatchAllowed = file => typeof file === 'string' && /^src\/[a-z][a-z0-9-]*\.(?:html|mjs|js|cjs|css)$/.test(file);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DIRECTORIES = ['src', 'tests', 'tools', 'scripts', 'config', 'migrations'];
const FILES = ['package.json', 'package-lock.json', 'wrangler.jsonc', 'THIRD_PARTY_NOTICES.md'];
const FORBIDDEN = /(^|\/)(?:\.git|\.wrangler|\.claude|\.codex|node_modules|sources|data|backups?|private|secrets?|credentials[^/]*)(?:\/|$)|(^|\/)(?:\.env[^/]*|\.dev\.vars[^/]*|[^/]*\.(?:pem|key|sqlite|sqlite3|db))$/i;
export const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const safePath = file => typeof file === 'string' && !path.isAbsolute(file) && !file.includes('\\') && file.split('/').every(p => p && p !== '.' && p !== '..');
function fail(code) { const error = Error(code); error.code = code; throw error; }
export async function treeManifest(root, prefix = '') {
  const directory = await fs.lstat(path.join(root, prefix));
  if (!directory.isDirectory() || directory.isSymbolicLink()) fail('PRODUCT_UNSAFE_SNAPSHOT');
  const manifest = {};
  for (const item of (await fs.readdir(path.join(root, prefix), {withFileTypes: true})).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = prefix ? `${prefix}/${item.name}` : item.name;
    if (!safePath(file) || FORBIDDEN.test(file) || item.isSymbolicLink()) fail('PRODUCT_UNSAFE_SNAPSHOT');
    if (item.isDirectory()) Object.assign(manifest, await treeManifest(root, file));
    else if (item.isFile()) {
      if ((await fs.stat(path.join(root, file))).size > 2e6) fail('PRODUCT_UNSAFE_SNAPSHOT');
      manifest[file] = sha256(await fs.readFile(path.join(root, file)));
    } else fail('PRODUCT_UNSAFE_SNAPSHOT');
  }
  return manifest;
}
export async function prepareProductProfile({outputDir, playwrightModule, browserExecutable, containerRuntime, sourceRoot = ROOT}) {
  sourceRoot = await fs.realpath(sourceRoot);
  outputDir = path.resolve(outputDir);
  if (outputDir === sourceRoot || outputDir.startsWith(sourceRoot + path.sep)) fail('PRODUCT_OUTPUT_MUST_BE_EXTERNAL');
  let dependencies, pw, runtime;
  if (containerRuntime) {
    runtime = validateRuntime(JSON.parse(await fs.readFile(containerRuntime, 'utf8')));
    if (sha256(await fs.readFile(path.join(sourceRoot, 'package-lock.json'))) !== runtime.lockSha256 || sha256(await fs.readFile(runtime.seccompPath)) !== runtime.seccompSha256) fail('PRODUCT_RUNTIME_CHANGED');
  } else {
    dependencies = await fs.realpath(path.join(sourceRoot, 'node_modules'));
    playwrightModule = await fs.realpath(playwrightModule);
    pw = JSON.parse(await fs.readFile(path.join(playwrightModule, 'package.json'), 'utf8'));
    if (pw.name !== 'playwright') fail('PRODUCT_PLAYWRIGHT_REQUIRED');
    browserExecutable = await fs.realpath(browserExecutable || process.env.KUSEIRO_CHROMIUM_EXECUTABLE || process.env.NOCTURNE_CHROMIUM_EXECUTABLE || '');
    if (!(await fs.stat(browserExecutable)).isFile()) fail('PRODUCT_BROWSER_REQUIRED');
  }
  // Explicitly snapshot reviewed code. Never copy HOME, credentials, production state, or the Git directory.
  await fs.mkdir(outputDir, {mode: 0o700});
  const baseline = path.join(outputDir, 'baseline');
  await fs.mkdir(baseline, {mode: 0o700});
  for (const directory of DIRECTORIES) {
    await treeManifest(path.join(sourceRoot, directory)); // Refuse symlinks before copying.
    await fs.cp(path.join(sourceRoot, directory), path.join(baseline, directory), {recursive: true, errorOnExist: true, force: false});
  }
  for (const file of FILES) {
    if (!(await fs.lstat(path.join(sourceRoot, file))).isFile()) fail('PRODUCT_UNSAFE_SNAPSHOT');
    await fs.copyFile(path.join(sourceRoot, file), path.join(baseline, file));
  }
  const manifest = await treeManifest(baseline);
  const monetization = JSON.parse(await fs.readFile(path.join(baseline, 'config/monetization.json'), 'utf8'));
  if (monetization.enabled || monetization.campaigns.some(c => c.enabled || c.creativeApproved)) fail('PRODUCT_ADS_MUST_STAY_OFF');
  const browserCache = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(os.homedir(), process.platform === 'darwin' ? 'Library/Caches/ms-playwright' : '.cache/ms-playwright');
  const profile = runtime ? {version: 1, kind: 'nocturne-container-v1', baseline, manifest, runtime} : {version: 1, kind: 'nocturne-css-v1', baseline, manifest, dependencies, playwrightModule, playwrightVersion: pw.version, browserCache, browserExecutable};
  const bytes = JSON.stringify(profile, null, 2) + '\n';
  const profilePath = path.join(outputDir, 'profile.json');
  await fs.writeFile(profilePath, bytes, {mode: 0o600, flag: 'wx'});
  return {profilePath, sha256: sha256(bytes), files: Object.keys(manifest).length, publicationAllowed: false};
}
export async function loadProductProfile(profilePath, expectedHash) {
  if (!profilePath || !/^[a-f0-9]{64}$/.test(expectedHash)) fail('PRODUCT_PROFILE_REQUIRED');
  const bytes = await fs.readFile(profilePath);
  if (sha256(bytes) !== expectedHash) fail('PRODUCT_PROFILE_CHANGED');
  const profile = JSON.parse(bytes);
  if (profile.version !== 1 || !['nocturne-css-v1', 'nocturne-container-v1'].includes(profile.kind) || !path.isAbsolute(profile.baseline)) fail('PRODUCT_PROFILE_INVALID');
  if (JSON.stringify(await treeManifest(profile.baseline)) !== JSON.stringify(profile.manifest)) fail('PRODUCT_BASELINE_CHANGED');
  if (profile.kind === 'nocturne-container-v1') {
    validateRuntime(profile.runtime);
    if (profile.manifest['package-lock.json'] !== profile.runtime.lockSha256 || sha256(await fs.readFile(profile.runtime.seccompPath)) !== profile.runtime.seccompSha256) fail('PRODUCT_RUNTIME_CHANGED');
  } else {
    if (!path.isAbsolute(profile.dependencies) || !path.isAbsolute(profile.playwrightModule)) fail('PRODUCT_PROFILE_INVALID');
    const pw = JSON.parse(await fs.readFile(path.join(profile.playwrightModule, 'package.json'), 'utf8'));
    if (pw.name !== 'playwright' || pw.version !== profile.playwrightVersion) fail('PRODUCT_RUNTIME_CHANGED');
  }
  return profile;
}
export async function validateProductCandidate(stage, baseline, allowedFiles, profile) {
  const allowed = file => profile.kind === 'nocturne-container-v1' ? containerPatchAllowed(file) : PRODUCT_PATCHES.includes(file);
  if (allowedFiles.some(file => !allowed(file))) fail('PRODUCT_EXECUTABLE_PATCH_REQUIRES_SANDBOX');
  const actual = await treeManifest(stage);
  for (const [file, hash] of Object.entries(baseline)) if (profile.manifest[file] !== hash) fail('PRODUCT_INPUT_BASELINE_MISMATCH');
  for (const file of new Set([...Object.keys(baseline), ...Object.keys(actual)])) {
    if (actual[file] !== baseline[file] && (!allowed(file) || !allowedFiles.includes(file))) fail('PRODUCT_FORBIDDEN_PATCH');
    if (!Object.hasOwn(baseline, file) || !Object.hasOwn(actual, file)) fail('PRODUCT_FORBIDDEN_PATCH');
  }
  return actual;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length === 4 && args[0] === '--output' && args[2] === '--runtime') console.log(JSON.stringify(await prepareProductProfile({outputDir: args[1], containerRuntime: args[3]}), null, 2));
    else {
      if (args.length !== 6 || args[0] !== '--output' || args[2] !== '--playwright-module' || args[4] !== '--browser') fail('INVALID_ARGUMENT');
      console.log(JSON.stringify(await prepareProductProfile({outputDir: args[1], playwrightModule: args[3], browserExecutable: args[5]}), null, 2));
    }
  } catch (error) { console.error(JSON.stringify({error: /^[A-Z_]+$/.test(error.code) ? error.code : 'PRODUCT_PREPARE_FAILED'})); process.exitCode = 2; }
}
