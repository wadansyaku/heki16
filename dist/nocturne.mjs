// Choice order carries no score. Only explicitly selected desires are evidence.
// Upgraded R-18 Visceral & High-Volume Dossier Edition v2 (nocturne24-2 compatible drop-in for heki16)
export const INSTRUMENT='nocturne24-3';
export const PREVIOUS_INSTRUMENT='nocturne24-1';
export const CONSENT='nocturne-2026-10-21';
export const PREVIOUS_CONSENT='nocturne-2026-10-19';
export const CHAPTERS=['密室の扉と主導権','体温と視線の駆け引き','理性が溶ける深層場面','渇望の核と絶対境界'];

const option=(label,...signals)=>({label,signals});
const optionPersp=(label,persp,...signals)=>({label,persp,signals});
const scene=(text,choices,extra={})=>({text,choices,...extra});

export const SCENES=[
  scene('密室の鍵が閉まり、二人きりになった瞬間。普段のあなたはどんな役が似合うと思う？',[
    option('自分から相手を引き寄せ、ペースと主導権を握る'),
    option('相手に押し倒され、リードに身を委ねる'),
    option('攻める快感も、組み伏せられる快感も両方欲しい'),
    option('上下を決めず、対等に溶け合いたい'),
    option('まだわからない・日によって揺れる')
  ],{self:true,single:true}),

  scene('唇が重なり、夜の幕が開く瞬間。どんな始まり方に一番ムラッとする？',[
    optionPersp(
      '顎やネクタイを引き寄せ、息もできないほど深く舌を入れるようなキスで主導権を奪う',
      {woman:'相手の顎や襟元を引き寄せ、息もできないほど深く舌を入れるようなキスで主導権を奪う',man:'相手の顎やうなじを強く引き寄せ、有無を言わさず深く舌を入れるようなキスで呼吸を支配する'},
      'lead'
    ),
    optionPersp(
      '壁やベッドに強引に押し倒され、抵抗する隙もなく唇も身体も奪われる',
      {woman:'壁やベッドに強引に押し倒され、抵抗する隙もないまま唇も身体も奪われる',man:'壁やベッドに押し倒され、相手の方から首筋や股間に手を這わされて貪られる'},
      'yield'
    ),
    option('耳元の吐息と流し目で甘く挑発し、相手が理性を失ってむしゃぶりついてくるのを待つ','sadism'),
    option('どちらからともなく肌を重ね、体温が上がるにつれて自然に激しく求め合う','equal'),
    option('焦って触れ合うより、まずは静かに距離と空気感を確かめ合いたい','space')
  ]),

  scene('耳元で低く「今夜は何も考えなくていい、全部俺（私）に任せて」と囁かれたら？',[
    option('思考も責任もすべて手放し、命じられるまま快楽に溺れて頭を空っぽにしたい','yield'),
    option('余裕ぶった相手の顔が崩れるよう、生意気な一言や吐息で挑発し返したい','sadism'),
    option('普段は気を張っている分、無力に組み伏せられてドロドロに甘やかされたい','receiveCare'),
    option('「そっちこそ、今夜は覚悟してね」と体勢をひっくり返して自分が上を取りたい','lead'),
    option('一方的に委ねるより、お互いにどうしたいか確かめながら進めたい','equal')
  ]),

  scene('普段はクールで余裕のある相手。ベッドの上でどんな表情を引き出したい？',[
    option('自分の執拗な責めで息を呑み、余裕が剥がれ落ちて必死に声を堪える顔','sadism'),
    option('自分にだけ理性を忘れてしがみつき、子どものように甘えきった無防備な顔','giveCare','exclusive'),
    option('低い声と余裕のある微笑みで、こちらの身体を1ミリずつ追い詰めてくる目','voice','yield'),
    option('他の誰の影も入らないほど、自分だけを狂おしいほど求めている熱っぽい目','wet'),
    option('無理に乱したりせず、穏やかな表情でゆったりと寄り添っていたい','space')
  ]),

  scene('執拗な前戯で自分の余裕が剥がれ、恥ずかしい声が漏れてしまった瞬間。相手にどうされたい？',[
    option('「ほら、今の声すごくいやらしいよ」と逃げ場なく追い詰められ、さらに執拗に責められたい','masochism'),
    option('熱くなった頬や頭を優しく撫でられ、「可愛いね、いい子だね」と甘やかされたい','receiveCare','praise'),
    option('悔しくてたまらなくなり、次は自分が相手を鳴かせる番だと反撃に出たい','switch','sadism'),
    option('からかったり言葉にせず、ただ強く抱きしめて体温で包んでほしい','quiet'),
    option('一度動きを止めて、呼吸が整うまで自分のペースを待ってほしい','space')
  ]),

  scene('「今夜はあなたの好きなようにしていいよ」と相手の身体を預けられたら？',[
    option('体位も動くペースもいつイかせるかも、すべて自分の合図ひとつで支配したい','lead'),
    option('敏感な場所だけを執拗に焦らし続け、涙目でおねだりするまで寸止めしたい','sadism'),
    option('相手が気持ちいいと感じる場所を徹底的に愛撫し、とろけるまで悦ばせたい','giveCare'),
    option('最初は自分が攻めていたのに、途中で相手の本気に火をつけて逆に組み伏せられたい','switch','yield'),
    option('どちらか片方が支配するのではなく、二人で同時に昂っていきたい','equal')
  ]),

  scene('心も身体も深く絡み合うなら、どんな関係性に一番ゾクゾクする？',[
    option('「この人がいないと生きられない」とお互いの全部を独占し合う共依存の沼','wet','exclusive'),
    option('誰にも見せない相手の弱さや淫らな素顔を、自分だけが知り尽くして庇護したい','exclusive','giveCare'),
    option('ベッドの上では獣のように濃く貪り合い、日常では互いの自立と余白を保ちたい','space'),
    option('「二人だけの秘密の呼び名や主従の約束」がある、非日常の共犯関係','story'),
    option('重すぎる独占やルールで縛らず、その夜の風向きで自由に楽しみたい','equal')
  ]),

  scene('肌と肌が触れ合う距離。あなたの理性を一番最初に狂わせる「五感のトリガー」は？',[
    option('耳元に直接吹きかけられる熱い吐息、濡れた水音、低く掠れた喘ぎ声','voice'),
    option('首筋に顔を埋めたときに立ち上る、汗ばんだ肌と体温の香り','scent'),
    option('焦らすように太ももや急所をなぞる指先の熱と、逃げ場のない密着感','touch'),
    option('着衣の隙間から覗く下着や肌のコントラスト、シーツを掴む指先の造形','style'),
    option('過度な官能演出よりも、リラックスして言葉を交わす自然な空気感','quiet')
  ]),

  scene('外では真面目で完璧な相手と、密室で二人きりになったとき。何に一番昂る？',[
    option('他の誰にも見せない、自分だけの前でトロトロに緩みきった無防備な顔','exclusive'),
    option('普段の丁寧な口調が崩れ、ベッドの上だけ命令口調や淫らな言葉に変わる落差','voice','story'),
    option('整ったスーツや制服・下着を全部脱がさず、着衣を少し崩したまま乱れる背徳感','style','disarray'),
    option('外の顔とは正反対に、自分だけを壊れ物のように甘やかしてくれるギャップ','receiveCare'),
    option('外と中で極端にキャラが変わるより、いつも通りの延長線で触れ合いたい','space')
  ]),

  scene('仕事や日常で一日中気を張って疲れきった夜。ベッドで本当に欲しい救いは？',[
    option('「どう動くか」の判断をすべて相手に預け、頭を空っぽにして身を任せたい','yield'),
    option('髪を撫でられながら「よく頑張ったね、可愛いよ」と全肯定で甘やかされたい','receiveCare','praise'),
    option('疲れた相手を自分の胸に抱きしめ、優しく撫でて溶かしてあげる側でいたい','giveCare'),
    option('強い刺激や焦らしで無理やり思考をショートさせ、日常のストレスを飛ばしたい','masochism'),
    option('誰にも踏み込まれず、一人で静かに心と身体を休める余白がほしい','space')
  ]),

  scene('首元の圧迫感やスパンキング、強く押さえつけられる「痛みを伴う快感」について。',[
    option('相手の肌に赤い跡や歯型を残し、苦しげに喘ぐ顔を見るともっと追い詰めたくなる','painGive'),
    option('首元に手を添えられる息苦しさや、強い突き上げ・叩かれる痛みが深い絶頂に変わる','painReceive'),
    option('相手を強く責めて鳴かせるのも、自分が強い刺激で壊されるのも両方昂る','painGive','painReceive'),
    option('痛みや苦しさではなく、ねっとりと溶けるような愛撫と体温の密着だけでイきたい','touch'),
    option('痛みを伴う刺激は与えるのも受けるのも望まない','neutral')
  ]),

  scene('激しく乱れ合い、果てた直後のピロートーク。どんな余韻がないと満たされない？',[
    option('汗ばんだ身体を強く抱きしめられ、子どものように撫でられて安心したい','receiveCare'),
    option('乱れた相手の髪や背中を優しく撫で、落ち着くまで甘やかしてあげたい','giveCare'),
    option('繋がったまま離れたくないほど、ドロドロの余韻にいつまでも浸っていたい','wet'),
    option('しっかり愛を確かめ合ったあとは、シャワーを浴びて心地よい一人の余白に戻りたい','space'),
    option('過剰にベタベタするより、いつもの自然な会話へ穏やかに戻りたい','quiet')
  ]),

  scene('行為中の「耳元の言葉と声」。一番お腹の奥が疼いてしまうのはどの瞬間？',[
    option('「まだ動くな」「ここが気持ちいいんだろ」と低く落ち着いた声で支配・指示される瞬間','voice','yield','restraintReceive'),
    option('自分の言葉責めや愛撫で、相手の吐息が甘い泣き声や掠れ声に変わる瞬間','voice','sadism'),
    option('「こんなに濡らして／硬くして、いやらしいね」と耳元で淫らな現実を実況される瞬間','voice','masochism'),
    option('「すごく可愛いよ、上手だね」と甘い声で全肯定されながら奥まで愛される瞬間','voice','receiveCare','praise'),
    option('言葉責めやセリフの演出よりも、自然な吐息と肌感覚に集中したい','quiet')
  ]),

  scene('服をすべて脱ぎ捨てる前。視覚や感触としてフェチ心が一番滾るポイントは？',[
    option('全部脱がさず、スカートや下着だけをずらして着衣のまま秘部が晒される背徳感','style','disarray'),
    option('スーツ、制服、ストッキング、ヒールなど「役柄や禁欲さを象徴する衣装」','style','story'),
    option('首筋に食い込むチョーカーや首輪、手首を束ねるリボンなど「所有の印」','style'),
    option('布越しのシルエットより、素肌の柔らかさや吸い付くような体温の感触','touch'),
    option('衣装や小道具のフェチ演出には特にこだわらない','neutral')
  ]),

  scene('濃密に求め合ったあと。身体の奥に一番生々しく残っていてほしい余韻は？',[
    option('耳の奥でリフレインする、相手の低い囁き声や乱れた喘ぎ声','voice'),
    option('シーツや自分の肌に移った、相手の汗と体温・フェロモンの香り','scent'),
    option('火照った肌に残る、強く抱きすくめられた体温と密着の感触','touch'),
    option('着崩れた服や乱れた髪、目に焼き付いた淫らな表情の細部','style'),
    option('肉体的な余韻よりも、行為のあとに交わした穏やかな言葉','quiet')
  ]),

  scene('両手首の固定や目隠し、イく寸前で止められる「寸止め・絶頂管理」について。',[
    option('相手の両手首を押さえつけ、「まだイっていいって言ってない」と泣くまで焦らしたい','restraintGive'),
    option('身動きできない無力な状態で執拗に責められ、許可が出るまでイかせてもらえない焦燥感に溺れたい','restraintReceive'),
    option('縛って焦らす支配感も、自分が拘束されて無力化される快感も両方味わいたい','switch','restraintGive','restraintReceive'),
    option('動きを封じたり寸止めせず、お互いの気持ちいいタイミングで自由に果てたい','equal'),
    option('拘束や寸止めのような身体制御プレイは望まない','neutral')
  ]),

  scene('日常の立場を忘れる「二人だけの設定や主従・背徳のシチュエーション」について。',[
    option('「今夜は俺（私）のオモチャね」と自分が主導権を握り、非日常の空気へ引き込みたい','story','lead'),
    option('普段の自分を捨て、相手に飼い慣らされるペットや従者の役に身を委ねたい','story','yield'),
    option('ある夜は自分が飼い主、別の夜は相手が主人と、役割を入れ替えて遊びたい','story','switch'),
    option('誰にも言えない二人だけの淫らな合言葉や秘密のルールを共有したい','story','exclusive'),
    option('ロールプレイや設定は持ち込まず、素のままの二人で触れ合いたい','equal')
  ]),

  scene('余裕を剥がし合う、少し意地悪で濃厚な駆け引き。どの展開が一番昂る？',[
    option('イきたくて腰を揺らす相手を寸止めで焦らし抜き、甘い懇願を引き出す展開','sadism'),
    option('自分より余裕のある相手に弱点を徹底的に開発され、理性が飛ぶまで翻弄される展開','masochism'),
    option('余裕ぶって攻めていたつもりが、相手のスイッチを入れてしまい力づくで逆転される展開','switch','masochism','brat'),
    option('散々意地悪く責めて泣かせた直後、ギュッと抱きしめてとろけるほど甘やかす展開','sadism','giveCare'),
    option('意地悪な焦らしや駆け引きはせず、ストレートに愛し合いたい','equal')
  ]),

  scene('素直に従わず、わざと生意気な態度で挑発したその先。本当はどうなりたい？',[
    option('相手の本気に火をつけ、ベッドに力づくで押さえつけられて「参りました」と言わされたい','brat','masochism','intense'),
    option('強がって抵抗する相手を組み伏せ、容赦ない快感でプライドを溶かして素直に鳴かせたい','sadism','intense'),
    option('挑発と組み伏せを激しくやり合い、その日の熱量で勝敗がひっくり返る展開がいい','switch'),
    option('どれだけ生意気を言っても、最後は笑って頭を撫でながら優しく受け止めてほしい','receiveCare'),
    option('挑発したり力でねじ伏せるようなやり取りは望まない','neutral')
  ]),

  scene('合意の上でリミッターを外す「深い夜」。本当に試してみたい領域は？',[
    option('スパンキングや首元の圧迫など、強い負荷を刻んで相手の理性を壊したい','painGive','intense'),
    option('息が詰まるほどの圧迫や奥まで響く激しい突き上げで、頭が真っ白になるまで乱されたい','painReceive','intense'),
    option('手足の拘束やアイマスクで相手の自由を完全に奪い、限界を超えても責め続けたい','restraintGive','intense'),
    option('両手首を固定されて逃げ場を失い、イった直後も手を緩めず責め続けられておかしくなりたい','restraintReceive','intense'),
    option('強い負荷や拘束よりも、濃厚なキスと素肌の密着で深く溶け合いたい','touch')
  ]),

  scene('あなたがベッドの上で「支配したい／委ねたい／乱されたい」と願う、一番奥底の理由は？',[
    option('他の誰でもない「自分だけ」に相手が執着し、狂うほど求めてくれる愛の証拠が欲しいから','wet','exclusive'),
    option('普段の「ちゃんとしなきゃ」という鎧を脱ぎ捨て、無条件で甘やかされて溶けたいから','receiveCare'),
    option('判断や責任をすべて信頼できる相手に預け、思考停止してただの生き物に戻りたいから','yield'),
    option('自分の指先や言葉ひとつで、相手の繕った仮面が剥がれていく瞬間に生の実感を得るから','sadism'),
    option('自分の欲望を隠さず主導し、二人の夜を自分の手で染め上げたいから','lead')
  ],{motive:true}),

  scene('逆に、どれだけ雰囲気が良くても「これをされたら一瞬で血の気が引いて冷める地雷」は？',[
    option('肉体的な痛みや恐怖を伴うプレイをされること','boundaryPain'),
    option('本当に見下したような冷たい侮辱や、尊厳を傷つける下品な罵倒を浴びせられること','boundaryWords'),
    option('ベッドの外の私生活や交友関係まで過度に監視・束縛されること','boundaryControl'),
    option('「あなたはドM／ドSだから」といつも同じ役割を一方的に決めつけられること','boundaryRole'),
    option('この中には特にない・相手と相談して決めたい','boundaryUnknown')
  ],{boundary:true}),

  scene('あなたの夜のスイッチや望む役割がガラッと変わるとしたら、どんなとき？',[
    option('「この人になら壊されても大丈夫だ」と心からの信頼と安心感が深まったとき','contextTrust'),
    option('仕事で疲れ果てて溶けたい夜か、エネルギーが有り余って昂っている夜かのコンディション差','contextMood'),
    option('相手が自分よりS気質か、それとも甘えたがりなM気質かの相手との相対バランス','contextPartner'),
    option('ホテルや照明、衣装など、日常から切り離された密室のシチュエーションに入ったとき','contextScene'),
    option('相手や気分に左右されず、自分の核となる性癖はいつも一貫している','contextStable')
  ],{context:true}),

  scene('すべてが終わったあと、耳元で囁かれたら一番脳が溶けて沼ってしまう一言は？',[
    option('「よく頑張ったね、すごく可愛かったよ。もう何も考えないで甘えていいよ」','receiveCare'),
    option('「あなたに全部委ねてよかった。こんなに乱れたの、あなたの前だけだよ」','giveCare'),
    option('「こんなに淫らに乱れた顔、絶対に俺（私）だけの秘密だからね」','story','exclusive'),
    option('「今日は私の勝ちだね。……次は、あなたが私を壊す番にしてくれる？」','lead','switch'),
    option('「気持ちよかったね。あとは自分のペースでゆっくり休もうね」','space')
  ])
].map((q,id)=>({...q,id,chapter:Math.floor(id/6),choices:q.choices.map((c,value)=>({...c,value}))}));

