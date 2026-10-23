import {CHOICE_POLICY,REQUIRED_ENTRY_POLICY} from './consent.mjs';
import {stopAffiliateForRecovery} from './affiliate-service.mjs';
import {validArt,artSource,preferredArt} from './art.mjs';
import {sharePreviewUrl} from './x-share.mjs';
import {diagnose as version3Diagnose,validAnswers as version3ValidAnswers} from './nocturne-v3.mjs';
import {visibleCard,firstMissingChoice} from './presentation.mjs';
import {diagnose as version2Diagnose,validAnswers as version2ValidAnswers} from './nocturne-v2.mjs';
import {diagnose as previousDiagnose,validAnswers as previousValidAnswers} from './nocturne-v1.mjs';
import {INSTRUMENT,PREVIOUS_INSTRUMENT,CONSENT,PREVIOUS_CONSENT,SCENES,FACETS,MOODS,AGES,GENDERS,PROFILE_OPTIONS,validAnswers,emptyAnswers,diagnose,publicCard,listingCard,validCard,compare} from './nocturne.mjs';
const supported=[INSTRUMENT,'nocturne24-3','nocturne24-2',PREVIOUS_INSTRUMENT];
export const PUBLICATION_POLICY='nocturne-listing-2026-10-21';
const modelFor=instrument=>instrument===PREVIOUS_INSTRUMENT?{diagnose:previousDiagnose,validAnswers:previousValidAnswers}:instrument==='nocturne24-2'?{diagnose:version2Diagnose,validAnswers:version2ValidAnswers}:instrument==='nocturne24-3'?{diagnose:version3Diagnose,validAnswers:version3ValidAnswers}:{diagnose,validAnswers};
const DAY=86400000,UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,KEY=/^[A-Za-z0-9_-]{43}$/,ID=/^[A-Za-z0-9_-]{16}$/;
const paths=new Set(['/api/config','/api/account','/api/blocks','/api/unblock','/api/participate','/api/progress','/api/complete','/api/persona','/api/recovery/create','/api/recovery/login','/api/logout','/api/account/delete','/api/record/delete','/api/share','/api/shares','/api/art','/api/share/revoke','/api/listing/preview','/api/listing/preference','/api/listings','/api/listing','/api/interest','/api/block','/api/report']);
const reply=(value,status=200,headers={})=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'",...headers}});
const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,'0')).join('');
const random=n=>btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(n)))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const loopback=env=>/^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/.test(env.SITE_ORIGIN||'')&&env.LOCAL_TEST_MODE==='true';
const cookieName=env=>new URL(env.SITE_ORIGIN).protocol==='https:'?'__Host-nocturne':'nocturne';
const cookie=(token,env,clear=false)=>`${cookieName(env)}=${clear?'':token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${clear?0:30*86400}${env.SITE_ORIGIN.startsWith('https:')?'; Secure':''}`;
const keys=(b,allowed)=>b&&typeof b==='object'&&!Array.isArray(b)&&Object.keys(b).every(k=>allowed.includes(k));
const validPersona=p=>keys(p,['age','gender'])&&Object.hasOwn(AGES,p.age)&&Object.hasOwn(GENDERS,p.gender);
const validContext=c=>keys(c,['timeframe','mood','timeBand'])&&['recent','now'].includes(c.timeframe)&&Object.hasOwn(MOODS,c.mood)&&['morning','afternoon','evening','night','unset'].includes(c.timeBand);
async function body(request){
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw Error('body');
  const reader=request.body?.getReader();if(!reader)throw Error('body');let size=0,value='';const decoder=new TextDecoder();
  try{for(;;){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>8192){await reader.cancel();throw Error('size');}value+=decoder.decode(part.value,{stream:true});}return JSON.parse(value+decoder.decode());}finally{reader.releaseLock();}
}
async function account(request,env,now){
  const token=(request.headers.get('Cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName(env)+'='))?.slice(cookieName(env).length+1);
  if(!KEY.test(token||''))return null;
  return env.DB.prepare('SELECT a.id,a.recovery_hash,a.listing_preference,a.listing_revision,a.listing_choice_policy,a.moderation_hold,s.token_hash,s.created_at AS session_created FROM nocturne_sessions s JOIN nocturne_accounts a ON a.id=s.account_id WHERE s.token_hash=? AND s.expires_at>?').bind(await hash(token),now).first();
}
async function record(env,id,owner){return UUID.test(id||'')?env.DB.prepare('SELECT * FROM nocturne_records WHERE id=? AND account_id=?').bind(id,owner).first():null;}
function presentRecord(row){return {id:row.id,instrument:row.instrument,answers:JSON.parse(row.answers),dwell:JSON.parse(row.dwell),visited:row.visited,cursor:row.cursor,revision:row.revision,context:{timeframe:row.timeframe,mood:row.mood,timeBand:row.time_band},persona:{age:row.age,gender:row.gender},createdAt:row.created_at,completedAt:row.completed_at,profile:row.profile?JSON.parse(row.profile):null,entryPolicy:row.entry_policy||null,firstPublishedAt:row.first_published_at||null};}
async function latest(env,owner){return env.DB.prepare('SELECT * FROM nocturne_records WHERE account_id=? AND completed_at IS NOT NULL AND instrument IN (?,?,?,?) ORDER BY completed_at DESC LIMIT 1').bind(owner,...supported).first();}
async function verification(b,request,env,verify){return loopback(env)&&new URL(request.url).origin===env.SITE_ORIGIN&&b.token==='local-test-only'||typeof b.token==='string'&&b.token.length<=2048&&await verify(b.token,env);}
async function makeSession(env,owner,now){const token=random(32);await env.DB.batch([env.DB.prepare('INSERT INTO nocturne_sessions(token_hash,account_id,created_at,expires_at) VALUES(?,?,?,?)').bind(await hash(token),owner,now,now+30*DAY),env.DB.prepare('DELETE FROM nocturne_sessions WHERE account_id=? AND token_hash NOT IN (SELECT token_hash FROM nocturne_sessions WHERE account_id=? ORDER BY created_at DESC LIMIT 10)').bind(owner,owner)]);return token;}
async function blocked(env,a,b){return !!await env.DB.prepare('SELECT 1 AS blocked FROM nocturne_blocks WHERE (actor=? AND target=?) OR (actor=? AND target=?) LIMIT 1').bind(a,b,b,a).first();}
async function targetListing(env,id,owner,now){if(!ID.test(id||''))return null;const row=await env.DB.prepare('SELECT * FROM nocturne_listings WHERE id=? AND expires_at>? AND hidden=0 AND account_id NOT IN (SELECT id FROM nocturne_accounts WHERE moderation_hold=1) AND account_id<>?').bind(id,now,owner).first();return row&&!await blocked(env,owner,row.account_id)?row:null;}
async function invalidate(env){if(env.EVIDENCE)await env.EVIDENCE.delete('owner/nocturne-current.json');}

export async function handleNocturne(request,env,verify){
  const url=new URL(request.url),path=url.pathname,shareGet=/^\/api\/share\/[A-Za-z0-9_-]{16}$/.test(path);
  if(!paths.has(path)&&!shareGet)return null;
  if(!env.DB||!env.API_LIMIT||!env.GLOBAL_LIMIT)return reply({error:'unavailable'},503);
  const get=['/api/config','/api/account','/api/listings','/api/blocks','/api/shares'].includes(path)||shareGet;
  if(request.method!==(get?'GET':'POST'))return reply({error:'method'},405);
  if(url.origin!==env.SITE_ORIGIN||request.headers.get('Sec-Fetch-Site')==='cross-site'||!get&&(request.headers.get('Origin')!==env.SITE_ORIGIN||request.headers.get('X-Nocturne')!=='1'))return reply({error:'origin'},403);
  if(env.RECOVERY_MODE&&env.RECOVERY_MODE!=='off')return reply({error:'unavailable'},503);
  const global=await env.GLOBAL_LIMIT.limit({key:'nocturne'}),actor=request.headers.get('CF-Connecting-IP')||'shared';
  if(!global.success||!(await env.API_LIMIT.limit({key:actor+':'+path.replace(/\/[A-Za-z0-9_-]{16}$/,'/:id')})).success)return reply({error:'wait'},429);
  if(path==='/api/config')return reply({localTest:loopback(env),instrument:INSTRUMENT});
  if(shareGet){const row=await env.DB.prepare('SELECT card FROM nocturne_shares WHERE id=? AND expires_at>? AND revoked_at IS NULL').bind(path.split('/').pop(),Date.now()).first();return row?reply({card:JSON.parse(row.card)}):reply({error:'not_found'},404);}
  const now=Date.now();let who=await account(request,env,now),b={};
  if(path!=='/api/recovery/login'&&!(path==='/api/logout'&&!who)&&request.headers.has('X-Nocturne-Scope')&&request.headers.get('X-Nocturne-Scope')!==who?.id)return reply({error:'sign_in'},409);
  if(!get){try{b=await body(request);}catch{return reply({error:'invalid_body'},400);}}
  if(path==='/api/logout'&&!who){if((!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).length!==0))return reply({error:'invalid_body'},400);return reply({signedIn:false},200,{'Set-Cookie':cookie('',env,true)});}
  if(!get&&env.RESEARCH_ENABLED!=='true'&&!['/api/account/delete','/api/record/delete','/api/logout','/api/share/revoke','/api/listing/preference','/api/block','/api/unblock','/api/report'].includes(path)&&!(path==='/api/listing'&&b.publish===false))return reply({error:'unavailable'},503);
  if(path==='/api/account'){
    if(!who)return reply({signedIn:false});
    const rows=await env.DB.prepare('SELECT * FROM nocturne_records WHERE account_id=? AND instrument IN (?,?,?,?) ORDER BY created_at DESC LIMIT 30').bind(who.id,...supported).all();
    const listing=await env.DB.prepare('SELECT id,card,intent,age,gender,expires_at,hidden,revision,record_id FROM nocturne_listings WHERE account_id=?').bind(who.id).first();
    const mutual=await env.DB.prepare('SELECT p.id,p.card FROM nocturne_interests i JOIN nocturne_interests j ON j.actor=i.target AND j.target=i.actor JOIN nocturne_listings p ON p.account_id=i.target JOIN nocturne_listings own ON own.account_id=i.actor WHERE i.actor=? AND p.hidden=0 AND own.hidden=0 AND i.actor NOT IN (SELECT id FROM nocturne_accounts WHERE moderation_hold=1) AND i.target NOT IN (SELECT id FROM nocturne_accounts WHERE moderation_hold=1) AND p.expires_at>? AND own.expires_at>? AND NOT EXISTS(SELECT 1 FROM nocturne_blocks b WHERE (b.actor=i.actor AND b.target=i.target) OR (b.actor=i.target AND b.target=i.actor)) LIMIT 30').bind(who.id,now,now).all();
    const confirmedPublication=who.listing_choice_policy===CHOICE_POLICY||!!await env.DB.prepare('SELECT 1 AS confirmed FROM nocturne_publication_consents WHERE account_id=? AND revision=? AND policy=?').bind(who.id,who.listing_revision,PUBLICATION_POLICY).first();
    return reply({signedIn:true,scope:who.id,hasRecovery:!!who.recovery_hash,records:rows.results.map(presentRecord),listing:listing?{...listing,card:JSON.parse(listing.card),status:listing.hidden||who.moderation_hold?'hidden':listing.expires_at<=now?'expired':'live'}:null,publication:{preference:who.listing_preference===null?null:!!who.listing_preference,revision:who.listing_revision,policy:PUBLICATION_POLICY,choicePolicy:confirmedPublication?CHOICE_POLICY:null},mutual:mutual.results.map(r=>({id:r.id,card:JSON.parse(r.card)}))});
  }
  if(path==='/api/recovery/login'){
    if(!keys(b,['key','token'])||!KEY.test(b.key||''))return reply({error:'invalid_request'},400);
    if(!await verification(b,request,env,verify))return reply({error:'verification'},403);
    const found=await env.DB.prepare('SELECT id FROM nocturne_accounts WHERE recovery_hash=?').bind(await hash(b.key)).first();
    if(!found)return reply({error:'not_found'},404);
    const token=await makeSession(env,found.id,now);await env.DB.prepare('UPDATE nocturne_accounts SET last_seen=? WHERE id=?').bind(now,found.id).run();
    return reply({signedIn:true},200,{'Set-Cookie':cookie(token,env)});
  }
  if(path==='/api/participate'){
    if(!keys(b,['id','instrument','consent','adult','context','persona','token','choicePolicy','entryPolicy'])||!UUID.test(b.id||'')||!supported.includes(b.instrument||PREVIOUS_INSTRUMENT)||![CONSENT,PREVIOUS_CONSENT].includes(b.consent)||b.adult!==true||b.choicePolicy!==undefined&&b.choicePolicy!==CHOICE_POLICY||b.entryPolicy!==undefined&&b.entryPolicy!==REQUIRED_ENTRY_POLICY||b.entryPolicy===REQUIRED_ENTRY_POLICY&&b.choicePolicy!==CHOICE_POLICY||!validPersona(b.persona)||!validContext(b.context)||firstMissingChoice({age:b.persona?.age,gender:b.persona?.gender,mood:b.context?.mood},PROFILE_OPTIONS))return reply({error:'invalid_request'},400);
    const instrument=b.instrument||PREVIOUS_INSTRUMENT;
    let token=null,pending=[];
    if(!who){
      if(!await verification(b,request,env,verify))return reply({error:'verification'},403);
      const owner=crypto.randomUUID();token=random(32);
      pending=[
        env.DB.prepare('INSERT INTO nocturne_accounts(id,created_at,last_seen) VALUES(?,?,?)').bind(owner,now,now),
        env.DB.prepare('INSERT INTO nocturne_sessions(token_hash,account_id,created_at,expires_at) VALUES(?,?,?,?)').bind(await hash(token),owner,now,now+30*DAY)
      ];who={id:owner};
    }
    const existing=await record(env,b.id,who.id);
    if(existing&&existing.instrument!==instrument)return reply({error:'conflict'},409);
    if(!existing){
      const conflict=await env.DB.prepare('SELECT id FROM nocturne_records WHERE id=?').bind(b.id).first();if(conflict)return reply({error:'conflict'},409);
      pending.push(env.DB.prepare('INSERT INTO nocturne_records(id,account_id,instrument,consent,answers,dwell,timeframe,mood,age,gender,time_band,created_at,last_seen,choice_policy,entry_policy) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(b.id,who.id,instrument,b.consent,JSON.stringify(emptyAnswers()),JSON.stringify(Array(24).fill(0)),b.context.timeframe,b.context.mood,b.persona.age,b.persona.gender,b.context.timeBand,now,now,b.choicePolicy||null,b.entryPolicy||null));
      await env.DB.batch(pending);
    }
    return reply({accepted:true,id:b.id,scope:who.id},201,token?{'Set-Cookie':cookie(token,env)}:{});
  }
  if(!who)return reply({error:'sign_in'},401);
  if(path==='/api/blocks'||path==='/api/unblock'){
    const rows=await env.DB.prepare('SELECT b.target,p.card FROM nocturne_blocks b LEFT JOIN nocturne_listings p ON p.account_id=b.target WHERE b.actor=? ORDER BY b.created_at DESC LIMIT 100').bind(who.id).all();
    const items=await Promise.all(rows.results.map(async r=>({id:(await hash(who.id+':'+r.target)).slice(0,16),target:r.target,title:r.card?JSON.parse(r.card).title:'以前、非表示にしたカルテ'})));
    if(path==='/api/blocks')return reply({items:items.map(({id,title})=>({id,title}))});
    if(!keys(b,['id'])||!/^[a-f0-9]{16}$/.test(b.id||''))return reply({error:'invalid_request'},400);
    const found=items.find(i=>i.id===b.id);if(!found)return reply({error:'not_found'},404);
    await env.DB.prepare('DELETE FROM nocturne_blocks WHERE actor=? AND target=?').bind(who.id,found.target).run();return reply({unblocked:true});
  }
  if(path==='/api/logout'){
    if(!keys(b,[]))return reply({error:'invalid_request'},400);
    await env.DB.prepare('DELETE FROM nocturne_sessions WHERE token_hash=?').bind(who.token_hash).run();return reply({signedIn:false},200,{'Set-Cookie':cookie('',env,true)});
  }
  if(path==='/api/recovery/create'){
    if(!keys(b,[]))return reply({error:'invalid_request'},400);
    if(who.recovery_hash)return reply({error:'already_created'},409);
    const key=random(32),updated=await env.DB.prepare('UPDATE nocturne_accounts SET recovery_hash=? WHERE id=? AND recovery_hash IS NULL').bind(await hash(key),who.id).run();
    return updated.meta.changes?reply({key}):reply({error:'already_created'},409);
  }
  if(path==='/api/progress'||path==='/api/complete'){
    if(!keys(b,['id','answers','dwell','visited','cursor','revision'])||!UUID.test(b.id||'')||!Array.isArray(b.answers)||b.answers.length!==24||!Array.isArray(b.dwell)||b.dwell.length!==24||b.dwell.some(v=>!Number.isInteger(v)||v<0||v>1800000)||!Number.isInteger(b.visited)||b.visited<0||b.visited>16777215||!Number.isInteger(b.cursor)||b.cursor<0||b.cursor>=24||!Number.isInteger(b.revision)||b.revision<1||b.revision>10000)return reply({error:'invalid_request'},400);
    const own=await record(env,b.id,who.id);if(!own)return reply({error:'not_found'},404);
    if(!modelFor(own.instrument).validAnswers(b.answers))return reply({error:'invalid_request'},400);
    if(path==='/api/complete'&&(b.visited!==16777215||b.cursor!==23))return reply({error:'invalid_request'},400);
    if(own.completed_at)return path==='/api/complete'&&own.answers===JSON.stringify(b.answers)?reply({saved:true,profile:JSON.parse(own.profile)}):reply({error:'already_complete'},409);
    if(b.revision<=own.revision)return reply({error:'conflict',revision:own.revision},409);
    const profile=path==='/api/complete'?modelFor(own.instrument).diagnose(b.answers,own.gender):null;if(profile&&own.entry_policy===REQUIRED_ENTRY_POLICY&&profile.answered<12)return reply({error:'complete_first'},409);
    const updated=await env.DB.prepare('UPDATE nocturne_records SET answers=?,dwell=?,visited=?,cursor=?,revision=?,last_seen=?,completed_at=?,profile=? WHERE id=? AND account_id=? AND revision<? AND completed_at IS NULL').bind(JSON.stringify(b.answers),JSON.stringify(b.dwell),b.visited,b.cursor,b.revision,now,profile?now:null,profile?JSON.stringify(profile):null,b.id,who.id,b.revision).run();
    if(!updated.meta?.changes){const stored=await record(env,b.id,who.id);if(path==='/api/complete'&&stored?.completed_at&&stored.answers===JSON.stringify(b.answers))return reply({saved:true,profile:JSON.parse(stored.profile),revision:stored.revision});return reply({error:'conflict',revision:stored?.revision},409);}
    await env.DB.prepare('UPDATE nocturne_accounts SET last_seen=? WHERE id=?').bind(now,who.id).run();
    return reply({saved:true,revision:b.revision,...(profile?{profile}:{})});
  }
  if(path==='/api/persona'){
    if(!keys(b,['id','persona'])||!validPersona(b.persona)||!Object.hasOwn(PROFILE_OPTIONS.age,b.persona.age)||!Object.hasOwn(PROFILE_OPTIONS.gender,b.persona.gender))return reply({error:'invalid_request'},400);
    const own=await record(env,b.id,who.id);if(!own)return reply({error:'not_found'},404);
    await env.DB.prepare('UPDATE nocturne_records SET age=?,gender=? WHERE id=? AND account_id=?').bind(b.persona.age,b.persona.gender,b.id,who.id).run();await invalidate(env);return reply({saved:true});
  }
  if(path==='/api/record/delete'||path==='/api/account/delete'){
    if(!env.EVIDENCE)return reply({error:'unavailable'},503);
    if(path==='/api/account/delete'){
      if(!keys(b,['confirm'])||b.confirm!=='delete-my-records')return reply({error:'invalid_request'},400);
      await env.EVIDENCE.put('nocturne-withdrawals/'+who.id+'.json',JSON.stringify({deletedAt:now}));await invalidate(env);
      await env.DB.prepare('DELETE FROM nocturne_accounts WHERE id=?').bind(who.id).run();return reply({deleted:true},200,{'Set-Cookie':cookie('',env,true)});
    }
    if(!keys(b,['id'])||!UUID.test(b.id||''))return reply({error:'invalid_request'},400);
    if(!await record(env,b.id,who.id))return reply({error:'not_found'},404);
    await env.EVIDENCE.put('nocturne-record-withdrawals/'+b.id+'.json',JSON.stringify({deletedAt:now}));await invalidate(env);
    // Listings and shares are independent, explicitly published snapshots. Account deletion revokes both.
    await env.DB.prepare('DELETE FROM nocturne_records WHERE id=? AND account_id=?').bind(b.id,who.id).run();return reply({deleted:true});
  }
  if(path==='/api/share'){
    if(!keys(b,['id','tags','personal','nameOnly','art'])||b.art!==undefined&&!validArt(b.art)||b.nameOnly!==undefined&&typeof b.nameOnly!=='boolean'||!UUID.test(b.id||'')||!Array.isArray(b.tags)||b.tags.length>3||b.tags.some(s=>typeof s!=='string'||!s.trim()||s.length>24||/[<>\u0000-\u001f]/.test(s))||b.personal!==undefined&&(typeof b.personal!=='string'||b.personal.length>160||/[<>\u0000-\u001f]/.test(b.personal)))return reply({error:'invalid_request'},400);
    const own=await record(env,b.id,who.id);if(!own?.profile)return reply({error:'not_found'},404);if(own.entry_policy===REQUIRED_ENTRY_POLICY&&!own.first_published_at)return reply({error:'publish_first'},409);
    const card=visibleCard(publicCard(JSON.parse(own.profile),b.tags.map(t=>t.trim()),b.personal?.trim(),b.art),b.nameOnly===true);if(!validCard(card))return reply({error:'invalid_request'},400);
    const encoded=JSON.stringify(card),digest=await hash(encoded),saved=await env.DB.prepare('SELECT id FROM nocturne_shares WHERE account_id=? AND digest=? AND expires_at>? AND revoked_at IS NULL').bind(who.id,digest,now).first();
    if(saved)return reply({url:(env.PUBLIC_SITE_ORIGIN||env.SITE_ORIGIN)+'/s/'+saved.id});
    const id=random(12);await env.DB.prepare('DELETE FROM nocturne_shares WHERE account_id=? AND digest=? AND (expires_at<=? OR revoked_at IS NOT NULL)').bind(who.id,digest,now).run();
    await env.DB.prepare('INSERT INTO nocturne_shares(id,account_id,digest,card,created_at,expires_at) VALUES(?,?,?,?,?,?)').bind(id,who.id,digest,encoded,now,now+90*DAY).run();return reply({url:(env.PUBLIC_SITE_ORIGIN||env.SITE_ORIGIN)+'/s/'+id},201);
  }
  if(path==='/api/art'){
    if(!keys(b,['id','art'])||!UUID.test(b.id||'')||!validArt(b.art))return reply({error:'invalid_request'},400);
    const own=await record(env,b.id,who.id);if(!own?.profile)return reply({error:'not_found'},404);
    await env.DB.prepare("UPDATE nocturne_records SET profile=json_set(profile,'$.art',?) WHERE id=? AND account_id=? AND completed_at IS NOT NULL").bind(b.art,b.id,who.id).run();return reply({saved:true,art:b.art});
  }
  if(path==='/api/shares'){
    const rows=await env.DB.prepare('SELECT id,card,created_at,expires_at,revoked_at FROM nocturne_shares WHERE account_id=? ORDER BY created_at DESC LIMIT 30').bind(who.id).all();
    return reply({items:rows.results.map(r=>({...r,card:JSON.parse(r.card)}))});
  }
  if(path==='/api/share/revoke'){
    if(!keys(b,['id'])||!ID.test(b.id||''))return reply({error:'invalid_request'},400);
    const own=await env.DB.prepare('SELECT id FROM nocturne_shares WHERE id=? AND account_id=?').bind(b.id,who.id).first();if(!own)return reply({error:'not_found'},404);
    if(!env.EVIDENCE)return reply({error:'unavailable'},503);
    await env.EVIDENCE.put('nocturne-share-withdrawals/'+b.id+'.json',JSON.stringify({deletedAt:now}));
    await env.DB.prepare('UPDATE nocturne_shares SET revoked_at=? WHERE id=? AND account_id=?').bind(now,b.id,who.id).run();return reply({revoked:true});
  }
  if(path==='/api/listing/preference'){
    if(!keys(b,['enabled','expectedRevision','choicePolicy'])||typeof b.enabled!=='boolean'||!Number.isInteger(b.expectedRevision)||b.choicePolicy!==undefined&&b.choicePolicy!==CHOICE_POLICY)return reply({error:'invalid_request'},400);
    const updated=await env.DB.prepare('UPDATE nocturne_accounts SET listing_preference=?,listing_revision=listing_revision+1,listing_choice_policy=?,listing_choice_at=? WHERE id=? AND listing_revision=?').bind(Number(b.enabled),b.choicePolicy||null,b.choicePolicy?now:null,who.id,b.expectedRevision).run();
    return updated.meta?.changes?reply({saved:true,revision:b.expectedRevision+1,preference:b.enabled,choicePolicy:b.choicePolicy||null}):reply({error:'conflict'},409);
  }
  if(path==='/api/listing'&&b.publish===false){
    if(!keys(b,['publish','expectedRevision'])||b.expectedRevision!==undefined&&!Number.isInteger(b.expectedRevision))return reply({error:'invalid_request'},400);
    const expected=b.expectedRevision??who.listing_revision;
    const results=await env.DB.batch([
      env.DB.prepare('UPDATE nocturne_accounts SET listing_preference=0,listing_revision=listing_revision+1 WHERE id=? AND listing_revision=?').bind(who.id,expected),
      env.DB.prepare('DELETE FROM nocturne_listings WHERE account_id=? AND changes()=1').bind(who.id),
      env.DB.prepare('DELETE FROM nocturne_interests WHERE (actor=? OR target=?) AND changes()=1').bind(who.id,who.id)
    ]);
    if(!results[0].meta?.changes)return reply({error:'conflict'},409);
    return reply({published:false,revision:expected+1});
  }
  if(path==='/api/listing'||path==='/api/listing/preview'){
    if(!keys(b,['publish','recordId','intent','showAge','showGender','art','digest','policy','expectedRevision'])||path==='/api/listing'&&b.publish!==true||!['similar','complement','any'].includes(b.intent)||typeof b.showAge!=='boolean'||typeof b.showGender!=='boolean'||b.art!==undefined&&!validArt(b.art))return reply({error:'invalid_request'},400);
    const own=await record(env,b.recordId,who.id);if(!own?.completed_at||!own.profile||JSON.parse(own.profile).answered<12)return reply({error:'complete_first'},409);
    const old=await env.DB.prepare('SELECT * FROM nocturne_listings WHERE account_id=?').bind(who.id).first();
    const reports=await env.DB.prepare('SELECT COUNT(*) AS n FROM nocturne_reports WHERE target=?').bind(who.id).first('n');
    const held=await env.DB.prepare('SELECT moderation_hold FROM nocturne_accounts WHERE id=?').bind(who.id).first('moderation_hold');if(old?.hidden||held||reports>=3)return reply({error:'review_pending'},403);
    const card=listingCard(JSON.parse(own.profile),b.art),age=b.showAge?own.age:'unset',gender=b.showGender?own.gender:'unset';
    const digest=await hash(JSON.stringify({card,intent:b.intent,age,gender}));
    if(path==='/api/listing/preview')return reply({card,intent:b.intent,age,gender,digest,policy:PUBLICATION_POLICY,revision:who.listing_revision});
    if(b.policy!==PUBLICATION_POLICY||b.digest!==digest||!Number.isInteger(b.expectedRevision))return reply({error:'conflict'},409);
    const priorReceipt=async()=>env.DB.prepare('SELECT p.id,p.card,p.revision,p.expires_at FROM nocturne_listings p JOIN nocturne_accounts a ON a.id=p.account_id JOIN nocturne_publication_consents c ON c.account_id=a.id AND c.revision=p.revision WHERE a.id=? AND a.listing_revision=? AND p.revision=? AND c.digest=? AND p.hidden=0 AND p.expires_at>?').bind(who.id,b.expectedRevision+1,b.expectedRevision+1,digest,now).first();
    const prior=await priorReceipt();if(prior)return reply({published:true,id:prior.id,card:JSON.parse(prior.card),revision:prior.revision,expiresAt:prior.expires_at,reused:true});
    if(b.expectedRevision!==who.listing_revision)return reply({error:'conflict'},409);
    const id=old?.id||random(12),revision=who.listing_revision+1;
    const semantic=c=>JSON.stringify({...c,art:undefined,artVersion:undefined});
    const changed=old&&(semantic(JSON.parse(old.card))!==semantic(card)||old.age!==age||old.gender!==gender||old.intent!==b.intent);
    const results=await env.DB.batch([
      env.DB.prepare('UPDATE nocturne_accounts SET listing_preference=1,listing_revision=listing_revision+1,listing_choice_policy=?,listing_choice_at=? WHERE id=? AND listing_revision=? AND moderation_hold=0').bind(CHOICE_POLICY,now,who.id,b.expectedRevision),
      env.DB.prepare('INSERT INTO nocturne_listings(id,account_id,card,intent,age,gender,created_at,expires_at,revision,record_id) SELECT ?,?,?,?,?,?,?,?,?,? WHERE changes()=1 ON CONFLICT(account_id) DO UPDATE SET card=excluded.card,intent=excluded.intent,age=excluded.age,gender=excluded.gender,expires_at=excluded.expires_at,revision=excluded.revision,record_id=excluded.record_id').bind(id,who.id,JSON.stringify(card),b.intent,age,gender,old?.created_at||now,now+7*DAY,revision,b.recordId),
      env.DB.prepare('INSERT INTO nocturne_publication_consents(account_id,revision,policy,digest,created_at) SELECT ?,?,?,?,? WHERE changes()=1').bind(who.id,revision,PUBLICATION_POLICY,digest,now),
      env.DB.prepare('DELETE FROM nocturne_interests WHERE ?=1 AND changes()=1 AND (actor=? OR target=?) AND EXISTS(SELECT 1 FROM nocturne_publication_consents WHERE account_id=? AND revision=?)').bind(Number(!!changed),who.id,who.id,who.id,revision),
      env.DB.prepare('UPDATE nocturne_records SET first_published_at=COALESCE(first_published_at,?) WHERE id=? AND account_id=? AND EXISTS(SELECT 1 FROM nocturne_publication_consents WHERE account_id=? AND revision=? AND digest=?)').bind(now,b.recordId,who.id,who.id,revision,digest)
    ]);
    if(!results[0].meta?.changes){const saved=await priorReceipt();return saved?reply({published:true,id:saved.id,card:JSON.parse(saved.card),revision:saved.revision,expiresAt:saved.expires_at,reused:true}):reply({error:'conflict'},409);}
    return reply({published:true,id,card,revision,firstPublishedAt:own.first_published_at||now,expiresAt:now+7*DAY},201);
  }
  if(path==='/api/listings'){
    const own=await latest(env,who.id);if(!own||JSON.parse(own.profile).answered<12)return reply({error:'complete_first'},409);if(own.entry_policy===REQUIRED_ENTRY_POLICY&&!own.first_published_at)return reply({error:'publish_first'},409);
    const gender=url.searchParams.get('gender')||'',age=url.searchParams.get('age')||'',intent=url.searchParams.get('intent')||'',trait=url.searchParams.get('trait')||'',relation=url.searchParams.get('relation')||'any',cursor=url.searchParams.get('before');
    if(gender&&!Object.hasOwn(GENDERS,gender)||age&&!Object.hasOwn(AGES,age)||intent&&!['similar','complement','any'].includes(intent)||trait&&!FACETS.some(f=>f.id===trait)||!['any','similar','complement'].includes(relation)||cursor&&!/^\d{13}:[A-Za-z0-9_-]{16}$/.test(cursor))return reply({error:'invalid_request'},400);
    const before=cursor?Number(cursor.split(':')[0]):now+1,beforeId=cursor?cursor.split(':')[1]:'';
    const traits=JSON.parse(own.profile).facets.filter(f=>f.strong).map(f=>f.id),pairs={lead:'yield',yield:'lead',sadism:'masochism',masochism:'sadism',giveCare:'receiveCare',receiveCare:'giveCare',restraintGive:'restraintReceive',restraintReceive:'restraintGive',painGive:'painReceive',painReceive:'painGive'};
    const desired=relation==='similar'?traits:relation==='complement'?traits.map(id=>pairs[id]).filter(Boolean):[];
    const rows=await env.DB.prepare(`SELECT p.id,p.card,p.intent,p.age,p.gender,p.created_at,EXISTS(SELECT 1 FROM nocturne_interests i WHERE i.actor=? AND i.target=p.account_id) AS interested
      FROM nocturne_listings p WHERE p.account_id<>? AND p.hidden=0 AND p.account_id NOT IN (SELECT id FROM nocturne_accounts WHERE moderation_hold=1) AND p.expires_at>?
      AND (p.created_at<? OR (p.created_at=? AND p.id<?)) AND (?='' OR p.gender=?) AND (?='' OR p.age=?) AND (?='' OR p.intent=?)
      AND (?='' OR EXISTS(SELECT 1 FROM json_each(p.card,'$.traits') WHERE value=?))
      AND (?='any' OR EXISTS(SELECT 1 FROM json_each(p.card,'$.traits') WHERE value IN (SELECT value FROM json_each(?))))
      AND NOT EXISTS(SELECT 1 FROM nocturne_blocks b WHERE (b.actor=? AND b.target=p.account_id) OR (b.actor=p.account_id AND b.target=?))
      ORDER BY p.created_at DESC,p.id DESC LIMIT 30`).bind(who.id,who.id,now,before,before,beforeId,gender,gender,age,age,intent,intent,trait,trait,relation,JSON.stringify(desired),who.id,who.id).all();
    return reply({items:rows.results.map(r=>({...r,card:JSON.parse(r.card),interested:!!r.interested})),next:rows.results.length===30?rows.results.at(-1).created_at+':'+rows.results.at(-1).id:null});
  }

  if(['/api/interest','/api/block','/api/report'].includes(path)){
    if(!keys(b,path==='/api/report'?['id','reason']:path==='/api/interest'?['id','interested']:['id'])||!ID.test(b.id||''))return reply({error:'invalid_request'},400);
    const target=await targetListing(env,b.id,who.id,now);if(!target)return reply({error:'not_found'},404);
    if(!await latest(env,who.id))return reply({error:'complete_first'},409);
    if(path==='/api/block'){
      await env.DB.batch([env.DB.prepare('INSERT OR IGNORE INTO nocturne_blocks(actor,target,created_at) VALUES(?,?,?)').bind(who.id,target.account_id,now),env.DB.prepare('DELETE FROM nocturne_interests WHERE (actor=? AND target=?) OR (actor=? AND target=?)').bind(who.id,target.account_id,target.account_id,who.id)]);return reply({blocked:true});
    }
    if(path==='/api/report'){
      if(!['unwanted','impersonation','underage','other'].includes(b.reason))return reply({error:'invalid_request'},400);
      await env.DB.batch([env.DB.prepare('INSERT OR IGNORE INTO nocturne_reports(actor,target,reason,created_at) VALUES(?,?,?,?)').bind(who.id,target.account_id,b.reason,now),env.DB.prepare('INSERT OR IGNORE INTO nocturne_blocks(actor,target,created_at) VALUES(?,?,?)').bind(who.id,target.account_id,now)]);
      await env.DB.batch([env.DB.prepare('UPDATE nocturne_listings SET hidden=1 WHERE account_id=? AND (SELECT COUNT(*) FROM nocturne_reports WHERE target=?)>=3').bind(target.account_id,target.account_id),env.DB.prepare('UPDATE nocturne_accounts SET moderation_hold=1 WHERE id=? AND (SELECT COUNT(*) FROM nocturne_reports WHERE target=?)>=3').bind(target.account_id,target.account_id)]);return reply({reported:true});
    }
    if(typeof b.interested!=='boolean')return reply({error:'invalid_request'},400);
    const own=await env.DB.prepare('SELECT card FROM nocturne_listings WHERE account_id=? AND hidden=0 AND account_id NOT IN (SELECT id FROM nocturne_accounts WHERE moderation_hold=1) AND expires_at>?').bind(who.id,now).first();if(!own)return reply({error:'publish_first'},409);
    if(!b.interested){await env.DB.prepare('DELETE FROM nocturne_interests WHERE actor=? AND target=?').bind(who.id,target.account_id).run();return reply({interested:false,mutual:false});}
    await env.DB.prepare('INSERT OR IGNORE INTO nocturne_interests(actor,target,created_at) VALUES(?,?,?)').bind(who.id,target.account_id,now).run();
    const mutual=!!await env.DB.prepare('SELECT 1 FROM nocturne_interests WHERE actor=? AND target=?').bind(target.account_id,who.id).first();
    return reply({interested:true,mutual,...(mutual?{comparison:compare(JSON.parse(own.card),JSON.parse(target.card))}:{})});
  }
  return reply({error:'not_found'},404);
}

const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function serveShortShare(request,env){
  const url=new URL(request.url),id=url.pathname.slice(3);
  if(!ID.test(id)||!['GET','HEAD'].includes(request.method))return new Response('Not found',{status:404,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
  if(!env.DB||!env.API_LIMIT||!env.GLOBAL_LIMIT||env.RECOVERY_MODE&&env.RECOVERY_MODE!=='off')return new Response('Unavailable',{status:503,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
  const limits=await Promise.all([env.GLOBAL_LIMIT.limit({key:'nocturne-share'}),env.API_LIMIT.limit({key:(request.headers.get('CF-Connecting-IP')||'shared')+':share-read'})]);if(limits.some(x=>!x.success))return new Response('Try later',{status:429,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
  const row=await env.DB.prepare('SELECT card FROM nocturne_shares WHERE id=? AND expires_at>? AND revoked_at IS NULL').bind(id,Date.now()).first();
  if(!row)return new Response('この共有結果は期限が切れたか、取り消されました。',{status:404,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
  const card=JSON.parse(row.card);if(!validCard(card))return new Response('Unavailable',{status:503});
  const asset=await env.ASSETS.fetch(new Request(url.origin+'/',{headers:request.headers}));let html=await asset.text();
  const origin=env.PUBLIC_SITE_ORIGIN||env.SITE_ORIGIN||url.origin,canonical=new URL('/s/'+id,origin).href,image=new URL(artSource(validArt(card.art)?card.art:preferredArt(card)),origin).href;
  const title=card.title+'｜KUSEIRO',description=card.quote||card.summary||card.title,alt=card.title+' — KUSEIROの共有カード';
  // Replace inherited homepage metadata instead of appending conflicting tags.
  html=html.replace(/<meta\b[^>]*\b(?:name|property)=["'](?:description|og:[^"']+|twitter:[^"']+|nocturne-card)["'][^>]*>/gi,'').replace(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi,'');
  const meta=(key,value,property=false)=>`<meta ${property?'property':'name'}="${key}" content="${escape(value)}">`;
  const metadata=`<link rel="canonical" href="${escape(canonical)}">`+meta('description',description)+Object.entries({'og:title':title,'og:description':description,'og:url':sharePreviewUrl(canonical),'og:type':'website','og:locale':'ja_JP','og:site_name':'KUSEIRO','og:image':image,'og:image:type':'image/webp','og:image:width':'1200','og:image:height':'800','og:image:alt':alt}).map(([key,value])=>meta(key,value,true)).join('')+Object.entries({'twitter:card':'summary_large_image','twitter:title':title,'twitter:description':description,'twitter:image':image,'twitter:image:alt':alt,'nocturne-card':JSON.stringify(card)}).map(([key,value])=>meta(key,value)).join('');
  html=html.replace(/<title>[^<]*<\/title>/,`<title>${escape(title)}</title>`).replace(/<meta name="robots"[^>]*>/,'<meta name="robots" content="noindex, nofollow">').replace('</head>',metadata+'</head>');
  const headers=new Headers(asset.headers);headers.set('Content-Type','text/html; charset=utf-8');headers.set('Cache-Control','no-store');headers.set('X-Robots-Tag','noindex, nofollow');headers.set('Referrer-Policy','no-referrer');for(const key of ['ETag','Content-Length','Content-Encoding','Last-Modified'])headers.delete(key);
  return new Response(request.method==='HEAD'?null:html,{headers});
}

export function aggregateUsage(rows,now=Date.now()){
  const valid=rows.filter(r=>r.instrument===INSTRUMENT&&r.consent===CONSENT).flatMap(r=>{try{const a=JSON.parse(r.answers);if(!validAnswers(a))return [];return [{...r,a,d:JSON.parse(r.dwell),f:r.profile?JSON.parse(r.profile).facets:[]}];}catch{return [];}}),people=new Set(valid.map(r=>r.account_id)),completed=valid.filter(r=>r.completed_at),inactive=valid.filter(r=>!r.completed_at&&r.last_seen<now-30*60000);
  const funnel=SCENES.map(q=>{const seen=valid.filter(r=>(r.visited&(1<<q.id))!==0),answered=seen.filter(r=>{return Number.isInteger(r.a[q.id]);}),durations=seen.flatMap(r=>{const n=r.d[q.id];return Number.isFinite(n)&&n>0?[n]:[];}).sort((a,b)=>a-b);return {id:q.id,seen:seen.length,answered:answered.length,pausedHere:inactive.filter(r=>r.cursor===q.id).length,medianMs:durations.length?durations[Math.floor(durations.length/2)]:null};});
  function grouped(fields){
    const buckets=new Map();
    for(const r of valid){
      const key=fields.map(f=>r[f]).join('|');
      if(!buckets.has(key))buckets.set(key,{...Object.fromEntries(fields.map(f=>[f==='time_band'?'timeBand':f,r[f]])),people:new Set(),finished:new Set(),paused:new Set(),sessions:0,facetPeople:Object.fromEntries(FACETS.map(f=>[f.id,new Set()]))});
      const b=buckets.get(key);b.people.add(r.account_id);b.sessions++;
      if(!r.completed_at){if(r.last_seen<now-1800000)b.paused.add(r.account_id);continue;}
      b.finished.add(r.account_id);
      for(const f of r.f||[])if(f.strong&&Object.hasOwn(b.facetPeople,f.id))b.facetPeople[f.id].add(r.account_id);
    }
    return {size:buckets.size,rows:[...buckets.values()].filter(b=>b.people.size>=5).map(({people,finished,paused,facetPeople,...rest})=>({...rest,people:people.size,completed:finished.size>=5?finished.size:null,paused:paused.size>=5?paused.size:null,facets:Object.fromEntries(Object.entries(facetPeople).map(([id,set])=>[id,set.size>=5?set.size:null]))}))};
  }
  const detailed=grouped(['gender','age','timeframe','mood','time_band']),cohorts=detailed.rows;

  return {instrument:INSTRUMENT,updatedAt:new Date(now).toISOString(),scope:'consenting-sessions-only',window:'latest-2000-within-7-days',landingVisits:null,people:people.size,started:valid.length,completed:completed.length,possiblyPaused:inactive.length,funnel,cohorts,personaCohorts:grouped(['gender','age']).rows,timeCohorts:grouped(['timeframe','mood','time_band']).rows,suppressedCohorts:detailed.size-cohorts.length};
}
async function replayWithdrawals(env){
  for(const [prefix,table] of [['nocturne-withdrawals/','nocturne_accounts'],['nocturne-record-withdrawals/','nocturne_records'],['nocturne-share-withdrawals/','nocturne_shares']]){
    const checkpoint='nocturne-recovery/'+env.RECOVERY_MODE+'/'+table+'.json',old=await env.EVIDENCE.get(checkpoint),saved=old?await old.json():{};if(saved.done)continue;
    const page=await env.EVIDENCE.list({prefix,limit:500,...(saved.cursor?{cursor:saved.cursor}:{})});const ids=page.objects.map(o=>o.key.slice(prefix.length,-5)).filter(id=>(table==='nocturne_shares'?ID:UUID).test(id));
    for(let i=0;i<ids.length;i+=80){const chunk=ids.slice(i,i+80);await env.DB.prepare('DELETE FROM '+table+' WHERE id IN ('+chunk.map(()=>'?').join(',')+')').bind(...chunk).run();}
    await env.EVIDENCE.put(checkpoint,JSON.stringify({done:!page.truncated,cursor:page.truncated?page.cursor:null}));
  }
}
export async function maintainNocturne(env,now=Date.now()){
  if(!env.DB||!env.EVIDENCE)return;
  if(env.RECOVERY_MODE&&env.RECOVERY_MODE!=='off'){if(!UUID.test(env.RECOVERY_MODE))throw Error('invalid_recovery');await stopAffiliateForRecovery(env,now);await env.EVIDENCE.delete('owner/nocturne-current.json');await replayWithdrawals(env);return;}
  try{
    await env.DB.batch([
      env.DB.prepare('DELETE FROM nocturne_sessions WHERE expires_at<=?').bind(now),env.DB.prepare('DELETE FROM nocturne_shares WHERE expires_at<=?').bind(now),env.DB.prepare('DELETE FROM nocturne_listings WHERE expires_at<=?').bind(now-30*DAY),
      env.DB.prepare('DELETE FROM nocturne_records WHERE created_at<? OR (completed_at IS NULL AND last_seen<?)').bind(now-180*DAY,now-30*DAY),env.DB.prepare('DELETE FROM nocturne_accounts WHERE last_seen<?').bind(now-365*DAY),env.DB.prepare('DELETE FROM nocturne_quota WHERE day<?').bind(new Date(now-30*DAY).toISOString().slice(0,10))
    ]);
    const rows=await env.DB.prepare('SELECT account_id,instrument,consent,answers,dwell,visited,cursor,timeframe,mood,age,gender,time_band,created_at,last_seen,completed_at,profile FROM nocturne_records WHERE created_at>=? AND instrument=? ORDER BY created_at DESC LIMIT 2000').bind(now-7*DAY,INSTRUMENT).all();
    const report=aggregateUsage(rows.results,now);const moderation=await env.DB.prepare('SELECT a.id AS reviewId,p.id AS listingId,a.moderation_hold AS hidden,COUNT(r.actor) AS reports FROM nocturne_accounts a LEFT JOIN nocturne_listings p ON p.account_id=a.id LEFT JOIN nocturne_reports r ON r.target=a.id WHERE a.moderation_hold=1 OR r.actor IS NOT NULL GROUP BY a.id,p.id,a.moderation_hold LIMIT 100').all();report.moderation=moderation.results;await env.EVIDENCE.put('owner/nocturne-current.json',JSON.stringify(report),{httpMetadata:{contentType:'application/json'}});return report;
  }catch(e){await env.EVIDENCE.delete('owner/nocturne-current.json').catch(()=>{});throw e;}
}
