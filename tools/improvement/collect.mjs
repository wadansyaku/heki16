import {promises as fs} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const fail=code=>{throw Error(code);};
const repos=new Set(['formbricks/formbricks','LimeSurvey/LimeSurvey']);
const RELEVANCE_POLICY=2;
const strict=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).every(k=>keys.includes(k));
export function validateSources(v){
 if(!strict(v,['version','lookbackDays','intervalHours','sources'])||v.version!==1||!Number.isInteger(v.lookbackDays)||v.lookbackDays<1||v.lookbackDays>365||!Number.isInteger(v.intervalHours)||v.intervalHours<6||v.intervalHours>168||!Array.isArray(v.sources)||!v.sources.length||v.sources.length>6)fail('INVALID_SOURCES');
 const ids=new Set();for(const s of v.sources){if(!strict(s,['id','provider','repo','query'])||!(/^[a-z][a-z0-9-]{0,40}$/).test(s.id)||ids.has(s.id)||!['hn','github'].includes(s.provider)||typeof s.query!=='string'||!(/^[a-zA-Z0-9 ]{3,60}$/).test(s.query)||s.provider==='github'&&!repos.has(s.repo)||s.provider==='hn'&&s.repo!==undefined)fail('INVALID_SOURCES');ids.add(s.id);}return v;
}
function requestUrl(s,since){
 if(s.provider==='hn')return 'https://hn.algolia.com/api/v1/search_by_date?'+new URLSearchParams({query:s.query,tags:'comment',hitsPerPage:'8',numericFilters:'created_at_i>='+Math.floor(since/1000)});
 return 'https://api.github.com/search/issues?'+new URLSearchParams({q:`repo:${s.repo} is:issue ${s.query} updated:>=${new Date(since).toISOString().slice(0,10)}`,per_page:'8',sort:'updated',order:'desc'});
}
export async function boundedJson(url,fetcher=fetch){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 try{
  const response=await fetcher(url,{redirect:'error',signal:controller.signal,credentials:'omit',headers:{Accept:'application/json','User-Agent':'KUSEIRO-VoiceReview/1.0 (+https://nocturne.ai-yu-me.com/)'}});
  if(!response.ok)fail(response.status===429||response.status===403?'SOURCE_RATE_LIMIT':'SOURCE_HTTP_ERROR');
  if(!/json/i.test(response.headers.get('content-type')||''))fail('SOURCE_FORMAT');
  if(Number(response.headers.get('content-length'))>524288)fail('SOURCE_TOO_LARGE');
  const reader=response.body.getReader();let size=0;const parts=[];
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>524288)fail('SOURCE_TOO_LARGE');parts.push(value);}}finally{await reader.cancel();}
  return JSON.parse(Buffer.concat(parts).toString('utf8'));
 }finally{clearTimeout(timer);}
}
const signalRules={privacy:/privacy|consent|tracking|anonymous|anonymity/i,sharing:/shar(?:e|ing)|social|twitter|\bx\.com\b/i,usability:/mobile|ux|ui\b|usability|confus|accessib/i,validity:/validity|reliab|accurac|bias|scientif/i};
function relevantBody(body,query){
 // A search result may match only its parent story or an HTML attribute.
 const plain=body.replace(/<[^>]*>/g,' ').replace(/&(?:#\d+|#x[\da-f]+|[a-z]+);/gi,' ').toLowerCase();
 const words=new Set(plain.match(/[a-z0-9]+/g)||[]);
 return query.toLowerCase().split(/\s+/).filter(Boolean).every(word=>words.has(word)||words.has(word+'s')||word==='quiz'&&words.has('quizzes'));
}
export function normalizeHits(source,data,now,since){
 const hits=source.provider==='hn'?data.hits:data.items;if(!Array.isArray(hits)||hits.length>8)fail('SOURCE_FORMAT');
 if(source.provider==='github'&&data.incomplete_results!==false)fail('SOURCE_INCOMPLETE');
 const rows=[];for(const hit of hits){
  const num=source.provider==='hn'?hit.objectID:hit.number;
  if(!/^[1-9]\d{0,14}$/.test(String(num)))continue;
  const published=Date.parse(source.provider==='hn'?hit.created_at:hit.updated_at);
  if(!Number.isFinite(published)||published<since||published>now)continue;
  const body=String(source.provider==='hn'?hit.comment_text||'':(hit.title||'')+' '+(hit.body||''));
  if(!relevantBody(body,source.query))continue;
  const signals=Object.entries(signalRules).filter(([,rule])=>rule.test(body)).map(([name])=>name);
  // Do not persist text, handles, author IDs, profiles, or inferred sexual preferences.
  const url=source.provider==='hn'?`https://news.ycombinator.com/item?id=${num}`:`https://github.com/${source.repo}/issues/${num}`;
  if(hit.pull_request||hit.deleted||hit.dead)continue;
  rows.push({key:crypto.createHash('sha256').update(url).digest('hex'),url,sourceIds:[source.id],provider:source.provider,observedAt:new Date(now).toISOString(),sourceUpdatedAt:new Date(published).toISOString(),signals,reviewStatus:'unreviewed',targetUserConfirmed:false});
 }return rows;
}
export async function collectSources(config,previous=null,{fetcher=fetch,now=Date.now()}={}){
 validateSources(config);
 const configSha256=crypto.createHash('sha256').update(JSON.stringify(config)).digest('hex');
 if(previous){
  if(!strict(previous,['version','relevancePolicy','lastAttemptAt','items','sources','executionAuthorized','coverage','newCount','configSha256'])||previous.version!==1||previous.relevancePolicy!==undefined&&previous.relevancePolicy!==RELEVANCE_POLICY||!Array.isArray(previous.items)||previous.items.length>500||!Number.isFinite(Date.parse(previous.lastAttemptAt))||Date.parse(previous.lastAttemptAt)>now||previous.executionAuthorized!==false||!Array.isArray(previous.sources)||previous.sources.length>6)fail('INVALID_COLLECTION_STATE');
  for(const r of previous.items){
   if(!strict(r,['key','url','sourceIds','provider','observedAt','sourceUpdatedAt','signals','reviewStatus','targetUserConfirmed'])||typeof r.url!=='string'||!/^https:\/\/(?:news\.ycombinator\.com\/item\?id=[1-9]\d{0,14}|github\.com\/(?:formbricks\/formbricks|LimeSurvey\/LimeSurvey)\/issues\/[1-9]\d{0,14})$/.test(r.url)||r.key!==crypto.createHash('sha256').update(r.url).digest('hex')||!Array.isArray(r.sourceIds)||!r.sourceIds.length||r.sourceIds.length>6||r.sourceIds.some(id=>typeof id!=='string'||!/^[a-z][a-z0-9-]{0,40}$/.test(id))||!Array.isArray(r.signals)||r.signals.some(s=>!Object.hasOwn(signalRules,s))||r.reviewStatus!=='unreviewed'||r.targetUserConfirmed!==false||!['hn','github'].includes(r.provider)||!['observedAt','sourceUpdatedAt'].every(k=>Number.isFinite(Date.parse(r[k]))&&Date.parse(r[k])<=now))fail('INVALID_COLLECTION_STATE');
  }
  for(const s of previous.sources)if(!strict(s,['id','status','count','error'])||typeof s.id!=='string'||!/^[a-z][a-z0-9-]{0,40}$/.test(s.id)||!['ok','unavailable'].includes(s.status)||s.status==='ok'&&(!Number.isInteger(s.count)||s.count<0||s.count>8)||s.status==='unavailable'&&(s.count!==null||!['SOURCE_RATE_LIMIT','SOURCE_HTTP_ERROR','SOURCE_FORMAT','SOURCE_TOO_LARGE','SOURCE_INCOMPLETE','SOURCE_UNAVAILABLE'].includes(s.error)))fail('INVALID_COLLECTION_STATE');
 }
 const samePolicy=previous?.relevancePolicy===RELEVANCE_POLICY;
 if(previous&&samePolicy&&previous.configSha256===configSha256&&now-Date.parse(previous.lastAttemptAt)<config.intervalHours*3600000)return {state:previous,skipped:true,newCount:0};
 // Legacy pointers have no retained body to recheck. Rebuild once rather than grandfathering them.
 const since=now-config.lookbackDays*86400000,items=new Map((samePolicy?previous.items:[]).filter(r=>Date.parse(r.observedAt)>now-30*86400000&&Date.parse(r.sourceUpdatedAt)>=since).map(r=>[r.key,r]));
 const sources=[],knownKeys=new Set((previous?.items||[]).map(r=>r.key));let newCount=0;
 for(const source of config.sources){
  try{const rows=normalizeHits(source,await boundedJson(requestUrl(source,since),fetcher),now,since);for(const row of rows){const old=items.get(row.key);if(old){row.sourceIds=[...new Set([...old.sourceIds,...row.sourceIds])];}else if(!knownKeys.has(row.key))newCount++;items.set(row.key,row);}sources.push({id:source.id,status:'ok',count:rows.length});}
  catch(error){const code=['SOURCE_RATE_LIMIT','SOURCE_HTTP_ERROR','SOURCE_FORMAT','SOURCE_TOO_LARGE','SOURCE_INCOMPLETE'].includes(error.message)?error.message:'SOURCE_UNAVAILABLE';sources.push({id:source.id,status:'unavailable',count:null,error:code});}
 }
 return {skipped:false,newCount,state:{version:1,relevancePolicy:RELEVANCE_POLICY,configSha256,lastAttemptAt:new Date(now).toISOString(),items:[...items.values()].sort((a,b)=>b.observedAt.localeCompare(a.observedAt)).slice(0,500),sources,newCount,executionAuthorized:false,coverage:{targetUserEvidence:false,representative:false,languages:['en'],note:'本文にも検索語がある公開コメント・不具合報告の探索候補。KUSEIRO利用者の需要や多数意見ではない。本文・投稿者を保存せず、原典の要約と対象者との一致、利用条件は人が確認する。'}}};
}
export function collectionReviewMarkdown(state){
 return '# 外部の声・確認待ち\n\n取得: '+state.lastAttemptAt+'\n\n'+state.coverage.note+' HN/GitHubの英語中心の検索設定です。現在の候補の取得元は'+new Set(state.items.map(item=>item.provider)).size+'種類です。件数は利用者数・賛成人数ではありません。自動実装・自動公開の承認は含みません。\n\n'+
  state.sources.map(s=>`- ${s.id}: ${s.status==='ok'?s.count+'件':'未取得（'+s.error+'）'}`).join('\n')+'\n\n## 原典の確認候補\n\n'+state.items.map(r=>`- [原典](${r.url}) / ${r.sourceIds.join(', ')} / 論点: ${r.signals.join(', ')||'未分類'} / 出典更新: ${r.sourceUpdatedAt}`).join('\n')+
  '\n\n## 次の判断\n\n対象者との一致、原典と要約の正確さ、反対意見、利用条件を確認してからintakeのsourcesへ人が要約を登録します。収集候補そのものをtarget_user_voiceの根拠にはしません。新たな課題は背景・現状・最小要件・完成条件・停止条件をそろえ、既存の承認済みspecへ別途移します。\n';
}
export async function runCollection(configFile,stateDir){
 const configStat=await fs.lstat(configFile);if(configStat.isSymbolicLink()||!configStat.isFile()||configStat.size>16384)fail('INVALID_SOURCES');
 const config=validateSources(JSON.parse(await fs.readFile(configFile,'utf8'))),dir=path.resolve(stateDir);
 if(dir===ROOT||dir.startsWith(ROOT+path.sep))fail('STATE_OUTSIDE_REPOSITORY_REQUIRED');
 await fs.mkdir(dir,{recursive:true,mode:0o700});
 for(let p=dir;;p=path.dirname(p)){if((await fs.lstat(p)).isSymbolicLink())fail('SYMLINK_STATE');if(path.dirname(p)===p)break;}
 const lock=await fs.open(path.join(dir,'collect.lock'),'wx',0o600);
 try{
  const target=path.join(dir,'collection.json');let previous=null;
  try{const stat=await fs.lstat(target);if(stat.isSymbolicLink()||!stat.isFile()||stat.size>1048576)fail('INVALID_COLLECTION_STATE');previous=JSON.parse(await fs.readFile(target,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
  const result=await collectSources(config,previous);
  if(!result.skipped){const temp=path.join(dir,'collection.'+crypto.randomUUID()+'.tmp');try{await fs.writeFile(temp,JSON.stringify(result.state,null,2)+'\n',{flag:'wx',mode:0o600});await fs.rename(temp,target);}finally{await fs.rm(temp,{force:true});}}
  // This is a disposable view, not the controller's source of truth.
  const review=path.join(dir,'review.md');try{if((await fs.lstat(review)).isSymbolicLink())fail('SYMLINK_STATE');}catch(e){if(e.code!=='ENOENT')throw e;}
  await fs.writeFile(review,collectionReviewMarkdown(result.state),{mode:0o600});
  return {skipped:result.skipped,newCount:result.newCount,totalCandidates:result.state.items.length,sources:result.state.sources,executionAuthorized:false};
 }finally{await lock.close();await fs.unlink(path.join(dir,'collect.lock'));}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const args=process.argv.slice(2);if(args.length!==4||args[0]!=='--config'||args[2]!=='--state')fail('INVALID_ARGS');const result=await runCollection(args[1],args[3]);console.log(JSON.stringify(result));if(result.sources.every(s=>s.status!=='ok'))process.exitCode=2;}
 catch(e){console.error(JSON.stringify({error:['STATE_OUTSIDE_REPOSITORY_REQUIRED','SYMLINK_STATE','INVALID_COLLECTION_STATE'].includes(e.message)?e.message:'COLLECTION_FAILED'}));process.exitCode=2;}
}
