const PREFIX='nocturne_1:';
const fresh=scope=>({v:1,scope,draft:null,localRecords:[],tags:[],note:''});
export function reconcileVault(current,scope,ownedIds,storage){
  if(current.scope===scope)return current;
  if(!current.scope&&current.draft&&ownedIds.includes(current.draft.id))return {...current,scope};
  const hasLocal=current.draft||current.localRecords?.length||current.tags?.length||current.note;
  if(!current.scope&&!hasLocal)return {...current,scope};
  try{storage.setItem(PREFIX+(current.scope||'local'),JSON.stringify(current));}catch{}
  try{const old=JSON.parse(storage.getItem(PREFIX+scope)||'null');if(old?.v===1&&old.scope===scope&&Array.isArray(old.localRecords)&&Array.isArray(old.tags))return old;}catch{}
  return fresh(scope);
}
export function clearVaults(storage){for(const key of Object.keys(storage))if(key==='nocturne_1'||key.startsWith(PREFIX)||/^heki16_unified40_v[123]$/.test(key))storage.removeItem(key);}
