import {INSTRUMENT,CONSENT,validAnswers,DIMENSIONS,QUESTIONS} from './diagnosis.mjs';
import {handleNocturne,serveShortShare,maintainNocturne} from './nocturne-service.mjs';
import {handleMetrics,maintainMetrics} from './metrics-service.mjs';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'"}});
const digest=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const capability=/^[A-Za-z0-9_-]{43}$/;
export async function readBody(request) {
  if(!request.headers.get('content-type')?.startsWith('application/json'))throw Error('content_type');
  if(Number(request.headers.get('content-length'))>4096)throw Error('body_size');
  const reader=request.body?.getReader();if(!reader)throw Error('body');let bytes=0,text='';const decoder=new TextDecoder();
  try{for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>4096){await reader.cancel();throw Error('body_size');}text+=decoder.decode(value,{stream:true});}text+=decoder.decode();return JSON.parse(text);}finally{reader.releaseLock();}
}
export function validateSubmission(b){
  const fields=['id','deletionToken','token','instrument','consent','adult','mode','answers','groups'];
  return !!b&&typeof b==='object'&&Object.keys(b).every(k=>fields.includes(k))&&uuid.test(b.id)&&capability.test(b.deletionToken)&&typeof b.token==='string'&&b.token.length>0&&b.token.length<=2048&&b.instrument===INSTRUMENT&&b.consent===CONSENT&&b.adult===true&&validAnswers(b.answers,b.mode)&&b.answers.filter(v=>v!==null).length>=12&&Array.isArray(b.groups)&&b.groups.length===4&&b.groups.every(n=>Number.isInteger(n)&&n>=0&&n<=24)&&b.groups.reduce((a,c)=>a+c,0)<=24;
}
export async function verifyTurnstile(token,env,transport=fetch){
  if(!env.TURNSTILE_SECRET)return false;
  try {const r=await transport('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:env.TURNSTILE_SECRET,response:token}),signal:AbortSignal.timeout(8000)});if(!r.ok)return false;const v=await r.json();return v.success===true&&v.hostname===new URL(env.SITE_ORIGIN).hostname&&v.action==='research';}catch{return false;}
}
export async function handleApi(request,env){
  const url=new URL(request.url),path=url.pathname;
  if(!['/api/research','/api/research/delete','/api/reference'].includes(path))return json({error:'not_found'},404);
  const method=path==='/api/reference'?'GET':'POST';if(request.method!==method)return json({error:'method'},405);
  if(!env.API_LIMIT||!env.GLOBAL_LIMIT)return json({error:'unavailable'},503);
  // Counters are approximate and per-location; D1's trigger is the exact accepted-write cap.
  const global=await env.GLOBAL_LIMIT.limit({key:'heki16-api'});if(!global.success)return json({error:'busy'},429);
  const actor=request.headers.get('CF-Connecting-IP')||'shared';
  const rate=await env.API_LIMIT.limit({key:actor+':'+path});if(!rate.success)return json({error:'wait'},429);
  if(path==='/api/reference'){
    if(env.RECOVERY_MODE&&env.RECOVERY_MODE!=='off')return json({ready:false});
    if(!env.EVIDENCE||!env.DB)return json({ready:false});
    const file=await env.EVIDENCE.get('public/current.json');if(!file)return json({ready:false});
    const p=await file.json(),revision=await env.DB.prepare('SELECT revision FROM research_state WHERE id=1').first('revision');
    if(p.instrument!==INSTRUMENT||p.revision!==revision)return json({ready:false});
    delete p.revision;return json(p);
  }
  const origin=request.headers.get('Origin');
  if(origin!==env.SITE_ORIGIN||url.origin!==env.SITE_ORIGIN||request.headers.get('Sec-Fetch-Site')==='cross-site')return json({error:'origin'},403);
  if(!env.DB)return json({error:'unavailable'},503);
  let b;try{b=await readBody(request);}catch{return json({error:'invalid_body'},400);}
  if(path.endsWith('/delete')){
    if(!b||Object.keys(b).some(k=>!['id','deletionToken'].includes(k))||!uuid.test(b.id)||!capability.test(b.deletionToken))return json({error:'invalid_request'},400);
    const hash=await digest(b.deletionToken);
    // Invalidate the aggregate first. A storage outage must not report a completed withdrawal.
    if(!env.EVIDENCE)return json({error:'unavailable'},503);
    const records=await env.DB.prepare('SELECT deletion_hash FROM diagnosis_submissions WHERE id=? UNION ALL SELECT deletion_hash FROM submissions WHERE id=?').bind(b.id,b.id).all();
    if(records.results.some(own=>own.deletion_hash!==hash))return json({error:'invalid_request'},403);
    if(records.results.length){
      // A private, answer-free tombstone survives a D1 point-in-time restore.
      await env.EVIDENCE.put('withdrawals/'+b.id+'.json',JSON.stringify({deletedAt:Date.now()}),{httpMetadata:{contentType:'application/json'}});
      await env.EVIDENCE.delete('public/current.json');await env.EVIDENCE.delete('quality/latest.json');
      await env.DB.prepare('DELETE FROM diagnosis_submissions WHERE id=? AND deletion_hash=?').bind(b.id,hash).run();
      await env.DB.prepare('DELETE FROM submissions WHERE id=? AND deletion_hash=?').bind(b.id,hash).run();
    }
    return json({deleted:true});
  }
  if(env.RESEARCH_ENABLED!=='true'||!env.TURNSTILE_SECRET)return json({error:'unavailable'},503);
  if(env.RECOVERY_MODE&&env.RECOVERY_MODE!=='off')return json({error:'unavailable'},503);
  if(!validateSubmission(b))return json({error:'invalid_request'},400);
  const deletionHash=await digest(b.deletionToken);
  const existing=await env.DB.prepare('SELECT deletion_hash FROM diagnosis_submissions WHERE id=?').bind(b.id).first();
  if(existing)return existing.deletion_hash===deletionHash?json({accepted:true}):json({error:'invalid_request'},409);
  // A new submission cannot shadow an older withdrawal capability with the same ID.
  if(await env.DB.prepare('SELECT id FROM submissions WHERE id=?').bind(b.id).first())return json({error:'invalid_request'},409);
  if(!await verifyTurnstile(b.token,env))return json({error:'verification'},403);
  const now=Date.now(),day=new Date(now).toISOString().slice(0,10);
  try{await env.DB.prepare('INSERT OR IGNORE INTO diagnosis_submissions(id,deletion_hash,instrument,consent,mode,answers,groups_json,created_at,day) VALUES(?,?,?,?,?,?,?,?,?)').bind(b.id,deletionHash,INSTRUMENT,CONSENT,b.mode,JSON.stringify(b.answers),JSON.stringify(b.groups),now,day).run();}catch(e){if(String(e).includes('daily_limit'))return json({error:'capacity'},429);throw e;}
  return json({accepted:true},201);
}
export function qualityReport(rows,now=Date.now()){
  const valid=rows.filter(r=>r.instrument===INSTRUMENT&&r.consent===CONSENT).flatMap(r=>{try{const a=JSON.parse(r.answers);return validAnswers(a,r.mode)?[{...r,a}]:[];}catch{return [];}});
  const complete=valid.filter(r=>r.a.every(v=>v!==null));
  const seen=new Set();
  const varied=complete.filter(r=>{const key=JSON.stringify(r.a);if(new Set(r.a).size<=1||seen.has(key))return false;seen.add(key);return true;});
  const cohortDays=new Set(varied.map(r=>r.day).filter(Boolean)).size;
  const itemRestById=new Map();
  const facets=DIMENSIONS.map(({id,items})=>{
    const k=items.length,n=varied.length;
    const sums=Array(k).fill(0),squares=Array(k).fill(0),itemTotals=Array(k).fill(0);let totalSum=0,totalSquare=0;
    for(const row of varied){let total=0;for(const item of items)total+=row.a[item];totalSum+=total;totalSquare+=total*total;for(let j=0;j<k;j++){const value=row.a[items[j]];sums[j]+=value;squares[j]+=value*value;itemTotals[j]+=value*total;}}
    const totalVariation=n?totalSquare-totalSum*totalSum/n:0;
    const itemVariation=sums.map((sum,j)=>n?squares[j]-sum*sum/n:0);
    const alpha=n>1&&totalVariation>1e-9?k/(k-1)*(1-itemVariation.reduce((a,b)=>a+b,0)/totalVariation):null;
    for(let j=0;j<k;j++){const covariance=n?itemTotals[j]-sums[j]*totalSum/n:0,restVariation=totalVariation+itemVariation[j]-2*covariance;const r=n>1&&itemVariation[j]>1e-9&&restVariation>1e-9?(covariance-itemVariation[j])/Math.sqrt(itemVariation[j]*restVariation):null;itemRestById.set(items[j],{...itemRestById.get(items[j]),[id]:r===null?null:Math.round(r*1000)/1000});}
    return {id,items,alpha:alpha===null?null:Math.round(alpha*1000)/1000,mean:n?Math.round(totalSum/n/k*10)/10:null};
  });
  const dimensions=facets.map(({id,mean})=>({id,mean}));
  const itemCounts=QUESTIONS.map(q=>({id:q.id,kind:q.kind,facets:DIMENSIONS.filter(d=>d.items.includes(q.id)).map(d=>d.id),asked:0,notAsked:0,answered:0,skipped:0,distribution:[0,0,0,0,0]}));
  for(const row of valid)for(const q of QUESTIONS){const stat=itemCounts[q.id];stat.asked++;const value=row.a[q.id];if(value===null)stat.skipped++;else{stat.answered++;stat.distribution[value]++;}}
  const items=QUESTIONS.map(q=>{
    const stat=itemCounts[q.id],itemRestByFacet=itemRestById.get(q.id)||{};
    const itemRest=stat.facets.length===1?itemRestByFacet[stat.facets[0]]??null:null;
    const flags=[];
    if(stat.answered>=50&&Math.max(...stat.distribution)/stat.answered>.85)flags.push('concentrated_responses');
    if(Object.values(itemRestByFacet).some(r=>r!==null&&r<0))flags.push('negative_item_rest');
    return {...stat,notAsked:valid.length-stat.asked,itemRest,itemRestByFacet,flags};
  });
  // Descriptive cohorts only. Reliability diagnostics never auto-retune the creative types.
  const eligible=varied.length>=200&&cohortDays>=7&&facets.every(d=>d.mean!==null)&&complete.length>0&&(complete.length-varied.length)/complete.length<=.2;
  return {instrument:INSTRUMENT,checkedAt:new Date(now).toISOString(),records:valid.length,complete:complete.length,usable:varied.length,cohortDays,dimensions,facets,items,eligible,status:eligible?'reference_only':varied.length<200||cohortDays<7?'insufficient_data':'quality_hold',window:'latest-140-per-day-within-14-days'};
}
export async function runMaintenance(env,now=Date.now()){
  const day=new Date(now).toISOString().slice(0,10);
  try{
    if(env.RECOVERY_MODE&&env.RECOVERY_MODE!=='off'){
      if(!uuid.test(env.RECOVERY_MODE))throw Error('invalid_recovery_session');
      await env.EVIDENCE.delete('public/current.json');
      const key='recovery/'+env.RECOVERY_MODE+'.json',file=await env.EVIDENCE.get(key),saved=file?await file.json():{};
      let done=saved.done===true;
      if(!done){
        const page=await env.EVIDENCE.list({prefix:'withdrawals/',limit:1000,...(saved.cursor?{cursor:saved.cursor}:{})});
        const ids=page.objects.map(object=>object.key.slice(12,-5)).filter(id=>uuid.test(id));
        const deletes=[];
        for(let i=0;i<ids.length;i+=100){const chunk=ids.slice(i,i+100);for(const table of ['submissions','diagnosis_submissions'])deletes.push(env.DB.prepare('DELETE FROM '+table+' WHERE id IN ('+chunk.map(()=>'?').join(',')+')').bind(...chunk));}
        if(deletes.length)await env.DB.batch(deletes);
        done=!page.truncated;
        await env.EVIDENCE.put(key,JSON.stringify({done,cursor:page.truncated?page.cursor:null,checkedAt:now}));
      }
      const status=done?'recovery_complete':'recovery_pending';
      await env.DB.prepare('INSERT INTO maintenance(day,status,checked_at) VALUES(?,?,?) ON CONFLICT(day) DO UPDATE SET status=excluded.status,checked_at=excluded.checked_at').bind(day,status,now).run();
      return {status};
    }
    await env.DB.prepare('DELETE FROM submissions WHERE created_at<?').bind(now-180*86400000).run();
    await env.DB.prepare('DELETE FROM diagnosis_submissions WHERE created_at<?').bind(now-180*86400000).run();
    await env.DB.prepare('DELETE FROM daily_quota WHERE day<?').bind(new Date(now-30*86400000).toISOString().slice(0,10)).run();
    await env.DB.prepare('DELETE FROM maintenance WHERE day<?').bind(new Date(now-30*86400000).toISOString().slice(0,10)).run();
    const days=Array.from({length:14},(_,i)=>new Date(now-i*86400000).toISOString().slice(0,10));
    const snapshot=await env.DB.batch([env.DB.prepare('SELECT revision FROM research_state WHERE id=1'),...days.map(day=>env.DB.prepare('SELECT instrument,consent,mode,answers,day FROM diagnosis_submissions WHERE day=? AND instrument=? AND consent=? ORDER BY created_at DESC LIMIT 140').bind(day,INSTRUMENT,CONSENT))]);
    const revision=snapshot[0].results[0].revision,results=snapshot.slice(1).flatMap(r=>r.results);
    const report=qualityReport(results,now);
    await env.EVIDENCE.put('quality/latest.json',JSON.stringify(report),{httpMetadata:{contentType:'application/json'}});
    if(report.eligible)await env.EVIDENCE.put('public/current.json',JSON.stringify({ready:true,revision,instrument:INSTRUMENT,updatedAt:report.checkedAt,responsesAtLeast:Math.floor(report.usable/50)*50,dimensions:report.dimensions.map(({id,mean})=>({id,mean})),scope:'同意して提供された回答の参考値。同一人物による複数回答の可能性があり、一般人口の割合や相性の成功率ではありません。'}),{httpMetadata:{contentType:'application/json'}});
    else await env.EVIDENCE.delete('public/current.json');
    await env.DB.prepare('INSERT INTO maintenance(day,status,checked_at) VALUES(?,?,?) ON CONFLICT(day) DO UPDATE SET status=excluded.status,checked_at=excluded.checked_at').bind(day,report.status,now).run();
    return report;
  }catch(e){
    // Remove possibly stale reference after failed recomputation.
    await env.EVIDENCE.delete('public/current.json').catch(()=>{});
    await env.DB.prepare('INSERT INTO maintenance(day,status,checked_at) VALUES(?,?,?) ON CONFLICT(day) DO UPDATE SET status=excluded.status,checked_at=excluded.checked_at').bind(day,'failed',now).run().catch(()=>{});
    throw e;
  }
}
export default {
  async fetch(request,env){try{
    const url=new URL(request.url),path=url.pathname;
    // Keep existing host-only sessions usable without allowing cross-origin requests.
    if(env.LEGACY_SITE_ORIGIN&&url.origin===env.LEGACY_SITE_ORIGIN)env={...env,PUBLIC_SITE_ORIGIN:env.SITE_ORIGIN,SITE_ORIGIN:env.LEGACY_SITE_ORIGIN};
    if(path==='/api/metrics')return await handleMetrics(request,env);if(path.startsWith('/s/'))return await serveShortShare(request,env);if(path.startsWith('/api/'))return await handleNocturne(request,env,verifyTurnstile)||await handleApi(request,env);return await env.ASSETS.fetch(request);
  }catch(e){return json({error:String(e).includes('nocturne_capacity')?'wait':'unavailable'},String(e).includes('nocturne_capacity')?429:503);}},
  async scheduled(event,env,ctx){ctx.waitUntil(Promise.all([runMaintenance(env),maintainNocturne(env),maintainMetrics(env)]));}
};
