import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {handleNocturne,serveShortShare,maintainNocturne,aggregateUsage} from '../src/nocturne-service.mjs';
import {SCENES,CONSENT,PREVIOUS_CONSENT,INSTRUMENT,diagnose,emptyAnswers} from '../src/nocturne.mjs';
import {diagnose as previousDiagnose} from '../src/nocturne-v1.mjs';
class DB{
 constructor(){this.db=new DatabaseSync(':memory:');this.db.exec(fs.readFileSync('migrations/0005_nocturne.sql','utf8'));this.db.exec(fs.readFileSync('migrations/0006_nocturne_moderation.sql','utf8'));this.db.exec(fs.readFileSync('migrations/0008_nocturne_publication.sql','utf8'));}
 prepare(sql){const db=this.db;return {args:[],bind(...args){this.args=args;return this;},async first(key){const r=db.prepare(sql).get(...this.args);return key?r?.[key]:r||null;},async all(){const before=Number(db.prepare('SELECT total_changes() AS n').get().n),rows=db.prepare(sql).all(...this.args);return {results:rows,meta:{changes:Number(db.prepare('SELECT total_changes() AS n').get().n)-before}};},async run(){const before=Number(db.prepare('SELECT total_changes() AS n').get().n);db.prepare(sql).run(...this.args);return {success:true,meta:{changes:Number(db.prepare('SELECT total_changes() AS n').get().n)-before},results:[]};}};}
 async batch(list){this.db.exec('BEGIN');try{const out=[];for(const q of list)out.push(await q.all());this.db.exec('COMMIT');return out;}catch(e){this.db.exec('ROLLBACK');throw e;}}
}
class R2{constructor(){this.files=new Map();}async put(k,v){this.files.set(k,v);}async get(k){const v=this.files.get(k);return v===undefined?null:{json:async()=>JSON.parse(v)};}async delete(k){this.files.delete(k);}async list({prefix,limit=500,cursor}){const keys=[...this.files.keys()].filter(k=>k.startsWith(prefix)).sort(),i=Number(cursor)||0;return {objects:keys.slice(i,i+limit).map(key=>({key})),truncated:i+limit<keys.length,cursor:String(i+limit)};}}
const base='https://nocturne.test',verify=async token=>token==='verified-test';
const environment=()=>({DB:new DB(),EVIDENCE:new R2(),SITE_ORIGIN:base,RESEARCH_ENABLED:'true',API_LIMIT:{limit:async()=>({success:true})},GLOBAL_LIMIT:{limit:async()=>({success:true})},ASSETS:{fetch:async()=>new Response('<html><head><title>NOCTURNE</title><meta name="robots" content="index, follow"></head><body></body></html>',{headers:{'Content-Type':'text/html','Content-Security-Policy':"script-src 'self'"}})}});
const request=(path,b,cookie='',origin=base)=>new Request(base+path,{method:b===undefined?'GET':'POST',headers:{...(cookie?{Cookie:cookie}:{}),...(b===undefined?{}:{'Content-Type':'application/json',Origin:origin,'X-Nocturne':'1'})},...(b===undefined?{}:{body:JSON.stringify(b)})});
const call=(env,path,b,cookie)=>handleNocturne(request(path,b,cookie),env,verify);
const startBody=()=>({id:crypto.randomUUID(),instrument:INSTRUMENT,consent:CONSENT,adult:true,context:{timeframe:'recent',mood:'ordinary',timeBand:'night'},persona:{age:'20-24',gender:'diverse'},token:'verified-test'});
test('new records require concrete body perspective, age and mood choices before creating an account',async()=>{
 const e=environment();
 for(const key of ['age','gender','mood'])for(const value of ['unset','',undefined]){
  const b=startBody();(key==='mood'?b.context:b.persona)[key]=value;
  assert.equal((await call(e,'/api/participate',b)).status,400);
 }
 assert.equal(await e.DB.prepare('SELECT COUNT(*) n FROM nocturne_accounts').first('n'),0);
 for(const age of ['30-34','35-39','40-44','45-49','50-54','55-59','60+']){
  const b=startBody();b.persona.age=age;assert.equal((await call(e,'/api/participate',b)).status,201);
 }
});
const answers=()=>SCENES.map(q=>q.self?1:q.boundary?1:1);
async function user(env,complete=true){const b=startBody(),r=await call(env,'/api/participate',b);assert.equal(r.status,201);const cookie=r.headers.get('set-cookie').split(';')[0];if(complete)assert.equal((await call(env,'/api/complete',{id:b.id,answers:answers(),dwell:Array(24).fill(1000),visited:16777215,cursor:23,revision:2},cookie)).status,200);return {cookie,id:b.id};}
async function publish(env,u,extra={}){const body={recordId:u.id,intent:'any',showAge:false,showGender:false,...extra};const preview=await(await call(env,'/api/listing/preview',body,u.cookie)).json();const r=await call(env,'/api/listing',{...body,publish:true,digest:preview.digest,policy:preview.policy,expectedRevision:preview.revision},u.cookie);assert.equal(r.status,201);return (await r.json()).id;}
test('authentication, cross-origin writes and missing guards fail closed',async()=>{const e=environment();assert.deepEqual(await(await call(e,'/api/account')).json(),{signedIn:false});assert.equal((await call(e,'/api/listings')).status,401);assert.equal((await handleNocturne(request('/api/participate',startBody(),'','https://evil.test'),e,verify)).status,403);assert.equal((await call({...e,API_LIMIT:null},'/api/account')).status,503);assert.equal((await call(e,'/api/participate',{...startBody(),adult:false})).status,400);assert.equal((await call(e,'/api/participate',{...startBody(),token:'bad'})).status,403);});
test('local test token cannot enable a production bypass, even with the flag present',async()=>{const e={...environment(),LOCAL_TEST_MODE:'true'};assert.equal((await call(e,'/api/participate',{...startBody(),token:'local-test-only'})).status,403);assert.deepEqual(await(await call(e,'/api/config')).json(),{localTest:false,instrument:INSTRUMENT});});
test('anonymous account uses secure HttpOnly cookie and is idempotent on the same draft',async()=>{const e=environment(),b=startBody(),r=await call(e,'/api/participate',b),c=r.headers.get('set-cookie');assert.match(c,/__Host-nocturne=/);assert.match(c,/HttpOnly/);assert.match(c,/SameSite=Strict/);assert.match(c,/Secure/);assert.equal((await call(e,'/api/participate',b,c.split(';')[0])).status,201);assert.equal(await e.DB.prepare('SELECT COUNT(*) AS n FROM nocturne_records').first('n'),1);});
test('stale progress is rejected, completed history is immutable, and another account cannot read or write it',async()=>{const e=environment(),a=await user(e,false),b=await user(e),p={id:a.id,answers:answers(),dwell:Array(24).fill(100),visited:3,cursor:1,revision:4};assert.equal((await call(e,'/api/progress',p,a.cookie)).status,200);assert.equal((await call(e,'/api/progress',{...p,revision:3,answers:emptyAnswers()},a.cookie)).status,409);assert.equal(JSON.parse(await e.DB.prepare('SELECT answers FROM nocturne_records WHERE id=?').bind(a.id).first('answers'))[0],1);assert.equal((await call(e,'/api/progress',p,b.cookie)).status,404);assert.equal((await call(e,'/api/record/delete',{id:a.id},b.cookie)).status,404);assert.equal((await call(e,'/api/complete',{...p,revision:5},a.cookie)).status,400);assert.equal((await call(e,'/api/complete',{...p,revision:5,visited:16777215,cursor:23},a.cookie)).status,200);assert.equal((await call(e,'/api/progress',{...p,revision:6},a.cookie)).status,409);const owned=await(await call(e,'/api/account',undefined,b.cookie)).json();assert.ok(owned.records.every(r=>r.id===b.id));});
test('unknown answers can finish without being manufactured into zeros; empty profiles cannot be listed',async()=>{const e=environment(),u=await user(e,false);const r=await call(e,'/api/complete',{id:u.id,answers:emptyAnswers(),dwell:Array(24).fill(0),visited:16777215,cursor:23,revision:2},u.cookie);assert.equal(r.status,200);assert.equal((await r.json()).profile.answered,0);assert.equal((await call(e,'/api/listing',{publish:true,recordId:u.id,intent:'any',showAge:false,showGender:false},u.cookie)).status,409);});
test('recovery stores only a hash and logs in to the same history; replay does not reveal the key',async()=>{const e=environment(),u=await user(e),r=await call(e,'/api/recovery/create',{},u.cookie);assert.equal(r.status,200);const {key}=await r.json();assert.match(key,/^[A-Za-z0-9_-]{43}$/);assert.equal((await call(e,'/api/recovery/create',{},u.cookie)).status,409);assert.notEqual(await e.DB.prepare('SELECT recovery_hash FROM nocturne_accounts').first('recovery_hash'),key);const login=await call(e,'/api/recovery/login',{key,token:'verified-test'});assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0],p=await(await call(e,'/api/account',undefined,cookie)).json();assert.equal(p.records[0].id,u.id);assert.ok(!JSON.stringify(p).includes(key));await call(e,'/api/logout',{},cookie);assert.equal((await(await call(e,'/api/account',undefined,cookie)).json()).signedIn,false);});
test('legacy sessions issue canonical custom-domain share URLs for new and reused snapshots',async()=>{
 const e=environment(),u=await user(e),body={id:u.id,tags:[]};e.PUBLIC_SITE_ORIGIN='https://nocturne.ai-yu-me.com';
 const first=await call(e,'/api/share',body,u.cookie);assert.equal(first.status,201);const url=(await first.json()).url;
 assert.equal(new URL(url).origin,e.PUBLIC_SITE_ORIGIN);
 const reused=await call(e,'/api/share',body,u.cookie);assert.equal(reused.status,200);assert.equal((await reused.json()).url,url);
});
test('short shares are bounded snapshots, have no raw answers, and reuse an identical publication',async()=>{const e=environment(),u=await user(e),b={id:u.id,tags:['主導したい'],personal:''},r=await call(e,'/api/share',b,u.cookie),url=(await r.json()).url;assert.match(url,/\/s\/[A-Za-z0-9_-]{16}$/);assert.ok(url.length<70);assert.equal((await(await call(e,'/api/share',b,u.cookie)).json()).url,url);const id=url.split('/').pop(),card=(await(await call(e,'/api/share/'+id)).json()).card;assert.equal(card.answers,undefined);assert.equal(card.age,undefined);assert.equal(card.gender,undefined);const page=await serveShortShare(new Request(url),e);assert.equal(page.status,200);assert.match(page.headers.get('x-robots-tag'),/noindex/);assert.match(await page.text(),/nocturne-card/);await e.DB.prepare('UPDATE nocturne_shares SET expires_at=0').run();assert.equal((await call(e,'/api/share/'+id)).status,404);});
test('public list requires completion, defaults to private demographics and has no record or account IDs',async()=>{const e=environment(),a=await user(e),b=await user(e);await call(e,'/api/persona',{id:a.id,persona:{age:'30-34',gender:'woman'}},a.cookie);const id=await publish(e,a);const p=await(await call(e,'/api/listings',undefined,b.cookie)).json();assert.equal(p.items[0].id,id);assert.equal(p.items[0].age,'unset');assert.equal(p.items[0].gender,'unset');assert.ok(!/account_id|answers|recovery_hash|completedAt/.test(JSON.stringify(p)));assert.equal((await(await call(e,'/api/listings?gender=woman',undefined,b.cookie)).json()).items.length,0);await publish(e,a,{showAge:true,showGender:true});assert.equal((await(await call(e,'/api/listings?gender=woman&age=30-34',undefined,b.cookie)).json()).items.length,1);});
test('mutual interest requires two active publications; blocking hides both directions and removes the comparison',async()=>{const e=environment(),a=await user(e),b=await user(e),aid=await publish(e,a),bid=await publish(e,b);let r=await call(e,'/api/interest',{id:bid,interested:true},a.cookie);assert.equal((await r.json()).mutual,false);r=await call(e,'/api/interest',{id:aid,interested:true},b.cookie);assert.equal((await r.json()).mutual,true);assert.equal((await(await call(e,'/api/account',undefined,a.cookie)).json()).mutual.length,1);await call(e,'/api/block',{id:bid},a.cookie);assert.equal((await(await call(e,'/api/listings',undefined,a.cookie)).json()).items.length,0);assert.equal((await(await call(e,'/api/listings',undefined,b.cookie)).json()).items.length,0);assert.equal((await(await call(e,'/api/account',undefined,b.cookie)).json()).mutual.length,0);assert.equal((await call(e,'/api/interest',{id:aid,interested:true},b.cookie)).status,404);});
test('unpublishing revokes mutual comparison and leaves no phantom candidates',async()=>{const e=environment(),a=await user(e),b=await user(e),aid=await publish(e,a),bid=await publish(e,b);await call(e,'/api/interest',{id:bid,interested:true},a.cookie);await call(e,'/api/interest',{id:aid,interested:true},b.cookie);await call(e,'/api/listing',{publish:false},a.cookie);assert.equal((await(await call(e,'/api/account',undefined,b.cookie)).json()).mutual.length,0);assert.equal((await(await call(e,'/api/listings',undefined,b.cookie)).json()).items.length,0);});
test('three distinct reports hide a listing and unpublish/republish cannot bypass review',async()=>{const e=environment(),a=await user(e),id=await publish(e,a);for(let i=0;i<3;i++){const u=await user(e);assert.equal((await call(e,'/api/report',{id,reason:'underage'},u.cookie)).status,200);}await call(e,'/api/listing',{publish:false},a.cookie);assert.equal((await call(e,'/api/listing',{publish:true,recordId:a.id,intent:'any',showAge:false,showGender:false},a.cookie)).status,403);});
test('account withdrawal cascades to private records, tokens, listings and short links; tombstone survives restore',async()=>{const e=environment(),u=await user(e);await publish(e,u);await call(e,'/api/share',{id:u.id,tags:[]},u.cookie);const owner=await e.DB.prepare('SELECT account_id FROM nocturne_records WHERE id=?').bind(u.id).first('account_id');assert.equal((await call(e,'/api/account/delete',{confirm:'delete-my-records'},u.cookie)).status,200);for(const table of ['accounts','records','sessions','shares','listings'])assert.equal(await e.DB.prepare('SELECT COUNT(*) AS n FROM nocturne_'+table).first('n'),0);assert.ok(await e.EVIDENCE.get('nocturne-withdrawals/'+owner+'.json'));await e.DB.prepare('INSERT INTO nocturne_accounts(id,created_at,last_seen) VALUES(?,?,?)').bind(owner,Date.now(),Date.now()).run();e.RECOVERY_MODE=crypto.randomUUID();await maintainNocturne(e);assert.equal(await e.DB.prepare('SELECT COUNT(*) AS n FROM nocturne_accounts').first('n'),0);assert.equal((await call(e,'/api/account')).status,503);});
test('withdrawal does not report success when its deletion tombstone cannot be saved',async()=>{const e=environment(),u=await user(e);e.EVIDENCE.put=async()=>{throw Error('storage outage');};await assert.rejects(call(e,'/api/account/delete',{confirm:'delete-my-records'},u.cookie));assert.equal(await e.DB.prepare('SELECT COUNT(*) AS n FROM nocturne_accounts').first('n'),1);});
test('exact daily caps roll back account creation and cannot be exceeded by direct writes',async()=>{const e=environment();await e.DB.prepare("INSERT INTO nocturne_quota(day,starts,writes) VALUES(date('now'),500,0)").run();await assert.rejects(call(e,'/api/participate',startBody()),/nocturne_capacity/);assert.equal(await e.DB.prepare('SELECT COUNT(*) AS n FROM nocturne_accounts').first('n'),0);await e.DB.prepare("UPDATE nocturne_quota SET starts=0,writes=10000 WHERE day=date('now')").run();await assert.rejects(e.DB.prepare('INSERT INTO nocturne_accounts(id,recovery_hash,created_at,last_seen) VALUES(?,NULL,?,?)').bind(crypto.randomUUID(),Date.now(),Date.now()).run(),/nocturne_capacity/);});
test('analytics measures only consenting sessions, keeps unknown entry counts null and suppresses small cohorts',async()=>{const e=environment(),u=await user(e),report=await maintainNocturne(e);assert.equal(report.started,1);assert.equal(report.completed,1);assert.equal(report.landingVisits,null);assert.deepEqual(report.cohorts,[]);assert.equal(report.funnel.length,24);assert.ok(await e.EVIDENCE.get('owner/nocturne-current.json'));assert.equal(await e.EVIDENCE.get('public/nocturne-current.json'),null);assert.ok(!JSON.stringify(report).includes(u.id));const none=aggregateUsage([]);assert.equal(none.landingVisits,null);assert.ok(none.funnel.every(q=>q.medianMs===null));});
test('gender, age, timeframe and mood are context, not hidden score boosts',async()=>{const e=environment(),u=await user(e),b={...startBody(),context:{timeframe:'now',mood:'soft',timeBand:'morning'},persona:{gender:'woman',age:'20-24'}};await call(e,'/api/participate',b,u.cookie);await call(e,'/api/complete',{id:b.id,answers:answers(),dwell:Array(24).fill(1000),visited:16777215,cursor:23,revision:2},u.cookie);const p=await(await call(e,'/api/account',undefined,u.cookie)).json();assert.equal(p.records.length,2);assert.deepEqual(p.records[0].profile.facets,p.records[1].profile.facets);assert.equal(p.records[0].profile.title,p.records[1].profile.title);assert.deepEqual(p.records[0].profile.signals,p.records[1].profile.signals);assert.notEqual(p.records[0].context.mood,p.records[1].context.mood);});
test('the authenticated account scope rejects an in-flight write from a different browser account',async()=>{const e=environment(),a=await user(e),b=await user(e),own=await(await call(e,'/api/account',undefined,a.cookie)).json();const req=request('/api/persona',{id:b.id,persona:{age:'30-34',gender:'man'}},b.cookie);req.headers.set('X-Nocturne-Scope',own.scope);assert.equal((await handleNocturne(req,e,verify)).status,409);assert.equal(await e.DB.prepare('SELECT gender FROM nocturne_records WHERE id=?').bind(b.id).first('gender'),'diverse');});
test('persona suppression counts distinct people for each desire rather than repeated answers by one person',()=>{const profile=JSON.stringify({facets:[{id:'lead',strong:true}]}),baseRow={instrument:INSTRUMENT,consent:CONSENT,answers:JSON.stringify(answers()),dwell:'[]',visited:0,cursor:23,timeframe:'recent',mood:'unset',time_band:'night',age:'unset',gender:'unset',last_seen:Date.now(),completed_at:Date.now()};const rows=Array.from({length:5},()=>({...baseRow,account_id:'one-person',profile}));for(let i=0;i<4;i++)rows.push({...baseRow,account_id:'other-'+i,profile:'{"facets":[]}'});const r=aggregateUsage(rows);assert.equal(r.people,5);assert.equal(r.personaCohorts[0].facets.lead,null);assert.equal(r.personaCohorts[0].completed,5);});
test('cursor pagination does not skip listings created in the same millisecond; similarity uses actual shared traits',async()=>{const e=environment(),viewer=await user(e);for(let i=0;i<31;i++)await publish(e,await user(e));await e.DB.prepare('UPDATE nocturne_listings SET created_at=?').bind(Date.now()-1000).run();const first=await(await call(e,'/api/listings?relation=similar',undefined,viewer.cookie)).json();assert.equal(first.items.length,30);assert.ok(first.next);const next=await(await call(e,'/api/listings?relation=similar&before='+encodeURIComponent(first.next),undefined,viewer.cookie)).json();assert.equal(next.items.length,1);assert.ok(!first.items.some(r=>r.id===next.items[0].id));assert.equal((await(await call(e,'/api/listings?trait=scent',undefined,viewer.cookie)).json()).items.length,0);});
test('emergency intake stop leaves withdrawal available',async()=>{const e=environment(),u=await user(e);e.RESEARCH_ENABLED='false';assert.equal((await call(e,'/api/participate',startBody())).status,503);assert.equal((await call(e,'/api/account/delete',{confirm:'delete-my-records'},u.cookie)).status,200);});
test('only the blocker can undo a block, without exposing the blocked account identifier',async()=>{const e=environment(),a=await user(e),b=await user(e),bid=await publish(e,b);await call(e,'/api/block',{id:bid},a.cookie);const mine=await(await call(e,'/api/blocks',undefined,a.cookie)).json();assert.equal(mine.items.length,1);assert.deepEqual(Object.keys(mine.items[0]).sort(),['id','title']);assert.equal((await call(e,'/api/unblock',{id:mine.items[0].id},b.cookie)).status,404);assert.equal((await call(e,'/api/unblock',{id:mine.items[0].id},a.cookie)).status,200);assert.equal((await(await call(e,'/api/listings',undefined,a.cookie)).json()).items.length,1);});

