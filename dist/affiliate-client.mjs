import {campaigns,personalizationEnabled} from './affiliate-catalog.mjs';
import {AD_CONSENT,adConsentApplies,matchedAffinityLabels,selectPromotions,promotionForm} from './affiliate-core.mjs';
import {measure} from './metrics.mjs';
import {ensureEligibility,eligibilityReady} from './eligibility-client.mjs';
const KEY='nocturne_pr_consent';
const COPY={"entry":"PR · 好みに合う紹介を見る","title":"好みに合う紹介","disclosure":"リンク先で購入があると、運営者に報酬が入る場合があります。","personalizeLabel":"今回の結果に合わせて紹介を並べる","personalizeHint":"回答提供の同意とは別の任意設定です。オンにした今回の強い好みだけを使い、回答そのものは広告主へ送りません。チェックを外せばいつでも解除できます。","matchPrefix":"この結果の","matchSuffix":"に近い紹介です。","outbound":"myfansで詳細を見る ↗","policyLink":"広告について","empty":"現在、表示できる紹介はありません。"};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let volatileConsent=null,active=null,storageUnavailable=false;
const privateMode=()=>navigator.doNotTrack==='1'||navigator.globalPrivacyControl===true;
function readConsent(){if(storageUnavailable)return volatileConsent;try{return JSON.parse(localStorage.getItem(KEY)||'null');}catch{return null;}}
function writeConsent(value){volatileConsent=value;try{if(value)localStorage.setItem(KEY,JSON.stringify(value));else localStorage.removeItem(KEY);storageUnavailable=false;}catch{storageUnavailable=true;/* This visit can still make an explicit choice. */}}
export function promotionEntry(eligible,placement='post-share'){return eligible&&selectPromotions(campaigns,{placement}).length?`<button type="button" class="text-button pr-entry" data-action="open-promotion" data-pr-placement="${esc(placement)}" aria-label="${esc(COPY.entry)}">${esc(COPY.entry)}</button>`:'';}
export function forgetPromotionConsent(){writeConsent(null);active=null;}
export async function openPromotion({profile,recordId,showModal,placement='post-share'}){
 if(!profile||!recordId||!selectPromotions(campaigns,{placement}).length)return;
 await ensureEligibility({refresh:true});
 try{const response=await fetch('/api/promotions/status',{credentials:'omit',cache:'no-store'});if(!response.ok||(await response.json()).enabled!==true)throw Error('unavailable');}catch{showModal(COPY.title,`<p>${esc(COPY.empty)}</p>`);return;}
 active={profile,recordId,showModal,placement,index:0};measure('pr_open');renderPromotion();
}
function renderPromotion(){
 if(!active)return;
 const {profile,recordId,showModal,placement}=active,canPersonalize=personalizationEnabled&&!privateMode(),consented=canPersonalize&&adConsentApplies(readConsent(),recordId);
 const items=selectPromotions(campaigns,{consented,facets:consented?profile.facets:[],placement});active.index=Math.min(active.index,Math.max(0,items.length-1));const shown=items.slice(active.index,active.index+1);
 const labels=consented&&shown[0]?matchedAffinityLabels(shown[0],profile.facets):[];
 const reason=labels.length?`<p class="hint">${esc(COPY.matchPrefix)}${esc(labels.slice(0,2).join('・'))}${esc(COPY.matchSuffix)}</p>`:'';
 showModal(COPY.title,`<div class="pr-dialog"><div class="pr-context"><span class="pr-badge">PR</span><span>外部サービスのご紹介</span></div>${canPersonalize?`<label class="check"><input type="checkbox" id="pr-personalize" ${consented?'checked':''}><span>${esc(COPY.personalizeLabel)}</span></label><p class="hint">${esc(COPY.personalizeHint)}</p>`:''}<div class="pr-offers">${shown.map(c=>`<article><span class="pr-merchant">${esc(c.merchant)}</span><h3>${esc(c.title)}</h3><p>${esc(c.description)}</p>${reason}${promotionForm(c)}</article>`).join('')||'<p>'+esc(COPY.empty)+'</p>'}</div><p class="pr-disclosure">${esc(COPY.disclosure)}</p>${items.length>1?`<div class="pr-pager"><button type="button" class="btn plain" data-pr-page="-1" ${active.index===0?'disabled':''}>前の紹介</button><span>${active.index+1} / ${items.length}</span><button type="button" class="btn plain" data-pr-page="1" ${active.index===items.length-1?'disabled':''}>次の紹介</button></div>`:''}<a class="text-button" href="/advertising/" target="_blank" rel="noopener noreferrer">${esc(COPY.policyLink)}</a></div>`);
}
document.addEventListener('change',event=>{
 if(event.target.id!=='pr-personalize'||!active)return;
 if(!personalizationEnabled||privateMode())return;
 writeConsent(event.target.checked?{version:AD_CONSENT,recordId:active.recordId,acceptedAt:Date.now()}:null);active.index=0;renderPromotion();document.querySelector('#pr-personalize')?.focus({preventScroll:true});
});
document.addEventListener('click',event=>{const pager=event.target.closest?.('[data-pr-page]');if(pager&&active){active.index=Math.max(0,active.index+Number(pager.dataset.prPage));renderPromotion();}});
document.addEventListener('submit',event=>{
 const form=event.target.closest?.('form[data-pr-id]');if(!form)return;
 const campaign=campaigns.find(c=>c.id===form.dataset.prId);
 if(!active||!campaign||!selectPromotions([campaign],{placement:active.placement}).length||form.getAttribute('action')!==campaign.url||!form.checkValidity()){event.preventDefault();return;}
 if(!eligibilityReady()){event.preventDefault();void ensureEligibility({refresh:true}).then(()=>form.isConnected&&form.requestSubmit());return;}
 if(event.isTrusted)measure('pr_click');
});

window.addEventListener('storage',event=>{if(event.key===KEY||event.key===null){volatileConsent=null;storageUnavailable=false;if(document.querySelector('#modal[open] .pr-dialog'))renderPromotion();}});
