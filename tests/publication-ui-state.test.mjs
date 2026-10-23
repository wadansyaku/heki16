import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {CHOICE_POLICY,rememberPublicationChoice,reconcilePublicationChoice,REQUIRED_ENTRY_POLICY,requiredPublicationPending,missingEntryAgreement} from '../src/consent.mjs';
import {COPY} from '../src/copy.mjs';
import {reconcileVault,clearVaults} from '../src/vault.mjs';

// Run the actual app functions against delayed I/O, without loading the browser
// application or reproducing its state-transition implementation in this test.
const app = fs.readFileSync(new URL('../src/app.mjs', import.meta.url), 'utf8').split('\n');
function functionSource(name) {
  const start = app.findIndex(line => new RegExp(`^(?:async )?function ${name}\\(`).test(line));
  assert.ok(start >= 0, `Missing app function: ${name}`);
  if (app[start].trimEnd().endsWith('}')) return app[start];
  const end = app.findIndex((line, index) => index > start && line === '}');
  assert.ok(end > start, `Missing function boundary: ${name}`);
  return app.slice(start, end + 1).join('\n');
}
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return {promise, resolve}; };

test('share creation cannot adopt a URL returned after an account or card change',async()=>{
 const response=deferred(),entered=deferred(),card={title:'Synthetic',tags:['public'],art:'key'};let calls=0;
 const context=vm.createContext({epoch:1,shareCard:card,shareNameOnly:true,shareUrl:'',state:{draft:{id:'one',consent:true,synced:true}},sample:false,shared:null,structuredClone,
  activeShareNote:()=>'',syncDraft:async()=>{},api:async()=>{calls++;entered.resolve();return response.promise;},measure:()=>{},shareActions:()=>assert.fail('stale share cannot appear')});
 vm.runInContext(functionSource('makeLink'),context);const pending=context.makeLink(false);await entered.promise;assert.equal(calls,1);
 context.epoch++;response.resolve({url:'https://kuseiro.com/s/abcdefghijklmnop'});await assert.rejects(pending,/共有する内容が変わりました/);assert.equal(context.shareUrl,'');
});
test('account change during draft sync prevents the share request itself',async()=>{
 const sync=deferred();let requests=0;const context=vm.createContext({epoch:1,shareCard:{title:'Synthetic',tags:[],art:'key'},shareNameOnly:false,shareUrl:'',state:{draft:{id:'one',consent:true,synced:true}},sample:false,shared:null,structuredClone,
  activeShareNote:()=>'',syncDraft:()=>sync.promise,api:async()=>{requests++;},measure:()=>{},shareActions:()=>{}});
 vm.runInContext(functionSource('makeLink'),context);const pending=context.makeLink();context.epoch++;sync.resolve();await assert.rejects(pending,/共有する内容が変わりました/);assert.equal(requests,0);
});

test('direct X handoff counts opening only for own successful handoffs, not a blocked composer',async()=>{
 const measured=[],button={innerHTML:'X',isConnected:true,setAttribute(){},removeAttribute(){}},card={title:'Synthetic',tags:[],art:'key'};
 const context=vm.createContext({epoch:1,sample:false,shared:null,state:{draft:{id:'one',complete:true,consent:true}},activeProfile:()=>({}),ownCard:()=>card,requiredPublicationPending:()=>false,
  $:()=>button,handoffToX:async()=>({opened:true,cancelled:false}),measure:e=>measured.push(e),shareActions:()=>{},window:{},location:{assign(){}},xIntentUrl:()=>'',makeLink:async()=>{}});
 vm.runInContext(functionSource('shareToX'),context);await context.shareToX();assert.deepEqual(measured,['share_open','x_open']);
 context.handoffToX=async()=>({opened:false,cancelled:false});await context.shareToX();assert.equal(measured.filter(e=>e==='x_open').length,1);
 context.shared={};await context.shareToX();assert.equal(measured.filter(e=>e==='share_open').length,2);
});

