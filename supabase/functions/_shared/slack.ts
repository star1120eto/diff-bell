export interface SlackResult {
  ok: boolean;
  error?: string;
}

export function isValidSlackWebhookUrl(url: string): boolean {
  return url.startsWith("https://hooks.slack.com/") && url.length <= 500;
}

export async function sendSlackNotification(
  webhookUrl: string,
  monitorName: string,
  monitorUrl: string,
  detectedAt: string,
): Promise<SlackResult> {
  const detectedDate = new Date(detectedAt).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
  });

  const body = {
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "🔔 ページ変更が検出されました" },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*監視名*\n${monitorName}` },
          { type: "mrkdwn", text: `*URL*\n<${monitorUrl}|${monitorUrl}>` },
          { type: "mrkdwn", text: `*検出日時*\n${detectedDate}` },
        ],
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "DiffBell で確認する" },
            url: "https://diffbell.app/dashboard",
          },
        ],
      },
    ],
  };

  if (!isValidSlackWebhookUrl(webhookUrl)) {
    return { ok: false, error: "Invalid Slack webhook URL" };
  }

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: `Slack error ${res.status}: ${text}` };
  }

  return { ok: true };
}
