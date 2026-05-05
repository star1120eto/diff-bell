.PHONY: help setup dev build test test-unit test-integration test-e2e \
        lint lint-fix format format-check typecheck \
        db-reset db-migrate db-test functions-serve \
        supabase-start supabase-stop clean

SUPABASE := supabase
PNPM     := pnpm

# デフォルト: help を表示
.DEFAULT_GOAL := help

help: ## このヘルプを表示
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	| awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-22s\033[0m %s\n", $$1, $$2}'

# ============================================================
# セットアップ
# ============================================================

setup: ## 初回セットアップ（依存インストール + Supabase 起動 + DB マイグレーション）
	@echo "📦 Installing dependencies..."
	$(PNPM) install
	@echo "🐘 Starting Supabase local..."
	$(SUPABASE) start
	@echo "🗄️  Running migrations..."
	$(SUPABASE) db push
	@echo "🌱 Seeding database..."
	$(SUPABASE) db seed
	@echo "✅ Setup complete! Run 'make dev' to start the dev server."

# ============================================================
# 開発
# ============================================================

dev: ## 開発サーバーを起動（Vite + Supabase local が必要）
	$(PNPM) dev

supabase-start: ## Supabase local を起動
	$(SUPABASE) start

supabase-stop: ## Supabase local を停止
	$(SUPABASE) stop

functions-serve: ## Edge Functions をローカルで起動
	$(SUPABASE) functions serve --env-file .env

# ============================================================
# ビルド
# ============================================================

build: ## プロダクションビルド
	$(PNPM) build

# ============================================================
# テスト
# ============================================================

test: test-unit ## デフォルトテスト（unit のみ）

test-unit: ## Unit テストを実行（Vitest）
	$(PNPM) test:unit

test-integration: ## Integration テストを実行（Supabase local が必要）
	@echo "🐘 Checking Supabase local..."
	@$(SUPABASE) status > /dev/null 2>&1 || (echo "❌ Supabase is not running. Run 'make supabase-start' first." && exit 1)
	$(PNPM) test:integration

test-db: ## pgTAP RLS テストを実行（Supabase local が必要）
	$(SUPABASE) test db

test-e2e: ## E2E テストを実行（Playwright / 開発サーバーが必要）
	$(PNPM) test:e2e

test-e2e-ui: ## Playwright UI モードで E2E テストを実行
	$(PNPM) test:e2e:ui

test-all: test-unit test-db test-integration ## 全テストを実行（Supabase local が必要）

# ============================================================
# コード品質
# ============================================================

lint: ## ESLint でコードをチェック
	$(PNPM) lint

lint-fix: ## ESLint で自動修正
	$(PNPM) lint:fix

format: ## Prettier でコードをフォーマット
	$(PNPM) format

format-check: ## Prettier フォーマットをチェック
	$(PNPM) format:check

typecheck: ## TypeScript 型チェック
	$(PNPM) typecheck

check: lint format-check typecheck ## lint + format-check + typecheck を一括実行

# ============================================================
# データベース
# ============================================================

db-reset: ## DB をリセットしてマイグレーション + seed を適用
	$(SUPABASE) db reset

db-migrate: ## マイグレーションのみ実行
	$(SUPABASE) db push

db-seed: ## seed のみ実行
	$(SUPABASE) db seed

# ============================================================
# クリーンアップ
# ============================================================

clean: ## ビルド成果物を削除
	rm -rf dist node_modules/.cache playwright-report test-results
