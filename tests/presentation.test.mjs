import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {resultReading} from '../src/result-reading.mjs';
import {ART_VERSION,TITLE_ART,ART_KEYS,preferredArt,artSource} from '../src/art.mjs';
import {SCENES,diagnose,publicCard,validCard,emptyAnswers} from '../src/nocturne.mjs';
import assert from 'node:assert/strict';
import {visibleCard,facetRate,historyComparison} from '../src/presentation.mjs';
import {CHOICE_POLICY,publicationPreferred,rememberPublicationChoice,reconcilePublicationChoice,publicationReceiptApplies} from '../src/consent.mjs';

test('publication starts off and an unexplained legacy true does not become renewed consent',()=>{
 assert.equal(publicationPreferred(),false);
 assert.equal(publicationPreferred({publicationPreference:true}),false);
 assert.equal(publicationPreferred({}, {preference:true,choicePolicy:null}),false);
 assert.equal(publicationPreferred({}, {preference:true,choicePolicy:CHOICE_POLICY}),true);
 const chosen=rememberPublicationChoice({scope:'one'},true);
 assert.equal(publicationPreferred(chosen),true);
 assert.equal(publicationPreferred({...chosen,scope:'other'}),false);
 assert.equal(publicationPreferred(rememberPublicationChoice(chosen,false),{preference:true,choicePolicy:CHOICE_POLICY}),false);
 const queued=rememberPublicationChoice({scope:'one'},false,5,true);
 assert.equal(publicationPreferred(reconcilePublicationChoice(queued,{preference:true,choicePolicy:CHOICE_POLICY,revision:6},'one')),false);
 const pending=rememberPublicationChoice({scope:'one'},false,5);
 assert.equal(publicationPreferred(reconcilePublicationChoice(pending,{preference:true,choicePolicy:CHOICE_POLICY,revision:5},'one')),false);
 assert.equal(publicationPreferred(reconcilePublicationChoice(pending,{preference:true,choicePolicy:CHOICE_POLICY,revision:6},'one')),true);
 assert.equal(publicationPreferred(reconcilePublicationChoice(pending,{preference:true,choicePolicy:null,revision:6},'one')),false);
});

test('name-only snapshots omit every private detail, including fields a share preview might not display',()=>{
  const original={v:1,instrument:'example',title:'二つ名',quote:'private quote',summary:'private note',tags:['private tag'],traits:['lead']};
  const card=visibleCard(original,true);
  assert.equal(card.title,original.title);assert.deepEqual(card.tags,[]);assert.deepEqual(card.traits,[]);
  assert.ok(!JSON.stringify(card).includes('private'));assert.equal(original.quote,'private quote');
});
test('an unanswered preference stays unknown; an explicitly unselected preference can be zero',()=>{
  assert.equal(facetRate(),null);assert.equal(facetRate({count:0,opportunities:0}),null);
  assert.equal(facetRate({count:0,opportunities:2}),0);assert.equal(facetRate({count:1,opportunities:2}),50);
});
test('history compares only earlier records with the same question set and time context',()=>{
  const profile={instrument:'current',facets:[{id:'yield',count:1,opportunities:2}]};
  const current={id:'now',profile,context:{timeframe:'now'},completedAt:100};
  const row=(id,instrument,timeframe,completedAt)=>({id,profile:{...profile,instrument},context:{timeframe},completedAt});
  const rows=[row('wrong-question-set','old','now',99),row('wrong-time','current','recent',98),row('future','current','now',101),row('valid','current','now',80)];
  const result=historyComparison(current,rows,[['yield','委ねたい'],['scent','香り']]);
  assert.equal(result.before.id,'valid');assert.equal(result.items[0].before,50);assert.equal(result.items[1].now,null);assert.equal(result.items[1].before,null);
  assert.equal(historyComparison(current,rows.slice(0,3),[]).before,undefined);
});

test('old links move without losing share IDs, while recovery remains on the original host',async()=>{
  const {migrationResponse}=await import('../src/move-worker.mjs');
  const destination='https://nocturne.aiyume.workers.dev';
  const moved=migrationResponse(new Request('https://heki16-pro.aiyume.workers.dev/s/abcdefghijklmnop'),destination);
  assert.equal(moved.status,302);assert.equal(moved.headers.get('location'),destination+'/s/abcdefghijklmnop');
  assert.equal(migrationResponse(new Request('https://heki16-pro.aiyume.workers.dev/?records=1'),destination),null);
  assert.equal(migrationResponse(new Request('https://heki16-pro.aiyume.workers.dev/api/recovery/create',{method:'POST'}),destination),null);
  assert.equal(migrationResponse(new Request('https://heki16-pro.aiyume.workers.dev/app.mjs'),destination),null);
});