function harness(api) {
  const calls = {chosen: [], cancelled: 0, saved: 0};
  const localStorage = {nocturne_1: 'synthetic private fixture'};
  Object.defineProperties(localStorage, {
    getItem: {value: key => localStorage[key] ?? null},
    setItem: {value: (key, value) => { localStorage[key] = value; }},
    removeItem: {value: key => { delete localStorage[key]; }}
  });
  const context = vm.createContext({
    epoch: 0, state: rememberPublicationChoice({v: 1, scope: 'a', draft: null, localRecords: [], tags: [], note: ''}, true, 5),
    owner: {signedIn: false, records: [], mutual: []}, config: {localTest: false},
    settleBrowserLogout:async()=>true, api, rememberPublicationChoice, reconcilePublicationChoice, reconcileVault, clearVaults, localStorage,
    publicationWriter: {choose: async enabled => { calls.chosen.push(enabled); return {status: 'saved'}; }, cancel: () => { calls.cancelled++; }},
    save: () => { calls.saved++; }, say: () => {}, prepareState: async () => {}, render: () => {}, syncDraft: async () => {}, loadListings: async () => {},
    forgetPromotionConsent: () => {}, syncController: new AbortController(), syncing: true, syncAgain: true, tokenPromise: Promise.resolve('synthetic'),
    shared: null, sample: false, listingItems: [], candidateIndex: 0, filters: {}, loadedListing: false, listingError: '', listingNext: null,
    location: {pathname: '/', hash: '#home'}, INSTRUMENT: 'nocturne24-4'
  });
  vm.runInContext(['savePublicationChoice','refreshOwner','clearLocal','init'].map(functionSource).join('\n'), context, {filename: 'src/app.mjs (actual state functions)'});
  return {context, calls};
}

test('known-scope off chosen before authentication returns survives refresh and is queued by actual init', async () => {
  const account = deferred(), requested = deferred();
  const {context, calls} = harness(async route => {
    if (route === '/api/config') return {localTest: true};
    assert.equal(route, '/api/account'); requested.resolve(); return account.promise;
  });
  const boot = context.init(); await requested.promise;
  await context.savePublicationChoice(false);
  assert.equal(context.state.publicationPreference, false);
  assert.equal(context.state.publicationChoice.pending, true);
  assert.equal(calls.chosen.length, 0);
  account.resolve({signedIn: true, scope: 'a', records: [], mutual: [], listing: null, publication: {preference: true, revision: 6, choicePolicy: CHOICE_POLICY}});
  await boot;
  assert.equal(context.state.publicationPreference, false);
  assert.equal(context.state.publicationChoice.pending, true);
  assert.deepEqual(calls.chosen, [false]);
});

test('actual clearLocal invalidates an account response already in flight and cancels pending writes', async () => {
  const account = deferred();
  const {context, calls} = harness(async route => { assert.equal(route, '/api/account'); return account.promise; });
  context.owner = {signedIn: true, scope: 'a', records: [], mutual: [], publication: {revision: 2}};
  const controller = context.syncController;
  const pending = context.refreshOwner();
  context.clearLocal();
  assert.equal(context.epoch, 1); assert.equal(controller.signal.aborted, true); assert.equal(calls.cancelled, 1);
  account.resolve({signedIn: true, scope: 'a', records: [{id: 'synthetic-old-private-record'}], mutual: [], listing: {status: 'live'}, publication: {preference: true, revision: 1, choicePolicy: CHOICE_POLICY}});
  await pending;
  assert.equal(context.owner.signedIn, false); assert.equal(context.owner.records.length, 0);
  assert.equal(context.state.scope, undefined); assert.equal(context.state.draft, null);
  assert.equal(context.syncing, false); assert.equal(context.syncAgain, false); assert.equal(context.tokenPromise, null);
});

test('an account GET predating a final withdrawal cannot restore its listing or mutual state',async()=>{
 const account=deferred(),{context}=harness(async()=>account.promise);
 context.owner={signedIn:true,scope:'a',records:[],mutual:[],listing:null,publication:{revision:3,preference:false,choicePolicy:CHOICE_POLICY}};
 const pending=context.refreshOwner();
 account.resolve({signedIn:true,scope:'a',records:[],mutual:[{id:'old-match'}],listing:{status:'live'},publication:{revision:2,preference:true,choicePolicy:CHOICE_POLICY}});
 await pending;
 assert.equal(context.owner.publication.revision,3);assert.equal(context.owner.publication.preference,false);
 assert.equal(context.owner.listing,null);assert.equal(context.owner.mutual.length,0);
});

