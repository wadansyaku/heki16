// Frozen H5 reader. It never contains or offers a previous questionnaire.
import {organizeTags,GROUPS} from './tags.mjs';
const {DIMENSIONS,TYPES,AXES}={"DIMENSIONS":[{"id":"lead","label":"主導したい","items":[0,32,37],"description":"二人の流れやルールを、自分が決めたい。"},{"id":"yield","label":"委ねたい","items":[1,29,38],"description":"信頼する相手に、判断や主導権を預けたい。"},{"id":"sadism","label":"Sのスイッチ","items":[2,4,32],"description":"照れた反応を引き出し、相手の余裕を崩したい。"},{"id":"masochism","label":"Mのスイッチ","items":[5,26,33],"description":"言葉や駆け引きで、自分の余裕を奪われたい。"},{"id":"wet","label":"重愛・共依存","items":[8,10,12],"description":"二人だけの、濃く特別な関係に浸りたい。"},{"id":"cool","label":"クール・余白","items":[11,13,14],"description":"自分の余白と、二人きりの熱量を両方持ちたい。"},{"id":"narrative","label":"文脈・ギャップ","items":[16,18,23,34],"description":"関係の積み重ねや、いつもと違う顔が刺さる。"},{"id":"aesthetic","label":"五感・属性","items":[17,19,20,22,27],"description":"声、指先、装い。感覚のディテールに弱い。"},{"id":"extreme","label":"背徳・スリル","items":[21,24,26],"description":"秘密や大胆な一面、張りつめた駆け引きを楽しみたい。"},{"id":"pamper","label":"溺愛・聖域","items":[3,25,28,29,31],"description":"全肯定と甘やかし、安心してほどける時間がほしい。"},{"id":"restraint","label":"自由を預ける演出","items":[27,37,38],"description":"リボン、目隠し、二人だけの合図。自由を制限する演出に惹かれる。","minimum":2,"branches":[[27,37],[27,38]]},{"id":"ownership","label":"独占したい","items":[9,30],"minimum":2,"description":"誰より近い場所や、他の人に見せない秘密を自分だけのものにしたい。"}],"TYPES":{"DWNX":true,"DWNP":true,"DWAX":true,"DWAP":true,"DCNX":true,"DCNP":true,"DCAX":true,"DCAP":true,"SWNX":true,"SWNP":true,"SWAX":true,"SWAP":true,"SCNX":true,"SCNP":true,"SCAX":true,"SCAP":true},"AXES":[["lead","yield","D","S"],["wet","cool","W","C"],["narrative","aesthetic","N","A"],["extreme","pamper","X","P"]]};
const INSTRUMENT='unified40-2';
const AUX_ITEMS={giveCare:[26,29],receiveCare:[4,30],ownership:[10,31],switch:[7,16]};
const CONTEXTS={trusted:'信頼する相手にだけ',private:'二人きりでだけ',mood:'その日の気分で',fantasy:'想像の中で楽しみたい'};
const MEANINGS={reaction:'相手の反応を見るのが好き',release:'考えることを手放したい',special:'自分だけの特別がほしい',contrast:'普段との落差に弱い',senses:'声や仕草から惹かれる',care:'丸ごと甘やかされたい'};
const strong=d=>!!d&&d.n>=(d.minimum||3)&&d.high>=2&&d.score>=70;
const enough=d=>!!d&&d.n>=(d.minimum||3);
const themes={
  wet:{prefix:'共依存の',noun:'重愛の沼住人',line:'二人だけで完結する、濃い特別扱いが刺さる。'},
  cool:{prefix:'余白を守る',noun:'自由な野良猫',line:'自分の余白も、二人きりの熱量もほしい。'},
  narrative:{prefix:'ギャップに弱い',noun:'関係性の沼住人',line:'「なぜこの二人なのか」という背景まで味わいたい。'},
  aesthetic:{prefix:'五感で沼る',noun:'フェチ収集家',line:'声、仕草、装いのディテールが、好きの入口になる。'},
  extreme:{prefix:'秘密の',noun:'秘密の共犯者',line:'二人だけの秘密や、張りつめた駆け引きが刺さる。'},
  pamper:{prefix:'溺愛の',noun:'全肯定の甘党',line:'甘やかしと全肯定に、安心してほどけたい。'},
  restraint:{prefix:'合図に弱い',noun:'自由を預ける演出家',line:'二人だけの合図や、自由を制限する演出に惹かれる。'},
  ownership:{prefix:'独占の',noun:'秘密の独占家',line:'誰より近い場所も、ほかの人に見せない一面も独占したい。'}
};
function makeProfile(dims,aux,triggers,shadow,gapId=null){
  const d=Object.fromEntries(dims.map(x=>[x.id,x]));
  const ranked=dims.filter(strong).sort((a,b)=>b.score-a.score||b.high-a.high||b.n-a.n);
  const theme=ranked.find(x=>themes[x.id]),mood=theme?themes[theme.id]:null;
  const lead=strong(d.lead),yielding=strong(d.yield),s=strong(d.sadism),m=strong(d.masochism);
  let noun='',opening='',prefix=mood?.prefix||'';
  if(s&&m){noun='余裕泥棒';opening='相手の余裕は崩したい。自分の余裕も、奪われたい。';}
  else if(lead&&m){noun='翻弄されたい司令塔';opening='主導する場面も、翻弄される場面も、どちらも刺さる。';}
  else if(yielding&&s){noun=mood?'小悪魔':'委ねる小悪魔';opening='主導権は預けたい。でも、相手を照れさせる一手は欲しい。';}
  else if(shadow?.id==='ownerPet'){prefix='';noun='褒めでほどける飼い主';opening='甘やかすのが好き。自分も褒められると、案外ちょろい。';}
  else if(lead&&yielding&&aux.switch.n===2&&aux.switch.high===2){noun='攻守自在の共犯者';opening='主導するのも委ねるのも好き。役が替わる展開にも惹かれる。';}
  else if(lead&&yielding){noun='両方ほしい共犯者';opening='主導する場面も、委ねる場面も、どちらも本命。';}
  else if(lead){noun=s?(mood?'仕掛け人':'焦らしの仕掛け人'):(mood?'演出家':'二人の演出家');opening=s?'流れを握り、相手の余裕が崩れる反応を引き出したい。':'二人の流れを、自分のペースで作りたい。';}
  else if(yielding){noun=m?(mood?'陥落待ち':'翻弄されたい野良猫'):'委ねたがり';opening=m?'主導権を預けて、自分の余裕がほどける時間を味わいたい。':'主導権を預ける役に惹かれる。';}
  else if(s){noun='余裕を奪う小悪魔';opening='主導権よりも、相手の反応を引き出す駆け引きが刺さる。';}
  else if(m){noun='翻弄の沼住人';opening='自分の余裕が崩れる駆け引きに惹かれる。';}
  else if(mood){noun=mood.noun;prefix='';}
  if(!ranked.length){const any=dims.some(enough);return {title:any?'まだ名付けない、好きの余白':'まだ開いていない、性癖の引き出し',titleParts:any?['まだ名付けない、','好きの余白']:['まだ開いていない、','性癖の引き出し'],description:any?'この40の場面には、まだ強い決め手が少なめ。あなたの言葉で「好き」を足してみよう。':'答えられそうな場面から、あなたのスイッチを探してみよう。',insights:[]};}
  const insights=[];
  if(lead&&m)insights.push({id:'leadingM',title:'主導権と、崩されたい余裕',text:'流れを作りたい気持ちと、翻弄されたい気持ち。その両方がある。'});
  if(yielding&&s)insights.push({id:'yieldingS',title:'委ねても、仕掛ける一手',text:'任せる役でも、相手の照れた反応を引き出したい。'});
  if(strong(d.wet)&&strong(d.cool))insights.push({id:'wetCool',title:'距離は自由。特別は濃く。',text:strong(d.ownership)?'一人の時間はほしい。でも、特別の座は譲りたくない。':'自分の余白は残したい。二人の時間は、深くつながりたい。'});
  if(strong(d.extreme)&&strong(d.pamper))insights.push({id:'thrillCare',title:'最後は甘く、回収して',text:'張りつめた駆け引きも好き。ほどける全肯定も、同じくらい欲しい。'});
  if(strong(d.restraint)&&enough(d.masochism)&&d.masochism.score<=30)insights.push({id:'restraint',title:'演出そのものが、スイッチ',text:'自由を預ける演出は刺さる。強く翻弄される展開は、今は控えめ。'});
  if(strong(d.aesthetic)&&strong(d.narrative))insights.push({id:'bothEntrances',title:'一撃でも、積み重ねでも',text:'声や仕草に一撃で沼ることも、二人の背景ごと惹かれることもある。'});
  if(shadow&&!insights.some(x=>x.id===shadow.id))insights.unshift({id:shadow.id,title:shadow.title,text:shadow.text});
  const gap=gapId==='leadToYield'&&yielding?{id:gapId,title:'主導するつもりが、委ねる場面にも',text:'自分では「主導する側」。でも、委ねる場面にも強く惹かれていた。',shareText:'主導するつもりが、委ねる場面にも弱かった。'}:gapId==='yieldToLead'&&lead?{id:gapId,title:'委ねるつもりが、主導する場面にも',text:'自分では「委ねる側」。でも、主導する場面にも強く惹かれていた。',shareText:'委ねるつもりが、流れを握る役にも弱かった。'}:null;
  const ending=noun.match(/^(.*)(司令塔|飼い主|委ねたがり|演出家|仕掛け人|野良猫|共犯者|沼住人|小悪魔|収集家|独占家)$/);
  const titleParts=[prefix,...(ending?[ending[1],ending[2]]:[noun])].filter(Boolean);
  const roles=s&&m?['sadism','masochism']:lead&&m?['lead','masochism']:yielding&&s?['yield','sadism']:lead&&yielding?['lead','yield']:lead?['lead']:yielding?['yield']:s?['sadism']:m?['masochism']:[];
  return {title:prefix+noun,titleParts,description:[opening,mood?.line].filter(Boolean).join(''),insights:insights.slice(0,3),gap,focus:[...new Set([...(gap?[gap.id==='leadToYield'?'yield':'lead']:[]),...roles,...(theme?[theme.id]:[])])]};
}
const clean=(s,max)=>typeof s==='string'?s.normalize('NFKC').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max):'';
function normalizePersonal(value={}){
  if(!value||typeof value!=='object'||Array.isArray(value))value={};
  return {alias:clean(value.alias,32),caption:clean(value.caption,100),contexts:[...new Set(Array.isArray(value.contexts)?value.contexts:[])].filter(id=>typeof id==='string'&&Object.hasOwn(CONTEXTS,id)).slice(0,4),meaning:typeof value.meaning==='string'&&Object.hasOwn(MEANINGS,value.meaning)?value.meaning:''};
}
function personalize(result,value){
  const personal=normalizePersonal(value),parts=[...personal.contexts.map(id=>CONTEXTS[id]),MEANINGS[personal.meaning],personal.caption].filter(Boolean);
  return {...result,...(personal.alias?{title:personal.alias,titleParts:[personal.alias]}:{}),personal,personalLine:parts.join('。')};
}