export function sceneText(q,gender='unset'){
  return q.persp?.[gender]||q.text;
}
export function choiceLabel(c,gender='unset'){
  return c.persp?.[gender]||c.label;
}

export const FACETS=[
  ['lead','主導したい','ペースと呼吸を支配する側'],['yield','委ねたい','思考を手放し身を任せる側'],['sadism','翻弄したい','相手の余裕と理性を崩す側'],['masochism','翻弄されたい','余裕を剥がされ追い詰められる側'],
  ['giveCare','甘やかしたい','相手を全肯定で溶かす側'],['receiveCare','甘えたい','頭を撫でられ甘やかされる側'],['wet','濃くつながりたい','境界が溶けるほど深く繋がる'],['space','余白もほしい','一人の時間と距離感も保つ'],
  ['exclusive','特別でありたい','自分だけに見せる素顔と執着'],['story','二人だけの設定','非日常の設定・主従・合言葉'],['voice','声に惹かれる','低い囁き・実況・吐息の熱'],['style','装いに惹かれる','着崩し・衣装・所有の印'],
  ['scent','香りに惹かれる','密着した首筋の香りと湿度'],['touch','触れ合いに惹かれる','体温と粘膜が溶け合う感触'],['restraintGive','動きや合図を決めたい','自由を奪い絶頂を管理する側'],['restraintReceive','動きや合図を任せたい','身動きを封じられ焦らされる側'],['painGive','痛みを与えたい','強い刺激と圧迫を与える側'],['painReceive','痛みを受けたい','強い負荷を快楽へ変換する側']
].map(([id,label,detail])=>({id,label,detail}));

