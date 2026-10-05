import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Metadata } from "next";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { eventDateLabel, eventTimesByZone, googleCalendarUrl, joinWindowOpen, eventEnd } from "@/lib/event";
import { money } from "@/lib/format";
import { AddressFields } from "@/components/address-fields";
import { Notice } from "@/components/admin/notice";
import type { Address } from "@/lib/address";
import { requestCancellation, saveAddress, updateOrderAddress } from "./actions";
import { notifyMemberRequest } from "@/lib/notify";

export const metadata: Metadata = { title: "My account" };

const statusLabel: Record<string, [string, string]> = {
  pending: ["Received · awaiting payment", "bg-amber-100 text-amber-800"],
  paid: ["Paid", "bg-emerald-100 text-emerald-800"],
  shipped: ["Shipped", "bg-sky-100 text-sky-800"],
  cancelled: ["Cancelled", "bg-stone-200 text-stone-700"],
  refunded: ["Refunded", "bg-stone-200 text-stone-700"],
};

async function requestMemberAccess(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/account");
  const text = (k: string, max: number) => String(formData.get(k) ?? "").trim().slice(0, max);
  const member_number = text("member_number", 50);
  if (!member_number) redirect("/account?member=missing#member-access");
  const dojo = text("dojo", 120) || null;
  const note = text("note", 500) || null;
  const { error } = await supabase.from("member_requests").insert({ user_id: auth.user.id, member_number, dojo, note });
  if (!error) {
    const { data: me } = await supabase.from("profiles").select("full_name").eq("id", auth.user.id).single();
    await notifyMemberRequest({ name: me?.full_name ?? "", email: auth.user.email ?? "", member_number, dojo, note });
  }
  revalidatePath("/account");
  redirect(error ? "/account?member=error#member-access" : "/account#member-access");
}

