import test from 'node:test';
import assert from 'node:assert/strict';
import {promises as fs} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {checkPairedProof,verifyReviewedConfig} from '../scripts/verify-ad-preview.mjs';
import {MYFANS_MEDIA_POLICY} from '../src/affiliate-config.mjs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function fixture(t){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'creative-proof-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const root=path.join(dir,'product');for(const d of ['src','scripts','config','dist'])await fs.mkdir(path.join(root,d),{recursive:true});
 const write=async(file,b)=>{await fs.writeFile(file,b);return sha(b);};
 const current=Buffer.from('current CSS'),source=Buffer.from('unchanged client'),script=Buffer.from('reviewed preview');
 await write(path.join(root,'dist/app.css'),current);await write(path.join(root,'src/affiliate-client.mjs'),source);await write(path.join(root,'scripts/preview-ad.mjs'),script);
 const config={enabled:false,personalizationEnabled:false,campaigns:[]};await write(path.join(root,'config/monetization.json'),JSON.stringify(config));
 const png=(w,h)=>{const b=Buffer.alloc(24);Buffer.from('89504e470d0a1a0a','hex').copy(b);b.writeUInt32BE(w,16);b.writeUInt32BE(h,20);return b;};
 const original=path.join(dir,'submitted.png'),originalHash=await write(original,png(390,844));
 const message=path.join(dir,'message.txt'),messageHash=await write(message,'submitted copy');
 const renders=[];for(const [width,height]of [[390,844],[1440,900]]){const b=png(width,height),hash=sha(b);for(const mode of ['baseline','candidate'])await write(path.join(dir,mode+'-'+width+'.png'),b);renders.push({width,height,baseline:{file:'baseline-'+width+'.png',sha256:hash},candidate:{file:'candidate-'+width+'.png',sha256:hash}});}
 const report={version:1,kind:'same-renderer-css-compatibility',passed:true,negativeProbe:false,currentCssSha256:sha(current),referenceCssSha256:sha('known CSS'),submittedImageSha256:originalHash,previewScriptSha256:sha(script),renders};
 const reportFile=path.join(dir,'comparison.json'),reportHash=await write(reportFile,JSON.stringify(report));
 const reference={compatibleSha256:report.referenceCssSha256,proofScreenshot:original,proofSha256:originalHash};
 const record={submittedFiles:{'17-myfans-submitted-creative.png':{path:original,sha256:originalHash},'message.txt':{path:message,sha256:messageHash}},presentationSourceHashes:{'src/affiliate-client.mjs':sha(source),'dist/app.css':'old'},configAtSubmission:config,presentationCompatibilityChecks:[reference]};
 const entry={approvalGranted:false,changedFile:'dist/app.css',compatibleSha256:report.currentCssSha256,proofScreenshot:original,proofSha256:originalHash,pairedRenderVerification:{path:reportFile,sha256:reportHash}};
 return {root,dir,record,entry,report,reportFile,rewrite:async()=>{entry.pairedRenderVerification.sha256=await write(reportFile,JSON.stringify(report));}};
}
test('paired presentation proof preserves the submitted reference and never grants creative approval',async t=>{
 const f=await fixture(t);assert.deepEqual(await checkPairedProof(f.record,f.entry,{root:f.root}),{passed:true,creativeApproved:false,cssSha256:f.entry.compatibleSha256,proofKind:'same-renderer-css-compatibility'});
 f.entry.approvalGranted=true;await assert.rejects(checkPairedProof(f.record,f.entry,{root:f.root}),/INVALID_COMPATIBILITY/);
});
test('changed source, report, or render invalidates a previously passing compatibility proof',async t=>{
 const f=await fixture(t),options={root:f.root};
 const client=path.join(f.root,'src/affiliate-client.mjs');await fs.writeFile(client,'changed');await assert.rejects(checkPairedProof(f.record,f.entry,options),/CREATIVE_SOURCE_CHANGED/);await fs.writeFile(client,'unchanged client');
 await fs.appendFile(f.reportFile,' ');await assert.rejects(checkPairedProof(f.record,f.entry,options),/PAIRED_PROOF_CHANGED/);await f.rewrite();
 await fs.appendFile(path.join(f.dir,'candidate-390.png'),'changed');await assert.rejects(checkPairedProof(f.record,f.entry,options),/RENDER_PROOF_CHANGED/);
});
test('different rendered content and unproven reference CSS cannot authorize compatibility',async t=>{
 const f=await fixture(t),options={root:f.root};
 f.report.renders[0].candidate.sha256=sha('different image');await f.rewrite();await assert.rejects(checkPairedProof(f.record,f.entry,options),/PRESENTATION_CHANGED/);
 f.report.renders[0].candidate.sha256=f.report.renders[0].baseline.sha256;f.report.referenceCssSha256=sha('unreviewed CSS');await f.rewrite();await assert.rejects(checkPairedProof(f.record,f.entry,options),/KNOWN_REFERENCE_REQUIRED/);
});
test('a policy release can change only reviewed activation fields, never the submitted creative or privacy',()=>{
 const original={provider:'myfans',enabled:false,accountApproved:true,siteApproved:true,mediaUrl:'https://nocturne.ai-yu-me.com/',personalizationEnabled:false,allowedHosts:['mfco.link'],campaigns:[{id:'myfans-top',enabled:false,creativeApproved:false,linkVerified:true,title:'Reviewed copy',description:'Reviewed description',merchant:'myfans',url:'https://mfco.link/r/synthetic',placements:['post-share'],reviewedAt:null,expiresAt:'2099-01-01',affinities:[]}]};
 const current=structuredClone(original);current.enabled=true;Object.assign(current.campaigns[0],{enabled:true,complianceVerified:true,publicationBasis:MYFANS_MEDIA_POLICY,reviewedAt:'2026-10-22T04:22:20Z'});
 const record={configAtSubmission:original,releaseAuthorization:{basis:MYFANS_MEDIA_POLICY},supportReply:{emailId:'official-reply',priorPerPostConfirmationRequired:false},configurationReviews:[{supportReplyEmailId:'official-reply',basis:MYFANS_MEDIA_POLICY,configSha256:sha(JSON.stringify(current))}]};
 assert.doesNotThrow(()=>verifyReviewedConfig(current,record));
 const tamper=change=>{const value=structuredClone(current);change(value);const r=structuredClone(record);r.configurationReviews[0].configSha256=sha(JSON.stringify(value));assert.throws(()=>verifyReviewedConfig(value,r));};
 for(const field of ['title','description','url'])tamper(c=>{c.campaigns[0][field]='changed';});
 tamper(c=>{c.campaigns[0].placements=['result'];});tamper(c=>{c.personalizationEnabled=true;});tamper(c=>{c.campaigns[0].affinities=['lead'];});tamper(c=>{c.campaigns[0].creativeApproved=true;});
 record.configurationReviews[0].configSha256='0'.repeat(64);assert.throws(()=>verifyReviewedConfig(current,record),/AD_CONFIG_CHANGED/);
});
