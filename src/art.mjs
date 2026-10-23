import {DOSSIER_CATALOG} from './dossier-catalog.mjs';
// Curated, pre-rendered artwork. No answers leave the device for generation.
export const ART_VERSION=1;
export const LEGACY_ART_KEYS=['key','ribbon','mirror','voice'];
export const TITLE_ART=Object.freeze(Object.fromEntries(DOSSIER_CATALOG.map(entry=>[entry.title,entry.art])));
export const ART_KEYS=[...LEGACY_ART_KEYS,...Object.values(TITLE_ART)];
export const ART_FILES=ART_KEYS.flatMap(key=>['art/'+key+'.webp','art/'+key+'-small.webp']);
export const validArt=key=>ART_KEYS.includes(key);
export const artSource=(key,small=false)=>`/art/${validArt(key)?key:'key'}${small?'-small':''}.webp`;
export function preferredArt(profile){
 if(TITLE_ART[profile?.title])return TITLE_ART[profile.title];
 const traits=new Set(profile?.focus||profile?.traits||[]);
 if(traits.has('restraintGive')||traits.has('restraintReceive'))return 'ribbon';
 if(traits.has('voice')||traits.has('scent')||traits.has('touch'))return 'voice';
 if(traits.has('switch')||traits.has('lead')&&traits.has('yield')||traits.has('giveCare')&&traits.has('receiveCare'))return 'mirror';
 return 'key';
}