const SHADOWS={
  switch:{title:'相手次第で、立場が変わる',text:'相手の出方で、飼う側にも懐く側にも回る。'},
  ownerPet:{title:'甘やかす側にも、甘える側にも',text:'甘やかすのが好き。自分も褒められると、案外ちょろい。'},
  dualSM:{title:'余裕を崩すのも、崩されるのも',text:'相手の余裕は崩したい。自分の余裕も、ちょっと奪われたい。'},
  wetCool:{title:'距離は自由。特別は独占。',text:'一人の時間はほしい。でも、特別の座は譲らない。'},
  thrillCare:{title:'濃い駆け引きの、その先',text:'駆け引きは濃く。最後は全肯定で回収したい。'},
  leadingM:{title:'主導していても、隙がある',text:'流れは自分が決めたい。でも、余裕のある相手には翻弄されたい。'},
  yieldingS:{title:'委ねたままで、仕掛けたい',text:'主導権は預けても、相手を照れさせる一手は手放さない。'}
};
function shadowOf(byId,aux){
  if(strong(byId.lead)&&strong(aux.giveCare,2)&&strong(aux.receiveCare,2))return {id:'ownerPet',...SHADOWS.ownerPet};
  if(strong(byId.sadism)&&strong(byId.masochism))return {id:'dualSM',...SHADOWS.dualSM};
  if(strong(byId.wet)&&strong(byId.cool)&&strong(aux.ownership,2))return {id:'wetCool',...SHADOWS.wetCool};
  if(strong(byId.extreme)&&strong(byId.pamper))return {id:'thrillCare',...SHADOWS.thrillCare};
  if(strong(byId.lead)&&strong(byId.masochism))return {id:'leadingM',...SHADOWS.leadingM};
  if(strong(byId.yield)&&strong(byId.sadism))return {id:'yieldingS',...SHADOWS.yieldingS};
  if(strong(byId.lead)&&strong(byId.yield)&&strong(aux.switch,2))return {id:'switch',...SHADOWS.switch};
  return null;
}

