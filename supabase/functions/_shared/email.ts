function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface SendEmailParams {
  to: string;
  monitorName: string;
  monitorUrl: string;
  detectedAt: string;
  resendApiKey: string;
  fromEmail: string;
}

export interface EmailResult {
  ok: boolean;
  providerId?: string;
  error?: string;
}

export async function sendChangeNotificationEmail(p: SendEmailParams): Promise<EmailResult> {
  const detectedDate = new Date(p.detectedAt).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
  });

  const safeName = escapeHtml(p.monitorName);
  const safeUrl = escapeHtml(p.monitorUrl);
  const safeDate = escapeHtml(detectedDate);

  const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
  <h2 style="color:#333">🔔 ページ変更が検出されました</h2>
  <p><strong>${safeName}</strong> で変更が検出されました。</p>
  <table style="border-collapse:collapse;width:100%">
    <tr>
      <td style="padding:8px;color:#666;width:120px">対象URL</td>
      <td style="padding:8px"><a href="${safeUrl}">${safeUrl}</a></td>
    </tr>
    <tr>
      <td style="padding:8px;color:#666">検出日時</td>
      <td style="padding:8px">${safeDate}</td>
    </tr>
  </table>
  <p style="margin-top:24px">
    <a href="https://diffbell.app/dashboard" style="background:#4f46e5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">
      DiffBell で確認する
    </a>
  </p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
  <p style="font-size:12px;color:#999">
    このメールは DiffBell からお送りしています。
    通知を停止するには <a href="https://diffbell.app/settings">設定ページ</a> をご確認ください。
  </p>
</div>
`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${p.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: p.fromEmail,
      to: [p.to],
      subject: `[DiffBell] 変更検出: ${p.monitorName}`,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, error: `Resend error ${res.status}: ${body}` };
  }

  const json = (await res.json()) as { id?: string };
  return { ok: true, providerId: json.id };
}
