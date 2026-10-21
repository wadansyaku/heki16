// Curated, pre-rendered artwork. No answers leave the device for generation.
export const ART_VERSION=1;
export const ART_KEYS=['key','ribbon','mirror','voice'];
export const validArt=key=>ART_KEYS.includes(key);
export const artSource=(key,small=false)=>`/art/${validArt(key)?key:'key'}${small?'-small':''}.webp`;
export function preferredArt(profile){
 const traits=new Set(profile?.focus||profile?.traits||[]);
 if(traits.has('restraintGive')||traits.has('restraintReceive'))return 'ribbon';
 if(traits.has('voice')||traits.has('scent')||traits.has('touch'))return 'voice';
 if(traits.has('switch')||traits.has('lead')&&traits.has('yield')||traits.has('giveCare')&&traits.has('receiveCare'))return 'mirror';
 return 'key';
}
