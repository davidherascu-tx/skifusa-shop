import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { setMessageHandled } from "../actions";
import { SaveButton } from "@/components/admin/save-button";
import { Notice } from "@/components/admin/notice";

type Msg = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  topic: string | null;
  order_number: string | null;
  message: string;
  handled: boolean;
};

export default async function AdminMessages({
  searchParams,
}: {
  searchParams: Promise<{ show?: string; saved?: string; error?: string }>;
}) {
  const { show, saved, error } = await searchParams;
  const { supabase } = await requireAdmin();
  const tab = show === "handled" ? "handled" : "open";

  const { data, error: loadError } = await supabase
    .from("contact_messages")
    .select("id, created_at, name, email, phone, topic, order_number, message, handled")
    .order("created_at", { ascending: false })
    .limit(300)
    .overrideTypes<Msg[]>();
  const all = data ?? [];
  const rows = all.filter((m) => m.handled === (tab === "handled"));

  // Match "#C03149FD" to a real order (the shown number is the first 8 characters of the order id).
  const { data: orders } = await supabase.from("orders").select("id").order("created_at", { ascending: false }).limit(1000);
  const orderByNumber = new Map((orders ?? []).map((o) => [o.id.slice(0, 8).toUpperCase(), o.id]));

  const returnTo = `/admin/messages${tab === "handled" ? "?show=handled" : ""}`;

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-2 text-sm font-medium">
        <Link href="/admin/messages" className={`rounded-full px-4 py-2 ${tab === "open" ? "bg-ink text-white" : "bg-mist hover:bg-stone-200"}`}>
          Open ({all.filter((m) => !m.handled).length})
        </Link>
        <Link href="/admin/messages?show=handled" className={`rounded-full px-4 py-2 ${tab === "handled" ? "bg-ink text-white" : "bg-mist hover:bg-stone-200"}`}>
          Handled ({all.filter((m) => m.handled).length})
        </Link>
      </div>

      <Notice saved={saved} error={error} />
      {loadError && (
        <p role="alert" className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          The messages table is missing. Run <code>supabase/migrations/0005_contact_messages.sql</code> in the Supabase SQL Editor.
        </p>
      )}

      {rows.length === 0 ? (
        <p className="mt-10 rounded-2xl bg-mist p-10 text-center text-muted">No {tab} messages.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {rows.map((m) => {
            const orderId = m.order_number ? orderByNumber.get(m.order_number) : undefined;
            const reply = `mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.topic ?? "your message"}${m.order_number ? ` (order #${m.order_number})` : ""}`)}`;
            return (
              <li key={m.id} className="rounded-2xl border border-line p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{m.name}</p>
                    <p className="text-sm text-muted">
                      <a href={`mailto:${m.email}`} className="hover:text-crimson">{m.email}</a>
                      {m.phone && <> · <a href={`tel:${m.phone}`} className="hover:text-crimson">{m.phone}</a></>} ·{" "}
                      {new Date(m.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    {m.topic && <span className="rounded-full bg-mist px-3 py-1">{m.topic}</span>}
                    {m.order_number &&
                      (orderId ? (
                        <Link href={`/admin/orders`} className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800" title="Matches an order in your shop">
                          Order #{m.order_number}
                        </Link>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800" title="No order with this number was found">
                          Order #{m.order_number} (not found)
                        </span>
                      ))}
                  </div>
                </div>

                {/* Rendered as plain text by React, so nothing a visitor typed can run as HTML. */}
                <p className="mt-4 whitespace-pre-wrap rounded-xl bg-mist p-4 text-sm leading-relaxed">{m.message}</p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <a href={reply} className="btn btn-primary !px-5 !py-2">Reply by email</a>
                  <form action={setMessageHandled}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="handled" value={m.handled ? "false" : "true"} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <SaveButton className="btn border border-line !px-5 !py-2 hover:bg-mist">{m.handled ? "Reopen" : "Mark as handled"}</SaveButton>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
