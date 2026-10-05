"use server";

import { headers } from "next/headers";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { notifyContact } from "@/lib/notify";
import { LIMITS, checkFormToken, contactSchema, countLinks, hashIp, normalizeOrderNumber, oneLine } from "@/lib/contact";

export type ContactState = {
  status: "idle" | "ok" | "error";
  message?: string;
  errors?: Partial<Record<"name" | "email" | "phone" | "order" | "topic" | "message", string>>;
  values?: Record<string, string>;
  attempt: number;
};

const field = (f: FormData, k: string) => String(f.get(k) ?? "");

async function turnstileOk(token: string, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // Turnstile is optional until keys are added
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret, response: token, ...(ip !== "unknown" ? { remoteip: ip } : {}) }),
    });
    return !!((await res.json()) as { success?: boolean }).success;
  } catch {
    return false; // fail closed: if we cannot verify, do not accept
  }
}

export async function sendContact(prev: ContactState, formData: FormData): Promise<ContactState> {
  const attempt = prev.attempt + 1;
  const values = { name: field(formData, "name"), email: field(formData, "email"), phone: field(formData, "phone"), topic: field(formData, "topic"), order: field(formData, "order"), message: field(formData, "message") };
  const fail = (message: string, errors?: ContactState["errors"]): ContactState => ({ status: "error", message, errors, values, attempt });

  // 1) Honeypot: real people never see or fill this field. Pretend success so bots learn nothing.
  if (field(formData, "website").trim() !== "") return { status: "ok", attempt };

  // 2) Signed timing token: must come from a form we rendered, and not be filled in instantly.
  const token = await checkFormToken(field(formData, "ft"));
  if (token === "invalid" || token === "expired") return fail("This form expired. Please reload the page and try again.");
  if (token === "too-fast") return fail("That was very quick. Please check your message and press Send again.");

  const h = await headers();
  const ip = h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // 3) Cloudflare Turnstile (when configured).
  if (!(await turnstileOk(field(formData, "cf-turnstile-response"), ip))) return fail("Please complete the spam check and try again.");

  // 4) Field validation.
  const parsed = contactSchema.safeParse(values);
  const errors: NonNullable<ContactState["errors"]> = {};
  if (!parsed.success) for (const i of parsed.error.issues) errors[i.path[0] as "name"] ??= i.message;
  const order = normalizeOrderNumber(values.order);
  if (order === undefined) errors.order = "An order number looks like #C03149FD (8 letters/numbers)";
  if (Object.keys(errors).length || !parsed.success) return fail("Please check the highlighted fields.", errors);
  if (countLinks(parsed.data.message) > 2) return fail("Please remove the links from your message.", { message: "Too many links" });

  // 5) Rate limits, using the messages table (a keyed hash of the IP is stored, never the IP).
  const admin = createAdminClient();
  const ipHash = await hashIp(ip);
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const count = async (q: { eq?: [string, string]; ilike?: [string, string] }) => {
    let query = admin.from("contact_messages").select("id", { count: "exact", head: true }).gte("created_at", since);
    if (q.eq) query = query.eq(...q.eq);
    if (q.ilike) query = query.ilike(...q.ilike);
    const { count: c, error } = await query;
    return error ? 0 : (c ?? 0); // if the table is missing we fail open and still deliver the message by email
  };
  const [byIp, byEmail, all] = await Promise.all([
    ip === "unknown" ? Promise.resolve(0) : count({ eq: ["ip_hash", ipHash] }),
    count({ ilike: ["email", parsed.data.email] }),
    count({}),
  ]);
  if (byIp >= LIMITS.perIp || byEmail >= LIMITS.perEmail || all >= LIMITS.global) {
    return fail("You have sent several messages already. Please try again in a little while.");
  }

  // 6) Save + email the owner.
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const record = {
    name: oneLine(parsed.data.name),
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    topic: parsed.data.topic,
    order_number: order ?? null,
    message: parsed.data.message,
  };
  const { error } = await admin.from("contact_messages").insert({ ...record, user_id: auth.user?.id ?? null, ip_hash: ip === "unknown" ? null : ipHash });
  if (error) console.error("[contact] could not save message (is migration 0005 applied?):", error.message);
  await notifyContact(record);

  return { status: "ok", attempt };
}
