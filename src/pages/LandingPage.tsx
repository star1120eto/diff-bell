import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function LandingPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) {
      navigate("/dashboard", { replace: true });
    }
  }, [session, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ナビゲーション */}
      <nav className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <span className="text-xl font-bold text-brand-600">DiffBell</span>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              ログイン
            </Link>
            <Link
              to="/signup"
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              無料で始める
            </Link>
          </div>
        </div>
      </nav>

      {/* ヒーロー */}
      <section className="mx-auto max-w-5xl px-4 py-20 text-center">
        <div className="mb-4 inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600">
          無料で利用可能 · 最大20サイト監視
        </div>
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Webサイトの変化を
          <br />
          <span className="text-brand-600">見逃さない</span>
        </h1>
        <p className="mx-auto mb-10 max-w-xl text-lg text-gray-500">
          URLを登録するだけ。ページの変更を自動検出して、メールまたはSlackへ即座に通知します。
          競合サイトの更新、価格変動、重要なお知らせの変化を確実にキャッチ。
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/signup"
            className="w-full rounded-md bg-brand-600 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-700 sm:w-auto"
          >
            無料で始める →
          </Link>
          <Link
            to="/login"
            className="w-full rounded-md border border-gray-300 bg-white px-8 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 sm:w-auto"
          >
            ログイン
          </Link>
        </div>
      </section>

      {/* 機能紹介 */}
      <section className="border-t border-gray-100 bg-gray-50 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-2xl font-bold text-gray-900">
            シンプルで強力な機能
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <FeatureCard
              icon="🔔"
              title="変更を即座に通知"
              description="ページの構造変化・テキスト変化を検出し、メールまたはSlackへリアルタイムで通知します。"
            />
            <FeatureCard
              icon="🔍"
              title="差分をビジュアル表示"
              description="変更前後のコンテンツを行単位で比較。何がどう変わったかを一目で確認できます。"
            />
            <FeatureCard
              icon="⚙️"
              title="柔軟な監視設定"
              description="1時間〜24時間の間隔で監視頻度を設定。最大20サイトを同時に監視できます。"
            />
          </div>
        </div>
      </section>

      {/* 使い方 */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-12 text-center text-2xl font-bold text-gray-900">3ステップで開始</h2>
          <div className="space-y-8">
            <Step
              number="1"
              title="アカウント作成"
              description="メールアドレスとパスワードだけで無料登録。クレジットカード不要。"
            />
            <Step
              number="2"
              title="監視URLを登録"
              description="変更を検知したいWebページのURLと監視名を入力して追加するだけ。"
            />
            <Step
              number="3"
              title="通知を受け取る"
              description="変更が検出されるとメールまたはSlackに通知が届きます。DiffBellで差分を確認。"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-100 bg-brand-600 px-4 py-16 text-center">
        <h2 className="mb-4 text-2xl font-bold text-white">今すぐ無料で始めよう</h2>
        <p className="mb-8 text-brand-50">セットアップ5分。重要な変化を見逃さない。</p>
        <Link
          to="/signup"
          className="inline-block rounded-md bg-white px-8 py-3 text-sm font-semibold text-brand-600 hover:bg-brand-50"
        >
          無料アカウントを作成
        </Link>
      </section>

      {/* フッター */}
      <footer className="border-t border-gray-100 px-4 py-8 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} DiffBell. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-3 text-3xl">{icon}</div>
      <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
        {number}
      </div>
      <div>
        <h3 className="mb-1 font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}
