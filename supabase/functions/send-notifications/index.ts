import { createServiceClient, errorResponse, jsonResponse } from "../_shared/supabase.ts";
import { sendChangeNotificationEmail } from "../_shared/email.ts";
import { sendSlackNotification } from "../_shared/slack.ts";

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

  const db = createServiceClient();

  // 送信待ち通知を取得（changeEventId 指定があればフィルタ）
  let query = db
    .from("notifications")
    .select(
      `id, title, body, user_id, change_event_id,
       profiles!inner(email),
       user_settings!inner(email_notifications_enabled, slack_webhook_url)`,
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
      slack_webhook_url: string | null;
    } | null;

    const monitorName = notif.title.replace("変更検出: ", "");
    const monitorUrl = notif.body.replace(" に変更が検出されました", "");
    const detectedAt = new Date().toISOString();

    // メール通知
    if (profile?.email && settings?.email_notifications_enabled && resendApiKey) {
      const { data: delivery, error: deliveryErr } = await db
        .from("notification_deliveries")
        .insert({ notification_id: notif.id, channel: "email", status: "pending" })
        .select("id")
        .single();

      if (deliveryErr || !delivery) {
        console.error("email delivery insert error:", deliveryErr);
        failed++;
      } else {
        const result = await sendChangeNotificationEmail({
          to: profile.email,
          monitorName,
          monitorUrl,
          detectedAt,
          resendApiKey,
          fromEmail,
        });

        await db
          .from("notification_deliveries")
          .update({
            status: result.ok ? "sent" : "failed",
            provider_id: result.providerId ?? null,
            error_message: result.error ?? null,
            sent_at: result.ok ? new Date().toISOString() : null,
          })
          .eq("id", delivery.id);

        if (result.ok) {
          sent++;
        } else {
          console.error("Email failed:", result.error);
          failed++;
        }
      }
    }

    // Slack 通知（サーバーサイドで URL を再検証）
    const slackUrl = settings?.slack_webhook_url ?? "";
    if (slackUrl && isValidSlackWebhookUrl(slackUrl)) {
      const { data: delivery, error: deliveryErr } = await db
        .from("notification_deliveries")
        .insert({ notification_id: notif.id, channel: "slack", status: "pending" })
        .select("id")
        .single();

      if (deliveryErr || !delivery) {
        console.error("slack delivery insert error:", deliveryErr);
        failed++;
      } else {
        const result = await sendSlackNotification(slackUrl, monitorName, monitorUrl, detectedAt);

        await db
          .from("notification_deliveries")
          .update({
            status: result.ok ? "sent" : "failed",
            error_message: result.error ?? null,
            sent_at: result.ok ? new Date().toISOString() : null,
          })
          .eq("id", delivery.id);

        if (result.ok) {
          sent++;
        } else {
          console.error("Slack failed:", result.error);
          failed++;
        }
      }
    }
  }

  return jsonResponse({ sent, failed });
});

function isValidSlackWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === "hooks.slack.com";
  } catch {
    return false;
  }
}
