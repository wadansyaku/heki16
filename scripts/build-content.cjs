const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {escapeHtml: esc, validateMonetization, renderAffiliateSection, affiliateCss} = require('./monetization.cjs');
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const origin = 'https://heki16-pro.aiyume.workers.dev';
let app = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const script = [...app.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('const QUESTIONS'));
const context = vm.createContext({console, setTimeout, clearTimeout, URLSearchParams, window:{addEventListener(){}},document:{addEventListener(){}}});
vm.runInContext(script, context);
const catalog = JSON.parse(vm.runInContext('JSON.stringify(TYPE_CATALOG)', context));
const campaigns = validateMonetization(JSON.parse(fs.readFileSync(path.join(root, 'config/monetization.json'), 'utf8')));
for (const placement of ['home', 'result']) {
  const start = `<!-- AFFILIATE_${placement.toUpperCase()}_START -->`;
  const end = `<!-- AFFILIATE_${placement.toUpperCase()}_END -->`;
  if (!app.includes(start) || !app.includes(end)) throw new Error(`Missing advertising placement: ${placement}`);
  app = app.replace(new RegExp(start+'[\\s\\S]*?'+end), start+'\n'+renderAffiliateSection(campaigns, placement)+'\n'+end);
}
app = app.replace(/\/\* AFFILIATE_CSS_START \*\/[\s\S]*?\/\* AFFILIATE_CSS_END \*\//, `/* AFFILIATE_CSS_START */\n${affiliateCss}\n/* AFFILIATE_CSS_END */`);
fs.writeFileSync(path.join(dist, 'index.html'), app);

const nav = `<nav aria-label="サイト内"><a href="/">無料診断</a><a href="/types/">16タイプ一覧</a><a href="/guide/">診断の読み方</a><a href="/privacy/">プライバシー</a><a href="/advertising/">広告について</a></nav>`;
const urls = ['/'];
function writePage(route, title, description, body) {
  urls.push(route);
  const folder = path.join(dist, route);
  fs.mkdirSync(folder, {recursive:true});
  fs.writeFileSync(path.join(folder, 'index.html'), `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><meta name="robots" content="index, follow"><title>${esc(title)}｜HEKI-16 PRO</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${origin}${route}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}｜HEKI-16 PRO"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${origin}${route}"><meta property="og:locale" content="ja_JP"><meta name="twitter:card" content="summary"><link rel="stylesheet" href="/content.css"></head><body><a class="skip" href="#content">本文へ移動</a><header><a class="brand" href="/">HEKI-16 <span>PRO</span></a>${nav}</header><main id="content"><h1>${esc(title)}</h1><p class="lead">${esc(description)}</p>${body}${renderAffiliateSection(campaigns, 'content')}</main><footer>${nav}<p>HEKI-16 PRO · 18歳以上を対象としたエンタメコンテンツです。医療的な診断や、相手の希望・同意を判断するものではありません。</p></footer></body></html>\n`);
}
const section = (heading, text) => `<section><h2>${esc(heading)}</h2>${text.split('\n\n').map(p=>`<p>${esc(p)}</p>`).join('')}</section>`;

writePage('/types/', '16タイプの特徴と関係性のヒント', 'HEKI-16 PROの16タイプを一覧で読む。自分の好みや相手との違いを話すきっかけとして使えます。', section('タイプは会話のきっかけ', '4つの方向の組み合わせを16タイプとして表しています。同じタイプでも好みの強さ、サブタイプ、その日の気分は違います。相性の数値は関係の成功率ではありません。')+`<div class="type-grid">${Object.values(catalog).map(t=>`<a class="type-card" href="/types/${t.code}/"><span class="code">${t.code}</span><h2>${esc(t.title)}</h2><p>${esc(t.group)}</p><span>特徴と会話のヒントを読む →</span></a>`).join('')}</div><p><a class="cta" href="/">自分の好みを無料で振り返る</a></p>`);

const axes = [
  {D:['自分から流れをつくる','どんなときに自分から提案したくなる？','どこからは相手に選んでほしい？'],S:['相手に流れを預ける','安心して任せられるのはどんなとき？','自分で決めておきたいことは何？']},
  {W:['近い距離でつながる','一緒に過ごす時間はどのくらいあると心地よい？','ひとりの時間がほしいとき、どう伝えたい？'],C:['自分の余白も大切にする','連絡や会う頻度はどのくらいが心地よい？','距離があるときも安心できる言葉は何？']},
  {N:['関係性や背景に心が動く','ふたりの関係で大切にしている思い出は？','どんな呼び方や言葉がしっくりくる？'],A:['感覚や雰囲気に心が動く','落ち着く声や場所、空気感は？','心地よい距離感をどう伝えたい？']},
  {X:['意外性や非日常に心が動く','いつもと違う予定を楽しめるのはどんなとき？','試してみたくないことをどう伝える？'],P:['安心や思いやりに心が動く','安心できる気遣いはどんなもの？','疲れた日にしてほしいことは何？']}
];
for (const t of Object.values(catalog)) {
  const directions = [...t.code].map((letter, i)=>axes[i][letter]);
  writePage(`/types/${t.code}/`, `${t.code} ${t.title}`, `${t.group}の組み合わせをもつ${t.code}タイプの読み方。自分の好みを振り返り、相手と心地よい距離を話すためのヒントです。`,
    section('このタイプの4つの方向', directions.map(d=>d[0]).join('、')+'。\n\nタイプ名は特徴を覚えやすくするための表現です。「必ずこうしたい」「相手にもこうしてよい」という意味ではありません。各軸には両方が高い状態や、どちらも控えめな状態があります。')+
    `<section><h2>自分に聞いてみる</h2>${directions.map(d=>`<h3>${esc(d[0])}</h3><p>${esc(d[1])}</p><p>${esc(d[2])}</p>`).join('')}</section>`+
    section('相手と話すときの使い方', '「私はこの説明のここが近い」と感じた箇所を一つ伝え、相手の答えを聞いてみてください。タイプが同じでも感じ方は違います。答えたくないことは答えなくてよく、以前伝えた好みやNGはいつでも変えられます。\n\n相性スコアよりも、本人の言葉と、その時点の気持ちを優先してください。')+
    section('4文字と64分類の違い', '4文字は大まかな方向を表します。診断結果には、天性覚醒・献身ケア・本能享楽・両刀スイッチの4つのサブタイプも表示します。これはエンタメ上の分類で、心理学的な検査としての妥当性が確認されたものではありません。')+
    `<p><a class="cta" href="/">無料で診断を始める</a></p><p><a href="/types/">ほかのタイプを見る</a> · <a href="/guide/">スコアと相性の読み方</a></p>`);
}

writePage('/guide/', '診断の読み方と楽しみ方', '32問・18問の選び方、16タイプ・64分類、8軸や相性の数値の意味を確認できます。',
  section('32問と18問を選ぶ', '32問は幅広い情景について振り返るモード、18問はその中の共通設問を使う短いモードです。どちらもタイプ・サブタイプ・カルテを表示しますが、答える設問の数が違うため、結果が一致するとは限りません。所要時間は読み方や考える時間によって変わります。')+
  section('好みの強さと、両方の共存を見る', '主導と委ねなどの要素は、両方とも高い、片方が高い、両方とも控えめという状態があります。4文字のタイプだけでなく、8軸とマトリクスも一緒に見てください。差が小さい場合は、タイプ名よりも両方に当てはまる部分を大切にしてください。')+
  section('数値は確率や医学的な測定値ではない', '0〜120の表現や相性の数値は、このアプリ内の計算によるエンタメ上の指標です。集団内の順位、出現率、関係の成功率、診断精度を示すものではありません。臨床・心理検査としての妥当性や再現性は確認されていません。\n\n旧版のコードに保存されていない値は、当時の回答から復元できません。詳しく振り返りたい場合は再診断してください。')+
  section('2人・3〜4人で使う', '各自が自分の結果や共有コードを確認し、共有したい範囲を選んでから使ってください。4文字だけの入力ではタイプの見本値を使います。個人の詳細な結果を比較する場合は詳細コードを使います。矢印や主導割合が、現実の役割や上下関係を決めることはありません。')+
  section('共有前に確認する', 'PNGや投稿文には、表示名、好みのタグ、NG、コードなどが含まれる場合があります。送る相手と公開範囲を確認してください。相性招待リンクにも診断コードと名前が入ります。一度共有した画像やリンクは、端末のデータを削除しても相手側から消えません。')+
  section('想像と現実を分ける', '想像の中で好きなことと、現実に望むことは同じとは限りません。結果を理由に自分や相手に何かを求める必要はありません。気が変わったときは、前の回答や約束よりも今の意思を大切にしてください。'));

writePage('/privacy/', '回答と共有データの扱い', '端末に保存するもの、共有コードに含まれるもの、外部サービスに移動する場合のデータの扱いを説明します。',
  section('この端末に保存するもの', '途中回答と診断結果は、このサイトのlocalStorageに保存します。表示名や選択したタグも保存する場合があります。運営者のデータベースへ送信する機能はありません。相手・グループの入力は保存しません。\n\nトップページ下部の「この端末の診断・途中回答を削除」から削除できます。ブラウザのデータ削除でも消えます。共用端末では、利用後の削除をご検討ください。')+
  section('ドメインや端末を変えた場合', '保存内容は利用したブラウザとサイトのドメインごとに分かれます。以前のChatGPT版からCloudflare版へ、回答や結果が自動で移ることはありません。共有コードは相性画面で読めますが、途中回答や表示名・NGをすべて復元するバックアップではありません。')+
  section('共有したときに含まれるもの', '共有コードにはタイプ・サブタイプ・スコアなどが含まれます。招待リンクの末尾にはコードと表示名が入ります。URLの#以降は通常のページ取得要求には含まれませんが、受け取った人や端末の履歴からは読めます。匿名化や暗号化された秘密ではありません。\n\n画像、投稿文、招待リンクは送信前に表示内容をご確認ください。外部SNSへの投稿はご自身の操作で行います。')+
  section('サイト配信と外部サービス', 'サイトはCloudflareから配信します。配信に必要な通信情報はCloudflare側で取り扱われます。本サイト独自のアクセス解析タグや広告配信スクリプトは現在導入していません。\n\n広告リンクを有効にする場合も、回答やスコアを広告URLに付加せず、全利用者に同じ広告を表示します。リンク先の購入・計測・Cookie等は各提供元の方針に従います。')+
  `<p><a href="https://www.cloudflare.com/privacypolicy/" rel="noopener noreferrer" target="_blank">Cloudflareのプライバシーポリシー</a></p>`+
  section('入力フォームについて', '現在、会員登録、メール収集、問い合わせフォーム、決済機能は設置していません。これらを追加するときは、取り扱う情報と目的をこのページに記載します。'));

writePage('/advertising/', '広告とアフィリエイトの掲載方針', '診断結果から広告を独立させ、広告・PRを明示するための方針です。',
  section('現在の広告表示', campaigns.length ? '承認済みの広告・アフィリエイトリンクを掲載しています。各掲載箇所に広告・PRと表示します。' : '現在、広告・アフィリエイトリンクは掲載していません。掲載審査とリンクの準備が整ってから有効にします。')+
  section('広告が入る場合の表示', 'リンク先で購入・申込みがあると、運営者に報酬が支払われる場合があります。提供元、広告・PRの表記、外部サイトへ移動することを分かる形で表示します。価格、契約内容、解約条件はリンク先で確認してください。')+
  section('診断を広告で変えない', '広告の有無やクリックによって、設問、スコア、タイプ、相性の結果を変えません。質問の選択肢の中や、回答操作を遮る場所には広告を表示しません。診断結果に応じた広告の出し分けや、回答・スコア・名前の広告サービスへの送信は行いません。')+
  section('掲載する内容を確認する', 'サイトのテーマを掲載先に伝え、認められたプログラムだけを掲載します。誇大な効果、診断で分かったかのような商品適合性、未確認のランキングや体験談で購入を促しません。終了した広告は停止します。')+
  section('外部サービスの扱い', 'リンク先の商品・サービスは、それぞれの提供元が販売・提供します。本サイトが外部サイトの価格や契約、個人情報の取扱いを管理することはありません。購入を急がず、必要性と条件を確認してください。'));

fs.writeFileSync(path.join(dist, 'content.css'), `:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#0c0918;color:#f5f3ff;font-family:system-ui,-apple-system,sans-serif;line-height:1.9}a{color:#f9a8d4;text-underline-offset:4px}a:focus-visible{outline:2px solid #f9a8d4;outline-offset:4px}header,main,footer{max-width:68rem;margin:auto;padding:1.25rem}header{border-bottom:1px solid #ffffff20}.brand{font-size:1.4rem;font-weight:900;text-decoration:none;color:#fff}.brand span,.code{color:#e879f9}nav{display:flex;gap:.7rem 1.2rem;flex-wrap:wrap;margin-top:.75rem;font-size:.875rem}main{padding-top:2.5rem;padding-bottom:3rem}h1{font-size:clamp(1.6rem,5vw,2.6rem);line-height:1.45}h2{font-size:1.3rem;line-height:1.6;margin-top:1.75rem}h3{font-size:1.05rem}p,li{max-width:75ch;overflow-wrap:anywhere}.lead{color:#ddd6fe;font-size:1.05rem}section{margin:1.5rem 0;padding:1.25rem;border:1px solid #a855f740;border-radius:1.25rem;background:#ffffff03}.type-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr));gap:1rem}.type-card{display:block;padding:1.25rem;border:1px solid #a855f740;border-radius:1.25rem;text-decoration:none;background:#131024;color:#f5f3ff}.type-card:hover{border-color:#f472b6}.type-card h2{margin:.5rem 0}.code{font-size:1.7rem;font-weight:900}.cta{display:inline-block;padding:.8rem 1.2rem;background:#7e22ce;color:#fff;font-weight:800;border-radius:.8rem}footer{border-top:1px solid #ffffff20;color:#c4b5fd;font-size:.8rem}.skip{position:absolute;left:1rem;top:-5rem;background:#4c1d95;color:#fff;padding:.5rem}.skip:focus{top:1rem}${affiliateCss}\n`);
fs.writeFileSync(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url=>`  <url><loc>${origin}${url}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`Built ${urls.length} indexable pages; ${campaigns.length} active campaigns.`);
