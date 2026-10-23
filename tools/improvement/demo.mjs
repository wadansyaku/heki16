#!/usr/bin/env node
// Offline demonstration. Creates only a disposable synthetic repository; no collection or paid API.
import {promises as fs} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {initialize, run, specHash} from './engine.mjs';
const exec = promisify(execFile);
const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'nocturne-improvement-demo-'));
const workspace = path.join(dir, 'repo'), stateDir = path.join(dir, 'run');
await fs.mkdir(path.join(workspace, 'docs'), {recursive: true});
await fs.writeFile(path.join(workspace, 'docs/note.md'), 'TODO\n');
const git = args => exec('git', ['-C', workspace, ...args], {env: {PATH: process.env.PATH, HOME: '/nonexistent', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null'}});
await git(['init', '-q']); await git(['add', '.']);
await git(['-c', 'user.name=Synthetic demo', '-c', 'user.email=demo@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'synthetic baseline']);
const specPath = path.join(dir, 'spec.json');
const spec = JSON.parse(await fs.readFile(path.join(path.dirname(fileURLToPath(import.meta.url)), 'example-spec.json'), 'utf8'));
await fs.writeFile(specPath, JSON.stringify(spec, null, 2));
await initialize({specPath, workspace, stateDir, approvedHash: specHash(spec)});
const result = await run(stateDir);
process.stdout.write(`${JSON.stringify({...result, demoDirectory: dir, candidateManifestFile: path.join(stateDir, 'candidate.json')}, null, 2)}\n`);
