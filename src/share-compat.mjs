// Read-only compatibility for aggregate-only H4 links. No previous quiz is shipped.
import {organizeTags,GROUPS} from './tags.mjs';
const DIMS=[{"id":"lead","label":"主導したい","items":[0,32,37],"description":"二人の流れやルールを、自分が決めたい。"},{"id":"yield","label":"委ねたい","items":[1,29,38],"description":"信頼する相手に、判断や主導権を預けたい。"},{"id":"sadism","label":"Sのスイッチ","items":[2,4,32],"description":"照れた反応を引き出し、相手の余裕を崩したい。"},{"id":"masochism","label":"Mのスイッチ","items":[1,5,33],"description":"言葉や駆け引きで、自分の余裕を奪われたい。"},{"id":"wet","label":"重愛・共依存","items":[8,10,12],"description":"二人だけの、濃く特別な関係に浸りたい。"},{"id":"cool","label":"クール・余白","items":[11,13,14],"description":"自分の余白と、二人きりの熱量を両方持ちたい。"},{"id":"narrative","label":"文脈・ギャップ","items":[16,18,23,34],"description":"関係の積み重ねや、いつもと違う顔が刺さる。"},{"id":"aesthetic","label":"五感・属性","items":[17,19,20,22,27],"description":"声、指先、装い。感覚のディテールに弱い。"},{"id":"extreme","label":"背徳・スリル","items":[21,24,26],"description":"秘密や大胆な一面、張りつめた駆け引きを楽しみたい。"},{"id":"pamper","label":"溺愛・聖域","items":[3,25,28,29,31],"description":"全肯定と甘やかし、安心してほどける時間がほしい。"}];
const TYPES={"DWNX":{"code":"DWNX","title":"共依存の黒幕","description":"相手の心の奥に入り込み、二人だけの濃い関係を自分から作りたい。"},"DWNP":{"code":"DWNP","title":"溺愛の檻の主","description":"自分の腕の中を聖域にして、好きな相手を丸ごと甘やかしたい。"},"DWAX":{"code":"DWAX","title":"独占フェチコレクター","description":"好きな声も仕草も、自分だけの特等席で引き出して独占したい。"},"DWAP":{"code":"DWAP","title":"過保護プロデューサー","description":"好きな相手の可愛い瞬間を、自分の手で増やして愛でたい。"},"DCNX":{"code":"DCNX","title":"焦らしのマエストロ","description":"涼しい顔で流れを作り、相手が自分にだけ素直になる展開が刺さる。"},"DCNP":{"code":"DCNP","title":"隠れ溺愛の調教師","description":"普段は距離を保ちながら、二人きりでだけ徹底的に甘やかしたい。"},"DCAX":{"code":"DCAX","title":"耽美のフェチ解剖医","description":"声、指先、装い。細かな美学を、自分のペースで味わいたい。"},"DCAP":{"code":"DCAP","title":"スマートな愛玩オーナー","description":"重くなりすぎない距離で、好きな相手を心地よくエスコートしたい。"},"SWNX":{"code":"SWNX","title":"共依存の献身迷子","description":"信頼する相手に深く委ね、二人だけの逃げ場のない物語に浸りたい。"},"SWNP":{"code":"SWNP","title":"崇拝の忠犬","description":"大好きな相手に尽くして、特別な存在として褒められ、甘やかされたい。"},"SWAX":{"code":"SWAX","title":"五感で溺れるフェチ受け","description":"好きな声や強い視線に心をつかまれ、濃く求められたい。"},"SWAP":{"code":"SWAP","title":"甘やかされたい愛玩動物","description":"体温も甘い言葉も惜しみなく、自分に注がれる時間を過ごしたい。"},"SCNX":{"code":"SCNX","title":"強がり陥落待ち","description":"普段の強がりが、信頼する相手の前でだけほどける展開に弱い。"},"SCNP":{"code":"SCNP","title":"密室で甘える野良猫","description":"自分の世界を持ちながら、二人きりの隠れ家では甘えたい。"},"SCAX":{"code":"SCAX","title":"クールなフェチ受け","description":"普段の距離は保ちつつ、好みの声や装いを持つ相手に委ねたい。"},"SCAP":{"code":"SCAP","title":"気まぐれな箱入り貴族","description":"自分のペースは残しながら、気が向いたときにとびきり愛でられたい。"}};
const AXES=[["lead","yield","D","S"],["wet","cool","W","C"],["narrative","aesthetic","N","A"],["extreme","pamper","X","P"]];
const LABELS={"tease":"焦らしと翻弄","tamed":"わからせられたい","wet":"重愛・共依存","exclusive":"独占したい","gap":"自分にだけ見せる顔","costume":"装いのギャップ","devotion":"主導権を預けたい","pamper":"全肯定で甘やかされたい","care":"最後は甘い余韻","cool":"温度差に弱い","pact":"二人だけの約束","switch":"攻守逆転","voice":"声フェチ"};
const strong=(d,min=3)=>!!d&&d.n>=min&&d.high>=2&&d.score>=70;
const SHADOWS={
  switch:{title:'相手次第で、立場が変わる',text:'相手の出方で、飼う側にも懐く側にも回る。'},
  ownerPet:{title:'甘やかす側にも、甘える側にも',text:'普段は飼い主。褒められると、案外ちょろい。'},
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

const tuple=(t,max)=>Array.isArray(t)&&t.length===3&&t.every(Number.isInteger)&&t[1]>=0&&t[1]<=max&&t[2]>=0&&t[2]<=t[1]&&t[0]>=t[2]*3&&t[0]<=t[2]*4+(t[1]-t[2])*2;
const expand=t=>({sum:t[0],n:t[1],high:t[2],score:t[1]?Math.round(t[0]/t[1]*25):null});
export function decodePrevious(code){
 let p;try{p=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(code.slice(3).replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))));}catch{throw Error('共有URLを読み取れませんでした。');}
 if(!p||Object.keys(p).some(k=>!['v','i','c','m','d','a','r','t'].includes(k))||p.v!==4||p.i!=='unified40-1'||p.c!==null&&!Object.hasOwn(TYPES,p.c)||!Array.isArray(p.d)||p.d.length!==10||p.d.some((t,i)=>!tuple(t,DIMS[i].items.length))||!Array.isArray(p.a)||p.a.length!==4||p.a.some(t=>!tuple(t,2))||!Array.isArray(p.m)||p.m.length!==4||p.m.some(m=>typeof m!=='boolean')||!Array.isArray(p.r)||p.r.length>6||new Set(p.r).size!==p.r.length||p.r.some(id=>!Object.hasOwn(LABELS,id))||!Array.isArray(p.t)||p.t.length>3||p.t.some(t=>!t||Object.keys(t).some(k=>!['label','kind','group'].includes(k))||typeof t.label!=='string'||t.label.length>128||!['like','boundary'].includes(t.kind)||!Object.hasOwn(GROUPS,t.group)))throw Error('共有URLの内容を確認してください。');
 const dims=DIMS.map((d,i)=>({...d,...expand(p.d[i])})),byId=Object.fromEntries(dims.map(d=>[d.id,d])),aux=Object.fromEntries(['giveCare','receiveCare','ownership','switch'].map((id,i)=>[id,expand(p.a[i])]));
 if(p.c&&AXES.some(([l,r,a,b],i)=>byId[l].n<3||byId[r].n<3||byId[l].score>byId[r].score&&p.c[i]!==a||byId[l].score<byId[r].score&&p.c[i]!==b))throw Error('共有URLの内容を確認してください。');
 const type=p.c?TYPES[p.c]:null;
 const ranked=dims.filter(d=>strong(d)).sort((a,b)=>b.score-a.score);
 let title=type?.title,description=type?.description;
 if(!type){if(!dims.some(d=>d.n>=3)){title='まだ開いていない、性癖の引き出し';description='答えられそうな場面から、あなたのスイッチを探してみよう。';}else if(!ranked.length){title='いまは、強い決め手を探している';description='今回の場面には、まだ強く刺さるものが少なめ。あなたの言葉で好みを書き足してみよう。';}else if(strong(byId.lead)&&strong(byId.yield)){title='主導も委ねも、どちらも本命';description='どちらか一役には収まらない。相手や場面で刺さる側が変わる。';}else{title={lead:'主導する場面が、本命',yield:'委ねる場面が、本命',sadism:'相手の余裕が崩れる瞬間に弱い',masochism:'自分の余裕を奪われる展開に弱い',wet:'濃い関係に、深く沼る',cool:'二人きりの温度差に弱い',narrative:'関係性ごと、沼りたい',aesthetic:'五感から、一撃で沼る',extreme:'秘密のスリルが、好きの中心',pamper:'甘やかしと全肯定が、本命'}[ranked[0].id];description='一つの型にはまだ収まらないけれど、強く刺さる場面は見えている。';}}
 return {instrument:p.i,originalCode:code,typeCode:p.c,title,description,dims:dims.map(d=>({...d,level:d.n<3?'まだわからない':d.score>=70?'強く刺さる':d.score<=30?'今は控えめ':'ほどよく刺さる'})),aux,mixed:p.m,shadow:shadowOf(byId,aux),triggers:p.r.map(id=>({id,label:LABELS[id]})),tags:organizeTags(p.t.map(t=>({...t,manual:true}))),insights:[]};
}
export function encodePrevious(code,tags){
 const p=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(code.slice(3).replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))));
 p.t=organizeTags(tags).slice(0,3).map(({label,group,kind})=>({label,group,kind}));
 return 'H4.'+btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(p)))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
}
