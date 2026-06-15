import { supabase } from "./supabase";

export interface UserPlan {
  plan: "free" | "pro";
  status: "active" | "canceled" | "past_due" | "trialing";
  maxMonitors: number;
  minIntervalHours: number;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
}

export type BillingResult<T> = { ok: true; data: T } | { ok: false; error: string };

type SubscriptionRow = {
  plan: string;
  status: string;
  current_period_end: string | null;
  stripe_customer_id: string | null;
};

export async function getUserPlan(): Promise<BillingResult<UserPlan>> {
  const [subResult, settingsResult] = await Promise.all([
    supabase
      .from("subscriptions" as never)
      .select("plan, status, current_period_end, stripe_customer_id")
      .single(),
    supabase.from("user_settings").select("max_monitors, min_interval_hours").single(),
  ]);

  if (subResult.error)
    return { ok: false, error: (subResult.error as { message: string }).message };
  if (settingsResult.error) return { ok: false, error: settingsResult.error.message };

  const sub = subResult.data as SubscriptionRow;
  const settings = settingsResult.data;

  return {
    ok: true,
    data: {
      plan: sub.plan as UserPlan["plan"],
      status: sub.status as UserPlan["status"],
      maxMonitors: settings.max_monitors,
      minIntervalHours: settings.min_interval_hours,
      currentPeriodEnd: sub.current_period_end,
      stripeCustomerId: sub.stripe_customer_id,
    },
  };
}

export async function createCheckoutSession(): Promise<BillingResult<{ url: string }>> {
  const { data, error } = await supabase.functions.invoke("create-checkout-session", {
    method: "POST",
  });
  if (error) return { ok: false, error: error.message };
  if (!data?.url) return { ok: false, error: "チェックアウトURLを取得できませんでした" };
  return { ok: true, data: { url: data.url } };
}

export async function createPortalSession(): Promise<BillingResult<{ url: string }>> {
  const { data, error } = await supabase.functions.invoke("create-portal-session", {
    method: "POST",
  });
  if (error) return { ok: false, error: error.message };
  if (!data?.url) return { ok: false, error: "ポータルURLを取得できませんでした" };
  return { ok: true, data: { url: data.url } };
}
