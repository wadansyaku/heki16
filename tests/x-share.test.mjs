import test from 'node:test';
import assert from 'node:assert/strict';
import {xPostText,xIntentUrl,handoffToX} from '../src/x-share.mjs';
test('X composer receives a bounded public card and separate URL, with name-only privacy',()=>{
 const card={title:'あ'.repeat(120),quote:'秘'.repeat(200),summary:'private',rawAnswers:['never']};
 const intent=new URL(xIntentUrl(card,'https://kuseiro.com/s/abcdefghijklmnop'));
 assert.equal(intent.origin,'https://twitter.com');assert.equal(intent.pathname,'/intent/tweet');
 assert.ok(Array.from(intent.searchParams.get('text')).length*2+24<=280);
 assert.ok(!intent.href.includes('private'));assert.ok(!xPostText(card,{nameOnly:true}).includes('秘'));
 assert.equal(intent.searchParams.get('url'),'https://kuseiro.com/s/abcdefghijklmnop?card=1');
 assert.throws(()=>xIntentUrl(card,'javascript:alert(1)'));assert.throws(()=>xIntentUrl(card,'https://user:password@example.org/'));
});
test('an in-app browser navigates the current tab once the public link is ready, without a blank popup',async()=>{
 let release;const pending=new Promise(resolve=>release=resolve),events=[];
 const run=handoffToX({reserveWindow:()=>assert.fail('A popup can remain on about:blank in X'),prepareLink:()=>{events.push('saving');return pending;},showReady:()=>events.push('ready'),intent:()=> 'https://twitter.com/intent/tweet?text=synthetic',navigateCurrent:url=>events.push(url)});
 assert.deepEqual(events,['saving']);release();
 assert.deepEqual(await run,{opened:true,cancelled:false});
 assert.deepEqual(events,['saving','ready','https://twitter.com/intent/tweet?text=synthetic']);
});
test('a failed public-link request keeps the result page and never opens X',async()=>{
 const events=[];
 await assert.rejects(handoffToX({prepareLink:async()=>{throw Error('offline');},showReady:()=>events.push('ready'),intent:()=>assert.fail('No intent before a saved link'),navigateCurrent:url=>events.push(url)}),/offline/);
 assert.deepEqual(events,[]);
});
test('an account or result change during saving cancels the X handoff',async()=>{
 let release,current=true;const pending=new Promise(resolve=>release=resolve),events=[];
 const run=handoffToX({prepareLink:()=>pending,isCurrent:()=>current,showReady:()=>events.push('ready'),intent:()=>assert.fail('No stale share'),navigateCurrent:url=>events.push(url)});
 current=false;release();assert.deepEqual(await run,{opened:false,cancelled:true});assert.deepEqual(events,[]);
});

test('X intent refreshes the card presentation without changing its ID or the same-tab handoff',()=>{
 const raw='https://kuseiro.com/s/abcdefghijklmnop?card=old',intent=new URL(xIntentUrl({title:'合成カード',quote:'動作確認'},raw)),shared=new URL(intent.searchParams.get('url'));
 assert.equal(shared.pathname,'/s/abcdefghijklmnop');assert.equal(shared.searchParams.get('card'),'1');assert.equal(shared.searchParams.getAll('card').length,1);
 assert.equal(new URL(xIntentUrl({title:'test'},'https://kuseiro.com/')).searchParams.get('url'),'https://kuseiro.com/');
});