test('the actual start screen removes the requested explanatory copy and leaves all agreements explicit',()=>{
 let body='';const context=vm.createContext({state:{draft:null},COPY,PROFILE_OPTIONS:{gender:{},age:{},mood:{}},Object,
  accrue:()=>{},measure:()=>{},select:()=>'',esc:x=>x,btn:()=>'',icon:()=>'',modal:(_title,html)=>{body=html;}});
 vm.runInContext(functionSource('journeyMarkup')+'\n'+functionSource('start'),context);context.start();
 for(const phrase of ['日頃よく惹かれる傾向','合意ある成人同士','個別の回答一覧','掲載は任意です','提供しない場合も','timeframe-hint'])assert.ok(!body.includes(phrase),phrase);
 assert.equal((body.match(/ required/g)||[]).length,2);assert.ok(!/<input\b(?=[^>]*type="checkbox")[^>]*\bchecked\b/.test(body));assert.ok(!body.includes('18歳以上です'));
});
test('actual diagnosis start requires prior site eligibility, contribution and publication acceptance',()=>{
 const fields=Object.fromEntries(['contribute','start-publication','gender','age','mood','start-error'].map(id=>[id,{attributes:{},setAttribute(k,v){this.attributes[k]=v;},removeAttribute(k){delete this.attributes[k];},checked:false,value:{gender:'diverse',age:'20-24',mood:'ordinary'}[id]||'',focus(){this.focused=true;}}]));
 let syncs=0;const context=vm.createContext({eligibilityReady:()=>true,$:selector=>fields[selector.slice(1)],PROFILE_OPTIONS:{},firstMissingChoice:()=>null,
  missingEntryAgreement,rememberPublicationChoice,REQUIRED_ENTRY_POLICY,CHOICE_POLICY,CONSENT:'consent',INSTRUMENT:'nocturne24-4',
  state:{v:1,draft:null},owner:{signedIn:false},crypto:{randomUUID:()=> 'synthetic-record'},emptyAnswers:()=>Array(24).fill(null),
  document:{querySelector:()=>({value:'recent'}),querySelectorAll:()=>Object.values(fields).filter(f=>f.attributes['aria-invalid'])},timeBand:()=> 'night',shared:null,sample:false,publicationWriter:{choose:async()=>{}},
  save:()=>{},close:()=>{},navigate:()=>{},measure:()=>{},syncDraft:async()=>{syncs++;}});
 vm.runInContext(functionSource('confirmStart'),context);
 context.confirmStart();assert.equal(context.state.draft,null);assert.equal(fields.contribute.focused,true);
 assert.equal(fields.contribute.attributes['aria-describedby'],'start-error');
 fields.contribute.checked=true;context.confirmStart();assert.equal(context.state.draft,null);assert.equal(fields['start-publication'].focused,true);
 fields['start-publication'].checked=true;context.confirmStart();
 assert.equal(fields.contribute.attributes['aria-invalid'],undefined);assert.equal(fields['start-publication'].attributes['aria-invalid'],undefined);
 assert.equal(context.state.draft.consent,true);assert.equal(context.state.draft.entryPolicy,REQUIRED_ENTRY_POLICY);
 assert.equal(context.state.publicationPreference,true);assert.equal(syncs,1);
});
test('actual result, sharing and discovery routes retain the publication gate until the current record is published',async()=>{
 let navigated='',renders=0;
 const context=vm.createContext({state:{draft:{complete:true,entryPolicy:REQUIRED_ENTRY_POLICY,firstPublishedAt:null}},sample:false,shared:null,
  requiredPublicationPending,activeProfile:()=>({}),requiredPublicationGate:()=> 'publication-gate',close:()=>{},navigate:route=>{navigated=route;},render:()=>{renders++;}});
 vm.runInContext(['result','find','openShare','shareToX','loadListings'].map(functionSource).join('\n'),context);
 assert.equal(context.result(),'publication-gate');assert.equal(context.find(),'publication-gate');context.openShare();
 assert.equal(navigated,'profile');assert.equal(renders,1);await context.loadListings();assert.equal(renders,1);
 assert.equal(requiredPublicationPending({...context.state.draft,firstPublishedAt:Date.now()}),false);
 assert.equal(requiredPublicationPending({complete:true,entryPolicy:null}),false);
});

