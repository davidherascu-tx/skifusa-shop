import { money, shippingOf } from "@/lib/format";
import type { Shipping } from "@/lib/admin";
import { eventDateLabel, eventTimesByZone } from "@/lib/event";

export const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const site = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "https://skifusa-shop.com").replace(/\/$/, "");
export type EmailOrder = {
  id: string;
  total_cents: number;
  email: string | null;
  shipping: Shipping | null;
  order_items: { name: string; quantity: number; size: string | null; unit_price_cents: number }[];
  cancel_reason?: string | null;
  /** the order contains a live online event */
  virtual?: boolean;
};

export const orderNumber = (id: string) => id.slice(0, 8).toUpperCase();

type Out = { subject: string; html: string; text: string };

function layout(opts: { preheader: string; title: string; bodyHtml: string; cta?: { label: string; href: string } }) {
  return `<!DOCTYPE html>
<html lang="en"><body style="margin:0;padding:0;background:#f5f5f4;font-family:Arial,Helvetica,sans-serif;color:#0c0a09;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;">
<tr><td align="center" style="background:#0c0a09;padding:26px 24px;">
<p style="margin:0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#d6d3d1;">Shotokan Karate-Do International Federation USA</p>
<p style="margin:4px 0 0;font-size:20px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#c8102e;">Official Online Shop</p>
</td></tr>
<tr><td style="padding:32px 32px 8px;"><h1 style="margin:0 0 14px;font-size:22px;line-height:1.25;">${esc(opts.title)}</h1>${opts.bodyHtml}</td></tr>
${
  opts.cta
    ? `<tr><td align="center" style="padding:16px 32px 8px;"><a href="${esc(opts.cta.href)}" style="display:inline-block;background:#c8102e;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:13px 32px;border-radius:999px;">${esc(opts.cta.label)}</a></td></tr>`
    : ""
}
<tr><td style="padding:24px 32px 28px;font-size:12px;line-height:1.6;color:#78716c;">Questions? Just reply to this email.</td></tr>
<tr><td align="center" style="background:#f5f5f4;padding:16px 24px;font-size:12px;color:#78716c;">&copy; S.K.I.F.-USA &middot; <a href="${site()}" style="color:#78716c;">${esc(site().replace(/^https?:\/\//, ""))}</a></td></tr>
</table></td></tr></table></body></html>`;
}

const p = (html: string) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#44403c;">${html}</p>`;

function summary(o: EmailOrder) {
  const rows = o.order_items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;font-size:14px;border-bottom:1px solid #e7e5e4;">${i.quantity}&times; ${esc(i.name)}${i.size ? ` <span style="color:#78716c;">(${esc(i.size)})</span>` : ""}</td><td align="right" style="padding:8px 0;font-size:14px;border-bottom:1px solid #e7e5e4;">${money(i.unit_price_cents * i.quantity)}</td></tr>`,
    )
    .join("");
  const ship = shippingOf(o);
  const shipRow = ship > 0 ? `<tr><td style="padding:8px 0;font-size:14px;border-bottom:1px solid #e7e5e4;">Shipping</td><td align="right" style="padding:8px 0;font-size:14px;border-bottom:1px solid #e7e5e4;">${money(ship)}</td></tr>` : "";
  const s = o.shipping ?? {};
  const addr = [s.name, s.line1, s.line2, [s.city, s.state, s.postal_code].filter(Boolean).join(", "), s.country, s.phone ? `Tel: ${s.phone}` : ""].filter(Boolean).map(esc).join("<br />");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 16px;">${rows}${shipRow}
<tr><td style="padding:12px 0 0;font-size:15px;font-weight:bold;">Total</td><td align="right" style="padding:12px 0 0;font-size:15px;font-weight:bold;">${money(o.total_cents)}</td></tr></table>
${o.shipping ? `<p style="margin:0 0 4px;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#78716c;">Ship to</p>
<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#44403c;">${addr}</p>` : o.virtual ? p("Online event: no shipping needed.") : ""}`;
}

const textSummary = (o: EmailOrder) =>
  [
    ...o.order_items.map((i) => `${i.quantity}x ${i.name}${i.size ? ` (${i.size})` : ""}  ${money(i.unit_price_cents * i.quantity)}`),
    ...(shippingOf(o) > 0 ? [`Shipping  ${money(shippingOf(o))}`] : []),
    `Total: ${money(o.total_cents)}`,
  ].join("\n");

// ---------- customer emails ----------

export function orderReceived(o: EmailOrder): Out {
  const num = orderNumber(o.id);
  const href = `${site()}/pay/${o.id}`;
  return {
    subject: `We received your order #${num}`,
    html: layout({
      preheader: `Order #${num} is saved. Complete your payment to finish.`,
      title: `Thank you! Order #${num} is saved`,
      bodyHtml: p("We received your order. It is not paid yet. You can complete the payment securely with PayPal at any time.") + summary(o),
      cta: { label: "Pay now", href },
    }),
    text: `We received your order #${num}.\n\n${textSummary(o)}\n\nPay now: ${href}`,
  };
}

