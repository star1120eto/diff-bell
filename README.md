# DiffBell

Webサイトの変化を自動検出して通知する監視サービス。

---

## 技術スタック

| レイヤー       | 技術                                                   |
| -------------- | ------------------------------------------------------ |
| フロントエンド | React 18 / Vite / TypeScript (strict) / Tailwind CSS   |
| 認証 / DB      | Supabase Auth / Supabase Postgres / Row Level Security |
| バックエンド   | Supabase Edge Functions (Deno)                         |
| 定期実行       | Supabase Cron                                          |
| メール通知     | Resend                                                 |
| ホスティング   | Cloudflare Pages                                       |
| CI/CD          | GitHub Actions                                         |
| ローカル開発   | Docker / Dev Container / Supabase CLI                  |
| テスト         | Vitest / Testing Library / Playwright / pgTAP          |

---

## ローカル起動方法（推奨: Dev Container）

### 前提

- Docker Desktop がインストール済みであること
- VS Code + Dev Containers 拡張がインストール済みであること

### Dev Container で起動

```bash
# リポジトリをクローン
git clone https://github.com/your-org/diff-bell.git
cd diff-bell

# VS Code で開く → 「Reopen in Container」を選択
code .
# → postCreateCommand: make setup が自動実行される
```

---

## Docker / Supabase ローカル起動方法（Dev Container なしの場合）

### 前提