test('historical answers keep their original interpretation, history, shares and discovery access',async()=>{
 const e=environment(),b={...startBody(),instrument:'nocturne24-1'},r=await call(e,'/api/participate',b),cookie=r.headers.get('set-cookie').split(';')[0],oldAnswers=Array(24).fill(1);
 const done=await call(e,'/api/complete',{id:b.id,answers:oldAnswers,dwell:Array(24).fill(0),visited:16777215,cursor:23,revision:2},cookie);assert.equal(done.status,200);assert.deepEqual((await done.json()).profile,previousDiagnose(oldAnswers));
 const state=await(await call(e,'/api/account',undefined,cookie)).json();assert.equal(state.records[0].instrument,'nocturne24-1');assert.equal(state.records[0].profile.title,previousDiagnose(oldAnswers).title);
 assert.equal((await call(e,'/api/listings',undefined,cookie)).status,200);const share=await call(e,'/api/share',{id:b.id,tags:[]},cookie);assert.equal(share.status,201);
 const oldStyle=await call(e,'/api/participate',{...startBody(),instrument:undefined},cookie);assert.equal(oldStyle.status,201);const latest=await e.DB.prepare('SELECT instrument FROM nocturne_records ORDER BY rowid DESC LIMIT 1').first('instrument');assert.equal(latest,'nocturne24-1');
});
test('frozen third-version none answers round-trip without changing the current model',async()=>{
 const e=environment(),started={...startBody(),instrument:'nocturne24-3'},first=await call(e,'/api/participate',started),u={id:started.id,cookie:first.headers.get('set-cookie').split(';')[0]},a=Array(24).fill(0);a[21]=15;
 const response=await call(e,'/api/complete',{id:u.id,answers:a,dwell:Array(24).fill(0),visited:16777215,cursor:23,revision:2},u.cookie);assert.equal(response.status,200);const p=(await response.json()).profile;assert.equal(p.answered,24);assert.equal(p.boundaries.length,4);assert.ok(p.facets.every(f=>!f.strong));
 const rows=(await(await call(e,'/api/account',undefined,u.cookie)).json()).records;assert.equal(rows[0].answers[7],0);assert.equal(rows[0].answers[21],15);
 const legacy={...startBody(),instrument:'nocturne24-1'},r=await call(e,'/api/participate',legacy,u.cookie);assert.equal(r.status,201);assert.equal((await call(e,'/api/complete',{id:legacy.id,answers:a,dwell:Array(24).fill(0),visited:16777215,cursor:23,revision:2},u.cookie)).status,400);
});

