import test from 'node:test';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {QUESTIONS,DIMENSIONS,TYPES,QUESTION_ORDER,diagnose,validAnswers,encodeResult,decodeResult,readResultLink,compareResults} from '../src/diagnosis.mjs';
import {organizeTags} from '../src/tags.mjs';
import {normalizePersonal,personalize} from '../src/profile.mjs';
import {phrases} from '../src/phrasing.mjs';
const PREVIOUS_LINK="H4.eyJ2Ijo0LCJpIjoidW5pZmllZDQwLTEiLCJjIjoiRENOWCIsIm0iOltmYWxzZSxmYWxzZSxmYWxzZSxmYWxzZV0sImQiOltbMTIsMywzXSxbNSwzLDFdLFsxMiwzLDNdLFszLDMsMF0sWzMsMywwXSxbMTIsMywzXSxbMTUsNCw0XSxbMTAsNSwwXSxbMTIsMywzXSxbMTYsNSw1XV0sImEiOltbNiwyLDJdLFs2LDIsMl0sWzIsMiwwXSxbNCwyLDBdXSwiciI6WyJ0ZWFzZSIsImdhcCIsImNvb2wiLCJwYWN0IiwiY2FyZSIsInBhbXBlciJdLCJ0IjpbXX0";
const empty=()=>Array(40).fill(null);
const rating=(answers,num,value)=>{answers[num-1]=value;return answers;};
const dim=(result,id)=>result.dims.find(d=>d.id===id);
test('one editorial question order has 40 unique questions and four non-ordinal scenes',()=>{assert.equal(QUESTION_ORDER[0],7);assert.deepEqual([...QUESTION_ORDER].sort((a,b)=>a-b),[...Array(40).keys()]);assert.equal(QUESTIONS.filter(q=>q.kind==='scene').length,4);assert.equal(Object.keys(TYPES).length,16);for(const d of DIMENSIONS){assert.ok(d.items.length>=(d.minimum||3));assert.ok(d.items.every(i=>QUESTIONS[i].kind==='intensity'));}for(const q of QUESTIONS){assert.equal(q.choices.length,5);assert.equal(new Set(q.choices.map(c=>c.value)).size,5);}});
test('only the 40-question shape and its own options are accepted',()=>{assert.ok(validAnswers(empty()));for(const a of [Array(32).fill(2),Array(40).fill(5),Array(40).fill('2'),new Array(40)])assert.equal(validAnswers(a),false);assert.equal(validAnswers(empty(),18),false);});
test('S-specific preference cannot subtract M or willingness to yield',()=>{const a=Array(40).fill(2),b=[...a];rating(a,3,0);rating(b,3,4);const left=diagnose(a),right=diagnose(b);assert.ok(dim(right,'sadism').score>dim(left,'sadism').score);assert.equal(dim(right,'masochism').score,dim(left,'masochism').score);assert.equal(dim(right,'yield').score,dim(left,'yield').score);});
test('heavy love and cool distance can coexist without a zero-sum adjustment',()=>{const a=Array(40).fill(2),b=[...a];rating(a,9,0);rating(b,9,4);assert.equal(dim(diagnose(a),'cool').score,dim(diagnose(b),'cool').score);const c=Array(40).fill(4);assert.equal(dim(diagnose(c),'wet').score,100);assert.equal(dim(diagnose(c),'cool').score,100);});
test('both S and M can be independently high or low',()=>{for(const v of [0,4]){const r=diagnose(Array(40).fill(v));assert.equal(dim(r,'sadism').score,v*25);assert.equal(dim(r,'masochism').score,v*25);}});
test('one intense answer does not invent a type, shadow or automatic trigger',()=>{for(let i=0;i<40;i++){const a=empty();a[i]=4;const r=diagnose(a);assert.equal(r.typeCode,null);assert.equal(r.shadow,null);assert.deepEqual(r.triggers,[]);}});
test('unknown answers stay unknown and flat answers do not default to DWNX',()=>{const r=diagnose(empty());assert.ok(r.dims.every(d=>d.score===null&&d.n===0));const flat=diagnose(Array(40).fill(2));assert.equal(flat.typeCode,null);assert.equal(flat.shadow,null);});
test('scene choices confirm direction while the self-image never changes desire scores',()=>{const a=Array(40).fill(2),b=[...a];a[35]=0;b[35]=1;assert.deepEqual(diagnose(a).dims,diagnose(b).dims);assert.notEqual(diagnose(a).typeCode,diagnose(b).typeCode);a[7]=0;b[7]=1;assert.deepEqual(diagnose(a).dims,diagnose(b).dims);});
test('the owner-pet shadow needs giving and receiving care as well as leading',()=>{const a=Array(40).fill(1);for(const n of [1,33,38,26,29,4,30])rating(a,n,4);const r=diagnose(a);assert.equal(r.shadow.id,'ownerPet');rating(a,29,0);assert.notEqual(diagnose(a).shadow?.id,'ownerPet');});
test('role reversal needs repeated preferences, not high S/M alone',()=>{const a=Array(40).fill(1);for(const n of [1,2,30,33,38,39])rating(a,n,4);assert.notEqual(diagnose(a).shadow?.id,'switch');});
test('all 16 types are reachable and every result survives compact sharing',()=>{let seed=1729;const seen=new Set();for(let i=0;i<1500;i++){const a=QUESTIONS.map(()=>{seed=(seed*16807)%2147483647;return seed%5;});const r=diagnose(a),d=decodeResult(encodeResult(r));assert.equal(d.title,r.title);assert.equal(d.typeCode,r.typeCode);assert.deepEqual(d.shadow,r.shadow);if(r.typeCode)seen.add(r.typeCode);if(seen.size===16)break;}assert.equal(seen.size,16);});
test('sharing includes selected tags and aggregate facts, never the 40 raw answers',()=>{const r=diagnose(Array(40).fill(3));const code=encodeResult(r,[{label:'私用の声フェチ',kind:'like'}]);const data=JSON.parse(Buffer.from(code.slice(3),'base64url').toString());assert.ok(!Object.hasOwn(data,'answers'));assert.equal(data.d.length,12);assert.equal(data.t.length,1);assert.deepEqual(readResultLink('https://heki.test/#share='+code).tags.map(t=>t.label),['私用の声フェチ']);});
test('malformed, oversized and impossible shared facts fail closed',()=>{const original=encodeResult(diagnose(Array(40).fill(2)));const p=JSON.parse(Buffer.from(original.slice(3),'base64url').toString());for(const patch of [{i:'old'},{c:'BAD'},{d:[[1000,3,3],...p.d.slice(1)]},{a:[[8,1,2],...p.a.slice(1)]},{r:['unknown']},{t:[{label:'x',group:'bad',kind:'like'}]}]){const code='H6.'+Buffer.from(JSON.stringify({...p,...patch})).toString('base64url');assert.throws(()=>decodeResult(code));}assert.throws(()=>decodeResult('H4.'+'a'.repeat(5000)));});
test('comparison is reciprocal and does not invent a success percentage',()=>{const a=Array(40).fill(1),b=Array(40).fill(1);for(const n of [1,33,38])rating(a,n,4);for(const n of [2,30,39])rating(b,n,4);const left=compareResults(diagnose(a),diagnose(b)),right=compareResults(diagnose(b),diagnose(a));assert.match(left[0].title,/あなたが導き/);assert.match(right[0].title,/相手が導き/);assert.ok(!JSON.stringify(left).includes('%'));});
test('tag normalization and learned placement preserve a user correction',()=>{const learned={'声フェチ':'relationship'};const tags=organizeTags([{label:'＃声フェチ',kind:'like'},{label:'声フェチ',kind:'like'}],learned);assert.equal(tags.length,1);assert.equal(tags[0].group,'relationship');assert.equal(organizeTags([{...tags[0],manual:true,group:'other'}],learned)[0].group,'other');});
test('group pair labels refer to the compared people, not the account owner',()=>{const a=Array(40).fill(1),b=Array(40).fill(1);for(const n of [1,33,38])rating(a,n,4);for(const n of [2,30,39])rating(b,n,4);const result=compareResults(diagnose(a),diagnose(b),{aLabel:'相手1',bLabel:'相手2'});assert.equal(result[0].title,'相手1が導き、相手2が委ねる');assert.ok(!JSON.stringify(result).includes('あなた'));assert.ok(!JSON.stringify(result).includes('相手21'));});
test('complete profiles with tied axes still receive a natural, specific headline',()=>{const a=Array(40).fill(2);for(const n of [8,36,37,40])rating(a,n,4);for(const n of [1,33,38])rating(a,n,4);const r=diagnose(a);assert.equal(r.typeCode,null);assert.equal(r.title,'二人の演出家');for(const n of [3,5])rating(a,n,4);rating(a,1,2);rating(a,38,2);assert.equal(diagnose(a).title,'余裕を奪う小悪魔');});

