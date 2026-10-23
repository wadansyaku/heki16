import test from 'node:test';import assert from 'node:assert/strict';
import {browserCleanupPlan,applyBrowserCleanup,pendingBrowserCleanup,recoverBrowserCleanup,finishBrowserCleanup,browserCleanupWriteAllowed,CLEANUP_KEY} from '../src/browser-cleanup.mjs';
const storage=()=>({getItem(k){return this[k]??null;},setItem(k,v){this[k]=v;},removeItem(k){delete this[k];}});
function fixture(scope='a'){
 const s=storage(),record={v:1,scope,draft:{id:'r',complete:true},localRecords:[{id:'r'}],pausedDrafts:[{id:'paused'}],tags:[{label:'synthetic'}],note:'synthetic'};
 s.nocturne_1=JSON.stringify(record);s['nocturne_1:'+scope]=s.nocturne_1;s['nocturne_1:b']=JSON.stringify({...record,scope:'b'});s.nocturne_data_epoch='keep';s.unrelated='keep';return s;
}
test('preview deduplicates current/parked copies and requires confirmation without touching other logins',()=>{
 const s=fixture(),plan=browserCleanupPlan(s,'a'),before=JSON.stringify(s);assert.equal(plan.records,1);assert.equal(plan.unfinished,1);
 assert.throws(()=>applyBrowserCleanup(s,plan,false,'test'),/チェック/);assert.equal(JSON.stringify(s),before);
 const other=s['nocturne_1:b'];const result=applyBrowserCleanup(s,plan,true,'test');assert.equal(result.scope,null);assert.equal(result.draft,null);assert.equal(s['nocturne_1:a'],undefined);assert.equal(s['nocturne_1:b'],other);assert.equal(s.unrelated,'keep');assert.equal(s.nocturne_data_epoch,'keep');
});
test('a different account or edited draft after preview aborts before any deletion',()=>{
 for(const change of [s=>s.nocturne_1=JSON.stringify({v:1,scope:'b'}),s=>s['nocturne_1:a']='changed']){
  const s=fixture(),plan=browserCleanupPlan(s,'a');change(s);const before=JSON.stringify(s);assert.throws(()=>applyBrowserCleanup(s,plan,true,'test'),/変わりました/);assert.equal(JSON.stringify(s),before);
 }
 assert.throws(()=>browserCleanupPlan(fixture(),'b'),/変わりました/);
});
test('offline deletion stays local, retries logout and never re-clears newly entered anonymous answers',async()=>{
 const s=fixture(null),plan=browserCleanupPlan(s,null);applyBrowserCleanup(s,plan,true,'test');
 assert.equal(await finishBrowserCleanup(s,async()=>{throw Error('offline');}),false);assert.equal(pendingBrowserCleanup(s).pending,true);
 s.nocturne_1=JSON.stringify({v:1,scope:null,draft:{id:'new-draft'}});recoverBrowserCleanup(s);assert.equal(JSON.parse(s.nocturne_1).draft.id,'new-draft');
 assert.equal(await finishBrowserCleanup(s,async scope=>{assert.equal(scope,null);return {ok:true,status:200};}),true);assert.equal(pendingBrowserCleanup(s).pending,false);
});
test('an account mismatch resolves pending logout without touching the other login or server records',async()=>{
 const s=fixture();applyBrowserCleanup(s,browserCleanupPlan(s,'a'),true,'test');const other=s['nocturne_1:b'];assert.equal(await finishBrowserCleanup(s,async()=>({ok:false,status:409})),true);assert.equal(s['nocturne_1:b'],other);
});
test('storage failure is reported and its recovery marker finishes the interrupted local erase',()=>{
 const s=fixture(),plan=browserCleanupPlan(s,'a'),set=s.setItem;let failed=false;
 s.setItem=function(k,v){if(k==='nocturne_1'&&!failed){failed=true;throw Error('storage failure');}set.call(this,k,v);};
 assert.throws(()=>applyBrowserCleanup(s,plan,true,'test'),/storage failure/);assert.equal(pendingBrowserCleanup(s).cleared,false);recoverBrowserCleanup(s);assert.equal(JSON.parse(s.nocturne_1).draft,null);assert.equal(s['nocturne_1:a'],undefined);assert.equal(pendingBrowserCleanup(s).cleared,true);
});
test('a delayed logout response cannot overwrite a newer cleanup marker',async()=>{
 const s=fixture();applyBrowserCleanup(s,browserCleanupPlan(s,'a'),true,'old');
 await finishBrowserCleanup(s,async()=>{s.setItem(CLEANUP_KEY,JSON.stringify({v:1,scope:'b',nonce:'new',pending:true,cleared:true}));return {ok:true};});assert.equal(pendingBrowserCleanup(s).nonce,'new');assert.equal(pendingBrowserCleanup(s).pending,true);
});

test('a stale same-scope tab cannot save old answers between the deletion marker and its storage event',()=>{
 const s=fixture();applyBrowserCleanup(s,browserCleanupPlan(s,'a'),true,'new');assert.equal(browserCleanupWriteAllowed(s,'a','old'),false);assert.equal(browserCleanupWriteAllowed(s,'b','old'),true);assert.equal(browserCleanupWriteAllowed(s,null,'new'),true);
});