export function paymentReceived(o: EmailOrder): Out {
  const num = orderNumber(o.id);
  return {
    subject: `Payment received for order #${num}`,
    html: layout({
      preheader: `Thank you! We received your payment for order #${num}.`,
      title: `Payment received. Thank you!`,
      bodyHtml:
        p(o.virtual ? `We received your payment for order <strong>#${num}</strong>. You are registered! Your Zoom access details will be emailed to you 6–12 hours before the event and also appear under My account. Please do not share the meeting link, ID or password. Oss!` : `We received your payment for order <strong>#${num}</strong>. We will pack it and let you know when it ships. Oss!`) + summary(o),
      cta: { label: "View my orders", href: `${site()}/account` },
    }),
    text: `We received your payment for order #${num}.\n\n${textSummary(o)}\n\nView your orders: ${site()}/account`,
  };
}

export function orderShipped(o: EmailOrder): Out {
  const num = orderNumber(o.id);
  return {
    subject: `Your order #${num} has shipped`,
    html: layout({
      preheader: `Order #${num} is on its way.`,
      title: "Your order is on its way",
      bodyHtml: p(`Order <strong>#${num}</strong> has shipped.`) + summary(o),
      cta: { label: "View my orders", href: `${site()}/account` },
    }),
    text: `Your order #${num} has shipped.\n\n${textSummary(o)}`,
  };
}

export function orderClosed(o: EmailOrder, kind: "cancelled" | "refunded"): Out {
  const num = orderNumber(o.id);
  const word = kind === "cancelled" ? "cancelled" : "refunded";
  return {
    subject: `Your order #${num} was ${word}`,
    html: layout({
      preheader: `Order #${num} was ${word}.`,
      title: `Your order was ${word}`,
      bodyHtml:
        p(`Order <strong>#${num}</strong> was ${word}.`) +
        (kind === "refunded" ? p("Your refund is issued to your original payment method. PayPal usually shows it within a few days.") : "") +
        p("If you did not expect this, please reply to this email."),
    }),
    text: `Your order #${num} was ${word}.`,
  };
}

export function cancelRequestReceived(o: EmailOrder): Out {
  const num = orderNumber(o.id);
  return {
    subject: `We received your cancellation request for order #${num}`,
    html: layout({
      preheader: `We will review your request for order #${num}.`,
      title: "Cancellation request received",
      bodyHtml: p(`We received your request to cancel order <strong>#${num}</strong>. We will review it and email you once it is processed.`),
    }),
    text: `We received your request to cancel order #${num}. We will email you once it is processed.`,
  };
}

export function memberDecision(approved: boolean): Out {
  return approved
    ? {
        subject: "Your S.K.I.F. member access is approved",
        html: layout({
          preheader: "You can now order the members-only items.",
          title: "Member access approved",
          bodyHtml: p("Good news: your S.K.I.F. member access was approved. You can now order the members-only items in the shop."),
          cta: { label: "Go to the shop", href: `${site()}/products?category=members` },
        }),
        text: `Your S.K.I.F. member access was approved. Shop: ${site()}/products?category=members`,
      }
    : {
        subject: "About your S.K.I.F. member access request",
        html: layout({
          preheader: "We could not verify your member details.",
          title: "We could not verify your request",
          bodyHtml: p("We could not verify your S.K.I.F. member details. Please check the member number and try again from My account, or reply to this email."),
          cta: { label: "Open my account", href: `${site()}/account#member-access` },
        }),
        text: `We could not verify your S.K.I.F. member details. Please try again from ${site()}/account#member-access or reply to this email.`,
      };
}

// ---------- alerts for the shop owner ----------

export function adminNewOrder(o: EmailOrder, paid: boolean): Out {
  const num = orderNumber(o.id);
  return {
    subject: `${paid ? "PAID order" : "New order"} #${num} · ${money(o.total_cents)}`,
    html: layout({
      preheader: `${paid ? "Paid" : "New"} order from ${o.email ?? "a customer"}.`,
      title: paid ? `Order #${num} was paid` : `New order #${num}`,
      bodyHtml: p(`Customer: <strong>${esc(o.email ?? "unknown")}</strong>`) + summary(o),
      cta: { label: "Open in admin", href: `${site()}/admin/orders` },
    }),
    text: `${paid ? "Paid" : "New"} order #${num} from ${o.email ?? "unknown"}\n\n${textSummary(o)}\n\n${site()}/admin/orders`,
  };
}