test('previous aggregate-only links retain their original name and cannot be reinterpreted as current answers',()=>{const code=PREVIOUS_LINK,r=decodeResult(code);assert.equal(r.instrument,'unified40-1');assert.equal(r.title,'焦らしのマエストロ');assert.equal(r.dims.length,10);assert.equal(encodeResult(r),code);assert.equal(r.evidence,undefined);assert.equal(compareResults(r,diagnose(Array(40).fill(4))).length,1);});

test('handing over decisions does not manufacture M; caring for someone does not manufacture ownership',()=>{const a=Array(40).fill(1),b=[...a];rating(b,2,4);assert.equal(dim(diagnose(a),'masochism').score,dim(diagnose(b),'masochism').score);rating(b,19,4);rating(b,29,4);assert.equal(dim(diagnose(a),'ownership').score,dim(diagnose(b),'ownership').score);assert.equal(diagnose(b).aux.giveCare.high,1);assert.notEqual(diagnose(b).shadow?.id,'ownerPet');});
test('restraint can appeal in either role without the other role subtracting from it',()=>{const a=Array(40).fill(0),b=[...a];rating(a,28,4);rating(a,38,4);rating(b,28,4);rating(b,39,4);assert.equal(dim(diagnose(a),'restraint').score,100);assert.equal(dim(diagnose(b),'restraint').score,100);assert.equal(dim(diagnose(a),'restraint').n,2);assert.equal(dim(diagnose(a),'masochism').score,0);});
test('a surprising self-image gap needs an explicit self-image plus repeated opposite preferences',()=>{const a=Array(40).fill(0);a[7]=0;rating(a,2,4);assert.equal(diagnose(a).gap,undefined);for(const n of [30,39])rating(a,n,4);const r=diagnose(a);assert.equal(r.gap.id,'leadToYield');assert.equal(decodeResult(encodeResult(r)).gap.id,'leadToYield');a[7]=null;assert.equal(diagnose(a).gap,null);});
test('personal language is normalized, optional and never rewrites the scored preferences',()=>{const base=diagnose(Array(40).fill(3)),personal=normalizePersonal({alias:'私だけの名前',caption:'二人きりの時だけ',contexts:['private','private','bad'],meaning:'contrast'}),r=personalize(base,personal);assert.equal(r.title,'私だけの名前');assert.deepEqual(r.dims,base.dims);assert.deepEqual(r.personal.contexts,['private']);assert.ok(!encodeResult(base).includes('私だけの名前'));assert.equal(decodeResult(encodeResult(r)).personal.caption,personal.caption);assert.equal(decodeResult(encodeResult(base)).personal,undefined);});
test('crafted shared gaps and malformed private language fail closed',()=>{const code=encodeResult(diagnose(Array(40).fill(0))),p=JSON.parse(Buffer.from(code.slice(3),'base64url').toString());for(const change of [{g:'leadToYield'},{g:'unconscious'},{p:{alias:'x'.repeat(33),caption:'',contexts:[],meaning:''}},{p:{alias:'',caption:'',contexts:['secret'],meaning:''}}])assert.throws(()=>decodeResult('H6.'+Buffer.from(JSON.stringify({...p,...change})).toString('base64url')));});
test('the generated names keep more than sixteen distinct combinations and round-trip faithfully',()=>{let seed=441;const names=new Set();for(let i=0;i<1600;i++){const a=QUESTIONS.map(()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%5;});const r=diagnose(a);names.add(r.title);const shared=decodeResult(encodeResult(r));assert.equal(shared.title,r.title);assert.equal(shared.signature,r.signature);}assert.ok(names.size>16,String(names.size));});