test('home prioritizes the current result or required publication without replacing the draft',()=>{
 const context=vm.createContext({state:{draft:null},requiredPublicationPending,diagnose:()=>({title:'見本'}),exampleAnswers:[],preferredArt:()=> 'key',artSource:key=>'/art/'+key+'.webp',esc:x=>x,icon:()=>'',text:x=>x,btn:(label,action,style)=>`<button class="${style}" data-action="${action}">${label}</button>`});
 vm.runInContext(functionSource('home'),context);
 assert.match(context.home(),/class="primary" data-action="start"/);
 assert.doesNotMatch(context.home(),/data-action="sample"|結果の見本|home-preview/);
 context.state.draft={id:'partial',complete:false};assert.match(context.home(),/class="primary" data-action="resume"/);
 const draft={id:'complete',complete:true,entryPolicy:REQUIRED_ENTRY_POLICY,firstPublishedAt:null};context.state.draft=draft;
 assert.match(context.home(),/class="primary" data-action="required-publication"/);assert.equal(context.state.draft,draft);
 draft.firstPublishedAt=1;assert.match(context.home(),/class="primary" data-action="own-result"/);assert.match(context.home(),/新しく診断する/);assert.equal(context.state.draft,draft);
 assert.doesNotMatch(context.home(),/data-action="sample"|結果の見本|home-preview/);
});
test('starting from a sample cannot silently replace answered progress',()=>{
 let title='',html='';const draft={complete:false,answers:[1,null]},context=vm.createContext({state:{draft},accrue:()=>{},measure:()=>{},btn:(label,action)=>`${action}:${label}`,modal:(t,b)=>{title=t;html=b;}});
 vm.runInContext(functionSource('start'),context);context.start('now');
 assert.equal(title,'途中の診断があります。');assert.match(html,/resume:続きから答える/);assert.match(html,/restart:新しく答え直す/);assert.equal(context.state.draft,draft);
});
test('skip link moves focus to content without changing the diagnosis route',()=>{
 let prevented=0,focused=0;const location={hash:'#quiz'},context=vm.createContext({location,$:selector=>{assert.equal(selector,'#main');return {focus:()=>focused++};}});
 vm.runInContext(functionSource('skipToContent'),context);
 assert.equal(context.skipToContent({target:{closest:()=>null}}),false);
 assert.equal(context.skipToContent({target:{closest:s=>s==='a.skip[href="#main"]'},preventDefault:()=>prevented++}),true);
 assert.equal(location.hash,'#quiz');assert.equal(prevented,1);assert.equal(focused,1);
});

