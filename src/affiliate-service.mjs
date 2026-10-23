import config from '../config/monetization.json' with {type:'json'};
import {validateAffiliateConfig,REGISTERED_MEDIA_URL} from './affiliate-config.mjs';
import {ELIGIBILITY_POLICY} from './affiliate-core.mjs';
import {eligibilityStatus} from './eligibility-service.mjs';

const headers = {'Cache-Control':'no-store', 'Referrer-Policy':'no-referrer', 'X-Content-Type-Options':'nosniff', 'X-Robots-Tag':'noindex, nofollow', 'Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'; base-uri 'none'"};
const unavailable = (status=503) => new Response('<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>広告の案内</title><h1>この広告は開けません</h1><p>年齢の確認、広告の掲載状況、または通信をご確認ください。診断の結果はそのまま利用できます。</p><a href="/">KUSEIROへ戻る</a></html>',{status,headers:{...headers,'Content-Type':'text/html; charset=utf-8'}});
export const DELIVERY_CONTROL_KEY='operations/affiliate-delivery.json';
export async function stopAffiliateForRecovery(env,now=Date.now()) {
 await env.EVIDENCE.put(DELIVERY_CONTROL_KEY,JSON.stringify({v:1,enabled:false,updatedAt:now}));
 await env.DB.prepare("UPDATE nocturne_delivery_controls SET enabled=0,updated_at=? WHERE name='affiliate'").bind(now).run();
}

async function boundedForm(request) {
 if (!request.headers.get('Content-Type')?.startsWith('application/x-www-form-urlencoded')) return null;
 if (Number(request.headers.get('Content-Length')||0)>256 || !request.body) return null;
 const reader=request.body.getReader(),chunks=[];let length=0;
 try {for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>256){await reader.cancel();return null;}chunks.push(value);}} finally {reader.releaseLock();}
 const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 const form=new URLSearchParams(new TextDecoder().decode(bytes));
 return [...form.keys()].length===1&&form.get('eligibility')===ELIGIBILITY_POLICY;
}

export async function handleAffiliate(request,env,settings=config,now=Date.now()) {
 const url=new URL(request.url),status=url.pathname==='/api/promotions/status',outbound=/^\/out\/([a-z0-9-]{1,48})$/.exec(url.pathname);
 if(!status&&!url.pathname.startsWith('/out/'))return null;
 const local=env.LOCAL_TEST_MODE==='true'&&/^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/.test(env.SITE_ORIGIN||'');
 const approvedOrigin=local?env.SITE_ORIGIN:new URL(REGISTERED_MEDIA_URL).origin;
 if(url.origin!==approvedOrigin||env.SITE_ORIGIN!==approvedOrigin||url.search||request.headers.get('Sec-Fetch-Site')==='cross-site')return unavailable(403);
 if(request.method!==(status?'GET':'POST'))return unavailable(405);
 // Native noreferrer forms can send Origin:null. Fetch metadata must then prove same-origin.
 const sameOrigin=request.headers.get('Origin')===env.SITE_ORIGIN||(request.headers.get('Origin')==='null'&&request.headers.get('Sec-Fetch-Site')==='same-origin');
 if(!status&&(!outbound||!sameOrigin))return unavailable(403);
 let offers=[];
 try {
  if(!env.DB||!env.EVIDENCE||!env.API_LIMIT||!env.GLOBAL_LIMIT)throw Error('unavailable');
  const actor=request.headers.get('CF-Connecting-IP')||'shared';
  if(!(await env.GLOBAL_LIMIT.limit({key:'affiliate'})).success||!(await env.API_LIMIT.limit({key:'affiliate:'+actor})).success)return unavailable(429);
  if(env.AFFILIATE_ENABLED!=='false'&&(!env.RECOVERY_MODE||env.RECOVERY_MODE==='off')){
   offers=validateAffiliateConfig(settings,now);
   if(offers.length){
    const file=await env.EVIDENCE.get(DELIVERY_CONTROL_KEY),control=file?await file.json():null;
    if(control?.v!==1||control.enabled!==true||!Number.isFinite(control.updatedAt)||control.updatedAt>now||(await env.DB.prepare("SELECT enabled FROM nocturne_delivery_controls WHERE name='affiliate'").first('enabled'))!==1)offers=[];
   }
  }
 }catch{return status?Response.json({enabled:false},{headers}):unavailable();}
 if(status)return Response.json({enabled:offers.length>0},{headers});
 const campaign=offers.find(item=>item.id===outbound[1]);
 if(!campaign)return unavailable();
 if(!await boundedForm(request)||!await eligibilityStatus(request,env,now))return unavailable(403);
 // No cookie, account, answer, or confirmation is recorded or forwarded.
 return new Response(null,{status:303,headers:{...headers,Location:campaign.url}});
}
