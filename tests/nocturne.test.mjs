import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENES,FACETS,emptyAnswers,validAnswers,diagnose,publicCard,listingCard,validCard,compare,sceneText,choiceLabel} from '../src/nocturne.mjs';
import {reconcileVault,clearVaults,preserveInstrument} from '../src/vault.mjs';
import {scenario} from './fixtures/nocturne-scenarios.mjs';
test('one compact set uses content choices, with no ordinal degree labels',()=>{assert.equal(SCENES.length,24);for(const q of SCENES){assert.equal(q.choices.length,5);assert.ok(q.text.length<=95);for(const c of q.choices){assert.ok(c.label.length<=68);assert.equal(c.degree,undefined);}}for(const f of FACETS)assert.ok(SCENES.filter(q=>q.choices.some(c=>c.signals.includes(f.id))).length>=2,f.id);});
test('single self-image, at most two desires, and undecided boundaries stay distinct',()=>{const a=emptyAnswers();assert.ok(validAnswers(a));for(const [i,value] of [[0,3],[1,7],[21,17],[3,32]]){const b=[...a];b[i]=value;assert.equal(validAnswers(b),false);}a[1]=17;assert.ok(validAnswers(a));a[21]=16;assert.ok(validAnswers(a));});
test('unanswered is unknown, and an unselected alternative is not called a dislike',()=>{const p=diagnose(emptyAnswers());assert.ok(p.facets.every(f=>f.level==='まだわからない'));const a=emptyAnswers();a[1]=16;const q=diagnose(a);assert.equal(q.facets.find(f=>f.id==='lead').level,'今回は選ばなかった');assert.ok(q.facets.every(f=>!/苦手|嫌い/.test(f.level)));});
test('leading and caring for the partner do not manufacture receiving or S/M',()=>{const p=diagnose(scenario(['lead','giveCare']));assert.equal(p.title,'溺愛の飼い主');assert.ok(!/甘やかされ|従いたい|奪われ/.test(p.summary));assert.equal(p.signals.masochism||0,0);assert.equal(p.signals.sadism||0,0);});
test('leading and being teased coexist, and voice supplies the specific name',()=>{const p=diagnose(scenario(['lead','masochism','voice'],1));assert.equal(p.title,'囁きで落ちる司令塔');assert.match(p.gap,/任せるつもり/);assert.ok(p.evidence.length>=2);});
test('S and M are independently selectable without a forced midpoint',()=>{const p=diagnose(scenario(['sadism','masochism']));assert.ok(p.signals.sadism>=2);assert.ok(p.signals.masochism>=2);assert.equal(p.title,'余裕泥棒の、負けず嫌い');});
test('giving restraint does not manufacture receiving restraint',()=>{const a=emptyAnswers();a[15]=1;a[19]=4;const p=diagnose(a);assert.equal(p.signals.restraintGive,2);assert.equal(p.signals.restraintReceive,undefined);});
test('one chosen cue cannot decide the whole result',()=>{const a=emptyAnswers();a[12]=1;const p=diagnose(a);assert.ok(!/声に弱い収集家|司令塔/.test(p.title));});
test('explicit boundaries neither subtract desire nor infer the other role',()=>{const a=scenario(['lead','giveCare']),before=diagnose(a);a[21]=12;const after=diagnose(a);assert.equal(before.title,after.title);assert.deepEqual(after.boundaries,['生活までの束縛は望まない','役を決めつけないで']);});

