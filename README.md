# HEKI16 PRO

Cloudflare公開版: https://heki16-pro.aiyume.workers.dev/

現在のサイト版は16.65.1、診断スコアのエンジンは16.64.3です。作業先は `/Users/Yodai/heki16`。ChatGPTプロジェクト内の同期元を変更せず、既存Git履歴を引き継いだ独立した作業ディレクトリです。現在はGitの送信先を設定していません。

## 開発と公開

Node.js 22以降を使います。Wranglerは開発用依存として固定し、実行時の外部パッケージ・CDNは使いません。

```sh
npm ci
npm run verify
npm run preview
```

Cloudflareと同じ配信設定のローカル版は `http://127.0.0.1:8767/`。`npm run serve` の8766番は単純なHTMLプレビューで、Cloudflareの応答ヘッダーを再現しません。

```sh
npm exec wrangler whoami
npm run deploy
node scripts/smoke-public.cjs
```

公開前に、ビルド・診断回帰テスト・広告設定テスト・公開範囲とCSPの検証が自動で走ります。`wrangler.jsonc` が公開設定の正本です。公開先はCloudflare Workers Static Assets。ChatGPT Sites用の `.openai/hosting.json` はこの作業コピーから取り除きました。

`dist/index.html` が診断アプリ本体です。`scripts/build-content.cjs` が16タイプの読み物・ガイド・プライバシー・広告方針とサイトマップを生成します。これらの生成先HTMLを直接編集せず、生成元を更新してください。公開ファイルのSHA-256は `dist/version.json` に記録します。調査資料・設定・開発用ファイルは公開しません。

## 広告とアフィリエイトの有効化

広告ID・提携リンクは未取得です。現在の広告キャンペーンは0件で、広告・解析スクリプトは読み込みません。収益化の審査を通過した状態ではありません。

掲載先には、このサイトが成人向けの性癖・関係性をテーマにしていることを伝え、サイトと掲載プログラムの承認を得てください。一般的な広告サービスを無条件に使える題材ではありません。Googleの制限対象とA8.netの禁止事項は改善計画に出典付きで整理しています。

承認後、`config/monetization.json` に実際のURLと掲載条件を設定します。以下は設定形式の例で、利用できる提携先・商品ではありません。

```json
{
  "enabled": false,
  "siteApproved": false,
  "allowedHosts": ["merchant.example"],
  "campaigns": [{
    "id": "partner-reading",
    "enabled": true,
    "title": "実際の掲載内容に差し替える",
    "description": "確認した内容だけを記載する",
    "merchant": "承認済みの提供元名",
    "url": "https://merchant.example/approved-link",
    "placements": ["home", "result", "content"],
    "expiresAt": "2027-01-01T00:00:00+09:00"
  }]
}
```

実際の提携URL・ホスト・条件を確認できてから、`enabled` と `siteApproved` をtrueにして `npm run deploy`。後者は運営者による確認の記録であり、広告サービスの承認を自動照会する機能ではありません。

掲載はトップの下部、結果の下部、読み物に限定し、1箇所3件までです。質問画面には入りません。PR表示・提供元・報酬が発生する場合があることを明記し、リンクには `rel="sponsored noopener noreferrer"` を設定します。診断結果による広告の出し分けや、回答・名前・スコアの広告URLへの自動付加はしません。

停止は `enabled:false` に戻して再公開します。期限切れのキャンペーンはビルド時に除外されます。稼働中のページを時刻だけで自動更新する仕組みではないため、契約終了前に停止・再公開してください。提携終了・URL変更・条件変更のたびに確認します。

バナーJSやAdSenseタグをそのまま貼り付ける方式にはしていません。現在のCSPは外部接続を禁止しています。外部広告スクリプトを追加するときは、掲載許可、Cookie・同意、データ送信先、CSP、無効トラフィック対応を改めて設計してください。実在する認定広告配信元の情報がないため、ads.txtも生成しません。

## データと費用

途中回答・診断結果・表示名・タグは端末のlocalStorageに保存します。相手・グループの入力は保存しません。サーバーへの診断データ送信、アカウント、決済、生成AI呼び出しはありません。旧コードは引き続き受け付けますが、未保存の値は復元できません。

旧ドメインや別端末の保存内容はCloudflare版に自動移行しません。共有コードは相性画面で読めますが、全データのバックアップにはなりません。

現行版は静的配信です。D1・R2・Workers AIは使っていません。追加課金の対象になり得るAPIやストレージ設定が混入した場合は公開前チェックで止めます。既存のCloudflareアカウント全体の請求額を制限するものではありません。静的アセット配信が無料であることはCloudflare公式の料金説明を参照してください。

## 検証と課題

`npm run verify` は診断16件・広告7件のテストと公開設定の検証を実行します。`scripts/smoke-public.cjs` は公開マニフェストと26ファイルを照合し、API・設定等の7パスが404になることを確認します。

実画面の確認、改善優先順位、広告審査、費用対策、残る未検証事項は [監査と改善計画](docs/AUDIT_AND_IMPROVEMENT_PLAN.md) にまとめています。画像のPNG生成と、iPhoneで実際に保存・共有できることは別の確認項目です。

ライブラリのライセンスは `THIRD_PARTY_NOTICES.md` と公開版の `/THIRD_PARTY_NOTICES.txt` を参照してください。
