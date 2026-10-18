# HEKI16

公開先: https://heki16-pro.aiyume.workers.dev/

作業先: `/Users/Yodai/heki16`。サイト17.0.7 / 質問票 `reflection-1`。同期元とChatGPT Sitesの元コードを変更せず、独立したGit履歴の作業コピーで開発しています。送信先のGitリモートは未設定です。

## 使い方と構成

落ち着いた画面で18問・32問のセルフチェック、8つの別々の好み、主導・委ねについての想像と現実の希望、自由タグ、2〜4人の比較、選択式の共有URLとPNGを利用できます。科学的に検証された性格検査・タイプ分類・相性成功率ではありません。旧版の機能と保存データは `/legacy/` で利用でき、旧版のコードも保持しています。旧ドメインのlocalStorageは別ドメインへ自動移行しません。

- `src/index.html`, `src/home.html`, `src/app.css`, `src/app.mjs`: 新しい画面。トップの本文は静的HTMLにも出力します。
- `src/reflection.mjs`: 独自の質問、回答の振り返り、タグ整理、共有コード。
- `src/legacy.html`: 保存済みの旧版。新しい画面の結果と混ぜません。
- `src/worker.mjs`, `migrations/`: 同意した回答の受付・撤回・集計・品質点検。
- `scripts/build-content.cjs`: 読みもの、出典、16タイプの創作図鑑、プライバシー等を生成。
- `scripts/prepare-deploy.cjs`: CSP、公開ファイルのマニフェスト、ハッシュを生成。
- `config/monetization.json`: 広告の実在する掲載条件。現在は無効。
- `config/research.json`: 公開可能なTurnstileサイトキー。秘密キーは含めません。

`dist/` は生成物です。生成元を編集してください。ソース、設定、調査資料、秘密情報は公開しません。

## 開発・検証・公開

Node.js 22.19以降。Wranglerを固定しています。

```sh
npm ci
npm exec wrangler d1 migrations apply heki16-research --local
npm run verify
npm run preview
```

プレビューは `http://127.0.0.1:8767/`。Cloudflareと同じWorker・D1・R2のローカル環境です。ローカルのデータ受付は本番の秘密キーを使わず、未設定なら拒否します。質問・タグ・共有は受付が停止していても動きます。

```sh
npm exec wrangler whoami
npm exec wrangler d1 migrations apply heki16-research --remote
npm run deploy
node scripts/smoke-public.cjs
```

公開前に新旧の回帰・広告・公開範囲・CSP・ファイル一致の検証が走ります。`wrangler.jsonc` が公開設定の正本です。静的ファイルはアセット優先、動的処理は `/api/*` に限定。公開26ページ、旧版はnoindex。検索への実際の登録・順位は未確認です。

## 研究への協力と自律処理

通常の回答・タグは端末内だけで処理します。任意の同意をした18歳以上の方だけが数値回答とコース、分類ごとのタグ数を提供できます。自由タグ本文・名前・連絡先・IPアドレスは回答DBに保存しません。提供先はCloudflare D1です。

端末には削除用のランダムな控えを保存し、DBにはそのハッシュを保存します。撤回は本人の控えで照合して回答を削除し、公開集計を無効化します。控えのJSONはローカルへ保存でき、`/#withdraw` で取り消しに使えます。控えを失うと本人照合できません。

15分ごとのCronが180日を超えた回答を削除し、直近14日から1日最大140件、合計最大1,960件を点検します。200件以上の異なる完全回答・7日以上の回答日・8項目群それぞれのα係数0.7以上1未満・除外率20%以下をすべて満たす場合のみ、集計参考値を更新します。これらは暫定の運用ゲートであり、尺度の妥当性の証明ではありません。完全同一回答と一律回答は品質計算から除外します。同一人物の複数回答は完全には排除できず、件数を人数と呼びません。

R2は公開ドメインを無効にし、個人回答を置かず、最新の品質レポートと公開用集計、回答内容を含まない削除記録、復旧作業の進み具合を保管します。削除記録には31日の自動有効期限を設定しています。公開APIは集計の版とDBの変更を照合し、撤回と集計処理が競合しても古い版を返しません。品質未達・再計算失敗時は参考値を非公開にします。質問や創作タイプを未検証のまま自動で書き換える機能は入れていません。

D1のTime Travelには削除前のデータが最大30日残ります。復旧するときは先に `RESEARCH_ENABLED=false`、`RECOVERY_MODE=新しいUUID` にして再公開します。D1の復旧後、定期処理がR2の削除記録を1回最大1,000件ずつ再適用し、`maintenance` に `recovery_complete` が記録されるまで待ちます。復旧モード中は受付と参考値公開を閉じます。再適用と整合性を確認してから `RECOVERY_MODE=off` と受付を戻します。D1全体の巻き戻しは通常運用で実行しません。復旧訓練は未実施です。

## Bot対策と費用

- Turnstileの成功・ホスト名・用途をサーバーで検証。秘密キー欠落、誤ったOrigin、無効入力は拒否。
- 入力4KiB、回答値と項目の厳密な検査、個別10回/分・同一拠点合計120回/分の制限。
- SQLiteのトリガーで、日次の新規受入500件を厳密に制限。重複再送で枠を消費しません。
- Worker CPU 50ms、集計の上限1,960件。生成AI・有料外部APIは呼びません。
- Cloudflareのリミッターは拠点ごとの近似値です。受入上限は攻撃リクエストの課金そのものを止める上限ではなく、アカウント全体を月5ドルに固定する保証はありません。

受付の緊急停止は `RESEARCH_ENABLED` を `false` にして再公開します。閲覧とセルフチェックを続けたまま止められます。Cloudflareの請求・利用量も確認してください。料金は公式の [Workers](https://developers.cloudflare.com/workers/platform/pricing/)、[D1](https://developers.cloudflare.com/d1/platform/pricing/)、[R2](https://developers.cloudflare.com/r2/pricing/) を正本とし、古いローカル資料の料金表を引用しません。

## 広告・アフィリエイト

掲載ID・提携先URLは未取得で、広告は無効です。サイトの成人向けテーマを認める掲載先・プログラムの承認を得てから、`config/monetization.json` の `enabled` / `siteApproved` / `allowedHosts` / 実在するcampaignsを設定して再公開します。

campaignsは `id`, `enabled`, `title`, `description`, `merchant`, `url`, `placements`（home/result/content）, `expiresAt` を持ちます。最大6件・各枠3件、HTTPSとホスト許可、PR・報酬開示、sponsored属性を強制。質問中の掲載や結果・タグによる広告の出し分け、広告URLへの個人情報の付加は禁止しています。期限はビルド時の検証なので、終了前に停止して再公開します。

Googleの性的テーマへの広告制限、A8.netのアダルトサイト登録禁止により、一般向けの掲載サービスを無条件には使えません。承認を得た状態・収益が発生する状態とは区別してください。追跡用広告JSと架空のads.txtは設置しません。

## 確認結果と次の計画

[監査と改善計画](docs/AUDIT_AND_IMPROVEMENT_PLAN.md) に、Geminiの経緯、旧版の課題、変更の根拠、研究・事業・UX・安全性の残課題を記録しています。実画面の確認と、本当の参加者による使用感・心理測定の検証は別です。
