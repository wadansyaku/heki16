const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const origin = 'https://nocturne.ai-yu-me.com';
(async()=>{
  const expected = JSON.parse(fs.readFileSync('dist/version.json','utf8'));
  const response = await fetch(origin+'/version.json',{signal:AbortSignal.timeout(20000)});
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),expected,'The public release must match the local manifest');
  const checks = [];
  for (const [route, hash] of Object.entries(expected.assets)) {
    const response = await fetch(origin+route,{signal:AbortSignal.timeout(20000)});
    assert.equal(response.status,200,route);
    assert.equal(crypto.createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex'),hash,route);
    assert.match(response.headers.get('content-security-policy'),/connect-src 'self' https:\/\/challenges.cloudflare.com/);
    if(route.endsWith('/')&&route!=='/legacy/')assert.ok(!/noindex/i.test(response.headers.get('x-robots-tag')||''),route);
    checks.push({route,status:response.status,sha256Matches:true});
  }
  for(const route of ['/api/generate','/api/collect','/.env','/.git/config','/config/monetization.json','/unavailable-page','/ads.txt']) {
    const response=await fetch(origin+route,{signal:AbortSignal.timeout(20000)});
    assert.equal(response.status,404,route);
    checks.push({route,status:404});
  }
  const response404=await fetch(origin+'/unavailable-page');
  assert.match(await response404.text(),/noindex/);
  const reference=await fetch(origin+'/api/reference');assert.equal(reference.status,200);assert.deepEqual(await reference.json(),{ready:false});checks.push({route:'/api/reference',status:200,emptyReference:true});
  const invalid=await fetch(origin+'/api/research',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:'{}'});assert.equal(invalid.status,expected.researchIntakeEnabled?400:503);checks.push({route:'/api/research',status:invalid.status,invalidRejected:true});
  const cross=await fetch(origin+'/api/research',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://example.org'},body:'{}'});assert.equal(cross.status,403);checks.push({route:'/api/research',status:403,crossOriginRejected:true});
  for(const route of ['/legacy','/legacy/','/legacy/index.html']){const r=await fetch(origin+route,{signal:AbortSignal.timeout(20000)});assert.equal(r.status,200);assert.equal(new URL(r.url).pathname,'/');checks.push({route,status:200,unifiedRedirect:true});}
  const {INSTRUMENT,CONSENT}=await import('../src/diagnosis.mjs');
  const blocked=await fetch(origin+'/api/research',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({id:crypto.randomUUID(),deletionToken:crypto.randomBytes(32).toString('base64url'),token:'heki16-synthetic-invalid-response',instrument:INSTRUMENT,consent:CONSENT,adult:true,mode:40,answers:Array.from({length:40},(_,i)=>i%5),groups:[0,0,0,0]})});assert.equal(blocked.status,403);checks.push({route:'/api/research',status:403,validFortyQuestionShapeInvalidBotRejected:true});
  const {INSTRUMENT:currentInstrument,CONSENT:currentConsent}=await import('../src/nocturne.mjs');assert.equal(currentInstrument,expected.engineVersion);
  const config=await fetch(origin+'/api/config');assert.deepEqual(await config.json(),{localTest:false,instrument:currentInstrument});checks.push({route:'/api/config',status:200,productionTestBypassDisabled:true});
  const account=await fetch(origin+'/api/account');assert.deepEqual(await account.json(),{signedIn:false});checks.push({route:'/api/account',status:200,noPrivateData:true});
  const listings=await fetch(origin+'/api/listings');assert.equal(listings.status,401);checks.push({route:'/api/listings',status:401,anonymousScrapingRejected:true});
  const participant=await fetch(origin+'/api/participate',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,'X-Nocturne':'1'},body:JSON.stringify({id:crypto.randomUUID(),instrument:currentInstrument,consent:currentConsent,adult:true,context:{timeframe:'recent',mood:'ordinary',timeBand:'night'},persona:{age:'30-34',gender:'diverse'},token:'local-test-only'})});assert.equal(participant.status,403);checks.push({route:'/api/participate',status:403,localTestTokenRejected:true});
  const report={version:expected.version,origin,checkedAt:new Date().toISOString(),checks};
  console.log(JSON.stringify(report,null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