export const MOODS={ordinary:'いつもどおり',soft:'甘えたい気分',playful:'駆け引きを楽しみたい',calm:'ゆっくり過ごしたい',unset:'決めずに答える'};
export const AGES={'18-19':'18〜19歳','20-24':'20〜24歳','25-29':'25〜29歳','30-34':'30〜34歳','35-39':'35〜39歳','40-44':'40〜44歳','45-49':'45〜49歳','50-54':'50〜54歳','55-59':'55〜59歳','60+':'60歳以上',unset:'答えない'};
export const GENDERS={woman:'女性',man:'男性',diverse:'その他・どちらでもない',unset:'答えない'};
export const PROFILE_OPTIONS=Object.fromEntries(Object.entries({mood:MOODS,age:AGES,gender:GENDERS}).map(([key,options])=>[key,Object.fromEntries(Object.entries(options).filter(([value])=>value!=='unset'))]));
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

function buildDeepDossier(answers,facets,signals,title,gap,boundaries,contexts){
  const pct=s=>facets.find(f=>f.id===s)?.pct||0;
  const strongList=facets.filter(f=>f.strong).sort((a,b)=>b.pct-a.pct||b.count-a.count);
  const subStrong=strongList.slice(0,5).map(f=>`${f.label}(${f.pct}%)`).join('・')||'まだ探索段階';

  // Chapter-split escalation analysis: Early (Scenes 1..9) vs Deep Climax (Scenes 10..19)
  const countRange=(s,minId,maxId)=>(signals[s]||[]).filter(id=>id>=minId&&id<=maxId).length;
  const earlyDom=countRange('lead',1,9)+countRange('sadism',1,9);
  const earlySub=countRange('yield',1,9)+countRange('receiveCare',1,9);
  const deepSub=countRange('masochism',10,19)+countRange('restraintReceive',10,19)+countRange('painReceive',10,19);
  const deepDom=countRange('sadism',10,19)+countRange('restraintGive',10,19)+countRange('painGive',10,19);

  const selfIdx=answers[0]===null?null:bits(answers[0])[0];
  const selfLabels=['「自分から主導権を握る」','「相手のリードに身を委ねる」','「攻めも受けも両方楽しむ」','「上下を決めず対等でいる」','「まだわからない」'];
  const selfText=selfIdx!==null?selfLabels[selfIdx]:'「未定」';

  let maskVsDeep='';
  if((selfIdx===0||earlyDom>earlySub)&&(pct('yield')>=35||pct('restraintReceive')>=35||pct('masochism')>=35||deepSub>=3)){
    maskVsDeep=`入り口の自己認識（${selfText}）や序盤の駆け引きでは自分のペースを保とうとする姿勢が見えますが、密室の深層場面（第3〜4章）に入ると「委ねたい(${pct('yield')}%)」「翻弄されたい(${pct('masochism')}%)」「動きを任せたい(${pct('restraintReceive')}%)」が急上昇しています。普段は気を張って強がっている分、自分以上の熱量を持つ相手に退路を塞がれると、理性のガードが剥がれて一気に無力化の快楽へなだれ込む「強がり融解」の二面性を持っています。`;
  }else if((selfIdx===1||earlySub>earlyDom)&&(pct('lead')>=35||pct('sadism')>=35||pct('restraintGive')>=35||deepDom>=3)){
    maskVsDeep=`入り口の自己認識では${selfText}を選んでいますが、具体的な深層場面に入ると「主導したい(${pct('lead')}%)」「翻弄したい(${pct('sadism')}%)」「動きを決めたい(${pct('restraintGive')}%)」の熱が強く浮上しています。最初は相手に華を持たせて従順に振る舞いつつ、相手の余裕が崩れて甘い声が出た瞬間に主導権を奪い取り、涙目になるまで追い詰めたくなる「隠れ捕食者」のスイッチを秘めています。`;
  }else if((pct('masochism')>=35||pct('painReceive')>=35||pct('restraintReceive')>=35)&&pct('receiveCare')>=35){
    maskVsDeep=`あなたの最大の核心は、行為中の激しい被虐・無力化（翻弄されたい:${pct('masochism')}% / 拘束受容:${pct('restraintReceive')}%）と、事後の全肯定ケア（甘えたい:${pct('receiveCare')}%）が同時に高水準で同居している点です。ただ優しいだけでも、ただ乱暴なだけでも満たされず、「容赦なく乱されて理性が飛んだ直後に、壊れ物のように抱きしめられて頭を撫でられる温度差（飴と鞭）」によって最も深く脳が溶ける構造をしています。`;
  }else if(pct('restraintReceive')>=35&&pct('painReceive')===0){
    maskVsDeep=`肉体的な痛み（痛みを受けたい:0%）は明確に拒む一方で、「動きや合図を任せたい(${pct('restraintReceive')}%)」「委ねたい(${pct('yield')}%)」が強く発火しています。傷つけられたいのではなく、両手首の固定や寸止めによって「自分の意思では動けない・勝手にイけない無傷の無力感」を作られたときに最も深く感度が跳ね上がるタイプです。`;
  }else{
    maskVsDeep=`自己認識の${selfText}というスタンスと、密室の深層場面で選ばれた反応（${subStrong}）が淀みなく直結しています。自分の快楽のツボや望む距離感を高い解像度で把握しており、無理な背伸びをせずとも、条件が揃った密室では自然にリミッターを外せるタイプです。`;
  }

  // Scene-specific callbacks: Tired Night (Scene 9), Afterglow (Scene 11), Motive (Scene 20), Final Whisper (Scene 23)
  const mBits=answers[20]!==null?bits(answers[20]):[];
  const motiveMap=[
    '「他の誰でもない自分だけに相手が執着し、狂うほど求めてくれる愛の証拠」を身体で確かめたい渇望',
    '日常で背負っている「ちゃんとしなきゃ」という鎧を脱ぎ捨て、無条件で甘やかされて溶けたい渇望',
    '「どう動くか」の判断と責任をすべて信頼できる相手に預け、思考停止してただの生き物に戻りたい渇望',
    '自分の指先や言葉ひとつで相手の繕った仮面が剥がれ、余裕が崩壊する瞬間に生の実感を得る渇望',
    '自分の欲望を隠さず主導権を握り、二人の夜を自分のペースと美学で染め上げたい渇望'
  ];
  const motiveText=mBits.length?mBits.map(i=>motiveMap[i]).join('と、'):'日常の緊張を解いて深く満たされたいという渇望';

  const tiredBits=answers[9]!==null?bits(answers[9]):[];
  const tiredText=tiredBits.length?SCENES[9].choices[tiredBits[0]].label:'日常の鎧を脱いで呼吸を整える時間';

  const wBits=answers[23]!==null?bits(answers[23]):[];
  const whisperText=wBits.length?wBits.map(i=>SCENES[23].choices[i].label).join(' ／ '):'「よく頑張ったね、もう何も考えないでいいよ」';

  const motiveAndAfterglow=`あなたが夜の奥底で求めている本当の理由は、${motiveText}です。特に日常で気を張って疲れきった夜には「${tiredText}」を強く求めており、行為のあとに『${whisperText}』と囁かれることで初めて心の底から救われます。`;

  // Sensory & Fetish Circuit (Scenes 7, 8, 12, 13, 14)
  const sensoryList=['voice','scent','touch','style'].map(id=>({id,label:FACETS.find(f=>f.id===id).label,pct:pct(id)})).sort((a,b)=>b.pct-a.pct);
  const topSensory=sensoryList.filter(s=>s.pct>0).slice(0,2).map(s=>`${s.label}(${s.pct}%)`).join('×')||'自然な肌感覚';
  const sensoryNarrative=`五感の着火回路では【${topSensory}】が最も鋭く反応しています。${pct('voice')>=35?'物理的な接触だけでなく、耳元に直接吹きかけられる低い吐息や淫らな実況・指示の言葉が脳の奥を直接痺れさせる最大の媚薬になります。':''}${pct('style')>=35?'また、いきなりすべてを脱がせるよりも、整ったスーツや下着を少しだけずらして秘部を晒す「着衣の乱れと視覚的コントラスト」に強いフェティシズムが宿っています。':''}${pct('scent')>=35||pct('touch')>=35?'さらに、首筋に顔を埋めたときの汗と体温の香りや、逃げ場のない素肌の密着温度が加わることで感度が何倍にも跳ね上がります。':''}`;

  // 4-Stage Handling Manual with secretWord for Idea C Redaction Censor
  const step1Secret=pct('lead')>=pct('yield')&&pct('lead')>=35?'深く舌を入れるキスと主導権の奪取':pct('voice')>=35?'耳元の低い囁きと退路の封鎖':pct('yield')>=35?'壁やベッドへの強引な押し倒し':'体温を確かめ合う濃密な密着';
  const step2Secret=pct('restraintReceive')>=35?'両手首の固定×寸止め絶頂管理':pct('restraintGive')>=35?'手首のロック×涙目の懇願引き出し':pct('masochism')>=35?'余裕を剥がす執拗な焦らしと言葉責め':pct('sadism')>=35?'寸止めと執拗な責めによる余裕破壊':'逃げ場のない密着愛撫の重ね掛け';
  const step3Secret=pct('receiveCare')>=35?'事後の過剰な抱擁と「いい子だね」の全肯定':pct('giveCare')>=35?'乱れた相手を胸に抱きしめる溺愛ケア':pct('wet')>=35?'繋がったまま離れない濃密な余韻':'心地よい一人の余白と穏やかな会話';
  const step4Secret=boundaries[0]||'合意と文脈を無視した一方的なプレイ';

  const manual=[
    {
      step:'STEP 01 // 導入：理性の剥がし方',
      secretWord:step1Secret,
      title:`最初は「${step1Secret}」で日常の仮面を剥がす`,
      body:pct('yield')>=pct('lead')
        ?`遠慮がちに様子を伺うよりも、密室の扉が閉まった瞬間に距離を詰め、「${step1Secret}」で思考する隙を奪うのが正解です。${sensoryNarrative}`
        :`あなた自身が流れを握りたい熱を持っているため、「${step1Secret}」から自分のペースへ引き込むか、あるいは相手が絶妙に挑発してあなたの中の捕食本能に火をつける導入が最も昂ります。`
    },
    {
      step:'STEP 02 // 絶頂：深層スイッチの押し方',
      secretWord:step2Secret,
      title:`クライマックスは「${step2Secret}」でリミッターを外す`,
      body:pct('restraintReceive')>=35||pct('masochism')>=35
        ?`中盤以降は、お行儀のいい愛撫だけでは物足りなくなります。「${step2Secret}」によって自分の意思で動けない・勝手に達せない状況を作られ、淫らに乱れた姿を突きつけられることで一番深い絶頂へ落ちます。`
        :`クライマックスでは「${step2Secret}」を軸に、相手の繕った余裕が剥がれていく反応をダイレクトに引き出す（あるいは熱量で攻守が激しく入れ替わる）展開が最大のカタルシスを生みます。`
    },
    {
      step:'STEP 03 // 余韻：事後のピロートークと救済',
      secretWord:step3Secret,
      title:`果てた直後は「${step3Secret}」が絶対条件`,
      body:`${motiveAndAfterglow} だからこそ行為が終わった直後には「${step3Secret}」を与え、余韻の中で優しく包み込むことで、心身ともに抜け出せないほど深い充足が完成します。`
    },
    {
      step:'STEP 04 // 禁忌：絶対NGの地雷と変容トリガー',
      secretWord:step4Secret,
      title:`絶対タブーは「${step4Secret}」`,
      body:`どれだけ雰囲気が良くても、【${boundaries.length?boundaries.join('／'):'信頼や合意を欠いた一方的な扱い'}】を踏まれた瞬間にスーッと血の気が引いて冷めてしまいます。逆に、【${contexts.length?contexts.join('・'):'深い信頼関係と非日常の空気'}】が揃った夜には、普段見せない裏スイッチが一気に解放されます。`
    }
  ];

  return {
    subStrong,
    maskVsDeep,
    motiveText,
    motiveAndAfterglow,
    sensoryNarrative,
    whisperText,
    manual
  };
}

