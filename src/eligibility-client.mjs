import {SITE_ELIGIBILITY_POLICY,eligibilityRequired} from './eligibility-core.mjs';

let acceptedUntil=0,pending=null;
export const eligibilityReady=()=>acceptedUntil>Date.now();
const policyPage=()=>!eligibilityRequired(location.pathname);
async function status(){const r=await fetch('/api/eligibility',{credentials:'same-origin',cache:'no-store'});if(!r.ok)throw Error('unavailable');const value=await r.json();return value.policy===SITE_ELIGIBILITY_POLICY&&value.eligible===true&&value.validUntil>Date.now()?value:null;}
function reveal(value){acceptedUntil=value.validUntil;document.documentElement.dataset.eligibility='confirmed';document.querySelector('#eligibility-loading')?.remove();document.dispatchEvent(new Event('nocturne-eligible'));}
export function ensureEligibility({refresh=false}={}){
 if(!refresh&&eligibilityReady())return Promise.resolve(true);
 if(pending)return pending;
 pending=(async()=>{
  try{const value=await status();if(value){reveal(value);return true;}}catch{/* A failed confirmation never opens adult content. */}
  if(policyPage())return false;
  delete document.documentElement.dataset.eligibility;
  return new Promise(resolve=>{
   const gate=document.createElement('dialog');gate.id='eligibility-gate';gate.setAttribute('aria-labelledby','eligibility-title');gate.setAttribute('aria-describedby','eligibility-description');
   gate.innerHTML='<p class="editorial-label">KUSEIRO</p><h1 id="eligibility-title">年齢確認</h1><p id="eligibility-description">18歳以上で、<br>高校生ではない方ですか？</p><div class="eligibility-actions"><button type="button" class="btn primary wide" id="eligibility-yes">はい、サイトに入る</button><button type="button" class="btn secondary wide" id="eligibility-no">いいえ</button></div><p id="eligibility-error" class="error" role="alert"></p><p class="hint eligibility-note">確認は30日間有効です。</p><a class="text-button" href="/privacy/" target="_blank" rel="noopener noreferrer">プライバシー</a>';
   gate.addEventListener('cancel',event=>event.preventDefault());document.body.append(gate);document.querySelector('#eligibility-loading')?.remove();gate.showModal();
   gate.querySelector('#eligibility-no').addEventListener('click',()=>{gate.innerHTML='<p class="editorial-label">KUSEIRO</p><h1 id="eligibility-title">ご利用いただけません</h1><p id="eligibility-description">18歳未満の方・高校生の方は対象外です。<br>このページを閉じてください。</p>';});
   gate.querySelector('#eligibility-yes').addEventListener('click',async event=>{
    const button=event.currentTarget;button.disabled=true;gate.querySelector('#eligibility-no').disabled=true;
    try{const r=await fetch('/api/eligibility',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({policy:SITE_ELIGIBILITY_POLICY,confirmed:true})});if(!r.ok)throw Error('unavailable');const value=await status();if(!value)throw Error('cookie_unavailable');reveal(value);gate.close();gate.remove();resolve(true);}
    catch{gate.querySelector('#eligibility-error').textContent='確認を保存できませんでした。Cookieと通信を確認して、もう一度お試しください。';button.disabled=false;gate.querySelector('#eligibility-no').disabled=false;}
   });
  });
 })().finally(()=>{pending=null;});return pending;
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&!eligibilityReady()&&!policyPage())void ensureEligibility();});
