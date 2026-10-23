// Local-only deletion. Never enumerate or erase other saved account vaults.
export const CLEANUP_KEY='nocturne_local_cleanup';
const KEY='nocturne_1',empty=()=>({v:1,scope:null,draft:null,localRecords:[],tags:[],note:''});
const stale=()=>Error('保存内容が変わりました。削除内容をもう一度確認してください。');
export function browserCleanupPlan(storage,scope){
 const raw=storage.getItem(KEY),current=JSON.parse(raw||'null');
 if((current?.scope||null)!==(scope||null))throw stale();
 const alias=KEY+':'+(scope||'local'),parked=storage.getItem(alias),other=JSON.parse(parked||'null');
 if(other&&(other.scope||null)!==(scope||null))throw stale();
 const records=new Set(),unfinished=new Set();for(const value of [current,other]){
  for(const r of value?.localRecords||[])records.add(r.id);
  if(value?.draft?.complete)records.add(value.draft.id);else if(value?.draft)unfinished.add(value.draft.id);
  for(const r of value?.pausedDrafts||[])unfinished.add(r.id);
 }
 return {scope:scope||null,raw,alias,parked,records:records.size,unfinished:unfinished.size};
}
export function pendingBrowserCleanup(storage){try{return JSON.parse(storage.getItem(CLEANUP_KEY)||'null');}catch{return null;}}
export function recoverBrowserCleanup(storage){
 const pending=pendingBrowserCleanup(storage);if(!pending?.pending||pending.cleared)return;
 const current=JSON.parse(storage.getItem(KEY)||'null');
 if((current?.scope||null)===pending.scope)storage.setItem(KEY,JSON.stringify(empty()));
 const alias=KEY+':'+(pending.scope||'local'),parked=JSON.parse(storage.getItem(alias)||'null');if(parked&&(parked.scope||null)===pending.scope)storage.removeItem(alias);
 storage.setItem(CLEANUP_KEY,JSON.stringify({...pending,cleared:true}));
}
export function applyBrowserCleanup(storage,plan,confirmed,nonce){
 if(!confirmed)throw Error('削除する内容を確認して、チェックを入れてください。');
 if(storage.getItem(KEY)!==plan.raw||storage.getItem(plan.alias)!==plan.parked)throw stale();
 // Write the recovery marker first: a partial storage failure must not restore an old login on reload.
 storage.setItem(CLEANUP_KEY,JSON.stringify({v:1,scope:plan.scope,nonce,pending:true,cleared:false}));
 storage.setItem(KEY,JSON.stringify(empty()));storage.removeItem(plan.alias);
 storage.setItem(CLEANUP_KEY,JSON.stringify({v:1,scope:plan.scope,nonce,pending:true,cleared:true}));
 return empty();
}
export async function finishBrowserCleanup(storage,send){
 const pending=pendingBrowserCleanup(storage);if(!pending?.pending)return true;
 recoverBrowserCleanup(storage);
 try{
  const response=await send(pending.scope);
  // A scope mismatch belongs to another login. Do not log it out or delete it.
  if(!response.ok&&response.status!==409)return false;
  const latest=pendingBrowserCleanup(storage);if(latest?.nonce!==pending.nonce)return !latest?.pending;
  storage.setItem(CLEANUP_KEY,JSON.stringify({...latest,pending:false}));return true;
 }catch{return false;}
}

export function browserCleanupWriteAllowed(storage,scope,observedNonce){const notice=pendingBrowserCleanup(storage);return !notice||notice.nonce===observedNonce||notice.scope!==(scope||null);}
