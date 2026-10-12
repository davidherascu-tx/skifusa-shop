import Link from "next/link";
import { and, desc, eq, inArray } from "drizzle-orm";
import { event_access, order_items, orders, products as productsTable, profiles } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { emailEventAccess, saveEvent } from "../actions";
import { SaveButton } from "@/components/admin/save-button";
import { Notice } from "@/components/admin/notice";
import { ADMIN_TZ, eventDateLabel, eventTimesByZone, registrationClosed, utcToLocalInput } from "@/lib/event";
import { money } from "@/lib/format";

type Ev = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  stock: number;
  active: boolean;
  members_only: boolean;
  event_start: string | null;
  event_minutes: number | null;
};
type Access = { product_id: string; join_url: string | null; join_info: string | null; details_emailed_at: string | null };
type Attendee = { email: string | null; name: string; ordered: string };

const toDollars = (c: number) => (c / 100).toFixed(2);

function EventForm({ ev, access, returnTo }: { ev?: Ev; access?: Access; returnTo: string }) {
  return (
    <form action={saveEvent} className="grid gap-4">
      {ev && <input type="hidden" name="id" value={ev.id} />}
      <input type="hidden" name="returnTo" value={returnTo} />
      <div>
        <label className="mb-1.5 block text-sm font-medium">Event title</label>
        <input name="name" required defaultValue={ev?.name} placeholder="Live Virtual Training with …" className="input" />
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium">Start (Central time)</label>
          <input name="start" type="datetime-local" required defaultValue={ev?.event_start ? utcToLocalInput(ev.event_start) : ""} className="input" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Length (minutes)</label>
          <input name="minutes" type="number" min={5} max={1440} required defaultValue={ev?.event_minutes ?? 60} className="input" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Seats</label>
          <input name="seats" type="number" min={0} required defaultValue={ev?.stock ?? 30} className="input" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Price ($)</label>
          <input name="price" inputMode="decimal" required defaultValue={ev ? toDollars(ev.price_cents) : "25.00"} className="input" />
        </div>
        <label className="flex items-center gap-2 pt-7 text-sm font-medium">
          <input type="checkbox" name="members_only" defaultChecked={ev?.members_only ?? true} className="h-5 w-5 accent-crimson" /> Members only
        </label>
        <label className="flex items-center gap-2 pt-7 text-sm font-medium">
          <input type="checkbox" name="active" defaultChecked={ev?.active ?? true} className="h-5 w-5 accent-crimson" /> Visible in shop
        </label>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Description (shown on the product page)</label>
        <textarea name="description" rows={7} defaultValue={ev?.description} className="input" />
        <p className="mt-1 text-xs text-muted">Start a line with “* ” to make a bullet point.</p>
      </div>

      <fieldset className="rounded-2xl border border-line bg-mist p-4">
        <legend className="px-2 text-sm font-semibold">Zoom access (private, only paid attendees see this)</legend>
        <div className="grid gap-3">
          <input name="join_url" type="url" placeholder="https://us02web.zoom.us/j/…" defaultValue={access?.join_url ?? ""} className="input" aria-label="Zoom link" />
          <textarea name="join_info" rows={3} placeholder="Meeting ID, passcode and notes (optional)" defaultValue={access?.join_info ?? ""} className="input" aria-label="Meeting ID and passcode" />
        </div>
      </fieldset>

      <SaveButton className="btn btn-dark w-fit !px-8">{ev ? "Save event" : "Create event"}</SaveButton>
    </form>
  );
}

