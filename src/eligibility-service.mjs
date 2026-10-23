import {SITE_ELIGIBILITY_POLICY,ELIGIBILITY_MAX_AGE,ELIGIBILITY_COOKIE} from './eligibility-core.mjs';

const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex'};
const json=(body,status=200,extra={})=>Response.json(body,{status,headers:{...headers,...extra}});
const local=env=>env.LOCAL_TEST_MODE==='true'&&/^http:\/\/(?:localhost|127\.0\.0\.1):\d+$/.test(env.SITE_ORIGIN||'');
const secret=env=>typeof env.ELIGIBILITY_SECRET==='string'&&env.ELIGIBILITY_SECRET.length>=32?env.ELIGIBILITY_SECRET:(local(env)?'local-eligibility-test-only':null);
async function key(env){return crypto.subtle.importKey('raw',new TextEncoder().encode(secret(env)),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
const message=(issued,origin)=>new TextEncoder().encode([SITE_ELIGIBILITY_POLICY,origin,issued].join('\n'));
const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
export async function eligibilityStatus(request,env,now=Date.now()){
 if(!secret(env)||new URL(request.url).origin!==env.SITE_ORIGIN)return null;
 const values=(request.headers.get('Cookie')||'').split(';').map(s=>s.trim()).filter(s=>s.startsWith(ELIGIBILITY_COOKIE+'='));
 if(values.length!==1)return null;
 const match=/^v1\.(\d{13})\.([a-f0-9]{64})$/.exec(values[0].slice(ELIGIBILITY_COOKIE.length+1));
 if(!match)return null;
 const issued=Number(match[1]);if(issued>now||now-issued>=ELIGIBILITY_MAX_AGE)return null;
 const signature=Uint8Array.from(match[2].match(/../g),b=>parseInt(b,16));
 if(!await crypto.subtle.verify('HMAC',await key(env),signature,message(match[1],env.SITE_ORIGIN)))return null;
 return {eligible:true,policy:SITE_ELIGIBILITY_POLICY,validUntil:issued+ELIGIBILITY_MAX_AGE};
}
export async function handleEligibility(request,env,now=Date.now()){
 const url=new URL(request.url);
 if(url.pathname!=='/api/eligibility')return null;
 if(url.origin!==env.SITE_ORIGIN||url.search||request.headers.get('Sec-Fetch-Site')==='cross-site')return json({error:'origin'},403);
 if(request.method==='GET')return json(await eligibilityStatus(request,env,now)||{eligible:false,policy:SITE_ELIGIBILITY_POLICY});
 if(request.method!=='POST')return json({error:'method'},405);
 if(request.headers.get('Origin')!==env.SITE_ORIGIN)return json({error:'origin'},403);
 if(!secret(env)||!env.API_LIMIT||!env.GLOBAL_LIMIT)return json({error:'unavailable'},503);
 if(!(await env.GLOBAL_LIMIT.limit({key:'eligibility'})).success||!(await env.API_LIMIT.limit({key:'eligibility:'+(request.headers.get('CF-Connecting-IP')||'shared')})).success)return json({error:'wait'},429);
 if(!request.headers.get('Content-Type')?.startsWith('application/json')||!request.body)return json({error:'invalid_body'},400);
 let size=0,body='',value;const reader=request.body.getReader(),decoder=new TextDecoder();
 try{for(;;){const {done,value:chunk}=await reader.read();if(done)break;size+=chunk.length;if(size>512){await reader.cancel();return json({error:'invalid_body'},400);}body+=decoder.decode(chunk,{stream:true});}body+=decoder.decode();value=JSON.parse(body);}catch{return json({error:'invalid_body'},400);}finally{reader.releaseLock();}
 if(!value||Array.isArray(value)||Object.keys(value).length!==2||value.policy!==SITE_ELIGIBILITY_POLICY||typeof value.confirmed!=='boolean')return json({error:'invalid_request'},400);
 const suffix='; Path=/; HttpOnly; SameSite=Lax'+(local(env)?'':'; Secure');
 if(!value.confirmed)return json({eligible:false,policy:SITE_ELIGIBILITY_POLICY},200,{'Set-Cookie':ELIGIBILITY_COOKIE+'=; Max-Age=0'+suffix});
 const issued=String(now),signature=hex(await crypto.subtle.sign('HMAC',await key(env),message(issued,env.SITE_ORIGIN)));
 return json({eligible:true,policy:SITE_ELIGIBILITY_POLICY,validUntil:now+ELIGIBILITY_MAX_AGE},200,{'Set-Cookie':`${ELIGIBILITY_COOKIE}=v1.${issued}.${signature}; Max-Age=${ELIGIBILITY_MAX_AGE/1000}${suffix}`});
}
export const requiresEligibility=request=>{
 const path=new URL(request.url).pathname;
 return ['/api/participate','/api/progress','/api/complete','/api/persona','/api/recovery/login','/api/recovery/create','/api/share','/api/art','/api/listing/preview','/api/listing','/api/listings','/api/interest','/api/research'].includes(path)||path.startsWith('/api/share/');
};