test('forwarding a previous shared result respects the new explicit tag selection',()=>{const old=decodeResult(PREVIOUS_LINK),withTag=decodeResult(encodeResult(old,[{label:'選んだ声フェチ',kind:'like'}]));assert.equal(withTag.title,old.title);assert.deepEqual(withTag.tags.map(t=>t.label),['選んだ声フェチ']);assert.deepEqual(decodeResult(encodeResult(withTag,[])).tags,[]);});

test('phrase formatting preserves all authored text and keeps inflected words together',()=>{for(const q of QUESTIONS)for(const text of [q.text,...q.choices.map(c=>c.label)])assert.equal(phrases(text).join(''),text);assert.ok(phrases('二人だけの秘密を、もう一つ増やしたい').some(part=>part.includes('増やしたい')));assert.ok(phrases('密室で少しずつ崩れていく過程').includes('少しずつ'));assert.ok(phrases('濃い時間のあと、欲しい一言は？').some(part=>part.includes('欲しい一言')));assert.doesNotThrow(()=>normalizePersonal(null));});

test('the relationship library keeps sixteen distinct scenes and does not pretend to determine S/M',()=>{assert.equal(new Set(Object.values(TYPES).map(t=>t.scene)).size,16);for(const t of Object.values(TYPES)){assert.ok(t.conversation.endsWith('？'));assert.ok(t.contrast.length>10);}assert.match(TYPES.SWNP.contrast,/尽くしたいとは限らない/);assert.equal(organizeTags(['二人だけの合図'])[0].group,'relationship');assert.equal(organizeTags(['囁きに弱い'])[0].group,'atmosphere');assert.equal(organizeTags(['最後は甘い余韻'])[0].group,'relationship');});