test('name-only link stores and serves a redacted card, not just a censored image',async()=>{
  const e=environment(),u=await user(e);
  const result=await call(e,'/api/share',{id:u.id,tags:['private tag'],personal:'private note',nameOnly:true},u.cookie);
  assert.equal(result.status,201);
  const url=(await result.json()).url;
  const publicResponse=await handleNocturne(new Request(url.replace('/s/','/api/share/')),e,verify);
  const {card}=await publicResponse.json();
  assert.deepEqual(card.tags,[]);assert.deepEqual(card.traits,[]);assert.equal(card.quote,'████████');
  assert.ok(!JSON.stringify(card).includes('private'));
  const stored=JSON.parse((await e.DB.prepare('SELECT card FROM nocturne_shares WHERE id=?').bind(url.split('/').pop()).first()).card);
  assert.deepEqual(stored,card);
});

test('the previous 24-scene model completes with its own wording and logic after migration',async()=>{
  const old=await import('../src/nocturne-v2.mjs'),e=environment(),b={...startBody(),instrument:'nocturne24-2'};
  const started=await call(e,'/api/participate',b);assert.equal(started.status,201);
  const cookie=started.headers.get('set-cookie').split(';')[0],a=Array(24).fill(1);
  const done=await call(e,'/api/complete',{id:b.id,answers:a,dwell:Array(24).fill(0),visited:16777215,cursor:23,revision:2},cookie);
  assert.equal(done.status,200);assert.deepEqual((await done.json()).profile,old.diagnose(a));
  const account=await(await call(e,'/api/account',undefined,cookie)).json();
  assert.equal(account.records[0].instrument,'nocturne24-2');assert.deepEqual(account.records[0].profile,old.diagnose(a));
});

