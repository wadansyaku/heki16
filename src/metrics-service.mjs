export const METRIC_EVENTS=['visit','share_visit','listing_gate','start_open','quiz_start','quiz_complete','share_open','share_link','x_open','listing_open','listing_publish','interest','pr_open','pr_click'];
const devices=['mobile','desktop'],sources=['direct','search','social','other'];
const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'"}});
export async function handleMetrics(request,env,now=Date.now()){
 if(request.method!=='POST')return reply({error:'method'},405);
 const url=new URL(request.url);
 if(url.origin!==env.SITE_ORIGIN||request.headers.get('Origin')!==env.SITE_ORIGIN||request.headers.get('X-Nocturne')!=='1'||request.headers.get('Sec-Fetch-Site')==='cross-site')return reply({error:'origin'},403);
 if(!env.DB||!env.METRIC_LIMIT)return reply({error:'unavailable'},503);
 if(env.RECOVERY_MODE&&env.RECOVERY_MODE!=='off')return reply({error:'unavailable'},503);
 if(request.cf?.botManagement?.verifiedBot||request.headers.get('Sec-GPC')==='1'||request.headers.get('DNT')==='1')return reply({accepted:false});
 if(!(await env.METRIC_LIMIT.limit({key:request.headers.get('CF-Connecting-IP')||'shared'})).success)return reply({error:'wait'},429);
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return reply({error:'invalid_body'},400);
 let b;try{const reader=request.body?.getReader();if(!reader)throw Error();let text='',size=0;const decoder=new TextDecoder();try{for(;;){const p=await reader.read();if(p.done)break;size+=p.value.byteLength;if(size>1024){await reader.cancel();throw Error();}text+=decoder.decode(p.value,{stream:true});}b=JSON.parse(text+decoder.decode());}finally{reader.releaseLock();}}catch{return reply({error:'invalid_body'},400);}
 if(!b||Array.isArray(b)||Object.keys(b).some(k=>!['session','events','device','source'].includes(k))||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(b.session||'')||!Array.isArray(b.events)||!b.events.length||b.events.length>METRIC_EVENTS.length||b.events.some(e=>!METRIC_EVENTS.includes(e))||!devices.includes(b.device)||!sources.includes(b.source))return reply({error:'invalid_request'},400);
 const session=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(b.session)).then(bytes=>Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join(''));
 const day=new Date(now+9*3600000).toISOString().slice(0,10),queries=[];
 for(const event of new Set(b.events)){
  queries.push(env.DB.prepare('INSERT INTO nocturne_metric_events(session,event,created_at) VALUES(?,?,?) ON CONFLICT(session,event) DO NOTHING').bind(session,event,now));
  // changes() belongs to the preceding statement inside this atomic batch.
  queries.push(env.DB.prepare('INSERT INTO nocturne_metric_daily(day,event,device,source,n) SELECT ?,?,?,?,1 WHERE changes()=1 ON CONFLICT(day,event,device,source) DO UPDATE SET n=n+1').bind(day,event,b.device,b.source));
 }
 try{await env.DB.batch(queries);return reply({accepted:true});}catch(error){if(String(error).includes('metric_capacity'))return reply({error:'capacity'},429);return reply({error:'unavailable'},503);}
}
export async function maintainMetrics(env,now=Date.now()){
 if(!env.DB||env.RECOVERY_MODE&&env.RECOVERY_MODE!=='off')return;
 await env.DB.batch([env.DB.prepare('DELETE FROM nocturne_metric_events WHERE created_at<?').bind(now-2*86400000),env.DB.prepare('DELETE FROM nocturne_metric_quota WHERE day<?').bind(new Date(now-3*86400000).toISOString().slice(0,10))]);
}
