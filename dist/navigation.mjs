// The app menu and generated articles share labels, order, and destinations.
export const INFORMATION_LINKS=Object.freeze([
 ['/guide/','楽しみ方'],['/types/','関係性図鑑'],['/library/','読みもの'],['/privacy/','プライバシー'],['/advertising/','広告について']
].map(Object.freeze));
const menuIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
export function informationLinks(route=''){
 return INFORMATION_LINKS.map(([url,label])=>`<a href="${url}"${route.startsWith(url)?' aria-current="page"':''}>${label}</a>`).join('');
}
export function siteHeader(route=''){
 const app=route==='';
 const main=[['home','診断'],['profile','カルテ'],['find','探す']].map(([id,label])=>`<a href="${app?'':'/'}#${id}"${app?` data-route="${id}"`:''}>${label}</a>`).join('');
 const menu=app?`<button class="quiz-pause" data-action="pause">中断</button><button class="menu-button" aria-label="メニューを開く" data-action="menu">${menuIcon}</button>`:`<details class="article-menu"><summary class="menu-button" aria-label="メニューを開く">${menuIcon}</summary><nav aria-label="サイト情報">${informationLinks(route)}</nav></details>`;
 return `<header class="site-header"><a class="brand" href="/#home"><span class="brand-mark" aria-hidden="true">K</span>KUSEIRO</a><nav aria-label="メイン">${main}${menu}</nav></header>`;
}
export function dismissArticleMenu(event,doc){
 const menu=doc.querySelector('.article-menu[open]');if(!menu)return false;
 if(event.type==='keydown'&&event.key==='Escape'){event.preventDefault();menu.open=false;menu.querySelector('summary').focus();return true;}
 if(event.type==='click'&&!event.target.closest('.article-menu')){menu.open=false;return true;}
 return false;
}
if(typeof document!=='undefined'){
 document.addEventListener('keydown',event=>dismissArticleMenu(event,document));
 document.addEventListener('click',event=>dismissArticleMenu(event,document));
}
