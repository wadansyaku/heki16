import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {resolveRecordedPath} from '../scripts/workspace-paths.mjs';
import {INSTRUMENT} from '../src/nocturne.mjs';
const execute=promisify(execFile),root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('moved proof files resolve without rewriting the submitted record or its hash',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'nocturne-workspace-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const home=path.join(dir,'old-home'),workspaceRoot=path.join(dir,'KUSEIRO');
 const original=path.join(home,'heki16-operations','review','proof.png');
 const record=JSON.stringify({path:original,sha256:crypto.createHash('sha256').update('original proof').digest('hex')});
 const recordedBytes=Buffer.from(record);
 const actual=path.join(workspaceRoot,'operations','review','proof.png');await fs.mkdir(path.dirname(actual),{recursive:true});await fs.writeFile(actual,'original proof');
 const value=JSON.parse(record),resolved=resolveRecordedPath(value.path,{workspaceRoot,home});
 assert.equal(resolved,actual);assert.equal(crypto.createHash('sha256').update(await fs.readFile(resolved)).digest('hex'),value.sha256);
 assert.deepEqual(Buffer.from(record),recordedBytes);
 for(const [from,to]of [['heki16','app'],['heki16-private','private'],['nocturne-admin','operations/admin']])assert.equal(resolveRecordedPath(path.join(home,from,'file'),{workspaceRoot,home}),path.join(workspaceRoot,to,'file'));
 assert.equal(resolveRecordedPath(path.join(home,'heki16-operations-other','file'),{workspaceRoot,home}),path.join(home,'heki16-operations-other','file'));
 assert.equal(resolveRecordedPath(path.join(home,'NOCTURNE','operations','review','proof.png'),{workspaceRoot,home}),path.join(workspaceRoot,'operations','review','proof.png'));
 assert.equal(resolveRecordedPath(path.join(home,'NOCTURNE-other','private','file'),{workspaceRoot,home}),path.join(home,'NOCTURNE-other','private','file'));
 for(const file of ['relative/proof.png','/proof\0.png'])assert.throws(()=>resolveRecordedPath(file),/INVALID_RECORDED_PATH/);
});

test('analytics defaults to private operations outside the application and keeps restrictive permissions',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'nocturne-analysis-layout-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const app=path.join(dir,'app');await fs.mkdir(path.join(app,'scripts'),{recursive:true});await fs.copyFile(path.join(root,'scripts/analytics.cjs'),path.join(app,'scripts/analytics.cjs'));
 await fs.mkdir(path.join(app,'src'));await fs.writeFile(path.join(app,'src/nocturne.mjs'),`export const INSTRUMENT=${JSON.stringify(INSTRUMENT)};`);
 await fs.writeFile(path.join(app,'wrangler.jsonc'),JSON.stringify({r2_buckets:[{binding:'EVIDENCE',bucket_name:'synthetic-evidence'}]}));
 const input=path.join(dir,'synthetic.json');await fs.writeFile(input,JSON.stringify({instrument:INSTRUMENT,updatedAt:0,people:0,started:0,completed:0,possiblyPaused:0,funnel:[]}));
 const preload=path.join(dir,'test-home.cjs');await fs.writeFile(preload,`require('node:os').homedir=()=>${JSON.stringify(path.join(dir,'synthetic-home'))};`);
 await execute(process.execPath,['--require',preload,path.join(app,'scripts/analytics.cjs'),'--input',input]);
 const output=path.join(dir,'operations/admin/index.html');assert.match(await fs.readFile(output,'utf8'),/KUSEIRO 観測室/);
 const before=await fs.readFile(output);await fs.writeFile(input,JSON.stringify({instrument:'unknown-instrument'}));
 await assert.rejects(execute(process.execPath,['--require',preload,path.join(app,'scripts/analytics.cjs'),'--input',input]));assert.deepEqual(await fs.readFile(output),before);
 assert.equal((await fs.stat(output)).mode&0o777,0o600);assert.equal((await fs.stat(path.dirname(output))).mode&0o777,0o700);
 await assert.rejects(fs.stat(path.join(app,'dist','index.html')),/ENOENT/);await assert.rejects(fs.stat(path.join(dir,'synthetic-home','nocturne-admin')),/ENOENT/);
});
