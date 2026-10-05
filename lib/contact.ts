import { z } from "zod";

// ---- signing helpers (Web Crypto, works on Cloudflare Workers) ----
const enc = new TextEncoder();
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const secret = () => process.env.CONTACT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "dev-only-secret";

async function hmac(data: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

const safeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
};

/** Signed "form was rendered at" timestamp. Bots that post directly cannot forge it. */
export async function makeFormToken() {
  const ts = String(Date.now());
  return `${ts}.${await hmac(`contact:${ts}`)}`;
}

const MIN_FILL_MS = 3_000; // humans need a few seconds to type a message
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

export async function checkFormToken(token: string): Promise<"ok" | "too-fast" | "expired" | "invalid"> {
  const [ts, sig] = token.split(".");
  if (!ts || !sig || !/^\d{10,15}$/.test(ts)) return "invalid";
  if (!safeEqual(sig, await hmac(`contact:${ts}`))) return "invalid";
  const age = Date.now() - Number(ts);
  if (age < MIN_FILL_MS) return "too-fast";
  if (age > MAX_AGE_MS) return "expired";
  return "ok";
}

/** We store a keyed hash of the visitor's IP (for rate limiting), never the IP itself. */
export const hashIp = (ip: string) => hmac(`ip:${ip}`);

// ---- field rules ----
export const TOPICS = ["Order question", "Product question", "Cancellation or return", "Membership", "Other"] as const;

/** "#c03149fd" / "C03149FD" -> "C03149FD". Returns null when empty, undefined when malformed. */
export function normalizeOrderNumber(v: string): string | null | undefined {
  const s = v.trim().replace(/^#/, "");
  if (!s) return null;
  return /^[0-9a-f]{8}$/i.test(s) ? s.toUpperCase() : undefined;
}

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().toLowerCase().email("Please enter a valid email").max(254),
  phone: z.string().trim().max(30).regex(/^[0-9+().\-\s]*$/, "Use digits only, e.g. 832-555-0100").optional().default(""),
  topic: z.enum(TOPICS),
  message: z.string().trim().min(10, "Please write at least a few words").max(2000, "Please keep it under 2000 characters"),
});

/** Link-heavy messages are almost always spam. */
export const countLinks = (s: string) => (s.match(/https?:\/\/|www\.|\.(com|net|org|ru|xyz|top|info)\//gi) ?? []).length;

/** Strips anything that could break a header / subject line. */
export const oneLine = (s: string) => s.replace(/[\r\n\t]+/g, " ").trim();

// ---- rate limits (per rolling hour) ----
export const LIMITS = { perIp: 5, perEmail: 3, global: 60 } as const;
