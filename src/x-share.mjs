// Web Intent opens a composer. The user still chooses whether to post on X.
export function xPostText(card,{nameOnly=false}={}){
 const clip=(s,max)=>Array.from(String(s||'').replace(/[\r\n]+/g,' ')).slice(0,max).join('');
 return `私の性癖についた名前は「${clip(card.title,45)}」。${nameOnly?'':'\n'+clip(card.quote,45)}\n#KUSEIRO #性癖診断`;
}
// A stable presentation revision refreshes previously cached, image-less cards.
export function sharePreviewUrl(raw){
 const link=new URL(raw);
 if(/^\/s\/[A-Za-z0-9_-]{16}$/.test(link.pathname))link.searchParams.set('card','1');
 return link.href;
}
export function xIntentUrl(card,url,options){
 const link=new URL(url);if(!['http:','https:'].includes(link.protocol)||link.username||link.password)throw Error('INVALID_SHARE_URL');
 return 'https://twitter.com/intent/tweet?'+new URLSearchParams({text:xPostText(card,options),url:sharePreviewUrl(link.href)});
}
export async function handoffToX({prepareLink,intent,showReady,isCurrent=()=>true,navigateCurrent}){
 // In-app browsers can create a blank tab but ignore its later navigation.
 // Keep the result visible while saving the public link, then leave in this tab.
 await prepareLink();
 if(!isCurrent())return {opened:false,cancelled:true};
 showReady();
 navigateCurrent(intent());
 return {opened:true,cancelled:false};
}
