"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ORDER_STATUSES, requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";
import { restockOrder } from "@/lib/orders";
import { notifyMemberDecision, notifyOrderStatus, sendContactReply, sendEventAccessEmails } from "@/lib/notify";
import { zonedToUtc } from "@/lib/event";

/** Only ever redirect back to an admin page. */
const safeReturn = (v: FormDataEntryValue | null, fallback: string) => {
  const s = String(v ?? "");
  return s.startsWith("/admin") && !s.startsWith("//") ? s : fallback;
};
const withParam = (path: string, key: string, value: string) =>
  `${path}${path.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(value)}`;

export async function setOrderStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const input = z.object({ id: z.uuid(), status: z.enum(ORDER_STATUSES) }).safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  const back = safeReturn(formData.get("returnTo"), "/admin/orders");
  if (!input.success) redirect(withParam(back, "error", "Invalid order update"));

  const { data: before } = await supabase.from("orders").select("status").eq("id", input.data.id).maybeSingle();
  const { data, error } = await supabase.from("orders").update({ status: input.data.status }).eq("id", input.data.id).select("id");
  if (error || !data?.length) redirect(withParam(back, "error", "Could not update the order"));

  // A paid order that is cancelled or refunded goes back into stock (shipped goods are not assumed returned).
  const restock = before?.status === "paid" && (input.data.status === "cancelled" || input.data.status === "refunded");
  if (restock) await restockOrder(createAdminClient(), input.data.id);

  if (before?.status !== input.data.status) await notifyOrderStatus(input.data.id, input.data.status);

  revalidatePath("/admin", "layout");
  redirect(withParam(back, "saved", restock ? "Order updated and items put back into stock" : "Order updated"));
}

export async function reviewMemberRequest(formData: FormData) {
  const { supabase } = await requireAdmin();
  const input = z.object({ id: z.uuid(), decision: z.enum(["approved", "rejected"]) }).safeParse({
    id: formData.get("id"),
    decision: formData.get("decision"),
  });
  const back = safeReturn(formData.get("returnTo"), "/admin/members");
  if (!input.success) redirect(withParam(back, "error", "Invalid request"));

  // A database trigger sets / clears profiles.is_member when status changes.
  const { data, error } = await supabase.from("member_requests").update({ status: input.data.decision }).eq("id", input.data.id).select("id, user_id");
  if (error || !data?.length) redirect(withParam(back, "error", "Could not update the request"));
  await notifyMemberDecision(data[0].user_id, input.data.decision === "approved");
  revalidatePath("/admin", "layout");
  redirect(withParam(back, "saved", input.data.decision === "approved" ? "Member approved" : "Request rejected"));
}

const dollars = z
  .string()
  .trim()
  .regex(/^\d{1,6}(\.\d{1,2})?$/, "Invalid price")
  .transform((v) => Math.round(parseFloat(v) * 100));

export async function saveProduct(formData: FormData) {
  const { supabase } = await requireAdmin();
  const sale = String(formData.get("sale") ?? "").trim();
  const input = z
    .object({
      id: z.uuid(),
      stock: z.coerce.number().int().min(0).max(100000),
      price: dollars,
      sale: z.union([z.literal(""), dollars]),
      active: z.boolean(),
    })
    .safeParse({
      id: formData.get("id"),
      stock: formData.get("stock"),
      price: formData.get("price"),
      sale,
      active: formData.get("active") === "on",
    });
  const back = safeReturn(formData.get("returnTo"), "/admin/stock");
  if (!input.success) redirect(withParam(back, "error", "Please check stock and price values"));

  const { data, error } = await supabase
    .from("products")
    .update({
      stock: input.data.stock,
      price_cents: input.data.price,
      sale_price_cents: input.data.sale === "" ? null : input.data.sale,
      active: input.data.active,
    })
    .eq("id", input.data.id)
    .select("name");
  if (error || !data?.length) redirect(withParam(back, "error", "Could not save the product"));
  revalidatePath("/admin", "layout");
  revalidatePath("/products");
  revalidatePath("/");
  redirect(withParam(back, "saved", `${data[0].name} saved`));
}

export async function setMessageHandled(formData: FormData) {
  const { supabase } = await requireAdmin();
  const input = z.object({ id: z.uuid(), handled: z.enum(["true", "false"]) }).safeParse({
    id: formData.get("id"),
    handled: formData.get("handled"),
  });
  const back = safeReturn(formData.get("returnTo"), "/admin/messages");
  if (!input.success) redirect(withParam(back, "error", "Invalid request"));
  const { data, error } = await supabase.from("contact_messages").update({ handled: input.data.handled === "true" }).eq("id", input.data.id).select("id");
  if (error || !data?.length) redirect(withParam(back, "error", "Could not update the message"));
  revalidatePath("/admin", "layout");
  redirect(withParam(back, "saved", input.data.handled === "true" ? "Marked as handled" : "Reopened"));
}