export function fallbackDossierFromCard(card){
  if(card?.dossier)return card.dossier;
  const traits=new Set(card?.traits||[]);
  const labels=(card?.traits||[]).map(id=>FACETS.find(f=>f.id===id)?.label).filter(Boolean);
  const subStrong=labels.join('・')||(card?.tags||[]).join('・')||'共有されたカルテ';
  const step1Secret=traits.has('lead')?'深く舌を入れるキスと主導権の奪取':traits.has('voice')?'耳元の低い囁きと退路の封鎖':'壁やベッドへの強引な押し倒し';
  const step2Secret=traits.has('restraintReceive')?'両手首の固定×寸止め絶頂管理':traits.has('restraintGive')?'手首のロック×涙目の懇願引き出し':traits.has('masochism')?'余裕を剥がす執拗な焦らしと言葉責め':traits.has('sadism')?'寸止めと執拗な責めによる余裕破壊':'逃げ場のない密着愛撫の重ね掛け';
  const step3Secret=traits.has('receiveCare')?'事後の過剰な抱擁と「いい子だね」の全肯定':traits.has('giveCare')?'乱れた相手を胸に抱きしめる溺愛ケア':'繋がったまま離れない濃密な余韻';
  const step4Secret='合意と文脈を無視した一方的なプレイ';
  return {
    subStrong,
    maskVsDeep:`共有されたカルテでは【${subStrong}】が核として表れています。${card?.quote||''} ${card?.summary||''}`.trim(),
    motiveText:'信頼できる相手と深い熱量を共有したい渇望',
    motiveAndAfterglow:`共有された特徴（${subStrong}）の背景には、普段の仮面を脱いで深い熱量を確かめ合いたい欲求が宿っています。`,
    sensoryNarrative:`特に【${labels.slice(0,2).join('×')||'密着と吐息'}】のスイッチを意識して接することで、より深く波長が重なります。`,
    whisperText:'「こんなに乱れたの、あなたの前だけだよ」',
    manual:[
      {step:'STEP 01 // 導入：理性の剥がし方',secretWord:step1Secret,title:`最初は「${step1Secret}」で日常の仮面を剥がす`,body:`共有された好みに合わせ、「${step1Secret}」から空気を作ることで自然にスイッチが入ります。`},
      {step:'STEP 02 // 絶頂：深層スイッチの押し方',secretWord:step2Secret,title:`クライマックスは「${step2Secret}」でリミッターを外す`,body:`深層の核である「${step2Secret}」を軸に、二人の熱量を重ねていく展開が最も強く響きます。`},
      {step:'STEP 03 // 余韻：事後のピロートークと救済',secretWord:step3Secret,title:`果てた直後は「${step3Secret}」が絶対条件`,body:`行為のあとは「${step3Secret}」で余韻を共有し、安心感の中で落ち着く時間を大切にしてください。`},
      {step:'STEP 04 // 禁忌：絶対NGの地雷と変容トリガー',secretWord:step4Secret,title:`絶対タブーは「${step4Secret}」`,body:`公開カードには詳細なNG項目が含まれないため、実践の前にお互いの境界線を一つずつ確かめ合いましょう。`}
    ]
  };
}

