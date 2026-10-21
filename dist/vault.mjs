const PREFIX='nocturne_1:';
// One-time removal of owner-only trial data before the public launch.
export function resetTrialData(storage,epoch){
 if(storage.getItem('nocturne_data_epoch')===epoch)return false;
 for(const key of Object.keys(storage))if(key.startsWith('nocturne_')||key.startsWith('heki16_'))storage.removeItem(key);
 storage.setItem('nocturne_data_epoch',epoch);return true;
}
const fresh=scope=>({v:1,scope,draft:null,localRecords:[],tags:[],note:''});
export function reconcileVault(current,scope,ownedIds,storage){
  if(current.scope===scope)return current;
  if(!current.scope&&current.draft&&ownedIds.includes(current.draft.id))return {...current,scope};
  const hasLocal=current.draft||current.localRecords?.length||current.tags?.length||current.note;
  if(!current.scope&&!hasLocal)return {...current,scope};
  try{storage.setItem(PREFIX+(current.scope||'local'),JSON.stringify(current));}catch{}
  if(scope===null)return fresh(null);
  try{const old=JSON.parse(storage.getItem(PREFIX+(scope||'local'))||'null');if(old?.v===1&&(old.scope||null)===(scope||null)&&Array.isArray(old.localRecords)&&Array.isArray(old.tags))return old;}catch{}
  return fresh(scope);
}
export function clearVaults(storage){for(const key of Object.keys(storage))if(key==='nocturne_1'||key.startsWith(PREFIX)||/^heki16_unified40_v[123]$/.test(key))storage.removeItem(key);}
// Freeze completed results and retain unfinished answers without relabelling their scenes.
export function preserveInstrument(state,current,previousDiagnose){
  const d=state.draft;if(!d)return state;
  const saved=state.localRecords?.find(r=>r.id===d.id),instrument=d.instrument||saved?.profile?.instrument||'nocturne24-1';
  if(instrument===current)return {...state,draft:{...d,instrument}};
  const profile=d.profile||saved?.profile||(['nocturne24-1','nocturne24-2'].includes(instrument)&&d.complete&&previousDiagnose?previousDiagnose(d.answers):null);
  if(d.complete&&profile){const row=saved||{id:d.id,profile,context:d.context,persona:d.persona,completedAt:d.completedAt};return {...state,draft:{...d,instrument,profile},localRecords:[row,...(state.localRecords||[]).filter(r=>r.id!==d.id)]};}
  return {...state,draft:null,pausedDrafts:[...(state.pausedDrafts||[]).filter(r=>r.id!==d.id),{...d,instrument}].slice(-5)};
}
