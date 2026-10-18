// Canonical content. Order is editorial, stable across resume and review.
export const INSTRUMENT='unified40-1';
export const CONSENT='diagnosis-2026-10-18';
export const CHAPTERS=[
  "主導権と駆け引き",
  "愛の重さと距離感",
  "ギャップと五感",
  "甘さとスリル",
  "ふたりの場面"
];
export const QUESTIONS=[
  {
    "id": 0,
    "text": "二人きりでは、自分がペースを握り、相手の余裕が少しずつ剥がれていく過程をコントロールしたい。",
    "chapter": 0,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "まず私から、ふたりのペースを決めたい",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "相手を見ながら、自分からリードしたい",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "きっかけだけは自分からつくりたい",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "自分が進めることにはあまりこだわらない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "自分がコントロールする展開は好まない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 1,
    "text": "信頼する相手に「もう逃がさない」と主導権を握られ、頭を空っぽにして委ねたい。",
    "chapter": 0,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "信頼できる相手に、安心して全部委ねたい",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "大事な流れは相手に任せたい",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "少しだけ判断を預けてみたい",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "任せきる展開にはあまり惹かれない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "信頼していても、全部委ねたくはない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 2,
    "text": "相手の照れた顔や困った顔を見たくて、意地悪な質問や焦らしを仕掛けたくなる。",
    "chapter": 0,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "照れた反応を見たくて、つい仕掛けたくなる",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "小さな駆け引きを長く楽しみたい",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "軽くからかうくらいは楽しい",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "反応を引き出すことには淡泊",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "意地悪で反応を楽しむ展開は好まない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 3,
    "text": "「いい子だね」「可愛いね」と褒められ、頭を撫でられるように甘やかされたい。",
    "chapter": 0,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "「よく頑張ったね」の一言で、全部ほどける",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "たっぷり褒められ、甘やかされたい",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "時々優しく労われると嬉しい",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "褒められることはあまり求めない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "そのように扱われることは望まない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 4,
    "text": "相手にリードされる場面でも、自分の一言で相手を照れさせたり、余裕を崩したりしたい。",
    "chapter": 0,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "相手にリードされても、私が照れさせたい",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "委ねながらも、反応を引き出したい",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "軽くからかうくらいは好き",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "仕掛けることにはあまり惹かれない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "リードされる時は、からかいたくない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 5,
    "text": "自分が流れを決めている場面でも、相手の言葉や駆け引きに翻弄され、余裕をなくしてみたい。",
    "chapter": 0,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "主導しながらも、余裕を奪われたい",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "自分の段取りでも、翻弄されてみたい",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "少し照れさせられるのは好き",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "自分の余裕はあまり崩されたくない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "主導している時は、翻弄されたくない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 6,
    "text": "相手が甘えてくれば主導したいし、相手が強気なら委ねたい。どちらの役にも惹かれる。",
    "chapter": 0,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "主導するのも委ねるのも、自分らしい",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "相手によって自然に役割が変わる",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "たまに役割を替えるのは楽しそう",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "役割が変わることはあまりない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "攻守を切り替えることには惹かれない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 7,
    "text": "二人だけのルールや合図を決めるなら、どんな役回りに惹かれる？",
    "chapter": 0,
    "kind": "scene",
    "choices": [
      {
        "value": 0,
        "label": "自分が決めて、相手に乗ってほしい",
        "signals": {
          "lead": 1
        }
      },
      {
        "value": 1,
        "label": "相手が決めたことに、応じたい",
        "signals": {
          "yield": 1
        }
      },
      {
        "value": 2,
        "label": "決める役を、交代したい",
        "signals": {
          "lead": 1,
          "yield": 1,
          "switch": 1
        }
      },
      {
        "value": 3,
        "label": "対等に相談する方が好き",
        "signals": {}
      },
      {
        "value": 4,
        "label": "どれもまだピンとこない",
        "signals": {}
      }
    ]
  },
  {
    "id": 8,
    "text": "「この人には自分しかいない、自分にもこの人しかいない」という、閉じた共依存の関係にロマンを感じる。",
    "chapter": 1,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "「あなたが特別」と互いに深く確かめたい",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "ふたりだけの世界に長く浸りたい",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "近い距離で過ごす時間は好き",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "密着した関係を強くは求めない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "互いがいないと成り立たない関係は望まない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 9,
    "text": "好きな相手のことは全部知りたいし、誰より近い場所を自分が独占したい。",
    "chapter": 1,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "誰より近い場所を、私だけのものにしたい",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "相手の秘密まで深く知りたい",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "少し独占したくなることはある",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "相手のすべてを知ることは求めない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "独占したい感覚はない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 10,
    "text": "好きな相手から強い嫉妬や独占欲を向けられると、特別に求められている感じがして惹かれる。",
    "chapter": 1,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "強く独占されるほど、特別だと感じる",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "嫉妬を向けられると強く惹かれる",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "少しの嫉妬なら嬉しい",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "独占欲にはあまり惹かれない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "束縛や嫉妬は望まない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 11,
    "text": "普段は自立してクールなのに、二人きりでだけ熱量が上がる関係に一番燃える。",
    "chapter": 1,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "普段の自立と、ふたりだけの熱量が両方ほしい",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "会わない時間の余白も大切にしたい",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "程よく距離があると心地よい",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "クールな距離感にはあまり惹かれない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "距離を置くスタイルには全く惹かれない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 12,
    "text": "「あなたなしじゃダメ」と重い感情を向けられると、引くよりも強く求められたくなる。",
    "chapter": 1,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "重い気持ちも、まず抱きとめたい",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "深い執着を向けられると強く心が動く",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "頼ってもらうと少し嬉しい",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "強い執着には少し戸惑う",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "支えを一人に集中する関係は望まない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 13,
    "text": "会わない時間は互いに自分の世界を持ち、会うときだけ濃くなる関係の方が刺さる。",
    "chapter": 1,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "会うときの濃さと、別々の世界が両方ほしい",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "離れる時間も、熱量の一部だと思う",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "一人の時間も少しほしい",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "別々の世界を持つことにはこだわらない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "離れる余白はほとんど求めない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 14,
    "text": "相手に全部を見せるより、まだ読まれていない自分を残したまま駆け引きしたい。",
    "chapter": 1,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "手の内を明かさず、駆け引きしたい",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "まだ読まれていない部分を残したい",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "少し謎があるくらいは好き",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "自分を隠すことには惹かれない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "全部見せる方が好き",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 15,
    "text": "同じ相手とでも、その日の空気で、主導する側と委ねる側が入れ替わる展開に惹かれる。",
    "chapter": 1,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "同じ相手でも、攻守が入れ替わるのが好き",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "その日の空気で役割を替えたい",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "たまに交代するのは楽しそう",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "同じ相手なら役割はあまり変えたくない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "役割を入れ替えたいとは思わない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 16,
    "text": "普段は完璧で強気な相手が、自分の前でだけ弱さを見せる展開に強く惹かれる。",
    "chapter": 2,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "普段との落差に、物語ごと惹かれる",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "自分だけが知る弱さに心が動く",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "意外な一面を見るのは好き",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "立場の変化はあまり気にならない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "立場逆転の設定は全く響かない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 17,
    "text": "指先、首筋、眼鏡を外す仕草など、特定のパーツや細かい動きに目が離せなくなる。",
    "chapter": 2,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "手や仕草の記憶だけで、その人を思い出す",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "特定のパーツや動きにいつも目が行く",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "ふとした仕草が気になることはある",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "細かな外見にはあまり目が行かない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "身体のディテールで惹かれることはない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 18,
    "text": "追い詰められた相手を自分だけが救うような、感情の振れ幅が大きい関係に惹かれる。",
    "chapter": 2,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "傷つき、支え合う物語がいちばん心に残る",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "感情が揺れ動く展開に深く入り込む",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "少し切ない背景があると惹かれる",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "極限の感情にはあまり惹かれない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "苦しさを含むドラマは選びたくない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 19,
    "text": "好みの声や装いなら、複雑な背景がなくても一撃で沼る。",
    "chapter": 2,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "声や装いのひとつで、強く惹かれてしまう",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "言葉より先に、声の響きが残る",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "好みの声や装いだと少し気になる",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "五感への刺激はあまり決め手にならない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "属性だけで惹かれることは全くない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 20,
    "text": "関係の背景より、体格差、スーツ、見上げる視線など、見た目の構図が先に刺さる。",
    "chapter": 2,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "視線や体格の構図が、好みの中心にある",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "装いやシルエットをつい見てしまう",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "好きな雰囲気の見た目はある",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "ビジュアルの条件は重視しない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "構図や装いは全く決め手にならない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 21,
    "text": "人前では真面目でクールな相手が、二人きりでだけ大胆な態度や言葉に変わるところを見たい。",
    "chapter": 2,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "ドアが閉まって、雰囲気が変わる瞬間が好き",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "ふたりきりでだけ変わる態度に惹かれる",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "普段と少し違う顔が見たい",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "特別な豹変は求めていない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "人前と密室の大きな落差は好まない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 22,
    "text": "スーツ、眼鏡、手袋などの禁欲的な装いが、密室で少しずつ崩れていく過程に弱い。",
    "chapter": 2,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "整った装いがほどける、小さな変化が好き",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "眼鏡や手袋を外す仕草に惹かれる",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "きちんとした装いは少し気になる",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "装いの変化はあまり気にならない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "衣装の演出には全く惹かれない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 23,
    "text": "「なぜこの二人なのか」という積み重ねや、言葉の意味があるほど気持ちが入る。",
    "chapter": 2,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "「なぜこのふたりなのか」が、好みの中心",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "関係性やセリフの背景に深く惹かれる",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "背景が少しあると気持ちが入る",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "物語の設定はあまり気にしない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "背景の設定で気持ちが変わることはない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 24,
    "text": "二人だけの秘密や、「ほかの人には絶対にしない」という少し背徳的なスリルがあるほど燃える。",
    "chapter": 3,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "ふたりだけの秘密があると、一気に惹かれる",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "誰にも見せない特別な一面がほしい",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "小さな秘密を共有すると嬉しい",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "秘密があっても特別には感じない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "秘密や背徳感を関係に持ち込みたくない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 25,
    "text": "駆け引きより、互いを全肯定して甘やかす、聖域のような関係に浸りたい。",
    "chapter": 3,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "安心できる居場所で、互いを丸ごと肯定したい",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "穏やかに甘やかし合う時間がいちばん好き",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "最後に安心できれば嬉しい",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "甘い安心感を強くは求めない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "無条件に甘やかす展開は好まない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 26,
    "text": "恥ずかしい本音を言わせたり、言わされたりするやりとりに強く惹かれる。",
    "chapter": 3,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "気持ちを言葉にする駆け引きが好みの中心",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "照れながら本音を交わす時間が好き",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "少し照れる会話なら楽しめる",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "照れる演出はあまり求めない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "羞恥を楽しむやりとりは望まない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 27,
    "text": "リボンや二人だけのルールで自由を預ける演出に、美しさや特別感を感じる。",
    "chapter": 3,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "結び目や小物の象徴性に、特別な美しさを感じる",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "合意した特別なルールや小物に惹かれる",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "演出として少し興味がある",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "象徴的な拘束にはあまり惹かれない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "物理的にも象徴的にも拘束は望まない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 28,
    "text": "相手の生活まで丸ごと世話を焼いて、何も考えなくていいほど甘やかしたい。",
    "chapter": 3,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "日々の小さなことまで、丸ごと世話を焼きたい",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "頼ってもらい、居場所をつくりたい",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "時々世話をするのは好き",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "世話を焼く役はあまり望まない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "相手の生活を抱え込む役は好まない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 29,
    "text": "大好きな相手に決断を預け、ペットのように撫でられ、可愛がられる時間を過ごしたい。",
    "chapter": 3,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "安心できる人の前で、何も考えず甘えたい",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "決断を預け、たっぷり労われたい",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "たまには肩の荷を下ろしたい",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "甘えて任せることは少ない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "ペットのように可愛がられる展開は好まない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 30,
    "text": "相手の弱さや秘密を「自分だけが知っている」状態にしたい。",
    "chapter": 3,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "明るい顔だけでなく、弱さまで大切に知りたい",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "自分だけに話せる場所になりたい",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "打ち明けてもらうと少し嬉しい",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "過去まで知ることは強く求めない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "自分だけが知る状態には惹かれない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 31,
    "text": "強い駆け引きの後ほど、最後は抱きしめ合い、安心してほどける時間がほしい。",
    "chapter": 3,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "最後の安心と振り返りまで、絶対に大切にしたい",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "互いの気持ちを確かめる時間がほしい",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "少し落ち着く時間があると嬉しい",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "特別なケアの時間はあまり求めない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "ケアを特別な儀式にしたいとは思わない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 32,
    "text": "生意気で強がりな相手を、余裕を持って受け止め、最後は自分に素直にさせたい。",
    "chapter": 4,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "強がりの奥にある素直さを、私が引き出したい",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "軽い挑発を余裕で受け止めたい",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "冗談交じりの駆け引きは好き",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "強がりを解く役にはあまり惹かれない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "挑発を受けて主導する展開は好まない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 33,
    "text": "素直に従うより、わざと挑発して、相手に「わからせ」られたい。",
    "chapter": 4,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "少し挑んだ私を、相手に受け止めてほしい",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "強がりまでわかってくれる相手に惹かれる",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "軽口を返し合うくらいなら楽しい",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "挑発する役にはあまり惹かれない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "挑発から主導を委ねる展開は望まない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 34,
    "text": "普通の恋人関係より、主君と従者、共犯者など、二人だけの役割や約束がある関係に燃える。",
    "chapter": 4,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "互いに選んだ役割や約束の文脈に惹かれる",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "明確な役割があると気持ちが入る",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "物語として少し興味がある",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "役割の設定はあまり求めない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "役割や契約を決める関係は好まない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 35,
    "text": "二人きりで、余裕が崩れる瞬間。自分が入りたいのはどの場面？",
    "chapter": 4,
    "kind": "scene",
    "choices": [
      {
        "value": 0,
        "label": "自分が焦らして、相手の素直な顔を引き出したい",
        "signals": {
          "lead": 1,
          "sadism": 1
        }
      },
      {
        "value": 1,
        "label": "自分の強がりをほどかれ、相手に翻弄されたい",
        "signals": {
          "yield": 1,
          "masochism": 1
        }
      },
      {
        "value": 2,
        "label": "互いに仕掛け合い、形勢を変えたい",
        "signals": {
          "lead": 1,
          "yield": 1,
          "sadism": 1,
          "masochism": 1,
          "switch": 1
        }
      },
      {
        "value": 3,
        "label": "駆け引きをやめて、甘やかし合いたい",
        "signals": {
          "pamper": 1
        }
      },
      {
        "value": 4,
        "label": "どれもまだピンとこない",
        "signals": {}
      }
    ]
  },
  {
    "id": 36,
    "text": "耳元の声で、いちばん心が動くのはどの場面？",
    "chapter": 4,
    "kind": "scene",
    "choices": [
      {
        "value": 0,
        "label": "低い声で呼ばれて、自分が反応してしまう",
        "signals": {
          "aesthetic": 1,
          "voice": 1
        }
      },
      {
        "value": 1,
        "label": "自分の声で、相手の反応を引き出したい",
        "signals": {
          "aesthetic": 1,
          "voice": 1
        }
      },
      {
        "value": 2,
        "label": "普段クールな相手の声が、自分にだけ変わる",
        "signals": {
          "narrative": 1,
          "voice": 1
        }
      },
      {
        "value": 3,
        "label": "声より、視線や距離の方が刺さる",
        "signals": {
          "aesthetic": 1
        }
      },
      {
        "value": 4,
        "label": "声は、あまり決め手にならない",
        "signals": {}
      }
    ]
  },
  {
    "id": 37,
    "text": "二人だけのルールや進め方は、自分が決めて、相手に応じてほしい。",
    "chapter": 4,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "ルールも流れも、私が決めたい",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "大事な進め方は自分で選びたい",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "きっかけは自分から作りたい",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "決める役にはあまりこだわらない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "相手を導く役は望まない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 38,
    "text": "二人だけのルールや進め方は、信頼する相手に決めてもらい、それに応じたい。",
    "chapter": 4,
    "kind": "intensity",
    "choices": [
      {
        "value": 4,
        "label": "信頼する相手のルールに、全部委ねたい",
        "degree": "ど真ん中"
      },
      {
        "value": 3,
        "label": "大事な進め方は相手に任せたい",
        "degree": "かなり刺さる"
      },
      {
        "value": 2,
        "label": "少し判断を預けてみたい",
        "degree": "少し刺さる"
      },
      {
        "value": 1,
        "label": "決めてもらうことにはこだわらない",
        "degree": "あまり刺さらない"
      },
      {
        "value": 0,
        "label": "進め方を委ねる役は望まない",
        "degree": "刺さらない"
      }
    ]
  },
  {
    "id": 39,
    "text": "二人の濃い時間が終わったあと、いちばん欲しい余韻は？",
    "chapter": 4,
    "kind": "scene",
    "choices": [
      {
        "value": 0,
        "label": "抱きしめられて、たっぷり甘やかされたい",
        "signals": {
          "pamper": 1,
          "receiveCare": 1
        }
      },
      {
        "value": 1,
        "label": "相手を労わって、安心させたい",
        "signals": {
          "pamper": 1,
          "giveCare": 1
        }
      },
      {
        "value": 2,
        "label": "二人だけの秘密を、もう一つ増やしたい",
        "signals": {
          "extreme": 1,
          "wet": 1
        }
      },
      {
        "value": 3,
        "label": "少し離れて、一人で余韻を味わいたい",
        "signals": {
          "cool": 1
        }
      },
      {
        "value": 4,
        "label": "特別な締め方には、こだわらない",
        "signals": {}
      }
    ]
  }
];
export const DIMENSIONS=[
  {
    "id": "lead",
    "label": "主導したい",
    "items": [
      0,
      32,
      37
    ],
    "description": "二人の流れやルールを、自分が決めたい。"
  },
  {
    "id": "yield",
    "label": "委ねたい",
    "items": [
      1,
      29,
      38
    ],
    "description": "信頼する相手に、判断や主導権を預けたい。"
  },
  {
    "id": "sadism",
    "label": "Sのスイッチ",
    "items": [
      2,
      4,
      32
    ],
    "description": "照れた反応を引き出し、相手の余裕を崩したい。"
  },
  {
    "id": "masochism",
    "label": "Mのスイッチ",
    "items": [
      1,
      5,
      33
    ],
    "description": "言葉や駆け引きで、自分の余裕を奪われたい。"
  },
  {
    "id": "wet",
    "label": "重愛・共依存",
    "items": [
      8,
      10,
      12
    ],
    "description": "二人だけの、濃く特別な関係に浸りたい。"
  },
  {
    "id": "cool",
    "label": "クール・余白",
    "items": [
      11,
      13,
      14
    ],
    "description": "自分の余白と、二人きりの熱量を両方持ちたい。"
  },
  {
    "id": "narrative",
    "label": "文脈・ギャップ",
    "items": [
      16,
      18,
      23,
      34
    ],
    "description": "関係の積み重ねや、いつもと違う顔が刺さる。"
  },
  {
    "id": "aesthetic",
    "label": "五感・属性",
    "items": [
      17,
      19,
      20,
      22,
      27
    ],
    "description": "声、指先、装い。感覚のディテールに弱い。"
  },
  {
    "id": "extreme",
    "label": "背徳・スリル",
    "items": [
      21,
      24,
      26
    ],
    "description": "秘密や大胆な一面、張りつめた駆け引きを楽しみたい。"
  },
  {
    "id": "pamper",
    "label": "溺愛・聖域",
    "items": [
      3,
      25,
      28,
      29,
      31
    ],
    "description": "全肯定と甘やかし、安心してほどける時間がほしい。"
  }
];
export const TYPES={
  "DWNX": {
    "code": "DWNX",
    "title": "共依存の黒幕",
    "description": "相手の心の奥に入り込み、二人だけの濃い関係を自分から作りたい。"
  },
  "DWNP": {
    "code": "DWNP",
    "title": "溺愛の檻の主",
    "description": "自分の腕の中を聖域にして、好きな相手を丸ごと甘やかしたい。"
  },
  "DWAX": {
    "code": "DWAX",
    "title": "独占フェチコレクター",
    "description": "好きな声も仕草も、自分だけの特等席で引き出して独占したい。"
  },
  "DWAP": {
    "code": "DWAP",
    "title": "過保護プロデューサー",
    "description": "好きな相手の可愛い瞬間を、自分の手で増やして愛でたい。"
  },
  "DCNX": {
    "code": "DCNX",
    "title": "焦らしのマエストロ",
    "description": "涼しい顔で流れを作り、相手が自分にだけ素直になる展開が刺さる。"
  },
  "DCNP": {
    "code": "DCNP",
    "title": "隠れ溺愛の調教師",
    "description": "普段は距離を保ちながら、二人きりでだけ徹底的に甘やかしたい。"
  },
  "DCAX": {
    "code": "DCAX",
    "title": "耽美のフェチ解剖医",
    "description": "声、指先、装い。細かな美学を、自分のペースで味わいたい。"
  },
  "DCAP": {
    "code": "DCAP",
    "title": "スマートな愛玩オーナー",
    "description": "重くなりすぎない距離で、好きな相手を心地よくエスコートしたい。"
  },
  "SWNX": {
    "code": "SWNX",
    "title": "共依存の献身迷子",
    "description": "信頼する相手に深く委ね、二人だけの逃げ場のない物語に浸りたい。"
  },
  "SWNP": {
    "code": "SWNP",
    "title": "崇拝の忠犬",
    "description": "大好きな相手に尽くして、特別な存在として褒められ、甘やかされたい。"
  },
  "SWAX": {
    "code": "SWAX",
    "title": "五感で溺れるフェチ受け",
    "description": "好きな声や強い視線に心をつかまれ、濃く求められたい。"
  },
  "SWAP": {
    "code": "SWAP",
    "title": "甘やかされたい愛玩動物",
    "description": "体温も甘い言葉も惜しみなく、自分に注がれる時間を過ごしたい。"
  },
  "SCNX": {
    "code": "SCNX",
    "title": "強がり陥落待ち",
    "description": "普段の強がりが、信頼する相手の前でだけほどける展開に弱い。"
  },
  "SCNP": {
    "code": "SCNP",
    "title": "密室で甘える野良猫",
    "description": "自分の世界を持ちながら、二人きりの隠れ家では甘えたい。"
  },
  "SCAX": {
    "code": "SCAX",
    "title": "クールなフェチ受け",
    "description": "普段の距離は保ちつつ、好みの声や装いを持つ相手に委ねたい。"
  },
  "SCAP": {
    "code": "SCAP",
    "title": "気まぐれな箱入り貴族",
    "description": "自分のペースは残しながら、気が向いたときにとびきり愛でられたい。"
  }
};
export const AXES=[['lead','yield','D','S'],['wet','cool','W','C'],['narrative','aesthetic','N','A'],['extreme','pamper','X','P']];
