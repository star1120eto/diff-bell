import {
  createUserClient,
  createServiceClient,
  errorResponse,
  jsonResponse,
} from "../_shared/supabase.ts";
import { sendSlackNotification } from "../_shared/slack.ts";
import { sendChangeNotificationEmail } from "../_shared/email.ts";

interface RequestBody {
  webhookUrl?: string;
}

interface TestResult {
  slack: "sent" | "failed" | "skipped";
  email: "sent" | "failed" | "skipped";
  slackError?: string;
  emailError?: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return errorResponse("Method Not Allowed", 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return errorResponse("Unauthorized", 401);

  const userClient = createUserClient(authHeader);
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) return errorResponse("Unauthorized", 401);

  let body: RequestBody = {};
  try {
    body = await req.json();
  } catch {
    // body は任意
  }

  const db = createServiceClient();

  const [{ data: profile }, { data: settings }] = await Promise.all([
    db.from("profiles").select("email").eq("id", user.id).single(),
    db.from("user_settings").select("email_notifications_enabled").eq("user_id", user.id).single(),
  ]);

  const result: TestResult = { slack: "skipped", email: "skipped" };
  const now = new Date().toISOString();

  // Slack テスト
  const webhookUrl = body.webhookUrl ?? "";
  if (webhookUrl.startsWith("https://hooks.slack.com/")) {
    const slackResult = await sendSlackNotification(
      webhookUrl,
      "テスト監視",
      "https://example.com",
      now,
    );
    result.slack = slackResult.ok ? "sent" : "failed";
    if (!slackResult.ok) result.slackError = slackResult.error;
  }

  // メールテスト
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "noreply@diffbell.app";
  const email = (profile as { email?: string } | null)?.email;
  const emailEnabled = (settings as { email_notifications_enabled?: boolean } | null)
    ?.email_notifications_enabled;

  if (email && emailEnabled && resendApiKey) {
    const emailResult = await sendChangeNotificationEmail({
      to: email,
      monitorName: "テスト監視",
      monitorUrl: "https://example.com",
      detectedAt: now,
      resendApiKey,
      fromEmail,
    });
    result.email = emailResult.ok ? "sent" : "failed";
    if (!emailResult.ok) result.emailError = emailResult.error;
  }

  return jsonResponse(result);
});
