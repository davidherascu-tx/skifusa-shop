import Link from "next/link";
import { ORDER_STATUSES, orderStatusStyle, requireAdmin, type OrderStatus, type Shipping } from "@/lib/admin";
import { setOrderStatus } from "../actions";
import { SaveButton } from "@/components/admin/save-button";
import { Notice } from "@/components/admin/notice";
import { money } from "@/lib/format";

type Order = {
  id: string;
  status: OrderStatus;
  total_cents: number;
  created_at: string;
  email: string | null;
  payment_ref: string | null;
  cancel_requested_at: string | null;
  cancel_reason: string | null;
  shipping: Shipping | null;
  order_items: { name: string; quantity: number; size: string | null; unit_price_cents: number }[];
};

export default async function AdminOrders({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; saved?: string; error?: string }>;
}) {
  const { status, saved, error } = await searchParams;
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("orders")
    .select("id, status, total_cents, created_at, email, payment_ref, cancel_requested_at, cancel_reason, shipping, order_items(name, quantity, size, unit_price_cents)")
    .order("created_at", { ascending: false })
    .limit(500)
    .overrideTypes<Order[]>();
  const all = data ?? [];
  const isCancelTab = status === "cancel-request";
  const openCancel = (o: Order) => !!o.cancel_requested_at && (o.status === "pending" || o.status === "paid");
  const filter = ORDER_STATUSES.find((s) => s === status);
  const orders = isCancelTab ? all.filter(openCancel) : filter ? all.filter((o) => o.status === filter) : all;
  const count = (s: OrderStatus) => all.filter((o) => o.status === s).length;
  const returnTo = `/admin/orders${isCancelTab ? "?status=cancel-request" : filter ? `?status=${filter}` : ""}`;

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-2 text-sm font-medium">
        <Link href="/admin/orders" className={`rounded-full px-4 py-2 ${!filter && !isCancelTab ? "bg-ink text-white" : "bg-mist hover:bg-stone-200"}`}>
          All ({all.length})
        </Link>
        <Link
          href="/admin/orders?status=cancel-request"
          className={`rounded-full px-4 py-2 ${isCancelTab ? "bg-crimson text-white" : "bg-red-50 text-red-700 hover:bg-red-100"}`}
        >
          Cancel requests ({all.filter(openCancel).length})
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`rounded-full px-4 py-2 ${filter === s ? "bg-ink text-white" : "bg-mist hover:bg-stone-200"}`}
          >
            {orderStatusStyle[s].label.split(" ·")[0]} ({count(s)})
          </Link>
        ))}
      </div>

      <Notice saved={saved} error={error} />

      {orders.length === 0 ? (
        <p className="mt-10 rounded-2xl bg-mist p-10 text-center text-muted">No orders here.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((o) => {
            const st = orderStatusStyle[o.status];
            const ship = o.shipping ?? {};
            return (
              <li key={o.id} className="rounded-2xl border border-line p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      Order #{o.id.slice(0, 8).toUpperCase()}
                      <span className={`ml-3 rounded-full px-3 py-1 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {new Date(o.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })} · {ship.name ?? "—"} · {o.email ?? "no email"}
                    </p>
                    {openCancel(o) && (
                      <p className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        <strong>Cancellation requested</strong> {new Date(o.cancel_requested_at!).toLocaleDateString("en-US", { dateStyle: "medium" })}
                        {o.cancel_reason ? <> — “{o.cancel_reason}”</> : " — no reason given"}
                      </p>
                    )}
                    {o.payment_ref && <p className="mt-1 text-xs text-muted">PayPal order: {o.payment_ref}</p>}
                  </div>
                  <p className="text-xl font-bold">{money(o.total_cents)}</p>
                </div>

                <details className="group mt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-crimson">
                    <span className="group-open:hidden">Show items &amp; address</span>
                    <span className="hidden group-open:inline">Hide details</span>
                  </summary>
                  <div className="mt-4 grid gap-6 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">Items</p>
                      <ul className="mt-2 space-y-1 text-sm">
                        {o.order_items.map((i, n) => (
                          <li key={n} className="flex justify-between gap-3">
                            <span>{i.quantity}× {i.name}{i.size ? ` (${i.size})` : ""}</span>
                            <span className="text-muted">{money(i.unit_price_cents * i.quantity)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">Ship to</p>
                      {!o.shipping ? (
                        <p className="mt-2 text-sm text-muted">Online event: no shipping address.</p>
                      ) : (
                      <address className="mt-2 text-sm not-italic leading-relaxed">
                        {ship.name}<br />
                        {ship.line1}<br />
                        {ship.line2 && <>{ship.line2}<br /></>}
                        {ship.city}, {ship.state} {ship.postal_code}<br />
                        {ship.country}
                      </address>
                      )}
                    </div>
                  </div>
                </details>

                <form action={setOrderStatus} className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                  <input type="hidden" name="id" value={o.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <label className="text-sm text-muted" htmlFor={`st-${o.id}`}>Status</label>
                  <select id={`st-${o.id}`} name="status" defaultValue={o.status} className="rounded-full border border-line bg-white py-2 pl-4 pr-8 text-sm font-medium">
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>{orderStatusStyle[s].label}</option>
                    ))}
                  </select>
                  <SaveButton>Update</SaveButton>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
