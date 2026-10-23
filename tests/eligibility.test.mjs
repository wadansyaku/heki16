import test from 'node:test';
import assert from 'node:assert/strict';
import {handleEligibility,eligibilityStatus} from '../src/eligibility-service.mjs';
import {SITE_ELIGIBILITY_POLICY,ELIGIBILITY_MAX_AGE} from '../src/eligibility-core.mjs';
import worker from '../src/worker.mjs';

const origin='https://kuseiro.com',now=Date.parse('2026-10-22T00:00:00Z');
const environment=()=>({SITE_ORIGIN:origin,ELIGIBILITY_SECRET:'test-eligibility-secret-at-least-32-characters',API_LIMIT:{limit:async()=>({success:true})},GLOBAL_LIMIT:{limit:async()=>({success:true})}});
const post=(body={policy:SITE_ELIGIBILITY_POLICY,confirmed:true},headers={})=>new Request(origin+'/api/eligibility',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
const get=cookie=>new Request(origin+'/api/eligibility',{headers:cookie?{Cookie:cookie}:{}});
const cookieOf=response=>response.headers.get('Set-Cookie')?.split(';')[0];

test('first-visit confirmation uses a bounded host-only cookie and no diagnosis or database data',async()=>{
 const env=environment();assert.deepEqual(await (await handleEligibility(get(),env,now)).json(),{eligible:false,policy:SITE_ELIGIBILITY_POLICY});
 const response=await handleEligibility(post(),env,now);assert.equal(response.status,200);
 assert.match(response.headers.get('Set-Cookie'),/HttpOnly; SameSite=Lax; Secure$/);assert.ok(!response.headers.get('Set-Cookie').includes('Domain='));
 assert.equal(response.headers.get('Cache-Control'),'no-store');const cookie=cookieOf(response);
 assert.deepEqual(await eligibilityStatus(get(cookie),env,now+1),{eligible:true,policy:SITE_ELIGIBILITY_POLICY,validUntil:now+ELIGIBILITY_MAX_AGE});
 assert.equal(await eligibilityStatus(get(cookie),env,now+ELIGIBILITY_MAX_AGE),null);
 assert.equal(await eligibilityStatus(get(cookie),env,now-1),null);
 assert.equal(await eligibilityStatus(get(cookie+'; '+cookie),env,now),null);
 assert.equal(await eligibilityStatus(get(cookie.slice(0,-1)+(cookie.endsWith('f')?'e':'f')),env,now),null);
 assert.equal(await eligibilityStatus(get(cookie),{...env,ELIGIBILITY_SECRET:'other-secret'},now),null);
 assert.equal(await eligibilityStatus(new Request('https://other.test/api/eligibility',{headers:{Cookie:cookie}}),{...env,SITE_ORIGIN:'https://other.test'},now),null);
 const declined=await handleEligibility(post({policy:SITE_ELIGIBILITY_POLICY,confirmed:false}),env,now);assert.equal((await declined.json()).eligible,false);assert.match(declined.headers.get('Set-Cookie'),/Max-Age=0/);
});
test('missing keys, test bypasses, malformed, cross-site and limited confirmations fail closed',async()=>{
 const env=environment();
 for(const body of [{},{confirmed:true},{policy:'old',confirmed:true},{policy:SITE_ELIGIBILITY_POLICY,confirmed:'true'},{policy:SITE_ELIGIBILITY_POLICY,confirmed:true,age:20},null])assert.equal((await handleEligibility(post(body),env,now)).status,400);
 for(const headers of [{Origin:'https://other.test'},{'Sec-Fetch-Site':'cross-site'},{'Content-Type':'text/plain'}])assert.ok((await handleEligibility(post(undefined,headers),env,now)).status>=400);
 assert.equal((await handleEligibility(post({policy:SITE_ELIGIBILITY_POLICY,confirmed:true,padding:'x'.repeat(600)}),env,now)).status,400);
 assert.equal((await handleEligibility(post(),{...env,ELIGIBILITY_SECRET:null,LOCAL_TEST_MODE:'true'},now)).status,503);
 assert.equal((await handleEligibility(post(),{...env,API_LIMIT:{limit:async()=>({success:false})}},now)).status,429);
 assert.equal((await handleEligibility(new Request(origin+'/api/eligibility',{method:'DELETE'}),env,now)).status,405);
});
test('the Worker denies diagnosis and listing access before any database work, while deletion stays available',async()=>{
 const env=environment();
 for(const path of ['/api/participate','/api/progress','/api/complete','/api/listing','/api/listings','/api/share/abcdefghijklmnop']){
  const r=await worker.fetch(new Request(origin+path),env);assert.equal(r.status,403);assert.equal((await r.json()).error,'eligibility_required');
 }
 const r=await worker.fetch(new Request(origin+'/api/account/delete',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Nocturne':'1'},body:'{}'}),env);
 assert.notEqual((await r.json()).error,'eligibility_required');
});
