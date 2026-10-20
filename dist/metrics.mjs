// Anonymous, first-party event counts. This module never reads the answer vault.
const EVENTS=new Set(['visit','share_visit','listing_gate','start_open','quiz_start','quiz_complete','share_open','share_link','x_open','listing_open','listing_publish','interest']);
let memory=null,queue=new Set(),timer=null;
const source=()=>{try{const host=new URL(document.referrer).hostname;if(host===location.hostname)return 'direct';if(/(^|\.)(google\.[a-z.]+|bing\.com|yahoo\.[a-z.]+|duckduckgo\.com)$/.test(host))return 'search';if(/(^|\.)(t\.co|x\.com|twitter\.com|instagram\.com|facebook\.com|line\.me)$/.test(host))return 'social';return 'other';}catch{return 'direct';}};
function session(){const now=Date.now();try{memory=JSON.parse(sessionStorage.getItem('nocturne_metrics')||'null')||memory;}catch{}if(!memory||now-memory.touched>=1800000){memory={id:crypto.randomUUID(),touched:now,source:source(),device:innerWidth<=600?'mobile':'desktop',sent:[]};}memory.touched=now;save();return memory;}
function save(){try{sessionStorage.setItem('nocturne_metrics',JSON.stringify(memory));}catch{}}
function enabled(){return navigator.doNotTrack!=='1'&&!navigator.globalPrivacyControl;}
export function measure(event){if(!enabled()||!EVENTS.has(event))return;const s=session();if(!s.sent.includes('visit'))queue.add('visit');if(!s.sent.includes(event))queue.add(event);clearTimeout(timer);timer=setTimeout(flush,250);}
async function flush(){if(!queue.size||!enabled())return;const s=session(),events=[...queue];queue.clear();try{const response=await fetch('/api/metrics',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json','X-Nocturne':'1'},body:JSON.stringify({session:s.id,events,source:s.source,device:s.device}),keepalive:true});if(response.ok&&memory?.id===s.id){s.sent=[...new Set([...s.sent,...events])];save();}}catch{/* Measurement never blocks the diagnosis. */}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')void flush();});
measure('visit');

if(location.pathname.startsWith('/s/'))measure('share_visit');
