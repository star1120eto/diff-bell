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
    <div className="min-h-screen bg-white text-gray-900">
      {/* ナビゲーション */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="text-xl font-extrabold tracking-tight text-brand-600">DiffBell</span>
          <div className="flex items-center gap-2">
            <a href="#pricing" className="hidden px-3 py-2 text-sm text-gray-600 hover:text-gray-900 sm:block">
              料金
            </a>
            <Link
              to="/login"
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              ログイン
            </Link>
            <Link
              to="/signup"
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
            >
              無料で始める
            </Link>
          </div>
        </div>
      </nav>

      {/* ヒーロー */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white px-4 pb-24 pt-20 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-100/40 to-transparent" />
        <div className="relative mx-auto max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-1.5 text-xs font-medium text-brand-600 shadow-sm">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-500" />
            個人向け · クレジットカード不要 · 3分でセットアップ
          </div>
          <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            ページの変化を、
            <br />
            <span className="text-brand-600">もう見逃さない。</span>
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-gray-500">
            競合調査、セール情報、採用ページ——手動でチェックし続けるのはもうやめましょう。
            DiffBellが24時間代わりに監視して、変化があったらすぐにお知らせします。
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/signup"
              className="w-full rounded-xl bg-brand-600 px-8 py-3.5 text-base font-bold text-white shadow-md hover:bg-brand-700 sm:w-auto"
            >
              今すぐ無料で始める →
            </Link>
            <a
              href="#pricing"
              className="w-full rounded-xl border border-gray-300 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 hover:bg-gray-50 sm:w-auto"
            >
              料金を見る
            </a>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            無料プランは3サイトまで。Proプランは¥490/月〜
          </p>
        </div>
      </section>

      {/* こんな方におすすめ */}
      <section className="bg-white px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-brand-600">
            Use Cases
          </p>
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            こんな方におすすめです
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <UseCaseCard
              icon="📊"
              title="競合・業界ウォッチ"
              description="競合他社の価格改定、機能追加、新製品ページの更新をリアルタイムで把握。副業・フリーランスの情報収集に。"
            />
            <UseCaseCard
              icon="🛍️"
              title="セール・在庫チェック"
              description="欲しかった商品の在庫復活、フラッシュセール、価格変動を誰より早くキャッチ。買い逃しをゼロに。"
            />
            <UseCaseCard
              icon="💼"
              title="採用情報の確認"
              description="狙っている企業の求人ページが更新されたらすぐ通知。応募チャンスを逃しません。"
            />
            <UseCaseCard
              icon="📰"
              title="情報収集の自動化"
              description="行政・自治体のお知らせ、推しのクリエイターの新着情報を自動巡回。毎日のルーティンを削減。"
            />
          </div>
        </div>
      </section>

      {/* Before / After */}
      <section className="bg-gray-50 px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            DiffBellで、日常が変わる
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-red-100 bg-white p-6">
              <p className="mb-4 text-sm font-bold text-red-500">DiffBell導入前</p>
              <ul className="space-y-3 text-sm text-gray-600">
                {[
                  "😰 気がついたら競合が機能追加していた",
                  "😔 狙ってたセールに気づかなかった",
                  "🤯 採用ページ更新を見逃して機会を逃した",
                  "😩 毎日同じページを手でチェックするのが苦痛",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">{t}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-green-100 bg-white p-6">
              <p className="mb-4 text-sm font-bold text-green-600">DiffBell導入後</p>
              <ul className="space-y-3 text-sm text-gray-600">
                {[
                  "✅ 競合の動きを即座に把握できる",
                  "✅ セール開始をメールで受け取れる",
                  "✅ 採用更新を誰より早くキャッチ",
                  "✅ 手動チェックから完全解放される",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 使い方 */}
      <section className="bg-white px-4 py-20">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-brand-600">
            How it works
          </p>
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            3ステップで始められます
          </h2>
          <div className="space-y-10">
            <Step
              number="1"
              title="URLを登録する"
              description="監視したいWebページのURLと名前を入力。チェック間隔（1〜24時間）を選ぶだけ。"
            />
            <Step
              number="2"
              title="DiffBellが自動で監視"
              description="設定した間隔でページを自動チェック。robots.txtのルールを遵守した安心設計。"
            />
            <Step
              number="3"
              title="変化をすぐ通知"
              description="変更を検出したらメール/Slackへ通知。差分ビューワーで何がどう変わったか一目で確認。"
            />
          </div>
        </div>
      </section>

      {/* 機能 */}
      <section className="bg-gray-50 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            シンプルで、頼れる機能
          </h2>
          <div className="grid gap-5 sm:grid-cols-3">
            <FeatureCard
              icon="🔍"
              title="差分ビューワー"
              description="変更前後を行単位で比較。「何がどう変わったか」を一目で把握できます。"
            />
            <FeatureCard
              icon="🔔"
              title="即時通知"
              description="変化を検出したら即座にメールまたはSlackへ通知。大事な更新を見逃しません。"
            />
            <FeatureCard
              icon="⚡"
              title="最短1時間チェック"
              description="Proプランなら最短1時間ごとに監視。鮮度の高い情報をリアルタイムで受け取れます。"
            />
            <FeatureCard
              icon="🔒"
              title="セキュアな設計"
              description="各ユーザーのデータは完全分離。監視内容が他のユーザーに見られることはありません。"
            />
            <FeatureCard
              icon="🤖"
              title="robots.txt遵守"
              description="robots.txtで禁止されているページは監視しません。相手サイトのルールを尊重した倫理的な設計。"
            />
            <FeatureCard
              icon="📱"
              title="Slack連携"
              description="Incoming Webhookを設定するだけで、Slackチャンネルへ直接通知が届きます。"
            />
          </div>
        </div>
      </section>

      {/* 料金 */}
      <section id="pricing" className="bg-white px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-brand-600">
            Pricing
          </p>
          <h2 className="mb-3 text-center text-3xl font-bold text-gray-900">
            シンプルな料金体系
          </h2>
          <p className="mb-12 text-center text-sm text-gray-500">
            クレジットカード不要で無料プランからお試しいただけます
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Free */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8">
              <p className="mb-1 text-lg font-bold text-gray-900">Free</p>
              <div className="mb-6 flex items-end gap-1">
                <span className="text-4xl font-extrabold text-gray-900">¥0</span>
                <span className="mb-1 text-sm text-gray-400">/ 月</span>
              </div>
              <ul className="mb-8 space-y-3 text-sm text-gray-600">
                <PricingItem text="3サイトまで監視" />
                <PricingItem text="6時間ごとにチェック" />
                <PricingItem text="メール通知" />
                <PricingItem text="変更履歴5件/サイト" />
                <PricingItem text="差分ビューワー" />
              </ul>
              <Link
                to="/signup"
                className="block w-full rounded-xl border border-gray-300 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                無料で始める
              </Link>
            </div>

            {/* Pro */}
            <div className="relative rounded-2xl border-2 border-brand-600 bg-white p-8 shadow-lg">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-4 py-1 text-xs font-bold text-white">
                おすすめ
              </span>
              <p className="mb-1 text-lg font-bold text-gray-900">Pro</p>
              <div className="mb-6 flex items-end gap-1">
                <span className="text-4xl font-extrabold text-gray-900">¥490</span>
                <span className="mb-1 text-sm text-gray-400">/ 月</span>
              </div>
              <ul className="mb-8 space-y-3 text-sm text-gray-600">
                <PricingItem text="20サイトまで監視" highlight />
                <PricingItem text="最短1時間ごとにチェック" highlight />
                <PricingItem text="メール + Slack通知" highlight />
                <PricingItem text="変更履歴90日分" highlight />
                <PricingItem text="差分ビューワー" />
                <PricingItem text="優先サポート" highlight />
              </ul>
              <Link
                to="/signup"
                className="block w-full rounded-xl bg-brand-600 py-3 text-center text-sm font-bold text-white shadow-sm hover:bg-brand-700"
              >
                Proで始める →
              </Link>
              <p className="mt-3 text-center text-xs text-gray-400">
                いつでもキャンセル可能
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 px-4 py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-10 text-center text-3xl font-bold text-gray-900">よくある質問</h2>
          <div className="space-y-5">
            <FaqItem
              q="どんなWebサイトでも監視できますか？"
              a="HTTP/HTTPSの公開ページであれば基本的に監視できます。ただし、ログインが必要なページ・JavaScriptのみで描画されるコンテンツ・robots.txtで禁止されているページは対象外です。"
            />
            <FaqItem
              q="どのくらいの頻度でチェックしますか？"
              a="Freeプランは6時間ごと、Proプランは最短1時間ごとです。変更が検出された場合は即座に通知が届きます。"
            />
            <FaqItem
              q="Slackへの通知はどのように設定しますか？"
              a="設定画面でSlack Incoming WebhookのURLを入力するだけで完了です。Slack側でアプリを作成し、WebhookのURLをコピーしてください。"
            />
            <FaqItem
              q="いつでもキャンセルできますか？"
              a="はい、いつでもキャンセルできます。月単位の課金のため、キャンセル後も当月末まではProの機能をご利用いただけます。"
            />
            <FaqItem
              q="支払い方法は何が使えますか？"
              a="クレジットカード（Visa・Mastercard・JCB・American Express等）をご利用いただけます。決済はStripe（PCI DSS準拠）が処理するため、カード情報はDiffBellに保存されません。"
            />
            <FaqItem
              q="監視データのセキュリティは？"
              a="各ユーザーのデータはRow Level Security（RLS）により完全に分離されています。他のユーザーがあなたの監視内容を閲覧することはできません。通信はTLSで暗号化されています。"
            />
          </div>
        </div>
      </section>

      {/* 最終CTA */}
      <section className="bg-brand-600 px-4 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-3xl font-extrabold text-white">
            まずは無料から、試してみてください。
          </h2>
          <p className="mb-8 text-brand-100">
            3分でセットアップ完了。クレジットカード不要。
          </p>
          <Link
            to="/signup"
            className="inline-block rounded-xl bg-white px-10 py-4 text-base font-bold text-brand-600 shadow-md hover:bg-brand-50"
          >
            今すぐ無料で始める →
          </Link>
        </div>
      </section>

      {/* フッター */}
      <footer className="border-t border-gray-100 px-4 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-xs text-gray-400 sm:flex-row">
          <span className="font-bold text-brand-600">DiffBell</span>
          <div className="flex gap-6">
            <Link to="/login" className="hover:text-gray-700">ログイン</Link>
            <Link to="/signup" className="hover:text-gray-700">新規登録</Link>
            <a href="#pricing" className="hover:text-gray-700">料金</a>
          </div>
          <p>© {new Date().getFullYear()} DiffBell. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function UseCaseCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 transition hover:border-brand-200 hover:bg-brand-50">
      <div className="mb-3 text-3xl">{icon}</div>
      <h3 className="mb-2 font-bold text-gray-900">{title}</h3>
      <p className="text-sm leading-relaxed text-gray-500">{description}</p>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="mb-3 text-2xl">{icon}</div>
      <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
      <p className="text-sm leading-relaxed text-gray-500">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-5">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-base font-extrabold text-white shadow">
        {number}
      </div>
      <div className="pt-1">
        <h3 className="mb-1 text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-sm leading-relaxed text-gray-500">{description}</p>
      </div>
    </div>
  );
}

function PricingItem({ text, highlight }: { text: string; highlight?: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <span className={highlight ? "text-brand-600" : "text-gray-400"}>✓</span>
      <span className={highlight ? "font-medium text-gray-900" : ""}>{text}</span>
    </li>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-xl border border-gray-200 bg-white p-5">
      <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-gray-900">
        {q}
        <span className="ml-4 flex-shrink-0 text-gray-400 transition group-open:rotate-180">▼</span>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-gray-500">{a}</p>
    </details>
  );
}
