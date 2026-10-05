import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

const LOW_STOCK = 5;

export default async function AdminHome() {
  const { supabase } = await requireAdmin();
  const [newOrders, toShip, requests, low, out, cancels, messages] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "paid"),
    supabase.from("member_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("products").select("id", { count: "exact", head: true }).gt("stock", 0).lte("stock", LOW_STOCK),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("stock", 0),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .not("cancel_requested_at", "is", null)
      .in("status", ["pending", "paid"]),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("handled", false),
  ]);

  const cards = [
    { href: "/admin/orders?status=pending", n: newOrders.count ?? 0, label: "New orders", hint: "Waiting for payment / processing" },
    { href: "/admin/orders?status=paid", n: toShip.count ?? 0, label: "Paid, to ship", hint: "Ready to pack and send" },
    { href: "/admin/orders?status=cancel-request", n: cancels.count ?? 0, label: "Cancel requests", hint: "Customers asking to cancel" },
    { href: "/admin/messages", n: messages.count ?? 0, label: "New messages", hint: "From the contact form" },
    { href: "/admin/members?status=pending", n: requests.count ?? 0, label: "Member requests", hint: "Waiting for your approval" },
    { href: "/admin/stock?filter=low", n: low.count ?? 0, label: "Low stock", hint: `${LOW_STOCK} or fewer left` },
    { href: "/admin/stock?filter=out", n: out.count ?? 0, label: "Sold out", hint: "Stock is 0" },
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
