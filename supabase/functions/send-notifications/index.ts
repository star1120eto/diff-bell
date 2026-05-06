import { createServiceClient, errorResponse, jsonResponse } from "../_shared/supabase.ts";
import { sendChangeNotificationEmail } from "../_shared/email.ts";

interface RequestBody {
  changeEventId?: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return errorResponse("Method Not Allowed", 405);

  let body: RequestBody = {};
  try {
    body = await req.json();
  } catch {
    // body は任意
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "noreply@diffbell.app";

  if (!resendApiKey) {
    return errorResponse("RESEND_API_KEY not configured", 500);
  }

  const db = createServiceClient();

  // 送信待ち通知を取得（changeEventId 指定があればフィルタ）
  let query = db
    .from("notifications")
    .select(
      `id, title, body, user_id, change_event_id,
       profiles!inner(email),
       user_settings!inner(email_notifications_enabled)`,
    )
    .eq("is_read", false);

  if (body.changeEventId) {
    query = query.eq("change_event_id", body.changeEventId);
  } else {
    // バッチ送信: 最大 50 件
    query = query.limit(50);
  }

  const { data: notifications, error: fetchErr } = await query;

  if (fetchErr) {
    console.error("Failed to fetch notifications:", fetchErr);
    return errorResponse("Failed to fetch notifications");
  }

  if (!notifications || notifications.length === 0) {
    return jsonResponse({ sent: 0 });
  }

  let sent = 0;
  let failed = 0;

  for (const notif of notifications) {
    const profile = notif.profiles as unknown as { email: string } | null;
    const settings = notif.user_settings as unknown as {
      email_notifications_enabled: boolean;
    } | null;

    if (!profile?.email || !settings?.email_notifications_enabled) continue;

    // notification_delivery レコードを作成
    const { data: delivery, error: deliveryErr } = await db
      .from("notification_deliveries")
      .insert({
        notification_id: notif.id,
        channel: "email",
        status: "pending",
      })
      .select("id")
      .single();

    if (deliveryErr || !delivery) {
      console.error("delivery insert error:", deliveryErr);
      failed++;
      continue;
    }

    // メール送信
    const emailResult = await sendChangeNotificationEmail({
      to: profile.email,
      monitorName: notif.title.replace("変更検出: ", ""),
      monitorUrl: notif.body.replace(" に変更が検出されました", ""),
      detectedAt: new Date().toISOString(),
      resendApiKey,
      fromEmail,
    });

    // delivery ステータス更新
    await db
      .from("notification_deliveries")
      .update({
        status: emailResult.ok ? "sent" : "failed",
        provider_id: emailResult.providerId ?? null,
        error_message: emailResult.error ?? null,
        sent_at: emailResult.ok ? new Date().toISOString() : null,
      })
      .eq("id", delivery.id);

    if (emailResult.ok) {
      sent++;
    } else {
      console.error("Email send failed:", emailResult.error);
      failed++;
    }
  }

  return jsonResponse({ sent, failed });
});
