// Presentation compatibility only. This never grants advertising approval or enables delivery.
import {promises as fs} from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import http from 'node:http';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {validateAffiliateConfig,MYFANS_MEDIA_POLICY} from '../src/affiliate-config.mjs';
import {resolveRecordedPath} from './workspace-paths.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const exec=promisify(execFile),hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const fail=code=>{throw Error(code);};
const read=async file=>{file=resolveRecordedPath(file);const s=await fs.lstat(file);if(!s.isFile()||s.isSymbolicLink()||s.size>2e6)fail('UNSAFE_PROOF_FILE');return fs.readFile(file);};
const json=async file=>JSON.parse(await read(file));
export function verifyReviewedConfig(current,record){
 const serialized=JSON.stringify(current);
 if(serialized===JSON.stringify(record.configAtSubmission))return;
 const review=record.configurationReviews?.at(-1),campaign=current.campaigns?.[0];
 if(record.releaseAuthorization?.basis!==MYFANS_MEDIA_POLICY||record.supportReply?.priorPerPostConfirmationRequired!==false||review?.supportReplyEmailId!==record.supportReply.emailId||review?.basis!==MYFANS_MEDIA_POLICY||review?.configSha256!==hash(serialized))fail('AD_CONFIG_CHANGED');
 if(current.enabled!==true||current.personalizationEnabled!==false||current.campaigns.length!==1||campaign.id!=='myfans-top'||campaign.enabled!==true||campaign.creativeApproved!==false||campaign.complianceVerified!==true||campaign.publicationBasis!==MYFANS_MEDIA_POLICY||campaign.affinities?.length!==0)fail('AD_CONFIG_CHANGED');
 // Only the explicit release decision may differ. Copy, URL, placement and privacy remain exact.
 const presentation=config=>{const value=structuredClone(config);delete value.enabled;for(const c of value.campaigns){for(const key of ['enabled','reviewedAt','complianceVerified','publicationBasis'])delete c[key];}return value;};
 if(JSON.stringify(presentation(current))!==JSON.stringify(presentation(record.configAtSubmission)))fail('AD_CONFIG_CHANGED');
 // Historical proof records the previous medium. Only the current registered medium is deliverable.
 if(current.mediaUrl==='https://kuseiro.com/')validateAffiliateConfig(current);
}
async function unchanged(record,root=ROOT){
 for(const f of Object.values(record.submittedFiles))if(hash(await read(f.path))!==f.sha256)fail('SUBMITTED_ORIGINAL_CHANGED');
 for(const [file,expected]of Object.entries(record.presentationSourceHashes))if(file!=='dist/app.css'&&hash(await read(path.join(root,file)))!==expected)fail('CREATIVE_SOURCE_CHANGED');
 verifyReviewedConfig(await json(path.join(root,'config/monetization.json')),record);
}
async function referenceProof(record,cssHash){
 const original=record.submittedFiles['17-myfans-submitted-creative.png'].sha256;
 const known=record.presentationCompatibilityChecks.find(c=>!c.pairedRenderVerification&&c.compatibleSha256===cssHash&&c.proofSha256===original);
 if(!known||hash(await read(known.proofScreenshot))!==original)fail('KNOWN_REFERENCE_REQUIRED');
 return known;
}
export async function checkPairedProof(record,entry,{root=ROOT}={}){
 await unchanged(record,root);
 if(entry.approvalGranted!==false||entry.changedFile!=='dist/app.css')fail('INVALID_COMPATIBILITY');
 const current=hash(await read(path.join(root,'dist/app.css')));
 if(entry.compatibleSha256!==current)fail('CURRENT_CSS_CHANGED');
 const bytes=await read(entry.pairedRenderVerification.path);
 if(hash(bytes)!==entry.pairedRenderVerification.sha256)fail('PAIRED_PROOF_CHANGED');
 const report=JSON.parse(bytes),original=record.submittedFiles['17-myfans-submitted-creative.png'].sha256;
 const reference=await referenceProof(record,report.referenceCssSha256);
 if(report.version!==1||report.kind!=='same-renderer-css-compatibility'||report.passed!==true||report.negativeProbe!==false||report.currentCssSha256!==current||report.submittedImageSha256!==original||entry.proofScreenshot!==reference.proofScreenshot||entry.proofSha256!==original||report.previewScriptSha256!==hash(await read(path.join(root,'scripts/preview-ad.mjs'))))fail('INVALID_PAIRED_PROOF');
 if(!Array.isArray(report.renders)||report.renders.length!==2||report.renders[0].width!==390||report.renders[0].height!==844||report.renders[1].width!==1440||report.renders[1].height!==900)fail('INVALID_PAIRED_PROOF');
 for(const render of report.renders){
  if(render.baseline.sha256!==render.candidate.sha256)fail('PRESENTATION_CHANGED');
  for(const file of [render.baseline,render.candidate]){
   if(!/^[a-z0-9-]+\.png$/.test(file.file))fail('UNSAFE_PROOF_FILE');
   const b=await read(path.join(path.dirname(entry.pairedRenderVerification.path),file.file));
   if(hash(b)!==file.sha256||b.toString('hex',0,8)!=='89504e470d0a1a0a'||b.readUInt32BE(16)!==render.width||b.readUInt32BE(20)!==render.height)fail('RENDER_PROOF_CHANGED');
  }
 }
 return {passed:true,creativeApproved:false,cssSha256:current,proofKind:report.kind};
}
export async function capturePair({recordFile,referenceCss,output,playwrightModule,browserExecutable,negativeProbe=false}){
 const record=await json(recordFile);await unchanged(record);
 const oldCss=await read(referenceCss),reference=await referenceProof(record,hash(oldCss));
 output=path.resolve(output);if(output===ROOT||output.startsWith(ROOT+path.sep))fail('PRIVATE_OUTPUT_REQUIRED');
 await fs.mkdir(output,{mode:0o700});
 await exec(process.execPath,[path.join(ROOT,'scripts/preview-ad.mjs'),path.join(output,'candidate')]);
 await fs.mkdir(path.join(output,'baseline'),{mode:0o700});
 const html=await read(path.join(output,'candidate/index.html'));
 await fs.writeFile(path.join(output,'baseline/index.html'),html,{mode:0o600});
 await fs.writeFile(path.join(output,'baseline/app.css'),oldCss,{mode:0o600});
 const currentCss=await read(path.join(ROOT,'dist/app.css'));
 if(negativeProbe)await fs.appendFile(path.join(output,'candidate/app.css'),'\nh2{display:none!important}\n');
 const server=http.createServer(async(req,res)=>{const m=/^\/(baseline|candidate)\/(index\.html|app\.css)$/.exec(req.url);if(!m){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',m[2].endsWith('css')?'text/css':'text/html; charset=utf-8');res.end(await read(path.join(output,m[1],m[2])));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 let browser;const renders=[];
 try{
  const sdk=await import(pathToFileURL(path.join(playwrightModule,'index.mjs')));
  browser=await sdk.chromium.launch({headless:true,executablePath:browserExecutable});
  const context=await browser.newContext({deviceScaleFactor:1,isMobile:true,serviceWorkers:'block'});
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  const page=await context.newPage();page.setDefaultTimeout(5000);
  for(const [width,height]of [[390,844],[1440,900]]){
   await page.setViewportSize({width,height});const pair={width,height};
   for(const mode of ['baseline','candidate']){
    await page.goto(origin+'/'+mode+'/index.html');
    await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().map(a=>a.finished));});
    const file=mode+'-'+width+'.png';const bytes=await page.screenshot({path:path.join(output,file),animations:'disabled'});
    if(bytes.readUInt32BE(16)!==width||bytes.readUInt32BE(20)!==height)fail('WRONG_CAPTURE_SCALE');
    pair[mode]={file,sha256:hash(bytes)};
   }
   renders.push(pair);
  }
  const report={version:1,kind:'same-renderer-css-compatibility',recordedAt:new Date().toISOString(),passed:renders.every(r=>r.baseline.sha256===r.candidate.sha256),negativeProbe,currentCssSha256:hash(currentCss),referenceCssSha256:hash(oldCss),submittedImageSha256:record.submittedFiles['17-myfans-submitted-creative.png'].sha256,previewScriptSha256:hash(await read(path.join(ROOT,'scripts/preview-ad.mjs'))),htmlSha256:hash(html),browser:{version:browser.version(),executable:browserExecutable,playwrightVersion:JSON.parse(await fs.readFile(path.join(playwrightModule,'package.json'))).version,platform:process.platform,arch:process.arch,deviceScaleFactor:1,headless:true,fontsAndAnimationsSettled:true},renders,creativeApproved:false};
  const reportPath=path.join(output,'comparison.json');const bytes=Buffer.from(JSON.stringify(report,null,2)+'\n');await fs.writeFile(reportPath,bytes,{mode:0o600,flag:'wx'});
  const entry={checkedAt:report.recordedAt,release:'26.6.2',changedFile:'dist/app.css',originalSha256:record.presentationSourceHashes['dist/app.css'],compatibleSha256:report.currentCssSha256,proofScreenshot:reference.proofScreenshot,proofSha256:report.submittedImageSha256,proofKind:'reference-and-paired-render',pairedRenderVerification:{path:reportPath,sha256:hash(bytes)},method:'Retain the submitted original and its existing CSS compatibility proof. The previously verified CSS and current CSS render byte-identical PNGs in the same pinned browser at 390x844 and 1440x900. This is a transitive presentation proof, not a claim that a new cross-browser capture equals the original PNG and not advertising approval.',approvalGranted:false};
  return {passed:report.passed,negativeProbe,entry};
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const [command,...a]=process.argv.slice(2);let result;
  if(command==='capture'&&(a.length===5||a.length===6&&a[5]==='--negative-probe'))result=await capturePair({recordFile:a[0],referenceCss:a[1],output:a[2],playwrightModule:a[3],browserExecutable:a[4],negativeProbe:a[5]==='--negative-probe'});
  else if(command==='check'&&a.length===1){const record=await json(a[0]);const entry=record.presentationCompatibilityChecks.at(-1);result=await checkPairedProof(record,entry);}
  else fail('INVALID_ARGUMENT');
  console.log(JSON.stringify(result));if(!result.passed)process.exitCode=2;
 }catch(error){console.error(JSON.stringify({error:/^[A-Z_]+$/.test(error.message)?error.message:'CREATIVE_VERIFICATION_FAILED'}));process.exitCode=2;}
}
