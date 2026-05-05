---
name: DiffBell プロジェクト状況
description: DiffBell (Webサイト更新チェッカー) の開発フェーズと技術スタック
type: project
---

Webサイト変化検出・通知サービス「DiffBell」を TDD で構築中。

**Why:** 個人利用者が無料枠で運用できる軽量な監視ツール。競合SaaSより安く、安全設計（SSRF防止・RLS・robots.txt配慮）。

**How to apply:** 開発フェーズと完了済み PR を把握して次のステップを提案する。

## 完了済み

### PR #1: Infrastructure (2026-05-05)

- supabase/migrations/20260505000000_initial_schema.sql（全8テーブル + RLS + トリガー）
- supabase/tests/rls_test.sql（pgTAP 28テスト）
- Docker / Dev Container / Makefile / supabase/config.toml
- GitHub Actions: pr.yml / deploy.yml
- TypeScript strict mode / Vitest / Playwright / ESLint / Prettier
- src/types/database.ts（手書き型、supabase gen types に置き換え予定）

## 次のフェーズ

- PR #2: Supabase Auth 連携（サインアップ/ログイン/ログアウト/パスワードリセット）
- PR #3: 監視URL管理 CRUD（SSRF防止・バリデーション付き）
- PR #4-5: 差分検出 Edge Function + cron
- PR #6: 通知（アプリ内 + Resend メール）
- PR #7-8: UI完成 + E2E + Cloudflare Pages デプロイ

## 技術スタック

- Frontend: React 18 / Vite / TypeScript (strict) / Tailwind CSS
- Backend: Supabase Auth + Postgres + Edge Functions (Deno) + Cron
- Email: Resend
- Hosting: Cloudflare Pages
- CI/CD: GitHub Actions

## 運用上限

- 監視URL: 20件/ユーザー、最小間隔: 1時間、HTML最大: 2MB、redirect: 5回
