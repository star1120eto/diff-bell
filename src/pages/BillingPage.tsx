import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  getUserPlan,
  createCheckoutSession,
  createPortalSession,
  type UserPlan,
} from "@/lib/billing";

export function BillingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const success = searchParams.get("success") === "1";
  const canceled = searchParams.get("canceled") === "1";

  useEffect(() => {
    getUserPlan().then((result) => {
      if (result.ok) setPlan(result.data);
      else setError(result.error);
      setLoading(false);
    });
  }, []);

  const handleUpgrade = async () => {
    setActionLoading(true);
    setError(null);
    const result = await createCheckoutSession();
    if (result.ok) {
      window.location.href = result.data.url;
    } else {
      setError(result.error);
      setActionLoading(false);
    }
  };

  const handleManage = async () => {
    setActionLoading(true);
    setError(null);
    const result = await createPortalSession();
    if (result.ok) {
      window.location.href = result.data.url;
    } else {
      setError(result.error);
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-4">
          <button
            onClick={() => navigate("/settings")}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← 設定に戻る
          </button>
          <h1 className="text-lg font-bold text-gray-900">プラン・お支払い</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {success && (
          <Alert variant="success" className="mb-6">
            🎉 Pro
            プランへのアップグレードが完了しました！最短1時間ごとの監視と最大20サイトが利用可能です。
          </Alert>
        )}
        {canceled && (
          <Alert variant="error" className="mb-6">
            お支払いをキャンセルしました。引き続き無料プランをご利用いただけます。
          </Alert>
        )}
        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
          </div>
        ) : plan ? (
          <div className="space-y-6">
            {/* 現在のプラン */}
            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-800">現在のプラン</h2>
                  <div className="mt-2 flex items-center gap-2">
                    <PlanBadge plan={plan.plan} />
                    {plan.status === "past_due" && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        支払い遅延
                      </span>
                    )}
                    {plan.status === "canceled" && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        解約済み
                      </span>
                    )}
                  </div>
                  {plan.plan === "pro" && plan.currentPeriodEnd && (
                    <p className="mt-1 text-xs text-gray-500">
                      次回更新日:{" "}
                      {new Date(plan.currentPeriodEnd).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
                {plan.plan === "pro" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    loading={actionLoading}
                    onClick={handleManage}
                  >
                    プランを管理
                  </Button>
                ) : (
                  <Button size="sm" loading={actionLoading} onClick={handleUpgrade}>
                    Proにアップグレード
                  </Button>
                )}
              </div>
            </section>

            {/* 利用制限 */}
            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-gray-800">利用制限</h2>
              <div className="space-y-3">
                <LimitRow label="監視サイト数" value={`最大 ${plan.maxMonitors} 件`} />
                <LimitRow label="最短チェック間隔" value={`${plan.minIntervalHours} 時間`} />
                <LimitRow
                  label="通知チャンネル"
                  value={plan.plan === "pro" ? "メール + Slack" : "メールのみ"}
                />
              </div>
            </section>

            {/* プラン比較（Free の場合のみ） */}
            {plan.plan === "free" && (
              <section className="overflow-hidden rounded-lg border border-brand-200 bg-brand-50 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-lg font-bold text-brand-700">Pro プラン</span>
                  <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-bold text-white">
                    ¥490/月
                  </span>
                </div>
                <ul className="mb-5 space-y-2 text-sm text-gray-700">
                  {[
                    "監視サイト数: 最大20件",
                    "最短1時間ごとにチェック",
                    "メール + Slack 通知",
                    "変更履歴90日分",
                    "優先サポート",
                    "いつでもキャンセル可",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="text-brand-600">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Button loading={actionLoading} onClick={handleUpgrade}>
                  今すぐ Pro にアップグレード →
                </Button>
                <p className="mt-2 text-xs text-gray-500">
                  クレジットカード決済。いつでも解約できます。
                </p>
              </section>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}

function PlanBadge({ plan }: { plan: "free" | "pro" }) {
  if (plan === "pro") {
    return (
      <span className="rounded-full bg-brand-600 px-3 py-1 text-sm font-bold text-white">Pro</span>
    );
  }
  return (
    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
      Free
    </span>
  );
}

function LimitRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  );
}
