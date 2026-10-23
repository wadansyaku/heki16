import {dossierById} from './dossier-catalog.mjs';
import {COPY,QUESTION_EDITS} from './copy.mjs';
import {ART_VERSION,preferredArt,validArt} from './art.mjs';
// Choice order carries no score. Only explicitly selected desires are evidence.
// Upgraded R-18 Visceral & High-Volume Dossier Edition v2 (nocturne24-2 compatible drop-in for heki16)
export const INSTRUMENT='nocturne24-4';
export const PREVIOUS_INSTRUMENT='nocturne24-1';
export const CONSENT='nocturne-2026-10-21b';
export const PREVIOUS_CONSENT='nocturne-2026-10-21';
export const LEGACY_CONSENT='nocturne-2026-10-19';
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
].map((q,id)=>{
  const edit=QUESTION_EDITS.find(e=>e.id===id);
  return {...q,id,text:edit?.text||q.text,persp:edit?.perspectiveText||q.persp,chapter:Math.floor(id/6),choices:q.choices.map((c,value)=>{
    const rejection=edit?.declines?.find(d=>d.choice===value),override=edit?.signalOverrides?.find(d=>d.choice===value);
    return {...c,value,label:edit?.choices[value]||c.label,signals:override?.signals||c.signals,rejects:rejection?.facets||[],rejectionScope:rejection?.scope||'scene',rejectionLabel:rejection?.label||'',...(edit?.perspectiveChoices?.[value]?{persp:edit.perspectiveChoices[value]}:{})};
  })};
});

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
export const GENDERS={woman:'女性',man:'男性',diverse:COPY.genderDiverse,unset:'答えない'};
export const PROFILE_OPTIONS=Object.fromEntries(Object.entries({mood:MOODS,age:AGES,gender:GENDERS}).map(([key,options])=>[key,Object.fromEntries(Object.entries(options).filter(([value])=>value!=='unset'))]));
export const BOUNDARIES={boundaryPain:'痛みは受けたくない',boundaryWords:'きつい言葉は苦手',boundaryControl:'生活までの束縛は望まない',boundaryRole:'役を決めつけないで'};
export const CONTEXTS={contextTrust:'信頼で変わる',contextMood:'気分や疲れ具合で変わる',contextPartner:'相手によって変わる',contextScene:'場面によって変わる',contextStable:'好みは比較的変わらない'};

const has=(q,signal)=>q.choices.some(c=>c.signals.includes(signal));
export function validAnswers(a){
  return Array.isArray(a)&&a.length===SCENES.length&&a.every((v,i)=>v===null||Number.isInteger(v)&&v>=1&&v<=31&&bits(v).length<=(SCENES[i].single?1:SCENES[i].boundary?4:2)&&!(SCENES[i].boundary&&(v&16)&&v!==16)&&!choiceConflict(SCENES[i],v));
}
export function choiceConflict(q,mask){
  const chosen=q.choices.filter((c,i)=>(mask&(1<<i))!==0),affirmed=new Set(chosen.flatMap(c=>c.signals));
  return chosen.some(c=>c.rejects.some(id=>affirmed.has(id)));
}
export function selectedRejections(answers,gender='diverse'){return SCENES.flatMap(q=>bits(answers[q.id]||0).filter(i=>q.choices[i].rejects.length).map(i=>({question:q.id,label:choiceLabel(q.choices[i],gender),facets:q.choices[i].rejects,scope:q.choices[i].rejectionScope})));}
export const bits=mask=>[0,1,2,3,4].filter(i=>(mask&(1<<i))!==0);
export const emptyAnswers=()=>Array(SCENES.length).fill(null);
export function selectedSignals(a){
  const out={};
  SCENES.forEach(q=>{if(q.self||a[q.id]===null)return;const seen=new Set(bits(a[q.id]).flatMap(i=>q.choices[i].signals));for(const s of seen)(out[s]??=[]).push(q.id);});
  return out;
}
function evidenceFor(answers,signals,focus,gender='diverse'){
  const remaining=new Set(focus),chosen=[],ids=[...new Set(focus.flatMap(s=>signals[s]||[]))];
  while(chosen.length<3&&ids.some(id=>!chosen.includes(id))){const ranked=ids.filter(id=>!chosen.includes(id)).sort((a,b)=>[...remaining].filter(s=>signals[s]?.includes(b)).length-[...remaining].filter(s=>signals[s]?.includes(a)).length||a-b),id=ranked[0];chosen.push(id);for(const s of remaining)if(signals[s]?.includes(id))remaining.delete(s);}
  return chosen.map(id=>({id,question:sceneText(SCENES[id],gender),answers:bits(answers[id]).map(i=>SCENES[id].choices[i]).filter(c=>!c.rejects.length&&c.signals.some(s=>focus.includes(s))).map(c=>choiceLabel(c,gender))}));
}