const TRIGGERS=[
  {id:'tease',label:'焦らしと翻弄',items:[3,5,33]},
  {id:'tamed',label:'わからせられたい',items:[6,27,34]},
  {id:'wet',label:'重愛・共依存',items:[9,11,13]},
  {id:'exclusive',label:'独占したい',items:[10,31]},
  {id:'gap',label:'自分にだけ見せる顔',items:[17,22,24]},
  {id:'costume',label:'装いのギャップ',items:[21,23]},
  {id:'devotion',label:'主導権を預けたい',items:[2,30,39]},
  {id:'pamper',label:'全肯定で甘やかされたい',items:[4,26,30]},
  {id:'care',label:'最後は甘い余韻',items:[26,32]},
  {id:'cool',label:'温度差に弱い',items:[12,14,15]},
  {id:'pact',label:'二人だけの約束',items:[25,35]},
  {id:'switch',label:'攻守逆転',items:[7,16]}
];

function validTuple(t,max){
  return Array.isArray(t)&&t.length===3&&t.every(Number.isInteger)&&t[1]>=0&&t[1]<=max&&t[2]>=0&&t[2]<=t[1]&&t[0]>=t[2]*3&&t[0]<=t[2]*4+(t[1]-t[2])*2;
}
const tuple=d=>[d.sum,d.n,d.high];
const expand=t=>({sum:t[0],n:t[1],high:t[2],score:t[1]?Math.round(t[0]/t[1]*25):null});

