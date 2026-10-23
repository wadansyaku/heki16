const assert = require('node:assert/strict');
const {validateMonetization, renderAffiliateSection} = require('../scripts/monetization.cjs');
const now = Date.parse('2026-10-18T00:00:00Z');
const campaign = {id:'test-link',title:'A < B',description:'A & B',merchant:'Test "Merchant"',url:'https://example.org/product?ref=test',placements:['post-share'],expiresAt:'2027-10-18T00:00:00Z',reviewedAt:'2026-10-17T00:00:00Z',creativeApproved:true,linkVerified:true,affinities:['lead']};
const config = {provider:'myfans',enabled:true,accountApproved:true,siteApproved:true,mediaUrl:'https://kuseiro.com/',personalizationEnabled:false,allowedHosts:['example.org'],campaigns:[campaign]};
let passed = 0;
function test(name, fn) {fn();passed++;console.log('PASS '+name);}
test('Disabled monetization shows no ads or placeholder claims',()=>{
  const items=validateMonetization({enabled:false,siteApproved:false,allowedHosts:[],campaigns:[]},now);
  assert.deepEqual(items,[]);assert.equal(renderAffiliateSection(items,'home'),'');
});
test('Partner approval is mandatory for activation',()=>assert.throws(()=>validateMonetization({...config,siteApproved:false},now)));
test('Media, exact creative and generated link approval are each required before activation',()=>{
 for(const change of [{creativeApproved:false},{linkVerified:false},{reviewedAt:null},{reviewedAt:'2028-01-01'}])assert.throws(()=>validateMonetization({...config,campaigns:[{...campaign,...change}]},now));
 assert.throws(()=>validateMonetization({...config,mediaUrl:'https://other.example/'},now));
 assert.throws(()=>validateMonetization({...config,provider:'other'},now));
 assert.throws(()=>validateMonetization({...config,campaigns:[{...campaign,affinities:['gender']}]},now,['lead']));
});
test('Advertising URLs reject scripts, insecure schemes, credentials and unapproved hosts',()=>{
  for(const url of ['javascript:alert(1)','http://example.org/x','https://user:password@example.org/x','https://example.org.evil.test/x','https://example.org/x#scores=10'])assert.throws(()=>validateMonetization({...config,campaigns:[{...campaign,url}]},now),url);
});
test('Diagnostic information cannot be appended to advertising parameters',()=>{
  for(const key of ['partner','nickname','name','answers','scores','diagnosis','result','heki16_last_result','age','gender','facets','record_id','session','preferences','mood'])assert.throws(()=>validateMonetization({...config,campaigns:[{...campaign,url:'https://example.org/x?'+key+'=private'}]},now));
});
test('Expired and disabled campaigns disappear; missing expiry blocks publishing',()=>{
  assert.equal(validateMonetization({...config,campaigns:[{...campaign,expiresAt:'2026-10-17T00:00:00Z'}]},now).length,0);
  assert.equal(validateMonetization({...config,campaigns:[{...campaign,enabled:false}]},now).length,0);
  assert.throws(()=>validateMonetization({...config,campaigns:[{...campaign,expiresAt:undefined}]},now));
});
test('Only optional post-result and post-share placements are permitted',()=>{
 for(const place of ['quiz','home','result','content','listing'])assert.throws(()=>validateMonetization({...config,campaigns:[{...campaign,placements:[place]}]},now));
 assert.equal(validateMonetization({...config,campaigns:[{...campaign,placements:['post-result']}]},now)[0].placements[0],'post-result');
});
test('Build output omits approval metadata and disables personalization unless explicitly enabled',()=>{
 const item=validateMonetization(config,now)[0];assert.deepEqual(item.affinities,[]);assert.equal(item.creativeApproved,undefined);assert.equal(item.reviewedAt,undefined);
 assert.deepEqual(validateMonetization({...config,personalizationEnabled:true},now)[0].affinities,['lead']);
});
test('Rendering labels paid links and escapes untrusted copy',()=>{
  const html=renderAffiliateSection(validateMonetization(config,now),'post-share');
  assert.match(html,/広告・PR/);assert.match(html,/rel="noopener noreferrer"/);assert.match(html,/method="post"/);assert.match(html,/type="hidden" name="eligibility"/);
  assert.ok(!html.includes(campaign.url));assert.match(html,/action="\/out\/test-link"/);assert.match(html,/A &lt; B/);
  assert.match(html,/A &amp; B/);assert.match(html,/&quot;Merchant&quot;/);
  assert.ok(!html.includes('<script'));assert.equal(renderAffiliateSection([campaign],'quiz'),'');
});
console.log(`Monetization safeguards: ${passed} passed.`);
