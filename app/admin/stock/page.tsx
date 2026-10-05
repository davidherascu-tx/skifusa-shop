import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { saveProduct } from "../actions";
import { SaveButton } from "@/components/admin/save-button";
import { Notice } from "@/components/admin/notice";

const LOW_STOCK = 5;

type Row = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  sale_price_cents: number | null;
  stock: number;
  active: boolean;
  image_url: string | null;
  categories: { name: string; slug: string } | null;
};

const filters = [
  ["", "All"],
  ["low", `Low stock (≤ ${LOW_STOCK})`],
  ["out", "Sold out"],
  ["hidden", "Hidden"],
] as const;

const toDollars = (c: number | null) => (c === null ? "" : (c / 100).toFixed(2));

export default async function AdminStock({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string; saved?: string; error?: string }>;
}) {
  const { filter = "", q = "", saved, error } = await searchParams;
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("products")
    .select("id, slug, name, price_cents, sale_price_cents, stock, active, image_url, categories(name, slug)")
    .order("name")
    .overrideTypes<Row[]>();

  const term = q.trim().toLowerCase();
  const rows = (data ?? []).filter((p) => {
    if (term && !`${p.name} ${p.categories?.name ?? ""}`.toLowerCase().includes(term)) return false;
    if (filter === "low") return p.stock > 0 && p.stock <= LOW_STOCK;
    if (filter === "out") return p.stock === 0;
    if (filter === "hidden") return !p.active;
    return true;
  });
  const returnTo = `/admin/stock?${new URLSearchParams({ ...(filter ? { filter } : {}), ...(q ? { q } : {}) })}`;

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2 text-sm font-medium">
          {filters.map(([key, label]) => (
            <Link
              key={key}
              href={`/admin/stock${key ? `?filter=${key}` : ""}`}
              className={`rounded-full px-4 py-2 ${filter === key ? "bg-ink text-white" : "bg-mist hover:bg-stone-200"}`}
            >
              {label}
            </Link>
          ))}
        </div>
        <form className="flex gap-2" action="/admin/stock">
          {filter && <input type="hidden" name="filter" value={filter} />}
          <input name="q" defaultValue={q} placeholder="Search product…" className="input !w-56 !py-2" />
          <button className="btn border border-line !px-5 !py-2 hover:bg-mist">Search</button>
        </form>
      </div>

      <Notice saved={saved} error={error} />
      <p className="mt-6 text-sm text-muted">{rows.length} products · change the numbers and press Save on that row.</p>

      <div className="mt-3 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-mist text-left text-xs font-semibold uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Price ($)</th>
              <th className="px-4 py-3">Sale ($)</th>
              <th className="px-4 py-3">Visible</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((p) => {
              const formId = `f-${p.id}`;
              return (
                <tr key={p.id} className={p.active ? "" : "bg-stone-50 text-stone-500"}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-mist">
                        {p.image_url && <Image src={p.image_url} alt="" fill sizes="48px" className="object-contain" />}
                      </span>
                      <div>
                        <Link href={`/products/${p.slug}`} className="font-medium hover:text-crimson" target="_blank">{p.name}</Link>
                        <p className="text-xs text-muted">{p.categories?.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input form={formId} name="stock" type="number" min={0} max={100000} defaultValue={p.stock} required
                      className={`input !w-24 !py-2 ${p.stock === 0 ? "!border-crimson" : p.stock <= LOW_STOCK ? "!border-amber-400" : ""}`} aria-label={`Stock for ${p.name}`} />
                    {p.stock === 0 && <p className="mt-1 text-xs font-semibold text-crimson">Sold out</p>}
                    {p.stock > 0 && p.stock <= LOW_STOCK && <p className="mt-1 text-xs font-semibold text-amber-600">Low</p>}
                  </td>
                  <td className="px-4 py-3">
                    <input form={formId} name="price" inputMode="decimal" defaultValue={toDollars(p.price_cents)} required pattern="\d{1,6}(\.\d{1,2})?"
                      className="input !w-24 !py-2" aria-label={`Price for ${p.name}`} />
                  </td>
                  <td className="px-4 py-3">
                    <input form={formId} name="sale" inputMode="decimal" defaultValue={toDollars(p.sale_price_cents)} placeholder="none" pattern="(\d{1,6}(\.\d{1,2})?)?"
                      className="input !w-24 !py-2" aria-label={`Sale price for ${p.name}`} />
                  </td>
                  <td className="px-4 py-3">
                    <input form={formId} name="active" type="checkbox" defaultChecked={p.active} className="h-5 w-5 accent-crimson" aria-label={`${p.name} visible in shop`} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form id={formId} action={saveProduct}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <SaveButton>Save</SaveButton>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-10 text-center text-muted">No products match.</p>}
      </div>
    </div>
  );
}
