# DiffBell リリース手順書

## 1. 事前準備チェックリスト

### 1-1. 外部サービスのアカウント作成

| サービス | 用途 | URL |
|---|---|---|
| Supabase | DB・Auth・Edge Functions | https://supabase.com |
| Stripe | 決済処理 | https://stripe.com/jp |
| Resend | メール送信 | https://resend.com |
| Cloudflare Pages | フロントエンドホスティング | https://pages.cloudflare.com |
| GitHub | CI/CD | https://github.com |

---

## 2. Stripe セットアップ

### 2-1. 本番モードに切り替え

Stripe ダッシュボード右上のトグルで **「テスト」→「本番環境」** に切り替える。

### 2-2. 商品・価格の作成

1. **「商品」→「商品を作成」**
   - 商品名: `DiffBell Pro`
   - 説明: `最短1時間チェック・20サイト監視・Slack通知`
2. 価格の設定:
   - 価格: `¥490`
   - 請求期間: `月次`
3. 作成後、**Price ID** (`price_xxx`) をメモする

### 2-3. Webhook の設定

1. **「開発者」→「Webhook」→「エンドポイントを追加」**
2. エンドポイントURL:
   ```
   https://<SUPABASE_PROJECT_REF>.supabase.co/functions/v1/stripe-webhook
   ```
3. 購読するイベント（以下を選択）:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. 作成後、**Webhook シークレット** (`whsec_xxx`) をメモする

### 2-4. Stripe カスタマーポータルを有効化

**「設定」→「カスタマーポータル」** を開き、ポータルを有効にする。
- キャンセルポリシー: 月末に解約
- 請求書のダウンロード: 有効

### 2-5. Stripe API キーの取得

**「開発者」→「APIキー」** から本番環境の **シークレットキー** をメモする。

---

## 3. Supabase セットアップ

### 3-1. プロジェクト作成

1. Supabase ダッシュボードで新規プロジェクトを作成
2. リージョン: `Northeast Asia (Tokyo)`
3. **プロジェクト設定 → API** から以下をメモ:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. **プロジェクト設定 → General** から `Project Reference ID` をメモ

### 3-2. マイグレーションの適用

```bash
# Supabase CLI のインストール（未インストールの場合）
brew install supabase/tap/supabase

# ログイン
supabase login

# プロジェクトをリンク
supabase link --project-ref <PROJECT_REF>

# マイグレーションを実行（本番DBへ適用）
supabase db push
```

### 3-3. Edge Functions のデプロイ

```bash
# 全関数をデプロイ
supabase functions deploy check-due-monitors
supabase functions deploy check-single-monitor
supabase functions deploy cleanup-old-snapshots
supabase functions deploy send-notifications
supabase functions deploy send-test-notification
supabase functions deploy delete-account
supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session
supabase functions deploy stripe-webhook
```

### 3-4. 環境変数（シークレット）の設定

```bash
# Supabase 組み込み変数（自動設定済み）
# SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY

# Resend
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
supabase secrets set RESEND_FROM_EMAIL=noreply@diffbell.app

# Stripe
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx
supabase secrets set STRIPE_PRO_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxx

# アプリURL（Stripe リダイレクト先）
supabase secrets set APP_URL=https://diffbell.app

# Cron 認証トークン（ランダムな文字列を生成して設定）
supabase secrets set CRON_SECRET=$(openssl rand -base64 32)
```

### 3-5. Cron ジョブの設定

Supabase ダッシュボード **「Database」→「Extensions」** で `pg_cron` が有効になっていることを確認してから SQL エディタで実行：

```sql
-- setup_cron.sql の内容を実行
-- （supabase/setup_cron.sql を参照）
```

または CLI で:

```bash
supabase db execute --file supabase/setup_cron.sql
```

### 3-6. Auth 設定

Supabase ダッシュボード **「Auth」→「URL Configuration」**:
- Site URL: `https://diffbell.app`
- Redirect URLs に追加:
  ```
  https://diffbell.app/reset-password/confirm
  ```

**「Auth」→「Email Templates」** でメールテンプレートを日本語化することを推奨。

---

## 4. Resend セットアップ

1. **「Domains」→「Add Domain」** で送信ドメインを追加
2. DNS レコードを設定（SPF, DKIM, DMARC）
3. ドメイン認証後、`RESEND_FROM_EMAIL` を `noreply@<your-domain>` に設定

---

## 5. Cloudflare Pages セットアップ

### 5-1. プロジェクト作成

1. **「Workers & Pages」→「Create」→「Pages」**
2. GitHub リポジトリを接続
3. ビルド設定:
   | 項目 | 値 |
   |---|---|
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | `/` |

### 5-2. 環境変数（フロントエンド）

**「Settings」→「Environment variables」** に追加:

| 変数名 | 値 |
|---|---|
| `VITE_SUPABASE_URL` | Supabase プロジェクト URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon Key |

### 5-3. カスタムドメインの設定

1. **「Custom domains」→「Set up a custom domain」**
2. `diffbell.app` を追加
3. DNS プロバイダーで CNAME を設定

---

## 6. DNS 設定（Cloudflare）