export default async function Account({ searchParams }: { searchParams: Promise<{ member?: string; saved?: string; error?: string; addr?: string }> }) {
  const { member: memberMsg, saved, error: errorMsg, addr } = await searchParams;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/account");

  const [{ data: profile }, { data: orders }, { data: requests }] = await Promise.all([
    supabase.from("profiles").select("full_name, is_member, is_admin, address").eq("id", auth.user.id).single(),
    supabase
      .from("orders")
      .select("id, status, total_cents, created_at, shipping, cancel_requested_at, order_items(name, quantity, size, product_id, products(*))")
      .order("created_at", { ascending: false }),
    supabase
      .from("member_requests")
      .select("status, created_at")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);
  const request = requests?.[0];
  // Private Zoom details: loaded with the service key, but ONLY for events this customer has paid for.
  type EventProduct = { kind?: string | null; event_start?: string | null; event_minutes?: number | null };
  const eventOf = (i: { products?: unknown }) => (i.products ?? null) as EventProduct | null;
  const paidEventIds = [
    ...new Set(
      (orders ?? [])
        .filter((o) => o.status === "paid" || o.status === "shipped")
        .flatMap((o) => o.order_items.filter((i) => eventOf(i)?.kind === "virtual" && i.product_id).map((i) => i.product_id as string)),
    ),
  ];
  const access = new Map<string, { join_url: string | null; join_info: string | null }>();
  if (paidEventIds.length) {
    const { data } = await createAdminClient().from("event_access").select("product_id, join_url, join_info").in("product_id", paidEventIds);
    for (const a of data ?? []) access.set(a.product_id, a);
  }
  const now = new Date();
  const memberState = profile?.is_member ? "approved" : request?.status === "pending" ? "pending" : request?.status === "rejected" ? "rejected" : "none";

  return (
    <div className="mx-auto max-w-4xl px-5 py-14">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">My account</p>
          <h1 className="display mt-2 text-5xl">{profile?.full_name || "Welcome"}</h1>
          <p className="mt-2 text-sm text-muted">
            {auth.user.email}
            {profile?.is_member && (
              <span className="ml-3 rounded-full bg-crimson px-3 py-1 text-xs font-semibold text-white">S.K.I.F. Member</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {profile?.is_admin && <Link href="/admin" className="btn btn-primary">Admin dashboard</Link>}
          <form action="/auth/signout" method="post">
            <button className="btn border border-line hover:bg-mist">Sign out</button>
          </form>
        </div>
      </div>

      <Notice saved={saved} error={errorMsg} />

      <section id="member-access" className="mt-10 scroll-mt-32 rounded-3xl border border-line p-7">
        <h2 className="display text-3xl">S.K.I.F. member access</h2>
        {memberState === "approved" && (
          <p className="mt-3 text-stone-600">You are an approved S.K.I.F. member. You can order the members-only items.</p>
        )}
        {memberState === "pending" && (
          <p className="mt-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
            Your request is pending. We will review it and update your account. No further action is needed.
          </p>
        )}
        {(memberState === "none" || memberState === "rejected") && (
          <>
            <p className="mt-3 max-w-xl text-sm text-stone-600">
              Some items (passports, stamps, certificates) are for approved S.K.I.F. members only. Your shop account is
              not a membership. Send your member details and we will verify them.
            </p>
            {memberState === "rejected" && (
              <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                Your last request could not be verified. Please check your details and try again, or contact us.
              </p>
            )}
            {memberMsg === "missing" && <p className="mt-3 text-sm text-red-700">Please enter your member number.</p>}
            {memberMsg === "error" && <p className="mt-3 text-sm text-red-700">Could not send your request. Please try again.</p>}
            <form action={requestMemberAccess} className="mt-5 grid max-w-xl gap-3">
              <input name="member_number" required placeholder="S.K.I.F. member number" className="input" />
              <input name="dojo" placeholder="Dojo / instructor (optional)" className="input" />
              <textarea name="note" rows={3} placeholder="Note (optional)" className="input" />
              <button className="btn btn-dark w-fit !px-8">Request member access</button>
            </form>
          </>
        )}
      </section>

      <h2 className="display mt-14 text-3xl">Order history</h2>
      {orders?.length ? (
        <ul className="mt-6 space-y-4">
          {orders.map((o) => {
            const [label, cls] = statusLabel[o.status] ?? [o.status, "bg-stone-200"];
            return (
              <li key={o.id} className="rounded-2xl border border-line p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">Order #{o.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-sm text-muted">{new Date(o.created_at).toLocaleDateString("en-US", { dateStyle: "long" })}</p>
                  </div>
                  <span className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{label}</span>
                    {o.cancel_requested_at && (o.status === "pending" || o.status === "paid") && (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">Cancellation requested</span>
                    )}
                  </span>
                </div>
                <p className="mt-4 text-sm text-stone-600">
                  {o.order_items.map((i) => `${i.quantity}× ${i.name}${i.size ? ` (${i.size})` : ""}`).join(" · ")}
                </p>
                {o.order_items.map((i, n) => {
                  const ev = eventOf(i);
                  if (ev?.kind !== "virtual" || !ev.event_start) return null;
                  const paid = o.status === "paid" || o.status === "shipped";
                  const a = i.product_id ? access.get(i.product_id) : undefined;
                  const open = paid && joinWindowOpen(ev.event_start, ev.event_minutes, now);
                  const ended = now > eventEnd(ev.event_start, ev.event_minutes);
                  const closedOrder = o.status === "cancelled" || o.status === "refunded";
                  return (
                    <div key={n} className="mt-4 rounded-xl border border-line bg-mist p-4 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-crimson">Live online event</p>
                      <p className="mt-1 font-semibold">{eventDateLabel(ev.event_start)}</p>
                      <p className="mt-1 text-xs text-muted">{eventTimesByZone(ev.event_start, ev.event_minutes).map((t) => t.text).join("  ·  ")}</p>
                      {closedOrder ? (
                        <p className="mt-3 text-stone-600">This registration was {o.status}.</p>
                      ) : !paid ? (
                        <p className="mt-3 text-amber-800">Complete your payment to receive your Zoom access details.</p>
                      ) : ended ? (
                        <p className="mt-3 text-stone-600">This event has ended. Thank you for joining us!</p>
                      ) : open && a?.join_url ? (
                        <div className="mt-3 space-y-2">
                          <a href={a.join_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary !px-6 !py-2.5">Join on Zoom</a>
                          {a.join_info && <p className="whitespace-pre-wrap rounded-lg bg-white p-3 text-stone-700">{a.join_info}</p>}
                          <p className="text-xs text-muted">Please do not share the meeting link, ID or password.</p>
                        </div>
                      ) : (
                        <p className="mt-3 text-stone-700">
                          You are registered. Your Zoom access details will appear here and be emailed to you 6–12 hours before the event.
                        </p>
                      )}
                      {paid && !closedOrder && !ended && (
                        <a href={googleCalendarUrl(i.name, ev.event_start, ev.event_minutes)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block font-semibold text-crimson underline underline-offset-4">
                          Add to Google Calendar
                        </a>
                      )}
                    </div>
                  );
                })}
                <div className="mt-3 flex items-center justify-between gap-3">
                  {o.status === "pending" ? (
                    <Link href={`/pay/${o.id}`} className="btn btn-primary !px-5 !py-2">Pay now</Link>
                  ) : <span />}
                  <p className="font-semibold">{money(o.total_cents)}</p>
                </div>

                {(o.status === "pending" || o.status === "paid") && (
                  <div className="mt-4 space-y-3 border-t border-line pt-4 text-sm">
                    {o.cancel_requested_at && (
                      <p className="rounded-xl bg-amber-50 p-3 text-amber-800">
                        Cancellation requested on {new Date(o.cancel_requested_at).toLocaleDateString("en-US", { dateStyle: "medium" })}. We will review it and update this order.
                      </p>
                    )}
                    {o.shipping && (
                    <details>
                      <summary className="cursor-pointer font-semibold hover:text-crimson">Change shipping address</summary>
                      <form action={updateOrderAddress} className="mt-3 grid max-w-md gap-3">
                        <input type="hidden" name="orderId" value={o.id} />
                        <AddressFields defaults={o.shipping as Address | null} />
                        <button className="btn btn-dark w-fit !px-6 !py-2">Update address</button>
                      </form>
                    </details>
                    )}
                    {!o.cancel_requested_at && (
                      <details>
                        <summary className="cursor-pointer font-semibold hover:text-crimson">Request cancellation</summary>
                        <form action={requestCancellation} className="mt-3 grid max-w-md gap-3">
                          <input type="hidden" name="orderId" value={o.id} />
                          <textarea name="reason" rows={3} placeholder="Reason (optional)" className="input" />
                          <button className="btn w-fit border border-red-300 !px-6 !py-2 text-red-700 hover:bg-red-50">Send cancellation request</button>
                        </form>
                      </details>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-6 rounded-2xl bg-mist p-10 text-center text-muted">No orders yet.</div>
      )}

      <section id="address" className="mt-14 scroll-mt-32 rounded-3xl border border-line p-7">
        <h2 className="display text-3xl">My shipping address</h2>
        <p className="mt-2 max-w-xl text-sm text-stone-600">
          Saved here, it is filled in automatically at checkout. Changing it does not change orders you already placed.
        </p>
        {addr === "saved" && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-800">✓ Address saved</p>}
        {addr === "invalid" && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">Please fill in every address field.</p>}
        {addr === "error" && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">Could not save your address. Please try again.</p>}
        <form action={saveAddress} className="mt-5 grid max-w-xl gap-3">
          <AddressFields defaults={profile?.address as Address | null} />
          <button className="btn btn-dark w-fit !px-8">Save address</button>
        </form>
      </section>
    </div>
  );
}
