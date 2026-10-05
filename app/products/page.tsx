import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product-card";
import { SortSelect } from "@/components/sort-select";
import { LockIcon } from "@/components/icons";
import type { Product } from "@/lib/format";

export const metadata: Metadata = { title: "Shop" };

const sorts = {
  newest: { col: "created_at", asc: false },
  "price-asc": { col: "price_cents", asc: true },
  "price-desc": { col: "price_cents", asc: false },
  name: { col: "name", asc: true },
} as const;

export default async function Products({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const { category, sort } = await searchParams;
  const sortKey = sort && sort in sorts ? (sort as keyof typeof sorts) : "newest";
  const supabase = await createClient();

  const { data: categories } = await supabase.from("categories").select("slug, name").order("sort_order");

  let query = supabase
    .from("products")
    .select("*, categories!inner(slug, name)")
    .eq("active", true)
    .order(sorts[sortKey].col, { ascending: sorts[sortKey].asc });
  if (category) query = query.eq("categories.slug", category);
  const { data: products } = await query.overrideTypes<Product[]>();

  const active = categories?.find((c) => c.slug === category);
  const pill = (slug: string) =>
    slug ? `/products?category=${slug}${sortKey !== "newest" ? `&sort=${sortKey}` : ""}` : `/products${sortKey !== "newest" ? `?sort=${sortKey}` : ""}`;

  return (
    <div className="mx-auto max-w-7xl px-5 py-14">
      <p className="eyebrow">Shop</p>
      <h1 className="display mt-2 text-5xl sm:text-6xl">{active?.name ?? "All products"}</h1>

      {category === "members" && (
        <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-crimson/10 px-4 py-2 text-sm font-semibold text-crimson">
          <LockIcon /> Approved members only. Log in and request member access to order.
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2 text-sm font-medium">
          {[{ slug: "", name: "All" }, ...(categories ?? [])].map((c) => (
            <Link
              key={c.slug}
              href={pill(c.slug)}
              className={`rounded-full px-5 py-2 transition ${
                (category ?? "") === c.slug ? "bg-ink text-white" : "bg-mist hover:bg-stone-200"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
        <SortSelect category={category} value={sortKey} />
      </div>

      <p className="mt-8 text-sm text-muted">
        {products?.length ?? 0} {products?.length === 1 ? "product" : "products"}
      </p>
      {products?.length ? (
        <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      ) : (
        <p className="mt-16 text-center text-muted">No products found in this category yet.</p>
      )}
    </div>
  );
}