export default async function AdminEvents({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  const { db } = await requireAdmin();

  const events = (await db
    .select({
      id: productsTable.id,
      slug: productsTable.slug,
      name: productsTable.name,
      description: productsTable.description,
      price_cents: productsTable.price_cents,
      stock: productsTable.stock,
      active: productsTable.active,
      members_only: productsTable.members_only,
      event_start: productsTable.event_start,
      event_minutes: productsTable.event_minutes,
    })
    .from(productsTable)
    .where(eq(productsTable.kind, "virtual"))
    .orderBy(desc(productsTable.event_start))) as Ev[];

  const ids = events.map((e) => e.id);
  const accessRows = ids.length ? ((await db.select().from(event_access).where(inArray(event_access.product_id, ids))) as Access[]) : [];
  const accessById = new Map(accessRows.map((a) => [a.product_id, a]));

  // Paid attendees per event.
  const attendees = new Map<string, Attendee[]>();
  for (const e of events) {
    const rows = await db
      .select({ email: orders.email, user_id: orders.user_id, created_at: orders.created_at })
      .from(order_items)
      .innerJoin(orders, eq(orders.id, order_items.order_id))
      .where(and(eq(order_items.product_id, e.id), inArray(orders.status, ["paid", "shipped"])));
    const userIds = rows.map((o) => o.user_id).filter((x): x is string => !!x);
    const profileRows = userIds.length ? await db.select({ id: profiles.id, full_name: profiles.full_name }).from(profiles).where(inArray(profiles.id, userIds)) : [];
    const names = new Map(profileRows.map((p) => [p.id, p.full_name]));
    attendees.set(
      e.id,
      rows.map((o) => ({ email: o.email, name: (o.user_id && names.get(o.user_id)) || "(no name)", ordered: o.created_at })),
    );
  }

  return (
    <div className="mt-8">
      <Notice saved={saved} error={error} />

      <details className="mt-6 rounded-2xl border border-line p-5" open={!events?.length}>
        <summary className="cursor-pointer text-lg font-semibold">+ Create a new event</summary>
        <div className="mt-5">
          <EventForm returnTo="/admin/events" />
        </div>
      </details>

      <ul className="mt-6 space-y-6">
        {(events ?? []).map((e) => {
          const list = attendees.get(e.id) ?? [];
          const a = accessById.get(e.id);
          const started = registrationClosed({ kind: "virtual", event_start: e.event_start });
          return (
            <li key={e.id} className="rounded-2xl border border-line p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-semibold">{e.name}</p>
                  {e.event_start && (
                    <p className="mt-1 text-sm text-muted">
                      {eventDateLabel(e.event_start)} · {eventTimesByZone(e.event_start, e.event_minutes)[1].text} · {money(e.price_cents)}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-mist px-3 py-1">{list.length} registered · {e.stock} seats left</span>
                  {started && <span className="rounded-full bg-stone-200 px-3 py-1">Started / ended</span>}
                  {!e.active && <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">Hidden</span>}
                  <Link href={`/products/${e.slug}`} target="_blank" className="rounded-full bg-mist px-3 py-1 hover:text-crimson">View page ↗</Link>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-mist p-4">
                <p className="text-sm font-semibold">Registered attendees ({list.length})</p>
                {list.length ? (
                  <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                    {list.map((p, i) => (
                      <li key={i} className="flex justify-between gap-3 border-b border-line py-1">
                        <span>{p.name}</span>
                        <a href={`mailto:${p.email}`} className="text-muted hover:text-crimson">{p.email}</a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-muted">Nobody has paid yet.</p>
                )}

                <form action={emailEventAccess} className="mt-4 flex flex-wrap items-center gap-3">
                  <input type="hidden" name="id" value={e.id} />
                  <input type="hidden" name="returnTo" value="/admin/events" />
                  <SaveButton className="btn btn-primary !px-5 !py-2">Email Zoom details to attendees</SaveButton>
                  <span className="text-xs text-muted">
                    {a?.join_url ? "" : "Add the Zoom link below first. "}
                    {a?.details_emailed_at ? `Last emailed ${new Date(a.details_emailed_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}.` : "Not emailed yet."}
                    {" "}Attendees also see the link in My account from 12 hours before the start.
                  </span>
                </form>
              </div>

              <details className="mt-5">
                <summary className="cursor-pointer font-semibold hover:text-crimson">Edit event &amp; Zoom details</summary>
                <div className="mt-4">
                  <EventForm ev={e} access={a} returnTo="/admin/events" />
                </div>
              </details>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-xs text-muted">Times you type here are read in {ADMIN_TZ.replace("America/", "").replace("_", " ")} time.</p>
    </div>
  );
}