test('leading without teasing or restraint still has a supported name, and S cannot manufacture leadership',()=>{
 const a=Array(40).fill(0);for(const n of [1,7])rating(a,n,4);let r=diagnose(a);
 assert.equal(r.title,'二人の演出家');assert.equal(dim(r,'sadism').score,0);assert.equal(dim(r,'restraint').score,0);
 const b=Array(40).fill(0);for(const n of [3,5,33])rating(b,n,4);r=diagnose(b);
 assert.equal(dim(r,'lead').score,0);assert.equal(r.title,'余裕を奪う小悪魔');
});
test('giving care and receiving care are separate stories even with the same sanctuary theme',()=>{
 const giver=Array(40).fill(0),receiver=Array(40).fill(0);
 for(const n of [26,29,32])rating(giver,n,4);for(const n of [4,26,30,32])rating(receiver,n,4);
 const a=diagnose(giver),b=diagnose(receiver);
 assert.equal(a.title,'溺愛の世話焼き');assert.equal(b.title,'全肯定の甘党');assert.ok(a.triggers.some(t=>t.id==='nurture'));assert.ok(!a.triggers.some(t=>t.id==='pamper'));
 assert.equal(dim(a,'pamper').score,100);assert.equal(dim(b,'pamper').score,100);
 assert.doesNotMatch(a.description+a.highlight.text,/されたい|自分も.*甘え|自分が.*撫で/);
 assert.equal(decodeResult(encodeResult(a)).title,a.title);assert.equal(decodeResult(encodeResult(b)).title,b.title);
});
test('a light, broad interest is a result rather than an unanswered-profile placeholder',()=>{
 const light=diagnose(Array(40).fill(2)),low=diagnose(Array(40).fill(0)),unknown=diagnose(empty());
 assert.equal(light.title,'つまみ食いの共犯者');assert.match(light.description,/少しずつ/);
 assert.equal(low.title,'沼の外の自由人');assert.notEqual(low.title,unknown.title);
 assert.equal(light.shadow,null);assert.deepEqual(light.triggers,[]);
});
test('voice detail and role combine only with two voice cues and repeated role preferences',()=>{
 const a=Array(40).fill(0);for(const n of [2,30,39,3,5,33,20])rating(a,n,4);a[36]=0;
 let r=diagnose(a);assert.equal(r.title,'囁きに弱い小悪魔');assert.equal(dim(r,'lead').score,0);
 assert.equal(r.signature,'手綱は預ける。牙は抜かない。');assert.deepEqual(r.cueItems,[19,36]);
 assert.equal(decodeResult(encodeResult(r)).signature,r.signature);
 a[36]=4;r=diagnose(a);assert.ok(!r.triggers.some(t=>t.id==='voiceReceive'));assert.notEqual(r.title,'囁きに弱い小悪魔');
});
test('reversal needs both role interests and a concrete mid-scene reversal, not giving leadership to a needy partner',()=>{
 const a=Array(40).fill(0);for(const n of [1,7,38,2,30,39,16])rating(a,n,4);
 a[35]=4;assert.notEqual(diagnose(a).title,'主従逆転の共犯者');
 a[35]=2;const r=diagnose(a);assert.equal(r.title,'主従逆転の共犯者');
 rating(a,16,0);assert.notEqual(diagnose(a).title,'主従逆転の共犯者');
});
test('restraint language follows the desired role instead of assuming everyone wants to be restrained',()=>{
 const a=Array(40).fill(0);for(const n of [1,7,28,38])rating(a,n,4);const r=diagnose(a);
 assert.equal(r.title,'合図の演出家');assert.match(r.highlight.text,/こちらの合図/);
 assert.ok(r.triggers.some(t=>t.id==='restraintGive'));assert.ok(!r.triggers.some(t=>t.id==='restraintReceive'));
});
test('H5 links retain the original title and prose after new questions and result language ship',()=>{
 for(const old of JSON.parse(fs.readFileSync(new URL('./fixtures/share-v5.json',import.meta.url)))){
  const r=decodeResult(old.code);assert.equal(r.title,old.title);assert.equal(r.description,old.description);assert.equal(r.instrument,'unified40-2');
  const forwarded=decodeResult(encodeResult(r,[{label:'選んだ言葉',kind:'like'}]));assert.equal(forwarded.title,old.title);assert.deepEqual(forwarded.tags.map(t=>t.label),['選んだ言葉']);assert.deepEqual(decodeResult(encodeResult(forwarded,[])).tags,[]);
  assert.equal(compareResults(r,diagnose(Array(40).fill(4))).length,1);
 }
});

