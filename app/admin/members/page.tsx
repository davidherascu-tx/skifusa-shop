import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";
import { reviewMemberRequest } from "../actions";
import { SaveButton } from "@/components/admin/save-button";
import { Notice } from "@/components/admin/notice";

type Req = {
  id: string;
  user_id: string;
  member_number: string;
  dojo: string | null;
  note: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
};

const tabs = ["pending", "approved", "rejected"] as const;
const pill: Record<Req["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-stone-200 text-stone-700",
};

export default async function AdminMembers({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; saved?: string; error?: string }>;
}) {
  const { status, saved, error } = await searchParams;
  const { supabase } = await requireAdmin();
  const tab = tabs.find((t) => t === status) ?? "pending";

  const { data } = await supabase
    .from("member_requests")
    .select("id, user_id, member_number, dojo, note, status, created_at, reviewed_at")
    .order("created_at", { ascending: false })
    .limit(500)
    .overrideTypes<Req[]>();
  const all = data ?? [];
  const rows = all.filter((r) => r.status === tab);

  // member_requests points at auth.users (not profiles), so names are a separate lookup.
  const { data: profiles } = rows.length
    ? await supabase.from("profiles").select("id, full_name").in("id", rows.map((r) => r.user_id))
    : { data: [] };
  const names = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  // Emails live in the auth schema, so look them up server-side with the service key.
  const admin = createAdminClient();
  const emails = new Map<string, string>();
  await Promise.all(
    rows.map(async (r) => {
      const { data: u } = await admin.auth.admin.getUserById(r.user_id);
      if (u.user?.email) emails.set(r.user_id, u.user.email);
    }),
  );

  const returnTo = `/admin/members?status=${tab}`;

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-2 text-sm font-medium">
        {tabs.map((t) => (
          <Link
            key={t}
            href={`/admin/members?status=${t}`}
            className={`rounded-full px-4 py-2 capitalize ${tab === t ? "bg-ink text-white" : "bg-mist hover:bg-stone-200"}`}
          >
            {t} ({all.filter((r) => r.status === t).length})
          </Link>
        ))}
      </div>

      <Notice saved={saved} error={error} />

      {rows.length === 0 ? (
        <p className="mt-10 rounded-2xl bg-mist p-10 text-center text-muted">No {tab} requests.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl border border-line p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold">
                    {names.get(r.user_id) || "(no name)"}
                    <span className={`ml-3 rounded-full px-3 py-1 text-xs font-semibold capitalize ${pill[r.status]}`}>{r.status}</span>
                  </p>
                  <p className="mt-1 text-sm text-muted">{emails.get(r.user_id) ?? "—"}</p>
                </div>
                <p className="text-sm text-muted">
                  Requested {new Date(r.created_at).toLocaleDateString("en-US", { dateStyle: "medium" })}
                </p>
              </div>

              <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Member number</dt>
                  <dd className="mt-0.5 font-medium">{r.member_number}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Dojo / instructor</dt>
                  <dd className="mt-0.5">{r.dojo || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Note</dt>
                  <dd className="mt-0.5">{r.note || "—"}</dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-wrap gap-3 border-t border-line pt-4">
                {r.status !== "approved" && (
                  <form action={reviewMemberRequest}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="decision" value="approved" />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <SaveButton className="btn btn-primary !px-5 !py-2">Approve as member</SaveButton>
                  </form>
                )}
                {r.status !== "rejected" && (
                  <form action={reviewMemberRequest}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="decision" value="rejected" />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <SaveButton className="btn border border-line !px-5 !py-2 hover:bg-mist">
                      {r.status === "approved" ? "Remove member access" : "Reject"}
                    </SaveButton>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
