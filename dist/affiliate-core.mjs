export const AD_CONSENT='nocturne-pr-2026-10-21';
const MAX_AGE=30*86400000;
export function adConsentApplies(consent,recordId,now=Date.now()){
 return !!recordId&&consent?.version===AD_CONSENT&&consent.recordId===recordId&&Number.isFinite(consent.acceptedAt)&&consent.acceptedAt<=now&&now-consent.acceptedAt<MAX_AGE;
}
export function selectPromotions(campaigns,{consented=false,facets=[]}={},now=Date.now()){
 const selected=new Set(facets.filter(f=>f?.strong===true).map(f=>f.id));
 return campaigns.filter(c=>Date.parse(c.expiresAt)>now).map((c,index)=>({c,index,rank:consented?(c.affinities||[]).filter(id=>selected.has(id)).length:0})).sort((a,b)=>b.rank-a.rank||a.index-b.index).slice(0,3).map(({c})=>c);
}