export function decodeFifth(code){
 if(typeof code!=='string'||code.length>4000||!/^H5\.[A-Za-z0-9_-]+$/.test(code))throw Error('共有URLの内容を確認してください。');
 let p;try{p=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(code.slice(3).replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))));}catch{throw Error('共有URLを読み取れませんでした。');}
 const triggerMap=Object.fromEntries([...TRIGGERS,{id:'voice',label:'声フェチ'},{id:'restraint',label:'二人だけの合図'},{id:'brat',label:'強がりからの陥落'}].map(t=>[t.id,t]));
 if(!p||Object.keys(p).some(k=>!['v','i','c','m','d','a','r','t','p','g'].includes(k))||p.v!==5||p.i!==INSTRUMENT||p.c!==null&&!Object.hasOwn(TYPES,p.c)||!Array.isArray(p.d)||p.d.length!==DIMENSIONS.length||p.d.some((d,i)=>!validTuple(d,DIMENSIONS[i].branches?2:DIMENSIONS[i].items.length))||!Array.isArray(p.a)||p.a.length!==4||p.a.some(a=>!validTuple(a,2))||!Array.isArray(p.m)||p.m.length!==4||p.m.some(m=>typeof m!=='boolean')||!Array.isArray(p.r)||p.r.length>6||new Set(p.r).size!==p.r.length||p.r.some(id=>!Object.hasOwn(triggerMap,id))||!Array.isArray(p.t)||p.t.length>3||p.t.some(t=>!t||Object.keys(t).some(k=>!['label','kind','group'].includes(k))||typeof t.label!=='string'||t.label.length>128||!['like','boundary'].includes(t.kind)||!Object.hasOwn(GROUPS,t.group))||![null,'leadToYield','yieldToLead'].includes(p.g)||p.p!==undefined&&(!p.p||typeof p.p!=='object'||Array.isArray(p.p)||JSON.stringify(p.p)!==JSON.stringify(normalizePersonal(p.p))))throw Error('共有URLの内容を確認してください。');
 const dims=DIMENSIONS.map((d,i)=>({...d,...expand(p.d[i])}));
 const aux=Object.fromEntries(Object.keys(AUX_ITEMS).map((id,i)=>[id,expand(p.a[i])]));
 if(p.c&&AXES.some(([l,r,a,b],i)=>{const left=dims.find(d=>d.id===l),right=dims.find(d=>d.id===r);return left.n<3||right.n<3||left.score>right.score&&p.c[i]!==a||left.score<right.score&&p.c[i]!==b;}))throw Error('共有URLの内容を確認してください。');
 if(p.g==='leadToYield'&&!strong(dims.find(d=>d.id==='yield'))||p.g==='yieldToLead'&&!strong(dims.find(d=>d.id==='lead')))throw Error('共有URLの内容を確認してください。');
 const shadow=shadowOf(Object.fromEntries(dims.map(d=>[d.id,d])),aux);
 const result={instrument:INSTRUMENT,typeCode:p.c,...makeProfile(dims,aux,p.r.map(id=>({id,label:triggerMap[id].label})),shadow,p.g),dims:dims.map(d=>({...d,level:d.score===null?'まだわからない':d.n<(d.minimum||3)?'手がかりは少なめ':d.score>=70?'強く刺さる':d.score<=30?'今は控えめ':'ほどよく刺さる'})),aux,mixed:p.m,shadow,triggers:p.r.map(id=>({id,label:triggerMap[id].label}))};
 return {...(p.p?personalize(result,p.p):result),originalCode:code,tags:organizeTags(p.t.map(t=>({...t,manual:true})))};
}
export function encodeFifth(code,tags=[]){
 decodeFifth(code);const p=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(code.slice(3).replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))));
 p.t=organizeTags(tags).slice(0,3).map(({label,group,kind})=>({label,group,kind}));
 return 'H5.'+btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(p)))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
}
