import test from 'node:test';
import assert from 'node:assert/strict';
import {adminIdentity} from '../src/admin-auth.mjs';
import admin,{readAdminReport} from '../src/admin-worker.mjs';
import {INSTRUMENT,CONSENT,emptyAnswers} from '../src/nocturne.mjs';

const env={ADMIN_EMAIL:'owner@example.com',ACCESS_AUD:'test-audience',ACCESS_ISSUER:'https://nocturne-test.cloudflareaccess.com'};
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
test('live report uses bounded database reads, preserves unknown metrics, and never returns raw rows',async()=>{
  const now=Date.now(),rows=[{account_id:'private-sentinel',instrument:INSTRUMENT,consent:CONSENT,answers:JSON.stringify(emptyAnswers()),dwell:JSON.stringify(Array(24).fill(0)),visited:1,cursor:0,timeframe:'recent',mood:'soft',age:'20-24',gender:'woman',time_band:'night',created_at:now,last_seen:now,completed_at:null,profile:null}];
  const database={prepare(sql){assert.match(sql,/LIMIT 2000/);assert.match(sql,/instrument=\?/);return {bind(...params){assert.equal(params[1],INSTRUMENT);return {all:async()=>({results:rows})};}};}};
  const report=await readAdminReport({DB:database},now);
  assert.equal(report.people,1);assert.equal(report.landingVisits,null);assert.equal(report.funnel[0].medianMs,null);
  assert.deepEqual(report.personaCohorts,[]);assert.ok(!JSON.stringify(report).includes('private-sentinel'));
  assert.equal((await admin.fetch(request('/api/report'),{...env,DB:database,ADMIN_LIMIT:{limit:async()=>({success:false})}},trusted)).status,429);
  assert.equal((await admin.fetch(new Request(request('/api/report'),{method:'POST'}),env,trusted)).status,405);
});