test('public card excludes raw answers, demographics, history and boundary choices',()=>{const p=diagnose(scenario(['lead','giveCare'])),card=publicCard(p,['声に弱い'],'');assert.ok(validCard(card));assert.deepEqual(Object.keys(card).sort(),['v','instrument','title','quote','summary','tags','traits'].sort());assert.equal(card.answers,undefined);assert.equal(card.boundaries,undefined);assert.equal(validCard({...card,answers:[]}),false);assert.equal(validCard({...card,title:'<script>'}),false);assert.equal(validCard({...card,tags:Array(4).fill('x')}),false);});
test('comparison gives concrete discussion points, without a match success percentage',()=>{const a=publicCard(diagnose(scenario(['lead','giveCare']))),b=publicCard(diagnose(scenario(['yield','receiveCare'])));const lines=compare(a,b);assert.ok(lines.some(l=>/任せたい側|甘えたい側/.test(l.title)));assert.ok(!/%|成功率|相性スコア/.test(JSON.stringify(lines)));});
test('account switch separates private histories and words, and switching back restores the original vault',()=>{const storage={getItem(k){return this[k]||null;},setItem(k,v){this[k]=v;},removeItem(k){delete this[k];}},a={v:1,scope:'account-a',draft:{id:'a-record'},localRecords:[{id:'a-record'}],tags:[{label:'private-a'}],note:'private-a-note'};const b=reconcileVault(a,'account-b',[],storage);assert.deepEqual(b.localRecords,[]);assert.deepEqual(b.tags,[]);assert.equal(b.note,'');assert.equal(b.draft,null);b.note='private-b-note';const restored=reconcileVault(b,'account-a',['a-record'],storage);assert.deepEqual(restored,a);storage.unrelated='keep';clearVaults(storage);assert.equal(storage['nocturne_1:account-a'],undefined);assert.equal(storage['nocturne_1:account-b'],undefined);assert.equal(storage.unrelated,'keep');});
test('an unscoped local record is adopted only when that record belongs to the signed-in account',()=>{const storage={getItem:()=>null,setItem:()=>{}},local={v:1,draft:{id:'a'},localRecords:[],tags:[{label:'private'}],note:''};assert.equal(reconcileVault(local,'account-a',['a'],storage).draft.id,'a');assert.equal(reconcileVault(local,'account-b',['b'],storage).draft,null);});
test('comparison does not repeat the same shared leading role as a second discovery',()=>{const a={traits:['lead']};const result=compare(a,a);assert.equal(result.length,1);assert.match(result[0].title,/二人とも/);});
test('anonymous publication exposes only the previewed name, quote and three preferences',()=>{const profile=diagnose(scenario(['lead','masochism','voice','giveCare','receiveCare'])),card=listingCard(profile);assert.ok(validCard(card));assert.equal(card.summary,'');assert.ok(card.traits.length<=3);assert.deepEqual(card.tags,card.traits.map(id=>FACETS.find(f=>f.id===id).label));assert.equal(card.evidence,undefined);assert.equal(card.signals,undefined);});

