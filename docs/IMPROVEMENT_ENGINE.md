# 自律改善の開発基盤（P0）

この基盤は、人が承認した要件を受け取り、有限回の実装と独立した機械検証を行い、**公開候補または停止理由**を残す。実装エンジンは元のチェックアウトへの適用、commit、PR、push、公開、外部投稿を行わない。外部収集は後述の独立した読み取り専用コレクターが担当する。Node.js 22、Git以外の依存追加はない。

自動受入判定は、固定したファイル内容・ハッシュ・Node構文に加え、既存テストと実ブラウザー操作に接続できる。`nocturne-product` は従来のCSS限定、**`nocturne-container` は隔離したHTML・JavaScript・CSS候補**を対象にする。実機、対象者の理解、実Claudeによる実装は別の受入事項である。

## 実課題への適用：結果のキーボード操作（2026-10-22、26.6.4公開）

P1 UXの対象者試用準備として、結果5ページの切替でフォーカスが本文へ移り連続操作しにくい点を1件選んだ。[W3Cのタブ指針](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)に沿い、選択中のタブだけをTabキーの入口とし、左右キーの循環・Home/End・選択後のフォーカス維持・タブと本文のラベル対応・見えるフォーカスを追加した。修正箇所は `src/app.mjs` と `src/app.css`。

完成条件を先に `scripts/ui-flow.mjs` の `result-keyboard-tabs` へ追加し、判定側のスナップショットに固定した。無料のfixtureアダプターが、変更前の不合格→既存Codexで作った改善候補の適用→同じ検証の合格まで2回で進んだ。ClaudeやGrokの推論・追加課金は使わない。候補作成そのものをClaudeの自動修正実績とみなさない。

初回の候補確認では、320/390/1440pxのキー操作とモーダル中の誤切替防止、診断・必須同意・必須掲載・結果・共有PNG・受信ページ・撤回を含む画面検証15項目、隔離試験13項目が通過した。採用候補を確認して既存チェックアウトへ反映し、`npm run verify` の294件と配信設定検証も通過した。その候補段階では本番公開・広告配信・外部送信を行わなかった。実機・スクリーンリーダーの受入は未確認のため、エンジンの `awaiting_human` は維持する。

再現用のspec、変更前/変更後の判定、ハッシュ付きの合成画面は、非公開の `/Users/Yodai/KUSEIRO/operations/review/container-gates-20261022/result-keyboard-01/` に保存した。元の製品リポジトリへ自動採用する経路は追加していない。

その後、提出時に互換確認済みの旧CSSでも撮影環境を変えると原本PNGとの直接一致を再現できないことを確認した。提出原本と既存の原本一致の証明は保持し、固定環境で旧CSSと改善版のPR画面が完全一致することを別の比較記録へ固定した。390×844・1440×900の画像と比較記録、現在のCSS、提出物・広告コード・設定を照合する `scripts/verify-ad-preview.mjs` を追加した。原本を再撮影した画像そのものが一致したとは扱わない。見出しを消す試験を不合格にし、画像・比較記録・広告コードの改変を拒否する3件の回帰テストも通過した。広告物承認は未確認であり、設定・D1・R2とも停止中。

公開確認で見つかった初期表示とアカウント確認の競合も修正した。結果の操作は初期確認を終えてから表示し、同じ画面の再描画でも選択したタブのフォーカスを維持する。最終候補は必須297件と配信設定検証、ローカル画面16項目、隔離13項目を通過して26.6.4へ反映した。本番では320/390/1440pxで結果5ページ・左右/Home/End・Tab/Shift+Tabを確認した。確認用記録は端末内の合成データだけで、回答・掲載・共有・利用イベントを本番へ作成していない。実機Safari・スクリーンリーダーの受入は未確認。

## HTML・JavaScriptを隔離して検証する

