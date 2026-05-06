import { createServiceClient, errorResponse, jsonResponse } from "../_shared/supabase.ts";

const BATCH_SIZE = 50;

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return errorResponse("Method Not Allowed", 405);

  // CRON_SECRET による認証（cron から呼ぶ場合）
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return errorResponse("Unauthorized", 401);
    }
  }

  const db = createServiceClient();

  // 実行待ちのアクティブ監視を取得
  const { data: monitors, error } = await db
    .from("monitors")
    .select("id")
    .eq("is_active", true)
    .lte("next_check_at", new Date().toISOString())
    .limit(BATCH_SIZE);

  if (error) {
    console.error("Failed to fetch due monitors:", error);
    return errorResponse("Failed to fetch monitors");
  }

  if (!monitors || monitors.length === 0) {
    return jsonResponse({ triggered: 0 });
  }

  const functionUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!functionUrl || !serviceKey) {
    return errorResponse("Function URL or service key not configured");
  }

  // 各監視を並列で check-single-monitor にディスパッチ
  const results = await Promise.allSettled(
    monitors.map((m) =>
      fetch(`${functionUrl}/functions/v1/check-single-monitor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ monitorId: m.id }),
      }),
    ),
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return jsonResponse({
    triggered: monitors.length,
    succeeded,
    failed,
  });
});