| タイプ | 名前 | 内容 |
|---|---|---|
| CNAME | `@` (または `diffbell.app`) | Cloudflare Pages の CNAME |
| CNAME | `www` | Cloudflare Pages の CNAME |
| TXT | `_dmarc` | Resend の DMARC レコード |
| TXT | `@` | Resend の SPF レコード |
| CNAME | `resend._domainkey` | Resend の DKIM レコード |

---

## 7. デプロイ手順（通常リリース）

```bash
# 1. テストを通す
npm run test
npm run typecheck

# 2. main ブランチにマージ（GitHub PRを経由）

# 3. GitHub Actions が自動でトリガー（deploy.yml）
#    - マイグレーション適用
#    - Edge Functions デプロイ
#    - Cloudflare Pages ビルド & デプロイ

# 4. デプロイ後の動作確認（以下チェックリストを参照）
```

### GitHub Actions シークレットの設定

リポジトリの **「Settings」→「Secrets and variables」→「Actions」** に追加:

| シークレット名 | 値 |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | `supabase token` で取得 |
| `SUPABASE_PROJECT_ID` | プロジェクト Ref ID |
| `SUPABASE_DB_PASSWORD` | DB パスワード |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API トークン |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare アカウント ID |

---

## 8. リリース後の動作確認チェックリスト

### 基本機能

- [ ] `https://diffbell.app` にアクセスしてランディングページが表示される
- [ ] 新規サインアップができる
- [ ] ログイン・ログアウトができる
- [ ] パスワードリセットメールが届く
- [ ] 監視URLを追加できる（Free: 3件まで）
- [ ] 手動チェックが実行される
- [ ] 変更履歴が表示される
- [ ] メール通知が届く
- [ ] 設定ページでSlack Webhook URLが保存できる
- [ ] テスト通知が送信できる（メール・Slack）

### 決済フロー

- [ ] `/billing` ページが表示される
- [ ] 「Proにアップグレード」でStripeチェックアウトに遷移する
- [ ] テストカード（`4242 4242 4242 4242`）で決済が完了する
- [ ] 決済後、`/billing?success=1` にリダイレクトされる
- [ ] DBの `subscriptions.plan` が `pro` になっている
- [ ] `user_settings.max_monitors` が 20、`min_interval_hours` が 1 になっている
- [ ] ダッシュボードで20件まで監視URLが追加できる
- [ ] Stripe カスタマーポータルが開ける
- [ ] ポータルからキャンセル後、プランが `free` に戻る

### セキュリティ

- [ ] `/dashboard` に未ログインでアクセスすると `/login` にリダイレクトされる
- [ ] 他ユーザーのデータにアクセスできない（RLS確認）
- [ ] `check-due-monitors` エンドポイントが認証なしで叩けないこと（401が返る）
- [ ] `send-notifications` エンドポイントが認証なしで叩けないこと（401が返る）
- [ ] CSPヘッダーが設定されていること（DevTools → Network → Response Headers で確認）

### 監視サイクル

- [ ] Cron ジョブが動いている（Supabase ダッシュボード → Database → pg_cron で確認）
- [ ] 1時間後に自動チェックが実行されている（`check_runs` テーブルを確認）

---

## 9. モニタリング

### 確認箇所

| 対象 | 確認場所 |
|---|---|
| Edge Function ログ | Supabase ダッシュボード → Functions → Logs |
| DB サイズ | Supabase ダッシュボード → Settings → Database |
| メール送信ログ | Resend ダッシュボード → Emails |
| Stripe 決済ログ | Stripe ダッシュボード → Payments |
| Cloudflare アクセスログ | Cloudflare → Analytics |

### アラート設定（推奨）

- Supabase: Disk Usage が 80% 超えたら通知
- Stripe: 決済失敗率が 5% 超えたら通知
- Cloudflare: エラー率が 1% 超えたら通知

---

## 10. ロールバック手順

### フロントエンドのロールバック

```bash
# Cloudflare Pages ダッシュボード → Deployments → 前のデプロイを「Rollback」
```

### DB マイグレーションのロールバック

```bash
# マイグレーションのロールバック（手動）
supabase db execute --file supabase/migrations/rollback/<migration_name>.sql
```

> **注意**: マイグレーションのロールバックは慎重に行うこと。`subscriptions` テーブルのドロップは課金データの消失につながります。

### Edge Functions のロールバック

```bash
# 旧バージョンのコードに戻してデプロイ
git checkout <previous_commit>
supabase functions deploy <function_name>
```

---

## 11. 料金設定の変更方法

Stripe ダッシュボードで既存の価格は変更不可（新しい価格を作成する必要あります）。

1. Stripe に新しい Price を作成
2. `STRIPE_PRO_PRICE_ID` シークレットを更新:
   ```bash
   supabase secrets set STRIPE_PRO_PRICE_ID=price_<new_id>
   ```
3. 既存のサブスクライバーは既存の価格が適用されるため、移行が必要な場合はStripe APIで更新

---

## 12. サポート・問い合わせフロー

1. ユーザーからの問い合わせは **メール** で受け付け（`support@diffbell.app`）
2. Stripe 関連の問題（請求・キャンセル）は Stripe カスタマーポータルへ誘導
3. アカウント削除はアプリ内の設定ページから実施（`/settings` → 「アカウントを削除」）
