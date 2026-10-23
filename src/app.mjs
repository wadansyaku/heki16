import {dossierByTitle,dossierUrl} from './dossier-catalog.mjs';
import {resultReading} from './result-reading.mjs';
import {xIntentUrl,handoffToX} from './x-share.mjs';
import {informationLinks} from './navigation.mjs';
import {ensureEligibility,eligibilityReady} from './eligibility-client.mjs';
import {COPY} from './copy.mjs';
import {CHOICE_POLICY,publicationPreferred,rememberPublicationChoice,reconcilePublicationChoice,publicationReceiptApplies,REQUIRED_ENTRY_POLICY,requiredPublicationPending,missingEntryAgreement} from './consent.mjs';
import {createPublicationWriter} from './publication-writer.mjs';
import {LEGACY_ART_KEYS,TITLE_ART,artSource,preferredArt,validArt} from './art.mjs';
import {promotionEntry,openPromotion,forgetPromotionConsent} from './affiliate-client.mjs';
import {measure,clearBrowserMeasurements} from './metrics.mjs';
import {CLEANUP_KEY,browserCleanupWriteAllowed,browserCleanupPlan,applyBrowserCleanup,pendingBrowserCleanup,recoverBrowserCleanup,finishBrowserCleanup} from './browser-cleanup.mjs';
import {INSTRUMENT,CONSENT,PREVIOUS_CONSENT,SCENES,CHAPTERS,FACETS,MOODS,AGES,GENDERS,PROFILE_OPTIONS,emptyAnswers,bits,diagnose,publicCard,listingCard,compare,validAnswers,sceneText,choiceLabel,fallbackDossierFromCard,choiceConflict} from './nocturne.mjs';
import {visibleCard,facetRate,historyComparison,firstMissingChoice} from './presentation.mjs';
import {readResultLink} from './diagnosis.mjs';
import {organizeTags,normalizeLabel} from './tags.mjs';
import {phrases} from './phrasing.mjs';
import {reconcileVault,clearVaults,preserveInstrument,resetTrialData} from './vault.mjs';
const SITEKEY='__TURNSTILE_SITEKEY__',KEY='nocturne_1',$=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=s=>phrases(s).map(p=>`<span class="phrase">${esc(p)}</span>`).join('');
const icon=name=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${({arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',back:'<path d="M19 12H5m6-6-6 6 6 6"/>',check:'<path d="m5 12 4 4L19 6"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',key:'<circle cx="8" cy="9" r="4"/><path d="m11 12 8 8 2-2-2-2 1-1-2-2-1 1"/>',more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>'})[name]||''}</svg>`;
const btn=(label,action,style='',attrs='')=>`<button type="button" class="btn ${style}" data-action="${action}" ${attrs}>${label}</button>`;
function journeyMarkup(current){
 const labels=['診断','匿名掲載','結果','共有'];
 return `<ol class="flow-steps" aria-label="診断から共有までの流れ">${labels.map((label,index)=>`<li ${index===current?'aria-current="step"':''}><span class="flow-dot" aria-hidden="true"></span><span>${label}</span></li>`).join('')}</ol>`;
}
const select=(id,options,value)=>`<select id="${id}"${value===''?' required':''}>${value===''?'<option value="" selected disabled>選んでください</option>':''}${Object.entries(options).map(([v,l])=>`<option value="${v}" ${v===value?'selected':''}>${esc(l)}</option>`).join('')}</select>`;
const CENSOR_NOTE='「導入は『████████』で仮面を剥がし、クライマックスは『████████』でリミッターを外す。事後は『████████』が必須。」';
function load(){try{recoverBrowserCleanup(localStorage);resetTrialData(localStorage,'kuseiro-public-launch-20261023');const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved?.v===1&&(!saved.draft||validAnswers(saved.draft.answers)||saved.draft.instrument!==INSTRUMENT&&Array.isArray(saved.draft.answers)&&saved.draft.answers.length===24))return {subpage:0,censorOn:false,cardMode:'title',...saved};}catch{}let tags=[];for(const key of ['heki16_unified40_v3','heki16_unified40_v2','heki16_unified40_v1']){try{const old=JSON.parse(localStorage.getItem(key)||'null');if(old){tags=old.tags||[];break;}}catch{}}return {v:1,draft:null,localRecords:[],tags:organizeTags(tags),note:'',subpage:0,censorOn:false,cardMode:'title'};}
let cleanupPlan=null,localLogoutTask=null,lastCleanupNonce=pendingBrowserCleanup(localStorage)?.nonce||null;
let recordNext='profile',publicationPreview=null,publicationPreviewSeq=0,syncTask=null;
let state=load(),owner={signedIn:false,records:[],mutual:[]},config={localTest:false},page=0,sample=false,shared=null,listingItems=[],candidateIndex=0,filters={intent:'',age:'',gender:'',trait:'',relation:'any'},loadedListing=false,listingError='',listingNext=null,syncing=false,syncAgain=false,entered=0,tokenPromise=null,widget=null,epoch=0,syncController=null,shareUrl='',shareCard=null,shareNameOnly=false,shareReadyRecord=null;
const save=()=>{if(!browserCleanupWriteAllowed(localStorage,state.scope,lastCleanupNonce))return;try{localStorage.setItem(KEY,JSON.stringify(state));$('#storage-warning').hidden=true;}catch{$('#storage-warning').hidden=false;}};
function say(message){$('#status').textContent=message;clearTimeout(say.timer);say.timer=setTimeout(()=>$('#status').textContent='',5500);}
const errors={verification:'確認を完了できませんでした。画面の案内を確認してください。',wait:'少し時間をおいて、もう一度お試しください。',unavailable:'今は接続できません。この端末の回答は残っています。',sign_in:'記録を引き継いでから、もう一度お試しください。',not_found:'この記録は見つかりませんでした。',complete_first:'診断を終え、半分以上の場面に回答すると、相手を探せます。',publish_first:'自分のカルテを掲載してから、気になる相手を選べます。',review_pending:'掲載内容を確認しています。今は再掲載できません。',already_created:'引き継ぎキーは発行済みです。保存した控えを使ってください。',already_complete:'この診断は記録済みです。新しく診断すると別の記録になります。'};
async function api(path,data,options={}){const requestEpoch=epoch;if(data!==undefined&&!await settleBrowserLogout())throw Error('このブラウザのログアウトを完了できません。接続後にもう一度お試しください。');if(requestEpoch!==epoch)throw Error(errors.sign_in);const r=await fetch(path,{method:data===undefined?'GET':'POST',credentials:'same-origin',headers:data===undefined?{}:{'Content-Type':'application/json','X-Nocturne':'1',...(state.scope&&owner.signedIn?{'X-Nocturne-Scope':options.scope??state.scope}:{})},signal:options.signal,...(data===undefined?{}:{body:JSON.stringify(data),keepalive:true})});const p=await r.json();if(requestEpoch!==epoch)throw Error(errors.sign_in);if(!r.ok){if(p.error==='eligibility_required'&&!options.eligibilityRetried){const observedEpoch=epoch;await ensureEligibility({refresh:true});if(epoch!==observedEpoch)throw Error(errors.sign_in);return api(path,data,{...options,eligibilityRetried:true});}const e=Error(errors[p.error]||'操作を完了できませんでした。回答はこの端末に残っています。');e.code=p.error;e.revision=p.revision;throw e;}return p;}
const publicationWriter=createPublicationWriter({
 getScope:()=>owner.signedIn?state.scope:null,getPublication:()=>owner.publication,
 send:(body,scope)=>api('/api/listing/preference',body,{scope}),
 refresh:()=>refreshOwner(false,true),
 onSaved:(receipt,meta)=>{const applies=publicationReceiptApplies(state,owner.publication,receipt,meta);if(receipt.revision>=(owner.publication?.revision??0))owner.publication={...owner.publication,...receipt};if(applies)state=rememberPublicationChoice(state,meta.enabled,receipt.revision);save();},
 onError:(error,{latest})=>{if(latest)say(error.message||'掲載設定を保存できませんでした。もう一度選んでください。');}
});
async function savePublicationChoice(enabled){
 state=rememberPublicationChoice(state,enabled,owner.publication?.revision||0,!!state.scope||owner.signedIn);save();
 if(!owner.signedIn)return;
 const outcome=await publicationWriter.choose(enabled);
 if(outcome.status==='failed')throw outcome.error;
 return outcome;
}
const navigate=route=>{if(location.hash==='#'+route)render();else location.hash=route;};
function modal(title,body){$('#modal-title').textContent=title;$('#modal-body').innerHTML=body;if(!$('#modal').open)$('#modal').showModal();}
function close(){if($('#modal').open)$('#modal').close();}
function timeBand(){const h=new Date().getHours();return h<6?'night':h<12?'morning':h<18?'afternoon':'evening';}
function localProfile(){
  if(!state.draft?.complete)return null;
  let p=state.draft.profile||state.localRecords.find(r=>r.id===state.draft.id)?.profile;
  if(!p&&state.draft.instrument===INSTRUMENT&&state.draft.answers&&validAnswers(state.draft.answers)){
    p=diagnose(state.draft.answers,state.draft.persona?.gender);
    state.draft.profile=p;
  }
  return p||null;
}
const orderedFacets=p=>[...p.facets].sort((a,b)=>Number(b.strong)-Number(a.strong)||Number(b.count>0)-Number(a.count>0)||(b.count/Math.max(1,b.opportunities))-(a.count/Math.max(1,a.opportunities)));
const facetPct=f=>f?.pct??facetRate(f);
const facetRows=items=>items.map(f=>{const pct=facetPct(f);return `<div class="${f.strong?'active':''}"><div class="facet-head"><strong>${esc(f.label)}</strong><span>${pct!==null&&f.opportunities>0?`${pct}% · `:''}${esc(f.level)}</span></div><i class="facet-bar ${pct===null?'unknown':''}" aria-hidden="true"><b style="width:${pct??0}%"></b></i></div>`;}).join('');
function renderCensored(str,secretWord){
  if(!secretWord||!String(str).includes(secretWord))return text(str);
  return String(str).split(secretWord).map(part=>text(part)).join(state.censorOn?'<span class="redacted">████████</span>':`<strong class="secret-word">${esc(secretWord)}</strong>`);
}
function maskSecrets(str,p){
  let out=String(str??'');if(!state.censorOn||!p)return out;
  const dos=p.dossier||fallbackDossierFromCard(p);
  for(const m of dos?.manual||[])if(m.secretWord)out=out.split(m.secretWord).join('████████');
  return out;
}
const subTabs=(labels)=>`<div class="sub-tabs" role="tablist" aria-label="詳細カードの切り替え">${labels.map((l,i)=>`<button type="button" data-subpage="${i}" class="${(state.subpage||0)===i?'active':''}" role="tab" aria-selected="${(state.subpage||0)===i}">${esc(l)}</button>`).join('')}</div>`;
async function prepareState(){let previous;if(state.draft?.complete&&!state.draft.profile&&!state.localRecords?.some(r=>r.id===state.draft.id)&&state.draft.instrument!==INSTRUMENT)previous=(await import(state.draft.instrument==='nocturne24-3'?'./nocturne-v3.mjs':state.draft.instrument==='nocturne24-2'?'./nocturne-v2.mjs':'./nocturne-v1.mjs')).diagnose;state={subpage:0,censorOn:false,cardMode:'title',...preserveInstrument(state,INSTRUMENT,previous)};save();}
const activeProfile=()=>shared||localProfile();
function accrue(){if(!entered||!state.draft||state.draft.complete)return;const elapsed=Math.min(1800000,Math.max(0,Math.round(performance.now()-entered)));state.draft.dwell[state.draft.index]=Math.min(1800000,state.draft.dwell[state.draft.index]+elapsed);state.draft.revision++;entered=0;save();}
async function botToken(){
  if(config.localTest)return 'local-test-only';if(tokenPromise)return tokenPromise;
  tokenPromise=new Promise(async(resolve,reject)=>{const timeout=setTimeout(()=>{tokenPromise=null;reject(Error('確認に時間がかかっています。回答はこの端末に残っています。'));},90000);
    try{if(!window.turnstile)await new Promise((done,fail)=>{const prior=$('#turnstile-script');if(prior)prior.remove();const s=document.createElement('script');s.id='turnstile-script';s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';s.onload=done;s.onerror=fail;document.head.append(s);});if(widget!==null)window.turnstile.remove(widget);widget=window.turnstile.render('#verification',{sitekey:SITEKEY,action:'research',theme:'dark',size:'flexible',appearance:'interaction-only',callback:token=>{clearTimeout(timeout);tokenPromise=null;resolve(token);},'error-callback':()=>{clearTimeout(timeout);tokenPromise=null;reject(Error('確認を読み込めませんでした。接続を確認して、もう一度お試しください。'));},'expired-callback':()=>{tokenPromise=null;}});}catch{clearTimeout(timeout);tokenPromise=null;reject(Error('確認を読み込めませんでした。回答はこの端末に残っています。'));}});return tokenPromise;
}
async function refreshOwner(restore=false,required=false){const observedEpoch=epoch;try{if(!await settleBrowserLogout())throw Error(errors.sign_in);if(observedEpoch!==epoch)return owner;const incoming=await api('/api/account');if(observedEpoch!==epoch)return owner;if(incoming.signedIn&&incoming.scope===owner.scope&&incoming.publication?.revision<owner.publication?.revision){incoming.publication=owner.publication;incoming.listing=owner.listing;incoming.mutual=owner.mutual;}if(incoming.signedIn){const changed=!!state.scope&&state.scope!==incoming.scope;state={subpage:0,censorOn:false,cardMode:'title',...reconcileVault(state,incoming.scope,(incoming.records||[]).map(r=>r.id),localStorage)};if(changed){restore=true;listingItems=[];candidateIndex=0;filters={intent:'',age:'',gender:'',trait:'',relation:'any'};loadedListing=false;listingError='';listingNext=null;}save();}if(incoming.signedIn&&incoming.publication){state=reconcilePublicationChoice(state,incoming.publication,incoming.scope);save();}owner=incoming;owner.records??=[];owner.mutual??=[];const currentRecord=owner.records.find(r=>r.id===state.draft?.id);if(currentRecord?.firstPublishedAt&&state.draft){state.draft.firstPublishedAt=currentRecord.firstPublishedAt;state.localRecords=state.localRecords.map(r=>r.id===currentRecord.id?{...r,firstPublishedAt:currentRecord.firstPublishedAt}:r);save();}if(restore&&owner.records.length){const r=owner.records.find(r=>r.instrument===INSTRUMENT||r.completedAt);if(r)state.draft={id:r.id,instrument:r.instrument,profile:r.profile,answers:r.answers,dwell:r.dwell,visited:r.visited,index:r.cursor,revision:r.revision,context:r.context,persona:r.persona,startedAt:r.createdAt,completedAt:r.completedAt,entryPolicy:r.entryPolicy,firstPublishedAt:r.firstPublishedAt,complete:!!r.completedAt,consent:true,serverStarted:true,synced:true};save();}return owner;}catch(error){if(required)throw error;return owner;}}
async function syncDraft(){
 if(syncTask){syncAgain=true;await syncTask;return;}
 const draft=state.draft,observedEpoch=epoch;if(!draft?.consent||draft.synced)return;
 syncTask=(async()=>{syncing=true;const controller=new AbortController();syncController=controller;
 try{
  if(draft.instrument!==INSTRUMENT&&!draft.complete)throw Error(errors.already_complete);
  if(draft.serverStarted&&!owner.signedIn)throw Error(errors.sign_in);
  if(!draft.serverStarted){const token=owner.signedIn?undefined:await botToken();if(observedEpoch!==epoch||state.draft!==draft)return;const accepted=await api('/api/participate',{id:draft.id,instrument:draft.instrument,consent:draft.consentVersion||CONSENT,adult:true,...(draft.choicePolicy?{choicePolicy:draft.choicePolicy}:{}),...(draft.entryPolicy?{entryPolicy:draft.entryPolicy}:{}),context:draft.context,persona:draft.persona,...(token?{token}:{})},{signal:controller.signal});if(observedEpoch!==epoch||state.draft!==draft)return;state.scope=accepted.scope;if(state.publicationChoice?.policy===CHOICE_POLICY)state=rememberPublicationChoice(state,state.publicationPreference,state.publicationChoice.revision,true);draft.serverStarted=true;owner.signedIn=true;await refreshOwner(false,true);if(state.publicationChoice?.pending)await savePublicationChoice(state.publicationPreference);}
  for(let attempt=0;attempt<3;attempt++){
   syncAgain=false;const revision=draft.revision,complete=draft.complete;
   let response;try{response=await api(complete?'/api/complete':'/api/progress',{id:draft.id,answers:draft.answers,dwell:draft.dwell,visited:draft.visited,cursor:draft.index,revision},{signal:controller.signal});}
   catch(error){if(error.code==='conflict'&&Number.isInteger(error.revision)){draft.revision=Math.max(draft.revision,error.revision)+1;continue;}throw error;}
   if(observedEpoch!==epoch||state.draft!==draft)return;
   draft.synced=draft.revision===revision&&draft.complete===complete;draft.syncError='';
   if(complete&&response.profile&&draft.synced){draft.profile=response.profile;const row=state.localRecords.find(r=>r.id===draft.id);if(row)row.profile=response.profile;}
   save();if(draft.synced)break;
  }
  if(draft.complete)await refreshOwner();
 }catch(error){if(observedEpoch!==epoch)return;draft.synced=false;draft.syncError=error.message;save();}
 finally{if(observedEpoch===epoch){syncing=false;if(location.hash==='#profile')render();}}
 })();try{await syncTask;}finally{syncTask=null;}
}
const currentArt=(p,id=state.draft?.id)=>validArt(state.artSelections?.[id])?state.artSelections[id]:preferredArt(p);
const ownCard=p=>publicCard(p,undefined,'',currentArt(p));
const artTitle=key=>Object.entries(TITLE_ART).find(([,value])=>value===key)?.[0]||COPY['art'+key[0].toUpperCase()+key.slice(1)+'Title'];
const publicTraits=card=>(card.traits||[]).map(id=>FACETS.find(f=>f.id===id)?.label).filter(label=>label&&!(card.tags||[]).includes(label)).join(' · ');
function cardMarkup(card,{compact=false,age='unset',gender='unset'}={}){
 return `<article class="public-card ${compact?'compact':''}"><img src="${artSource(card.art,true)}" alt="" width="480" height="320" loading="lazy"><div><h3>${text(card.title)}</h3>${card.quote?`<blockquote>${text(card.quote)}</blockquote>`:''}${!compact&&card.summary?`<p>${text(card.summary)}</p>`:''}${!compact&&publicTraits(card)?`<p class="hint public-traits">主な好み: ${esc(publicTraits(card))}</p>`:''}${!compact?`<div class="tags">${(card.tags||[]).map(t=>`<span>${esc(t)}</span>`).join('')}</div>`:''}${age!=='unset'||gender!=='unset'?`<p class="hint">${esc([AGES[age],GENDERS[gender]].filter((v,i)=>(i?gender:age)!=='unset').join(' · '))}</p>`:''}</div></article>`;
}
const listingPreferred=()=>publicationPreferred(state,owner.publication);
function publicationEntry(){
 if(state.draft?.entryPolicy===REQUIRED_ENTRY_POLICY&&owner.listing?.status!=='live')return `<div class="publication-entry">${btn('掲載内容を確認する','publish-modal','secondary wide')}</div>`;
 if(owner.listing?.status==='live')return `<div class="publication-entry publication-status"><span class="listing-status">${esc(COPY.listingLive)}</span>${btn(owner.listing.record_id===state.draft.id?COPY.ownListingTitle:COPY.updateListing,owner.listing.record_id===state.draft.id?'find':'publish-modal','text-button')}</div>`;
 return `<div class="publication-entry"><label class="check"><input id="publication-enabled" type="checkbox" ${listingPreferred()?'checked':''}><span>${esc(COPY.listingDefaultLabel)}</span></label>${btn(listingPreferred()?'掲載内容を確認する':'探す','publication-next','primary wide')}</div>`;
}
function home(){
 const d=state.draft,pending=requiredPublicationPending(d);
 const primary=d?.complete?btn(pending?'掲載内容を確認する':'自分の結果を見る',pending?'required-publication':'own-result','primary'):d?btn('続きから答える','resume','primary'):btn('診断をはじめる '+icon('arrow'),'start','primary');
 return `<section class="deck entrance home-entrance"><div class="home-hero"><img class="home-art" src="${artSource('key')}" alt="" width="1200" height="800" fetchpriority="high" decoding="async"><div class="entry-top home-topline"><span class="editorial-label">KUSEIRO DOSSIER</span><button class="text-button" data-action="account">${icon('key')}記録を引き継ぐ</button></div><div class="home-copy"><h1>「SかMか」だけでは、<br>言い切れない。</h1><p class="home-lead">主導したい。甘えたい。翻弄もされたい。</p><p class="home-description">24の場面から、あなたの性癖に名前を。</p><div class="home-actions">${primary}${d?.complete?btn('新しく診断する','start','secondary'):''}</div><p class="home-meta">24場面 · 18歳以上・高校生を除く</p></div></div><ol class="home-path" aria-label="診断の流れ"><li><span class="home-step-number" aria-hidden="true">01</span><div><strong>答える</strong><p>惹かれる場面を、選ぶ。</p></div></li><li><span class="home-step-number" aria-hidden="true">02</span><div><strong>匿名カルテを掲載する</strong><p>公開する内容を、確かめて。</p></div></li><li><span class="home-step-number" aria-hidden="true">03</span><div><strong>結果を楽しむ・共有する</strong><p>二つ名も、好みも、自分の言葉へ。</p></div></li></ol><a class="text-button home-guide" href="/guide/">楽しみ方を見る ${icon('arrow')}</a></section>`;
}
function start(defaultTimeframe='recent',restartConfirmed=false){
  accrue();measure('start_open');
  if(!restartConfirmed&&state.draft&&!state.draft.complete&&state.draft.answers.some(answer=>answer!==null)){
   modal('途中の診断があります。',`<p>答え直すと、この端末では新しい診断に切り替わります。</p>${btn('続きから答える','resume','primary wide')}${btn('新しく答え直す','restart','text-button wide',`data-timeframe="${defaultTimeframe==='now'?'now':'recent'}"`)}`);return;
  }
  const chosen=(key,value)=>Object.hasOwn(PROFILE_OPTIONS[key],value)?value:'';
  const g=chosen('gender',state.draft?.persona?.gender),a=chosen('age',state.draft?.persona?.age),m=chosen('mood',state.draft?.context?.mood);
  const genderOpts={woman:'女性',man:'男性',diverse:COPY.genderDiverse};
  modal(COPY.startTitle,`<div class="start-form">${journeyMarkup(0)}<div class="start-fields"><div class="persona-grid"><fieldset class="compact-field"><legend>対象時期</legend><div class="segmented"><label><input type="radio" name="timeframe" value="recent" ${defaultTimeframe==='recent'?'checked':''}><span>${esc(COPY.recentLabel)}</span></label><label><input type="radio" name="timeframe" value="now" ${defaultTimeframe==='now'?'checked':''}><span>${esc(COPY.nowLabel)}</span></label></div></fieldset><label class="field compact-field">身体視点${select('gender',genderOpts,g)}</label><label class="field compact-field">年代${select('age',PROFILE_OPTIONS.age,a)}</label><label class="field compact-field">${esc(COPY.moodLabel)}${select('mood',PROFILE_OPTIONS.mood,m)}</label></div><div class="consent-compact"><label class="check"><input type="checkbox" id="contribute" required><span>${esc(COPY.contribution)} <a href="/privacy/" target="_blank" rel="noopener">詳細</a></span></label></div><label class="check"><input id="start-publication" type="checkbox" required><span>${esc(COPY.listingDefaultLabel)}</span></label></div><div class="start-actions"><p id="start-error" class="error" role="alert"></p>${btn('同意して、はじめる '+icon('arrow'),'confirm-start','primary wide')}</div></div>`);
}
function confirmStart(){
  if(!eligibilityReady()){void ensureEligibility({refresh:true}).then(()=>confirmStart());return;}
  document.querySelectorAll('.start-form [aria-invalid]').forEach(field=>{field.removeAttribute('aria-invalid');field.removeAttribute('aria-describedby');});
  $('#start-error').textContent='';
  const genderVal=$('#gender')?.value||document.querySelector('[name=gender-pill]:checked')?.value||'';
  const missing=firstMissingChoice({mood:$('#mood').value,age:$('#age').value,gender:genderVal},PROFILE_OPTIONS);
  if(missing){$('#start-error').textContent={mood:'今の気分を選んでください。',age:'年代を選んでください。',gender:'身体視点を選んでください。'}[missing];$('#'+missing).setAttribute('aria-invalid','true');$('#'+missing).setAttribute('aria-describedby','start-error');$('#'+missing).focus();return;}
  const agreement=missingEntryAgreement({contribute:$('#contribute').checked,publication:$('#start-publication').checked});
  if(agreement){$('#start-error').textContent={contribute:'回答の提供に同意してください。','start-publication':'匿名カルテの掲載に同意してください。'}[agreement];$('#'+agreement).setAttribute('aria-invalid','true');$('#'+agreement).setAttribute('aria-describedby','start-error');$('#'+agreement).focus();return;}
  const useConsent=$('#contribute').checked,publicationChoice=$('#start-publication').checked;
  const pendingStart={context:{timeframe:document.querySelector('[name=timeframe]:checked')?.value||'recent',mood:$('#mood').value,timeBand:timeBand()},persona:{age:$('#age').value,gender:genderVal}};
  if(!owner.signedIn&&state.scope)state={subpage:0,censorOn:false,cardMode:'title',...reconcileVault(state,null,[],localStorage)};
  state=rememberPublicationChoice(state,publicationChoice,owner.publication?.revision||0,!!state.scope||owner.signedIn);
  state.draft={id:crypto.randomUUID(),instrument:INSTRUMENT,answers:emptyAnswers(),dwell:Array(24).fill(0),visited:0,index:0,revision:1,startedAt:Date.now(),complete:false,consent:useConsent,consentVersion:CONSENT,choicePolicy:CHOICE_POLICY,entryPolicy:REQUIRED_ENTRY_POLICY,firstPublishedAt:null,serverStarted:false,synced:false,publicationRevision:owner.publication?.revision||0,context:{...pendingStart.context},persona:{...pendingStart.persona}};
  if(shared){state.partnerLink=location.href;history.replaceState(null,'','/');}
  shareNameOnly=false;state.subpage=0;save();close();sample=false;shared=null;page=0;navigate('quiz');measure('quiz_start');if(owner.signedIn)void publicationWriter.choose(publicationChoice);if(useConsent)void syncDraft();
}
function quiz(){
 const d=state.draft;if(!d)return home();const q=SCENES[d.index],chosen=d.answers[q.id],gender=d.persona?.gender||'unset';d.visited|=1<<q.id;save();entered=document.visibilityState==='visible'?performance.now():0;
 return `<section class="deck quiz">${journeyMarkup(0)}<header class="quiz-top"><div class="quiz-header-row"><span class="chapter">${esc(CHAPTERS[q.chapter])}</span><span class="fraction">${String(q.id+1).padStart(2,'0')} <span>/ 24</span></span></div><div class="progress" role="progressbar" aria-label="診断の進み具合" aria-valuemin="0" aria-valuemax="24" aria-valuenow="${q.id+1}"><i style="width:${(q.id+1)/24*100}%"></i></div></header><div class="quiz-body"><figure class="quiz-art"><img src="${artSource(['key','ribbon','mirror','voice'][q.chapter%4])}" alt="" width="1200" height="800" decoding="async"></figure><div class="quiz-answer-area"><div class="question-copy"><h1 id="question-title" tabindex="-1">${text(sceneText(q,gender))}</h1><p id="choice-help">${q.single?'一つ選んでください。':q.boundary?'避けたいものを、すべて選べます。':q.context?'当てはまるものを、2つまで。':"したい・されたい内容を、2つまで。"}</p></div><fieldset class="choices" aria-labelledby="question-title" aria-describedby="choice-help">${q.choices.map((c,i)=>`<label class="choice ${chosen!==null&&(chosen&(1<<i))?'selected':''}"><input type="${q.single?'radio':'checkbox'}" name="answer" value="${i}" ${chosen!==null&&(chosen&(1<<i))?'checked':''}><span class="choice-mark" aria-hidden="true">${icon('check')}</span><span>${text(choiceLabel(c,gender))}</span></label>`).join('')}</fieldset></div></div><footer class="quiz-footer"><p id="selection-error" class="selection-status" role="status">${chosen===null?'':q.single?'選択済み':`${bits(chosen).length}つ選択中`}</p><div class="quiz-bottom"><div class="quiz-secondary">${btn('戻る','previous','plain',d.index===0?'disabled':'')}${btn('保留','skip','plain','aria-label="今はわからないので保留する"')}</div>${btn((q.id===23?'回答を確認する':'次へ')+' '+icon('arrow'),'next','primary',chosen===null?'disabled':'')}</div></footer></section>`;
}
function advance(skip=false,confirmed=false){accrue();if(confirmed&&state.draft.entryPolicy===REQUIRED_ENTRY_POLICY&&state.draft.answers.filter(a=>a!==null).length<12){reviewAnswers();return;}if(state.draft.index===23&&!confirmed){if(skip)state.draft.answers[23]=null;reviewAnswers();return;}const d=state.draft;if(skip)d.answers[d.index]=null;d.revision++;d.synced=false;if(d.index===23){d.complete=true;measure('quiz_complete');d.completedAt=Date.now();d.profile=diagnose(d.answers,d.persona?.gender);const local={id:d.id,profile:d.profile,context:d.context,persona:d.persona,completedAt:d.completedAt,entryPolicy:d.entryPolicy,firstPublishedAt:d.firstPublishedAt};state.localRecords=[local,...state.localRecords.filter(r=>r.id!==d.id)].slice(0,30);page=0;state.subpage=0;sample=false;save();navigate('profile');void syncDraft().then(async()=>{if(requiredPublicationPending(d)&&state.draft===d)await reviewRequiredPublication();}).catch(error=>{say(error.message);render();});}else{d.index++;save();render();if(d.index%4===0)void syncDraft();}}
function reviewAnswers(){
 const d=state.draft,missing=SCENES.filter(q=>d.answers[q.id]===null),needsAnswers=d.entryPolicy===REQUIRED_ENTRY_POLICY&&d.answers.filter(a=>a!==null).length<12;
 modal(COPY.reviewTitle,`<div class="answer-review">${journeyMarkup(0)}<p>${esc(missing.length?(d.entryPolicy===REQUIRED_ENTRY_POLICY?'保留した場面があります。戻って回答できます。':COPY.reviewDeferred):COPY.reviewAllAnswered)}</p><details ${missing.length?'open':''}><summary>${esc(COPY.reviewTitle)}</summary><div class="review-list">${(missing.length?missing:SCENES).map(q=>`<button class="text-button" data-action="review-question" data-question="${q.id}"><span>${q.id+1}. ${text(sceneText(q,d.persona.gender))}</span></button>`).join('')}</div></details>${needsAnswers?'<p class="error">掲載するには、12場面以上に回答してください。</p>':''}${btn(d.entryPolicy===REQUIRED_ENTRY_POLICY?'掲載内容の確認へ':COPY.reviewContinue,'finish-review','primary wide',needsAnswers?'disabled':'')}</div>`);
}
const tabs=['名前','好み','接し方','記録','共有'];
function evidenceDisplay(e){
  if(state.draft?.instrument!==INSTRUMENT)return e;
  const gender=state.draft?.persona?.gender||'unset',q=SCENES[e.id],ans=state.draft?.answers?.[e.id];
  if(!q||typeof ans!=='number')return e;
  return {id:e.id,question:sceneText(q,gender),answers:q.choices.filter(c=>(e.answers||[]).some(a=>a===c.label||Object.values(c.persp||{}).includes(a))).map(c=>choiceLabel(c,gender))};
}
const censorButton=()=>`<div class="censor-bar"><button type="button" class="censor-toggle ${state.censorOn?'active':''}" data-action="toggle-censor" aria-pressed="${!!state.censorOn}">🕵️ 匂わせ黒塗り検閲：${state.censorOn?'ON':'OFF'}</button></div>`;
function readingMarkup(sections){
 return `<div class="result-reading">${sections.map(section=>`<section id="reading-${section.id}"><h3>${text(section.title)}</h3>${section.paragraphs.map(paragraph=>`<p>${text(paragraph)}</p>`).join('')}${section.evidence?.length?`<details class="reading-evidence"><summary>名前につながった回答</summary>${section.evidence.map(e=>`<div><p class="hint">${text(e.question)}</p><p>${text(e.answers.join(' ／ '))}</p></div>`).join('')}</details>`:''}</section>`).join('')}</div>`;
}
function manualPane(p){
 const dos=p.dossier;if(!dos)return `<h2>${esc(COPY.manualTitle)}</h2><p>${esc(COPY.sharePublicHint)}</p>`;
 return `<h2>${text('心地よさを、二人の言葉に。')}</h2>${readingMarkup(resultReading(p).sections.filter(section=>['relationship','misunderstanding','conversation'].includes(section.id)))}<details class="selected-scenes"><summary>選んだ場面と、避けたいこと</summary><div class="manual">${dos.manual.map(m=>`<section><h3>${text(m.title)}</h3><p>${text(m.body)}</p></section>`).join('')}</div></details>`;
}
function requiredPublicationGate(){
 const d=state.draft;return `<section class="deck publication-gate">${journeyMarkup(1)}<div class="publication-gate-layout"><img src="${artSource('key')}" alt="" width="1200" height="800"><div><h1>${text('掲載内容を確認して、結果へ。')}</h1>${d.syncError?`<p class="error">${esc(d.syncError)}</p>`:''}${btn('掲載内容を確認する','required-publication','primary')}${btn('記録を管理する','account','text-button')}</div></div></section>`;
}
async function reviewRequiredPublication(){
 await syncDraft();if(!state.draft?.synced){render();say(state.draft?.syncError||COPY.recordSaving);return;}
 await refreshOwner(false,true);publishModal();
}
function result(){
 if(!sample&&!shared&&requiredPublicationPending(state.draft))return requiredPublicationGate();
 const p=activeProfile();if(!p)return `<section class="deck empty"><h1>${text('まだ、名前のないカルテ。')}</h1>${btn('診断をはじめる','start','primary')}</section>`;
 const card=shared||(sample?publicCard(p,undefined,'',preferredArt(p)):ownCard(p)),own=!shared&&!sample;let pane='';
 if(shared){
  return `<section class="deck result received">${journeyMarkup(2)}<div class="result-pane" tabindex="-1">${cardMarkup(card)}${card.instrument!==INSTRUMENT?'<p class="hint">共有された当時の結果です。</p>':''}<p class="hint">${esc(COPY.sharePublicHint)}</p><div class="share-actions">${btn('自分も診断する','start','primary')}</div></div></section>`;
 }
 const reading=resultReading(p),preferenceDiscovery=own?promotionEntry(!!state.draft?.complete,'post-result'):'';
 if(page===0){
  pane=`<div class="name-pane"><div class="dossier-art"><img src="${artSource(card.art)}" alt="" width="1200" height="800"><span>KUSEIRO</span></div><div class="result-story"><div class="result-kicker">${sample?'結果の見本':esc(COPY.resultSubtitle)}</div><h1 class="result-name">${text(card.title)}</h1><blockquote>${text(card.quote)}</blockquote><div class="tags">${card.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div></div><div class="result-controls">${sample?'':`<div class="result-actions">${btn('Xでシェアする','open-share','primary')}</div>`}${own?promotionEntry(!!state.draft?.complete,'post-result'):''}${btn('この好みを、読み解く','next-page','btn secondary reading-link')}<p class="result-summary">${text(reading.lead)}</p><details class="result-evidence"><summary>${esc(sample?'見本の回答場面':COPY.resultEvidenceTitle)}</summary>${(p.evidence||[]).slice(0,2).map(raw=>{const e=evidenceDisplay(raw);return `<section><p class="hint">${text(e.question)}</p><p>${text(e.answers.join(' ／ '))}</p></section>`;}).join('')||`<p>${esc(COPY.noSelection)}</p>`}</details>${own?publicationEntry():btn('自分の性癖を診断する','start','primary')}${own?btn(COPY.imagePickerTitle,'image-picker','text-button'):''}${dossierByTitle(card.title)&&dossierByTitle(card.title).kind!=='historical'?`<a class="text-button dossier-result-link" href="${dossierUrl(dossierByTitle(card.title))}">この二つ名を図鑑で見る</a>`:''}</div></div>`;
 }
 if(page===1)pane=`<h2>${text('あなたの好みを、読み解く。')}</h2>${readingMarkup(reading.sections.filter(section=>['reason','conditions','duality'].includes(section.id)))}<details class="reading-facets"><summary>好みの内訳を見る</summary><div class="facet-list">${facetRows(orderedFacets(p).slice(0,10))}</div><div class="facet-actions">${btn(COPY.viewDetails,'all-facets','text-button')}${own?btn('ここにない好みを足す','edit-tags','text-button'):''}</div></details>${preferenceDiscovery?`<div class="reading-discovery"><p class="hint">診断とは別の任意の紹介です。PRと報酬の表示は、開いた先にあります。</p>${preferenceDiscovery}</div>`:''}`;
 if(page===2)pane=manualPane(p);
 if(page===3)pane=own?historyPane():`<h2>${esc(COPY.historyTitle)}</h2>${btn('自分のカルテを作る','start','primary')}`;
 if(page===4)pane=`<h2>${text('この二つ名を、Xへ。')}</h2><p>二つ名・一言と公開カードのリンクを共有します。</p><canvas id="result-preview" width="1200" height="630" aria-label="Xで共有する公開カード"></canvas><div class="share-actions">${sample?btn('自分の性癖を診断する','start','primary'):btn('Xでシェアする','open-share','primary')}${own?promotionEntry(!!state.draft?.complete,'post-share'):''}</div>`;
 return `<section class="deck result">${journeyMarkup(page===4?3:2)}<div class="result-tabs" role="tablist" aria-label="カルテのページ">${tabs.map((t,i)=>`<button type="button" id="result-tab-${i}" data-page="${i}" class="${page===i?'active':''}" role="tab" aria-selected="${page===i}" aria-controls="result-panel-${i}" tabindex="${page===i?0:-1}">${t}</button>`).join('')}</div>${tabs.map((_,i)=>`<div id="result-panel-${i}" role="tabpanel" aria-labelledby="result-tab-${i}" ${page===i?'class="result-pane" tabindex="0"':'hidden'}>${page===i?pane:''}</div>`).join('')}<div class="deck-bottom">${btn(icon('back')+'前のページ','prev-page','plain',page===0?'disabled':'')}<span>${page+1} / 5</span>${btn('次のページ'+icon('arrow'),'next-page','plain',page===4?'disabled':'')}</div></section>`;
}
function records(){const all=[...owner.records.filter(r=>r.completedAt),...state.localRecords];return [...new Map(all.map(r=>[r.id,r])).values()].sort((a,b)=>b.completedAt-a.completedAt);}
const DRIFT_AXES=[['lead','主導欲'],['yield','委譲欲'],['sadism','加虐・翻弄'],['masochism','被虐・被翻弄'],['restraintReceive','被拘束'],['receiveCare','甘え・庇護']];
function historyPane(){
 const d=state.draft,rows=records(),current={id:d.id,profile:localProfile(),context:d.context,completedAt:d.completedAt};
 const {before,items}=historyComparison(current,rows,DRIFT_AXES),date=r=>new Date(r.completedAt).toLocaleDateString('ja-JP',{month:'short',day:'numeric'});
 const comparisons=before?`<p>${esc(COPY.sameContextHistory)}</p><p class="hint">${date(before)} → ${date(current)}</p><div class="history-changes">${items.filter(f=>f.now!==null&&f.before!==null).map(f=>`<p><strong>${esc(f.label)}</strong><span>${esc(f.now>f.before?COPY.moreOften:f.now<f.before?COPY.lessOften:COPY.unchanged)}</span></p>`).join('')}</div>`:`<p class="history-empty">${esc(COPY.historyEmpty)}</p>`;
 return `<h2>${esc(COPY.historyTitle)}</h2><p class="record-state">${esc(!d.consent?'この端末だけに保存されています':d.synced?COPY.recordSaved:COPY.recordSaving)}</p>${d.syncError?`<p class="error">${esc(d.syncError)}</p>${btn('もう一度、記録する','retry-sync','text-button')}`:''}${comparisons}<div class="timeline">${rows.slice(0,3).map(r=>`<button data-record="${esc(r.id)}"><time>${date(r)}</time><div><strong>${esc(r.profile.title)}</strong><span>${esc(r.context?.timeframe==='now'?COPY.nowLabel:COPY.recentLabel)} · ${esc(MOODS[r.context?.mood]||'')}</span></div></button>`).join('')}</div><div class="record-actions">${btn('今の自分で、もう一度答える','start-now','primary')}${rows.length>3?btn('すべての記録を見る','history-all','text-button'):''}${!d.consent?btn('この結果を保存・提供する','record-for-history','secondary wide'):''}${btn(owner.hasRecovery?'自分の記録・ログイン':'記録を引き継げるようにする','account','text-button')}</div>`;
}
function recordCurrent(next='profile'){recordNext=next;modal('この結果を、記録する。',`<p>今選んだ回答を、そのまま履歴に残します。答え直す必要はありません。</p><label class="check"><input type="checkbox" id="record-consent"><span>診断の改善と自分の履歴のために、回答と利用の記録を提供します。</span></label><p class="hint">回答一覧は公開しません。広告への利用は、別に選べます。<a href="/privacy/" target="_blank" rel="noopener">詳しく見る</a></p>${btn('同意して、この結果を記録する','confirm-record','primary wide')}${btn('戻る','close','text-button wide')}<p id="record-error" class="error" role="alert"></p>`);}
async function contributeCurrent(){if(!$('#record-consent').checked){$('#record-error').textContent='回答の提供への同意を確認してください。';return;}const draft=state.draft;draft.consent=true;draft.consentVersion=CONSENT;draft.choicePolicy=CHOICE_POLICY;draft.synced=false;draft.revision++;save();await syncDraft();if(!draft.synced){$('#record-error').textContent=draft.syncError||'今は接続できません。この端末の回答は残っています。';return;}close();if(recordNext==='share')void openShare();else if(recordNext==='publication')publishModal();else if(recordNext==='find'){navigate('find');await loadListings();}else{page=3;state.subpage=0;navigate('profile');render();}}
function accountModal(){modal('自分のカルテを、引き継ぐ。',`${owner.signedIn?`<p>別の端末でも、引き継ぎキーで保存した履歴を開けます。</p>${owner.hasRecovery?'<p class="hint">キーは発行済みです。保存した控えを使ってください。</p>':btn('引き継ぎキーを作る','make-recovery','primary wide')}<div id="recovery-output"></div>`:'<p>以前の端末で保存した、引き継ぎキーを入力してください。</p>'}<label class="field">引き継ぎキー<input id="recovery-key" type="password" autocomplete="off" spellcheck="false" maxlength="43" placeholder="保存したキーを貼り付ける"></label>${btn('このキーでログインする','login','secondary wide')}<p class="hint">キーを知る人は、あなたの回答と履歴を開けます。共有リンクとは別です。人に送らないでください。</p><div class="account-actions">${btn('この端末のデータを保存する','backup','text-button')}${btn('このブラウザの記録を消す','local-cleanup-prompt','text-button')}${owner.signedIn?btn(COPY.shareListTitle,'share-list','text-button'):''}${owner.signedIn?btn('非表示にしたカルテ','blocked-list','text-button')+btn('ログアウトする','logout-prompt','text-button')+btn('回答の提供を取り消す','delete-prompt','text-button'):''}</div><p id="account-error" class="error" role="alert"></p>`);}
function editTags(){modal('自分の言葉を、足しておく。',`<form id="tag-form"><label class="field">気になる言葉<input id="tag-input" maxlength="24" placeholder="例：主従逆転、声に弱い"></label><button class="btn secondary" type="submit">タグを追加する</button></form><div class="editable-tags">${state.tags.map((t,i)=>`<button data-remove-tag="${i}">${esc(t.label)} ${icon('close')}</button>`).join('')}</div><label class="field">自分だけのひとこと<textarea id="personal-note" rows="3" maxlength="160" placeholder="どんなときに、この好みが刺さる？">${esc(state.note)}</textarea></label><p class="hint">ここに書いた言葉は、この端末だけに残り、Xや共有リンクには載りません。</p>${btn('この言葉で保存する','save-note','primary wide')}`);}
const artCache=new Map();
async function loadArt(key){
 const src=artSource(key);if(!artCache.has(src))artCache.set(src,new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>{artCache.delete(src);resolve(null);};image.src=src;}));return artCache.get(src);
}
async function drawCard(card,canvas=$('#share-canvas')){
 if(!canvas||!card)return;
 const stamp=JSON.stringify(card);canvas.dataset.card=stamp;const image=await loadArt(card.art);if(canvas.dataset.card!==stamp)return;
 const ctx=canvas.getContext('2d');ctx.clearRect(0,0,1200,630);ctx.fillStyle='#0c0b10';ctx.fillRect(0,0,1200,630);
 if(image){const scale=Math.max(520/image.width,630/image.height),width=image.width*scale,height=image.height*scale;ctx.drawImage(image,-(width-520)*(card.art==='key'?.92:.5),(630-height)/2,width,height);const shade=ctx.createLinearGradient(320,0,500,0);shade.addColorStop(0,'#0c0b1000');shade.addColorStop(1,'#0c0b10');ctx.fillStyle=shade;ctx.fillRect(0,0,1200,630);}
 ctx.strokeStyle='#b69b7059';ctx.strokeRect(24,24,1152,582);ctx.textAlign='left';ctx.textBaseline='top';ctx.fillStyle='#c5a880';ctx.font='22px Georgia';ctx.fillText('N O C T U R N E',460,58);
 const wrap=(value,width)=>{const lines=[];let line='';for(const unit of Array.from(String(value||''))){if(unit==='\n'){lines.push(line);line='';continue;}if(line&&ctx.measureText(line+unit).width>width){lines.push(line);line='';}line+=unit;}if(line)lines.push(line);return lines;};
 const block=(value,{y,height,size,family='sans-serif',weight='400',color})=>{if(!value)return;let lines,lineHeight;do{ctx.font=`${weight} ${size}px ${family}`;lines=wrap(value,680);lineHeight=Math.ceil(size*1.35);if(lines.length*lineHeight<=height)break;size--;}while(size>8);ctx.fillStyle=color;lines.forEach((line,index)=>ctx.fillText(line,460,y+index*lineHeight));};
 block(card.title,{y:108,height:142,size:52,family:'serif',weight:'600',color:'#f2ece4'});
 block(card.quote,{y:264,height:88,size:25,color:'#e4c8a2'});
 block(card.summary,{y:370,height:130,size:21,color:'#ded6ca'});
 const traits=publicTraits(card);if(traits)block('主な好み: '+traits,{y:512,height:24,size:17,color:'#ded6ca'});
 block((card.tags||[]).map(tag=>'#'+tag).join('  '),{y:548,height:27,size:20,color:'#c5a880'});
 ctx.fillStyle='#b8afa3';ctx.font='17px sans-serif';ctx.fillText('あなたの性癖に、名前を。',54,574);ctx.textAlign='right';ctx.fillText('KUSEIRO · 18+',1142,584);ctx.textAlign='left';ctx.textBaseline='alphabetic';
}

function download(blob,filename){
 if(!blob)throw Error('保存するファイルを作成できませんでした。もう一度お試しください。');
 const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;link.hidden=true;
 try{document.body.append(link);link.click();}finally{link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
}
// Sharing uses the existing public card; personal notes and custom tags stay private.
const activeShareNote=()=>'';
function openShare(){return shareToX();}
function shareActions(){shareReadyRecord=state.draft?.id;render();}
async function makeLink(show=false){
 const requestEpoch=epoch,cardStamp=JSON.stringify(shareCard),recordId=state.draft?.id,card=structuredClone(shareCard),nameOnly=shareNameOnly,personal=activeShareNote();
 const current=()=>epoch===requestEpoch&&JSON.stringify(shareCard)===cardStamp&&state.draft?.id===recordId;
 if(!sample&&!shared&&!state.draft?.consent){recordCurrent('share');return;}
 let createdUrl;
 if(shared)createdUrl=location.href;else if(sample)createdUrl=location.origin;else{
  await syncDraft();if(!current())throw Error('共有する内容が変わりました。もう一度、内容を確認してください。');
  if(!state.draft.synced)throw Error(state.draft.syncError||COPY.recordSaving);
  createdUrl=(await api('/api/share',{id:recordId,tags:card.tags,personal,nameOnly,art:card.art})).url;
 }
 if(!current())throw Error('共有する内容が変わりました。もう一度、内容を確認してください。');
 shareUrl=createdUrl;if(!sample&&!shared)measure('share_link');if(show)shareActions();
}

async function shareToX(){
 if(sample||shared||!activeProfile())return;
 if(requiredPublicationPending(state.draft)){navigate('profile');render();return;}
 if(!state.draft.consent){recordCurrent('share');return;}
 const requestEpoch=epoch,recordId=state.draft.id,primary=$('[data-action="open-share"]'),label=primary?.innerHTML;
 shareCard=ownCard(activeProfile());shareNameOnly=false;shareUrl='';
 const stamp=JSON.stringify(shareCard);
 const current=()=>epoch===requestEpoch&&state.draft?.id===recordId&&!shared&&!sample&&JSON.stringify(ownCard(activeProfile()))===stamp;
 if(primary){primary.textContent='Xを開いています…';primary.setAttribute('aria-busy','true');}
 measure('share_open');
 try{
  const result=await handoffToX({prepareLink:()=>makeLink(false),intent:()=>xIntentUrl(shareCard,shareUrl),showReady:shareActions,isCurrent:current,navigateCurrent:url=>location.assign(url)});
  if(result.opened)measure('x_open');
 }finally{if(primary?.isConnected){primary.innerHTML=label;primary.removeAttribute('aria-busy');}}
}

async function readPartner(value){const url=new URL(value);if([location.origin,'https://kuseiro.com','https://nocturne.ai-yu-me.com','https://heki16-pro.aiyume.workers.dev','https://nocturne.aiyume.workers.dev'].includes(url.origin)&&/^\/s\/[A-Za-z0-9_-]{16}$/.test(url.pathname))return (await api('/api/share/'+url.pathname.split('/').pop())).card;const old=readResultLink(value);return {instrument:old.instrument||'legacy-shared-result',title:old.title,quote:old.signature||old.gap?.shareText||old.description,summary:old.description,tags:old.tags?.map(t=>t.label)||[],traits:old.dims?.filter(d=>d.score>=65).map(d=>({narrative:'story',aesthetic:'style',pamper:'receiveCare',wet:'wet',cool:'space',lead:'lead',yield:'yield',sadism:'sadism',masochism:'masochism'})[d.id]).filter(Boolean)||[]};}
function compareMarkup(a,b){
  const items=compare(a,b);
  return `<div class="compare-names"><strong>${esc(a.title)}</strong><span>×</span><strong>${esc(b.title)}</strong></div>${items.map(l=>`<section class="comparison-line"><h3>${esc(l.title)}</h3><p>${esc(l.text)}</p></section>`).join('')}<p class="hint">お互いが共有した好みから、話のきっかけを探せます。その日の希望は、本人に確かめてください。</p>`;
}
async function loadListings(more=false){if(requiredPublicationPending(state.draft))return;loadedListing=false;listingError='';render();try{const p=await api('/api/listings?'+new URLSearchParams({...filters,...(more&&listingNext?{before:listingNext}:{})}));candidateIndex=more?listingItems.length:0;listingItems=more?[...listingItems,...p.items]:p.items;listingNext=p.next;loadedListing=true;render();}catch(e){loadedListing=true;listingError=e.message;render();}}
function ownListingMarkup(){
 const item=owner.listing,p=localProfile(),card=item?.card||(p?listingCard(p,currentArt(p)):null);if(!card)return '';
 const status=item?.status==='live'?COPY.listingLive:item?.status==='expired'?COPY.listingExpired:item?.status==='hidden'?COPY.listingHidden:COPY.listingUnlisted;
 return `<details class="own-publication"><summary><span class="own-publication-head"><span>${esc(COPY.ownListingTitle)}</span><span>${esc(status)}${item?.status==='live'?` · ${new Date(item.expires_at).toLocaleDateString('ja-JP',{month:'numeric',day:'numeric'})}まで`:''}</span></span><span class="own-publication-card"><img src="${artSource(card.art,true)}" alt="" width="54" height="54"><strong>${text(card.title)}</strong></span></summary><div class="own-publication-actions">${btn(COPY.previewListing,'own-preview','text-button')}${item?.status==='hidden'?'':btn(item?.status==='expired'?COPY.renewListing:item?COPY.updateListing:COPY.publishPrimary,'publish-modal','text-button')}${item?.status==='live'?btn(COPY.unpublishListing,'unpublish','text-button'):''}</div></details>`;
}
function find(){
 if(requiredPublicationPending(state.draft))return requiredPublicationGate();
 const ready=owner.signedIn&&owner.records.some(r=>r.completedAt&&r.profile?.answered>=12);
 if(!ready){measure('listing_gate');return `<section class="deck empty"><h1>${text('匿名のカルテを探す。')}</h1><p>診断を終えて記録すると、好みを比べられます。</p>${btn(state.draft?.complete?(state.draft.consent?'もう一度、記録する':'この結果を保存して探す'):'自分の性癖を診断する',state.draft?.complete?(state.draft.consent?'retry-sync':'record-for-find'):'start','primary')}</section>`;}
 measure('listing_open');const item=listingItems[candidateIndex];
 return `<section class="deck discovery"><div class="discovery-head"><h1>${text('匿名のカルテを探す。')}</h1>${btn('絞り込む','filters','secondary')}</div>${ownListingMarkup()}${item?`<div class="candidate"><div class="candidate-top"><span class="anonymous">匿名</span>${btn(icon('more'),'candidate-menu','plain','aria-label="相手のカルテのメニュー"')}</div>${cardMarkup(item.card,{age:item.age,gender:item.gender})}${btn(item.interested?'気になるを取り消す':'気になる','interest',item.interested?'secondary':'primary')}</div><div class="candidate-pager">${btn('前の候補','prev-candidate','plain',candidateIndex===0?'disabled':'')}<span>${candidateIndex+1} / ${listingItems.length}</span>${btn('次の候補','next-candidate','plain',candidateIndex>=listingItems.length-1&&!listingNext?'disabled':'')}</div>`:`<div class="candidate empty"><h2>${esc(listingError?COPY.listingFailed:COPY.listingEmptyTitle)}</h2><p>${esc(listingError||COPY.listingEmptyBody)}</p>${btn('もう一度、探す','load-listings','secondary')}<a class="text-button" href="/library/">読みもの</a></div>`}${owner.mutual?.length?btn(`お互いに気になる · ${owner.mutual.length}件`,'mutual','secondary'):''}</section>`;
}
function publishModal(interestId=''){if(!state.draft?.consent){recordCurrent('publication');return;}
 const selected=owner.records.find(r=>r.id===state.draft?.id&&r.completedAt&&r.profile?.answered>=12)||owner.records.find(r=>r.completedAt&&r.profile?.answered>=12);if(!selected){say(COPY.recordSaving);return;}
 publicationPreview=null;
 modal(COPY.previewListing,`<div class="publication-review">${journeyMarkup(1)}<div class="publication-layout"><div class="publication-card-column"><p class="publication-caption">一覧に表示される内容</p><div id="publication-card">${cardMarkup(listingCard(selected.profile,currentArt(selected.profile,selected.id)))}</div></div><div class="publication-options"><p class="publication-lifetime">${esc(COPY.listingLifetimeHint)}</p><details class="publication-settings"><summary>目的・公開する属性（任意）</summary><label class="field">知りたい相手 ${select('listing-intent',{any:'いろいろな好み',similar:'似ている好み',complement:'役の合う好み'},owner.listing?.intent||'any')}</label><div class="field-pair"><label class="field">公開する年代 ${select('publish-age',{unset:'表示しない',[selected.persona.age]:AGES[selected.persona.age]},owner.listing?.age===selected.persona.age?selected.persona.age:'unset')}</label><label class="field">公開する身体視点 ${select('publish-gender',{unset:'表示しない',[selected.persona.gender]:GENDERS[selected.persona.gender]},owner.listing?.gender===selected.persona.gender?selected.persona.gender:'unset')}</label></div></details><details class="publication-settings"><summary>公開される内容について</summary><p class="hint">${esc(COPY.listingPublicHint)}</p></details></div></div><div class="publication-confirm">${btn(requiredPublicationPending(state.draft)?'掲載して結果を見る':COPY.publishPrimary,'publish','primary wide',`data-record-id="${esc(selected.id)}" data-interest-id="${esc(interestId)}" disabled`)}<p id="publish-error" class="error" role="alert"></p></div></div>`);
 void preparePublication(selected.id);
}
async function preparePublication(recordId){
 const requestId=++publicationPreviewSeq,record=owner.records.find(r=>r.id===recordId);if(!record)return;
 const age=$('#publish-age')?.value||'unset',gender=$('#publish-gender')?.value||'unset';
 const body={recordId,intent:$('#listing-intent')?.value||'any',showAge:age!=='unset',showGender:gender!=='unset',art:currentArt(record.profile,record.id)};
 if(age!=='unset'&&age!==record.persona.age||gender!=='unset'&&gender!==record.persona.gender){$('#publish-error').textContent=COPY.listingSamePreviewError;return;}
 try{const preview=await api('/api/listing/preview',body);if(requestId!==publicationPreviewSeq||!$('#publication-card'))return;publicationPreview={...body,...preview};$('#publication-card').innerHTML=cardMarkup(preview.card,{age:preview.age,gender:preview.gender});$('[data-action=publish]').disabled=false;}
 catch(error){if($('#publish-error'))$('#publish-error').textContent=error.message;}
}
function cancelPublicationWrite(){publicationWriter.cancel();if(state.publicationChoice)state={...state,publicationChoice:{...state.publicationChoice,pending:false}};save();}
async function publishSelection(target){
 const preview=publicationPreview;if(!preview||preview.recordId!==target.dataset.recordId)throw Error(COPY.listingSamePreviewError);
 cancelPublicationWrite();const result=await api('/api/listing',{publish:true,recordId:preview.recordId,intent:preview.intent,showAge:preview.showAge,showGender:preview.showGender,art:preview.art,digest:preview.digest,policy:preview.policy,expectedRevision:preview.revision});
 if(JSON.stringify(result.card)!==JSON.stringify(preview.card))throw Error(COPY.listingSamePreviewError);
 if(state.draft?.id===preview.recordId){state.draft.firstPublishedAt=result.firstPublishedAt||Date.now();state.localRecords=state.localRecords.map(r=>r.id===preview.recordId?{...r,firstPublishedAt:state.draft.firstPublishedAt}:r);}measure('listing_publish');owner.publication={...owner.publication,revision:result.revision,preference:true,choicePolicy:CHOICE_POLICY};state=rememberPublicationChoice(state,true,result.revision);save();const interestId=target.dataset.interestId;
 await refreshOwner(false,true);close();if(state.draft?.entryPolicy===REQUIRED_ENTRY_POLICY&&state.draft.id===preview.recordId){navigate('profile');render();}else{navigate('find');await loadListings();}say(COPY.listingSaved);
 if(interestId){const outcome=await api('/api/interest',{id:interestId,interested:true});await refreshOwner();if(outcome.mutual){const other=owner.mutual.find(m=>m.id===interestId);if(other)modal('お互いに、気になる。',compareMarkup(owner.listing.card,other.card));}}
}
function showRecord(id){const r=records().find(r=>r.id===id);if(!r)return;if(r.entryPolicy===REQUIRED_ENTRY_POLICY&&!r.firstPublishedAt){say('この記録は、掲載内容の確認が必要です。');return;}modal('その日に答えた、自分。',`<p>${new Date(r.completedAt).toLocaleString('ja-JP')}</p><h2>${esc(r.profile.title)}</h2><p>${esc(r.profile.quote)}</p><p>${esc(r.profile.summary)}</p>${owner.records.some(r=>r.id===id)?btn('この記録を削除する','delete-record-prompt','text-button',`data-id="${esc(id)}"`):''}`);}
function render(){const keepResultTabFocus=document.activeElement?.matches('.result-tabs [role="tab"]');accrue();const requested=location.hash.slice(1),route=shared?'profile':['quiz','profile','find'].includes(requested)?requested:'home';$('#main').innerHTML=route==='quiz'?quiz():route==='profile'?result():route==='find'?find():home();if($('#result-preview'))drawCard(shared||ownCard(activeProfile()),$('#result-preview'));document.body.dataset.view=route;document.querySelectorAll('[data-route]').forEach(a=>a.setAttribute('aria-current',a.dataset.route===route?'page':'false'));(keepResultTabFocus&&route==='profile'&&$('#result-tab-'+page)||$('#question-title')||$('.result-pane')||$('#main')).focus({preventScroll:true});}
function activateResultTab(index){
 if(!Number.isInteger(index)||index<0||index>=tabs.length||!$('.result-tabs'))return;
 page=index;state.subpage=0;save();render();
 $('#result-tab-'+index)?.focus({preventScroll:true});
}
function skipToContent(event){
 if(!event.target.closest('a.skip[href="#main"]'))return false;
 event.preventDefault();$('#main').focus({preventScroll:true});return true;
}

document.addEventListener('change',e=>{
  if((['mood','age','gender'].includes(e.target.id)||e.target.name==='gender-pill')&&$('#start-error'))$('#start-error').textContent='';
  if(['contribute','start-publication'].includes(e.target.id)&&$('#start-error'))$('#start-error').textContent='';
  if(e.target.id==='publication-enabled'){void savePublicationChoice(e.target.checked).catch(error=>say(error.message));render();return;}
  if(['listing-intent','publish-age','publish-gender'].includes(e.target.id)){publicationPreview=null;const button=$('[data-action=publish]');if(button){button.disabled=true;void preparePublication(button.dataset.recordId);}return;}
  if(e.target.name==='answer'){const d=state.draft,q=SCENES[d.index],old=d.answers[q.id]||0,bit=1<<Number(e.target.value);let mask=q.single?bit:e.target.checked?old|bit:old&~bit;if(q.boundary&&e.target.value==='4'&&e.target.checked)mask=16;else if(q.boundary&&e.target.checked)mask&=15;if(bits(mask).length>(q.boundary?4:2)){e.target.checked=false;$('#selection-error').textContent=COPY.maxChoices;return;}if(choiceConflict(q,mask)){e.target.checked=!!(old&bit);$('#selection-error').textContent=COPY.conflictChoice;return;}d.answers[q.id]=mask||null;d.revision++;d.synced=false;save();document.querySelectorAll('.choice').forEach(label=>{const input=label.querySelector('input');input.checked=!!(mask&(1<<Number(input.value)));label.classList.toggle('selected',input.checked);});$('#selection-error').textContent=mask?(q.single?'選択済み':bits(mask).length+'つ選択中'):'';$('[data-action=next]').disabled=!mask;}
});
document.addEventListener('keydown',e=>{
  if(e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey)return;
  const resultTab=e.target.closest?.('.result-tabs [role="tab"]');
  if(resultTab&&!$('#modal')?.open){
    const index=Number(resultTab.dataset.page);
    const next={ArrowRight:(index+1)%tabs.length,ArrowLeft:(index+tabs.length-1)%tabs.length,Home:0,End:tabs.length-1}[e.key];
    if(next!==undefined){e.preventDefault();activateResultTab(next);}
    return;
  }
  if(location.hash==='#profile'&&!$('#modal')?.open&&!['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName)){
    if(e.key==='ArrowRight'&&page<4){page++;state.subpage=0;save();render();}
    else if(e.key==='ArrowLeft'&&page>0){page--;state.subpage=0;save();render();}
  }
});
document.addEventListener('submit',e=>{if(e.target.id==='tag-form'){e.preventDefault();const label=normalizeLabel($('#tag-input').value).slice(0,24);if(!label)return;if(state.tags.length>=24){say('タグは24個まで保存できます。');return;}state.tags=organizeTags([...state.tags,{label,kind:'like'}]);save();editTags();}});
document.addEventListener('click',async e=>{
 if(skipToContent(e))return;
 if(e.target.closest('#share-x')&&!sample&&!shared)measure('x_open');
 const navigation=e.target.closest('[data-route]');
 if(navigation&&(shared||sample)){e.preventDefault();if(shared){state.partnerLink=location.href;save();}shared=null;sample=false;page=0;state.subpage=0;history.replaceState(null,'','/#'+navigation.dataset.route);render();if(navigation.dataset.route==='find'&&owner.signedIn)void loadListings();return;}
 const target=e.target.closest('[data-action]'),action=target?.dataset.action;
 if(e.target.closest('[aria-disabled=true]')){e.preventDefault();return;}
 const tab=e.target.closest('.result-tabs [data-page]');if(tab){activateResultTab(Number(tab.dataset.page));return;}
 const sub=e.target.closest('[data-subpage]');if(sub){state.subpage=Number(sub.dataset.subpage);save();render();return;}
 const recordButton=e.target.closest('[data-record]');if(recordButton){showRecord(recordButton.dataset.record);return;}
 const remove=e.target.closest('[data-remove-tag]');if(remove){state.tags.splice(Number(remove.dataset.removeTag),1);save();editTags();return;}
 const mutual=e.target.closest('[data-mutual]');if(mutual){try{await refreshOwner(false,true);}catch(error){say(error.message);return;}const other=owner.mutual.find(m=>m.id===mutual.dataset.mutual);if(!other){close();say('今は、このカルテを比べられません。');return;}if(owner.listing)modal('二人のカルテを、比べる。',compareMarkup(owner.listing.card,other.card));return;}
 if(!action)return;const busy=target.tagName==='BUTTON';if(busy)target.disabled=true;
 try{switch(action){
  case 'local-cleanup-prompt':browserCleanupModal();break;
  case 'local-cleanup':await clearBrowserRecords();break;
  case 'start':start('recent');break;case 'start-now':start('now');break;case 'confirm-start':confirmStart();break;
  case 'restart':start(target.dataset.timeframe==='now'?'now':'recent',true);break;

  case 'resume':close();sample=false;shared=null;navigate('quiz');render();break;
  case 'own-result':close();sample=false;shared=null;page=0;state.subpage=0;navigate('profile');render();break;
  case 'next':advance();break;case 'finish-review':close();advance(false,true);break;case 'review-question':accrue();state.draft.index=Number(target.dataset.question);close();navigate('quiz');render();break;case 'skip':advance(true);break;
  case 'previous':accrue();state.draft.index=Math.max(0,state.draft.index-1);state.draft.revision++;save();render();break;
  case 'pause':accrue();void syncDraft();navigate('home');break;
  case 'next-page':page=Math.min(4,page+1);state.subpage=0;save();render();break;case 'prev-page':page=Math.max(0,page-1);state.subpage=0;save();render();break;
  case 'next-subpage':state.subpage=((state.subpage||0)+1)%3;save();render();break;case 'go-manual':page=2;state.subpage=0;save();render();break;
  case 'open-share':await openShare();break;

  case 'account':accountModal();break;
  case 'all-evidence':{const p=activeProfile();modal('名前がついた、場面。',(p.evidence||[]).map(raw=>{const e=evidenceDisplay(raw);return `<section class="evidence-detail"><h3>${text(e.question)}</h3><p>${text(e.answers.join('／'))}</p></section>`;}).join(''));break;}
  case 'all-facets':{const p=activeProfile();modal('好きの輪郭を、もう少し。',`<div class="facet-list full-facets">${facetRows(orderedFacets(p))}</div><p class="hint">選ばなかった内容を、苦手だと決めつけるものではありません。</p>`);break;}
  case 'record-for-share':recordCurrent('share');break;case 'record-for-find':recordCurrent('find');break;case 'record-for-history':recordCurrent('profile');break;
  case 'confirm-record':await contributeCurrent();break;
  case 'blocked-list':{const p=await api('/api/blocks');modal('非表示を、取り消す。',p.items.length?`<label class="field">非表示にしたカルテ ${select('blocked-choice',Object.fromEntries(p.items.map(i=>[i.id,i.title])),p.items[0].id)}</label>${btn('このカルテを再表示する','unblock','secondary wide')}`:'<p>非表示にしているカルテはありません。</p>');break;}
  case 'unblock':await api('/api/unblock',{id:$('#blocked-choice').value});close();await loadListings();say('非表示を取り消しました。');break;
  case 'history-all':modal('記録を、選ぶ。',`<label class="field">答えた日 ${select('history-choice',Object.fromEntries(records().map(r=>[r.id,new Date(r.completedAt).toLocaleDateString('ja-JP')+' · '+r.profile.title])),records()[0]?.id)}</label>${btn('この日の記録を開く','open-history','primary wide')}`);break;
  case 'open-history':showRecord($('#history-choice').value);break;
  case 'make-recovery':{const p=await api('/api/recovery/create',{});owner.hasRecovery=true;$('#recovery-output').innerHTML=`<label class="field">今回だけ表示するキー<input readonly id="created-recovery" value="${esc(p.key)}" autocomplete="off"></label><p class="hint">安全な場所に保存してください。閉じると、ここからは再表示できません。</p>${btn('キーをコピー','copy-recovery','secondary wide')}`;target.hidden=true;break;}
  case 'copy-recovery':await copy($('#created-recovery').value);break;
  case 'login':epoch++;syncController?.abort();syncing=false;syncAgain=false;tokenPromise=null;await api('/api/recovery/login',{key:$('#recovery-key').value.trim(),token:await botToken()});await refreshOwner(true);close();sample=false;shared=null;page=3;state.subpage=0;navigate('profile');render();say('記録を引き継ぎました。');break;
  case 'retry-sync':if(!state.draft?.consent){recordCurrent('profile');break;}await syncDraft();render();break;
  case 'persona':modal('年代・性別を、変更する。',`<p>統計では、同じ年代や性別の回答をまとめます。募集一覧への表示は、掲載するときに別に選びます。</p><label class="field">年代 ${select('edit-age',PROFILE_OPTIONS.age,state.draft.persona.age)}</label><label class="field">性別 ${select('edit-gender',PROFILE_OPTIONS.gender,state.draft.persona.gender)}</label>${btn('この内容で保存する','save-persona','primary wide')}`);break;
  case 'save-persona':{const persona={age:$('#edit-age').value,gender:$('#edit-gender').value};if(state.draft.consent&&state.draft.serverStarted)await api('/api/persona',{id:state.draft.id,persona});state.draft.persona=persona;save();close();say('保存しました。');break;}
  case 'edit-tags':editTags();break;case 'save-note':state.note=$('#personal-note').value.trim();save();close();say('自分の言葉を保存しました。');break;
  case 'backup':download(new Blob([JSON.stringify({version:1,state,records:owner.records},null,2)],{type:'application/json'}),'nocturne-private-records.json');break;
  case 'logout-prompt':modal('この端末から、ログアウトしますか？',`<p>この端末の回答とタグを消し、記録を閉じます。保存先の履歴は残ります。引き継ぎキーを保存してから進んでください。</p>${btn('ログアウトして端末の回答を消す','logout','secondary wide')}${btn('戻る','close','text-button wide')}`);break;
  case 'logout':await api('/api/logout',{});clearLocal();close();navigate('home');render();say('ログアウトしました。');break;
  case 'delete-prompt':modal('提供した回答を、取り消しますか？',`<p>保存先の回答・履歴・掲載・共有リンクを削除します。この端末の回答も消します。保存した画像や、相手がコピーした内容は消せません。</p><label class="check"><input type="checkbox" id="delete-confirm"><span>取り消す内容を確認しました。</span></label>${btn('提供を取り消して、記録を削除する','delete-account','secondary wide')}${btn('戻る','close','text-button wide')}`);break;
  case 'delete-account':if(!$('#delete-confirm').checked){say('取り消す内容を確認してください。');break;}await api('/api/account/delete',{confirm:'delete-my-records'});clearLocal();close();navigate('home');render();say('提供した回答と記録を削除しました。');break;
  case 'delete-record-prompt':modal('この日の記録を、削除しますか？',`<p>この日の回答と履歴を削除します。掲載したカルテと共有リンクは別に残ります。すべて取り消す場合は、記録の管理画面から回答の提供を取り消してください。</p>${btn('この日の記録を削除する','delete-record','secondary wide',`data-id="${esc(target.dataset.id)}"`)}${btn('戻る','close','text-button wide')}`);break;
  case 'delete-record':{const id=target.dataset.id;await api('/api/record/delete',{id});state.localRecords=state.localRecords.filter(r=>r.id!==id);if(state.draft?.id===id)state.draft=null;save();await refreshOwner();close();render();say('この日の記録を削除しました。');break;}
  case 'find':sample=false;shared=null;await refreshOwner();navigate('find');break;
  case 'load-listings':await refreshOwner();await loadListings();break;
  case 'prev-candidate':candidateIndex=Math.max(0,candidateIndex-1);render();break;case 'next-candidate':if(candidateIndex===listingItems.length-1&&listingNext)await loadListings(true);else{candidateIndex=Math.min(listingItems.length-1,candidateIndex+1);render();}break;
  case 'filters':modal('気になるカルテを、絞り込む。',`<label class="field">好きの重なり ${select('filter-relation',{any:'指定しない',similar:'共通する好みがある',complement:'役の合う好みがある'},filters.relation)}</label><label class="field">相手の目的 ${select('filter-intent',{'':'指定しない',similar:'似ている好み',complement:'役の合う好み',any:'いろいろな好み'},filters.intent)}</label><label class="field">気になる好み ${select('filter-trait',{'':'指定しない',...Object.fromEntries(FACETS.map(f=>[f.id,f.label]))},filters.trait)}</label><label class="field">年代 ${select('filter-age',{'':'指定しない',...AGES},filters.age)}</label><label class="field">性別 ${select('filter-gender',{'':'指定しない',...GENDERS},filters.gender)}</label><p class="hint">相手が掲載を選んだ情報で探します。非公開の年代・性別からは探せません。</p>${btn('この条件で探す','apply-filters','primary wide')}`);break;
  case 'apply-filters':filters={relation:$('#filter-relation').value,trait:$('#filter-trait').value,intent:$('#filter-intent').value,age:$('#filter-age').value,gender:$('#filter-gender').value};close();await loadListings();break;
  case 'publication-next':{if(owner.signedIn&&state.publicationChoice?.pending)await savePublicationChoice(listingPreferred());if(listingPreferred()){if(!state.draft?.consent){recordCurrent('publication');break;}await syncDraft();if(!state.draft.synced)throw Error(state.draft.syncError||COPY.recordSaving);publishModal();}else{if(owner.signedIn&&owner.publication?.preference!==false){await savePublicationChoice(false);}navigate('find');await loadListings();say(COPY.publicationChoiceSaved);}break;}
  case 'image-picker':modal(COPY.imagePickerTitle,`<div class="image-picker">${[...new Set([preferredArt(localProfile()),...LEGACY_ART_KEYS])].map(key=>`<button data-action="choose-image" data-art="${key}" aria-pressed="${currentArt(localProfile())===key}"><img src="${artSource(key,true)}" alt="" width="480" height="320"><span>${esc(artTitle(key))}</span></button>`).join('')}</div>`);break;
  case 'choose-image':{const key=target.dataset.art;if(!validArt(key))break;state.artSelections??={};state.artSelections[state.draft.id]=key;save();if(state.draft.synced){await api('/api/art',{id:state.draft.id,art:key});await refreshOwner();}close();render();say(COPY.imageApplied);break;}
  case 'own-preview':{const item=owner.listing,card=item?.card||listingCard(localProfile(),currentArt(localProfile()));modal(COPY.previewListing,cardMarkup(card,{age:item?.age||'unset',gender:item?.gender||'unset'}));break;}
  case 'share-list':{const data=await api('/api/shares');modal(COPY.shareListTitle,`<div class="share-link-list">${data.items.map(item=>`<section><h3>${esc(item.card.title)}</h3><p class="hint">${new Date(item.created_at).toLocaleString('ja-JP')}</p><details><summary>${esc(COPY.previewListing)}</summary>${cardMarkup(item.card)}</details><a class="text-button" href="/s/${esc(item.id)}" target="_blank" rel="noopener">共有リンク</a>${!item.revoked_at&&item.expires_at>Date.now()?btn(COPY.shareDelete,'revoke-share','text-button',`data-share-id="${esc(item.id)}"`):`<p>${esc(item.revoked_at?COPY.shareRevoked:COPY.listingExpired.replace('掲載',''))}</p>`}</section>`).join('')||`<p>${esc(COPY.shareNone)}</p>`}</div>`);break;}
  case 'revoke-share':await api('/api/share/revoke',{id:target.dataset.shareId});target.replaceWith(document.createTextNode(COPY.shareRevoked));say(COPY.shareRevoked);break;
  case 'required-publication':await reviewRequiredPublication();break;
  case 'publish-modal':publishModal();break;
  case 'publish':await publishSelection(target);break;
  case 'unpublish':{cancelPublicationWrite();const result=await api('/api/listing',{publish:false,expectedRevision:owner.publication?.revision||0});owner.publication={...owner.publication,revision:result.revision,preference:false,choicePolicy:CHOICE_POLICY};state=rememberPublicationChoice(state,false,result.revision);save();await refreshOwner(false,true);close();await loadListings();say(COPY.listingRemoved);break;}
  case 'interest':{const item=listingItems[candidateIndex];if(owner.listing?.status!=='live'){publishModal(item.id);break;}const p=await api('/api/interest',{id:item.id,interested:!item.interested});item.interested=p.interested;if(p.interested)measure('interest');await refreshOwner();render();if(p.mutual)modal('お互いに、気になる。',compareMarkup(owner.listing.card,item.card));else say(p.interested?'気になるを届けました。':'気になるを取り消しました。');break;}
  case 'candidate-menu':modal('このカルテについて。',`${btn('このカルテを隠す','block','secondary wide')}${btn('通報する','report','text-button wide')}`);break;
  case 'block':{const item=listingItems[candidateIndex];await api('/api/block',{id:item.id});await refreshOwner();close();listingItems.splice(candidateIndex,1);candidateIndex=Math.max(0,Math.min(candidateIndex,listingItems.length-1));render();say('お互いに非表示にしました。記録の管理から戻せます。');break;}
  case 'report':modal('このカルテを、通報する。',`<label class="field">理由 ${select('report-reason',{unwanted:'不快に感じた',impersonation:'なりすましが疑われる',underage:'18歳未満・高校生の利用が疑われる',other:'その他'},'unwanted')}</label><p>通報した相手は、お互いの一覧から非表示になります。</p>${btn('通報して非表示にする','send-report','secondary wide')}`);break;
  case 'send-report':await api('/api/report',{id:listingItems[candidateIndex].id,reason:$('#report-reason').value});await refreshOwner();close();await loadListings();say('通報を受け付けました。');break;
  case 'mutual':await refreshOwner(false,true);render();modal('お互いに、気になるカルテ。',`${owner.mutual.map(m=>`<button class="mutual-item" data-mutual="${esc(m.id)}">${esc(m.card.title)}</button>`).join('')}<p class="hint">掲載の取り消しやブロックをすると、この一覧から消えます。</p>`);break;
  case 'open-promotion':if(!sample&&!shared&&state.draft?.complete)openPromotion({profile:localProfile(),recordId:state.draft.id,showModal:modal,placement:target.dataset.prPlacement||'post-share'});break;
  case 'menu':modal('KUSEIRO',`<nav class="menu-links" aria-label="サイト情報">${informationLinks()}</nav>${btn('自分の記録・ログイン','account','text-button wide')}`);break;
  case 'close':close();break;
 }}catch(error){const field=$('#start-error')||$('#account-error')||$('#publish-error')||$('#compare-error')||$('#share-feedback');if(field)field.textContent=error.message;else say(error.message);}finally{if(busy&&target.isConnected)target.disabled=false;}
});
async function settleBrowserLogout(){
 if(!pendingBrowserCleanup(localStorage)?.pending)return true;
 if(localLogoutTask)return localLogoutTask;
 localLogoutTask=finishBrowserCleanup(localStorage,scope=>fetch('/api/logout',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-Nocturne':'1','X-Nocturne-Scope':scope||''},body:'{}',signal:AbortSignal.timeout(5000)}));
 try{return await localLogoutTask;}finally{localLogoutTask=null;}
}
function browserCleanupModal(){
 accrue();save();cleanupPlan=browserCleanupPlan(localStorage,state.scope);
 modal('このブラウザの記録を消す',`<p>保存した結果 <strong>${cleanupPlan.records}件</strong>・途中の診断 <strong>${cleanupPlan.unfinished}件</strong></p><p>今開いている記録とメモ、このタブのアクセス計測情報を消してログアウトします。</p><p class="hint">サーバーの回答・匿名掲載・共有リンク、別のログインの記録は残ります。サーバーの回答も消す場合は「回答の提供を取り消す」を使ってください。</p><label class="consent"><input id="local-cleanup-confirm" type="checkbox">このブラウザの記録を消します。元には戻せません。</label>${btn('記録を消す','local-cleanup','primary wide')}${btn('やめる','close','text-button wide')}<p id="local-cleanup-error" class="error" role="alert"></p>`);
}
function resetBrowserMemory(next,nonce){
 epoch++;syncController?.abort();syncing=false;syncAgain=false;tokenPromise=null;entered=0;publicationWriter.cancel();forgetPromotionConsent();const measurementCleared=clearBrowserMeasurements();
 state={subpage:0,censorOn:false,cardMode:'title',...next};owner={signedIn:false,records:[],mutual:[]};shared=null;sample=false;listingItems=[];loadedListing=false;listingNext=null;shareUrl='';shareCard=null;shareReadyRecord=null;publicationPreview=null;cleanupPlan=null;lastCleanupNonce=nonce;return measurementCleared;
}
async function clearBrowserRecords(){
 try{
  const nonce=crypto.randomUUID(),next=applyBrowserCleanup(localStorage,cleanupPlan,$('#local-cleanup-confirm').checked,nonce);
  const measurementCleared=resetBrowserMemory(next,nonce);close();navigate('home');render();
  const finished=await settleBrowserLogout();say((finished?'このブラウザの記録を消しました。':'このブラウザの記録を消しました。ログアウトは接続後に完了します。')+(measurementCleared?'':'計測情報を消せないため、このタブを閉じてください。'));
 }catch(error){const field=$('#local-cleanup-error');if(field)field.textContent=error.message;else say(error.message);}
}
function clearLocal(){epoch++;syncController?.abort();syncing=false;syncAgain=false;tokenPromise=null;publicationWriter.cancel();forgetPromotionConsent();clearVaults(localStorage);state={v:1,draft:null,localRecords:[],tags:[],note:'',subpage:0,censorOn:false,cardMode:'title'};owner={signedIn:false,records:[],mutual:[]};shared=null;sample=false;listingItems=[];save();}
window.addEventListener('hashchange',async()=>{
 if(location.hash.startsWith('#share=')){
  const incoming=location.href;shared=null;sample=false;
  try{const card=await readPartner(incoming);if(location.href!==incoming)return;shared=card;page=0;state.subpage=0;}
  catch{if(location.href!==incoming)return;say('共有結果を読み取れませんでした。期限やリンクを確認してください。');}
 }else if(!['#profile','#quiz'].includes(location.hash)){sample=false;shared=null;}
 render();if(location.hash==='#find'&&owner.signedIn)void loadListings();
});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){accrue();void syncDraft();}else if(location.hash==='#quiz')entered=performance.now();});
window.addEventListener('online',()=>void syncDraft());
window.addEventListener('storage',e=>{
 if(e.key===CLEANUP_KEY){const notice=pendingBrowserCleanup(localStorage);if(notice&&notice.nonce!==lastCleanupNonce&&notice.scope===(state.scope||null)){resetBrowserMemory({v:1,scope:null,draft:null,localRecords:[],tags:[],note:''},notice.nonce);close();navigate('home');render();}return;}
 if(e.key===KEY){const incoming=load();if(incoming.scope!==state.scope){epoch++;syncController?.abort();state=incoming;void refreshOwner(true).then(()=>render());}}
});
async function init(){await prepareState();try{config=await api('/api/config');}catch{}await refreshOwner();if(owner.signedIn&&state.publicationChoice?.pending)void savePublicationChoice(state.publicationPreference).catch(error=>say(error.message));const short=/^\/s\/[A-Za-z0-9_-]{16}$/.test(location.pathname),legacy=location.hash.startsWith('#share=');if(short||legacy){try{const meta=document.querySelector('meta[name=nocturne-card]');shared=short?(meta?JSON.parse(meta.content):(await api('/api/share/'+location.pathname.split('/').pop())).card):await readPartner(location.href);page=0;state.subpage=0;sample=false;if(short)history.replaceState(null,'',location.pathname+'#profile');}catch{say('共有結果を読み取れませんでした。期限やリンクを確認してください。');}}render();if(state.draft?.consent&&!state.draft.synced)void syncDraft();if(location.hash==='#find'&&owner.signedIn)void loadListings();}
void ensureEligibility().then(()=>init());

