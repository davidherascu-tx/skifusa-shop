import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AddToCart } from "@/components/add-to-cart";
import { Description } from "@/components/description";
import { EventDetails } from "@/components/event-details";
import { isVirtual } from "@/lib/event";
import { ProductGallery } from "@/components/product-gallery";
import { isMembersOnly, money, type Product } from "@/lib/format";
import { LockIcon } from "@/components/icons";
import { productImage } from "@/lib/images";

async function getProduct(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, categories(slug, name)")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle<Product>();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  return p ? { title: p.name, description: p.description.slice(0, 160) } : {};
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getProduct((await params).slug);
  if (!p) notFound();
  const img = productImage(p);
  const gallery = p.images?.length ? p.images : img ? [img] : [];
  const membersOnly = isMembersOnly(p);
  let isMember = false;
  if (membersOnly) {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) {
      const { data: profile } = await supabase.from("profiles").select("is_member").eq("id", auth.user.id).single();
      isMember = !!profile?.is_member;
    }
  }
  const locked = membersOnly && !isMember;
  const virtual = isVirtual(p);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <nav className="mb-8 text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/products" className="hover:text-ink">Shop</Link>
        {p.categories && (
          <>
            {" / "}
            <Link href={`/products?category=${p.categories.slug}`} className="hover:text-ink">{p.categories.name}</Link>
          </>
        )}
        {" / "}
        <span className="text-ink">{p.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery images={gallery} alt={p.name} own={!!p.image_url} />

        <div className="lg:py-6">
          {p.categories && <p className="eyebrow">{p.categories.name}</p>}
          <h1 className="display mt-3 text-5xl sm:text-6xl">{p.name}</h1>
          {membersOnly && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-crimson/10 px-4 py-2 text-sm font-semibold text-crimson">
              <LockIcon /> Approved members only
            </p>
          )}

          <p className="mt-6 flex items-baseline gap-3 text-3xl font-semibold">
            {p.sale_price_cents !== null ? (
              <>
                <span className="text-crimson">{money(p.sale_price_cents)}</span>
                <span className="text-lg font-normal text-muted line-through">{money(p.price_cents)}</span>
              </>
            ) : (
              money(p.price_cents)
            )}
          </p>

          {virtual && <EventDetails product={p} stock={p.stock} />}

          <Description text={p.description} />

          {!virtual && <p className="mt-8 text-sm">
            {p.stock > 0 && p.stock <= 5 ? (
              <span className="font-semibold text-amber-600">● Only {p.stock} left in stock</span>
            ) : p.stock > 0 ? (
              <span className="text-emerald-700">● In stock · <strong>{p.stock}</strong> available</span>
            ) : (
              <span className="text-muted">● Currently sold out</span>
            )}
          </p>}
          {virtual && <div className="mt-8" />}
          <div className="mt-4">
            <AddToCart product={p} locked={locked} />
            {locked && (
              <p className="mt-3 text-sm text-muted">
                This item is available to approved S.K.I.F. members only.{" "}
                <Link href="/account#member-access" className="font-semibold text-ink underline">Log in and request member access</Link>.
              </p>
            )}
          </div>

          <ul className="mt-10 space-y-3 border-t border-line pt-8 text-sm text-stone-600">
            <li>✓ {virtual ? "Official S.K.I.F. live training" : "Official S.K.I.F. product"}</li>
            <li>{virtual ? "✓ Online via Zoom · no shipping needed" : "✓ Fast shipping across the USA"}</li>
            <li>✓ Questions? <Link href="/contact" className="underline">Contact us</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