function buildDeepDossier(answers,facets,signals,title,gap,boundaries,contexts,gender='diverse'){
  const selected=ids=>ids.flatMap(id=>bits(answers[id]||0).map(i=>({id,choice:SCENES[id].choices[i]}))).filter(x=>!x.choice.rejects.length);
  const display=rows=>[...new Set(rows.map(x=>choiceLabel(x.choice,gender)))].join(' ／ ');
  const roles=selected([1,2,3,4,5,17,18]).filter(x=>x.choice.signals.some(s=>['lead','yield','sadism','masochism','giveCare','receiveCare'].includes(s))).slice(0,2);
  const senses=selected([7,12,13,14]).filter(x=>x.choice.signals.some(s=>['voice','scent','touch','style'].includes(s))).slice(0,2);
  const after=selected([11,23]).slice(0,2);
  const rejected=selectedRejections(answers,gender).map(x=>x.label);
  const no= [...new Set([...boundaries,...rejected])];
  const roleText=display(roles)||COPY.noSelection,senseText=display(senses)||COPY.noSensory,afterText=display(after)||COPY.noAfterglow;
  const selfIndex=bits(answers[0]||0)[0],selfText=selfIndex===undefined?'':choiceLabel(SCENES[0].choices[selfIndex],gender);
  return {
    subStrong:facets.filter(f=>f.strong).slice(0,4).map(f=>f.label).join('・')||COPY.resultSubtitle,
    maskVsDeep:gap||selfText||COPY.noSelection,
    motiveText:display(selected([20]))||COPY.noMotive,
    motiveAndAfterglow:display(selected([20]))||COPY.noMotive,
    sensoryNarrative:senseText,whisperText:display(selected([23]))||COPY.noAfterglow,
    manual:[
      {step:COPY.manualRoleTitle,title:COPY.manualRoleTitle,body:roleText,secretWord:'',evidence:roles.map(x=>x.id)},
      {step:COPY.manualSenseTitle,title:COPY.manualSenseTitle,body:senseText,secretWord:'',evidence:senses.map(x=>x.id)},
      {step:COPY.manualAfterTitle,title:COPY.manualAfterTitle,body:afterText,secretWord:'',evidence:after.map(x=>x.id)},
      {step:COPY.manualBoundaryTitle,title:COPY.manualBoundaryTitle,body:no.join(' ／ ')||COPY.noBoundary,secretWord:'',evidence:[]}
    ]
  };
}
// A public snapshot has no private dossier. Never infer one on the recipient's behalf.
export function fallbackDossierFromCard(card){
 return {subStrong:'',maskVsDeep:card?.summary||'',motiveText:'',motiveAndAfterglow:'',sensoryNarrative:'',whisperText:'',manual:[]};
}