`nocturne-container` は、承認した基準版に存在する `src/` 直下の `.html/.mjs/.js/.cjs/.css` から、今回のspecで列挙したファイルだけを重ねる。新しいファイル、検証・基盤・package・広告設定・マイグレーションの変更は受け付けない。古いCSSプロファイルへHTML/JSを渡したり、コンテナ不在時にホスト実行へ切り替えたりしない。

候補の実行と判定を分離する。

- **隔離確認**：候補を実行しないコンテナで、非root、原本・テスト・基盤・依存の書込み拒否、鍵・ホストHOME・Dockerソケットの不在、IPv4/IPv6・DNS・メタデータ・ホスト宛ての通信拒否を実際に試す。Dockerの設定も別に照合する。
- **製品テスト**：候補を読み込むNodeとビルド・既存テストを、ネットワークなしの使い捨てコンテナで実行。TAP形式と終了状態を照合し、早期終了だけを成功扱いしない。
- **アプリ**：別の使い捨てコンテナで再ビルドし、合成データ専用のD1/R2を使って127.0.0.1だけで起動。外部ポートを公開しない。
- **画面の判定**：候補をNodeへ読み込まない別コンテナから、ブラウザーで診断・掲載・結果・共有・撤回を操作する。アプリの通信名前空間にだけ接続し、外部ネットワークはない。PID・ファイルシステム・出力は分離する。

全て非root、rootファイルシステム読取専用、capability全削除、権限昇格禁止、CPU・メモリ・PID数・時間に上限を設ける。書込みは各コンテナの一時領域と、判定役だけの画像出力先に限定する。テスト用の実行ファイルを作る既存試験のため、一時領域内の実行は許可する。ホストのHOME・原本チェックアウト・本番DB・Cookie・APIキー・Dockerソケットは渡さない。

