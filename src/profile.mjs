export const CONTEXTS={trusted:'信頼する相手にだけ',private:'二人きりでだけ',mood:'その日の気分で',fantasy:'想像の中で楽しみたい'};
export const MEANINGS={reaction:'相手の反応を見るのが好き',release:'考えることを手放したい',special:'自分だけの特別がほしい',contrast:'普段との落差に弱い',senses:'声や仕草から惹かれる',care:'丸ごと甘やかされたい'};
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
export function makeProfile(dims,aux,triggers,shadow,gapId=null){
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
export function normalizePersonal(value={}){
  if(!value||typeof value!=='object'||Array.isArray(value))value={};
  return {alias:clean(value.alias,32),caption:clean(value.caption,100),contexts:[...new Set(Array.isArray(value.contexts)?value.contexts:[])].filter(id=>typeof id==='string'&&Object.hasOwn(CONTEXTS,id)).slice(0,4),meaning:typeof value.meaning==='string'&&Object.hasOwn(MEANINGS,value.meaning)?value.meaning:''};
}
export function personalize(result,value){
  const personal=normalizePersonal(value),parts=[...personal.contexts.map(id=>CONTEXTS[id]),MEANINGS[personal.meaning],personal.caption].filter(Boolean);
  return {...result,...(personal.alias?{title:personal.alias,titleParts:[personal.alias]}:{}),personal,personalLine:parts.join('。')};
}
