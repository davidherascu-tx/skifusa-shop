// Sends email through Resend's HTTP API (fetch only, so it runs on Cloudflare Workers).
// Does nothing (and never throws) until RESEND_API_KEY and EMAIL_FROM are set.
const API = process.env.RESEND_API_URL ?? "https://api.resend.com/emails"; // RESEND_API_URL only exists so tests can point at a fake server

export const emailConfigured = () => !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;

type Message = { to: string | string[]; subject: string; html: string; text: string; replyTo?: string };

export async function sendEmail(m: Message): Promise<boolean> {
  if (!emailConfigured()) {
    console.info(`[email] skipped (Resend not configured): "${m.subject}"`);
    return false;
  }
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: m.to,
        subject: m.subject,
        html: m.html,
        text: m.text,
        reply_to: m.replyTo ?? (process.env.EMAIL_REPLY_TO || undefined),
      }),
    });
    if (!res.ok) {
      console.error(`[email] Resend rejected "${m.subject}":`, res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[email] failed "${m.subject}":`, e);
    return false;
  }
}

/** Addresses that get the "new order / request" alerts (comma separated in ADMIN_NOTIFY_EMAIL). */
export const adminRecipients = () =>
  (process.env.ADMIN_NOTIFY_EMAIL ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