export function diagnose(answers,gender='diverse'){
  if(!validAnswers(answers))throw Error('回答を確認してください。');
  const signals=selectedSignals(answers),rejections=selectedRejections(answers,gender),denied=new Set(rejections.filter(r=>r.scope==='general').flatMap(r=>r.facets)),count=s=>signals[s]?.length||0,opportunities=s=>SCENES.filter(q=>!q.self&&answers[q.id]!==null&&has(q,s)).length,strong=s=>!denied.has(s)&&count(s)>=2&&count(s)/opportunities(s)>=.35;
  const facets=FACETS.map(f=>{
    const c=count(f.id),opp=opportunities(f.id),pct=opp?Math.round((c/opp)*100):0;
    return {...f,count:c,opportunities:opp,pct,strong:strong(f.id),level:strong(f.id)?'よく選んだ':c?'選んだ場面がある':SCENES.some(q=>!q.self&&answers[q.id]!==null&&has(q,f.id))?'今回は選ばなかった':'まだわからない'};
  });
  let {title,quote,summary,focus}=dossierById('not-yet-named');
  const candidates=[];
  const choose=(id,override)=>{const entry=dossierById(id);if(!entry)throw Error('Unknown dossier: '+id);const {title,quote,summary,focus}=entry;candidates.push({title,quote,summary,focus:override||focus});};
  if(strong('switch')&&strong('lead')&&strong('yield'))choose('role-reversal');
  if(strong('sadism')&&strong('masochism'))choose('playful-rivals');
  if(strong('lead')&&strong('masochism')&&strong('voice'))choose('whispering-leader');
  if(strong('lead')&&strong('masochism'))choose('unguarded-leader');
  if(strong('yield')&&strong('sadism'))choose('playful-follower');
  if(strong('lead')&&strong('giveCare'))choose('caring-leader');
  if(strong('masochism')&&strong('receiveCare')&&strong('intense'))choose('praise-and-play');
  if(strong('giveCare')&&strong('receiveCare'))choose('mutual-care');
  if(strong('wet')&&strong('space'))choose('closeness-and-space');
  if(strong('masochism')&&strong('brat'))choose('challenging-follower');
  if(strong('sadism')&&strong('giveCare'))choose('playful-carer');
  if(strong('exclusive')&&strong('story'))choose('private-accomplices');
  if(strong('yield')&&strong('receiveCare'))choose('devoted-follower');
  if(strong('sadism'))choose('playful-instigator');
  if(strong('masochism'))choose('playful-receiver');
  if(strong('lead'))choose('private-leader');
  if(strong('yield'))choose('trusting-follower');
  if(strong('giveCare'))choose('generous-carer');
  if(strong('receiveCare')&&strong('praise'))choose('praise-receiver');
  if(strong('receiveCare'))choose('gentle-receiver');
  if(strong('voice'))choose('voice-collector');
  if(strong('style')&&strong('disarray'))choose('changing-style');
  if(strong('style'))choose('style-observer');
  if(strong('exclusive'))choose('private-collector');
  if(strong('story'))choose('world-builder');
  if(strong('restraintGive')&&strong('restraintReceive'))choose('exchanging-control');
  if(strong('restraintGive'))choose('control-director');
  if(strong('restraintReceive'))choose('trust-adventurer');
  if(strong('painGive')&&strong('painReceive'))choose('mutual-intensity');
  if(strong('painGive'))choose('intensity-director');
  if(strong('painReceive'))choose('intensity-adventurer');
  if(strong('scent')&&strong('touch'))choose('close-senses');
  if(strong('scent')&&strong('space'))choose('scent-and-space');
  if(strong('scent'))choose('scent-senses');
  if(strong('touch'))choose('warmth-accomplice');
  if(!candidates.length&&(strong('space')||strong('equal')))choose('independent-closeness');
  if(!candidates.length&&strong('quiet'))choose('natural-togetherness');
  const desires=Object.keys(signals).filter(s=>!s.startsWith('boundary')&&!s.startsWith('context')&&!['neutral','quiet'].includes(s));
  if(!candidates.length&&desires.length)choose('not-yet-settled',desires.slice(0,2));
  const fit=c=>c.focus.length?c.focus.reduce((n,s)=>n+count(s)/Math.max(1,opportunities(s)),0)/c.focus.length+Math.min(2,c.focus.length-1)*.1:0;
  if(candidates.length)({title,quote,summary,focus}=candidates.sort((a,b)=>fit(b)-fit(a)||Number(b.focus.some(s=>['scent','touch','voice','style','restraintGive','restraintReceive','painGive','painReceive'].includes(s)))-Number(a.focus.some(s=>['scent','touch','voice','style','restraintGive','restraintReceive','painGive','painReceive'].includes(s))))[0]);
  const self=answers[0]===null?null:bits(answers[0])[0];
  let gap=self===0&&strong('yield')?'リード派のつもりが、任せる時間も欲しかった。':self===1&&strong('lead')?'委ね派のつもりが、主導権も欲しかった。':null;
  if(focus.length)summary=evidenceFor(answers,signals,focus,gender).slice(0,2).flatMap(e=>e.answers).join(' ／ ');
  const tags=facets.filter(f=>f.strong).sort((a,b)=>b.count/b.opportunities-a.count/a.opportunities||b.count-a.count).slice(0,3).map(f=>f.label);
  const boundaries=[...new Set([...Object.keys(BOUNDARIES).filter(s=>count(s)).map(s=>BOUNDARIES[s]),...rejections.filter(r=>r.scope==='general').map(r=>r.label)])];
  const contexts=Object.keys(CONTEXTS).filter(s=>count(s)).map(s=>CONTEXTS[s]);
  const dossier=buildDeepDossier(answers,facets,signals,title,gap,boundaries,contexts,gender);
  return {instrument:INSTRUMENT,title,quote,summary,gap,facets,tags,focus,evidence:evidenceFor(answers,signals,focus,gender),boundaries,contexts,dossier,rejections,art:preferredArt({focus,title}),answered:answers.filter(a=>a!==null).length,signals:Object.fromEntries(Object.entries(signals).map(([s,ids])=>[s,ids.length]))};
}
export function publicCard(profile,tags=profile.tags||[],personal='',art){
  return {v:2,instrument:profile.instrument,title:profile.title,quote:(profile.gap||profile.quote||'').slice(0,120),summary:(personal||profile.summary||'').slice(0,240),tags:tags.slice(0,3),traits:(profile.facets||[]).filter(f=>f.strong&&tags.slice(0,3).includes(f.label)).sort((a,b)=>b.count/b.opportunities-a.count/a.opportunities||b.count-a.count).slice(0,3).map(f=>f.id),art:validArt(art)?art:preferredArt(profile),artVersion:ART_VERSION};
}
export function listingCard(profile,art){const card=publicCard(profile,undefined,'',art);return {...card,traits:card.traits.slice(0,3)};}
const clean=s=>typeof s==='string'&&s===s.trim()&&!/[<>\u0000-\u001f]/.test(s);
export function validCard(p){
 const extra=p?.v===2?['art','artVersion']:[];
 return !!p&&typeof p==='object'&&!Array.isArray(p)&&Object.keys(p).every(k=>['v','instrument','title','quote','summary','tags','traits',...extra].includes(k))&&[1,2].includes(p.v)&&(p.v===1||validArt(p.art)&&p.artVersion===ART_VERSION)&&typeof p.instrument==='string'&&p.instrument.length<=40&&clean(p.title)&&p.title.length>=1&&p.title.length<=40&&clean(p.quote)&&p.quote.length<=120&&clean(p.summary)&&p.summary.length<=240&&Array.isArray(p.tags)&&p.tags.length<=3&&p.tags.every(t=>clean(t)&&t.length>=1&&t.length<=24)&&Array.isArray(p.traits)&&p.traits.length<=4&&new Set(p.traits).size===p.traits.length&&p.traits.every(id=>FACETS.some(f=>f.id===id));
}
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
  const warnings=lines.filter(l=>l.title==='境界線の事前確認（痛み）');
  return lines.length?[...warnings,...lines.filter(l=>!warnings.includes(l)).slice(0,3)]:[{title:'まずは、好きな場面を一つずつ',text:'決め手になる共通点は、まだ少なめ。二つ名がついた理由から、聞いてみよう。'}];
}
