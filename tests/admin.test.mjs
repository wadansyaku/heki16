import test from 'node:test';
import assert from 'node:assert/strict';
import {adminIdentity} from '../src/admin-auth.mjs';
import admin,{readAdminReport} from '../src/admin-worker.mjs';
import {INSTRUMENT,CONSENT,PREVIOUS_CONSENT,emptyAnswers,diagnose} from '../src/nocturne.mjs';

import {D1} from './fixtures/d1.mjs';
import {reportFilters} from '../src/admin-report.mjs';
import {scenario} from './fixtures/nocturne-scenarios.mjs';

const env={ADMIN_EMAIL:'owner@example.com',ACCESS_AUD:'test-audience',ACCESS_ISSUER:'https://nocturne-test.cloudflareaccess.com'};
test('two completed diagnoses by the same account count as one person and two responses',async()=>{
 const DB=new D1(),now=Date.now(),answers=scenario(['lead','giveCare']),profile=JSON.stringify(diagnose(answers));
 DB.db.prepare('INSERT INTO nocturne_accounts(id,created_at,last_seen) VALUES(?,?,?)').run('repeat-owner',now,now);
 const insert=DB.db.prepare('INSERT INTO nocturne_records(id,account_id,instrument,consent,answers,dwell,visited,cursor,timeframe,mood,age,gender,time_band,created_at,last_seen,completed_at,profile) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
 for(let i=0;i<2;i++)insert.run('repeat-'+i,'repeat-owner',INSTRUMENT,CONSENT,JSON.stringify(answers),JSON.stringify(Array(24).fill(1000)),16777215,23,'recent','ordinary','35-39','man','night',now-2+i,now,now,profile);
 const r=await readAdminReport({DB},now);
 assert.equal(r.people,1);assert.equal(r.started,2);assert.equal(r.completed,2);
 assert.equal(r.personaCohorts[0].people,1);assert.equal(r.personaCohorts[0].sessions,2);
 assert.equal(r.timeCohorts[0].people,1);assert.equal(r.daily[0].people,1);
 assert.equal(r.titles[0].people,1);assert.equal(r.titles[0].records,2);
 assert.equal(r.facets.find(f=>f.id==='lead').people,1);
});
const trusted={access:{aud:env.ACCESS_AUD,getIdentity:async()=>({email:env.ADMIN_EMAIL})}};
const request=path=>new Request('https://nocturne-admin.example'+path);
test('dashboard and assets fail closed before any database access, including spoofed identity headers',async()=>{
  for(const path of ['/','/admin.js','/admin.css','/api/report']){
    const req=new Request(request(path),{headers:{'Cf-Access-Authenticated-User-Email':env.ADMIN_EMAIL,'Cf-Access-Jwt-Assertion':'forged'}});
    const response=await admin.fetch(req,{...env,DB:{prepare(){throw Error('must not read');}}},{});
    assert.equal(response.status,403);assert.equal(response.headers.get('Cache-Control'),'no-store');
    assert.ok(!(await response.text()).includes('観測室'));
  }
  assert.equal(await adminIdentity(request('/'),{...env,ACCESS_AUD:'pending'},trusted),null);
  assert.equal(await adminIdentity(request('/'),{ACCESS_AUD:'x'},trusted),null);
});
test('Access must identify the allowed owner and the exact admin application',async()=>{
  assert.equal(await adminIdentity(request('/'),env,{access:{aud:'other-app',getIdentity:trusted.access.getIdentity}}),null);
  assert.equal(await adminIdentity(request('/'),env,{access:{aud:env.ACCESS_AUD,getIdentity:async()=>({email:'other@example.com'})}}),null);
  assert.equal((await adminIdentity(request('/'),env,trusted)).email,env.ADMIN_EMAIL);
  const page=await admin.fetch(request('/'),env,trusted);assert.equal(page.status,200);
  assert.match(page.headers.get('Content-Security-Policy'),/frame-ancestors 'none'/);
});
test('header fallback validates signature, issuer, audience, expiry and owner rather than trusting JWT claims',async()=>{
  const keys=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
  const jwk={...await crypto.subtle.exportKey('jwk',keys.publicKey),kid:'test-key'};
  const enc=value=>Buffer.from(typeof value==='string'?value:JSON.stringify(value)).toString('base64url');
  const now=Date.now(),claims={iss:env.ACCESS_ISSUER,aud:[env.ACCESS_AUD],email:env.ADMIN_EMAIL,iat:Math.floor(now/1000)-10,exp:Math.floor(now/1000)+60};
  async function token(p=claims,h={alg:'RS256',kid:jwk.kid}){const value=enc(h)+'.'+enc(p),sig=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',keys.privateKey,new TextEncoder().encode(value));return value+'.'+Buffer.from(sig).toString('base64url');}
  const transport=async()=>Response.json({keys:[jwk]});
  async function check(t){return adminIdentity(new Request(request('/'),{headers:{'Cf-Access-Jwt-Assertion':t}}),env,{},transport,now);}
  assert.ok(await check(await token()));
  for(const change of [{email:'other@example.com'},{aud:['other']},{iss:'https://other.cloudflareaccess.com'},{exp:0},{iat:now/1000+3600}])assert.equal(await check(await token({...claims,...change})),null);
  assert.equal(await check(await token(claims,{alg:'none',kid:jwk.kid})),null);
  const signed=await token();assert.equal(await check(signed.slice(0,-5)+'aaaaa'),null);
});
test('owner report uses all retained records, including more than 2,000 and older than seven days',async()=>{
 const DB=new D1(),now=Date.now(),before=now-10*86400000,answers=scenario(['lead','giveCare']);
 DB.db.exec('DROP TRIGGER nocturne_record_start');
 DB.db.exec('BEGIN');
 const account=DB.db.prepare('INSERT INTO nocturne_accounts(id,created_at,last_seen) VALUES(?,?,?)');account.run('private-sentinel',before,now);account.run('second-person',before,now);account.run('previous-person',before,now);
 const insert=DB.db.prepare('INSERT INTO nocturne_records(id,account_id,instrument,consent,answers,dwell,visited,cursor,timeframe,mood,age,gender,time_band,created_at,last_seen,completed_at,profile) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
 for(let i=0;i<2101;i++)insert.run('record-'+i,'private-sentinel',INSTRUMENT,CONSENT,JSON.stringify(answers),JSON.stringify(Array(24).fill(i%2?3000:1000)),16777215,23,'recent','soft','20-24','woman','night',before+i,now,now,JSON.stringify(diagnose(answers)));
 insert.run('incomplete','second-person',INSTRUMENT,CONSENT,JSON.stringify(emptyAnswers()),JSON.stringify(Array(24).fill(0)),1,0,'now','ordinary','30-34','man','night',now-3600000,now-3600000,null,null);
 insert.run('previous','previous-person',INSTRUMENT,PREVIOUS_CONSENT,JSON.stringify(answers),JSON.stringify(Array(24).fill(1000)),16777215,23,'recent','soft','20-24','woman','night',before,now,now,JSON.stringify(diagnose(answers)));
 DB.db.exec('COMMIT');
 const r=await readAdminReport({DB},now);
 assert.equal(r.started,2102);assert.equal(r.people,2);assert.equal(r.completed,2101);assert.equal(r.possiblyPaused,1);assert.equal(r.sampleLimit,null);
 assert.equal(r.funnel[0].seen,2102);assert.equal(r.funnel[0].answered,2101);assert.equal(r.funnel[0].medianMs,1000);assert.equal(r.funnel[0].p90Ms,3000);
 assert.equal(r.personaCohorts.find(c=>c.gender==='woman').people,1);assert.equal(r.personaCohorts.find(c=>c.gender==='woman').facets.lead,1);
 assert.equal(r.facets.find(f=>f.id==='lead').strong,1);assert.ok(!JSON.stringify(r).includes('private-sentinel'));assert.equal(r.landingVisits,0);
 const filtered=await readAdminReport({DB},now,new URLSearchParams('gender=man'));assert.equal(filtered.started,1);assert.equal(filtered.funnel[0].medianMs,null);assert.deepEqual(filtered.facets,[]);
 const seven=await readAdminReport({DB},now,new URLSearchParams('from='+new Date(now-6*86400000).toISOString().slice(0,10)));assert.equal(seven.started,1);
 for(let i=0;i<5;i++)insert.run('previous-retry-'+i,'previous-person',INSTRUMENT,PREVIOUS_CONSENT,JSON.stringify(answers),JSON.stringify(Array(24).fill(1000)),16777215,23,'recent','soft','20-24','woman','night',before,now,now,JSON.stringify(diagnose(answers)));
 const previous=await readAdminReport({DB},now,new URLSearchParams('consent=previous&minPeople=1'));assert.equal(previous.started,6);assert.equal(previous.filters.minPeople,5);assert.deepEqual(previous.personaCohorts,[]);assert.deepEqual(previous.titles,[]);assert.equal(previous.facets.find(f=>f.id==='lead').strong,null);assert.ok(previous.funnel.every(q=>q.choices.every(n=>n===null)));assert.ok(previous.funnel.every(q=>!Object.keys(q).some(k=>/^[cp]\d$/.test(k))));assert.equal(previous.funnel[0].medianMs,null);
 const expired=await readAdminReport({DB},now,new URLSearchParams('from=2020-01-01&to=2020-02-01'));assert.equal(expired.answerPeriodAvailable,false);assert.equal(expired.started,null);assert.equal(expired.landingVisits,null);
 const guarded={...env,DB,ADMIN_LIMIT:{limit:async()=>({success:true})}};
 assert.equal((await admin.fetch(request('/api/report?gender=forged'),guarded,trusted)).status,400);
 assert.equal((await admin.fetch(request('/api/report'),{...guarded,ADMIN_LIMIT:{limit:async()=>({success:false})}},trusted)).status,429);
 assert.equal((await admin.fetch(new Request(request('/api/report'),{method:'POST'}),guarded,trusted)).status,405);
});
test('date and attribute filters are validated before constructing database queries',()=>{
 for(const query of ['from=2026-02-30','from=2026-11-01&to=2026-10-01','gender=woman%27+OR+1%3D1','age=0','unknown=true','minPeople=0','consent=invalid'])assert.throws(()=>reportFilters(new URLSearchParams(query)));
});
