import { createServiceClient, errorResponse, jsonResponse } from "../_shared/supabase.ts";
import { checkUrl } from "../_shared/url-checker.ts";
import { fetchRobotsTxtStatus } from "../_shared/robots.ts";

interface RequestBody {
  monitorId: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return errorResponse("Method Not Allowed", 405);

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const { monitorId } = body;
  if (!monitorId) return errorResponse("monitorId is required", 400);

  const db = createServiceClient();

  // 監視対象を取得
  const { data: monitor, error: monitorErr } = await db
    .from("monitors")
    .select("*")
    .eq("id", monitorId)
    .single();

  if (monitorErr || !monitor) {
    return errorResponse(`Monitor not found: ${monitorId}`, 404);
  }

  if (!monitor.is_active) {
    return jsonResponse({ skipped: true, reason: "inactive" });
  }

  // robots.txt チェック（失敗してもブロックしない）
  const siteUrl = new URL(monitor.normalized_url);
  const robotsStatus = await fetchRobotsTxtStatus(siteUrl, siteUrl.pathname || "/");

  if (robotsStatus === "disallowed") {
    await db
      .from("monitors")
      .update({
        last_checked_at: new Date().toISOString(),
        next_check_at: nextCheckAt(monitor.interval_hours),
        last_status: "error",
        last_error: "robots.txt によりアクセスが禁止されています",
        robots_txt_status: "disallowed",
      })
      .eq("id", monitorId);

    return jsonResponse({ skipped: true, reason: "robots_disallowed" });
  }

  // URL チェック（fetch + ハッシュ計算）
  const result = await checkUrl(monitor.normalized_url);

  if (!result.ok) {
    // エラー時の処理
    const newRetryCount = monitor.retry_count + 1;
    const [{ error: runErr }, { error: updateErr }] = await Promise.all([
      db.from("check_runs").insert({
        monitor_id: monitorId,
        user_id: monitor.user_id,
        status: "error",
        http_status: result.httpStatus ?? null,
        error_code: result.errorCode ?? null,
        error_message: result.error ?? null,
        duration_ms: result.durationMs ?? null,
        retry_count: newRetryCount,
      }),
      db
        .from("monitors")
        .update({
          last_checked_at: new Date().toISOString(),
          next_check_at: nextCheckAt(monitor.interval_hours),
          last_status: "error",
          last_error: result.error ?? "Unknown error",
          robots_txt_status: robotsStatus,
          retry_count: newRetryCount,
        })
        .eq("id", monitorId),
    ]);

    if (runErr) console.error("check_run insert error:", runErr);
    if (updateErr) console.error("monitor update error:", updateErr);

    return jsonResponse({ ok: false, error: result.error, errorCode: result.errorCode });
  }

  // 最新スナップショットを取得（ハッシュ比較用）
  const { data: latestSnapshot } = await db
    .from("monitor_snapshots")
    .select("id, structure_hash, text_hash")
    .eq("monitor_id", monitorId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // スナップショット保存
  const { data: newSnapshot, error: snapErr } = await db
    .from("monitor_snapshots")
    .insert({
      monitor_id: monitorId,
      user_id: monitor.user_id,
      structure_hash: result.structureHash!,
      text_hash: result.textHash!,
      content: result.content!,
      content_length: result.contentLength!,
      http_status: result.httpStatus!,
      etag: result.etag ?? null,
      last_modified: result.lastModified ?? null,
    })
    .select("id")
    .single();

  if (snapErr || !newSnapshot) {
    console.error("snapshot insert error:", snapErr);
    return errorResponse("Failed to save snapshot");
  }

  // 変更判定
  const isFirstCheck = !latestSnapshot;
  const structureChanged = !isFirstCheck && latestSnapshot.structure_hash !== result.structureHash!;
  const textChanged = !isFirstCheck && latestSnapshot.text_hash !== result.textHash!;
  const hasChanged = structureChanged || textChanged;

  const checkStatus = isFirstCheck ? "ok" : hasChanged ? "changed" : "ok";

  // check_run 保存
  let changeEventId: string | null = null;

  if (hasChanged) {
    // change_event 保存
    const { data: changeEvent, error: changeErr } = await db
      .from("change_events")
      .insert({
        monitor_id: monitorId,
        user_id: monitor.user_id,
        before_snapshot_id: latestSnapshot?.id ?? null,
        after_snapshot_id: newSnapshot.id,
        structure_changed: structureChanged,
        text_changed: textChanged,
      })
      .select("id")
      .single();

    if (changeErr || !changeEvent) {
      console.error("change_event insert error:", changeErr);
    } else {
      changeEventId = changeEvent.id;

      // 通知作成
      const { error: notifErr } = await db.from("notifications").insert({
        user_id: monitor.user_id,
        change_event_id: changeEvent.id,
        title: `変更検出: ${monitor.name}`,
        body: `${monitor.url} に変更が検出されました`,
      });
      if (notifErr) console.error("notification insert error:", notifErr);
    }
  }

  // check_run 保存
  const { error: runErr } = await db.from("check_runs").insert({
    monitor_id: monitorId,
    user_id: monitor.user_id,
    status: checkStatus,
    http_status: result.httpStatus!,
    duration_ms: result.durationMs!,
    snapshot_id: newSnapshot.id,
    change_event_id: changeEventId,
    retry_count: 0,
  });
  if (runErr) console.error("check_run insert error:", runErr);

  // monitor 更新
  const { error: updateErr } = await db
    .from("monitors")
    .update({
      last_checked_at: new Date().toISOString(),
      next_check_at: nextCheckAt(monitor.interval_hours),
      last_status: checkStatus,
      last_error: null,
      robots_txt_status: robotsStatus,
      retry_count: 0,
    })
    .eq("id", monitorId);

  if (updateErr) console.error("monitor update error:", updateErr);

  // メール通知トリガー（設定済みの場合）
  if (hasChanged && changeEventId) {
    triggerEmailNotifications(changeEventId).catch((e) => console.error("email trigger error:", e));
  }

  return jsonResponse({
    ok: true,
    status: checkStatus,
    hasChanged,
    structureChanged,
    textChanged,
    isFirstCheck,
  });
});

function nextCheckAt(intervalHours: number): string {
  return new Date(Date.now() + intervalHours * 60 * 60 * 1000).toISOString();
}

async function triggerEmailNotifications(changeEventId: string): Promise<void> {
  const functionUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!functionUrl || !serviceKey) return;

  const res = await fetch(`${functionUrl}/functions/v1/send-notifications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ changeEventId }),
  });
  if (!res.ok) {
    const msg = await res.text();
    console.error("send-notifications failed:", msg);
  }
}
