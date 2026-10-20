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
