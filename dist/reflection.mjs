// Original prompts for self-reflection. Research references inform design, not validity claims.
export const INSTRUMENT = 'reflection-2';
export const CONSENT = 'research-2026-10-18';
export const SOURCES = {
  joyal: {title:'Joyal, Cossette & Lapierre (2015)',url:'https://pubmed.ncbi.nlm.nih.gov/25359122/',scope:'主導と委ねを単純な反対語にしないための概念上の参考。独自質問の検証ではない。'},
  sfes: {title:'Hasson & Ginzburg (2024)',url:'https://pubmed.ncbi.nlm.nih.gov/38263538/',scope:'空想の内容と主観的な体験を区別するための参考。SFESの項目や下位尺度は転用していない。'},
  cosmin: {title:'Terwee et al. (2018)',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5891557/',scope:'関連性・網羅性・理解しやすさを確認する手順の参考。医学的尺度としての認証ではない。'}
};
export const DIMENSIONS = [
  ['initiative','主導したい','親密な時間に、自分から距離や流れをつくること'],
  ['receptivity','委ねたい','親密な時間に、信頼する相手に流れを任せること'],
  ['closeness','近くで過ごす','ふたりの近い距離や、一緒に味わう余韻'],
  ['autonomy','自分の余白','親しくても、自分の時間や空想を持つこと'],
  ['story','ギャップと物語','ふだんと違う一面や、ふたりの関係の変化'],
  ['senses','声と雰囲気','声、香り、空間の雰囲気から心が動くこと'],
  ['novelty','新しい発見','まだ知らない一面や、いつもと違う楽しみ'],
  ['care','言葉で確かめる','希望や余韻を、言葉にして伝え合うこと']
].map(([id,label,description])=>({id,label,description}));
export const QUESTION_BASIS = [
  {dimension:'initiative',construct:'合意した親密な場面で流れをつくる好み',sources:['joyal'],limit:'S・加虐性・他者への支配行動を測るものではない。空想と希望を別に読む。'},
  {dimension:'receptivity',construct:'合意した親密な場面で流れを任せる好み',sources:['joyal'],limit:'M・痛みへの好み・断れなさを測るものではない。主導と相殺しない。'},
  {dimension:'closeness',construct:'親密な時間の距離と共有の好み',sources:[],limit:'サイト独自のテーマ。愛着分類や依存傾向の判定には使わない。'},
  {dimension:'autonomy',construct:'親密さと併存する時間・心理的余白',sources:[],limit:'サイト独自のテーマ。回避型愛着や冷淡さの判定には使わない。'},
  {dimension:'story',construct:'ギャップや関係の文脈に惹かれる体験',sources:['sfes'],limit:'独自のテーマ。SFESに同じ因子があるという意味ではない。ギャップと物語の一体性も未検証。'},
  {dimension:'senses',construct:'感覚や雰囲気に惹かれる体験',sources:['sfes'],limit:'独自のテーマ。感覚の好みを網羅せず、特定のフェティシズムの判定には使わない。'},
  {dimension:'novelty',construct:'合意した新しい楽しみへの関心',sources:[],limit:'サイト独自のテーマ。刺激希求尺度、リスク行動、行動の約束ではない。'},
  {dimension:'care',construct:'親密な時間に望む言語的な確認の量',sources:[],limit:'サイト独自のテーマ。同意・優しさ・倫理性の高さを点数化しない。'}
];
const prompts = [
  ['相手を誘い、ふたりの距離を自分から縮める場面に惹かれる。','物語の中で、自分が相手をリードする役回りに惹かれる。','信頼する相手との親密な時間は、自分から誘いたい。','ふたりきりの親密な時間は、自分が過ごし方を提案したい。'],
  ['信頼する相手に誘われ、流れを任せる場面に惹かれる。','物語の中で、信頼できる相手に委ねる役回りに惹かれる。','信頼する相手との親密な時間は、相手にリードしてほしい。','ふたりきりの親密な時間は、相手に過ごし方を提案してほしい。'],
  ['ふたりきりの時間は、近い距離で過ごしたい。','親密な相手とは、寄り添っている時間が心地よい。','特別な時間のあとも、しばらくそばで余韻を楽しみたい。','会えない日にも、親しい相手とのつながりを感じていたい。'],
  ['親密な時間のあとも、ひとりで余韻を味わう時間がほしい。','親しい相手がいても、自分だけで楽しむ空想を持っていたい。','お互いの好みが違っても、自分の好きは別に持っていたい。','親しい相手と会う頻度は、自分のペースも大切にしたい。'],
  ['ふだんは見せない一面が、ふたりきりで現れると惹かれる。','関係が少しずつ変わる物語に、どきっとする。','名前の呼び方が変わるような、小さな関係の変化に心が動く。','ふたりの背景や関係性を想像すると、惹かれる気持ちが強まる。'],
  ['相手の声のトーンに、どきっとすることがある。','ふたりきりの時間は、照明や音の雰囲気を楽しみたい。','近くで感じる香りに、心が動くことがある。','心地よい手触りが、親密な時間の楽しみになる。'],
  ['親密な相手の意外な好みを知ると、気になってしまう。','ふたりで合意したうえで、いつもと違う役回りを試してみたい。','いつもと違う場所の雰囲気を、ふたりで楽しんでみたい。','慣れた関係にも、ときどき新しい楽しみを取り入れたい。'],
  ['親密な時間の前に、好きなことを言葉で話しておきたい。','お互いの気持ちは、こまめに言葉で確かめたい。','してほしいことは、言葉ではっきり伝えたい。','終わったあとも、よかったことを言葉で話したい。']
];
export const QUESTIONS = Array.from({length:32},(_,i)=>{
  const dimension=i%8,round=Math.floor(i/8),fantasy=dimension<2&&round<2;
  return {id:i,dimension,text:prompts[dimension][round],context:dimension<2?(fantasy?'想像の中で':'実際の希望'):dimension===2||dimension===3?'心地よい距離':dimension===7?'伝え方の好み':'心が動く場面',facet:DIMENSIONS[dimension].id+(dimension<2?(fantasy?'_fantasy':'_desired'):''),basis:QUESTION_BASIS[dimension].dimension};
});
// The short route includes both desired-role items. Fantasy is one exploratory item per role.
export const SHORT_IDS = [...Array(8).keys(),...Array.from({length:10},(_,i)=>i+16)];
export const PREVIOUS_SHORT_IDS = [...Array(16).keys(),16,17];
const FULL_IDS=Object.freeze([...Array(32).keys()]);
export const questionIds = (mode,instrument=INSTRUMENT) => mode===18?(instrument==='reflection-1'?PREVIOUS_SHORT_IDS:SHORT_IDS):FULL_IDS;
export function validAnswers(answers,mode,instrument=INSTRUMENT) {
  const ids=questionIds(mode,instrument);
  return [18,32].includes(mode)&&Array.isArray(answers)&&answers.length===32&&answers.every((v,i)=>ids.includes(i)?v===null||Number.isInteger(v)&&v>=0&&v<=4:v===null);
}
export const levelOf = mean => mean===null?'まだわからない':mean>=3?'惹かれる':mean<=1?'今は控えめ':'場面によって変わる';
export const previousDimensions = [{"id":"initiative","label":"主導したい","description":"信頼できる関係で、自分が流れをつくること"},{"id":"receptivity","label":"委ねたい","description":"信頼できる相手に、主導権を預けること"},{"id":"closeness","label":"近くで過ごす","description":"一緒にいる時間や、近い距離感"},{"id":"autonomy","label":"自分の余白","description":"自分の時間やペースを保つこと"},{"id":"story","label":"言葉と物語","description":"言葉や想像から気持ちが動くこと"},{"id":"senses","label":"感覚と雰囲気","description":"声や空間の雰囲気を楽しむこと"},{"id":"novelty","label":"新しい発見","description":"いつもと違う体験に心が動くこと"},{"id":"care","label":"確かめ合いたい","description":"気持ちを言葉で確かめ合うこと"}];
export function reflect(answers,instrument=INSTRUMENT) {
  return (instrument==='reflection-1'?previousDimensions:DIMENSIONS).map((d,i)=>{const values=QUESTIONS.filter(q=>q.dimension===i&&(instrument==='reflection-1'||i>=2||q.id>=16)).map(q=>answers[q.id]).filter(v=>Number.isInteger(v)&&v>=0&&v<=4);const sum=values.reduce((a,b)=>a+b,0),n=values.length,mean=n?sum/n:null;return {...d,sum,n,mean,level:n===1?'手がかりは少なめ':levelOf(mean)};});
}
export function summaryOf(dims) {
  const high=dims.filter(d=>d.mean!==null&&d.mean>=3&&d.n>=2&&d.id!=='care').sort((a,b)=>b.mean-a.mean);
  if(!dims.some(d=>d.n)) return 'まだ言葉にできなくても大丈夫。タグから少しずつ書き足せます。';
  if(!high.length) return '一つに決めなくても大丈夫。心地よさは、相手や場面によって変わります。';
  const top=high.filter(d=>d.mean===high[0].mean);
  if(top.length>2)return 'いくつもの好みが重なっています。しっくりくる言葉から、少しずつ見つけていこう。';
  return high.slice(0,2).map(d=>d.label).join('、')+'。今回の回答に表れた「好き」の手がかりです。';
}
export function layersOf(answers,dimension){return ['想像の中で','実際の希望'].map((label,layer)=>{const vals=QUESTIONS.filter(q=>q.dimension===dimension&&Math.floor(q.id/8)>=layer*2&&Math.floor(q.id/8)<layer*2+2).map(q=>answers[q.id]).filter(v=>Number.isInteger(v)&&v>=0&&v<=4);const sum=vals.reduce((a,b)=>a+b,0);return {label,sum,n:vals.length,mean:vals.length?sum/vals.length:null};});}
export const roleLayers = answers => [0,1].flatMap(i=>layersOf(answers,i));
const titles={initiative:'自分から、距離を縮めたい',receptivity:'安心して、身を委ねたい',closeness:'近くで、余韻を分かち合いたい',autonomy:'親しくても、自分の余白を',story:'ギャップと物語に、ときめく',senses:'声と雰囲気に、心が動く',novelty:'まだ知らない一面に、惹かれる'};
const conversation={initiative:'自分から誘いたいのは、どんなとき？',receptivity:'どんな誘われ方だと、安心して委ねられそう？',closeness:'ふたりの時間のあと、どんな余韻を過ごしたい？',autonomy:'親しくても、自分だけで持っていたい時間は？',story:'ふだんと違う一面に、どきっとしたことは？',senses:'心が動く声や雰囲気を、一つ挙げるなら？',novelty:'いつもと少し違う、試してみたい楽しみは？',care:'希望を確かめるなら、どんな言葉が話しやすい？'};
const suggestions={initiative:['自分から誘いたい','リードする'],receptivity:['誘われたい','安心して委ねる'],closeness:['ふたりの余韻','近い距離'],autonomy:['ひとりの余韻','自分のペース'],story:['ギャップ','関係性の物語'],senses:['声のトーン','空間の雰囲気'],novelty:['新しい一面','役回りの変化'],care:['言葉で確かめたい']};
export function describeProfile(dims,{layers=null,instrument=INSTRUMENT}={}) {
  if(instrument!==INSTRUMENT)return {title:'これまでの「好き」のメモ',summary:'以前の質問で振り返った好みです。今の言葉で書き足しても、もう一度答えても。',insights:[],suggestions:[],prompt:'今もしっくりくる言葉は、どれ？'};
  const ranked=dims.filter(d=>d.n>=2&&d.mean>=3&&d.id!=='care').sort((a,b)=>b.mean-a.mean),top=ranked[0],tied=top?ranked.filter(d=>d.mean===top.mean):[];
  const title=!dims.some(d=>d.n)?'まだ名前のない、好き':!top?'ひとつに決めない、好き':tied.length>1?'いくつもの「好き」が重なる':titles[top.id];
  const insights=[];
  if(layers){for(let i=0;i<2;i++){const f=layers[i*2],r=layers[i*2+1];if(f?.n&&r?.n&&f.mean>=3&&r.mean<=1)insights.push({title:'想像と、実際の希望は別々',text:`${i===0?'主導する':'委ねる'}場面には想像の中で惹かれても、実際には今は控えめ。同じことを望まなくても大丈夫。`,ids:[i,i+8,i+16,i+24]});}}
  if(dims[0].n>=2&&dims[1].n>=2&&dims[0].mean>=3&&dims[1].mean>=3)insights.push({title:'誘うのも、委ねるのも',text:'どちらも楽しみたい気持ちが表れています。相手やその日の気分で、選び直しても。',ids:[16,17,24,25]});
  if(dims[2].n>=2&&dims[3].n>=2&&dims[2].mean>=3&&dims[3].mean>=3)insights.push({title:'近さと、自分の余白',text:'そばにいたい気持ちと、ひとりの時間。両方を大切にしてよさそうです。',ids:[2,3,18,19]});
  if(!insights.length&&top)insights.push({title:top.label,text:top.description+'が、今回の回答では気になるテーマになっています。',ids:QUESTIONS.filter(q=>q.dimension===DIMENSIONS.findIndex(d=>d.id===top.id)&&(q.dimension>=2||q.id>=16)).map(q=>q.id)});
  const preferred=top||dims.find(d=>d.n>=2&&d.id==='care'&&d.mean>=3);
  return {title,summary:summaryOf(dims),insights:insights.slice(0,2),suggestions:[...new Set(ranked.flatMap(d=>suggestions[d.id]))].slice(0,4),prompt:preferred?conversation[preferred.id]:'この中にない「好き」を、ひと言で書くなら？'};
}
export function encodeProfile(dims,tags=[],{instrument=INSTRUMENT,layers=null}={}) {
  const data={v:3,i:instrument,d:dims.map(d=>[d.sum,d.n]),l:layers?layers.map(l=>[l.sum,l.n]):null,t:tags.map(t=>({label:t.label,group:t.group,kind:t.kind}))};
  return 'H3.'+btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(data)))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
}
export function decodeProfile(code) {
  if(typeof code!=='string'||code.length>6000||!/^H[23]\./.test(code))throw Error('カルテの共有コードを入力してください。旧版のタイプコードは旧版で開けます。');
  let p;try{p=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(code.slice(3).replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))));}catch{throw Error('共有コードを読み取れませんでした。');}
  const pair=(a,max)=>Array.isArray(a)&&a.length===2&&Number.isInteger(a[0])&&Number.isInteger(a[1])&&a[1]>=0&&a[1]<=max&&a[0]>=0&&a[0]<=a[1]*4;
  const instrument=p.v===2?'reflection-1':p.i;
  if(![2,3].includes(p.v)||code.slice(0,2)!=='H'+p.v||!['reflection-1',INSTRUMENT].includes(instrument)||!Array.isArray(p.d)||p.d.length!==8||p.d.some((a,i)=>!pair(a,instrument===INSTRUMENT&&i<2?2:4))||!Array.isArray(p.t)||p.t.length>24||p.t.some(t=>!t||typeof t.label!=='string'||!['like','boundary'].includes(t.kind)||!Object.hasOwn(GROUPS,t.group))||p.v===3&&p.l!==null&&(!Array.isArray(p.l)||p.l.length!==4||p.l.some(a=>!pair(a,2))))throw Error('共有コードの内容を確認してください。');
  const dims=(instrument==='reflection-1'?previousDimensions:DIMENSIONS).map((d,i)=>({...d,sum:p.d[i][0],n:p.d[i][1],mean:p.d[i][1]?p.d[i][0]/p.d[i][1]:null,level:p.d[i][1]===1?'手がかりは少なめ':levelOf(p.d[i][1]?p.d[i][0]/p.d[i][1]:null)}));
  const layers=p.v===3&&p.l?p.l.map((a,i)=>({label:i%2?'実際の希望':'想像の中で',sum:a[0],n:a[1],mean:a[1]?a[0]/a[1]:null})):null;
  if(instrument===INSTRUMENT&&layers&&[0,1].some(i=>layers[i*2+1].sum!==dims[i].sum||layers[i*2+1].n!==dims[i].n))throw Error('共有コードの内容を確認してください。');
  return {dims,instrument,layers,tags:organizeTags(p.t.map(t=>({...t,manual:true})))};
}

