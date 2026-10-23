#!/usr/bin/env node
import {promises as fs} from 'node:fs';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {prepareProductProfile} from './product-profile.mjs';
import {initialize, run, specHash, atomicJson} from './engine.mjs';
const exec = promisify(execFile);

try {
  const args = process.argv.slice(2);
  if (args.length !== 6 || args[0] !== '--output' || args[2] !== '--playwright-module' || args[4] !== '--browser') throw Error('INVALID_ARGUMENT');
  const outputDir = path.resolve(args[1]);
  await fs.mkdir(outputDir, {mode: 0o700});
  const profile = await prepareProductProfile({outputDir: path.join(outputDir, 'product'), playwrightModule: args[3], browserExecutable: args[5]});
  const workspace = path.join(outputDir, 'workspace');
  await fs.mkdir(path.join(workspace, 'src'), {recursive: true});
  const css = await fs.readFile(path.join(outputDir, 'product/baseline/src/app.css'), 'utf8');
  await fs.writeFile(path.join(workspace, 'src/app.css'), css);
  await exec('git', ['init', '-q', workspace]);
  await exec('git', ['-C', workspace, 'add', 'src/app.css']);
  await exec('git', ['-C', workspace, '-c', 'user.name=Synthetic QA', '-c', 'user.email=qa@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'Reviewed CSS baseline']);
  const spec = {
    version: 1, id: 'nocturne-product-gates', dataClass: 'synthetic',
    background: 'Exercise the real KUSEIRO regression and browser gates using reviewed synthetic CSS changes.',
    goal: 'Reject a hidden primary action, recover with the baseline CSS, and retain human acceptance requirements.',
    inputs: ['src/app.css'], allowedFiles: ['src/app.css'],
    acceptance: [{id: 'product-tests-and-ui', type: 'nocturne-product', sha256: profile.sha256}],
    humanChecks: ['target-user-comprehension', 'physical-safari'],
    budget: {maxAttempts: 2, maxWallTimeMs: 600000, maxAttemptMs: 10000},
    adapter: {kind: 'fixture', steps: [
      {mode: 'write', path: 'src/app.css', content: css + '\n.home-actions [data-action="start"] { display: none !important; }\n'},
      {mode: 'write', path: 'src/app.css', content: css}
    ]}
  };
  const specPath = path.join(outputDir, 'spec.json'), stateDir = path.join(outputDir, 'run');
  await atomicJson(specPath, spec);
  await initialize({specPath, workspace, stateDir, approvedHash: specHash(spec)});
  const result = await run(stateDir, {productProfile: profile.profilePath});
  await atomicJson(path.join(outputDir, 'result.json'), result);
  console.log(JSON.stringify({...result, resultFile: path.join(outputDir, 'result.json')}, null, 2));
  if (result.status !== 'awaiting_human' || result.attempts !== 2) process.exitCode = 2;
} catch (error) { console.error(JSON.stringify({error: /^[A-Z_]+$/.test(error.code || error.message) ? error.code || error.message : 'PRODUCT_DEMO_FAILED'})); process.exitCode = 2; }
