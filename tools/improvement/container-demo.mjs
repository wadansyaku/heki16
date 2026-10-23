#!/usr/bin/env node
import {promises as fs} from 'node:fs';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {prepareProductProfile} from './product-profile.mjs';
import {initialize, run, specHash, atomicJson} from './engine.mjs';
const exec = promisify(execFile);
try {
  const a = process.argv.slice(2);
  if (a.length !== 4 || a[0] !== '--output' || a[2] !== '--runtime') throw Error('INVALID_ARGUMENT');
  const out = path.resolve(a[1]); await fs.mkdir(out, {mode: 0o700});
  const p = await prepareProductProfile({outputDir: path.join(out, 'profile'), containerRuntime: a[3]});
  const baseline = path.join(out, 'profile/baseline'), workspace = path.join(out, 'workspace');
  await fs.mkdir(path.join(workspace, 'src'), {recursive: true});
  const inputs = ['src/app.mjs','src/home.html','src/nocturne.mjs'];
  for (const file of inputs) await fs.copyFile(path.join(baseline, file), path.join(workspace, file));
  await exec('git', ['init','-q',workspace]); await exec('git',['-C',workspace,'add','src']);
  await exec('git',['-C',workspace,'-c','user.name=Synthetic QA','-c','user.email=qa@example.invalid','-c','commit.gpgsign=false','commit','-qm','Reviewed HTML and JavaScript baseline']);
  const js = await fs.readFile(path.join(baseline,'src/app.mjs'),'utf8'), html = await fs.readFile(path.join(baseline,'src/home.html'),'utf8');
  if (!js.includes('function confirmStart(){') || !html.includes('data-action="start"')) throw Error('DEMO_SOURCE_CHANGED');
  const model = await fs.readFile(path.join(baseline,'src/nocturne.mjs'),'utf8');
  const probe = `\n// Synthetic candidate: attempts must stay inside the disposable container.\nif(globalThis.process?.getBuiltinModule){const f=process.getBuiltinModule('node:fs');for(const p of ['/Users/Yodai/.ssh','/var/run/docker.sock']){let readable=false;try{f.readFileSync(p);readable=true;}catch{}if(readable)throw Error('isolation failed');}for(const p of ['/project/tests/candidate-probe','/trusted/tools/improvement/candidate-probe','/opt/nocturne/node_modules/candidate-probe']){let writable=false;try{f.writeFileSync(p,'synthetic');writable=true;}catch{}if(writable)throw Error('isolation failed');}}\n`;
  const spec = {
    version: 1, id: 'nocturne-container-gates', dataClass: 'synthetic', background: 'Exercise isolated executable candidates against immutable tests and a separate browser verifier.', goal: 'Reject JavaScript and HTML regressions and retain human review after a passing candidate.',
    inputs, allowedFiles: inputs, acceptance: [{id: 'isolated-product', type: 'nocturne-container', sha256: p.sha256}], humanChecks: ['target-user-comprehension','physical-safari'],
    budget: {maxAttempts: 3, maxWallTimeMs: 1200000, maxAttemptMs: 10000}, adapter: {kind: 'fixture', steps: [
      {mode: 'write', path: 'src/app.mjs', content: js + '\nconst syntheticObserver=new MutationObserver(()=>{const b=document.querySelector(".home-actions [data-action=start]");if(b)b.style.display="none";});syntheticObserver.observe(document.querySelector("#main"),{childList:true,subtree:true});\n'},
      {mode: 'write', path: 'src/home.html', content: html.replace('data-action="start"','data-action="disabled-for-synthetic-test"')},
      {mode: 'write-many', files: [{path:'src/home.html',content:html+'\n<!-- Synthetic HTML acceptance check. -->\n'},{path:'src/nocturne.mjs',content:model+probe}]}
    ]}
  };
  const specPath = path.join(out,'spec.json'), stateDir = path.join(out,'run'); await atomicJson(specPath,spec);
  await initialize({specPath,workspace,stateDir,approvedHash:specHash(spec)});
  const result = await run(stateDir,{productProfile:p.profilePath}); await atomicJson(path.join(out,'result.json'),result);
  console.log(JSON.stringify({...result,resultFile:path.join(out,'result.json')},null,2));
  if (result.status !== 'awaiting_human' || result.attempts !== 3) process.exitCode = 2;
} catch (e) { console.error(JSON.stringify({error:/^[A-Z_]+$/.test(e.code || e.message) ? e.code || e.message : 'CONTAINER_DEMO_FAILED'})); process.exitCode = 2; }
