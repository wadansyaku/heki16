export const AD_CONSENT='nocturne-pr-2026-10-21';
export {SITE_ELIGIBILITY_POLICY as ELIGIBILITY_POLICY} from './eligibility-core.mjs';
import {SITE_ELIGIBILITY_POLICY as ELIGIBILITY_POLICY} from './eligibility-core.mjs';
const MAX_AGE=30*86400000;
export function adConsentApplies(consent,recordId,now=Date.now()){
 return !!recordId&&consent?.version===AD_CONSENT&&consent.recordId===recordId&&Number.isFinite(consent.acceptedAt)&&consent.acceptedAt<=now&&now-consent.acceptedAt<MAX_AGE;
}
function strongFacetIds(facets){
 return new Set((facets||[]).filter(f=>f?.strong===true).map(f=>f.id));
}
function placed(campaign,placement){
 if(!placement)return true;
 const list=campaign.placements;
 if(!Array.isArray(list)||!list.length)return true;
 return list.includes(placement);
}
export function matchedAffinityLabels(campaign,facets=[]){
 const selected=strongFacetIds(facets);
 return (campaign.affinities||[]).filter(id=>selected.has(id)).map(id=>(facets.find(f=>f.id===id)||{}).label).filter(Boolean);
}
export function selectPromotions(campaigns,{consented=false,facets=[],placement}={},now=Date.now()){
 const selected=strongFacetIds(facets);
 const ranked=campaigns.filter(c=>Date.parse(c.expiresAt)>now&&placed(c,placement)).map((c,index)=>{
  const affinities=c.affinities||[];
  return {c,index,overlap:affinities.filter(id=>selected.has(id)).length,targeted:affinities.length>0};
 });
 if(!consented)return ranked.sort((a,b)=>a.index-b.index).slice(0,3).map(({c})=>c);
 const matches=ranked.filter(item=>item.overlap>0).sort((a,b)=>b.overlap-a.overlap||a.index-b.index);
 const general=ranked.filter(item=>!item.targeted).sort((a,b)=>a.index-b.index);
 return [...matches,...general].slice(0,3).map(({c})=>c);
}
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function promotionForm(campaign) {
 return `<form action="/out/${escape(campaign.id)}" method="post" target="_blank" rel="noopener noreferrer" data-pr-id="${escape(campaign.id)}"><input type="hidden" name="eligibility" value="${ELIGIBILITY_POLICY}"><button type="submit" class="btn secondary wide">myfansで詳細を見る ↗</button></form>`;
}