test('each desire needs independent scenes; two options in one scene do not manufacture repetition',()=>{
  for(const q of SCENES)for(let i=0;i<5;i++){const a=emptyAnswers();a[q.id]=1<<i;assert.ok(diagnose(a).facets.every(f=>!f.strong),q.id+':'+i);}
  const a=emptyAnswers();a[10]=3;assert.equal(diagnose(a).signals.painGive,1);assert.equal(diagnose(a).signals.painReceive,1);
});
test('none, unknown, and every explicit boundary remain distinguishable',()=>{
  const a=emptyAnswers();a[7]=0;assert.ok(validAnswers(a));assert.equal(diagnose(a).answered,1);assert.equal(diagnose(a).facets.find(f=>f.id==='scent').level,'今回は選ばなかった');
  a[7]=null;assert.equal(diagnose(a).facets.find(f=>f.id==='scent').level,'まだわからない');a[21]=15;assert.ok(validAnswers(a));assert.equal(diagnose(a).boundaries.length,4);a[21]=31;assert.equal(validAnswers(a),false);
  const none=Array(24).fill(0);assert.equal(diagnose(none).title,'選択肢の外にいる自由人');assert.ok(diagnose(none).facets.every(f=>!f.strong));
});
test('scent and touch receive their own language instead of being erased by a preference for space',()=>{
  const a=emptyAnswers();a[7]=6;a[13]=8;a[14]=6;a[6]=4;a[9]=16;
  const p=diagnose(a);assert.ok(p.focus.includes('scent')||p.focus.includes('touch'));assert.ok(p.tags.includes('香りに惹かれる'));assert.ok(p.tags.includes('触れ合いに惹かれる'));assert.ok(p.evidence.some(e=>e.id===7||e.id===14));
});
test('pain, teasing, leadership and the direction of restraint are independent',()=>{
  const a=emptyAnswers();a[10]=2;a[19]=2;const p=diagnose(a);assert.equal(p.title,'刺激待ちの冒険家');assert.equal(p.signals.masochism,undefined);assert.equal(p.signals.yield,undefined);assert.equal(p.signals.painGive,undefined);
  const b=emptyAnswers();b[5]=1;assert.equal(diagnose(b).signals.restraintGive,undefined);b[13]=4;assert.equal(diagnose(b).signals.restraintReceive,undefined);
});
test('a specific nickname cannot claim praise or dishevelled clothing without those actual choices',()=>{
  const a=emptyAnswers();a[7]=8;a[13]=2;a[14]=8;assert.equal(diagnose(a).title,'装いの観察者');
  const b=emptyAnswers();b[2]=4;b[11]=1;b[23]=1;assert.notEqual(diagnose(b).title,'褒めでほどける甘党');
});
test('the displayed witnesses cover the desires named by a compound result',()=>{
  const p=diagnose(scenario(['lead','masochism','voice'],1)),witnesses=p.evidence.slice(0,2);
  for(const signal of p.focus)assert.ok(witnesses.some(e=>bitsForTest(e.id).includes(signal)),signal);
  function bitsForTest(id){const a=scenario(['lead','masochism','voice'],1)[id];return SCENES[id].choices.flatMap((c,i)=>a&(1<<i)?c.signals:[]);}
});
test('completed historical results are frozen while unfinished answers are retained without reinterpretation',()=>{
  const profile={instrument:'nocturne24-1',title:'当時の名前'},d={id:'old',complete:true,answers:Array(24).fill(1)},state={v:1,draft:d,localRecords:[{id:'old',profile}],tags:[{label:'残す'}]};
  const result=preserveInstrument(state,'nocturne24-2');assert.equal(result.draft.profile,profile);assert.equal(result.draft.instrument,'nocturne24-1');
  const unfinished=preserveInstrument({...state,draft:{...d,complete:false},localRecords:[]},'nocturne24-2');assert.equal(unfinished.draft,null);assert.deepEqual(unfinished.pausedDrafts[0].answers,d.answers);assert.deepEqual(unfinished.tags,state.tags);
});
test('a fresh anonymous trial after expiry archives the previous account instead of mixing its private words',()=>{
  const storage={getItem(k){return this[k]||null;},setItem(k,v){this[k]=v;}},old={v:1,scope:'old-account',draft:{id:'old'},localRecords:[],tags:[{label:'private-old'}],note:'keep-private'};
  storage['nocturne_1:local']=JSON.stringify({v:1,scope:null,localRecords:[],tags:[{label:'private-before-login'}],note:'private-before-login'});const fresh=reconcileVault(old,null,[],storage);assert.equal(fresh.scope,null);assert.deepEqual(fresh.tags,[]);assert.equal(fresh.draft,null);assert.equal(JSON.parse(storage['nocturne_1:old-account']).note,'keep-private');
});
test('a name built from three separate desires retains a witness for every part',()=>{const a=emptyAnswers();for(const [id,value] of [[1,1],[5,1],[4,1],[17,2],[7,1],[14,1]])a[id]=value;const p=diagnose(a);assert.equal(p.title,'囁きで落ちる司令塔');assert.equal(p.evidence.length,3);for(const ids of [[1,5],[4,17],[7,14]])assert.ok(p.evidence.some(e=>ids.includes(e.id)));});
test('questions describe the same desires without inferring preferences from gender',()=>{
  for(const q of SCENES){
    assert.equal(sceneText(q,'woman'),sceneText(q,'man'));
    for(const c of q.choices)assert.equal(choiceLabel(c,'woman'),choiceLabel(c,'man'));
  }
  const lead=scenario(['lead','yield']);lead[0]=1;
  assert.match(diagnose(lead).gap,/手綱を預ける/);
  const contrast=scenario(['masochism','receiveCare'],4);
  assert.match(diagnose(contrast).gap,/最後は甘やかして/);
  const painless=scenario(['restraintReceive'],4);painless[21]=1;
  assert.match(diagnose(painless).gap,/痛みまで/);
});