Chromiumのsandboxを有効にし、公式Playwrightのseccompを版とハッシュで固定する。capabilityを全削除した環境に合わせ、子のユーザー名前空間内での `chroot` システムコールを追加する。コンテナへ `SYS_ADMIN` 等のcapabilityを追加せず、sandboxの無効化もしない。[PlaywrightのDocker構成](https://playwright.dev/docs/docker)、[Linuxのchrootと名前空間](https://man7.org/linux/man-pages/man2/chroot.2.html)を参照。画像・基準版・候補・依存lock・seccompの変更を検出したら止める。

### 準備と実行

実装役にはDocker操作を渡さない。以下は管理側が一度だけ行う、無料のローカル環境準備。実行時の自動pull・依存導入はない。公式イメージと既存の依存lock、導入済みPlaywright SDKから、Linux用の固定イメージを作る。課金サービス・追加のリポジトリ依存は導入しない。

```sh
# 専用のColima環境を使用。共有のDockerコンテキストを切り替えない。
colima start nocturne-verify --cpus 2 --memory 4 --disk 10 --mount /absolute/verification-directory:w --activate=false --ssh-config=false --port-forwarder=none
# SDKと同じ版の公式イメージを、明示的に取得してからセットアップする。
docker --context colima-nocturne-verify pull mcr.microsoft.com/playwright:v1.62.1-noble
node tools/improvement/container-setup.mjs --output /absolute/new-runtime --docker-host unix:///absolute/colima/docker.sock --playwright-module /absolute/installed/playwright
```

セットアップはイメージをコンパクトにして固定IDを記録する。レジストリのタグ名を実行時の信頼に使わず、ローカルのimage ID・環境変数・volumeを照合する。Docker接続先はローカルUnix socketに限定する。用意した `runtime.json` から、レビューした現在の製品・検証を固定する。

```sh
npm run improvement:product-prepare -- --output /absolute/new-profile --runtime /absolute/new-runtime/runtime.json
```

specの完成条件に `{"id":"isolated-product","type":"nocturne-container","sha256":"PROFILE_SHA256"}` を入れる。実行は既存CLIの `--product-profile /absolute/new-profile/profile.json` を使う。有限回の反復、停止、排他、人の受入待ち、公開禁止は従来と同じ。異なる内部の不合格項目を区別して、同一不合格の繰り返しと混同しない。

検証用コンテナの名前・接続先・所有ラベルを正本の `state.productRuntime` へ起動前に保存する。pause/kill時は自分のコンテナだけを除去する。強制終了からの復帰でも、停止の指示を返す前に残存コンテナを照合して除去する。所有者の不一致では削除せず止める。各コンテナにも残り時間のtimeoutを入れ、管理プロセスの停止後も無期限に動かさない。

`verification.json` はホスト側が生成する。候補を実行するコンテナには検証記録や画像出力先をマウントしない。画像の形式・大きさ・ハッシュを確認し、次のプロセスでも照合する。試験の合格は、人のレビューや実機・対象者の評価、採用・本番公開を許可するものではない。

接続試験は次で再現できる。最初にJSの画面操作を壊す候補、次にHTMLを壊す候補、最後に安全なHTML/JS変更と隔離へのアクセス試行を含む合成候補を検証する。Claudeの呼出しはしない。

```sh
npm run improvement:container-demo -- --output /absolute/new-demo --runtime /absolute/new-runtime/runtime.json
```

## 既存テスト・画面検証の接続（2026-10-22）

`product-profile.mjs` はレビューした現在のソース・検証・設定・マイグレーションを、元のリポジトリ外へ複製してファイルごとのハッシュを固定する。`.env`、本番DB、`.wrangler`、Git、ログイン情報はコピーしない。インストール済み依存・Playwright・Chromiumだけを使い、自動インストールや課金は行わない。ホスト上の管理者や依存環境への耐改ざん機能ではなく、レビューした実行環境を前提とする。

```sh
npm run improvement:product-prepare -- --output /absolute/new-product-profile --playwright-module /absolute/installed/playwright --browser /absolute/installed/chromium
```

出力されたsha256をspecに入れる。製品の元ファイルをすべてエージェントへ渡す必要はない。入力のCSSは基準版と一致するハッシュを持つ、cleanな専用チェックアウトから使う。

```json
{"id":"product-tests-and-ui","type":"nocturne-product","sha256":"PROFILE_SHA256"}
```

```sh
node tools/improvement/cli.mjs run --state /absolute/run --product-profile /absolute/new-product-profile/profile.json
```

判定側が基準版を別の一時領域へコピーし、候補のCSSだけを重ねる。エージェントの候補JavaScript、検証スクリプト、packageの命令をホストで実行しない。変更可能なファイルをJavaScript・HTML等へ広げたspecは拒否する。実行コードを変える候補は上記の `nocturne-container` を使う。依存は既存のものを参照し、基準版・検証スクリプト・プロファイルはエージェントへ公開しない。

順にビルド、既存のレガシー検証、全Nodeテスト、広告検証、配信検証を実行する（既存 `npm run verify` と同じ処理。任意のコマンド入力は不可）。通過後に、本番IDを使わないローカルD1/R2とLOCAL_TEST_MODEを作り、`scripts/ui-flow.mjs` が実ブラウザーで次を操作する。

- 年齢条件の拒否・承諾、意味のあるホーム表示、結果見本がないこと。
- 320/390/1440pxのホーム・掲載画面、横方向のはみ出し。
- 未チェックの必須同意、同意不足による開始拒否。
- 24場面の選択、戻る・中断・再開、回答の振り返り。
- サーバーが確認した公開カード、属性の非公開初期値、必須掲載、結果5ページと再読込。
- 名前のみ共有、実PNG保存（1200×630）、共有リンクとX投稿文の準備。Xへの投稿や広告遷移はしない。
- 別の新しいブラウザー状態からの共有リンク・年齢確認、合成記録の撤回、画面の実行エラー。

ブラウザーの外部通信を拒否し、検証用のHOMEとローカルDBだけを使う。本番のCookie・鍵・回答・利用集計は渡さない。各試行の `product-<判定ID>/verification.json` に判定ID・結果・候補/プロファイルのハッシュと合成画面の画像ハッシュを残す。原回答・Cookie・資格情報・API本文・生のコマンド出力は保存しない。一時DBとブラウザーは終了時に削除する。通過後の再実行でも記録と画像の改変を検出し、実利用者・実機の確認が残れば `awaiting_human` にする。公開・自動採用はしない。

接続全体を再現する無料デモ：

```sh
npm run improvement:product-demo -- --output /absolute/new-demo --playwright-module /absolute/installed/playwright --browser /absolute/installed/chromium
```

1回目は主ボタンを隠す合成CSS（既存テストを通過しても画面検証で不合格）、2回目は元のCSSを使い全条件を確認する。これは本物の製品・テスト・ブラウザーを通す、固定fixtureによる接続試験であり、Claudeによる修正実績ではない。対象者の試用は `USER_TRIAL.md` の手順で別に行う。

## 無料の実行確認

```sh
node tools/improvement/demo.mjs
node --test tests/improvement-engine.test.mjs
```

デモは一時ディレクトリに合成文書だけのGitリポジトリを作る。初回は不合格、次の試行で機械条件を満たし、`awaiting_human` で止まる。表示された `candidateManifestFile` と同じ場所の `handoff.json` を確認する。元の製品リポジトリは変更しない。デモの承認はコード内で合成要件にだけ付与しており、実際の課題への承認を意味しない。

## 実際の課題の入力契約

`tools/improvement/example-spec.json` が書式例。仕様変更は新しい承認と新しいrunを必要とする。

| 項目 | 契約 |
| --- | --- |
| `id`, `background`, `goal` | 課題を1件に限定し、背景と今回の成果を記述 |
| `dataClass` | `synthetic` または `public-source`。内容の分類と送信可否を人が確認 |
| `inputs` | cleanな専用Gitチェックアウト内の、追跡済み非機微ファイルを列挙。必要なものだけコピー |
| `allowedFiles` | 候補領域で編集できるファイルの完全な一覧。検証設定・テスト・実行基盤は編集不可 |
| `acceptance` | 一意なIDと `sha256` / `contains` / `not-contains` / `node-syntax` / `nocturne-product` / `nocturne-container`。製品接続のsha256はレビューしたプロファイルを固定する。基盤側が判定し、モデルの合格宣言は使わない |
| `humanChecks` | 実機・操作観察・契約確認など、人が確認する項目のID。残れば `awaiting_human` |
| `budget` | 最大3試行、全体最大30分、1試行の時間。費用未設定なら無料fixtureだけ実行可能 |
| `adapter` | 固定の無料fixture、または承認されたDocker版Claude接続。任意コマンドは受け付けない |

本番の原回答、結果、アカウント情報、鍵、DB、バックアップを入力にしない。`sources/`、`.env*`、`.dev.vars*`、秘密鍵、DB等のパス、代表的な秘密値、シンボリックリンクは拒否する。ただし検出は分類を保証しないため、人が入力を確認する。許可する30ファイル以内、1ファイル1MB以内の内容だけが別領域にコピーされる。Git全体やユーザーHOMEは実装役へ渡さない。

CLIで要件を検査し、表示されたハッシュを内容確認後に指定する。spec内の自己申告だけでは承認にならない。

```sh
node tools/improvement/cli.mjs hash --spec /absolute/spec.json
node tools/improvement/cli.mjs init --spec /absolute/spec.json --workspace /absolute/clean-checkout --state /absolute/run --approved-sha256 REVIEWED_HASH
node tools/improvement/cli.mjs run --state /absolute/run
node tools/improvement/cli.mjs status --state /absolute/run
```

run用ディレクトリは新規かつ元チェックアウトの外に置く。`--approved-sha256` はこのローカルCLIを操作する人の承認の記録であり、電子署名や組織の認証システムではない。実装コンテナにはspec・承認・状態・実行基盤をマウントしない。

## 停止・復帰と証拠

```sh
node tools/improvement/cli.mjs pause --state /absolute/run
node tools/improvement/cli.mjs resume --state /absolute/run
node tools/improvement/cli.mjs run --state /absolute/run
node tools/improvement/cli.mjs kill --state /absolute/run
```

`resume` はpauseの指示を解除する操作で、実行開始は次の `run`。killは撤回できない。SIGINT/SIGTERMもpauseとして処理し、実行中の子プロセスを終了する。停止指示の監視は30ms間隔で、Docker準備や終了処理は各最大10秒の境界で確認する。全体期限は初回runからの実時間であり、pause・クラッシュ中も進む。費用予約・試行・期限は再開しても初期化しない。`reservedCostUsd` は予約額であり、実課金 `actualCostUsd` は未取得のためnullのまま。fixtureの模擬予約も消費額の実測として扱わない。同じ不合格が2回続けば上限前でも止まる。

`run --one-step` は実装終了後の検証前で止める。次の別プロセスの `run` は保存した候補ハッシュと固定条件を照合して検証する。会話履歴やcompactionの内容は復帰の判断に使わない。

| ファイル | 役割 |
| --- | --- |
| `sealed-spec.json` | 承認時に固定した要件・条件。原本と両方のハッシュを毎境界で照合 |
| `state.json` | 原子的書込みとfsync。commit、入力、期限、費用予約、試行、状態、イベントの正本 |
| `events.jsonl` | 正本から生成する構造化履歴。本文・鍵・子プロセスの生ログは保存しない |
| `handoff.json` | 状態、変更ファイル、機械判定、人の未確認項目、次の処理 |
| `candidate.json` | 対象commit、spec・入力・成果物のハッシュと候補領域 |
| `attempts/NNN/workspace/` | 試行ごとに分離した候補。元チェックアウトへの自動適用なし |

`state.json` が履歴の正本。強制終了が派生ファイルの置換中に起きた場合、派生ファイルは次の状態更新で再生成される。runの編集権限を持つホスト管理者に対する改ざん耐性は提供しない。

同一runと同一元チェックアウトはleaseとPIDで排他制御する（チェックアウト用のleaseはOS一時領域内）。別runディレクトリによる同時実行も拒否する。生きた所有者がいる場合、期限切れだけでは奪わない。死んだPIDかつlease期限後に復帰し、不確定な実装試行は消費済みとして新しい候補領域で始める。古いコンテナは既知の名前で停止確認してから再開し、確認できなければ止まる。復帰用のlease回収操作そのものが強制終了した場合は安全側にBUSYで止まり、ホスト管理者が実行プロセスの不在を確認して残存 `lease-reclaim/` を除く必要がある。PID再利用時も自動では奪わない。

## Claude Code接続の条件

**実Claude APIでの運転・費用計測・Claude用コンテナの受入は未実施。** Claude用のDockerコマンドと接続先制限はスタブで確認する。製品検証には上記の専用Colima環境を用いるが、Claude接続とは別の環境・承認である。Claudeの導入前には下記を別途実証し、人が受入する。ホスト上のClaudeへ切り替える代替経路はない。

`adapter.kind = "claude-docker"` の設定例（値は実環境で確認したものに置き換える）:

```json
{
  "kind": "claude-docker",
  "image": "sha256:LOCAL_APPROVED_IMAGE_ID_64_HEX",
  "claudeVersion": "2.1.292",
  "model": "claude-APPROVED_MODEL_ID",
  "providerHardCapUsd": 1
}
```

必要条件:

- 人が検査したローカルimageをdigestで固定。自動pullなし。imageはClaude、Node、GNU timeoutをPATHに備え、既定の秘密値・追加volumeを含めない。許容image環境変数はPATH/HOME/LANG/LC_ALL/TZ/NODE_VERSION/YARN_VERSIONだけ。CLIは設定した版と完全一致し、2.1.286以上かつ必要フラグが使用可能。
- 非rootの管理者プロセスからDockerを利用。agentは同じ非root UID、root filesystem読取専用、capability全削除、権限昇格禁止、CPU/メモリ/PID上限。書込み先はコピーした候補領域と一時領域のみ。Dockerの生ログ保存も無効にする。Docker socket、ホストHOME、SSH、Git/Cloudflare鍵はマウントしない。
- 試行ごとのinternal Docker networkを作り、外向き接続は別proxyコンテナへ限定する。proxyは `CONNECT api.anthropic.com:443` の完全一致のみ許可し、任意HTTPや他host/portを拒否。agentのDNS上流は無効化する。proxyは鍵を持たない。実環境では、ホスト/メタデータ/他コンテナ/直接IPv4・IPv6・DNSへの到達拒否も確認する。
- `--bare` と空の厳格MCP設定でローカルhook等の自動読込みを止め、toolはRead/Edit/Write/Glob/Grepに限定する。Bash、Web、MCP、公開操作を渡さない。
- 有料・外部実行の両フラグ `--allow-paid --allow-external`、正の `budget.maxCostUsd`、専用の `IMPROVEMENT_ANTHROPIC_API_KEY`、人が確認したprovider側の課金上限が必要。通常のANTHROPIC_API_KEYや本番鍵は流用しない。鍵をargv・spec・ログに保存しない。
- 各試行の最大額を総予算÷最大試行数で先に全額予約し、結果の自己申告で返金しない。CLIへ `--max-budget-usd` と最大8turnsを渡す。**providerHardCapUsdは人の確認記録で、APIから上限を照会・保証する機能ではない。** CLIの停止だけで厳密な課金上限を保証できないため、provider側の制限が実証できない間は有料運用しない。
- コンテナ内でもtimeoutを使い、制御プロセスがSIGKILLされても残存実行を有限にする。稼働中のkill、終了後の残存除去、再開、ネットワークとmountの実効性を実環境で確認する。

2026-10-21に確認した公式資料: [プログラム実行](https://code.claude.com/docs/en/headless)、[CLIフラグ](https://code.claude.com/docs/en/cli-reference)、[sandboxの範囲](https://code.claude.com/docs/en/sandboxing)、[コンテナ運用](https://code.claude.com/docs/en/devcontainer)。公式のBash sandboxはfile tool・MCP・hookをまとめて隔離するものではないため、この基盤はプロセス全体を別コンテナに置く。公式資料の更新時は、固定CLIとフラグの適合を再確認する。

## 現在の受入範囲と次段階

無料fixtureによる実CLIの修正ループ、別プロセス復帰、二重起動、クラッシュ、同じ失敗、時間/費用上限、spec/commit/入力/候補の変更、保護ファイル、停止操作、人の未確認の保持を回帰検証する。製品用コンテナは実環境で検証し、Claude用接続はスタブのコマンド契約検証に留まる。Claudeのネットワーク隔離や課金の受入とは区別する。

利用者の声から製品を自律変更するには、情報源の利用条件と許諾、反対例・重複・出典を含む要件整理、独立した実機/人の評価、provider課金制限を揃える。既存回帰とブラウザーはCSS用・HTML/JS用の両プロファイルに接続した。Grok API、実Claudeによる自動実装、アフィリエイト投稿、myfans広告の公開は未接続。無料の公開API収集と定期確認は後述のP1を参照し、実装・公開の承認範囲とは混同しない。


## P1: 利用者の声から要件案を作る入口

`tools/improvement/intake.mjs` は、人が利用条件と内容を確認して用意したJSONを読み、出典付きの `requirements.json` と `requirements.md` を新しいフォルダに作る。ネットワーク取得・Grok呼出し・投稿・有料実行・製品変更・自動承認は行わない。

```sh
node tools/improvement/intake.mjs --input /absolute/reviewed-intake.json --output /absolute/new-proposal
```

入力項目と合成例は `tests/improvement-intake.test.mjs` の `input()` を参照。入力はversion/id/targetUser/background/currentSituation/goal/difference、sources、minimum、nonGoals、acceptance、stopConditions、openQuestions。出典はURL・user/competitor/research/platformの区分・supports/challenges/contextの立場・確認日・人がまとめた要約・summary-onlyを持つ。個人の原回答、アカウント情報、原投稿全文、秘密値は入力しない。公開情報でも要約の可否・正確さ・機微情報の除外は人が確認する。

同じURLの追跡パラメーター・フラグメントを除いて重複整理し、異なる見解は消さない。URL数は独立した利用者数や支持数ではない。少なくとも2つのURL、2区分、利用者の声、反対例を点検し、不足や未確定事項があれば `needs_evidence` を返す。これらは運用上の整理条件であり、需要や代表性を証明しない。形式が揃っていても `review_required` に留まり、`executionAuthorized` は常にfalse。

最小要件から出典、完成条件から最小要件への参照を検証する。完成条件がない要件、存在しない参照、未来の確認日、秘密値の典型、資格情報を含むURL、入力のシンボリックリンク、既存の出力先は拒否する。要約は引用された資料として書き出し、文中の命令を実行しない。

人が対象者・独自性・優先度・停止条件を確定してから、実装ファイル・固定された検証器・費用上限を持つ既存のspecへ移す。入口のハッシュと機械的な形式確認を、人の承認の代わりに使わない。公開APIによる外部収集は次節のP1で実装した。製品のHTML/JS変更の隔離検証は上記へ接続済み。有料Claudeの実運転の受入は引き続き別工程。


## P1: 無料の外部収集と接続診断（26.4.0）

```sh
npm run voices:collect -- --config config/voice-sources.json --state /Users/Yodai/KUSEIRO/operations/voices
npm run improvement:doctor -- --claude-plan free
```

公式の[HN検索API](https://github.com/algolia/hn-search)と[GitHub公開Issue検索](https://docs.github.com/en/rest/search/search#search-issues-and-pull-requests)を、鍵なしで読み取る。HNのpersonality test / personality quiz、Formbricksのprivacy、LimeSurveyのmobileが現行の4検索。サイトの回答やログを外部へ送らず、認証済みXやGrokの画面をスクレイピングしない。取得先とGitHub対象リポジトリは固定許可、最大6検索・各8件・各10秒・512KB・リダイレクト禁止。失敗の件数はnullであり0にしない。課金APIや外部の文章を実行する経路を持たない。

`collection.json` が確認候補の正本、`review.md` が閲覧用。本文・投稿者・ハンドルは保存せず、出典URL・日時・検索元・決定的なキーワード論点だけを保存する。個人の嗜好を推定しない。同一URLは統合し、実行を24時間内で繰り返しても再取得しない。最長30日の保持、500候補の上限、ロックと原子的置換を使う。状態はリポジトリと公開ファイルの外に置き、0600で保存する。残ったロックは自動で奪わず、実行プロセス不在を確認して管理者が除く。公開原典が消えた場合や利用条件が変わった場合は、人が候補を除外する。

英語圏・2プラットフォームの他サービスの意見という偏りがある。KUSEIRO対象者、匿名掲載を必須にすることへの納得感、日本語の共有行動の需要は未確認。原典を人が読み、正確な要約・反対例・対象者との一致を確認した後に既存intakeへ渡す。コレクターの件数やキーワードを要件・好意・母集団の比率へ自動変換しない。要件確定と実装承認の境界は維持する。

2026年10月22日の実取得は4検索が応答し、8/8/8/0件、重複統合後22候補。再実行で再通信を行わずスキップすることを確認した。これは資料候補の取得であり、利用者による評価の受入ではない。

接続診断はホストCLIの `--version` とDockerの稼働確認だけを行う。実推論を起動せず、鍵の値を出力しない。当端末はClaude Code 1.0.115、Docker非稼働、専用API鍵なし。本人申告のClaude Freeは[現行のCode利用要件](https://code.claude.com/docs/en/quickstart)を満たさず、[xAI API](https://docs.x.ai/developers/quickstart)には別の鍵とクレジットが必要。[X API](https://docs.x.com/x-api/getting-started/pricing)も従量課金である。X Premiumの契約やブラウザーでのGrok利用をAPI利用権限へ読み替えない。

既存のDocker版Claudeアダプターは、固定spec・隔離・費用上限・有料外部実行の明示承認がそろってから動く。今回の無料条件では接続診断と拒否を確認し、模擬CLIでの接続契約・修正ループを検証する。実Claudeでの自動修正、Claude用コンテナ、課金の受入は未実施。ホストCLIやClaudeウェブ版への無断フォールバックはしない。


定期確認はCodexアプリのheartbeat「KUSEIRO 外部の声を収集」（id: nocturne）を毎朝9時に設定した。アプリの実行環境が利用可能なことが前提で、次回の実行成功はまだ確認していない。24時間の取得間隔、変化がないときの無通知、重要な新しい論点や継続した取得障害だけの通知を指定した。自動実装・課金・送信・公開・広告配信の開始は許可しない。設定を変えるときはアプリのautomation_updateを使う。旧方式の候補は更新分を含め23件だったが、26.5.0の関連性確認後は6件。件数の変化は需要の増減ではない。


## 26.5.0: 関連性と対象者の確認

原典を読むと、HNの検索結果に親記事だけが検索語と一致し、コメント本文は別分野の例があった。`relevancePolicy:2` ではタグやHTML属性を除いた本文・タイトルにも検索語がある候補だけを残す。単語の有無は探索用で、意味の正確さや対象者の一致は保証しない。本文を保存していない旧候補を承認済みと扱わず、方針移行時に1回再取得して候補を再構築する。その後は従来の24時間間隔を維持する。再評価で残った既知URLは新規候補として増やさない。

今回の無料取得は0/0/6/0件、残った6件は全てFormbricksの資料だった。HNも取得は成功したが、関連性フィルタ後の候補は0件。取得失敗のnullとは区別する。6件が複数の利用者や独立した需要を示すとは説明しない。

intakeの各出典に `targetUserMatch`（confirmed/adjacent/unknown）を追加した。省略した旧入力はunknown。userという分類だけでは `target_user_voice` の不足を解除せず、confirmedには対象者との一致を確認した根拠 `targetUserBasis` が必要。これは人の確認表明で、本人確認や内容の正確さを機械が証明するものではない。実行承認は引き続きfalse。

画面監査の出典はauditとして外部利用者の声と区別する。今回の要件案は `/Users/Yodai/KUSEIRO/operations/review/ux-20261022/rich-home-requirements/` に保存した。出典5件、最小要件6件、事前の完成条件5件を対応付けたが、対象者の声と実利用者の受入は未確認のためneeds_evidenceのまま。本人が依頼したUI改善と、実画面で再現した不具合は今回の実装対象とし、需要が未確認の新機能を自動採用しない。


### 2026-10-23：図鑑と共有リンクの回帰確認

共通の画面判定 `scripts/ui-flow.mjs` に、現行の二つ名と未判定の分離、図鑑の詳細、旧図鑑URLの転送、旧共有リンクの再読み込みを追加した。既存の診断から取り下げまでと合わせて20項目を確認する。追加の再読み込みは既存の通信制限に合わせて間隔を空け、サーバーの制限を緩めない。今回の検証は既存のローカル判定関数を実行したもので、実Claudeによる修正や、コンテナ運転の再実行を示すものではない。
