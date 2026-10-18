import {INSTRUMENT,CONSENT,QUESTIONS,DIMENSIONS,TYPES,AXES} from './content.mjs';
import {organizeTags,GROUPS} from './tags.mjs';
import {makeProfile,normalizePersonal,personalize} from './profile.mjs';
import {decodePrevious,encodePrevious} from './share-compat.mjs';
export {INSTRUMENT,CONSENT,QUESTIONS,DIMENSIONS,TYPES,AXES};

export function validAnswers(answers,mode=40){
  return mode===40&&Array.isArray(answers)&&answers.length===40&&Array.from(answers).every((v,i)=>v===null||Number.isInteger(v)&&QUESTIONS[i].choices.some(c=>c.value===v));
}
export const QUESTION_ORDER=Object.freeze([7,...QUESTIONS.filter(q=>q.id!==7).map(q=>q.id)]);
const at=(answers,number)=>answers[number-1];
const selected=(answers,number)=>QUESTIONS[number-1].choices.find(c=>c.value===at(answers,number));
function aggregate(values){
  const known=values.filter(v=>Number.isInteger(v)&&v>=0&&v<=4);
  const sum=known.reduce((a,b)=>a+b,0),n=known.length,high=known.filter(v=>v>=3).length;
  return {sum,n,high,score:n?Math.round(sum/n*25):null};
}
const strong=(d,min=d?.minimum||3)=>!!d&&d.n>=min&&d.high>=2&&d.score>=70;
const AUX_ITEMS={giveCare:[26,29],receiveCare:[4,30],ownership:[10,31],switch:[7,16]};
const level=d=>d.score===null?'まだわからない':d.n<(d.minimum||3)?'手がかりは少なめ':d.score>=70?'強く刺さる':d.score<=30?'今は控えめ':'ほどよく刺さる';