export function diagnose(answers){
  if(!validAnswers(answers))throw Error('回答を確認してください。');
  const signals=selectedSignals(answers),count=s=>signals[s]?.length||0,opportunities=s=>SCENES.filter(q=>!q.self&&answers[q.id]!==null&&has(q,s)).length,strong=s=>count(s)>=2&&count(s)/opportunities(s)>=.35;
  const facets=FACETS.map(f=>{
    const c=count(f.id),opp=opportunities(f.id),pct=opp?Math.round((c/opp)*100):0;
    return {...f,count:c,opportunities:opp,pct,strong:strong(f.id),level:strong(f.id)?'よく選んだ':c?'選んだ場面がある':SCENES.some(q=>!q.self&&answers[q.id]!==null&&has(q,f.id))?'今回は選ばなかった':'まだわからない'};
  });
  let title='まだ名づけていない、好きの余白',quote='好きな場面を、一つずつ。',summary='決め手になる場面は、まだ少なめ。名前に合わせず、自分が選んだ言葉から眺めてみよう。',focus=[];
  const candidates=[];
  const choose=(title,quote,summary,focus)=>candidates.push({title,quote,summary,focus});
  if(strong('switch')&&strong('lead')&&strong('yield'))choose('主従逆転の共犯者','組み伏せる快感も、組み伏せられる恍惚も。','主導権を握って相手を鳴かせる時間と、自分以上の力でねじ伏せられて思考停止する時間の両方を繰り返し選びました。最初に決めた役のまま終わるより、熱量で上下が入れ替わる夜に強く発火します。',['switch','lead','yield']);
  if(strong('sadism')&&strong('masochism'))choose('余裕泥棒の、負けず嫌い','余裕は剥がしたい。自分の理性も、壊されたい。','相手を寸止めで追い詰めて喘がせる加虐心と、自分が翻弄されて限界を超える被虐心の双方が高水準で同居しています。攻める役と受ける役を、どちらも選んだ組み合わせです。',['sadism','masochism']);
  if(strong('lead')&&strong('masochism')&&strong('voice'))choose('囁きで落ちる司令塔','流れは私が支配する。でも、耳元の低い声には抗えない。','主導する側と、追い詰められる側。両方を別々の場面でも選びました。特に耳元の低い囁きや淫らな言葉づかいによって理性のガードが溶ける傾向が鮮明です。',['lead','masochism','voice']);
  if(strong('lead')&&strong('masochism'))choose('隙だらけの司令塔','仕切るのは私。でも限界まで追い詰められると弱い。','進め方は自分で決めたい。でも、いつも余裕のある側でいたいわけではない。相手に執拗に焦らされ翻弄される場面にも、繰り返し惹かれています。',['lead','masochism']);
  if(strong('yield')&&strong('sadism'))choose('手綱を預ける小悪魔','身は委ねる。でも、相手の理性を狂わせる牙は抜かない。','相手のリードには乗りたい。それでも、耳元の吐息や挑発で相手の余裕を崩す一手は手放したくない。身を任せながら相手を狂わせる小悪魔的な組み合わせです。',['yield','sadism']);
  if(strong('lead')&&strong('giveCare'))choose('溺愛の飼い主','逃がさないし、誰より甘く溶かしてあげる。','自分から流れを作り、相手が力を抜いてとろけるところまで徹底的に甘やかしたい。主導権を握ることも、相手を安心させることも、あなたには楽しみのうち。',['lead','giveCare']);
  if(strong('masochism')&&strong('receiveCare')&&strong('intense'))choose('飴と鞭に弱い、強がり','容赦なく乱して。でも終わった瞬間、壊れ物みたいに甘やかして。','理性が飛ぶほど激しい駆け引きに惹かれ、果てた直後は子どものように抱きしめて全肯定されたい。強い刺激と甘い余韻の温度差を、別々の問いでも選んでいます。',['masochism','receiveCare','intense']);
  if(strong('giveCare')&&strong('receiveCare'))choose('甘やかし合う共犯者','ドロドロに溶かしたいし、私も溶かされたい。','相手をいたわる喜びも、自分を無防備に受け止めてもらう安心も欲しい。片方の役に決めず、体温と吐息で境界がなくなるほど甘やかし合う場面を選んでいます。',['giveCare','receiveCare']);
  if(strong('wet')&&strong('space'))choose('余白を飼う、重愛主義者','ベッドでは狂うほど独占して。日常の余白は、侵さないで。','密室での濃密な独占には強く惹かれる。でも、普段の生活まで束縛し合いたいとは限らない。夜の濃さと日常の距離感の両方を選んだ組み合わせです。',['wet','space']);
  if(strong('masochism')&&strong('brat'))choose('わからせ待ちの小悪魔','生意気に挑発したぶん、本気の力で黙らせて。','わざと挑発して相手の本気に火をつけ、最後は力づくで押さえつけられて「参りました」と言わされる展開を、ほかの駆け引きと一緒に選んでいます。',['brat','masochism']);
  if(strong('sadism')&&strong('giveCare'))choose('意地悪な、溺愛主義者','泣くまで焦らし抜いて、最後は誰より優しく抱きしめる。','相手の余裕を崩して喘がせるのが好き。その直後、とろけるまで安心させる側にも惹かれています。意地悪な焦らしと過剰な溺愛をセットで楽しみたい組み合わせです。',['sadism','giveCare']);
  if(strong('exclusive')&&strong('story'))choose('二人だけの共犯者','扉が閉まったら、外のルールはすべて忘れる。','二人にしか通じない淫らな呼び名や主従の約束と、自分だけに見せる乱れた素顔に惹かれています。日常から切り離された背徳の特別さを選んでいます。',['exclusive','story']);
  if(strong('yield')&&strong('receiveCare'))choose('溺愛待ちの忠犬','信頼した相手にだけ、首輪ごと全部預けたい。','判断を手放して相手に任せる時間と、気を張らずに頭を撫でられて甘える時間を選んでいます。信頼できる相手に丸ごと受け止めてもらいたい組み合わせです。',['yield','receiveCare']);
  if(strong('sadism'))choose('余裕泥棒','その取り繕った仮面が、快感で剥がれる瞬間を見せて。','相手の反応を引き出し、余裕を崩す場面を繰り返し選んでいます。堪えきれない吐息や乱れた顔、その一瞬に惹かれる好みが見えました。',['sadism']);
  if(strong('masochism'))choose('翻弄待ちの、負けず嫌い','自分より余裕のある相手に、理性が飛ぶまで追い詰められたい。','自分の余裕が剥がされ、執拗に焦らされたり追い詰められたりする場面を選んでいます。普段の役に関係なく、ペースを乱される快感に惹かれています。',['masochism']);
  if(strong('lead'))choose('密室の司令塔','二人の夜のペースも呼吸も、私の手のひらの中で。','誘うこと、進め方や絶頂のタイミングを決めること。自分から流れを支配する場面を、繰り返し選んでいます。相手を痛めつけたいかどうかとは別の好みです。',['lead']);
  if(strong('yield'))choose('手綱を預ける自由人','考えることをやめて、ただ感じるだけの生き物に戻りたい。','信頼する相手に判断を預ける場面を選んでいます。どう動くか考える役から離れ、相手のリードに深く沈み込む時間に惹かれています。',['yield']);
  if(strong('giveCare'))choose('溺愛を注ぐ甘党','私の腕の中で、力を抜いてとろける顔が見たい。','相手をいたわり、全肯定で甘やかす場面を繰り返し選んでいます。相手が安心しきって乱れることが、自分にとっても最大の悦びになる組み合わせです。',['giveCare']);
  if(strong('receiveCare')&&strong('praise'))choose('褒めでほどける甘党','「いい子だね、可愛いね」の一言で、全部溶けてしまう。','頭を撫でられながら褒めちぎられる言葉と、鎧を脱いで無防備に甘える場面。その両方を繰り返し選んでいます。',['receiveCare','praise']);
  if(strong('receiveCare'))choose('溺愛待ちの甘党','今夜はただ、壊れ物みたいに優しく抱きしめられたい。','受け止めてもらうこと、事後まで優しく抱きしめられて甘えること。気を張らない自分でいられる場面を、繰り返し選んでいます。',['receiveCare']);
  if(strong('voice'))choose('声に弱い収集家','耳元の低い吐息と淫らな実況で、脳の奥から痺れる。','耳元の声や言葉づかいに惹かれる場面を選んでいます。何をされるかだけでなく、どんな声と言葉で追い詰められるかを重視する好みです。',['voice']);
  if(strong('style')&&strong('disarray'))choose('着崩れの観察者','全部脱がさないで。整った服が淫らに乱れる落差に狂う。','服や仕草の細部に惹かれる場面を選んでいます。完全な全裸よりも、整った着衣が崩れていく背徳的なギャップに強い興奮がありそうです。',['style','disarray']);
  if(strong('style'))choose('装いの観察者','服の質感と、所有を示すディテールに目が止まる。','衣装の質感や身体の輪郭、首元のチョーカー、乱れる仕草の細部。視覚的なフェチ記号に惹かれる場面を選びました。',['style']);
  if(strong('exclusive'))choose('特別を集める共犯者','他の誰にも見せない淫らな顔を、私だけのものにしたい。','自分だけに見せる無防備な顔や、二人だけの秘密の特別さに惹かれる場面を選んでいます。',['exclusive']);
  if(strong('story'))choose('二人の世界の演出家','いつもの二人に、日常を忘れる秘密の設定を。','主従の役柄や呼び名、二人だけの背徳的な約束を選んでいます。非日常のシチュエーションに入ると一気にスイッチが入りそうです。',['story']);
  if(strong('restraintGive')&&strong('restraintReceive'))choose('手綱を替える共犯者','縛って焦らす支配も、縛られて懇願する無力感も。','合図を出して寸止めする側と、身動きを封じられて待つ側。どちらにも強く惹かれ、夜によって拘束の役を入れ替えたい組み合わせです。',['restraintGive','restraintReceive']);
  if(strong('restraintGive'))choose('手綱を握る演出家','まだイっていいって言ってない。あなたの自由を私が預かる。','手首を押さえたり、合図が出るまで寸止めで焦らす側を選びました。痛みを与えたいかどうかとは別に、自由と絶頂を管理する支配に惹かれています。',['restraintGive']);
  if(strong('restraintReceive'))choose('自由を預ける冒険家','両手首を押さえつけられ、逃げられない無力感の中で咲く。','身動きを封じられることや、寸止めで焦らされる場面を選びました。普段の性格とは別に、抵抗できない状態で責められる時間に惹かれています。',['restraintReceive']);
  if(strong('painGive')&&strong('painReceive'))choose('刺激を分け合う共犯者','肌に刻む熱も、刻まれる痛みも、二人で限界まで。','痛みを伴う強い刺激を与える側にも、受ける側にも惹かれています。単なる言葉の駆け引きを超えた、生々しい肉体刺激そのものを楽しみたい組み合わせです。',['painGive','painReceive']);
  if(strong('painGive'))choose('刺激を仕掛ける演出家','その肌に、私だけの消えない刻印と熱を残したい。','首元の圧迫やスパンキングなど、痛みを伴う刺激を相手に与える側を選びました。優しい愛撫だけでは届かない領域へ踏み込みたい好みです。',['painGive']);
  if(strong('painReceive'))choose('刺激待ちの冒険家','息が詰まる圧迫と強い突き上げが、真っ白な絶頂へ変わる。','痛みを伴う強い刺激を受ける側を、別々の場面で選びました。誰かに従いたいかどうかとは独立して、強い肉体的負荷そのものに発火しています。',['painReceive']);
  if(strong('scent')&&strong('touch'))choose('距離ゼロの感覚派','汗ばんだ首筋の香りと、隙間なく溶け合う体温に溺れる。','至近距離で立ち上る香りと、素肌が密着する温もり。言葉や役割の駆け引き以上に、粘膜と肌で直接感じ取る生々しい感覚を繰り返し選びました。',['scent','touch']);
  if(strong('scent')&&strong('space'))choose('香りにほどける自由人','普段はクールに距離を保つ。でも、その首筋の香りには勝てない。','一人の時間や自立したペースを大切にしながら、相手の肌や体温の香りには強く惹きつけられるギャップを持っています。',['scent','space']);
  if(strong('scent'))choose('香りにさらわれる感覚派','近づいた瞬間の匂いで、理屈より先に身体が反応する。','声や装いとは別に、密着したときにだけわかる相手の香りと湿度を選びました。行為のあとに残る匂いの余韻にも強く惹かれています。',['scent']);
  if(strong('touch'))choose('温もりの共犯者','焦らすような指先の熱と密着だけで、境界線が溶けていく。','強い演出や痛みよりも、逃げ場のない肌の温もりとねっとりした愛撫の感触を繰り返し選びました。触れ合うこと自体の感度が極めて高いタイプです。',['touch']);
  if(!candidates.length&&(strong('space')||strong('equal')))choose('余白を愛する自由人','近くにいたい。自分のままでも、いたい。','決まった役や強い演出より、対等さや自分のペースを選んでいます。それも、あなたが望む関係の一つです。',['space','equal']);
  if(!candidates.length&&strong('quiet'))choose('飾らない、ふたり派','演出より、自然に近づきたい。','決まった役や強い駆け引きより、自然な会話や穏やかな時間を選びました。ここにない好みも、自分の言葉で足せます。',['quiet']);
  const desires=Object.keys(signals).filter(s=>!s.startsWith('boundary')&&!s.startsWith('context')&&!['neutral','quiet'].includes(s));
  if(!candidates.length&&desires.length)choose('まだ決めない、沼の入口','刺さる場面は、もう少しずつ見つけたい。','いくつか惹かれる場面はあるけれど、同じ好みが繰り返し表れるほどには決まっていません。選んだ言葉を、そのまま持ち帰ってみよう。',desires.slice(0,2));
  if(!candidates.length&&answers.filter(a=>a===0).length>=12)choose('選択肢の外にいる自由人','その好き、まだ選択肢にない。','多くの場面で「今回はなし」を選びました。無関心と決めつけず、ここにない好みを自分の言葉で足してみよう。',[]);
  const fit=c=>c.focus.length?c.focus.reduce((n,s)=>n+count(s)/Math.max(1,opportunities(s)),0)/c.focus.length+Math.min(2,c.focus.length-1)*.1:0;
  if(candidates.length)({title,quote,summary,focus}=candidates.sort((a,b)=>fit(b)-fit(a)||Number(b.focus.some(s=>['scent','touch','voice','style','restraintGive','restraintReceive','painGive','painReceive'].includes(s)))-Number(a.focus.some(s=>['scent','touch','voice','style','restraintGive','restraintReceive','painGive','painReceive'].includes(s))))[0]);
  const self=answers[0]===null?null:bits(answers[0])[0];
  let gap=self===0&&strong('yield')?'リード派のつもりが、任せる時間も欲しかった。':self===1&&strong('lead')?'委ね派のつもりが、主導権も欲しかった。':null;
  if(!gap){
    if(self===0&&(strong('restraintReceive')||strong('masochism')))gap='リード派のつもりが、深層では組み伏せられて無力化されたい裏スイッチが発火しています。';
    else if((strong('painReceive')||strong('masochism')||strong('restraintReceive'))&&strong('receiveCare'))gap='行為中は容赦なく乱されたいのに、直後には子どものように全肯定で甘やかされたい「飴と鞭の落差」が核にあります。';
  }
  const tags=facets.filter(f=>f.strong).sort((a,b)=>b.count/b.opportunities-a.count/a.opportunities||b.count-a.count).slice(0,3).map(f=>f.label);
  const boundaries=Object.keys(BOUNDARIES).filter(s=>count(s)).map(s=>BOUNDARIES[s]);
  const contexts=Object.keys(CONTEXTS).filter(s=>count(s)).map(s=>CONTEXTS[s]);
  const dossier=buildDeepDossier(answers,facets,signals,title,gap,boundaries,contexts);
  return {instrument:INSTRUMENT,title,quote,summary,gap,facets,tags,focus,evidence:evidenceFor(answers,signals,focus),boundaries,contexts,dossier,answered:answers.filter(a=>a!==null).length,signals:Object.fromEntries(Object.entries(signals).map(([s,ids])=>[s,ids.length]))};
}
export function publicCard(profile,tags=profile.tags,personal=''){
  return {v:1,instrument:profile.instrument,title:profile.title,quote:(profile.gap||profile.quote).slice(0,120),summary:(personal||profile.summary).slice(0,240),tags:tags.slice(0,3),traits:profile.facets.filter(f=>f.strong).sort((a,b)=>b.count/b.opportunities-a.count/a.opportunities||b.count-a.count).slice(0,4).map(f=>f.id)};
}
export function listingCard(profile){const card=publicCard(profile);return {...card,summary:'',traits:card.traits.slice(0,3)};}
const clean=s=>typeof s==='string'&&s===s.trim()&&!/[<>\u0000-\u001f]/.test(s);
export function validCard(p){return !!p&&typeof p==='object'&&!Array.isArray(p)&&Object.keys(p).every(k=>['v','instrument','title','quote','summary','tags','traits'].includes(k))&&p.v===1&&typeof p.instrument==='string'&&p.instrument.length<=40&&clean(p.title)&&p.title.length>=1&&p.title.length<=40&&clean(p.quote)&&p.quote.length<=120&&clean(p.summary)&&p.summary.length<=240&&Array.isArray(p.tags)&&p.tags.length<=3&&p.tags.every(t=>clean(t)&&t.length>=1&&t.length<=24)&&Array.isArray(p.traits)&&p.traits.length<=4&&new Set(p.traits).size===p.traits.length&&p.traits.every(id=>FACETS.some(f=>f.id===id));}
export function compare(a,b){
  const left=new Set(a.traits||a.facets?.filter(f=>f.strong).map(f=>f.id)),right=new Set(b.traits||b.facets?.filter(f=>f.strong).map(f=>f.id));
  const lines=[];
  const pair=(x,y)=>left.has(x)&&right.has(y)||right.has(x)&&left.has(y);
  if(pair('lead','yield'))lines.push({title:'主導したい側と、任せたい側',text:'手綱を握る側と委ねる側が自然に噛み合います。どんなことを任せたいか、一つずつ確かめてみよう。'});
  if(pair('sadism','masochism'))lines.push({title:'翻弄する側と、翻弄されたい側',text:'余裕を剥がしたい熱と、追い詰められたい熱が直結します。焦らし方や言葉の強さは、それぞれの希望を大切に。'});
  if(pair('restraintGive','restraintReceive'))lines.push({title:'自由を預かる側と、預ける側',text:'手首の固定や寸止め管理のニーズが双方向で一致しています。任せる範囲と終わりの合図を、先に一緒に決めてみよう。'});
  if(pair('painGive','painReceive'))lines.push({title:'刺激を与える側と、受ける側',text:'強い負荷や圧迫を快楽へ変える波長が重なります。望む刺激と望まないことは、名前から決めずに確かめよう。'});
  if(pair('giveCare','receiveCare'))lines.push({title:'甘やかす側と、甘えたい側',text:'行為直後に頭を撫でて全肯定したい側と、無防備に溶けたい側が重なります。うれしい言葉や落ち着ける過ごし方が話題になりそう。'});
  if(left.has('lead')&&right.has('lead'))lines.push({title:'二人とも、流れを作りたい',text:'どちらが先に相手を鳴かせるか、交代したいか一緒に決めたいか。そこを確かめると面白そう。'});
  if(pair('wet','space'))lines.push({title:'関係の濃さと、一人の時間',text:'密室での濃さと、一人で休む時間のバランスを、それぞれに聞いてみよう。'});
  const covered=new Set();
  if(pair('lead','yield')){covered.add('lead');covered.add('yield');}
  if(left.has('lead')&&right.has('lead'))covered.add('lead');
  if(pair('sadism','masochism')){covered.add('sadism');covered.add('masochism');}
  if(pair('restraintGive','restraintReceive')){covered.add('restraintGive');covered.add('restraintReceive');}
  if(pair('painGive','painReceive')){covered.add('painGive');covered.add('painReceive');}
  if(pair('giveCare','receiveCare')){covered.add('giveCare');covered.add('receiveCare');}
  if(pair('wet','space')){covered.add('wet');covered.add('space');}
  const common=FACETS.filter(f=>left.has(f.id)&&right.has(f.id)&&!covered.has(f.id));
  if(common.length)lines.push({title:'共通して選んだ好み',text:common.slice(0,2).map(f=>f.label).join('、')+'。同じフェチや空気感を共有できる共犯者になれそうです。'});
  const bLeft=new Set(a.boundaries||[]),bRight=new Set(b.boundaries||[]);
  if((left.has('painGive')&&bRight.has(BOUNDARIES.boundaryPain))||(right.has('painGive')&&bLeft.has(BOUNDARIES.boundaryPain))){
    lines.push({title:'境界線の事前確認（痛み）',text:'片方に刺激を与えたい熱があり、もう片方に「痛みは受けたくない」境界線があります。痛みではなく拘束や焦らしへ熱を向けると安心です。'});
  }
  return lines.length?lines.slice(0,3):[{title:'まずは、好きな場面を一つずつ',text:'決め手になる共通点は、まだ少なめ。二つ名がついた理由から、聞いてみよう。'}];
}