test('the share entry immediately delegates to X without opening settings or a modal',async()=>{
 let calls=0;const context=vm.createContext({shareToX:async()=>{calls++;return 'opened';},modal:()=>assert.fail('No intermediate screen')});
 vm.runInContext(functionSource('openShare'),context);assert.equal(await context.openShare(),'opened');assert.equal(calls,1);
 const source=app.join('\n');assert.doesNotMatch(source,/id="share-name-only"|data-action="make-link"|data-action="save-image"|compareModal\(/);
});

function canvasContext(){
 const paints=[],ctx={font:'16px sans-serif',textAlign:'left',fillStyle:'',clearRect(){},fillRect(){},drawImage(){},strokeRect(){},
  createLinearGradient:()=>({addColorStop(){}}),measureText(value){const size=Number(this.font.match(/([\d.]+)px/)?.[1]||16);return {width:[...value].reduce((n,c)=>n+size*(c.charCodeAt(0)>127?1:.6),0)};},
  fillText(value,x,y){paints.push({value,x,y,size:Number(this.font.match(/([\d.]+)px/)?.[1]||16),width:this.measureText(value).width,align:this.textAlign});}};
 return {paints,canvas:{dataset:{},getContext:()=>ctx}};
}
test('share image retains maximum-length public text inside separate readable areas',async()=>{
 const {canvas,paints}=canvasContext(),card={title:'名'.repeat(64),quote:'言'.repeat(120),summary:'文'.repeat(240),tags:['甲'.repeat(24),'乙'.repeat(24),'丙'.repeat(24)],art:'key'};
 const context=vm.createContext({loadArt:async()=>null,publicTraits:()=> 'Public trait'});
 vm.runInContext(functionSource('drawCard'),context);await context.drawCard(card,canvas);
 for(const [text,y,end] of [[card.title,108,250],[card.quote,264,352],[card.summary,370,500]]){
  const rows=paints.filter(p=>p.y>=y&&p.y<end);assert.equal(rows.map(p=>p.value).join(''),text);
  assert.ok(rows.every(p=>p.x===460&&p.x+p.width<=1140&&p.y+p.size<=end));
 }
 assert.equal(paints.filter(p=>p.y>=548&&p.y<575&&p.x===460).map(p=>p.value).join(''),card.tags.map(t=>'#'+t).join('  '));
});
test('an obsolete image load cannot paint over a changed share preview',async()=>{
 const image=deferred(),{canvas,paints}=canvasContext(),context=vm.createContext({loadArt:()=>image.promise,publicTraits:()=>''});
 vm.runInContext(functionSource('drawCard'),context);const pending=context.drawCard({title:'Old',art:'key'},canvas);canvas.dataset.card='changed';image.resolve(null);await pending;
 assert.equal(paints.length,0);
});

test('publication uses the current server preview after a public-attribute change',async()=>{
 const first=deferred(),second=deferred(),requests=[],button={disabled:true},cardNode={innerHTML:''},age={value:'unset'},gender={value:'unset'};
 const nodes={'#publish-age':age,'#publish-gender':gender,'#listing-intent':{value:'any'},'#publication-card':cardNode,'[data-action=publish]':button,'#publish-error':{textContent:''}};
 const record={id:'own-record',profile:{},persona:{age:'30-34',gender:'diverse'}},context=vm.createContext({publicationPreviewSeq:0,publicationPreview:null,owner:{records:[record]},
  $:selector=>nodes[selector],currentArt:()=> 'key',cardMarkup:(card,attributes)=>JSON.stringify({card,attributes}),COPY,
  api:(_route,body)=>{requests.push(body);return requests.length===1?first.promise:second.promise;}});
 vm.runInContext(functionSource('preparePublication'),context);const old=context.preparePublication(record.id);age.value='30-34';const latest=context.preparePublication(record.id);
 assert.equal(button.disabled,true);assert.equal(requests[0].showAge,false);assert.equal(requests[0].showGender,false);assert.equal(requests[1].showAge,true);
 second.resolve({card:{title:'Current'},age:'30-34',gender:'unset',digest:'current-digest'});await latest;
 first.resolve({card:{title:'Old'},age:'unset',gender:'unset',digest:'old-digest'});await old;
 assert.equal(context.publicationPreview.digest,'current-digest');assert.match(cardNode.innerHTML,/Current/);assert.doesNotMatch(cardNode.innerHTML,/Old/);assert.equal(button.disabled,false);
});

test('download attaches an anchor, preserves its object URL until the browser receives it, then cleans up',()=>{
 const calls=[],link={click(){calls.push('click');},remove(){calls.push('remove');}};let cleanup;
 const context=vm.createContext({URL:{createObjectURL:blob=>{assert.equal(blob.type,'image/png');return 'blob:synthetic';},revokeObjectURL:url=>calls.push(url)},
  document:{createElement:tag=>{assert.equal(tag,'a');return link;},body:{append:value=>{assert.equal(value,link);calls.push('append');}}},setTimeout:(callback,ms)=>{assert.equal(ms,60000);cleanup=callback;}});
 vm.runInContext(functionSource('download'),context);assert.throws(()=>context.download(null,'bad.png'),/ファイルを作成できません/);context.download({type:'image/png'},'synthetic.png');
 assert.equal(link.download,'synthetic.png');assert.equal(link.href,'blob:synthetic');assert.deepEqual(calls,['append','click','remove']);cleanup();assert.equal(calls.at(-1),'blob:synthetic');
});

test('actual browser-only reset cancels writes and rejects an already pending owner response',async()=>{
 const response=deferred(),requested=deferred(),{context,calls}=harness(async()=>{requested.resolve();return response.promise;});let measured=0;
 Object.assign(context,{entered:10,shareUrl:'old',shareCard:{},shareReadyRecord:'old',publicationPreview:{},cleanupPlan:{},lastCleanupNonce:null,clearBrowserMeasurements:()=>{measured++;},state:{v:1,scope:'a',draft:{id:'old'}},owner:{signedIn:true,scope:'a',records:[]}});
 vm.runInContext(functionSource('resetBrowserMemory'),context);const request=context.refreshOwner();await requested.promise;
 context.resetBrowserMemory({v:1,scope:null,draft:null,localRecords:[],tags:[],note:''},'local-notice');response.resolve({signedIn:true,scope:'a',records:[{id:'old'}]});await request;
 assert.equal(context.owner.signedIn,false);assert.equal(context.state.draft,null);assert.equal(context.state.scope,null);assert.equal(context.shareUrl,'');assert.equal(context.shareCard,null);assert.equal(context.entered,0);assert.equal(calls.cancelled,1);assert.equal(measured,1);assert.equal(context.lastCleanupNonce,'local-notice');
});

test('an API write paused at logout cannot send the old payload after a browser cleanup',async()=>{
 const logout=deferred();let sent=0;const context=vm.createContext({epoch:1,settleBrowserLogout:()=>logout.promise,errors:{sign_in:'changed'},fetch:async()=>{sent++;return {ok:true,json:async()=>({})};}});
 vm.runInContext(functionSource('api'),context);const request=context.api('/api/complete',{id:'old'});context.epoch++;logout.resolve(true);await assert.rejects(request,/changed/);assert.equal(sent,0);
});