function chooseType(dims,answers){
  const byId=Object.fromEntries(dims.map(d=>[d.id,d]));
  const axis=AXES.map(([left,right,a,b])=>{
    const l=byId[left],r=byId[right];
    if(l.n<3||r.n<3)return {letter:null,mixed:true};
    let difference=l.sum/l.n-r.sum/r.n;
    if(Math.abs(difference)<1e-9){
      // Scene choices confirm a direction; an unselected scene is never a negative score.
      const votes=[36,37,40].map(n=>selected(answers,n)?.signals||{});
      difference=votes.reduce((s,v)=>s+(v[left]||0)-(v[right]||0),0);
      if(!difference){
        const topTwo=d=>DIMENSIONS.find(x=>x.id===d.id).items.map(i=>answers[i]).filter(Number.isInteger).sort((x,y)=>y-x).slice(0,2).reduce((x,y)=>x+y,0);
        difference=topTwo(l)-topTwo(r);
      }
    }
    return {letter:Math.abs(difference)<1e-9?null:difference>0?a:b,mixed:Math.abs(l.score-r.score)<15};
  });
  const code=axis.every(a=>a.letter)?axis.map(a=>a.letter).join(''):null;
  return {code,mixed:axis.map(a=>a.mixed)};
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
function triggersOf(answers){
  const found=TRIGGERS.map(t=>({...t,...aggregate(t.items.map(n=>at(answers,n)))})).filter(t=>strong(t,2));
  const voice=at(answers,20)>=3&&selected(answers,37)?.signals?.voice;
  if(voice)found.push({id:'voice',label:'声フェチ',score:100,n:2,high:2});
  if(at(answers,28)>=3&&[38,39].some(n=>at(answers,n)>=3))found.push({id:'restraint',label:'二人だけの合図',score:90,n:2,high:2});
  if(at(answers,34)>=3&&at(answers,36)===1)found.push({id:'brat',label:'強がりからの陥落',score:100,n:2,high:2});
  return found.sort((a,b)=>b.score-a.score||b.n-a.n).slice(0,6).map(({id,label})=>({id,label}));
}
function assemble(dims,aux,code,mixed,triggers,gapId=null){
  const shadow=shadowOf(Object.fromEntries(dims.map(d=>[d.id,d])),aux);
  return {instrument:INSTRUMENT,typeCode:code,...makeProfile(dims,aux,triggers,shadow,gapId),dims:dims.map(d=>({...d,level:level(d)})),aux,mixed,shadow,triggers};
}
export function diagnose(answers){
  if(!validAnswers(answers))throw new TypeError('Invalid diagnosis answers');
  const dims=DIMENSIONS.map(d=>{const branches=d.branches?.map(items=>aggregate(items.map(i=>answers[i]))).filter(a=>a.n===itemsMinimum(d));const value=branches?.length?branches.sort((a,b)=>b.score-a.score)[0]:aggregate(d.items.map(i=>answers[i]));return {...d,...value};});
  const aux=Object.fromEntries(Object.entries(AUX_ITEMS).map(([id,items])=>[id,aggregate(items.map(n=>at(answers,n)))]));
  const {code,mixed}=chooseType(dims,answers);
  const byId=Object.fromEntries(dims.map(d=>[d.id,d]));
  const gapId=at(answers,8)===0&&strong(byId.yield)?'leadToYield':at(answers,8)===1&&strong(byId.lead)?'yieldToLead':null;
  return {...assemble(dims,aux,code,mixed,triggersOf(answers),gapId),evidence:QUESTIONS.filter(q=>q.kind==='intensity'&&answers[q.id]>=3).map(q=>({id:q.id,question:q.text,answer:q.choices.find(c=>c.value===answers[q.id]).label})),uncertainCount:answers.filter(v=>v===null).length};
}
const itemsMinimum=d=>d.minimum||3;
function validTuple(t,max){
  return Array.isArray(t)&&t.length===3&&t.every(Number.isInteger)&&t[1]>=0&&t[1]<=max&&t[2]>=0&&t[2]<=t[1]&&t[0]>=t[2]*3&&t[0]<=t[2]*4+(t[1]-t[2])*2;
}
const tuple=d=>[d.sum,d.n,d.high];
const expand=t=>({sum:t[0],n:t[1],high:t[2],score:t[1]?Math.round(t[0]/t[1]*25):null});
export function encodeResult(result,tags=[]){
  if(result.instrument!==INSTRUMENT&&result.originalCode)return encodePrevious(result.originalCode,tags);
  const data={v:5,i:INSTRUMENT,c:result.typeCode,m:result.mixed,d:result.dims.map(tuple),a:Object.values(result.aux).map(tuple),r:result.triggers.map(t=>t.id),t:organizeTags(tags).slice(0,3).map(({label,group,kind})=>({label,group,kind})),g:result.gap?.id||null,...(result.personal?{p:normalizePersonal(result.personal)}:{})};
  return 'H5.'+btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(data)))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
}
export function decodeResult(code){
  if(typeof code!=='string'||code.length>4000||!/^H[45]\.[A-Za-z0-9_-]+$/.test(code))throw Error('受け取った共有URLを確認してください。');
  if(code.startsWith('H4.'))return decodePrevious(code);
  let p;try{p=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(code.slice(3).replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))));}catch{throw Error('共有URLを読み取れませんでした。');}
  const triggerMap=Object.fromEntries([...TRIGGERS,{id:'voice',label:'声フェチ'},{id:'restraint',label:'二人だけの合図'},{id:'brat',label:'強がりからの陥落'}].map(t=>[t.id,t]));
  if(!p||Object.keys(p).some(k=>!['v','i','c','m','d','a','r','t','p','g'].includes(k))||p.v!==5||p.i!==INSTRUMENT||p.c!==null&&!Object.hasOwn(TYPES,p.c)||!Array.isArray(p.d)||p.d.length!==DIMENSIONS.length||p.d.some((d,i)=>!validTuple(d,DIMENSIONS[i].branches?2:DIMENSIONS[i].items.length))||!Array.isArray(p.a)||p.a.length!==4||p.a.some(a=>!validTuple(a,2))||!Array.isArray(p.m)||p.m.length!==4||p.m.some(m=>typeof m!=='boolean')||!Array.isArray(p.r)||p.r.length>6||new Set(p.r).size!==p.r.length||p.r.some(id=>!Object.hasOwn(triggerMap,id))||!Array.isArray(p.t)||p.t.length>3||p.t.some(t=>!t||Object.keys(t).some(k=>!['label','kind','group'].includes(k))||typeof t.label!=='string'||t.label.length>128||!['like','boundary'].includes(t.kind)||!Object.hasOwn(GROUPS,t.group))||![null,'leadToYield','yieldToLead'].includes(p.g)||p.p!==undefined&&(!p.p||typeof p.p!=='object'||Array.isArray(p.p)||JSON.stringify(p.p)!==JSON.stringify(normalizePersonal(p.p))))throw Error('共有URLの内容を確認してください。');
  const dims=DIMENSIONS.map((d,i)=>({...d,...expand(p.d[i])}));
  const aux=Object.fromEntries(Object.keys(AUX_ITEMS).map((id,i)=>[id,expand(p.a[i])]));
  if(p.c&&AXES.some(([l,r,a,b],i)=>{const left=dims.find(d=>d.id===l),right=dims.find(d=>d.id===r);return left.n<3||right.n<3||left.score>right.score&&p.c[i]!==a||left.score<right.score&&p.c[i]!==b;}))throw Error('共有URLの内容を確認してください。');
  if(p.g==='leadToYield'&&!strong(dims.find(d=>d.id==='yield'))||p.g==='yieldToLead'&&!strong(dims.find(d=>d.id==='lead')))throw Error('共有URLの内容を確認してください。');
  const result=assemble(dims,aux,p.c,p.m,p.r.map(id=>({id,label:triggerMap[id].label})),p.g);
  return {...(p.p?personalize(result,p.p):result),tags:organizeTags(p.t.map(t=>({...t,manual:true})))};
}
export function readResultLink(value){
  const text=value.trim();if(/^H[45]\./.test(text))return decodeResult(text);
  try{return decodeResult(new URLSearchParams(new URL(text).hash.slice(1)).get('share'));}catch{throw Error('受け取った共有URLかコードを確認してください。');}
}
export function compareResults(a,b,{aLabel='あなた',bLabel='相手'}={}){
  if(a.instrument!==b.instrument)return [{title:'好きな場面から、話してみよう',text:'共有された名前や言葉から、どんな場面が好きか一つずつ聞いてみよう。'}];
  const get=(p,id)=>p.dims.find(d=>d.id===id);
  const high=(p,id)=>strong(get(p,id));
  const give=p=>strong(p.aux.giveCare,2),receive=p=>strong(p.aux.receiveCare,2);
  const lines=[];
  if(high(a,'lead')&&high(b,'yield'))lines.push({title:'あなたが導き、相手が委ねる',text:'主導したい側と、預けたい側が重なる。どんな進め方が好きか、そこから話せそう。'});
  if(high(b,'lead')&&high(a,'yield'))lines.push({title:'相手が導き、あなたが委ねる',text:'相手のリードと、あなたが預けたい気持ちが重なる。任せたいところを一つ伝えてみよう。'});
  if(high(a,'lead')&&high(b,'lead'))lines.push({title:'主導権を譲りたくない二人',text:'どちらも自分から流れを作りたい。交代する楽しさがあるか、先に確かめたい組み合わせ。'});
  if(high(a,'sadism')&&high(b,'masochism')||high(b,'sadism')&&high(a,'masochism'))lines.push({title:'仕掛ける側と、翻弄されたい側',text:'焦らしや反応の駆け引きが話題になりそう。好きな強さや言葉は、それぞれに聞いてみよう。'});
  if(give(a)&&receive(b)||give(b)&&receive(a))lines.push({title:'甘やかす側と、甘えたい側',text:'世話を焼きたい気持ちと、受け取りたい気持ちが重なる。どんな甘やかされ方が好きか話してみよう。'});
  if(receive(a)&&receive(b)&&!give(a)&&!give(b))lines.push({title:'二人とも、甘やかされ待ち',text:'どちらも受け取りたい側。交代で甘やかすなら、何をしてほしい？'});
  if(high(a,'wet')&&high(b,'cool')||high(b,'wet')&&high(a,'cool'))lines.push({title:'濃くつながりたい側と、余白がほしい側',text:'会いたい頻度や、二人だけの時間の濃さを話しておくと、違いを楽しむ入り口になる。'});
  const common=['narrative','aesthetic','extreme','pamper'].filter(id=>high(a,id)&&high(b,id)).map(id=>get(a,id).label);
  if(common.length)lines.push({title:'二人に共通するスイッチ',text:common.slice(0,2).join('、')+'。同じ言葉でも、どんな場面が好きか聞くと面白そう。'});
  if(!lines.length)lines.push({title:'まずは、刺さる場面を一つずつ',text:'強い決め手はまだ重なっていない。好きな声、役回り、甘い余韻から、一つずつ比べてみよう。'});
  return lines.slice(0,4).map(line=>({title:line.title.replace(/あなた|相手/g,s=>s==='あなた'?aLabel:bLabel),text:line.text.replace(/あなた|相手/g,s=>s==='あなた'?aLabel:bLabel)}));
}
