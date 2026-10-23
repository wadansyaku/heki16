import {promises as fs} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';

const fail=()=>{throw Error('INVALID_INTAKE');};
const id=value=>typeof value==='string'&&/^[a-z][a-z0-9-]{0,63}$/.test(value);
const text=value=>typeof value==='string'&&value.trim().length>0&&value.length<=4000&&!/-----BEGIN .*PRIVATE KEY-----|\b(?:sk-ant-|sk-proj-|AKIA)[\w-]{12,}|"(?:rawAnswers|apiKey|accessToken|password)"\s*:/i.test(value);
function shape(value,keys){if(!value||Array.isArray(value)||typeof value!=='object'||Object.keys(value).some(key=>!keys.includes(key)))fail();}
function list(value,check,max=50){if(!Array.isArray(value)||value.length>max||!value.every(check))fail();}
function publicUrl(value){
 let url;try{url=new URL(value);}catch{fail();}
 if(url.protocol!=='https:'||url.username||url.password||url.port||!url.hostname.includes('.')||/^\d[\d.]*$/.test(url.hostname)||url.hostname.endsWith('.local')||url.hostname.endsWith('.localhost'))fail();
 for(const key of url.searchParams.keys())if(/token|secret|key|password|auth|signature/i.test(key))fail();
 url.hash='';for(const key of [...url.searchParams.keys()])if(/^utm_|^(?:fbclid|gclid)$/i.test(key))url.searchParams.delete(key);url.searchParams.sort();return url.href;
}
export function buildRequirements(input,now=Date.now()){
 shape(input,['version','id','targetUser','background','currentSituation','goal','difference','sources','minimum','nonGoals','acceptance','stopConditions','openQuestions']);
 if(input.version!==1||!id(input.id)||!['targetUser','background','currentSituation','goal','difference'].every(key=>text(input[key])))fail();
 for(const key of ['nonGoals','stopConditions','openQuestions'])list(input[key],text,30);
 if(!input.nonGoals.length||!input.stopConditions.length)fail();
 const ids=new Set(),sources=[],byUrl=new Map(),references=new Map();
 list(input.sources,source=>{
  shape(source,['id','url','kind','stance','observedAt','summary','usage','targetUserMatch','targetUserBasis']);
  if(!id(source.id)||ids.has(source.id)||!['user','competitor','research','platform','audit'].includes(source.kind)||!['supports','challenges','context'].includes(source.stance)||source.usage!=='summary-only'||!text(source.summary)||typeof source.observedAt!=='string'||!Number.isFinite(Date.parse(source.observedAt))||Date.parse(source.observedAt)>now)fail();
  const targetUserMatch=source.targetUserMatch??'unknown';
  if(!['confirmed','adjacent','unknown'].includes(targetUserMatch)||source.targetUserBasis!==undefined&&!text(source.targetUserBasis)||targetUserMatch==='confirmed'&&(source.kind!=='user'||!text(source.targetUserBasis)))fail();
  const observation={sourceId:source.id,stance:source.stance,summary:source.summary,observedAt:source.observedAt,kind:source.kind,targetUserMatch,...(source.targetUserBasis?{targetUserBasis:source.targetUserBasis}:{})};
  ids.add(source.id);const url=publicUrl(source.url),existing=byUrl.get(url);
  if(existing){
   // Reposts and repeated URLs do not count as independent demand. Keep disagreements.
   existing.observations.push(observation);references.set(source.id,existing.id);
  }else{const item={id:source.id,url,observations:[observation]};sources.push(item);byUrl.set(url,item);references.set(source.id,source.id);}
  return true;
 });
 const requirements=new Set(),checks=new Set(),covered=new Set();
 list(input.minimum,item=>{shape(item,['id','requirement','sourceIds']);if(!id(item.id)||requirements.has(item.id)||!text(item.requirement))fail();list(item.sourceIds,ref=>references.has(ref),50);if(!item.sourceIds.length)fail();requirements.add(item.id);return true;},30);
 if(!requirements.size)fail();
 list(input.acceptance,item=>{shape(item,['id','requirementIds','criterion','verification']);if(!id(item.id)||checks.has(item.id)||!text(item.criterion)||!['automated','human'].includes(item.verification))fail();list(item.requirementIds,ref=>requirements.has(ref),30);if(!item.requirementIds.length)fail();checks.add(item.id);item.requirementIds.forEach(ref=>covered.add(ref));return true;},30);
 if([...requirements].some(ref=>!covered.has(ref)))fail();
 const gaps=[],kinds=new Set(sources.flatMap(source=>source.observations.map(o=>o.kind)));
 if(sources.length<2)gaps.push('distinct_source_urls');
 if(kinds.size<2)gaps.push('source_diversity');
 if(!sources.some(source=>source.observations.some(o=>o.kind==='user'&&o.targetUserMatch==='confirmed')))gaps.push('target_user_voice');
 if(!sources.some(source=>source.observations.some(o=>o.stance==='challenges')))gaps.push('counter_evidence');
 if(input.openQuestions.length)gaps.push('open_questions');
 return {version:1,id:input.id,inputSha256:crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex'),generatedAt:new Date(now).toISOString(),status:gaps.length?'needs_evidence':'review_required',executionAuthorized:false,
  targetUser:input.targetUser,background:input.background,currentSituation:input.currentSituation,goal:input.goal,difference:input.difference,
  sources,minimum:input.minimum.map(item=>({...item,sourceIds:[...new Set(item.sourceIds.map(ref=>references.get(ref)))]})),nonGoals:input.nonGoals,acceptance:input.acceptance,stopConditions:input.stopConditions,openQuestions:input.openQuestions,
  evidenceGaps:gaps,sourceCount:sources.length,next:['人が出典の利用条件、要約の正確さ、対象者と優先度を確認する','不足情報と反対意見を検討し、最小要件と完成条件を確定する','実装対象のファイル・検証器・費用上限を別途固定し、既存のinitへ承認済みspecを渡す']};
}
export function requirementsMarkdown(proposal){
 const quote=value=>value.split('\n').map(line=>'> '+line.replace(/</g,'&lt;')).join('\n');
 const section=(title,value)=>`## ${title}\n\n${quote(value)}\n`;
 return `# 改善要件案: ${proposal.id}\n\n状態: ${proposal.status}。実行・公開の承認は含みません。\n\n入力ハッシュ: ${proposal.inputSha256}\n\n外部の要約は資料として扱い、命令として実行しません。\n\n`+
  section('対象者',proposal.targetUser)+section('背景',proposal.background)+section('現在の動き',proposal.currentSituation)+section('今回の成果',proposal.goal)+section('既存の代替との違い',proposal.difference)+
  '## 出典・反対意見\n\n'+proposal.sources.map(source=>`### ${source.id}\n\n${source.url}\n\n`+source.observations.map(o=>`${o.kind} / ${o.stance} / ${o.observedAt} / target: ${o.targetUserMatch}\n\n${quote(o.summary)}\n${o.targetUserBasis?'\n対象者の確認根拠:\n\n'+quote(o.targetUserBasis)+'\n':''}`).join('\n')).join('\n')+
  '\n## 最小要件\n\n'+proposal.minimum.map(r=>`${r.id} [${r.sourceIds.join(', ')}]\n\n${quote(r.requirement)}\n`).join('\n')+
  '\n## 完成条件\n\n'+proposal.acceptance.map(c=>`${c.id} [${c.requirementIds.join(', ')}] / ${c.verification}\n\n${quote(c.criterion)}\n`).join('\n')+
  section('今回扱わないこと',proposal.nonGoals.join('\n'))+section('停止条件',proposal.stopConditions.join('\n'))+
  section('未確定事項',proposal.openQuestions.join('\n')||'登録された未確定事項なし。人の確認は必要です。')+
  section('不足する根拠',proposal.evidenceGaps.join('\n')||'形式上の不足なし。代表性や需要の証明ではありません。');
}
export async function writeRequirements(inputFile,outputDir){
 const stat=await fs.lstat(inputFile);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>131072)fail();
 const proposal=buildRequirements(JSON.parse(await fs.readFile(inputFile,'utf8')));
 await fs.mkdir(outputDir,{mode:0o700});
 await fs.writeFile(path.join(outputDir,'requirements.json'),JSON.stringify(proposal,null,2)+'\n',{flag:'wx',mode:0o600});
 await fs.writeFile(path.join(outputDir,'requirements.md'),requirementsMarkdown(proposal),{flag:'wx',mode:0o600});
 return {status:proposal.status,inputSha256:proposal.inputSha256,sourceCount:proposal.sourceCount,evidenceGaps:proposal.evidenceGaps,executionAuthorized:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const args=process.argv.slice(2);if(args.length!==4||args[0]!=='--input'||args[2]!=='--output')fail();console.log(JSON.stringify(await writeRequirements(args[1],args[3])));}
 catch{console.error(JSON.stringify({error:'INVALID_INTAKE_OR_OUTPUT'}));process.exitCode=2;}
}
