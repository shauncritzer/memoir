/**
 * Transactional email — provider-agnostic.
 *
 * Supports Resend (RESEND_API_KEY) or SendGrid (SENDGRID_API_KEY), checked in
 * that order. ConvertKit handles marketing sequences; this module is only for
 * one-off transactional sends (course access links, receipts).
 *
 * Sender address comes from EMAIL_FROM (default: support@shauncritzer.com).
 */

const FROM = process.env.EMAIL_FROM || "Shaun Critzer <support@shauncritzer.com>";
// The domain can send but not receive (no inbound mail set up), so replies to
// the from-address would bounce. EMAIL_REPLY_TO routes replies to a real inbox.
const REPLY_TO = process.env.EMAIL_REPLY_TO || "";

export function isEmailConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY);
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  const resendKey = process.env.RESEND_API_KEY;
  const sendgridKey = process.env.SENDGRID_API_KEY;

  try {
    if (resendKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM,
          to: [params.to],
          subject: params.subject,
          html: params.html,
          ...(REPLY_TO ? { reply_to: REPLY_TO } : {}),
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error("[Email] Resend send failed:", err);
        return { success: false, error: err };
      }
      console.log(`[Email] Sent via Resend to ${params.to}: ${params.subject}`);
      return { success: true };
    }

    if (sendgridKey) {
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sendgridKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: params.to }] }],
          from: parseFromAddress(FROM),
          subject: params.subject,
          content: [{ type: "text/html", value: params.html }],
          ...(REPLY_TO ? { reply_to: { email: REPLY_TO } } : {}),
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error("[Email] SendGrid send failed:", err);
        return { success: false, error: err };
      }
      console.log(`[Email] Sent via SendGrid to ${params.to}: ${params.subject}`);
      return { success: true };
    }

    return { success: false, error: "No email provider configured (set RESEND_API_KEY or SENDGRID_API_KEY)" };
  } catch (err: any) {
    console.error("[Email] Send error:", err.message);
    return { success: false, error: err.message };
  }
}

function parseFromAddress(from: string): { email: string; name?: string } {
  const match = from.match(/^(.*?)\s*<(.+)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { email: from };
}

/**
 * Create a one-time login token for a user and return the full access URL.
 */
export async function createAccessLink(
  userId: number,
  expiresInMinutes = 30
): Promise<string> {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { loginTokens } = await import("../drizzle/schema");
  const { randomBytes } = await import("crypto");

  const token = randomBytes(32).toString("hex");
  await db.insert(loginTokens).values({
    token,
    userId,
    expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
  });

  const baseUrl = process.env.PUBLIC_URL || "https://shauncritzer.com";
  return `${baseUrl}/access?token=${token}`;
}

export function accessEmailHtml(params: {
  firstName?: string | null;
  accessUrl: string;
  productName: string;
}): string {
  const greeting = params.firstName ? `Hi ${params.firstName},` : "Hi,";
  return `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
      <h2 style="color: #1E3A5F;">Your ${params.productName} access</h2>
      <p>${greeting}</p>
      <p>Thanks for your purchase! Click the button below to log in and start the course — no password needed:</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${params.accessUrl}"
           style="background: #D4AF37; color: #1a1a1a; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Access Your Course
        </a>
      </p>
      <p style="font-size: 14px; color: #555;">
        This link works once and expires soon. Need a new one any time? Go to
        <a href="https://shauncritzer.com/login">shauncritzer.com/login</a> and choose
        "Email me an access link." You can also set a password there for regular login.
      </p>
      <p style="font-size: 14px; color: #555;">
        Questions? Just reply to this email.
      </p>
      <p>— Shaun</p>
    </div>
  `;
}