test('older active clients keep their original consent rather than being silently upgraded',async()=>{
 const e=environment(),b={...startBody(),consent:PREVIOUS_CONSENT},r=await call(e,'/api/participate',b);assert.equal(r.status,201);assert.equal(await e.DB.prepare('SELECT consent FROM nocturne_records WHERE id=?').bind(b.id).first('consent'),PREVIOUS_CONSENT);
});

test('a completion losing a revision race reports conflict until the database is actually complete',async()=>{
 const e=environment(),u=await user(e,false),prepare=e.DB.prepare.bind(e.DB);let interleave=true;
 e.DB.prepare=sql=>{const statement=prepare(sql);if(sql.startsWith('UPDATE nocturne_records SET answers=')){const run=statement.run;statement.run=async function(){if(interleave){interleave=false;e.DB.db.prepare('UPDATE nocturne_records SET revision=3 WHERE id=?').run(u.id);}return run.call(this);};}return statement;};
 const body={id:u.id,answers:answers(),dwell:Array(24).fill(0),visited:16777215,cursor:23,revision:2};
 const lost=await call(e,'/api/complete',body,u.cookie);assert.equal(lost.status,409);assert.deepEqual(await lost.json(),{error:'conflict',revision:3});
 assert.equal(await prepare('SELECT completed_at FROM nocturne_records WHERE id=?').bind(u.id).first('completed_at'),null);
 const retry=await call(e,'/api/complete',{...body,revision:4},u.cookie);assert.equal(retry.status,200);assert.ok((await retry.json()).saved);
 assert.ok(await prepare('SELECT completed_at FROM nocturne_records WHERE id=?').bind(u.id).first('completed_at'));
});
test('listing confirmation is required, uses the exact preview, and survives an identical retry without duplicate people',async()=>{
 const e=environment(),u=await user(e),viewer=await user(e),body={recordId:u.id,intent:'any',showAge:false,showGender:false,art:'mirror'};
 assert.equal(await e.DB.prepare('SELECT COUNT(*) AS n FROM nocturne_listings').first('n'),0);
 assert.equal((await call(e,'/api/listing',{...body,publish:true},u.cookie)).status,409);
 const preview=await(await call(e,'/api/listing/preview',body,u.cookie)).json();
 assert.equal((await call(e,'/api/listing',{...body,publish:true,digest:'incorrect',policy:preview.policy,expectedRevision:preview.revision},u.cookie)).status,409);
 const confirmed={...body,publish:true,digest:preview.digest,policy:preview.policy,expectedRevision:preview.revision};
 const published=await(await call(e,'/api/listing',confirmed,u.cookie)).json();assert.deepEqual(published.card,preview.card);
 const retry=await call(e,'/api/listing',confirmed,u.cookie);assert.equal(retry.status,200);assert.equal((await retry.json()).id,published.id);
 const owner=await(await call(e,'/api/account',undefined,u.cookie)).json();assert.equal(owner.listing.status,'live');assert.deepEqual(owner.listing.card,preview.card);
 const seen=await(await call(e,'/api/listings',undefined,viewer.cookie)).json();assert.deepEqual(seen.items[0].card,preview.card);
 assert.equal(await e.DB.prepare('SELECT COUNT(*) AS n FROM nocturne_listings').first('n'),1);
 assert.equal(await e.DB.prepare('SELECT COUNT(*) AS n FROM nocturne_publication_consents').first('n'),1);
 assert.equal((await call(e,'/api/listing',{publish:false,expectedRevision:owner.publication.revision},u.cookie)).status,200);
 assert.equal((await call(e,'/api/listing',confirmed,u.cookie)).status,409);
 const unlisted=await(await call(e,'/api/account',undefined,u.cookie)).json();assert.equal(unlisted.publication.preference,false);assert.equal(unlisted.listing,null);
 const next={...startBody()};await call(e,'/api/participate',next,u.cookie);assert.equal((await(await call(e,'/api/account',undefined,u.cookie)).json()).publication.preference,false);
});
test('an expired own listing stays visible only to its owner and artwork changes preserve existing interests',async()=>{
 const e=environment(),a=await user(e),b=await user(e),aid=await publish(e,a),bid=await publish(e,b);
 await call(e,'/api/interest',{id:aid,interested:true},b.cookie);
 await publish(e,a,{art:'mirror'});assert.equal(await e.DB.prepare('SELECT COUNT(*) AS n FROM nocturne_interests').first('n'),1);
 await e.DB.prepare('UPDATE nocturne_listings SET expires_at=? WHERE id=?').bind(Date.now()-1000,aid).run();
 const own=await(await call(e,'/api/account',undefined,a.cookie)).json();assert.equal(own.listing.status,'expired');
 assert.equal((await(await call(e,'/api/listings',undefined,b.cookie)).json()).items.length,0);
 assert.equal((await call(e,'/api/art',{id:a.id,art:'mirror'},b.cookie)).status,404);
 assert.equal((await call(e,'/api/art',{id:a.id,art:'https://outside.test/pixel'},a.cookie)).status,400);
});
test('a share can be revoked alone and neither its API nor HTML survives revocation',async()=>{
 const e=environment(),a=await user(e),b=await user(e),link=await(await call(e,'/api/share',{id:a.id,tags:[],art:'voice'},a.cookie)).json(),id=link.url.split('/').pop();
 const items=await(await call(e,'/api/shares',undefined,a.cookie)).json();assert.equal(items.items.length,1);assert.equal(items.items[0].card.art,'voice');
 assert.equal((await call(e,'/api/share/revoke',{id},b.cookie)).status,404);
 assert.equal((await call(e,'/api/share/revoke',{id},a.cookie)).status,200);
 assert.equal((await call(e,'/api/share/'+id)).status,404);assert.equal((await serveShortShare(new Request(link.url),e)).status,404);
 assert.ok(await e.EVIDENCE.get('nocturne-share-withdrawals/'+id+'.json'));
 assert.equal(await e.DB.prepare('SELECT COUNT(*) AS n FROM nocturne_records').first('n'),2);
 // A database restore cannot resurrect a revoked short link.
 await e.DB.prepare('UPDATE nocturne_shares SET revoked_at=NULL WHERE id=?').bind(id).run();e.RECOVERY_MODE=crypto.randomUUID();await maintainNocturne(e);
 assert.equal(await e.DB.prepare('SELECT COUNT(*) AS n FROM nocturne_shares').first('n'),0);
});

