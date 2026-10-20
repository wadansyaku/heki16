// Choice order carries no score. Only explicitly selected desires are evidence.
export const INSTRUMENT='nocturne24-2';
export const PREVIOUS_INSTRUMENT='nocturne24-1';
export const CONSENT='nocturne-2026-10-19';
export const CHAPTERS=['二人のはじまり','近づき方と距離','刺さる場面','欲しいものと境界'];
const option=(label,...signals)=>({label,signals});
const scene=(text,choices,extra={})=>({text,choices,...extra});
export const SCENES=[
  scene('二人きりの自分。どんな役が似合うと思う？',[
    option('自分からリードする'),option('相手のリードに乗る'),option('どちらの役も楽しむ'),option('役を決めず、対等でいたい'),option('まだわからない')
  ],{self:true,single:true}),
  scene('二人きりになった。どう始めたい？',[
    option('私から誘って、流れを作る','lead'),option('誘われて、ついていきたい','yield'),option('焦らして、反応を見たい','sadism'),option('近づき方を、一緒に決める','equal'),option('今は、距離を保っていたい','space')
  ]),
  scene('相手に「今は、任せて」と言われたら？',[
    option('次のことは考えず、任せたい','yield'),option('照れさせる一言を返したい','sadism'),option('甘やかしてくれるなら任せる','receiveCare'),option('今度は私に任せて、と誘う','lead'),option('任せる範囲は、一緒に決める','equal')
  ]),
  scene('余裕のある相手。どんな顔を見たい？',[
    option('私の一言で、照れてほしい','sadism'),option('私にだけ、甘えてほしい','giveCare','exclusive'),option('落ち着いた声で誘ってほしい','voice','yield'),option('余裕をなくすほど求めてほしい','wet'),option('落ち着いたまま、一緒にいたい','space')
  ]),
  scene('今度は、自分が照れてしまった。相手に望むのは？',[
    option('もう少し、からかってほしい','masochism'),option('かわいいね、と甘やかして','receiveCare','praise'),option('次は、私が仕掛ける番にして','switch','sadism'),option('何も言わず、そばにいて','quiet'),option('少し待って、自分のペースに','space')
  ]),
  scene('「今日は、好きにしていいよ」。何をしたい？',[
    option('流れも合図も、私が決める','lead'),option('反応を見ながら、焦らしたい','sadism'),option('喜ぶことを、とことんしたい','giveCare'),option('途中で、相手に主導権を渡す','switch','yield'),option('役は決めず、二人で楽しむ','equal')
  ]),
  scene('深くつながるなら、どんな関係がいい？',[
    option('お互いが、一番の特別でいたい','wet','exclusive'),option('私にだけ、弱さを見せてほしい','exclusive','giveCare'),option('会う時間は濃く。一人の時間も','space'),option('二人だけの約束を育てたい','story'),option('名前をつけず、自由でいたい','equal')
  ]),
  scene('相手が近づいた。ふと惹かれるのは？',[
    option('声の低さや、息づかい','voice'),option('近づくとわかる、相手の香り','scent'),option('触れたときの、温もり','touch'),option('服の質感や、体の輪郭','style'),option('演出より、自然に話す時間','quiet')
  ]),
  scene('外ではきちんとしている相手。二人きりなら？',[
    option('私にだけ、気を抜いた顔を','exclusive'),option('普段と違う言葉で誘ってほしい','voice','story'),option('整った服が少し崩れるところ','style','disarray'),option('いつもより甘く扱ってほしい','receiveCare'),option('普段と同じ距離が心地いい','space')
  ]),
  scene('一日中、気を張っていた。今、欲しい時間は？',[
    option('相手に少しだけ任せたい','yield'),option('頑張ったね、と甘やかされたい','receiveCare','praise'),option('相手をいたわり、自分も休む','giveCare'),option('からかわれて、頭を休めたい','masochism'),option('一人で、気を抜きたい','space')
  ]),
  scene('合意のうえで、少し痛みのある刺激なら？',[
    option('与える側が気になる','painGive'),option('受ける側が気になる','painReceive'),option('どちらの役も気になる','painGive','painReceive'),option('痛みより、優しい触れ合い','touch'),option('痛みのあることは望まない','neutral')
  ]),
  scene('濃い時間のあと。どう過ごしたい？',[
    option('抱きしめられて安心したい','receiveCare'),option('相手をいたわって落ち着かせる','giveCare'),option('二人の世界から戻りたくない','wet'),option('気持ちを確かめ、一人の時間へ','space'),option('いつもの会話に戻りたい','quiet')
  ]),
  scene('耳元の声。惹かれるのは、どんな瞬間？',[
    option('落ち着いた声で、指示される','voice','yield','restraintReceive'),option('私の一言で、相手の声が変わる','voice','sadism'),option('からかう声に、自分が照れる','voice','masochism'),option('優しい声で、褒めてもらう','voice','receiveCare','praise'),option('声の演出より自然な会話','quiet')
  ]),
  scene('服や身につけるもの。どこに惹かれる？',[
    option('整った服が少しだけ崩れる','style','disarray'),option('制服やスーツの役柄に惹かれる','style','story'),option('首輪やチョーカー、手首の飾り','style'),option('近づいたときの、気配や温もり','touch'),option('服や小物へのこだわりはない','neutral')
  ]),
  scene('二人きりの余韻。残っていてほしいのは？',[
    option('耳に残る、相手の声','voice'),option('近くにいたときの、香り','scent'),option('肌の温もりや、触れた感触','touch'),option('服や仕草の、目に残る細部','style'),option('感覚より、一緒に話したこと','quiet')
  ]),
  scene('合図を待つ遊び。自分なら？',[
    option('私の合図まで、相手を待たせる','restraintGive'),option('相手の合図を、楽しみに待つ','restraintReceive'),option('待つ側と待たせる側を交代','switch','restraintGive','restraintReceive'),option('ルールを作らず、自由に楽しむ','equal'),option('待たせたり待つ遊びは望まない','neutral')
  ]),
  scene('二人だけの役や呼び名。試すなら？',[
    option('私が導く役で、雰囲気を作る','story','lead'),option('導かれる役で、違う自分に','story','yield'),option('途中で役を入れ替えたい','story','switch'),option('呼び名を、二人の秘密にする','story','exclusive'),option('役を作らず、いつもの二人で','equal')
  ]),
  scene('少しいじわるな駆け引き。入りたい場面は？',[
    option('相手の反応を見ながら焦らす','sadism'),option('余裕のある相手に翻弄される','masochism'),option('仕掛けたつもりが、逆転される','switch','masochism','brat'),option('照れた相手を、最後は甘やかす','sadism','giveCare'),option('駆け引きなしで気持ちを伝える','equal')
  ]),
  scene('わざと挑発した、その先。望む展開は？',[
    option('「参りました」と言わされたい','brat','masochism','intense'),option('相手の強がりを、私が崩したい','sadism','intense'),option('勝つ側と負ける側を何度も交代','switch'),option('挑発しても、優しく受け止めて','receiveCare'),option('挑発するやり取りは望まない','neutral')
  ]),
  scene('合意のある強い演出。試したいのは？',[
    option('相手に痛みのある刺激を与える','painGive','intense'),option('自分が痛みのある刺激を受ける','painReceive','intense'),option('相手の動きを少し制限する','restraintGive','intense'),option('自分の動きを相手に任せる','restraintReceive','intense'),option('強い演出より、穏やかな触れ合い','touch')
  ]),
  scene('好きな相手との時間。何が満たされるとうれしい？',[
    option('自分が、一番に選ばれる','wet','exclusive'),option('気を張らない自分も受け止めて','receiveCare'),option('信頼して、相手に任せられる','yield'),option('私の一手で、相手の表情が変わる','sadism'),option('自分の望みを、自分で伝えたい','lead')
  ],{motive:true}),
  scene('楽しい時間でも、避けたいことは？',[
    option('自分が痛みを受けたくない','boundaryPain'),option('傷つく言葉は、使わないで','boundaryWords'),option('普段の生活まで束縛しないで','boundaryControl'),option('同じ役だと、決めつけないで','boundaryRole'),option('この中では、まだ決められない','boundaryUnknown')
  ],{boundary:true}),
  scene('望むことが変わるとしたら、何がきっかけ？',[
    option('相手への信頼が深まったとき','contextTrust'),option('疲れ具合や気分が変わるとき','contextMood'),option('相手によって役も変わりそう','contextPartner'),option('場所や雰囲気が変わったとき','contextScene'),option('同じ好みを楽しみたい','contextStable')
  ],{context:true}),
  scene('最後に、言ってほしい一言は？',[
    option('「安心して甘えていいよ」','receiveCare'),option('「あなたに甘えられてよかった」','giveCare'),option('「これは、二人だけの秘密ね」','story','exclusive'),option('「次は、あなたに任せたい」','lead','switch'),option('「自分のペースで休んでね」','space')
  ])
].map((q,id)=>({...q,id,chapter:Math.floor(id/6),choices:q.choices.map((c,value)=>({...c,value}))}));
export const FACETS=[
  ['lead','主導したい','流れを作る側'],['yield','委ねたい','信頼して任せる側'],['sadism','翻弄したい','相手の余裕を崩す側'],['masochism','翻弄されたい','自分の余裕を奪われる側'],
  ['giveCare','甘やかしたい','相手をいたわる側'],['receiveCare','甘えたい','受け止めてもらう側'],['wet','濃くつながりたい','二人の時間を濃く'],['space','余白もほしい','自分のペースも大切に'],
  ['exclusive','特別でありたい','自分だけに見せる顔'],['story','二人だけの設定','役・呼び名・約束'],['voice','声に惹かれる','言葉づかいと囁き'],['style','装いに惹かれる','服と仕草の細部'],
  ['scent','香りに惹かれる','近い距離で感じる香り'],['touch','触れ合いに惹かれる','温もりと肌の感触'],['restraintGive','動きや合図を決めたい','合図や動きを決める側'],['restraintReceive','動きや合図を任せたい','合図や動きを任せる側'],['painGive','痛みを与えたい','痛みを含む刺激を与える側'],['painReceive','痛みを受けたい','痛みを含む刺激を受ける側']
].map(([id,label,detail])=>({id,label,detail}));
export const MOODS={ordinary:'いつもどおり',soft:'甘えたい気分',playful:'駆け引きを楽しみたい',calm:'ゆっくり過ごしたい',unset:'決めずに答える'};
export const AGES={'18-19':'18〜19歳','20-24':'20代前半','25-29':'20代後半','30-39':'30代','40-49':'40代','50+':'50代以上',unset:'答えない'};
export const GENDERS={woman:'女性',man:'男性',diverse:'その他・どちらでもない',unset:'答えない'};
export const BOUNDARIES={boundaryPain:'痛みは受けたくない',boundaryWords:'きつい言葉は苦手',boundaryControl:'生活までの束縛は望まない',boundaryRole:'役を決めつけないで'};
export const CONTEXTS={contextTrust:'信頼で変わる',contextMood:'気分や疲れ具合で変わる',contextPartner:'相手によって変わる',contextScene:'場面によって変わる',contextStable:'好みは比較的変わらない'};
const has=(q,signal)=>q.choices.some(c=>c.signals.includes(signal));
export function validAnswers(a){
  return Array.isArray(a)&&a.length===SCENES.length&&a.every((v,i)=>v===null||Number.isInteger(v)&&v>=0&&v<=31&&bits(v).length<=(SCENES[i].single?1:SCENES[i].boundary?4:2)&&!(SCENES[i].boundary&&(v&16)&&v!==16));
}
export const bits=mask=>[0,1,2,3,4].filter(i=>(mask&(1<<i))!==0);
export const emptyAnswers=()=>Array(SCENES.length).fill(null);
export function selectedSignals(a){
  const out={};
  SCENES.forEach(q=>{if(q.self||a[q.id]===null)return;const seen=new Set(bits(a[q.id]).flatMap(i=>q.choices[i].signals));for(const s of seen)(out[s]??=[]).push(q.id);});
  return out;
}
function evidenceFor(answers,signals,focus){
  const remaining=new Set(focus),chosen=[],ids=[...new Set(focus.flatMap(s=>signals[s]||[]))];
  while(chosen.length<3&&ids.some(id=>!chosen.includes(id))){const ranked=ids.filter(id=>!chosen.includes(id)).sort((a,b)=>[...remaining].filter(s=>signals[s]?.includes(b)).length-[...remaining].filter(s=>signals[s]?.includes(a)).length||a-b),id=ranked[0];chosen.push(id);for(const s of remaining)if(signals[s]?.includes(id))remaining.delete(s);}
  return chosen.map(id=>({id,question:SCENES[id].text,answers:bits(answers[id]).map(i=>SCENES[id].choices[i].label)}));
}
export function diagnose(answers){
  if(!validAnswers(answers))throw Error('回答を確認してください。');
  const signals=selectedSignals(answers),count=s=>signals[s]?.length||0,opportunities=s=>SCENES.filter(q=>!q.self&&answers[q.id]!==null&&has(q,s)).length,strong=s=>count(s)>=2&&count(s)/opportunities(s)>=.35;
  const facets=FACETS.map(f=>({...f,count:count(f.id),opportunities:opportunities(f.id),strong:strong(f.id),level:strong(f.id)?'よく選んだ':count(f.id)?'選んだ場面がある':SCENES.some(q=>!q.self&&answers[q.id]!==null&&has(q,f.id))?'今回は選ばなかった':'まだわからない'}));
  let title='まだ名づけていない、好きの余白',quote='好きな場面を、一つずつ。',summary='決め手になる場面は、まだ少なめ。名前に合わせず、自分が選んだ言葉から眺めてみよう。',focus=[];
  const candidates=[];
  const choose=(title,quote,summary,focus)=>candidates.push({title,quote,summary,focus});
  if(strong('switch')&&strong('lead')&&strong('yield'))choose('主従逆転の共犯者','役は固定しない。交代するから、面白い。','導く時間も、任せる時間も欲しい。最初に決めた役のまま終わるより、途中で立場が変わる場面を繰り返し選びました。',['switch','lead','yield']);
  if(strong('sadism')&&strong('masochism'))choose('余裕泥棒の、負けず嫌い','余裕は奪いたい。奪われるのも、嫌いじゃない。','相手の照れた顔が好き。でも、自分が照れる側にも惹かれる。攻める役と受ける役を、どちらも選んだ組み合わせです。',['sadism','masochism']);
  if(strong('lead')&&strong('masochism')&&strong('voice'))choose('囁きで落ちる司令塔','流れは私が決める。でも、その声には弱い。','主導する側と、からかわれる側。両方を別々の場面でも選びました。声や言葉づかいにも、繰り返し惹かれています。',['lead','masochism','voice']);
  if(strong('lead')&&strong('masochism'))choose('隙だらけの司令塔','仕切るのは私。照れるのも、私。','進め方は自分で決めたい。でも、いつも余裕のある側でいたいわけではない。相手にからかわれる場面にも、繰り返し惹かれています。',['lead','masochism']);
  if(strong('yield')&&strong('sadism'))choose('手綱を預ける小悪魔','手綱は預ける。牙は抜かない。','相手のリードには乗りたい。それでも、相手を照れさせる一手は手放したくない。任せながら仕掛ける場面が、あなたの選んだ面白さです。',['yield','sadism']);
  if(strong('lead')&&strong('giveCare'))choose('溺愛の飼い主','甘やかすなら、とことん。','自分から流れを作り、相手が気を抜くところまで甘やかしたい。任せてもらうことも、安心した顔を見ることも、あなたには楽しみのうち。',['lead','giveCare']);
  if(strong('masochism')&&strong('receiveCare')&&strong('intense'))choose('飴と鞭に弱い、強がり','翻弄して。でも最後は、甘やかして。','濃い駆け引きに惹かれ、終わったあとは安心したい。強い場面と優しい余韻を、別々の問いでも選んでいます。',['masochism','receiveCare','intense']);
  if(strong('giveCare')&&strong('receiveCare'))choose('甘やかし合う共犯者','甘やかす。甘やかされる。どちらも欲しい。','相手をいたわる喜びも、自分を受け止めてもらう安心も欲しい。片方の役に決めず、二人で行き来する場面を選んでいます。',['giveCare','receiveCare']);
  if(strong('wet')&&strong('space'))choose('余白を飼う、重愛主義者','濃く愛して。自由な時間も、残して。','特別な関係には惹かれる。でも、普段の生活まで一緒にしたいとは限らない。濃さと距離の両方を選んだところが、あなたらしい組み合わせです。',['wet','space']);
  if(strong('masochism')&&strong('brat'))choose('わからせ待ちの小悪魔','強がったぶん、最後は負けたい。','挑発してみたいし、最後は自分が照れる側に回りたい。「参りました」と言わされる展開を、ほかの駆け引きと一緒に選んでいます。',['brat','masochism']);
  if(strong('sadism')&&strong('giveCare'))choose('意地悪な、溺愛主義者','余裕を崩して、最後は甘やかす。','相手の反応を引き出すのが好き。そのあと、安心させる側にも惹かれています。からかうことと、いたわることを一緒に楽しみたい組み合わせです。',['sadism','giveCare']);
  if(strong('exclusive')&&strong('story'))choose('二人だけの共犯者','合言葉は、私たちだけに通じればいい。','二人にしか通じない呼び名や約束と、自分だけに見せる顔に惹かれています。誰とでも同じ関係より、二人の間で育つ特別さを選んでいます。',['exclusive','story']);
  if(strong('yield')&&strong('receiveCare'))choose('溺愛待ちの忠犬','信頼したら、思いきり甘えたい。','相手に任せる時間と、気を張らずに甘える時間を選んでいます。誰にでも従いたいというより、信頼できる相手に受け止めてもらいたい組み合わせです。',['yield','receiveCare']);
  if(strong('sadism'))choose('余裕泥棒','その澄ました顔を、崩したい。','相手の反応を引き出す場面を、繰り返し選んでいます。照れた顔や、変わる声。その一瞬に惹かれる好みが見えました。',['sadism']);
  if(strong('masochism'))choose('翻弄待ちの、負けず嫌い','余裕のある相手に、余裕を奪われたい。','自分が照れたり、少しからかわれたりする場面を選んでいます。普段の役に関係なく、相手にペースを揺らされる時間に惹かれています。',['masochism']);
  if(strong('lead'))choose('密室の司令塔','二人の時間は、私から始めたい。','誘うこと、進め方を決めること。自分から流れを作る場面を、繰り返し選んでいます。相手を攻めたいかどうかとは、別の好みです。',['lead']);
  if(strong('yield'))choose('手綱を預ける自由人','決めない時間を、自分で選ぶ。','信頼する相手に判断を任せる場面を選んでいます。考える役から少し離れ、相手のリードに乗る時間に惹かれています。',['yield']);
  if(strong('giveCare'))choose('溺愛を注ぐ甘党','気を抜いた顔を、私に見せて。','相手をいたわり、甘やかす場面を繰り返し選んでいます。相手が安心してくれることが、自分にとっても楽しさになる組み合わせです。',['giveCare']);
  if(strong('receiveCare')&&strong('praise'))choose('褒めでほどける甘党','ちゃんとしてる私も、甘やかして。','褒めてもらう言葉と、気を張らずに甘える場面。その両方を繰り返し選んでいます。',['receiveCare','praise']);
  if(strong('receiveCare'))choose('溺愛待ちの甘党','今日は、甘える側でいたい。','受け止めてもらうこと、安心して甘えること。気を張らない自分でいられる場面を、繰り返し選んでいます。',['receiveCare']);
  if(strong('voice'))choose('声に弱い収集家','その一言で、空気が変わる。','声や言葉づかいに惹かれる場面を選んでいます。何を言うかだけでなく、誰が、どんな声で言うかも大切にしたい好みです。',['voice']);
  if(strong('style')&&strong('disarray'))choose('着崩れの観察者','整っているから、少しの乱れに弱い。','服や仕草の細部に惹かれる場面を選んでいます。全体の印象より、小さな変化を眺めるところに楽しさがありそうです。',['style','disarray']);
  if(strong('style'))choose('装いの観察者','服と仕草、その細部に目が止まる。','服の質感や輪郭、身につけるもの、仕草の細部。目に残るものに惹かれる場面を選びました。',['style']);
  if(strong('exclusive'))choose('特別を集める共犯者','私にだけ、見せてほしい。','自分だけに見せる顔や、二人だけの特別さに惹かれる場面を選んでいます。',['exclusive']);
  if(strong('story'))choose('二人の世界の演出家','いつもの二人に、秘密の設定を。','役や呼び名、二人だけの約束を選んでいます。同じ二人でも、場面の設定が変わると面白くなりそうです。',['story']);
  if(strong('restraintGive')&&strong('restraintReceive'))choose('手綱を替える共犯者','預ける楽しさも、預かる楽しさも。','合図を待つ側と出す側、動きを任せる側と決める側。どちらにも惹かれ、場面に合わせて役を替えたい組み合わせです。',['restraintGive','restraintReceive']);
  if(strong('restraintGive'))choose('手綱を握る演出家','二人で決めた自由を、私が預かる。','合図を出したり、動きを少し制限したりする側を選びました。痛みを与えたいかどうかとは別に、自由を預かる役に惹かれています。',['restraintGive']);
  if(strong('restraintReceive'))choose('自由を預ける冒険家','任せる範囲は、私が選ぶ。','合図を待つことや、動きを相手に任せる場面を選びました。普段の役や性格とは別に、二人で決めた自由を預ける時間に惹かれています。',['restraintReceive']);
  if(strong('painGive')&&strong('painReceive'))choose('刺激を分け合う共犯者','強さも、役も、二人で決めたい。','痛みを含む刺激を与える側にも、受ける側にも惹かれています。からかいや主導権とは別に、刺激そのものを楽しみたい組み合わせです。',['painGive','painReceive']);
  if(strong('painGive'))choose('刺激を仕掛ける演出家','その刺激を、私から届けたい。','痛みを含む刺激を、相手に与える側を選びました。相手に任せたいかどうかや、言葉の駆け引きとは別に惹かれる場面です。',['painGive']);
  if(strong('painReceive'))choose('刺激待ちの冒険家','その強さに、少し踏み込みたい。','痛みを含む刺激を受ける側を、別々の場面で選びました。誰かに従いたいかどうかとは別に、刺激そのものに惹かれています。',['painReceive']);
  if(strong('scent')&&strong('touch'))choose('距離ゼロの感覚派','香りと温もりに、弱い。','近づいたときの香りと、触れたときの温もり。役や駆け引きだけでは言い切れない、近い距離で感じるものを繰り返し選びました。',['scent','touch']);
  if(strong('scent')&&strong('space'))choose('香りにほどける自由人','距離は大事。でも、その香りは近くで。','一人の時間や自分のペースを大切にしながら、相手の香りには近づきたい。距離を取ることと、感覚に惹かれることを両方選びました。',['scent','space']);
  if(strong('scent'))choose('香りにさらわれる感覚派','近づいた理由は、言葉にできない香り。','声や装いとは別に、近い距離でわかる相手の香りを選びました。会ったあとに残る感覚にも、惹かれています。',['scent']);
  if(strong('touch'))choose('温もりの共犯者','触れた温度が、いちばん残る。','近づいた気配や、肌の温もり、触れた感触を繰り返し選びました。強い演出よりも、触れ合うこと自体に惹かれる場面が見えました。',['touch']);
  if(!candidates.length&&(strong('space')||strong('equal')))choose('余白を愛する自由人','近くにいたい。自分のままでも、いたい。','決まった役や強い演出より、対等さや自分のペースを選んでいます。それも、あなたが望む関係の一つです。',['space','equal']);
  if(!candidates.length&&strong('quiet'))choose('飾らない、ふたり派','演出より、自然に近づきたい。','決まった役や強い駆け引きより、自然な会話や穏やかな時間を選びました。ここにない好みも、自分の言葉で足せます。',['quiet']);
  const desires=Object.keys(signals).filter(s=>!s.startsWith('boundary')&&!s.startsWith('context')&&!['neutral','quiet'].includes(s));
  if(!candidates.length&&desires.length)choose('まだ決めない、沼の入口','刺さる場面は、もう少しずつ見つけたい。','いくつか惹かれる場面はあるけれど、同じ好みが繰り返し表れるほどには決まっていません。選んだ言葉を、そのまま持ち帰ってみよう。',desires.slice(0,2));
  if(!candidates.length&&answers.filter(a=>a===0).length>=12)choose('選択肢の外にいる自由人','その好き、まだ選択肢にない。','多くの場面で「今回はなし」を選びました。無関心と決めつけず、ここにない好みを自分の言葉で足してみよう。',[]);
  const fit=c=>c.focus.length?c.focus.reduce((n,s)=>n+count(s)/Math.max(1,opportunities(s)),0)/c.focus.length+Math.min(2,c.focus.length-1)*.1:0;
  if(candidates.length)({title,quote,summary,focus}=candidates.sort((a,b)=>fit(b)-fit(a)||Number(b.focus.some(s=>['scent','touch','voice','style','restraintGive','restraintReceive','painGive','painReceive'].includes(s)))-Number(a.focus.some(s=>['scent','touch','voice','style','restraintGive','restraintReceive','painGive','painReceive'].includes(s))))[0]);
  const self=answers[0]===null?null:bits(answers[0])[0];
  const gap=self===0&&strong('yield')?'リード派のつもりが、任せる時間も欲しかった。':self===1&&strong('lead')?'委ね派のつもりが、主導権も欲しかった。':null;
  const tags=facets.filter(f=>f.strong).sort((a,b)=>b.count/b.opportunities-a.count/a.opportunities||b.count-a.count).slice(0,3).map(f=>f.label);
  return {instrument:INSTRUMENT,title,quote,summary,gap,facets,tags,focus,evidence:evidenceFor(answers,signals,focus),boundaries:Object.keys(BOUNDARIES).filter(s=>count(s)).map(s=>BOUNDARIES[s]),contexts:Object.keys(CONTEXTS).filter(s=>count(s)).map(s=>CONTEXTS[s]),answered:answers.filter(a=>a!==null).length,signals: Object.fromEntries(Object.entries(signals).map(([s,ids])=>[s,ids.length]))};
}
export function publicCard(profile,tags=profile.tags,personal=''){
  return {v:1,instrument:profile.instrument,title:profile.title,quote:profile.gap||profile.quote,summary:personal||profile.summary,tags:tags.slice(0,3),traits:profile.facets.filter(f=>f.strong).sort((a,b)=>b.count/b.opportunities-a.count/a.opportunities||b.count-a.count).slice(0,4).map(f=>f.id)};
}
export function listingCard(profile){const card=publicCard(profile);return {...card,summary:'',traits:card.traits.slice(0,3)};}
const clean=s=>typeof s==='string'&&s===s.trim()&&!/[<>\u0000-\u001f]/.test(s);
export function validCard(p){return !!p&&typeof p==='object'&&!Array.isArray(p)&&Object.keys(p).every(k=>['v','instrument','title','quote','summary','tags','traits'].includes(k))&&p.v===1&&typeof p.instrument==='string'&&p.instrument.length<=40&&clean(p.title)&&p.title.length>=1&&p.title.length<=40&&clean(p.quote)&&p.quote.length<=120&&clean(p.summary)&&p.summary.length<=240&&Array.isArray(p.tags)&&p.tags.length<=3&&p.tags.every(t=>clean(t)&&t.length>=1&&t.length<=24)&&Array.isArray(p.traits)&&p.traits.length<=4&&new Set(p.traits).size===p.traits.length&&p.traits.every(id=>FACETS.some(f=>f.id===id));}
export function compare(a,b){
  const left=new Set(a.traits||a.facets?.filter(f=>f.strong).map(f=>f.id)),right=new Set(b.traits||b.facets?.filter(f=>f.strong).map(f=>f.id));
  const lines=[];
  const pair=(x,y)=>left.has(x)&&right.has(y)||right.has(x)&&left.has(y);
  if(pair('lead','yield'))lines.push({title:'主導したい側と、任せたい側',text:'どんなことを任せたいか、一つずつ確かめてみよう。'});
  if(pair('sadism','masochism'))lines.push({title:'翻弄する側と、翻弄されたい側',text:'からかい方や言葉の強さは、それぞれの希望を大切に。'});
  if(pair('restraintGive','restraintReceive'))lines.push({title:'自由を預かる側と、預ける側',text:'任せる範囲と終わりの合図を、先に一緒に決めてみよう。'});
  if(pair('painGive','painReceive'))lines.push({title:'刺激を与える側と、受ける側',text:'望む刺激と望まないことは、名前から決めずに確かめよう。'});
  if(pair('giveCare','receiveCare'))lines.push({title:'甘やかす側と、甘えたい側',text:'うれしい言葉や、落ち着ける過ごし方が話題になりそう。'});
  if(left.has('lead')&&right.has('lead'))lines.push({title:'二人とも、流れを作りたい',text:'交代したいか、一緒に決めたいか。そこを確かめると面白そう。'});
  if(pair('wet','space'))lines.push({title:'関係の濃さと、一人の時間',text:'会いたい頻度と一人で休む時間を、それぞれに聞いてみよう。'});
  const covered=new Set();
  if(pair('lead','yield')){covered.add('lead');covered.add('yield');}
  if(left.has('lead')&&right.has('lead'))covered.add('lead');
  if(pair('sadism','masochism')){covered.add('sadism');covered.add('masochism');}
  if(pair('restraintGive','restraintReceive')){covered.add('restraintGive');covered.add('restraintReceive');}
  if(pair('painGive','painReceive')){covered.add('painGive');covered.add('painReceive');}
  if(pair('giveCare','receiveCare')){covered.add('giveCare');covered.add('receiveCare');}
  if(pair('wet','space')){covered.add('wet');covered.add('space');}
  const common=FACETS.filter(f=>left.has(f.id)&&right.has(f.id)&&!covered.has(f.id));
  if(common.length)lines.push({title:'共通して選んだ好み',text:common.slice(0,2).map(f=>f.label).join('、')+'。同じ言葉でも、好きな場面は違うかもしれません。'});
  return lines.length?lines.slice(0,3):[{title:'まずは、好きな場面を一つずつ',text:'決め手になる共通点は、まだ少なめ。二つ名がついた理由から、聞いてみよう。'}];
}