test('a corroborated voice preference gets a specific name even when other sensory preferences are low',()=>{
 const a=Array(40).fill(0);rating(a,20,4);a[36]=0;const r=diagnose(a);
 assert.equal(r.title,'声に弱い収集家');assert.equal(dim(r,'yield').score,0);assert.equal(dim(r,'masochism').score,0);
 assert.equal(decodeResult(encodeResult(r)).title,r.title);assert.deepEqual(r.cueItems,[19,36]);
 rating(a,20,0);assert.notEqual(diagnose(a).title,'声に弱い収集家');
});
test('praise and pet-like affection do not require liking every kind of care or surrender',()=>{
 const a=Array(40).fill(0);for(const n of [4,30])rating(a,n,4);const r=diagnose(a);
 assert.equal(r.title,'撫で待ちの甘党');assert.equal(dim(r,'pamper').score,100);assert.ok(dim(r,'yield').score<65);
 assert.doesNotMatch(r.description,/主導権を|世話を焼きたい/);assert.equal(decodeResult(encodeResult(r)).title,r.title);
});
test('a narrow pair of strong visual interests is not dismissed as having no interests',()=>{
 const a=Array(40).fill(0);for(const n of [18,21])rating(a,n,4);const r=diagnose(a);
 assert.equal(r.title,'一点突破の沼住人');assert.deepEqual(r.focus,['aesthetic']);assert.deepEqual(r.evidence.filter(e=>QUESTIONS[e.id].kind==='intensity').map(e=>e.id),[17,20]);
});
test('wanting to restrain a partner alone never describes waiting for another persons command',()=>{
 const a=Array(40).fill(0);for(const n of [28,38])rating(a,n,4);const r=diagnose(a);
 assert.equal(r.title,'合図の仕掛け人');assert.match(r.highlight.text,/こちらの合図/);assert.doesNotMatch(r.highlight.text,/自分.*待つ|相手に預け/);
});
