import Link from "next/link";
import { and, count, eq, gt, inArray, isNotNull, lte } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { contact_messages, member_requests, orders, products } from "@/lib/db";

const LOW_STOCK = 5;

export default async function AdminHome() {
  const { db } = await requireAdmin();
  const [[newOrders], [toShip], [requests], [low], [out], [cancels], [messages]] = await Promise.all([
    db.select({ n: count() }).from(orders).where(eq(orders.status, "pending")),
    db.select({ n: count() }).from(orders).where(eq(orders.status, "paid")),
    db.select({ n: count() }).from(member_requests).where(eq(member_requests.status, "pending")),
    db.select({ n: count() }).from(products).where(and(gt(products.stock, 0), lte(products.stock, LOW_STOCK))),
    db.select({ n: count() }).from(products).where(eq(products.stock, 0)),
    db.select({ n: count() }).from(orders).where(and(isNotNull(orders.cancel_requested_at), inArray(orders.status, ["pending", "paid"]))),
    db.select({ n: count() }).from(contact_messages).where(eq(contact_messages.handled, false)),
  ]);

  const cards = [
    { href: "/admin/orders?status=pending", n: newOrders?.n ?? 0, label: "New orders", hint: "Waiting for payment / processing" },
    { href: "/admin/orders?status=paid", n: toShip?.n ?? 0, label: "Paid, to ship", hint: "Ready to pack and send" },
    { href: "/admin/orders?status=cancel-request", n: cancels?.n ?? 0, label: "Cancel requests", hint: "Customers asking to cancel" },
    { href: "/admin/messages", n: messages?.n ?? 0, label: "New messages", hint: "From the contact form" },
    { href: "/admin/members?status=pending", n: requests?.n ?? 0, label: "Member requests", hint: "Waiting for your approval" },
    { href: "/admin/stock?filter=low", n: low?.n ?? 0, label: "Low stock", hint: `${LOW_STOCK} or fewer left` },
    { href: "/admin/stock?filter=out", n: out?.n ?? 0, label: "Sold out", hint: "Stock is 0" },
  ];

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <Link key={c.label} href={c.href} className="rounded-2xl border border-line p-6 transition hover:border-ink hover:shadow-md">
          <p className={`display text-6xl ${c.n > 0 ? "text-crimson" : "text-stone-300"}`}>{c.n}</p>
          <p className="mt-2 font-semibold">{c.label}</p>
          <p className="text-sm text-muted">{c.hint}</p>
        </Link>
      ))}
    </div>
  );
}
