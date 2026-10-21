import {campaigns,personalizationEnabled} from './affiliate-catalog.mjs';
import {AD_CONSENT,adConsentApplies,selectPromotions} from './affiliate-core.mjs';
import {measure} from './metrics.mjs';
const KEY='nocturne_pr_consent';
const COPY={"entry":"PR · myfansの紹介を見る","title":"PR · myfans","disclosure":"リンク先で購入があると、運営者に報酬が入る場合があります。","personalizeLabel":"今回の結果に合わせて広告を表示する","personalizeHint":"回答提供の同意とは別の任意設定です。オンにした今回の結果にだけ使われ、回答は広告主へ送りません。チェックを外せばいつでも解除できます。","outbound":"myfansで詳細を見る ↗","policyLink":"広告について","empty":"現在、表示できる広告はありません。"};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let volatileConsent=null,active=null,storageUnavailable=false;
const privateMode=()=>navigator.doNotTrack==='1'||navigator.globalPrivacyControl===true;
function readConsent(){if(storageUnavailable)return volatileConsent;try{return JSON.parse(localStorage.getItem(KEY)||'null');}catch{return null;}}
function writeConsent(value){volatileConsent=value;try{if(value)localStorage.setItem(KEY,JSON.stringify(value));else localStorage.removeItem(KEY);storageUnavailable=false;}catch{storageUnavailable=true;/* This visit can still make an explicit choice. */}}
export function promotionEntry(eligible,compact=false){return eligible&&selectPromotions(campaigns).length?`<button type="button" class="${compact?'btn plain':'text-button'} pr-entry" data-action="open-promotion" aria-label="${esc(COPY.entry)}">${esc(compact?COPY.title:COPY.entry)}</button>`:'';}
export function forgetPromotionConsent(){writeConsent(null);active=null;}
export function openPromotion({profile,recordId,showModal}){
 if(!profile||!recordId||!selectPromotions(campaigns).length)return;
 active={profile,recordId,showModal,index:0};measure('pr_open');renderPromotion();
}
function renderPromotion(){
 if(!active)return;
 const {profile,recordId,showModal}=active,canPersonalize=personalizationEnabled&&!privateMode(),consented=canPersonalize&&adConsentApplies(readConsent(),recordId);
 const items=selectPromotions(campaigns,{consented,facets:consented?profile.facets:[]});active.index=Math.min(active.index,Math.max(0,items.length-1));const shown=items.slice(active.index,active.index+1);
 showModal(COPY.title,`<div class="pr-dialog"><p class="hint">${esc(COPY.disclosure)}</p>${canPersonalize?`<label class="check"><input type="checkbox" id="pr-personalize" ${consented?'checked':''}><span>${esc(COPY.personalizeLabel)}</span></label><p class="hint">${esc(COPY.personalizeHint)}</p>`:''}<div class="pr-offers">${shown.map(c=>`<article><span class="editorial-label">PR · ${esc(c.merchant)}</span><h3>${esc(c.title)}</h3><p>${esc(c.description)}</p><a class="btn secondary wide" data-pr-id="${esc(c.id)}" href="${esc(c.url)}" target="_blank" rel="sponsored noopener noreferrer" referrerpolicy="no-referrer">${esc(COPY.outbound)}</a></article>`).join('')||'<p>'+esc(COPY.empty)+'</p>'}</div>${items.length>1?`<div class="pr-pager"><button type="button" class="btn plain" data-pr-page="-1" ${active.index===0?'disabled':''}>前の紹介</button><span>${active.index+1} / ${items.length}</span><button type="button" class="btn plain" data-pr-page="1" ${active.index===items.length-1?'disabled':''}>次の紹介</button></div>`:''}<a class="text-button" href="/advertising/" target="_blank" rel="noopener noreferrer">${esc(COPY.policyLink)}</a></div>`);
}
document.addEventListener('change',event=>{
 if(event.target.id!=='pr-personalize'||!active)return;
 if(!personalizationEnabled||privateMode())return;
 writeConsent(event.target.checked?{version:AD_CONSENT,recordId:active.recordId,acceptedAt:Date.now()}:null);active.index=0;renderPromotion();document.querySelector('#pr-personalize')?.focus({preventScroll:true});
});
function clickPromotion(event){
 const link=event.target.closest?.('[data-pr-id]');if(!link)return;
 const campaign=campaigns.find(c=>c.id===link.dataset.prId);
 if(!active||!campaign||!selectPromotions([campaign]).length||link.getAttribute('href')!==campaign.url){event.preventDefault();renderPromotion();return;}
 if(event.isTrusted)measure('pr_click');
}
document.addEventListener('click',event=>{const pager=event.target.closest?.('[data-pr-page]');if(pager&&active){active.index=Math.max(0,active.index+Number(pager.dataset.prPage));renderPromotion();}else clickPromotion(event);});
document.addEventListener('auxclick',event=>{if(event.button===1)clickPromotion(event);});

window.addEventListener('storage',event=>{if(event.key===KEY||event.key===null){volatileConsent=null;storageUnavailable=false;if(document.querySelector('#modal[open] .pr-dialog'))renderPromotion();}});
