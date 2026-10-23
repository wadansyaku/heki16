import test from 'node:test';
import assert from 'node:assert/strict';
import {INFORMATION_LINKS,informationLinks,siteHeader,dismissArticleMenu} from '../src/navigation.mjs';
test('app and article navigation retain the same destinations and accessible menu labels',()=>{
 const app=siteHeader(),article=siteHeader('/library/fantasy/');
 for(const label of ['診断','カルテ','探す','メニューを開く']){assert.ok(app.includes(label));assert.ok(article.includes(label));}
 const links=informationLinks('/library/fantasy/');
 assert.equal((links.match(/aria-current="page"/g)||[]).length,1);assert.match(links,/<a href="\/library\/" aria-current="page">読みもの/);
 for(const [url,label] of INFORMATION_LINKS){assert.ok(links.includes(`href="${url}"`));assert.ok(links.includes(label));assert.ok(article.includes(`href="${url}"`));}
 assert.ok(!links.includes('target="_blank"'));assert.ok(article.includes('<details'));assert.ok(article.indexOf('/#home')<article.indexOf('/#profile'));assert.ok(article.indexOf('/#profile')<article.indexOf('/#find'));
});
test('article menu closes on Escape with focus returned, without stealing an outside click',()=>{
 let focused=0,prevented=0;const menu={open:true,querySelector:()=>({focus:()=>focused++})},doc={querySelector:()=>menu};
 assert.equal(dismissArticleMenu({type:'keydown',key:'Escape',preventDefault:()=>prevented++},doc),true);assert.equal(menu.open,false);assert.equal(focused,1);assert.equal(prevented,1);
 menu.open=true;assert.equal(dismissArticleMenu({type:'click',target:{closest:()=>({})}},doc),false);assert.equal(menu.open,true);
 assert.equal(dismissArticleMenu({type:'click',target:{closest:()=>null}},doc),true);assert.equal(menu.open,false);assert.equal(focused,1);
});
