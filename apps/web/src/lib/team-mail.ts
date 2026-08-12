import { TEAM_ALLOWED_EMAILS } from "@/lib/team-allowlist";

export interface TeamMailResult {
  attempted: boolean;
  sent: number;
  failed: number;
  skippedReason?: "not_configured" | "send_failed";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Email every allowlisted team address with the same message body.
 * Uses Resend when RESEND_API_KEY is set; otherwise skips without failing the API.
 */
export async function sendTeamMessageEmails(input: {
  senderName: string;
  senderEmail: string;
  message: string;
}): Promise<TeamMailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return {
      attempted: false,
      sent: 0,
      failed: 0,
      skippedReason: "not_configured",
    };
  }

  const from =
    process.env.EMAIL_FROM?.trim() || "FireGuard <onboarding@resend.dev>";
  const recipients = [...TEAM_ALLOWED_EMAILS];
  const subject = `FireGuard team alert from ${input.senderName}`;
  const text = [
    "FireGuard team message",
    "",
    `From: ${input.senderName} <${input.senderEmail}>`,
    "",
    input.message,
    "",
    "Open FireGuard → Notifications to review the alert.",
  ].join("\n");

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#111">
      <p style="margin:0 0 12px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#666">
        FireGuard team message
      </p>
      <p style="margin:0 0 16px">
        <strong>${escapeHtml(input.senderName)}</strong>
        &lt;${escapeHtml(input.senderEmail)}&gt;
      </p>
      <div style="padding:14px 16px;border:1px solid #e5e5e5;border-radius:12px;background:#fafafa;white-space:pre-wrap">
${escapeHtml(input.message)}
      </div>
      <p style="margin:16px 0 0;font-size:13px;color:#666">
        Open FireGuard → Notifications to review the alert on the dashboard.
      </p>
    </div>
  `;

  const results = await Promise.allSettled(
    recipients.map(async (to) => {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          text,
          html,
          reply_to: input.senderEmail || undefined,
        }),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`Resend ${res.status}: ${detail.slice(0, 200)}`);
      }
    })
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.length - sent;

  return {
    attempted: true,
    sent,
    failed,
    skippedReason: failed > 0 && sent === 0 ? "send_failed" : undefined,
  };
}
