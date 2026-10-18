const assert = require('node:assert/strict');
const {validateMonetization, renderAffiliateSection} = require('../scripts/monetization.cjs');
const now = Date.parse('2026-10-18T00:00:00Z');
const campaign = {id:'test-link',title:'A < B',description:'A & B',merchant:'Test "Merchant"',url:'https://example.org/product?ref=test',placements:['home','result','content'],expiresAt:'2027-10-18T00:00:00Z'};
const config = {enabled:true,siteApproved:true,allowedHosts:['example.org'],campaigns:[campaign]};
let passed = 0;
function test(name, fn) {fn();passed++;console.log('PASS '+name);}
test('Disabled monetization shows no ads or placeholder claims',()=>{
  const items=validateMonetization({enabled:false,siteApproved:false,allowedHosts:[],campaigns:[]},now);
  assert.deepEqual(items,[]);assert.equal(renderAffiliateSection(items,'home'),'');
});
test('Partner approval is mandatory for activation',()=>assert.throws(()=>validateMonetization({...config,siteApproved:false},now)));
test('Advertising URLs reject scripts, insecure schemes, credentials and unapproved hosts',()=>{
  for(const url of ['javascript:alert(1)','http://example.org/x','https://user:password@example.org/x','https://example.org.evil.test/x','https://example.org/x#scores=10'])assert.throws(()=>validateMonetization({...config,campaigns:[{...campaign,url}]},now),url);
});
test('Diagnostic information cannot be appended to advertising parameters',()=>{
  for(const key of ['partner','nickname','name','answers','scores','diagnosis','result','heki16_last_result'])assert.throws(()=>validateMonetization({...config,campaigns:[{...campaign,url:'https://example.org/x?'+key+'=private'}]},now));
});
test('Expired and disabled campaigns disappear; missing expiry blocks publishing',()=>{
  assert.equal(validateMonetization({...config,campaigns:[{...campaign,expiresAt:'2026-10-17T00:00:00Z'}]},now).length,0);
  assert.equal(validateMonetization({...config,campaigns:[{...campaign,enabled:false}]},now).length,0);
  assert.throws(()=>validateMonetization({...config,campaigns:[{...campaign,expiresAt:undefined}]},now));
});
test('No advertising placement is permitted inside the quiz',()=>assert.throws(()=>validateMonetization({...config,campaigns:[{...campaign,placements:['quiz']}]},now)));
test('Rendering labels paid links and escapes untrusted copy',()=>{
  const html=renderAffiliateSection(validateMonetization(config,now),'result');
  assert.match(html,/広告・PR/);assert.match(html,/rel="sponsored noopener noreferrer"/);
  assert.match(html,/referrerpolicy="no-referrer"/);assert.match(html,/A &lt; B/);
  assert.match(html,/A &amp; B/);assert.match(html,/&quot;Merchant&quot;/);
  assert.ok(!html.includes('<script'));assert.equal(renderAffiliateSection([campaign],'quiz'),'');
});
console.log(`Monetization safeguards: ${passed} passed.`);
