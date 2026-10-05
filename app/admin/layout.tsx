import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase } = await requireAdmin();
  const [orders, members, messages] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .or("status.eq.pending,and(status.eq.paid,cancel_requested_at.not.is.null)"),
    supabase.from("member_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("handled", false),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <p className="eyebrow">Admin</p>
      <h1 className="display mt-2 text-5xl">Shop management</h1>
      <div className="mt-8">
        <AdminNav counts={{ orders: orders.count ?? 0, members: members.count ?? 0, messages: messages.count ?? 0 }} />
      </div>
      {children}
    </div>
  );
}
