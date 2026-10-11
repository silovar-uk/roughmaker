# ラフメイカー / ROUGH MAKER

**構成は磨く。装飾は磨かない。** コンサル・経営資料の論理、メッセージ、根拠、順番、表現形式をタイルだけで構成する個人専用アプリ。

## 現在の実装

- 8カテゴリ・64種類のラフ構図を検索／プレビュー／選択。数値入力なし
- 資料一覧、8つのデッキブループリント＋白紙、章・タイルCRUD、PCドラッグ／スマホ上下操作
- 主張1文、役割、構図、意味ラベル、必要根拠、接続語、メモを編集
- Undo/Redo（50段階）、800ms自動保存、競合検出(409)・JSON救出、版の手動保存と復元
- 論理のレントゲン：メッセージを連続表示、未入力・主張重複・根拠・長文・接続関係を点検
- PPTX（編集可能な文字・図形のラフ骨格）、JSON、Markdown、TSV出力、JSONインポート
- Cloudflare Workers（静的アセットまでWorkerがJWT検証）＋Cloudflare D1
- GitHub Actionsから自動更新（認証の設定完了まで安全装置でブロック）

## PCで動作確認

```bash
node --version            # Node.js 20以降
npm run dev              # http://127.0.0.1:8788
npm run check
npm test
```

**ローカル開発はCloudflare Access認証がない。** 開発サーバーは`127.0.0.1`のみで起動し、本番公開に使用しないこと。ローカルのサンプルデータは`data/dev-db.json`に保存（Gitに含めない）。

## GitHubから本番を更新する手順

1. [silovar-uk/roughmaker](https://github.com/silovar-uk/roughmaker) の`main`に実装済み。**2026-10-11時点ではPublic**のため、ソースコードも非公開にしたい場合はGitHubの`Settings → General → Danger Zone → Change repository visibility`からPrivateへ変更する。GitHub上の公開設定とWeb画面のアクセス制御は別物。
2. CloudflareでD1 database `roughmaker-prod` を作成する（`npx wrangler d1 create roughmaker-prod`）。データベースのIDを控える。
3. Cloudflare Zero Trustで **Worker `roughmaker-prod` の本番URL、workers.dev、各プレビューURL、カスタムドメインをすべてAccess Applicationで保護**。Policyは本人のメールアドレス完全一致の`Allow`のみ。ドメイン許可やEveryoneは使わない。One-time PINはログイン方式としてのみ使用し、許可ルールにしない。
4. `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`、`CLOUDFLARE_D1_DATABASE_ID` をGitHubリポジトリの **Settings → Secrets and variables → Actions → Repository secrets** に設定する。
5. いったんデプロイしてWorkerのURLを確定させる必要がある場合でも、Workerの機密設定が揃うまでデフォルトで全要求を503拒否する。**Accessを適用し、アプリ全体を未認証で取得できないことを確認するまで実案件データを投入しない**。
6. Workerの秘密変数（GitHubではなくCloudflare）として`ACCESS_ISSUER`（`https://<team>.cloudflareaccess.com`）、`ACCESS_AUD`（Access ApplicationのAUDタグ）、`OWNER_EMAIL`（自分のメールアドレス）を`npx wrangler secret put <NAME>`で設定する。
7. 最後にGitHub Secretsで`DEPLOY_APPROVED=true`を設定し、Actionsの`Deploy private Roughmaker Worker`を手動で再実行する。以後は`main`にpushすると自動デプロイ。
8. ログアウト状態・許可外メール・API直接アクセス・静的JS/CSS・プレビューURL・workers.devURLへの未認証リクエストが全てブロックされることを検証する。

**注意**：`DEPLOY_APPROVED=true`が未設定ならGitHub Actionsのデプロイ部分は**正常にスキップ**する（CIテストは実行）。Access確認前に承認フラグを有効化しないこと。GitHubのprivate repositoryはソースへのアクセスを制御するものだが、Webサイトの保護はCloudflare Access＋Worker JWT検証が担当する。

> Cloudflareのデプロイ作業にはユーザー本人のCloudflareアカウント設定が必要。トークン・メールアドレス・AUDはコードへ絶対にコミットしないこと。

## 技術構成

- UI：標準HTML/CSS/JavaScript ES modules（環境に依存せずGitHubで編集しやすい構成）。ビルド不要
- PPTX：PptxGenJS 4.0.0のブラウザ版（MITライセンス同梱）
- Backend：Cloudflare Workers / D1（Access JWT RS256署名・aud・iss・email・exp検証）
- CI：Node.js標準テストランナー＋構文検査

## セキュリティ

- Workerの`assets.run_worker_first:true`：保護前に静的アセットを配信しない
- `Cf-Access-Jwt-Assertion`に対してCloudflare公開鍵による署名と許可ユーザーを検証
- Access設定が欠落した場合は403や未認証ページではなく**503でfail closed**
- D1で所有者スコープのSQL・期待revisionで保存・409競合
- APIはno-store、同一Originのみ書込可、1.5MB上限、CSP・X-Frame-Options等
- ダウンロードしたファイルの保護は利用者が行う

## ショートカット

- Ctrl+Enter：タイル追加 / Ctrl+D：選択タイル複製
- Ctrl+Shift+↑/↓：選択タイル移動 / Ctrl+Z：元に戻す / Ctrl+Y：やり直す
- V：構成／論理を切り替える / Escape：ドロワーを閉じる
- 入力中はブラウザ標準ショートカットを優先

## 今後の候補（未実装）

- P2：ストーリー分岐（2種類の構成案を差分比較）、明示許可によるAIレビュー
- 実機PowerPointとiOS Safariでの手動受け入れ検証
- ブラウザE2E自動テスト、PPTXの全64テンプレート骨格を個別に高精細化

## 参考資料

- [デジタル庁 デザインシステム](https://design.digital.go.jp/dads/)
- [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/binding/)
- [Cloudflare Access Worker](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)
- [PptxGenJS](https://github.com/gitbrent/PptxGenJS)

## 品質と実装判断

- [テスト記録](docs/QA.md)
- [セキュリティ受け入れ項目](docs/SECURITY.md)
- [React/Viteを採用しなかった理由](docs/ADR/0001-dependency-light-ui.md)
