import test from 'node:test';
import assert from 'node:assert/strict';
import {promises as fs} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {treeManifest, sha256, loadProductProfile, validateProductCandidate} from '../tools/improvement/product-profile.mjs';
import {validateSpec} from '../tools/improvement/engine.mjs';
import {containerArgs, validateRuntime, cleanupContainerRuntime} from '../tools/improvement/container-runtime.mjs';

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'product-policy-'));
  t.after(() => fs.rm(root, {recursive: true, force: true}));
  const baseline = path.join(root, 'baseline'), stage = path.join(root, 'stage'), pw = path.join(root, 'playwright');
  for (const folder of [baseline, stage]) { await fs.mkdir(path.join(folder, 'src'), {recursive: true}); await fs.writeFile(path.join(folder, 'src/app.css'), 'body { color: black }'); }
  await fs.mkdir(pw); await fs.writeFile(path.join(pw, 'package.json'), JSON.stringify({name: 'playwright', version: 'fixture'}));
  const manifest = await treeManifest(baseline), profilePath = path.join(root, 'profile.json');
  const profile = {version: 1, kind: 'nocturne-css-v1', baseline, manifest, dependencies: root, playwrightModule: pw, playwrightVersion: 'fixture'};
  const bytes = JSON.stringify(profile); await fs.writeFile(profilePath, bytes);
  return {root, baseline, stage, profilePath, profile, manifest, hash: sha256(bytes)};
}
test('product verification binds reviewed baseline and rejects edited profile or baseline', async t => {
  const f = await fixture(t); assert.equal((await loadProductProfile(f.profilePath, f.hash)).kind, 'nocturne-css-v1');
  await fs.appendFile(f.profilePath, '\n'); await assert.rejects(loadProductProfile(f.profilePath, f.hash), /PRODUCT_PROFILE_CHANGED/);
  await fs.writeFile(f.profilePath, JSON.stringify(f.profile));
  await fs.writeFile(path.join(f.baseline, 'src/app.css'), 'changed');
  await assert.rejects(loadProductProfile(f.profilePath, f.hash), /PRODUCT_BASELINE_CHANGED/);
});
test('CSS candidates use the exact reviewed product input; executable, new and symlinked files are refused', async t => {
  const f = await fixture(t);
  await fs.writeFile(path.join(f.stage, 'src/app.css'), 'body { display: none }');
  assert.ok((await validateProductCandidate(f.stage, f.manifest, ['src/app.css'], f.profile))['src/app.css']);
  await assert.rejects(validateProductCandidate(f.stage, {'src/app.css': '0'.repeat(64)}, ['src/app.css'], f.profile), /PRODUCT_INPUT_BASELINE_MISMATCH/);
  await assert.rejects(validateProductCandidate(f.stage, f.manifest, ['src/app.mjs'], f.profile), /PRODUCT_EXECUTABLE_PATCH_REQUIRES_SANDBOX/);
  await fs.writeFile(path.join(f.stage, 'src/injected.mjs'), 'process.exit(0)');
  await assert.rejects(validateProductCandidate(f.stage, f.manifest, ['src/app.css'], f.profile), /PRODUCT_FORBIDDEN_PATCH/);
  await fs.rm(path.join(f.stage, 'src/injected.mjs'));
  await fs.symlink(path.join(f.baseline, 'src/app.css'), path.join(f.stage, 'src/linked.css'));
  await assert.rejects(treeManifest(f.stage), /PRODUCT_UNSAFE_SNAPSHOT/);
  await fs.rm(path.join(f.stage, 'src/linked.css'));
  await fs.writeFile(path.join(f.stage, 'src/.env.local'), 'synthetic only');
  await assert.rejects(treeManifest(f.stage), /PRODUCT_UNSAFE_SNAPSHOT/);
});
test('product acceptance never permits an agent to execute new JS or specify a verification command', () => {
  const spec = {version: 1, id: 'css-check', dataClass: 'synthetic', background: 'Reviewed CSS', goal: 'Keep controls usable', inputs: ['src/app.css'], allowedFiles: ['src/app.css'], acceptance: [{id: 'product', type: 'nocturne-product', sha256: 'a'.repeat(64)}], humanChecks: ['target-user'], budget: {maxAttempts: 2, maxWallTimeMs: 600000, maxAttemptMs: 10000}, adapter: {kind: 'fixture', steps: [{mode: 'noop'}]}};
  assert.equal(validateSpec(spec), spec);
  for (const file of ['src/app.mjs', 'scripts/build.cjs', 'src/home.html']) assert.throws(() => validateSpec({...spec, allowedFiles: [file]}), /PRODUCT_EXECUTABLE_PATCH_REQUIRES_SANDBOX/);
  assert.throws(() => validateSpec({...spec, acceptance: [{...spec.acceptance[0], command: 'echo passed'}]}), /INVALID_SPEC/);
});
test('missing profile never falls back to running a candidate on the host', async () => {
  await assert.rejects(loadProductProfile(undefined, 'a'.repeat(64)), /PRODUCT_PROFILE_REQUIRED/);
});