test('basic questions require explicit profile choices and reject non-answers',async()=>{
  const {firstMissingChoice}=await import('../src/presentation.mjs');
  const {PROFILE_OPTIONS}=await import('../src/nocturne.mjs');
  const opts=PROFILE_OPTIONS;
  assert.equal(firstMissingChoice({mood:'',age:'',gender:''},opts),'mood');
  assert.equal(firstMissingChoice({mood:'ordinary',age:'',gender:'man'},opts),'age');
  assert.equal(firstMissingChoice({mood:'ordinary',age:'20-24',gender:'forged'},opts),'gender');
  assert.equal(firstMissingChoice({mood:'unset',age:'unset',gender:'unset'},opts),'mood');
  assert.equal(firstMissingChoice({mood:'ordinary',age:'55-59',gender:'diverse'},opts),undefined);
  assert.deepEqual(Object.keys(opts.age),['18-19','20-24','25-29','30-34','35-39','40-44','45-49','50-54','55-59','60+']);
});

test('launch reset clears only trial app namespaces once, preserving later real answers',async()=>{
 const {resetTrialData}=await import('../src/vault.mjs');
 const storage={nocturne_1:'old',nocturne_pr_consent:'old',heki16_old:'old',other_app:'keep',getItem(k){return this[k]??null},setItem(k,v){this[k]=v},removeItem(k){delete this[k]}};
 assert.equal(resetTrialData(storage,'launch-20261021'),true);assert.equal(storage.other_app,'keep');assert.equal(storage.nocturne_1,undefined);assert.equal(storage.heki16_old,undefined);
 storage.nocturne_1='new answers';assert.equal(resetTrialData(storage,'launch-20261021'),false);assert.equal(storage.nocturne_1,'new answers');
});

test('rich result reading has separate evidence and practical sections without inventing unselected preferences',()=>{
 const answers=SCENES.map(q=>{const choices=q.choices.map((c,i)=>({c,i})).filter(({c})=>!c.rejects.length&&c.signals.some(s=>['lead','giveCare'].includes(s))).slice(0,q.single?1:2);return choices.length?choices.reduce((mask,{i})=>mask|1<<i,0):null;});
 const p=diagnose(answers),reading=resultReading({...p,note:'PRIVATE-NOTE',persona:{age:'PRIVATE-AGE'}});
 assert.equal(reading.sections.length,6);assert.ok(reading.sections.reduce((n,s)=>n+s.paragraphs.join('').length,0)>=1200);
 assert.ok(reading.sections[0].evidence.every(e=>p.evidence.some(item=>item.id===e.id)));
 assert.match(reading.sections[0].paragraphs.join(''),/回答済み\d+場面のうち\d+場面/);
 assert.doesNotMatch(reading.sections.find(s=>s.id==='conditions').paragraphs.join(''),/受け取る側で過ごす|自分の余裕がほどける/);
 assert.doesNotMatch(JSON.stringify(reading),/PRIVATE-NOTE|PRIVATE-AGE/);
 const card=publicCard(p);assert.ok(validCard(card));assert.equal(card.reading,undefined);assert.equal(card.dossier,undefined);
});
test('sparse or ambiguous answers keep uncertainty instead of generating a long confident reading',()=>{
 const p=diagnose(emptyAnswers()),reading=resultReading(p);
 assert.equal(reading.sections.length,2);assert.match(reading.lead,/絞りきれません/);
 assert.ok(!reading.sections.some(s=>s.id==='conditions'));assert.match(reading.sections[0].paragraphs.join(''),/関心がないとは言い切れません/);
});
test('all 40 titles have distinct safe artwork while legacy cards retain their original valid art',async()=>{
 assert.equal(Object.keys(TITLE_ART).length,40);assert.equal(new Set(Object.values(TITLE_ART)).size,40);assert.equal(ART_VERSION,1);
 for(const [title,key]of Object.entries(TITLE_ART)){
  assert.equal(preferredArt({title}),key);assert.ok(ART_KEYS.includes(key));assert.equal(artSource(key),'/art/'+key+'.webp');
  const svg=await readFile(new URL('../tools/artwork/'+key+'.svg',import.meta.url),'utf8');assert.match(svg,/<svg/);assert.doesNotMatch(svg,/<script|foreignObject|(?:href|src)=/i);
 }
 for(const key of ['key','mirror','ribbon','voice'])assert.equal(artSource(key),'/art/'+key+'.webp');
 assert.equal(artSource('../private'),'/art/key.webp');
});

test('a receipt cannot restore a superseded new-diagnosis choice or regress a final publication revision',()=>{
 const pending=rememberPublicationChoice({scope:'one'},true,1,true),meta={enabled:true,scope:'one',latest:true},receipt={revision:2};
 assert.equal(publicationReceiptApplies(pending,{revision:1},receipt,meta),true);
 assert.equal(publicationReceiptApplies(rememberPublicationChoice(pending,false,1),{revision:1},receipt,meta),false);
 assert.equal(publicationReceiptApplies(pending,{revision:3},receipt,meta),false);
 assert.equal(publicationReceiptApplies(pending,{revision:1},receipt,{...meta,scope:'two'}),false);
 assert.equal(publicationReceiptApplies(pending,{revision:1},receipt,{...meta,latest:false}),false);
});
