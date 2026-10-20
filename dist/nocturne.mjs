// Selected content is evidence; choice order, gender and mood never add strength.
export const INSTRUMENT='nocturne24-3';
export const PREVIOUS_INSTRUMENT='nocturne24-1';
export const CONSENT='nocturne-2026-10-19';
export const CHAPTERS=['二人の距離と主導権','近づき方と余韻','刺激と駆け引き','好きの核と境界線'];
export const SCENES=[
  {
    "text": "自分では、どんな役に惹かれると思う？",
    "choices": [
      {
        "label": "自分がリードする",
        "signals": []
      },
      {
        "label": "相手に委ねる",
        "signals": []
      },
      {
        "label": "どちらの役も楽しむ",
        "signals": []
      },
      {
        "label": "上下を決めず、対等でいる",
        "signals": []
      },
      {
        "label": "まだ決められない",
        "signals": []
      }
    ],
    "self": true,
    "single": true,
    "id": 0,
    "chapter": 0
  },
  {
    "text": "二人きり。最初の一歩は、どうしたい？",
    "choices": [
      {
        "label": "自分から引き寄せ、流れを決める",
        "signals": [
          "lead"
        ]
      },
      {
        "label": "相手に引き寄せられ、身を任せる",
        "signals": [
          "yield"
        ]
      },
      {
        "label": "わざと誘って、相手を焦らす",
        "signals": [
          "sadism"
        ]
      },
      {
        "label": "どちらからともなく、距離を縮める",
        "signals": [
          "equal"
        ]
      },
      {
        "label": "急がず、相手の様子を確かめる",
        "signals": [
          "space"
        ]
      }
    ],
    "id": 1,
    "chapter": 0
  },
  {
    "text": "「今日は全部、任せて」と言われたら？",
    "choices": [
      {
        "label": "考える役を手放して、委ねたい",
        "signals": [
          "yield"
        ]
      },
      {
        "label": "挑発して、相手の余裕を崩したい",
        "signals": [
          "sadism"
        ]
      },
      {
        "label": "気を張らず、甘やかされたい",
        "signals": [
          "receiveCare"
        ]
      },
      {
        "label": "「むしろ私に任せて」と返したい",
        "signals": [
          "lead"
        ]
      },
      {
        "label": "お互いの希望を話して決めたい",
        "signals": [
          "equal"
        ]
      }
    ],
    "id": 2,
    "chapter": 0
  },
  {
    "text": "余裕のある相手。自分だけに見せてほしい顔は？",
    "choices": [
      {
        "label": "自分に翻弄され、余裕をなくす顔",
        "signals": [
          "sadism"
        ]
      },
      {
        "label": "自分にだけ甘える、無防備な顔",
        "signals": [
          "giveCare",
          "exclusive"
        ]
      },
      {
        "label": "低い声で、こちらを導くときの顔",
        "signals": [
          "voice",
          "yield"
        ]
      },
      {
        "label": "自分だけを強く求めている顔",
        "signals": [
          "wet"
        ]
      },
      {
        "label": "無理せず、穏やかにくつろぐ顔",
        "signals": [
          "space"
        ]
      }
    ],
    "id": 3,
    "chapter": 0
  },
  {
    "text": "今度は、自分が余裕をなくした。どうされたい？",
    "choices": [
      {
        "label": "逃げ道を残しつつ、もっと焦らされたい",
        "signals": [
          "masochism"
        ]
      },
      {
        "label": "「可愛いね」と、優しく甘やかされたい",
        "signals": [
          "receiveCare",
          "praise"
        ]
      },
      {
        "label": "立場を逆転させて、相手を翻弄したい",
        "signals": [
          "switch",
          "sadism"
        ]
      },
      {
        "label": "言葉を重ねず、そのまま寄り添いたい",
        "signals": [
          "quiet"
        ]
      },
      {
        "label": "いったん間を置いて、落ち着きたい",
        "signals": [
          "space"
        ]
      }
    ],
    "id": 4,
    "chapter": 0
  },
  {
    "text": "相手から「どうしてほしい？」と聞かれたら？",
    "choices": [
      {
        "label": "自分が進め方を決めたい",
        "signals": [
          "lead"
        ]
      },
      {
        "label": "相手が焦れるように、少し待たせたい",
        "signals": [
          "sadism"
        ]
      },
      {
        "label": "相手が力を抜けるよう、甘やかしたい",
        "signals": [
          "giveCare"
        ]
      },
      {
        "label": "途中で、相手に主導権を渡したい",
        "signals": [
          "switch",
          "yield"
        ]
      },
      {
        "label": "二人で、その都度決めたい",
        "signals": [
          "equal"
        ]
      }
    ],
    "id": 5,
    "chapter": 0
  },
  {
    "text": "特別な関係だと感じるのは、どんなとき？",
    "choices": [
      {
        "label": "二人の時間を、濃く独占し合うとき",
        "signals": [
          "wet",
          "exclusive"
        ]
      },
      {
        "label": "自分にだけ弱さを見せてくれたとき",
        "signals": [
          "exclusive",
          "giveCare"
        ]
      },
      {
        "label": "大切にしつつ、一人の時間もあるとき",
        "signals": [
          "space"
        ]
      },
      {
        "label": "二人だけの設定や合言葉があるとき",
        "signals": [
          "story"
        ]
      },
      {
        "label": "上下なく、自然体でいられるとき",
        "signals": [
          "equal"
        ]
      }
    ],
    "id": 6,
    "chapter": 1
  },
  {
    "text": "近づいた瞬間、まず惹かれるのは？",
    "choices": [
      {
        "label": "耳元の声と、話す間",
        "signals": [
          "voice"
        ]
      },
      {
        "label": "その人らしい香り",
        "signals": [
          "scent"
        ]
      },
      {
        "label": "肌の温もりと、触れ方",
        "signals": [
          "touch"
        ]
      },
      {
        "label": "服装や髪、見た目の細部",
        "signals": [
          "style"
        ]
      },
      {
        "label": "言葉を交わさなくても落ち着く空気",
        "signals": [
          "quiet"
        ]
      }
    ],
    "id": 7,
    "chapter": 1
  },
  {
    "text": "普段とのギャップ。特に弱いのは？",
    "choices": [
      {
        "label": "自分にだけ見せる、特別な表情",
        "signals": [
          "exclusive"
        ]
      },
      {
        "label": "呼び方や声が、二人だけのものになる",
        "signals": [
          "voice",
          "story"
        ]
      },
      {
        "label": "きちんとした装いが、少し崩れる",
        "signals": [
          "style",
          "disarray"
        ]
      },
      {
        "label": "普段は厳しい人が、甘やかしてくれる",
        "signals": [
          "receiveCare"
        ]
      },
      {
        "label": "無理に変わらず、自然体でいてくれる",
        "signals": [
          "space"
        ]
      }
    ],
    "id": 8,
    "chapter": 1
  },
  {
    "text": "気を張っていた日の夜。いちばん欲しいのは？",
    "choices": [
      {
        "label": "判断を預けて、リードしてもらう時間",
        "signals": [
          "yield"
        ]
      },
      {
        "label": "頑張りを認められ、甘える時間",
        "signals": [
          "receiveCare",
          "praise"
        ]
      },
      {
        "label": "誰かを甘やかして、安心させる時間",
        "signals": [
          "giveCare"
        ]
      },
      {
        "label": "余裕を崩され、駆け引きを楽しむ時間",
        "signals": [
          "masochism"
        ]
      },
      {
        "label": "一人のペースで、静かに休む時間",
        "signals": [
          "space"
        ]
      }
    ],
    "id": 9,
    "chapter": 1
  },
  {
    "text": "合意して痛みのある刺激を楽しむことには？",
    "choices": [
      {
        "label": "与える側に興味がある",
        "signals": [
          "painGive"
        ]
      },
      {
        "label": "受ける側に興味がある",
        "signals": [
          "painReceive"
        ]
      },
      {
        "label": "どちらの側にも興味がある",
        "signals": [
          "painGive",
          "painReceive"
        ]
      },
      {
        "label": "痛みより、優しい触れ合いがいい",
        "signals": [
          "touch"
        ]
      },
      {
        "label": "与えるのも、受けるのも望まない",
        "signals": [
          "neutral"
        ]
      }
    ],
    "id": 10,
    "chapter": 1
  },
  {
    "text": "親密な時間のあと、どう過ごしたい？",
    "choices": [
      {
        "label": "抱きしめられて、甘やかされたい",
        "signals": [
          "receiveCare"
        ]
      },
      {
        "label": "相手が落ち着くまで、甘やかしたい",
        "signals": [
          "giveCare"
        ]
      },
      {
        "label": "すぐ離れず、余韻に浸っていたい",
        "signals": [
          "wet"
        ]
      },
      {
        "label": "ひと息ついたら、一人の余白も欲しい",
        "signals": [
          "space"
        ]
      },
      {
        "label": "いつもの自然な会話へ戻りたい",
        "signals": [
          "quiet"
        ]
      }
    ],
    "id": 11,
    "chapter": 1
  },
  {
    "text": "耳元の言葉。特に心が動くのは？",
    "choices": [
      {
        "label": "低い声で「まだ待って」と導かれる",
        "signals": [
          "voice",
          "yield",
          "restraintReceive"
        ]
      },
      {
        "label": "自分の一言で、相手の声が揺れる",
        "signals": [
          "voice",
          "sadism"
        ]
      },
      {
        "label": "見透かしたような声で、からかわれる",
        "signals": [
          "voice",
          "masochism"
        ]
      },
      {
        "label": "「いいね」と、優しく褒められる",
        "signals": [
          "voice",
          "receiveCare",
          "praise"
        ]
      },
      {
        "label": "台詞より、自然な息づかいが好き",
        "signals": [
          "quiet"
        ]
      }
    ],
    "id": 12,
    "chapter": 2
  },
  {
    "text": "装いや小物で、特に惹かれるのは？",
    "choices": [
      {
        "label": "きちんとした服が、少し着崩れる",
        "signals": [
          "style",
          "disarray"
        ]
      },
      {
        "label": "制服やスーツなど、役が見える服",
        "signals": [
          "style",
          "story"
        ]
      },
      {
        "label": "首輪やリボンなど、二人だけの印",
        "signals": [
          "style"
        ]
      },
      {
        "label": "装いより、肌の温もりや触れ合い",
        "signals": [
          "touch"
        ]
      },
      {
        "label": "服や小物には、あまりこだわらない",
        "signals": [
          "neutral"
        ]
      }
    ],
    "id": 13,
    "chapter": 2
  },
  {
    "text": "あとになっても、思い出していたいのは？",
    "choices": [
      {
        "label": "耳に残った、相手の声",
        "signals": [
          "voice"
        ]
      },
      {
        "label": "近くにいたときの香り",
        "signals": [
          "scent"
        ]
      },
      {
        "label": "抱きしめられた温もり",
        "signals": [
          "touch"
        ]
      },
      {
        "label": "服や髪、表情の細かな記憶",
        "signals": [
          "style"
        ]
      },
      {
        "label": "穏やかに言葉を交わした時間",
        "signals": [
          "quiet"
        ]
      }
    ],
    "id": 14,
    "chapter": 2
  },
  {
    "text": "合図を待つ・動きを預ける遊びなら？",
    "choices": [
      {
        "label": "自分の合図まで、相手を待たせたい",
        "signals": [
          "restraintGive"
        ]
      },
      {
        "label": "動きを任せて、相手の合図を待ちたい",
        "signals": [
          "restraintReceive"
        ]
      },
      {
        "label": "合図する役と待つ役を、交代したい",
        "signals": [
          "switch",
          "restraintGive",
          "restraintReceive"
        ]
      },
      {
        "label": "動きやタイミングは、対等に決めたい",
        "signals": [
          "equal"
        ]
      },
      {
        "label": "そうした遊びには、特に惹かれない",
        "signals": [
          "neutral"
        ]
      }
    ],
    "id": 15,
    "chapter": 2
  },
  {
    "text": "いつもと違う役を演じるなら？",
    "choices": [
      {
        "label": "自分が命じる、主従の設定",
        "signals": [
          "story",
          "lead"
        ]
      },
      {
        "label": "相手に仕える、主従の設定",
        "signals": [
          "story",
          "yield"
        ]
      },
      {
        "label": "途中で主従が逆転する設定",
        "signals": [
          "story",
          "switch"
        ]
      },
      {
        "label": "二人だけの秘密を持つ設定",
        "signals": [
          "story",
          "exclusive"
        ]
      },
      {
        "label": "役を演じず、いつもの二人でいたい",
        "signals": [
          "equal"
        ]
      }
    ],
    "id": 16,
    "chapter": 2
  },
  {
    "text": "相手との駆け引きで、惹かれるのは？",
    "choices": [
      {
        "label": "自分が仕掛けて、相手の余裕を崩す",
        "signals": [
          "sadism"
        ]
      },
      {
        "label": "相手に翻弄され、ペースを乱される",
        "signals": [
          "masochism"
        ]
      },
      {
        "label": "わざと挑発し、最後は逆転される",
        "signals": [
          "switch",
          "masochism",
          "brat"
        ]
      },
      {
        "label": "意地悪したあと、自分が甘やかす",
        "signals": [
          "sadism",
          "giveCare"
        ]
      },
      {
        "label": "駆け引きより、まっすぐ伝え合う",
        "signals": [
          "equal"
        ]
      }
    ],
    "id": 17,
    "chapter": 2
  },
  {
    "text": "少し挑発したり、されたりするなら？",
    "choices": [
      {
        "label": "強がった自分を、相手に負かされたい",
        "signals": [
          "brat",
          "masochism",
          "intense"
        ]
      },
      {
        "label": "挑発的な相手を、自分が負かしたい",
        "signals": [
          "sadism",
          "intense"
        ]
      },
      {
        "label": "勝つ役も負ける役も、交代で楽しむ",
        "signals": [
          "switch"
        ]
      },
      {
        "label": "競うより、優しく受け止められたい",
        "signals": [
          "receiveCare"
        ]
      },
      {
        "label": "勝ち負けのある展開は望まない",
        "signals": [
          "neutral"
        ]
      }
    ],
    "id": 18,
    "chapter": 3
  },
  {
    "text": "刺激を強めるなら、気になるのは？",
    "choices": [
      {
        "label": "痛みのある刺激を、与える側",
        "signals": [
          "painGive",
          "intense"
        ]
      },
      {
        "label": "痛みのある刺激を、受ける側",
        "signals": [
          "painReceive",
          "intense"
        ]
      },
      {
        "label": "動きや合図を、決める側",
        "signals": [
          "restraintGive",
          "intense"
        ]
      },
      {
        "label": "動きや合図を、預ける側",
        "signals": [
          "restraintReceive",
          "intense"
        ]
      },
      {
        "label": "強さより、心地よい触れ合い",
        "signals": [
          "touch"
        ]
      }
    ],
    "id": 19,
    "chapter": 3
  },
  {
    "text": "深く満たされたと感じるのは？",
    "choices": [
      {
        "label": "特別な相手と、濃くつながれたとき",
        "signals": [
          "wet",
          "exclusive"
        ]
      },
      {
        "label": "甘えて、受け止めてもらえたとき",
        "signals": [
          "receiveCare"
        ]
      },
      {
        "label": "身を任せ、相手に導いてもらえたとき",
        "signals": [
          "yield"
        ]
      },
      {
        "label": "自分が相手の余裕を崩せたとき",
        "signals": [
          "sadism"
        ]
      },
      {
        "label": "自分から流れを作れたとき",
        "signals": [
          "lead"
        ]
      }
    ],
    "id": 20,
    "chapter": 3
  },
  {
    "text": "好きな相手でも、避けたいのは？",
    "choices": [
      {
        "label": "痛みを受けること",
        "signals": [
          "boundaryPain"
        ]
      },
      {
        "label": "きつい言葉を向けられること",
        "signals": [
          "boundaryWords"
        ]
      },
      {
        "label": "普段の生活まで束縛されること",
        "signals": [
          "boundaryControl"
        ]
      },
      {
        "label": "役を一方的に決めつけられること",
        "signals": [
          "boundaryRole"
        ]
      },
      {
        "label": "まだ自分でも、決められない",
        "signals": [
          "boundaryUnknown"
        ]
      }
    ],
    "boundary": true,
    "id": 21,
    "chapter": 3
  },
  {
    "text": "したい・されたい気持ちが変わるのは？",
    "choices": [
      {
        "label": "相手を信頼できるようになったとき",
        "signals": [
          "contextTrust"
        ]
      },
      {
        "label": "気分や疲れ具合が違うとき",
        "signals": [
          "contextMood"
        ]
      },
      {
        "label": "相手が変わったとき",
        "signals": [
          "contextPartner"
        ]
      },
      {
        "label": "場所や雰囲気が変わったとき",
        "signals": [
          "contextScene"
        ]
      },
      {
        "label": "好みは、あまり変わらない",
        "signals": [
          "contextStable"
        ]
      }
    ],
    "context": true,
    "id": 22,
    "chapter": 3
  },
  {
    "text": "夜の終わりに、言われたい一言は？",
    "choices": [
      {
        "label": "「もう頑張らなくていいよ」",
        "signals": [
          "receiveCare"
        ]
      },
      {
        "label": "「あなたに委ねてよかった」",
        "signals": [
          "giveCare"
        ]
      },
      {
        "label": "「これは二人だけの秘密だね」",
        "signals": [
          "story",
          "exclusive"
        ]
      },
      {
        "label": "「次は交代で、あなたが仕切ってね」",
        "signals": [
          "lead",
          "switch"
        ]
      },
      {
        "label": "「あとは自分のペースで休もう」",
        "signals": [
          "space"
        ]
      }
    ],
    "id": 23,
    "chapter": 3
  }
];
export const sceneText=q=>q?.text||'';
export const choiceLabel=c=>c?.label||'';

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
  const gap=self===0&&strong('yield')?'仕切るつもりが、手綱を預ける場面も選んでいた。':self===1&&strong('lead')?'任せるつもりが、自分で流れを作る場面も選んでいた。':strong('masochism')&&strong('receiveCare')?'翻弄はされたい。でも、最後は甘やかしてほしい。':count('boundaryPain')>0&&strong('restraintReceive')?'動きは任せたい。でも、痛みまで任せたいわけではない。':null;
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