test('container profiles admit only declared existing source patches and protect all other inputs', async t => {
  const f = await fixture(t); f.profile.kind = 'nocturne-container-v1';
  for (const folder of [f.baseline, f.stage]) {
    await fs.writeFile(path.join(folder,'src/app.mjs'), 'export const value=1;');
    await fs.writeFile(path.join(folder,'src/home.html'), '<main>baseline</main>');
  }
  f.profile.manifest = await treeManifest(f.baseline);
  await fs.writeFile(path.join(f.stage,'src/app.mjs'), 'export const value=2;');
  await fs.writeFile(path.join(f.stage,'src/home.html'), '<main>candidate</main>');
  assert.ok(await validateProductCandidate(f.stage,f.profile.manifest,['src/app.mjs','src/home.html'],f.profile));
  await assert.rejects(validateProductCandidate(f.stage,f.profile.manifest,['scripts/build.cjs'],f.profile), /PRODUCT_EXECUTABLE_PATCH_REQUIRES_SANDBOX/);
  await fs.writeFile(path.join(f.stage,'src/app.css'), 'body{display:none}');
  await assert.rejects(validateProductCandidate(f.stage,f.profile.manifest,['src/app.mjs','src/home.html'],f.profile), /PRODUCT_FORBIDDEN_PATCH/);
});
test('container acceptance has no legacy host-execution fallback or arbitrary command option', () => {
  const s = {version:1,id:'isolated',dataClass:'synthetic',background:'Synthetic',goal:'Check',inputs:['src/app.mjs','src/home.html'],allowedFiles:['src/app.mjs','src/home.html'],acceptance:[{id:'product',type:'nocturne-container',sha256:'a'.repeat(64)}],humanChecks:['reader'],budget:{maxAttempts:3,maxWallTimeMs:600000,maxAttemptMs:10000},adapter:{kind:'fixture',steps:[{mode:'noop'}]}};
  assert.equal(validateSpec(s),s);
  assert.throws(()=>validateSpec({...s,acceptance:[{...s.acceptance[0],type:'nocturne-product'}]}),/PRODUCT_EXECUTABLE_PATCH_REQUIRES_SANDBOX/);
  for (const file of ['src/../tools/policy.mjs','config/monetization.json','src/nested/module.mjs']) assert.throws(()=>validateSpec({...s,allowedFiles:[file]}),/FORBIDDEN_PATH|PRODUCT_EXECUTABLE_PATCH_REQUIRES_SANDBOX/);
  assert.throws(()=>validateSpec({...s,acceptance:[{...s.acceptance[0],command:'echo pass'}]}),/INVALID_SPEC/);
});
test('container launch refuses root, remote Docker endpoints and unbounded network settings', () => {
  const r={version:1,dockerHost:'unix:///tmp/test.sock',image:'sha256:'+'a'.repeat(64),lockSha256:'b'.repeat(64),seccompPath:'/tmp/seccomp.json',seccompSha256:'c'.repeat(64)};
  const options={name:'improvement-'+'d'.repeat(24)+'-app',user:'501:20'};
  const args=containerArgs(r,options);
  for(const flag of ['--read-only','--cap-drop','--pids-limit','--memory','--cpus','--init']) assert.ok(args.includes(flag));
  assert.equal(args[args.indexOf('--network')+1],'none'); assert.equal(args[args.indexOf('--pull')+1],'never');
  assert.throws(()=>containerArgs(r,{...options,user:'0:0'}),/CONTAINER_OPTIONS_INVALID/);
  assert.throws(()=>containerArgs(r,{...options,network:'host'}),/CONTAINER_OPTIONS_INVALID/);
  assert.throws(()=>validateRuntime({...r,dockerHost:'tcp://example.invalid:2376'}),/CONTAINER_RUNTIME_INVALID/);
});
test('the approved container seccomp and dependency lock are part of the profile evidence', async t => {
  const f=await fixture(t),seccompPath=path.join(f.root,'seccomp.json');
  await fs.writeFile(seccompPath,'{}'); await fs.writeFile(path.join(f.baseline,'package-lock.json'),'{}');
  f.profile.kind='nocturne-container-v1';f.profile.manifest=await treeManifest(f.baseline);
  f.profile.runtime={version:1,dockerHost:'unix:///tmp/test.sock',image:'sha256:'+'a'.repeat(64),lockSha256:sha256('{}'),seccompPath,seccompSha256:sha256('{}')};
  const bytes=JSON.stringify(f.profile);await fs.writeFile(f.profilePath,bytes);
  assert.ok(await loadProductProfile(f.profilePath,sha256(bytes)));
  await fs.writeFile(seccompPath,'{"changed":true}');
  await assert.rejects(loadProductProfile(f.profilePath,sha256(bytes)),/PRODUCT_RUNTIME_CHANGED/);
});
test('cleanup never removes a container belonging to another owner', async t => {
  const f=await fixture(t),bin=path.join(f.root,'bin');await fs.mkdir(bin);
  const log=path.join(f.root,'calls.jsonl'),stub=path.join(bin,'docker');
  await fs.writeFile(stub,`#!${process.execPath}\nconst fs=require('node:fs');const a=process.argv.slice(2);fs.appendFileSync(${JSON.stringify(log)},JSON.stringify(a)+'\\n');if(a[2]==='ps')console.log('synthetic-id');if(a[2]==='inspect')console.log(JSON.stringify([{Config:{Labels:{'nocturne.verification.owner':'wrong-owner'}}}]));\n`,{mode:0o700});
  const saved=process.env.PATH;process.env.PATH=bin+path.delimiter+saved;t.after(()=>{process.env.PATH=saved;});
  const runtime={version:1,dockerHost:'unix:///tmp/test.sock',image:'sha256:'+'a'.repeat(64),lockSha256:'b'.repeat(64),seccompPath:'/tmp/seccomp.json',seccompSha256:'c'.repeat(64)};
  await assert.rejects(cleanupContainerRuntime({runtime,owner:'d'.repeat(64),names:['improvement-'+'e'.repeat(24)+'-app']}),/CONTAINER_OWNERSHIP_INVALID/);
  assert.ok(!await fs.readFile(log,'utf8').then(s=>s.includes('"rm"')));
});