export const PREVIOUS_QUESTIONS = [{"id":0,"dimension":0,"text":"物語の中で、相手をリードする役回りに惹かれる。"},{"id":1,"dimension":1,"text":"物語の中で、信頼できる相手に委ねる役回りに惹かれる。"},{"id":2,"dimension":2,"text":"親しい相手とは、一緒に過ごす時間を多く持ちたい。"},{"id":3,"dimension":3,"text":"親しい関係でも、ひとりで過ごす時間がほしい。"},{"id":4,"dimension":4,"text":"相手の言葉選びに、心が動くことがある。"},{"id":5,"dimension":5,"text":"落ち着く声や話し方に、惹かれることがある。"},{"id":6,"dimension":6,"text":"親しい相手と、行ったことのない場所に出かけたい。"},{"id":7,"dimension":7,"text":"ふたりの希望を確かめてから、予定を決めたい。"},{"id":8,"dimension":0,"text":"信頼し合うふたりの間で、主導権を握る場面を想像するのが好き。"},{"id":9,"dimension":1,"text":"信頼し合うふたりの間で、相手に主導権を預ける場面を想像するのが好き。"},{"id":10,"dimension":2,"text":"好きな人の近くにいると、心地よく感じる。"},{"id":11,"dimension":3,"text":"相手と違う趣味や友人関係も、大切にしたい。"},{"id":12,"dimension":4,"text":"物語の中の関係性に、自分の好みを見つけることがある。"},{"id":13,"dimension":5,"text":"照明や音など、空間の雰囲気を大切にしたい。"},{"id":14,"dimension":6,"text":"いつもと違う過ごし方を、試してみたい。"},{"id":15,"dimension":7,"text":"相手が気持ちを言いやすい雰囲気をつくりたい。"},{"id":16,"dimension":0,"text":"実際の親しい関係でも、自分が流れをつくることを楽しみたい。"},{"id":17,"dimension":1,"text":"実際の親しい関係でも、安心できる相手に流れを任せたい。"},{"id":18,"dimension":2,"text":"何気ない日常も、親しい相手と分かち合いたい。"},{"id":19,"dimension":3,"text":"連絡を返すタイミングは、自分のペースで決めたい。"},{"id":20,"dimension":4,"text":"気持ちを言葉で伝え合う時間が好き。"},{"id":21,"dimension":5,"text":"心地よい香りや手触りに、気分が動くことがある。"},{"id":22,"dimension":6,"text":"新しい一面を知ると、相手への関心が高まる。"},{"id":23,"dimension":7,"text":"無理をしていないか、お互いに確かめ合いたい。"},{"id":24,"dimension":0,"text":"相手の同意を確かめながら、自分から希望や過ごし方を提案したい。"},{"id":25,"dimension":1,"text":"自分の希望を伝えたうえで、相手にリードしてもらう時間を楽しみたい。"},{"id":26,"dimension":2,"text":"離れているときも、親しい相手とこまめに連絡を取りたい。"},{"id":27,"dimension":3,"text":"親しい相手にも、すべてを話さない余白がほしい。"},{"id":28,"dimension":4,"text":"出来事を想像して、その雰囲気を楽しむことがある。"},{"id":29,"dimension":5,"text":"一緒にいる空間の居心地が、相手との時間を左右する。"},{"id":30,"dimension":6,"text":"慣れた関係にも、時々新しい楽しみを取り入れたい。"},{"id":31,"dimension":7,"text":"気持ちが変わったときは、途中でも伝え合いたい。"}];
export const GROUPS = {atmosphere:'雰囲気',relationship:'関係性',values:'大切なこと',other:'自由なメモ'};
const synonyms = new Map([['安心する声','落ち着く声'],['落ち着いた声','落ち着く声'],['2人の時間','ふたりの時間'],['二人の時間','ふたりの時間'],['一人の時間','ひとりの時間'],['1人の時間','ひとりの時間']]);
export function normalizeLabel(value) {
  if(typeof value!=='string')return '';
  const clean=value.normalize('NFKC').replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g,'').trim().replace(/^#+\s*/,'').replace(/\s+/g,' ');
  return Array.from(new TextDecoder().decode(new TextEncoder().encode(clean))).slice(0,32).join('');
}
export function guessGroup(label) {
  if(/声|香|音|照明|雰囲気|場所|手触り|静か|空間/.test(label))return 'atmosphere';
  if(/時間|距離|ペース|一緒|ふたり|ひとり|連絡|リード|主導|委ね|束縛|誘|関係|役回り|ギャップ/.test(label))return 'relationship';
  if(/安心|思いやり|尊重|同意|信頼|誠実|優し|対話|自由|確かめ/.test(label))return 'values';
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

export function compareProfiles(a,b,{sameInstrument=true,instrument=INSTRUMENT}={}) {
  return (instrument==='reflection-1'?previousDimensions:DIMENSIONS).map((d,i)=>({...d,a:a[i].mean,b:b[i].mean,unknown:!sameInstrument||a[i].n<2||b[i].n<2||a[i].mean===null||b[i].mean===null,similar:sameInstrument&&a[i].n>=2&&b[i].n>=2&&a[i].mean!==null&&b[i].mean!==null&&Math.abs(a[i].mean-b[i].mean)<1,prompt:conversation[d.id]}));
}

export function comparisonInputs(own,partner) {return {own:own?encodeProfile(own.dims,[],{instrument:own.instrument}):'',partner:partner?encodeProfile(partner.dims,partner.tags,{instrument:partner.instrument,layers:partner.layers}):''};}
