export const CONTEXTS={trusted:'信頼する相手にだけ',private:'二人きりでだけ',mood:'その日の気分で',fantasy:'想像の中で楽しみたい'};
export const MEANINGS={reaction:'相手の反応を見るのが好き',release:'考えることを手放したい',special:'自分だけの特別がほしい',contrast:'普段との落差に弱い',senses:'声や仕草から惹かれる',care:'丸ごと甘やかされたい',nurture:'相手を甘やかすのが好き'};
const strong=d=>!!d&&d.n>=(d.minimum||3)&&d.high>=2&&d.score>=65;
const enough=d=>!!d&&d.n>=(d.minimum||3);
const roleCopy={
  switch:{name:'主従逆転の共犯者',opening:'主導するのも、委ねるのも本命。途中で立場がひっくり返る展開にも惹かれる。',signature:'手綱は、二人の間で奪い合いたい。',scene:'自分が誘ったはずなのに、気づけば相手のペース。そんな逆転も楽しみたい。'},
  ownerPet:{name:'褒めでほどける飼い主',opening:'相手の世話は焼きたい。自分も「いい子」と褒められると、甘える側になる。',signature:'飼い主にも、ご褒美がいる。',scene:'たっぷり甘やかしたあと、今度は自分が撫でられる。渡す側と受け取る側を、両方楽しみたい。'},
  leadingM:{name:'陥落待ちの司令塔',opening:'流れは自分から決めたい。でも、言葉で余裕を奪われる展開にも弱い。',signature:'段取りは私。崩す一手は、そっちから。',scene:'自分の段取りで進めていたのに、相手の一言に返せなくなる。その隙に惹かれる。'},
  yieldingS:{name:'手綱を預ける小悪魔',opening:'主導権は預けたい。相手を照れさせる一手は、手放したくない。',signature:'手綱は預ける。牙は抜かない。',scene:'任せる役のまま、ひと言で相手を照れさせる。従うだけで終わらない駆け引きが刺さる。'},
  dualSM:{name:'余裕泥棒',opening:'相手の余裕は崩したい。自分の余裕も、奪われたい。',signature:'余裕は、奪って奪われたい。',scene:'相手を焦らしていたはずが、切り返されて自分も照れる。反応の行き来を楽しみたい。'},
  both:{name:'両方ほしい共犯者',opening:'流れを決める役も、任せる役も好き。どちらか一方には絞りたくない。',signature:'主導するのも、委ねるのも、本命。',scene:'誘う役と、誘われる役。同じ自分の好みの中に、どちらもある。'},
  leadS:{name:'焦らしの黒幕',opening:'二人の流れを握り、焦らしや切り返しで相手の素直な反応を引き出したい。',signature:'主導権も、照れた顔も、いただきたい。',scene:'強がっていた相手が、こちらのペースで素直になる。その変化を楽しみたい。'},
  lead:{name:'二人の演出家',opening:'誘い方や進め方を、自分から決めたい。',signature:'二人の次の一手は、私から。',scene:'「任せたい」と言われたら、次の一手を自分が決める。その役そのものが好き。'},
  yieldM:{name:'翻弄待ちの野良猫',opening:'流れを相手に預け、自分の余裕がほどけていく駆け引きを味わいたい。',signature:'任せた先で、余裕まで奪われたい。',scene:'次の一手を任せていたら、隠した本音まで見抜かれる。そんな翻弄に惹かれる。'},
  yield:{name:'リード待ちの野良猫',opening:'次に何をするかを考えず、信頼する相手のリードに乗りたい。',signature:'今夜の次の一手は、任せたい。',scene:'何をするかは相手に任せる。今は、判断を手放してついていく役に惹かれる。'},
  S:{name:'余裕を奪う小悪魔',opening:'主導するかどうかにかかわらず、からかいや焦らしで相手の反応を引き出したい。',signature:'好きなのは、余裕が崩れるその顔。',scene:'どちらがリードしていても、相手がふいに照れる。その一瞬を仕掛けたい。'},
  M:{name:'翻弄の沼住人',opening:'言葉や駆け引きで、自分の余裕が崩れていく時間に惹かれる。',signature:'崩されたいのは、私の余裕。',scene:'隠した本音を言い当てられ、言葉に詰まる。そんな駆け引きに惹かれる。'}
};
const themeCopy={
  wet:{name:'閉じた世界の共犯者',line:'二人だけで完結するような、平静ではいられない濃さに惹かれる。',signature:'二人の世界は、少し閉じていたい。',scene:'離れたくない気持ちも、強く求められる重さも、関係の熱として味わいたい。'},
  cool:{name:'密室の野良猫',line:'二人の熱量も、自分の間合いも、好きな形で持っていたい。',signature:'近づく距離は、自分でも選びたい。',scene:'会う時の濃さ、離れる時間、まだ明かさない自分。好きな距離を選びたい。'},
  narrative:{name:'関係性の沼住人',line:'二人の積み重ねや、いつもと違う顔まで、好きの一部になる。',signature:'その関係だから、刺さる。',scene:'同じ言葉でも、そこまでの積み重ねがあるほど、深く気持ちが入る。'},
  aesthetic:{name:'五感の収集家',line:'声、仕草、装い。感覚のディテールに気持ちが動く。',signature:'その細部が、忘れられない。',scene:'声や指先、整った装い。小さなディテールが、好きの入口になる。'},
  extreme:{name:'秘密の共犯者',line:'大胆な言葉や、二人だけが知る秘密のスリルを楽しみたい。',signature:'ここだけの顔を、二人で増やしたい。',scene:'外では口にしない言葉を、二人きりで交わす。その秘密めいた空気に惹かれる。'},
  pamper:{name:'甘い余韻の住人',line:'気を張らずに、甘い時間と余韻を味わいたい。',signature:'最後は、甘くほどけたい。',scene:'濃い時間のあと、気を張らずに過ごす。その甘さまで含めて楽しみたい。'},
  restraint:{name:'合図の共犯者',line:'リボンや目隠し、二人だけの合図。自由を制限する演出そのものに惹かれる。',signature:'二人だけの合図が、スイッチになる。',scene:'止める役でも、待つ役でも、二人だけの合図で空気が変わる演出を楽しみたい。'},
  ownership:{name:'特等席の独占家',line:'相手のいちばん近い席や、誰にも言わない本音を独占したい。',signature:'その特等席は、譲りたくない。',scene:'ほかの誰も知らない本音を、自分だけには明かされる。その特等席を持っていたい。'}
};
const themeNames={
  wet:{leadS:'共依存の黒幕',lead:'重愛の演出家',yieldM:'重愛の忠犬',yield:'重愛の忠犬',yieldingS:'重愛の小悪魔',leadingM:'重愛の陥落待ち',dualSM:'共依存の余裕泥棒',both:'重愛の共犯者',S:'重愛の仕掛け人',M:'重愛の陥落待ち'},
  cool:{leadS:'密室の黒幕',lead:'余白を守る演出家',yieldM:'密室の野良猫',yield:'余白を守る野良猫',yieldingS:'余白を守る小悪魔',leadingM:'密室で崩れる司令塔',dualSM:'余白つきの余裕泥棒',both:'余白つきの共犯者',S:'密室の小悪魔',M:'密室の陥落待ち'},
  narrative:{leadS:'関係性に沼る黒幕',yieldM:'ギャップ待ちの野良猫',yieldingS:'関係性に沼る小悪魔',leadingM:'関係性に沼る司令塔',dualSM:'関係性の余裕泥棒'},
  aesthetic:{leadS:'五感の仕掛け人',lead:'五感の演出家',yieldM:'五感に弱い野良猫',yieldingS:'五感の小悪魔',leadingM:'五感に弱い司令塔',dualSM:'五感の余裕泥棒'},
  extreme:{leadS:'秘密を増やす黒幕',yieldM:'秘密の陥落待ち',yieldingS:'秘密の小悪魔',leadingM:'秘密の司令塔',dualSM:'秘密の余裕泥棒',both:'秘密の共犯者'},
  ownership:{leadS:'特等席を譲らない黒幕',lead:'独占の演出家',yieldM:'独占したい野良猫',yield:'特等席の忠犬',yieldingS:'独占したい小悪魔',dualSM:'独占の余裕泥棒'}
};
const cueProfiles={
  voiceReceive:{title:'声に弱い収集家',description:'好みの声で呼ばれるだけで、気持ちが動く。耳元で交わす声が、好きの入口になる。',signature:'その声だけで、もう弱い。',text:'同じ言葉でも、その声で近くに呼びかけられると、気持ちが変わる。',focus:['aesthetic'],items:[19,36]},
  voiceGive:{title:'囁きの仕掛け人',description:'呼び返す自分の声に、相手が反応する。声を交わす、そのやり取りに惹かれる。',signature:'呼ぶ声も、呼び返す声も好き。',text:'自分の声に反応する相手を見る。声の響きと、その反応を楽しみたい。',focus:['aesthetic'],items:[19,36]},
  costume:{title:'着崩れの収集家',description:'整った装いと、それが少しずつ崩れる変化に惹かれる。',signature:'整っているほど、崩れる瞬間に弱い。',text:'スーツや眼鏡、手袋。最初の構図と、崩れていく過程を、両方楽しみたい。',focus:['aesthetic'],items:[20,22]},
  gap:{title:'素顔の共犯者',description:'ほかの人には見せない弱さや本音を、自分にだけは明かしてほしい。',signature:'その顔を知る、特等席がほしい。',text:'普段は強気な相手が、自分の前でだけほどける。誰も知らない本音を聞く役に惹かれる。',focus:['narrative','ownership'],items:[16,30]},
  cool:{title:'密室のギャップ収集家',description:'外での顔と、二人きりの顔。その落差や、自分にだけ見える弱さが刺さる。',signature:'ドアが閉まってからの顔が好き。',text:'二人きりになって、相手の空気が変わる。その変化を見るのを楽しみたい。',focus:['cool','narrative'],items:[11,16]},
  pact:{title:'二人だけの共犯者',description:'二人だけの秘密や呼び名、約束があると気持ちが入る。',signature:'二人だけの役に、なりきりたい。',text:'外では見せない役を、二人きりで楽しむ。秘密めいた設定に、自分も入りたい。',focus:['extreme','narrative'],items:[24,34]},
  brat:{title:'わからせ待ちの強がり',description:'わざと挑発した自分が、最後には「参りました」と認めさせられる。その逆転に惹かれる。',signature:'強がるところから、ほどいてほしい。',text:'軽口を仕掛けたはずが、切り返されて自分の余裕が崩れる。その流れを味わいたい。',focus:['masochism'],items:[33,35]},
  tease:{title:'焦らしの仕掛け人',description:'相手の照れた反応を見たくて、からかいや焦らしを仕掛けたい。',signature:'照れた顔を、引き出したい。',text:'意地悪な質問や、軽い焦らし。相手の反応を引き出すところから楽しみたい。',focus:['sadism'],items:[2,4,32]},
  tamed:{title:'翻弄待ちの共犯者',description:'言葉や駆け引きで、自分の余裕が崩れていく展開に惹かれる。',signature:'崩されたいのは、私の余裕。',text:'本音を引き出されたり、形勢を変えられたりする場面に気持ちが動く。',focus:['masochism'],items:[5,26,33]},
  devotion:{title:'リード待ちの共犯者',description:'信頼する相手に次の一手を任せ、ついていく役に惹かれる。',signature:'今夜の次の一手は、任せたい。',text:'自分が何をするかを考えず、相手のリードに乗る。その時間を楽しみたい。',focus:['yield'],items:[1,29,38]},
  wet:{title:'重愛の共犯者',description:'二人だけで完結するような、濃い関係に惹かれる。',signature:'二人の世界は、少し閉じていたい。',text:'強く求め合う気持ちや、平静ではいられない関係の重さを味わいたい。',focus:['wet'],items:[8,10,12]},
  space:{title:'余白を残す自由人',description:'一人の時間や、まだ明かさない自分を残して、二人の関係を楽しみたい。',signature:'近さも、余白も、自分で選びたい。',text:'会う時は濃く、離れている時は自分の世界へ。そんな距離感も持っていたい。',focus:['cool'],items:[13,14]},
  switch:{title:'役替わりの共犯者',description:'途中で主導する側が入れ替わる展開に惹かれる。',signature:'途中で変わる、その役が好き。',text:'最初と最後で、二人の立場が逆になる。自分もその展開に入ってみたい。',focus:['lead','yield'],items:[15,35]}
};
const partsOf=title=>{const m=title.match(/^(.*?)(司令塔|飼い主|演出家|仕掛け人|野良猫|共犯者|沼住人|小悪魔|収集家|独占家|黒幕|忠犬|余裕泥棒|重愛家|陥落待ち|世話焼き|強がり|自由人|甘党)$/);return m?[m[1],m[2]].filter(Boolean):[title];};
export function makeProfile(dims,aux,triggers,shadow,gapId=null){
  const d=Object.fromEntries(dims.map(x=>[x.id,x])),has=id=>triggers.some(t=>t.id===id);
  const lead=strong(d.lead),yielding=strong(d.yield),s=strong(d.sadism),m=strong(d.masochism),give=strong({...aux.giveCare,minimum:2}),receive=strong({...aux.receiveCare,minimum:2});
  const ranked=dims.filter(strong).sort((a,b)=>b.score-a.score),themes=ranked.filter(x=>themeCopy[x.id]);
  const theme=themes[0],mood=theme&&themeCopy[theme.id];
  const gap=gapId==='leadToYield'&&yielding?{id:gapId,title:'主導派の見立てと、任せたい場面',text:'自分では「流れを決める側」。でも、任せる場面も本命だった。',shareText:'主導派のつもりが、任せる時間も欲しかった。'}:gapId==='yieldToLead'&&lead?{id:gapId,title:'委ね派の見立てと、自分からの一手',text:'自分では「リードに乗る側」。でも、主導する場面も本命だった。',shareText:'委ね派のつもりが、主導権も欲しかった。'}:null;
  if(!ranked.length){
    const cue=triggers.map(t=>cueProfiles[t.id]).find(Boolean);
    if(cue)return {...cue,titleParts:partsOf(cue.title),highlight:{title:'あなたが沼る場面',text:cue.text},insights:[],cueItems:cue.items};
    const known=dims.filter(enough),light=known.filter(x=>x.score>=45);
    const selective=known.filter(x=>x.high>=2).sort((a,b)=>b.high-a.high||b.score-a.score);
    if(selective.length)return {title:'一点突破の沼住人',titleParts:['一点突破の','沼住人'],description:'いくつかの場面には、はっきり惹かれている。好きな役や濃さは、場面を選んで楽しみたい。',signature:'沼る場所は、私が選ぶ。',highlight:{title:'刺さる場面は、はっきりある',text:'強く惹かれた場面と、そうでもない場面が分かれていた。全部を好きになる必要はない。'},insights:[],focus:selective.slice(0,2).map(x=>x.id)};
    if(light.length>=3){const signature='好きな濃さを、少しずつ。';return {title:'つまみ食いの共犯者',titleParts:['つまみ食いの','共犯者'],description:'いくつもの場面に、少しずつ興味がある。ひとつの濃い役に決めず、しっくりくるところから楽しみたい。',signature,highlight:{title:'少しずつ、気になる',text:'ど真ん中までいかなくても、試してみたい場面はある。そのくらいの「好き」も、大切にしたい。'},insights:[],focus:light.slice(0,2).map(x=>x.id)};}
    const complete=known.length>=3;return {title:complete?'沼の外の自由人':'まだ開いていない、性癖の引き出し',titleParts:complete?['沼の外の','自由人']:['まだ開いていない、','性癖の引き出し'],description:complete?'今回の40の場面には、強く惹かれるものは少なめ。あなたの好きが、この中に収まる必要はない。':'答えられそうな場面から、あなたのスイッチを探してみよう。',signature:complete?'私の好きは、私が選ぶ。':null,insights:[],focus:[]};
  }
  const broad=ranked.length>=10&&lead&&yielding&&s&&m;
  let role=broad?'broad':lead&&yielding&&aux.switch.n===2&&aux.switch.high===2?'switch':lead&&give&&receive&&!(s&&m)?'ownerPet':lead&&!yielding&&m?'leadingM':yielding&&!lead&&s?'yieldingS':s&&m?'dualSM':lead&&yielding?'both':lead&&s?'leadS':lead?'lead':yielding&&m?'yieldM':yielding?'yield':s?'S':m?'M':null;
  const base=role==='broad'?{name:'全部盛りの共犯者',opening:'主導も委ねも、焦らしも甘さも本命。ひとつに絞れない、幅広い好み。',signature:'主導権も、甘さも。欲しいものは全部。',scene:'仕掛ける側も、翻弄される側も。違う場面それぞれに、強く惹かれていた。'}:roleCopy[role]||mood;
  let title=base.name,signature=base.signature,scene=base.scene,extra=role&&!['broad','switch','ownerPet'].includes(role)?mood?.line:null,cueItems=[];
  if(role&&!['broad','switch','ownerPet'].includes(role))title=themeNames[theme?.id]?.[role]||title;
  if(!['broad','switch','ownerPet'].includes(role)){
    if(has('voiceReceive')){title={leadingM:'囁きで落ちる司令塔',yieldingS:'囁きに弱い小悪魔',dualSM:'囁きに弱い余裕泥棒',leadS:'声に弱い黒幕',yieldM:'囁き待ちの野良猫'}[role]||title;extra='その声で呼ばれるだけで、気持ちがほどける。';cueItems=[19,36];}
    else if(has('voiceGive')){title={yieldingS:'声で仕掛ける小悪魔',leadS:'囁きの仕掛け人',dualSM:'囁きの余裕泥棒',S:'声で仕掛ける小悪魔'}[role]||title;extra='自分の声に相手が反応する、そのやり取りにも惹かれる。';cueItems=[19,36];}
    else if(has('brat')&&m){title={leadingM:'陥落待ちの司令塔',yieldM:'わからせ待ちの野良猫',dualSM:'わからせ上等の余裕泥棒',M:'わからせ待ちの強がり'}[role]||title;signature='強がるところから、ほどいてほしい。';scene='わざと挑発したあと、最後は「参りました」と認めさせられる。その逆転に惹かれる。';cueItems=[33,35];}
    else if(has('restraintReceive')&&has('restraintGive')){title=role==='dualSM'?'合図を交わす余裕泥棒':'合図を交わす共犯者';scene='止める合図も、待つ合図も。自由を渡し合う演出そのものが刺さる。';cueItems=[27,37,38];}
    else if(has('restraintReceive')){title={leadingM:'合図で落ちる司令塔',leadS:'合図に弱い黒幕',yieldingS:'合図待ちの小悪魔',S:'合図待ちの小悪魔',yieldM:'合図待ちの野良猫',yield:'合図待ちの野良猫',dualSM:'合図待ちの余裕泥棒'}[role]||'合図待ちの共犯者';scene='次の合図まで動かずに待つ。判断だけでなく、動きまで相手に預ける演出が刺さる。';cueItems=[27,38];}
    else if(has('restraintGive')){title=lead?(role==='leadS'?'合図を操る黒幕':'合図の演出家'):role==='yieldingS'?'合図を出す小悪魔':'合図の仕掛け人';scene='こちらの合図ひとつで、相手が動いたり止まったりする。その演出を作りたい。';cueItems=[27,37];}
    else if(has('costume')&&strong(d.aesthetic)){title={leadS:'着崩れに弱い黒幕',yieldM:'着崩れ待ちの野良猫',S:'着崩れの仕掛け人'}[role]||title;extra='整った装いが少しずつ崩れる、その変化にも目を奪われる。';cueItems=[20,22];}
    else if(theme?.id==='pamper'){
      if(give&&!receive){title={lead:'溺愛の飼い主',leadS:'甘やかす黒幕',dualSM:'甘やかす余裕泥棒'}[role]||title;extra='相手が何も考えなくていいほど、世話を焼きたい。';signature='甘やかすなら、とことん。';scene='「今日は任せたい」と甘えられる。流れも、その後の世話も引き受けたい。';}
      else if(receive){title={yieldingS:'褒めに弱い小悪魔',yieldM:'撫で待ちの野良猫',dualSM:'溺愛の余裕泥棒',leadS:'甘えたい黒幕'}[role]||title;extra=give?'甘やかす役も、甘える役も、どちらも欲しい。':'褒められ、撫でられる側で、安心してほどけたい。';}
    }
  }
  if(!role&&theme?.id==='pamper'){if(give&&receive){title='甘やかし合う共犯者';scene='相手を甘やかす役も、褒められて甘える役も、どちらも欲しい。';signature='甘やかすのも、甘えるのも本命。';}else if(give){title='溺愛の世話焼き';signature='甘やかすなら、とことん。';scene='相手の小さな困りごとまで引き受け、何も考えなくていいほど甘やかしたい。';}else if(receive){title=has('care')?'全肯定の甘党':'撫で待ちの甘党';scene='「いい子」の一言や、たっぷり撫でられる時間に、安心してほどけたい。';}}
  const insights=[];
  const add=(id,title,text)=>{if(text!==scene)insights.push({id,title,text});};
  if(s&&m&&!['dualSM','broad'].includes(role))add('dualSM','余裕を奪って、奪われたい',roleCopy.dualSM.scene);
  if(lead&&m&&role!=='leadingM')add('leadingM','主導権と、崩されたい余裕',roleCopy.leadingM.scene);
  if(yielding&&s&&role!=='yieldingS')add('yieldingS','任せる役でも、仕掛けたい',roleCopy.yieldingS.scene);
  if(strong(d.wet)&&strong(d.cool))add('wetCool','濃い特別と、自分の間合い',has('space')?'一人の時間や、まだ明かさない部分は残したい。それでも、二人の関係には深く浸りたい。':'二人きりの熱量も、平静ではいられない関係の重さも、どちらも刺さる。');
  if(strong(d.extreme)&&strong(d.pamper))add('thrillCare','秘密のあとに、甘い余韻','大胆な言葉や秘密を楽しんだあと、気を張らずに甘く過ごす。その両方に惹かれる。');
  if(strong(d.restraint)&&enough(d.masochism)&&d.masochism.score<=30)add('restraint','翻弄より、演出そのもの',has('restraintGive')?'相手の動きを合図で止める演出は好き。自分を強く翻弄される展開は、今は控えめ。':'合図や目隠しの演出は好き。自分の余裕を強く奪われる展開は、今は控えめ。');
  if(strong(d.ownership)&&yielding)add('ownershipYield','委ねるけれど、特等席はほしい','進め方は相手に任せたい。それでも、いちばん近い席や、誰にも言わない本音は独占したい。');
  const roles={switch:['lead','yield'],ownerPet:['lead','pamper'],leadingM:['lead','masochism'],yieldingS:['yield','sadism'],dualSM:['sadism','masochism'],both:['lead','yield'],leadS:['lead','sadism'],lead:['lead'],yieldM:['yield','masochism'],yield:['yield'],S:['sadism'],M:['masochism'],broad:['lead','yield','sadism','masochism']}[role]||[];
  const voiceDescription=has('voiceReceive')?{
    leadingM:'誘い方は自分で決めたい。でも、その声で呼ばれると、自分の余裕も崩れてしまう。',
    yieldingS:'任せる役でも、からかう一手は持っていたい。それなのに、好みの声で呼ばれると自分も弱い。',
    dualSM:'相手の余裕も、自分の余裕も崩れる駆け引きが好き。好みの声で呼ばれると、自分も弱くなる。',
    leadS:'自分から仕掛けたい。そんな自分も、好みの声で呼ばれる瞬間には弱い。'
  }[role]:has('voiceGive')?{
    yieldingS:'流れは任せても、声で相手を照れさせる一手は持っていたい。',
    leadS:'二人の流れを握り、囁く声でも相手の余裕を崩したい。',
    S:'からかう一言も、呼び返す声も。相手の反応を引き出すきっかけにしたい。'
  }[role]:null;
  return {title,titleParts:partsOf(title),description:!role&&theme?.id==='pamper'&&give&&!receive?'相手の世話を焼いて、何も考えなくていいほど甘やかしたい。':!role&&theme?.id==='pamper'&&receive?'褒められ、撫でられる時間に惹かれる。甘える役に、安心して浸りたい。':voiceDescription||[base.opening||mood.line,extra&&extra!==(base.opening||mood.line)?extra:null].filter(Boolean).join(''),signature,highlight:{title:'あなたが沼る場面',text:scene},insights:insights.slice(0,3),gap,focus:[...new Set([...(gap?[gap.id==='leadToYield'?'yield':'lead']:[]),...roles,...(theme?[theme.id]:[])])],cueItems};
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
