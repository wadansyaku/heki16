const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const origin = 'https://heki16-pro.aiyume.workers.dev';
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
  const report={version:expected.version,origin,checkedAt:new Date().toISOString(),checks};
  console.log(JSON.stringify(report,null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
