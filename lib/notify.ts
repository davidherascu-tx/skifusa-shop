import { and, eq, inArray } from "drizzle-orm";
import { event_access, getDb, order_items, orders, products, user } from "@/lib/db";
import { adminRecipients, emailConfigured, sendEmail } from "@/lib/email";
import * as t from "@/lib/email-templates";

// Every function here is safe to call anywhere: it never throws and does nothing until Resend is configured.

async function loadOrder(orderId: string): Promise<t.EmailOrder | null> {
  const data = await getDb().query.orders.findFirst({
    columns: { id: true, total_cents: true, tax_cents: true, email: true, shipping: true, cancel_reason: true },
    where: eq(orders.id, orderId),
    with: { order_items: { columns: { name: true, quantity: true, size: true, unit_price_cents: true }, with: { products: { columns: { kind: true } } } } },
  });
  if (!data) return null;
  const virtual = data.order_items.some((i) => i.products?.kind === "virtual");
  return { ...(data as unknown as t.EmailOrder), virtual };
}

const toCustomer = (o: t.EmailOrder, out: { subject: string; html: string; text: string }) =>
  o.email ? sendEmail({ to: o.email, ...out }) : Promise.resolve(false);

const toAdmins = (out: { subject: string; html: string; text: string }) => {
  const to = adminRecipients();
  return to.length ? sendEmail({ to, ...out }) : Promise.resolve(false);
};

async function safely(label: string, fn: () => Promise<unknown>) {
  if (!emailConfigured()) return;
  try {
    await fn();
  } catch (e) {
    console.error(`[notify] ${label} failed:`, e);
  }
}

export const notifyOrderPlaced = (orderId: string) =>
  safely("orderPlaced", async () => {
    const o = await loadOrder(orderId);
    if (!o) return;
    await Promise.all([toCustomer(o, t.orderReceived(o)), toAdmins(t.adminNewOrder(o, false))]);
  });

export const notifyOrderPaid = (orderId: string) =>
  safely("orderPaid", async () => {
    const o = await loadOrder(orderId);
    if (!o) return;
    await Promise.all([toCustomer(o, t.paymentReceived(o)), toAdmins(t.adminNewOrder(o, true))]);
  });

/** Admin changed the order status: tell the customer about shipped / cancelled / refunded. */
export const notifyOrderStatus = (orderId: string, status: string) =>
  safely("orderStatus", async () => {
    const o = await loadOrder(orderId);
    if (!o) return;
    if (status === "shipped") await toCustomer(o, t.orderShipped(o));
    else if (status === "cancelled" || status === "refunded") await toCustomer(o, t.orderClosed(o, status));
  });

export const notifyCancelRequest = (orderId: string) =>
  safely("cancelRequest", async () => {
    const o = await loadOrder(orderId);
    if (!o) return;
    await Promise.all([toCustomer(o, t.cancelRequestReceived(o)), toAdmins(t.adminCancelRequest(o, o.cancel_reason ?? null))]);
  });

export const notifyMemberRequest = (r: { name: string; email: string; member_number: string; dojo: string | null; note: string | null }) =>
  safely("memberRequest", async () => {
    await toAdmins(t.adminMemberRequest(r));
  });

export const notifyMemberDecision = (userId: string, approved: boolean) =>
  safely("memberDecision", async () => {
    const [u] = await getDb().select({ email: user.email }).from(user).where(eq(user.id, userId)).limit(1);
    if (u?.email) await sendEmail({ to: u.email, ...t.memberDecision(approved) });
  });

/** Contact form -> the shop owner. Reply-To is the visitor, so "Reply" in the inbox answers them. */
export const notifyContact = (m: { name: string; email: string; phone: string | null; topic: string; order_number: string | null; message: string }) =>
  safely("contact", async () => {
    const to = adminRecipients();
    if (to.length) await sendEmail({ to, replyTo: m.email, ...t.adminContactMessage(m) });
  });

/** Sends an admin's reply to a contact message. Returns false if the email could not be sent. */
export async function sendContactReply(r: { to: string; name: string; topic: string | null; order_number: string | null; original: string; reply: string }): Promise<boolean> {
  if (!emailConfigured()) return false;
  const { to, ...rest } = r;
  return sendEmail({ to, replyTo: adminRecipients()[0] || undefined, ...t.contactReply(rest) });
}

/** Emails the Zoom link to everyone who has PAID for the event. Returns how many emails were sent. */
export async function sendEventAccessEmails(productId: string): Promise<{ sent: number; total: number; error?: string }> {
  if (!emailConfigured()) return { sent: 0, total: 0, error: "Email is not set up (Resend)." };
  const db = getDb();
  const [[product], [access]] = await Promise.all([
    db.select({ name: products.name, event_start: products.event_start, event_minutes: products.event_minutes }).from(products).where(eq(products.id, productId)).limit(1),
    db.select({ join_url: event_access.join_url, join_info: event_access.join_info }).from(event_access).where(eq(event_access.product_id, productId)).limit(1),
  ]);
  if (!product?.event_start) return { sent: 0, total: 0, error: "This event has no date yet." };
  if (!access?.join_url) return { sent: 0, total: 0, error: "Add the Zoom link first." };

  const rows = await db
    .select({ email: orders.email })
    .from(order_items)
    .innerJoin(orders, eq(orders.id, order_items.order_id))
    .where(and(eq(order_items.product_id, productId), inArray(orders.status, ["paid", "shipped"])));
  const emails = [...new Set(rows.map((r) => r.email).filter((e): e is string => !!e))];

  let sent = 0;
  for (const to of emails) {
    const ok = await sendEmail({
      to,
      ...t.eventAccess({ name: product.name, start: product.event_start, minutes: product.event_minutes, join_url: access.join_url, join_info: access.join_info }),
    });
    if (ok) sent++;
  }
  if (sent > 0) await db.update(event_access).set({ details_emailed_at: new Date().toISOString() }).where(eq(event_access.product_id, productId));
  return { sent, total: emails.length };
}