export async function replyToMessage(formData: FormData) {
  const { supabase } = await requireAdmin();
  const input = z.object({ id: z.uuid(), reply: z.string().trim().min(2, "Please write a reply").max(5000) }).safeParse({
    id: formData.get("id"),
    reply: formData.get("reply"),
  });
  const back = safeReturn(formData.get("returnTo"), "/admin/messages");
  if (!input.success) redirect(withParam(back, "error", input.error.issues[0]?.message ?? "Invalid reply"));

  const { data: msg } = await supabase
    .from("contact_messages")
    .select("id, name, email, topic, order_number, message")
    .eq("id", input.data.id)
    .maybeSingle();
  if (!msg) redirect(withParam(back, "error", "Message not found"));

  const sent = await sendContactReply({
    to: msg.email,
    name: msg.name,
    topic: msg.topic,
    order_number: msg.order_number,
    original: msg.message,
    reply: input.data.reply,
  });
  if (!sent) redirect(withParam(back, "error", "The reply could not be sent. Check that email (Resend) is set up, then try again."));

  const { error } = await supabase
    .from("contact_messages")
    .update({ reply: input.data.reply, replied_at: new Date().toISOString(), handled: true })
    .eq("id", msg.id);
  revalidatePath("/admin", "layout");
  redirect(withParam(back, "saved", error ? "Reply sent (could not save a copy: run migration 0008)" : `Reply sent to ${msg.email}`));
}

// ---------- live online events (virtual products) ----------
const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "event";

const eventSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(3).max(150),
  description: z.string().trim().max(5000),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Choose the date and time"),
  minutes: z.coerce.number().int().min(5).max(1440),
  price: dollars,
  seats: z.coerce.number().int().min(0).max(100000),
  active: z.boolean(),
  members_only: z.boolean(),
  // https only: this becomes a clickable link for customers, so javascript:/data: URLs must never get through.
  join_url: z.union([z.literal(""), z.url().refine((u) => u.startsWith("https://"), "The Zoom link must start with https://")]),
  join_info: z.string().trim().max(2000),
});

export async function saveEvent(formData: FormData) {
  const { supabase } = await requireAdmin();
  const back = safeReturn(formData.get("returnTo"), "/admin/events");
  const input = eventSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    start: formData.get("start"),
    minutes: formData.get("minutes"),
    price: formData.get("price"),
    seats: formData.get("seats"),
    active: formData.get("active") === "on",
    members_only: formData.get("members_only") === "on",
    join_url: String(formData.get("join_url") ?? "").trim(),
    join_info: formData.get("join_info") ?? "",
  });
  if (!input.success) redirect(withParam(back, "error", input.error.issues[0]?.message ?? "Please check the event details"));
  const e = input.data;

  const startUtc = zonedToUtc(e.start);
  if (!startUtc) redirect(withParam(back, "error", "Invalid date and time"));

  const fields = {
    name: e.name,
    description: e.description,
    price_cents: e.price,
    stock: e.seats,
    active: e.active,
    members_only: e.members_only,
    kind: "virtual",
    event_start: startUtc.toISOString(),
    event_minutes: e.minutes,
  };

  let productId = e.id;
  if (productId) {
    const { data, error } = await supabase.from("products").update(fields).eq("id", productId).eq("kind", "virtual").select("id");
    if (error || !data?.length) redirect(withParam(back, "error", "Could not save the event"));
  } else {
    const { data: cat } = await supabase.from("categories").select("id").eq("slug", "seminars").maybeSingle();
    const slug = `${slugify(e.name)}-${e.start.slice(0, 10)}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase
      .from("products")
      .insert({ ...fields, slug, category_id: cat?.id ?? null, image_url: "/seminar_live_training.webp" })
      .select("id")
      .single();
    if (error || !data) redirect(withParam(back, "error", "Could not create the event"));
    productId = data.id;
  }

  const { error: accessError } = await supabase
    .from("event_access")
    .upsert({ product_id: productId, join_url: e.join_url || null, join_info: e.join_info || null }, { onConflict: "product_id" });
  if (accessError) redirect(withParam(back, "error", "Event saved, but the Zoom details could not be saved"));

  revalidatePath("/admin", "layout");
  revalidatePath("/products");
  revalidatePath("/");
  redirect(withParam(back, "saved", e.id ? "Event saved" : "Event created"));
}

export async function emailEventAccess(formData: FormData) {
  await requireAdmin();
  const back = safeReturn(formData.get("returnTo"), "/admin/events");
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) redirect(withParam(back, "error", "Invalid event"));
  const r = await sendEventAccessEmails(id.data);
  revalidatePath("/admin", "layout");
  if (r.error) redirect(withParam(back, "error", r.error));
  redirect(withParam(back, "saved", `Zoom details emailed to ${r.sent} of ${r.total} attendees`));
}