- Node.js 22+
- pnpm 9+
- Docker Desktop
- [Supabase CLI](https://supabase.com/docs/guides/cli)

```bash
# 依存インストール + Supabase 起動 + マイグレーション + seed を一括実行
make setup

# 開発サーバーを起動
make dev
# → http://localhost:5173 でアクセス可能
# → http://localhost:54323 で Supabase Studio
# → http://localhost:54324 で Inbucket (メール確認)
```

---

## Supabase local 起動手順

```bash
# Supabase local を起動
make supabase-start
# または
supabase start

# 起動後のキー確認
supabase status

# Supabase を停止
make supabase-stop
```

---

## マイグレーション実行方法

```bash
# DB をリセット（マイグレーション + seed を再適用）
make db-reset

# マイグレーションのみ適用
make db-migrate

# seed のみ適用
make db-seed
```

### 新しいマイグレーションを作成する場合

```bash
supabase migration new <migration_name>
# supabase/migrations/<timestamp>_<name>.sql が生成される
```

---

## テスト実行方法

```bash
# ユニットテスト（Supabase 不要）
make test-unit

# pgTAP RLS テスト（Supabase local が必要）
make test-db

# インテグレーションテスト（Supabase local が必要）
make test-integration

# E2E テスト（開発サーバー + Supabase local が必要）
make test-e2e

# Playwright UI モード
make test-e2e-ui

# 全テスト
make test-all
```

---

## Edge Function 実行方法

```bash
# Edge Functions をローカルで起動（Supabase local が必要）
make functions-serve

# 特定の関数を起動
supabase functions serve check-due-monitors --env-file .env

# 関数を手動でテスト（例: check-single-monitor）
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/check-single-monitor' \
  --header 'Authorization: Bearer <SERVICE_ROLE_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{"monitor_id":"<uuid>"}'
```

---

## コード品質チェック

```bash
# lint + format-check + typecheck を一括実行
make check

# 個別実行
make lint
make format-check
make typecheck

# 自動修正
make lint-fix
make format
```

---

## CI/CD の説明

### PR 時（`.github/workflows/pr.yml`）

```
PR → main
  ├── quality        : lint, format-check, typecheck, unit test, build
  ├── migration-check: supabase db push --dry-run, pgTAP RLS テスト
  ├── integration    : Supabase local + Vitest integration test
  └── e2e-smoke      : Playwright smoke test
```

### main マージ時（`.github/workflows/deploy.yml`）

```
push → main
  ├── test           : PR と同等のテストを再実行
  ├── db-migrate     : supabase db push（本番 Supabase）
  ├── functions-deploy: supabase functions deploy
  └── pages-deploy   : Cloudflare Pages へデプロイ
```

---

## デプロイ方法

### 初回セットアップ

1. Supabase プロジェクトを作成（[supabase.com](https://supabase.com)）
2. Cloudflare Pages プロジェクトを作成
3. GitHub Secrets に以下を設定:

| Secret 名                   | 説明                                             |
| --------------------------- | ------------------------------------------------ |
| `SUPABASE_URL`              | Supabase プロジェクト URL                        |
| `SUPABASE_ANON_KEY`         | anon（公開）キー                                 |
| `SUPABASE_SERVICE_ROLE_KEY` | service role キー（Edge Function 用）            |
| `SUPABASE_DB_PASSWORD`      | DB パスワード                                    |
| `SUPABASE_ACCESS_TOKEN`     | Supabase CLI 用 PAT                              |
| `SUPABASE_PROJECT_REF`      | プロジェクト参照 ID                              |
| `RESEND_API_KEY`            | Resend API キー                                  |
| `CRON_SECRET`               | Cron → Edge Function 認証シークレット            |
| `CLOUDFLARE_API_TOKEN`      | Cloudflare API トークン                          |
| `CLOUDFLARE_ACCOUNT_ID`     | Cloudflare アカウント ID                         |
| `APP_URL`                   | 本番アプリ URL（例: https://diffbell.pages.dev） |

4. `main` ブランチへマージすると自動デプロイ

---

## 環境変数一覧

`.env.example` をコピーして `.env` を作成してください。

```bash
cp .env.example .env
```

| 変数名                      | 必須      | 説明                                          |
| --------------------------- | --------- | --------------------------------------------- |
| `VITE_SUPABASE_URL`         | ✅        | Supabase API URL                              |
| `VITE_SUPABASE_ANON_KEY`    | ✅        | Supabase anon キー（フロントエンド用）        |
| `VITE_APP_URL`              | ✅        | アプリ URL                                    |
| `SUPABASE_URL`              | ✅        | Supabase API URL（テスト / Edge Function 用） |
| `SUPABASE_ANON_KEY`         | ✅        | anon キー（テスト用）                         |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅        | service role キー（Edge Function / テスト用） |
| `SUPABASE_DB_PASSWORD`      | ✅        | DB パスワード                                 |
| `SUPABASE_ACCESS_TOKEN`     | deploy 時 | Supabase CLI PAT                              |
| `SUPABASE_PROJECT_REF`      | deploy 時 | Supabase プロジェクト参照 ID                  |
| `RESEND_API_KEY`            | ✅        | Resend API キー                               |
| `RESEND_FROM_EMAIL`         | ✅        | 送信元メールアドレス                          |
| `CRON_SECRET`               | ✅        | Cron 認証シークレット                         |
| `CLOUDFLARE_API_TOKEN`      | deploy 時 | Cloudflare API トークン                       |
| `CLOUDFLARE_ACCOUNT_ID`     | deploy 時 | Cloudflare アカウント ID                      |

---

## 運用上限（MVP）

| 項目                       | 上限  | 理由                           |
| -------------------------- | ----- | ------------------------------ |
| 1ユーザーあたりの監視URL数 | 20件  | Supabase 無料枠での負荷管理    |
| 最小監視間隔               | 1時間 | robots.txt 配慮・サーバー負荷  |
| 1バッチの最大処理件数      | 50件  | Edge Function タイムアウト対策 |
| HTMLの最大取得サイズ       | 2MB   | メモリ・コスト対策             |
| HTTPリダイレクト上限       | 5回   | SSRF・無限ループ対策           |
| fetchタイムアウト          | 10秒  | Edge Function タイムアウト対策 |
| スナップショット保持世代   | 5世代 | ストレージコスト対策           |
| check_runs 保持期間        | 30日  | DB サイズ対策                  |
| change_events 保持期間     | 90日  | DB サイズ対策                  |
| notifications 保持期間     | 180日 | DB サイズ対策                  |

---

## セキュリティ注意事項

- **`.env` は絶対に git commit しないこと**（`.gitignore` で除外済み）
- `SUPABASE_SERVICE_ROLE_KEY` はサーバーサイド（Edge Function）のみで使用。フロントエンドに露出させないこと
- SSRF 対策: プライベート IP / localhost / AWS メタデータエンドポイントへのアクセスは Edge Function レベルでブロック
- XSS 対策: 差分表示時の HTML は DOMPurify でサニタイズ
- RLS: 全ユーザーデータテーブルで有効化済み。anon ロールは自分のデータのみアクセス可
- Resend の送信先は `auth.users.email` から取得（ユーザー自身のメールのみ）

---

## robots.txt / 利用規約の配慮

DiffBell は監視対象サイトの `robots.txt` を取得し、`User-Agent: DiffBell/1.0 (+https://diffbell.app/bot)` に対する `Disallow` を確認します。

- `Disallow` に該当する URL は、アプリ内で警告として表示します
- クローリングの実行・停止はユーザーの判断に委ねます
- 利用規約上、監視対象サイトの利用規約への遵守はユーザーの責任とします

---

## トラブルシューティング

### `supabase start` が失敗する

```bash
# Docker Desktop が起動していることを確認
docker info

# ポートの競合を確認
lsof -i :54321 -i :54322 -i :54323

# Supabase を強制停止してから再起動
supabase stop --backup
supabase start
```

### pnpm install でエラーが出る

```bash
# Node.js のバージョンを確認（22+ が必要）
node -v

# キャッシュをクリアして再インストール
pnpm store prune
pnpm install
```

### Integration テストが失敗する

```bash
# Supabase が起動しているか確認
supabase status

# SUPABASE_ANON_KEY が .env に設定されているか確認
cat .env | grep SUPABASE_ANON_KEY

# DB をリセットして再試行
make db-reset
make test-integration
```

### E2E テストが失敗する

```bash
# Playwright ブラウザを再インストール
pnpm exec playwright install chromium --with-deps

# Playwright レポートを確認
pnpm exec playwright show-report
```
