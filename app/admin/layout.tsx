import type { Metadata } from "next";
import { and, count, eq, isNotNull, or } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { contact_messages, member_requests, orders as ordersTable } from "@/lib/db";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { db } = await requireAdmin();
  const [[orders], [members], [messages]] = await Promise.all([
    db
      .select({ n: count() })
      .from(ordersTable)
      .where(or(eq(ordersTable.status, "pending"), and(eq(ordersTable.status, "paid"), isNotNull(ordersTable.cancel_requested_at)))),
    db.select({ n: count() }).from(member_requests).where(eq(member_requests.status, "pending")),
    db.select({ n: count() }).from(contact_messages).where(eq(contact_messages.handled, false)),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <p className="eyebrow">Admin</p>
      <h1 className="display mt-2 text-5xl">Shop management</h1>
      <div className="mt-8">
        <AdminNav counts={{ orders: orders?.n ?? 0, members: members?.n ?? 0, messages: messages?.n ?? 0 }} />
      </div>
      {children}
    </div>
  );
}