test('publication reports success with D1 trigger-inclusive change counts and stale withdrawal cannot affect another publication',async()=>{
 const e=environment(),u=await user(e);
 const count=await e.DB.prepare('UPDATE nocturne_accounts SET last_seen=last_seen WHERE id=(SELECT account_id FROM nocturne_records WHERE id=?)').bind(u.id).run();assert.ok(count.meta.changes>1);
 await publish(e,u);
 const before=await(await call(e,'/api/account',undefined,u.cookie)).json();
 assert.equal((await call(e,'/api/listing',{publish:false,expectedRevision:before.publication.revision-1},u.cookie)).status,409);
 assert.equal((await(await call(e,'/api/account',undefined,u.cookie)).json()).listing.status,'live');
 assert.equal((await call(e,'/api/listing',{publish:false,expectedRevision:before.publication.revision},u.cookie)).status,200);
 const after=await(await call(e,'/api/account',undefined,u.cookie)).json();assert.equal(after.listing,null);assert.equal(after.publication.preference,false);
});

test('exhausting the new-write budget still permits taking a listing and share down',async()=>{
 const e=environment(),u=await user(e);await publish(e,u);const link=await(await call(e,'/api/share',{id:u.id,tags:[]},u.cookie)).json(),id=link.url.split('/').pop();
 await e.DB.prepare("UPDATE nocturne_quota SET writes=10000 WHERE day=date('now')").run();
 assert.equal((await call(e,'/api/listing',{publish:false},u.cookie)).status,200);assert.equal((await call(e,'/api/share/revoke',{id},u.cookie)).status,200);
 assert.equal((await call(e,'/api/share/'+id)).status,404);assert.equal((await(await call(e,'/api/account',undefined,u.cookie)).json()).listing,null);
 await assert.rejects(e.DB.prepare('UPDATE nocturne_accounts SET last_seen=last_seen').run(),/nocturne_capacity/);
});