export function adminCancelRequest(o: EmailOrder, reason: string | null): Out {
  const num = orderNumber(o.id);
  return {
    subject: `Cancellation request for order #${num}`,
    html: layout({
      preheader: `${o.email ?? "A customer"} asks to cancel order #${num}.`,
      title: `Cancellation request: #${num}`,
      bodyHtml: p(`Customer: <strong>${esc(o.email ?? "unknown")}</strong>`) + p(`Reason: ${reason ? esc(reason) : "<em>none given</em>"}`) + summary(o),
      cta: { label: "Review in admin", href: `${site()}/admin/orders?status=cancel-request` },
    }),
    text: `Cancellation request for order #${num} from ${o.email ?? "unknown"}.\nReason: ${reason ?? "none given"}\n\n${site()}/admin/orders?status=cancel-request`,
  };
}

export function adminMemberRequest(r: { name: string; email: string; member_number: string; dojo: string | null; note: string | null }): Out {
  return {
    subject: `Member access request: ${r.name || r.email}`,
    html: layout({
      preheader: `${r.name || r.email} (member no. ${r.member_number}) asks for member access.`,
      title: "New member access request",
      bodyHtml:
        p(`<strong>${esc(r.name || "(no name)")}</strong> &middot; ${esc(r.email)}`) +
        p(`Member number: <strong>${esc(r.member_number)}</strong><br />Dojo / instructor: ${esc(r.dojo || "—")}<br />Note: ${esc(r.note || "—")}`),
      cta: { label: "Review in admin", href: `${site()}/admin/members` },
    }),
    text: `Member access request\n${r.name} <${r.email}>\nMember number: ${r.member_number}\nDojo: ${r.dojo ?? "-"}\nNote: ${r.note ?? "-"}\n\n${site()}/admin/members`,
  };
}

export function adminContactMessage(m: { name: string; email: string; phone: string | null; topic: string; order_number: string | null; message: string }): Out {
  const subjectLine = `Contact form: ${m.topic}${m.order_number ? ` · order #${m.order_number}` : ""}`.replace(/[\r\n]+/g, " ");
  return {
    subject: subjectLine,
    html: layout({
      preheader: `${m.name} wrote to you via the contact form.`,
      title: "New contact message",
      bodyHtml:
        p(`<strong>${esc(m.name)}</strong> &middot; <a href="mailto:${esc(m.email)}" style="color:#c8102e;">${esc(m.email)}</a>${m.phone ? ` &middot; <a href="tel:${esc(m.phone)}" style="color:#c8102e;">${esc(m.phone)}</a>` : ""}`) +
        p(`Topic: <strong>${esc(m.topic)}</strong>${m.order_number ? `<br />Order number: <strong>#${esc(m.order_number)}</strong>` : ""}`) +
        `<p style="margin:0 0 14px;padding:14px;background:#f5f5f4;border-radius:10px;font-size:15px;line-height:1.6;color:#0c0a09;white-space:pre-wrap;">${esc(m.message)}</p>` +
        p("Just reply to this email to answer them."),
      cta: { label: "Open in admin", href: `${site()}/admin/messages` },
    }),
    text: `${m.name} <${m.email}>\nPhone: ${m.phone ?? "-"}\nTopic: ${m.topic}\nOrder number: ${m.order_number ?? "-"}\n\n${m.message}\n\n${site()}/admin/messages`,
  };
}

export function eventAccess(e: { name: string; start: string; minutes: number | null; join_url: string; join_info: string | null }): Out {
  const times = eventTimesByZone(e.start, e.minutes);
  const when = [eventDateLabel(e.start), ...times.map((t) => `${t.label}: ${t.text}`)].join("\n");
  return {
    subject: `Zoom access for ${e.name}`,
    html: layout({
      preheader: "Your Zoom link for the live training.",
      title: "Your Zoom access details",
      bodyHtml:
        p(`You are registered for <strong>${esc(e.name)}</strong>.`) +
        p(`<strong>${esc(eventDateLabel(e.start))}</strong><br />${times.map((t) => `${esc(t.label)}: ${esc(t.text)}`).join("<br />")}`) +
        (e.join_info ? `<p style="margin:0 0 14px;padding:14px;background:#f5f5f4;border-radius:10px;font-size:14px;line-height:1.6;white-space:pre-wrap;">${esc(e.join_info)}</p>` : "") +
        p("Please warm up before the session and join 5 minutes early to allow time for setup and any technical issues. Please do not share the meeting link, ID or password."),
      cta: { label: "Join on Zoom", href: e.join_url },
    }),
    text: `You are registered for ${e.name}.

${when}

Join: ${e.join_url}
${e.join_info ?? ""}

Please do not share the meeting link, ID or password.`,
  };
}
