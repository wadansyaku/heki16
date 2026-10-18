// Original reflection prompts, not a validated psychometric instrument.
export const INSTRUMENT = 'reflection-1';
export const CONSENT = 'research-2026-10-18';
export const DIMENSIONS = [
  ['initiative','主導したい','信頼できる関係で、自分が流れをつくること'],
  ['receptivity','委ねたい','信頼できる相手に、主導権を預けること'],
  ['closeness','近くで過ごす','一緒にいる時間や、近い距離感'],
  ['autonomy','自分の余白','自分の時間やペースを保つこと'],
  ['story','言葉と物語','言葉や想像から気持ちが動くこと'],
  ['senses','感覚と雰囲気','声や空間の雰囲気を楽しむこと'],
  ['novelty','新しい発見','いつもと違う体験に心が動くこと'],
  ['care','確かめ合いたい','気持ちを言葉で確かめ合うこと']
].map(([id,label,description])=>({id,label,description}));
const prompts = [
  ['物語の中で、相手をリードする役回りに惹かれる。','信頼し合うふたりの間で、主導権を握る場面を想像するのが好き。','実際の親しい関係でも、自分が流れをつくることを楽しみたい。','相手の同意を確かめながら、自分から希望や過ごし方を提案したい。'],
  ['物語の中で、信頼できる相手に委ねる役回りに惹かれる。','信頼し合うふたりの間で、相手に主導権を預ける場面を想像するのが好き。','実際の親しい関係でも、安心できる相手に流れを任せたい。','自分の希望を伝えたうえで、相手にリードしてもらう時間を楽しみたい。'],
  ['親しい相手とは、一緒に過ごす時間を多く持ちたい。','好きな人の近くにいると、心地よく感じる。','何気ない日常も、親しい相手と分かち合いたい。','離れているときも、親しい相手とこまめに連絡を取りたい。'],
  ['親しい関係でも、ひとりで過ごす時間がほしい。','相手と違う趣味や友人関係も、大切にしたい。','連絡を返すタイミングは、自分のペースで決めたい。','親しい相手にも、すべてを話さない余白がほしい。'],
  ['相手の言葉選びに、心が動くことがある。','物語の中の関係性に、自分の好みを見つけることがある。','気持ちを言葉で伝え合う時間が好き。','出来事を想像して、その雰囲気を楽しむことがある。'],
  ['落ち着く声や話し方に、惹かれることがある。','照明や音など、空間の雰囲気を大切にしたい。','心地よい香りや手触りに、気分が動くことがある。','一緒にいる空間の居心地が、相手との時間を左右する。'],
  ['親しい相手と、行ったことのない場所に出かけたい。','いつもと違う過ごし方を、試してみたい。','新しい一面を知ると、相手への関心が高まる。','慣れた関係にも、時々新しい楽しみを取り入れたい。'],
  ['ふたりの希望を確かめてから、予定を決めたい。','相手が気持ちを言いやすい雰囲気をつくりたい。','無理をしていないか、お互いに確かめ合いたい。','気持ちが変わったときは、途中でも伝え合いたい。']
];
export const QUESTIONS = Array.from({length:32},(_,i)=>{const d=i%8,r=Math.floor(i/8);return {id:i,dimension:d,text:prompts[d][r]};});
export const SHORT_IDS = [...Array(16).keys(),16,17];
export const questionIds = mode => mode===18 ? SHORT_IDS : [...Array(32).keys()];
export function validAnswers(answers,mode) {
  return [18,32].includes(mode)&&Array.isArray(answers)&&answers.length===32&&answers.every((v,i)=>questionIds(mode).includes(i)?v===null||Number.isInteger(v)&&v>=0&&v<=4:v===null);
}
export function reflect(answers) {
  return DIMENSIONS.map((d,i)=>{const values=QUESTIONS.filter(q=>q.dimension===i).map(q=>answers[q.id]).filter(v=>Number.isInteger(v)&&v>=0&&v<=4);const sum=values.reduce((a,b)=>a+b,0),n=values.length;return {...d,sum,n,mean:n?sum/n:null,level:!n?'まだわからない':sum/n>=3?'大切にしたい':sum/n<=1?'今は控えめ':'場面によって変わる'};});
}
export function summaryOf(dims) {
  const high=dims.filter(d=>d.mean!==null&&d.mean>=3);
  if(!dims.some(d=>d.n)) return 'まだ言葉にできなくても大丈夫。タグから少しずつ書き足せます。';
  if(!high.length) return '一つに決めなくても大丈夫。心地よさは、相手や場面によって変わります。';
  return high.slice(0,2).map(d=>d.label).join('、')+'。今のあなたの好みを知る手がかりです。';
}
export function layersOf(answers,dimension){return ['想像の中で','実際の関係で'].map((label,layer)=>{const vals=QUESTIONS.filter(q=>q.dimension===dimension&&Math.floor(q.id/8)>=layer*2&&Math.floor(q.id/8)<layer*2+2).map(q=>answers[q.id]).filter(v=>v!==null);return {label,n:vals.length,mean:vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null};});}
export function encodeProfile(dims,tags=[]) {
  const data={v:2,d:dims.map(d=>[d.sum,d.n]),t:tags.map(t=>({label:t.label,group:t.group,kind:t.kind}))};
  return 'H2.'+btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(data)))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
}
export function decodeProfile(code) {
  if(typeof code!=='string'||code.length>6000||!code.startsWith('H2.'))throw Error('新しいカルテの共有コードを入力してください。旧版のコードは旧版で開けます。');
  let p;try{p=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(code.slice(3).replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))));}catch{throw Error('共有コードを読み取れませんでした。');}
  if(p.v!==2||!Array.isArray(p.d)||p.d.length!==8||p.d.some(a=>!Array.isArray(a)||a.length!==2||!Number.isInteger(a[0])||!Number.isInteger(a[1])||a[1]<0||a[1]>4||a[0]<0||a[0]>a[1]*4)||!Array.isArray(p.t)||p.t.length>24||p.t.some(t=>!t||typeof t.label!=='string'||!['like','boundary'].includes(t.kind)||!Object.hasOwn(GROUPS,t.group)))throw Error('共有コードの内容を確認してください。');
  const dims=DIMENSIONS.map((d,i)=>({...d,sum:p.d[i][0],n:p.d[i][1],mean:p.d[i][1]?p.d[i][0]/p.d[i][1]:null}));
  return {dims,tags:organizeTags(p.t.map(t=>({...t,manual:true})))};
}
export const GROUPS = {atmosphere:'雰囲気',relationship:'関係性',values:'大切なこと',other:'自由なメモ'};
const synonyms = new Map([['安心する声','落ち着く声'],['落ち着いた声','落ち着く声'],['2人の時間','ふたりの時間'],['二人の時間','ふたりの時間'],['一人の時間','ひとりの時間'],['1人の時間','ひとりの時間']]);
export function normalizeLabel(value) {
  if(typeof value!=='string')return '';
  const clean=value.normalize('NFKC').replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g,'').trim().replace(/^#+\s*/,'').replace(/\s+/g,' ');
  return Array.from(new TextDecoder().decode(new TextEncoder().encode(clean))).slice(0,32).join('');
}
export function guessGroup(label) {
  if(/声|香|音|照明|雰囲気|場所|手触り|静か|空間/.test(label))return 'atmosphere';
  if(/時間|距離|ペース|一緒|ふたり|ひとり|連絡|リード|主導|委ね|束縛/.test(label))return 'relationship';
  if(/安心|思いやり|尊重|同意|信頼|誠実|優し|対話|自由/.test(label))return 'values';
  return 'other';
}
export function organizeTags(tags,learned={}) {
  const out=[],seen=new Set();
  for(const tag of tags.slice(0,24)){
    const raw=normalizeLabel(typeof tag==='string'?tag:tag?.label);if(!raw)continue;
    const label=synonyms.get(raw)||raw,kind=tag?.kind==='boundary'?'boundary':'like';
    const key=kind+':'+label.toLocaleLowerCase('ja');if(seen.has(key))continue;seen.add(key);
    const chosen=tag?.manual&&Object.hasOwn(GROUPS,tag.group)?tag.group:learned[label];
    out.push({label,kind,group:Object.hasOwn(GROUPS,chosen)?chosen:guessGroup(label),manual:!!tag?.manual});
  }return out;
}
export function compareProfiles(a,b) {
  return DIMENSIONS.map((d,i)=>({...d,a:a[i].mean,b:b[i].mean,unknown:a[i].mean===null||b[i].mean===null,similar:a[i].mean!==null&&b[i].mean!==null&&Math.abs(a[i].mean-b[i].mean)<1,prompt:i===0||i===1?'どんなときに誘いたい？ 任せたい？':i===2||i===3?'一緒の時間と、ひとりの時間はどのくらいほしい？':i===4||i===5?'気持ちが動く言葉や雰囲気は？':i===6?'試したいことと、今は避けたいことは？':'途中で気持ちが変わったら、どう伝えよう？'}));
}
