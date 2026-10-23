import test from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {handleAffiliate,DELIVERY_CONTROL_KEY,stopAffiliateForRecovery} from '../src/affiliate-service.mjs';
import {handleEligibility} from '../src/eligibility-service.mjs';
import {ELIGIBILITY_POLICY,promotionForm} from '../src/affiliate-core.mjs';
import {publicCampaigns,validateAffiliateConfig,KUSEIRO_MEDIA_APPROVAL,MYFANS_MEDIA_POLICY,advertisingFormOrigins} from '../src/affiliate-config.mjs';
import {D1} from './fixtures/d1.mjs';

const origin='https://kuseiro.com',now=Date.parse('2026-10-21T00:00:00Z');
const campaign={id:'reviewed-one',merchant:'myfans',title:'Reviewed <title>',description:'Reviewed description',url:'https://example.org/offer?ref=approved',placements:['post-share'],creativeApproved:true,linkVerified:true,reviewedAt:'2026-10-20',expiresAt:'2026-11-01',affinities:[]};
const settings={provider:'myfans',enabled:true,accountApproved:true,siteApproved:true,mediaUrl:'https://kuseiro.com/',personalizationEnabled:false,allowedHosts:['example.org'],campaigns:[campaign]};
class R2{constructor(){this.files=new Map();}async put(key,value){this.files.set(key,value);}async get(key){const value=this.files.get(key);return value===undefined?null:{json:async()=>JSON.parse(value)};}}
const env=()=>({SITE_ORIGIN:origin,ELIGIBILITY_SECRET:'test-eligibility-secret-at-least-32-characters',DB:new D1(),EVIDENCE:new R2(),API_LIMIT:{limit:async()=>({success:true})},GLOBAL_LIMIT:{limit:async()=>({success:true})}});
const ageResponse=await handleEligibility(new Request(origin+'/api/eligibility',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({policy:ELIGIBILITY_POLICY,confirmed:true})}),env(),now);
const ageCookie=ageResponse.headers.get('Set-Cookie').split(';')[0];
const request=(body='eligibility='+ELIGIBILITY_POLICY,extra={})=>new Request(origin+'/out/reviewed-one',{method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded',Cookie:ageCookie,...extra},body});
const enable=async e=>{await e.DB.prepare("UPDATE nocturne_delivery_controls SET enabled=1 WHERE name='affiliate'").run();await e.EVIDENCE.put(DELIVERY_CONTROL_KEY,JSON.stringify({v:1,enabled:true,updatedAt:now}));};

test('departures reuse a current signed first-visit confirmation and reject missing or modified evidence',async()=>{
 const e=env();await enable(e);
 for(const body of ['', 'eligibility=true','adult=true','eligibility='+ELIGIBILITY_POLICY+'&answer=private','eligibility='+ELIGIBILITY_POLICY+'&eligibility='+ELIGIBILITY_POLICY]){
  const response=await handleAffiliate(request(body),e,settings,now);assert.equal(response.status,403);assert.equal(response.headers.get('Location'),null);
 }
 for(const Cookie of ['',ageCookie+'x'])assert.equal((await handleAffiliate(request(undefined,{Cookie}),e,settings,now)).status,403);
 assert.equal((await handleAffiliate(request(),e,settings,now+31*86400000)).status,503);
 const response=await handleAffiliate(request(),e,settings,now);
 assert.equal(response.status,303);assert.equal(response.headers.get('Location'),campaign.url);
 assert.equal(response.headers.get('Referrer-Policy'),'no-referrer');assert.equal(response.headers.get('Cache-Control'),'no-store');assert.equal(response.headers.get('Set-Cookie'),null);
 assert.equal(await e.DB.prepare('SELECT COUNT(*) n FROM nocturne_records').first('n'),0);
});
test('already-open forms stop immediately after a runtime stop; missing controls and bindings fail closed',async()=>{
 const e=env();assert.equal((await handleAffiliate(request(),e,settings,now)).status,503);
 await enable(e);assert.equal((await handleAffiliate(request(),e,settings,now)).status,303);
 await e.DB.prepare("UPDATE nocturne_delivery_controls SET enabled=0 WHERE name='affiliate'").run();
 assert.equal((await handleAffiliate(request(),e,settings,now)).status,503);
 for(const changed of [{DB:null},{EVIDENCE:null},{API_LIMIT:null},{GLOBAL_LIMIT:null},{RECOVERY_MODE:crypto.randomUUID()},{AFFILIATE_ENABLED:'false'}])assert.equal((await handleAffiliate(request(),{...e,...changed},settings,now)).status,503);
 e.DB.db.exec('DROP TABLE nocturne_delivery_controls');assert.equal((await handleAffiliate(request(),e,settings,now)).status,503);
});
test('GET, cross-site, unapproved, expired, modified, and oversized departures cannot reach a merchant',async()=>{
 const e=env();await enable(e);
 assert.equal((await handleAffiliate(new Request(origin+'/out/reviewed-one'),e,settings,now)).status,405);
 for(const h of [{Origin:'https://evil.test'},{'Sec-Fetch-Site':'cross-site'},{'Content-Type':'application/json'}])assert.equal((await handleAffiliate(request(undefined,h),e,settings,now)).status,403);
 assert.equal((await handleAffiliate(request('x'.repeat(257)),e,settings,now)).status,403);
 for(const change of [{siteApproved:false},{accountApproved:false},{enabled:false},{campaigns:[{...campaign,creativeApproved:false}]},{campaigns:[{...campaign,url:'https://evil.test/x'}]},{campaigns:[{...campaign,expiresAt:'2026-10-20'}]}])assert.equal((await handleAffiliate(request(),e,{...settings,...change},now)).status,503);
 const limited={...e,API_LIMIT:{limit:async()=>({success:false})}};assert.equal((await handleAffiliate(request(),limited,settings,now)).status,429);
});
test('catalog and visible forms reuse site confirmation without a repeated age checkbox',async()=>{
 const publicItems=publicCampaigns(validateAffiliateConfig(settings,now));
 assert.equal(publicItems[0].url,'/out/reviewed-one');assert.ok(!JSON.stringify(publicItems).includes('example.org'));
 const form=promotionForm(publicItems[0]);assert.match(form,/type="hidden" name="eligibility"/);assert.ok(!form.includes('checkbox'));assert.ok(!form.includes('checked'));assert.ok(!form.includes('example.org'));
 const e=env();let response=await handleAffiliate(new Request(origin+'/api/promotions/status'),e,settings,now);assert.deepEqual(await response.json(),{enabled:false});
 await enable(e);response=await handleAffiliate(new Request(origin+'/api/promotions/status'),e,settings,now);assert.deepEqual(await response.json(),{enabled:true});
});

test('D1 restore cannot undo a durable stop, and recovery requires deliberate reactivation',async()=>{
 const e=env();await enable(e);assert.equal((await handleAffiliate(request(),e,settings,now)).status,303);
 await stopAffiliateForRecovery(e,now);
 await e.DB.prepare("UPDATE nocturne_delivery_controls SET enabled=1 WHERE name='affiliate'").run();
 assert.equal((await handleAffiliate(request(),e,settings,now)).status,503);
 await enable(e);assert.equal((await handleAffiliate(request(),e,settings,now)).status,303);
});
test('legacy session origins and production test flags never expand the registered advertising medium',async()=>{
 const e=env();await enable(e);
 const legacy='https://nocturne.aiyume.workers.dev';
 const req=new Request(legacy+'/out/reviewed-one',{method:'POST',headers:{Origin:legacy,'Content-Type':'application/x-www-form-urlencoded'},body:'eligibility='+ELIGIBILITY_POLICY});
 assert.equal((await handleAffiliate(req,{...e,SITE_ORIGIN:legacy,PUBLIC_SITE_ORIGIN:origin},settings,now)).status,403);
 assert.equal((await handleAffiliate(req,{...e,SITE_ORIGIN:legacy,LOCAL_TEST_MODE:'true'},settings,now)).status,403);
});

test('native noreferrer forms require same-origin fetch metadata when Origin is null',async()=>{
 const e=env();await enable(e);
 assert.equal((await handleAffiliate(request(undefined,{Origin:'null','Sec-Fetch-Site':'same-origin'}),e,settings,now)).status,303);
 for(const site of ['same-site','cross-site','none',''])assert.equal((await handleAffiliate(request(undefined,{Origin:'null','Sec-Fetch-Site':site}),e,settings,now)).status,403);
 assert.equal((await handleAffiliate(request(undefined,{Origin:'https://evil.test','Sec-Fetch-Site':'same-origin'}),e,settings,now)).status,403);
});

test('approved-media policy requires a dated compliance review without asserting individual creative approval',async()=>{
 const checkedAt=Date.parse('2026-10-24T00:00:00Z');
 const reviewed={...campaign,creativeApproved:false,complianceVerified:true,publicationBasis:KUSEIRO_MEDIA_APPROVAL,reviewedAt:new Date(checkedAt).toISOString()};
 const current={...settings,campaigns:[reviewed]},e=env();await enable(e);
 // This path uses a newly confirmed first-visit cookie at the review time.
 assert.equal(validateAffiliateConfig(current,checkedAt).length,1);
 assert.equal((await handleAffiliate(request(),e,current,checkedAt)).status,303);
 for(const change of [{complianceVerified:false},{publicationBasis:'unverified-policy'},{publicationBasis:MYFANS_MEDIA_POLICY},{reviewedAt:'2026-10-22T04:22:20Z'},{reviewedAt:'2027-01-01'},{linkVerified:false}]){
  assert.equal((await handleAffiliate(request(),e,{...current,campaigns:[{...reviewed,...change}]},checkedAt)).status,503);
 }
 assert.equal((await handleAffiliate(request(),e,{...current,siteApproved:false},checkedAt)).status,503);
 assert.equal((await handleAffiliate(request(),e,{...current,accountApproved:false},checkedAt)).status,503);
 assert.equal((await handleAffiliate(request(),e,current,Date.parse(reviewed.expiresAt))).status,503);
 assert.equal((await handleAffiliate(request(undefined,{Cookie:''}),e,current,checkedAt)).status,403);
 assert.equal((await handleAffiliate(request(),e,{...current,enabled:false},checkedAt)).status,503);
 const publicItems=publicCampaigns(validateAffiliateConfig(current,checkedAt));
 assert.ok(!JSON.stringify(publicItems).includes('complianceVerified'));
 assert.ok(!JSON.stringify(publicItems).includes('publicationBasis'));
});
test('form policy includes the official short-link destination without broadening other external resources',()=>{
 const reviewed={...settings,allowedHosts:['mfco.link'],campaigns:[{...campaign,url:'https://mfco.link/r/synthetic'}]};
 assert.deepEqual(advertisingFormOrigins(reviewed,now),['https://mfco.link','https://myfans.jp']);
 assert.deepEqual(advertisingFormOrigins({...reviewed,enabled:false},now),[]);
 assert.deepEqual(advertisingFormOrigins(reviewed,Date.parse(campaign.expiresAt)),[]);
 assert.throws(()=>advertisingFormOrigins({...reviewed,siteApproved:false},now));
});

test('KUSEIRO media approval does not inherit the previous medium',()=>{
 const draft=JSON.parse(readFileSync(new URL('../config/monetization.json',import.meta.url)));
 const reviewedAt=Date.parse('2026-10-24T00:00:00Z');
 assert.equal(draft.enabled,true);assert.equal(draft.siteApproved,true);assert.equal(draft.accountApproved,true);
 assert.equal(draft.mediaUrl,'https://kuseiro.com/');assert.equal(draft.personalizationEnabled,true);
 assert.equal(draft.campaigns.length,10);
 assert.ok(draft.campaigns.every(item=>item.publicationBasis===KUSEIRO_MEDIA_APPROVAL&&item.enabled===true));
 assert.equal(draft.campaigns[0].affinities.length,0);
 assert.ok(draft.campaigns.slice(1).every(item=>item.affinities.length===1));
 assert.equal(new Set(draft.campaigns.flatMap(item=>item.affinities)).size,9);
 assert.ok(!JSON.stringify(draft).includes('6SYku1UFVHp7FczHLoLH1fFt'));
 assert.ok(!JSON.stringify(draft).includes('nocturne.ai-yu-me.com'));
 const live=validateAffiliateConfig(draft,reviewedAt);
 assert.equal(live.length,10);
 assert.deepEqual(live[0].affinities,[]);
 assert.ok(live.some(item=>item.affinities.length===1&&item.affinities[0]==='lead'));
 assert.ok(live.some(item=>item.affinities.length===1&&item.affinities[0]==='restraintGive'));
 assert.throws(()=>validateAffiliateConfig({...settings,mediaUrl:'https://nocturne.ai-yu-me.com/'},reviewedAt),/approved provider and media/);
 assert.throws(()=>validateAffiliateConfig({...draft,campaigns:draft.campaigns.map(item=>({...item,publicationBasis:MYFANS_MEDIA_POLICY}))},reviewedAt),/verified link are required/);
});
