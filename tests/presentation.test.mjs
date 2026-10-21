import test from 'node:test';
import assert from 'node:assert/strict';
import {visibleCard,facetRate,historyComparison} from '../src/presentation.mjs';

test('name-only snapshots omit every private detail, including fields a share preview might not display',()=>{
  const original={v:1,instrument:'example',title:'二つ名',quote:'private quote',summary:'private note',tags:['private tag'],traits:['lead']};
  const card=visibleCard(original,true);
  assert.equal(card.title,original.title);assert.deepEqual(card.tags,[]);assert.deepEqual(card.traits,[]);
  assert.ok(!JSON.stringify(card).includes('private'));assert.equal(original.quote,'private quote');
});
test('an unanswered preference stays unknown; an explicitly unselected preference can be zero',()=>{
  assert.equal(facetRate(),null);assert.equal(facetRate({count:0,opportunities:0}),null);
  assert.equal(facetRate({count:0,opportunities:2}),0);assert.equal(facetRate({count:1,opportunities:2}),50);
});
test('history compares only earlier records with the same question set and time context',()=>{
  const profile={instrument:'current',facets:[{id:'yield',count:1,opportunities:2}]};
  const current={id:'now',profile,context:{timeframe:'now'},completedAt:100};
  const row=(id,instrument,timeframe,completedAt)=>({id,profile:{...profile,instrument},context:{timeframe},completedAt});
  const rows=[row('wrong-question-set','old','now',99),row('wrong-time','current','recent',98),row('future','current','now',101),row('valid','current','now',80)];
  const result=historyComparison(current,rows,[['yield','委ねたい'],['scent','香り']]);
  assert.equal(result.before.id,'valid');assert.equal(result.items[0].before,50);assert.equal(result.items[1].now,null);assert.equal(result.items[1].before,null);
  assert.equal(historyComparison(current,rows.slice(0,3),[]).before,undefined);
});

test('old links move without losing share IDs, while recovery remains on the original host',async()=>{
  const {migrationResponse}=await import('../src/move-worker.mjs');
  const destination='https://nocturne.aiyume.workers.dev';
  const moved=migrationResponse(new Request('https://heki16-pro.aiyume.workers.dev/s/abcdefghijklmnop'),destination);
  assert.equal(moved.status,302);assert.equal(moved.headers.get('location'),destination+'/s/abcdefghijklmnop');
  assert.equal(migrationResponse(new Request('https://heki16-pro.aiyume.workers.dev/?records=1'),destination),null);
  assert.equal(migrationResponse(new Request('https://heki16-pro.aiyume.workers.dev/api/recovery/create',{method:'POST'}),destination),null);
  assert.equal(migrationResponse(new Request('https://heki16-pro.aiyume.workers.dev/app.mjs'),destination),null);
});

test('basic questions require explicit profile choices and reject non-answers',async()=>{
  const {firstMissingChoice}=await import('../src/presentation.mjs');
  const {PROFILE_OPTIONS}=await import('../src/nocturne.mjs');
  const opts=PROFILE_OPTIONS;
  assert.equal(firstMissingChoice({mood:'',age:'',gender:''},opts),'mood');
  assert.equal(firstMissingChoice({mood:'ordinary',age:'',gender:'man'},opts),'age');
  assert.equal(firstMissingChoice({mood:'ordinary',age:'20-24',gender:'forged'},opts),'gender');
  assert.equal(firstMissingChoice({mood:'unset',age:'unset',gender:'unset'},opts),'mood');
  assert.equal(firstMissingChoice({mood:'ordinary',age:'55-59',gender:'diverse'},opts),undefined);
  assert.deepEqual(Object.keys(opts.age),['18-19','20-24','25-29','30-34','35-39','40-44','45-49','50-54','55-59','60+']);
});

test('launch reset clears only trial app namespaces once, preserving later real answers',async()=>{
 const {resetTrialData}=await import('../src/vault.mjs');
 const storage={nocturne_1:'old',nocturne_pr_consent:'old',heki16_old:'old',other_app:'keep',getItem(k){return this[k]??null},setItem(k,v){this[k]=v},removeItem(k){delete this[k]}};
 assert.equal(resetTrialData(storage,'launch-20261021'),true);assert.equal(storage.other_app,'keep');assert.equal(storage.nocturne_1,undefined);assert.equal(storage.heki16_old,undefined);
 storage.nocturne_1='new answers';assert.equal(resetTrialData(storage,'launch-20261021'),false);assert.equal(storage.nocturne_1,'new answers');
});
