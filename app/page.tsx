import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product-card";
import { BadgeCheckIcon, BoxIcon, HeadsetIcon, LockIcon, TruckIcon } from "@/components/icons";
import type { Product } from "@/lib/format";
import { categoryImage } from "@/lib/images";
import { VirtualTrainingTile } from "@/components/virtual-training-tile";

const perks = [
  { icon: <TruckIcon />, title: "Fast US shipping", text: "Orders are packed and sent quickly." },
  { icon: <BadgeCheckIcon />, title: "Official materials", text: "Directly from S.K.I.F. headquarters." },
  { icon: <BoxIcon />, title: "Track your orders", text: "Log in any time to see your order history." },
  { icon: <HeadsetIcon />, title: "24/7 support", text: "Questions? We are happy to help." },
];

export default async function Home() {
  const supabase = await createClient();
  const [{ data: categories }, { data: products }, { data: upcoming }] = await Promise.all([
    supabase.from("categories").select("slug, name").order("sort_order"),
    supabase
      .from("products")
      .select("*, categories(slug, name)")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(8)
      .overrideTypes<Product[]>(),
    // The next live online event (if any). Ignored gracefully if events are not set up.
    supabase
      .from("products")
      .select("*, categories(slug, name)")
      .eq("kind", "virtual")
      .eq("active", true)
      .gt("event_start", new Date().toISOString())
      .order("event_start", { ascending: true })
      .limit(1)
      .overrideTypes<Product[]>(),
  ]);

  const bySlug = (s: string) => categories?.find((c) => c.slug === s);
  const members = bySlug("members");
  const dvds = bySlug("dvds");
  const books = bySlug("books");
  const accessories = bySlug("accessories");
  const seminars = bySlug("seminars");

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[68%]" aria-hidden>
          <Image src="/skif_shop_banner.webp" alt="" fill priority sizes="(min-width:1024px) 68vw, 100vw" className="object-cover object-[70%_50%] brightness-125 contrast-105" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/55 via-35% to-transparent max-lg:from-ink/80 max-lg:via-ink/50" />
        </div>
        <div className="relative mx-auto max-w-7xl px-5 py-20 sm:py-24 lg:py-28">
          <p className="eyebrow !text-white">Shotokan Karate-Do International Federation USA</p>
          <h1 className="display mt-5 max-w-3xl text-6xl drop-shadow-lg sm:text-7xl lg:text-8xl">
            Official <span className="text-crimson">Online</span> Shop
          </h1>
          <p className="mt-6 max-w-lg text-lg text-white/90 drop-shadow">
            Instructional DVDs, books by H. Kanazawa and club accessories, shipped across the USA.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/products" className="btn btn-primary !px-8 !py-4">Shop all products</Link>
            <Link href="/about" className="btn btn-ghost !px-8 !py-4">About S.K.I.F.</Link>
          </div>

          {/* One large frosted-glass box */}
          <ul className="mt-16 grid rounded-3xl border border-white/25 bg-white/10 shadow-2xl shadow-black/30 backdrop-blur-xl sm:grid-cols-2 lg:mt-24 lg:grid-cols-4 lg:divide-x lg:divide-white/15">
            {perks.map((p) => (
              <li key={p.title} className="flex items-start gap-4 p-6">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-crimson text-white shadow-md">{p.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{p.title}</p>
                  <p className="mt-1 text-sm leading-snug text-white/75">{p.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-5 pt-20">
        <p className="eyebrow">Browse</p>
        <h2 className="display mt-2 text-4xl sm:text-5xl">Shop by category</h2>
        <div className="mt-8 grid gap-4 lg:h-[640px] lg:grid-cols-4 lg:grid-rows-2">
          {members && (
            <Link
              href="/products?category=members"
              className="group relative flex h-[460px] flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-crimson to-crimson-dark p-8 text-white sm:p-10 lg:col-span-2 lg:row-span-2 lg:h-auto"
            >
              <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-crimson">
                <LockIcon /> Approved members only
              </p>
              <h3 className="display mt-4 text-5xl sm:text-6xl">{members.name}</h3>
              <p className="mt-3 max-w-[16rem] text-white/85">Membership, passports and everything for registered S.K.I.F. members.</p>
              <span className="mt-5 inline-flex w-fit items-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink transition group-hover:bg-ink group-hover:text-white">Explore →</span>
              <Image src={categoryImage.members} alt="" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-contain object-bottom-right p-4 pl-32 pt-24 transition duration-500 group-hover:scale-[1.03] sm:pl-48" />
            </Link>
          )}
          {[
            { c: dvds, span: "lg:col-span-2", tone: "bg-ink text-white", sub: "text-stone-400", img: "object-right p-5 pl-[45%]" },
            { c: books, span: "", tone: "bg-mist text-ink", sub: "text-muted", img: "object-bottom p-5 pt-24" },
            { c: accessories, span: "", tone: "bg-stone-200 text-ink", sub: "text-stone-600", img: "object-bottom p-5 pt-24" },
          ].map(({ c, span, tone, sub, img }) =>
            c ? (
              <Link
                key={c.slug}
                href={`/products?category=${c.slug}`}
                className={`group relative flex h-64 flex-col overflow-hidden rounded-3xl p-7 lg:h-auto ${span} ${tone}`}
              >
                <h3 className="display relative z-10 text-4xl">{c.name}</h3>
                <span className={`relative z-10 mt-1 text-sm transition group-hover:text-crimson ${sub}`}>Explore →</span>
                <Image src={categoryImage[c.slug]} alt="" fill sizes="(min-width:1024px) 40vw, 100vw" className={`object-contain transition duration-500 group-hover:scale-105 ${img}`} />
              </Link>
            ) : null,
          )}
        </div>

        {/* Virtual training: its own section under the other categories */}
        {seminars && <VirtualTrainingTile event={upcoming?.[0] ?? null} name={seminars.name} />}
      </section>

      {/* Latest */}
      <section className="mx-auto max-w-7xl px-5 pt-24">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">New &amp; popular</p>
            <h2 className="display mt-2 text-4xl sm:text-5xl">Latest products</h2>
          </div>
          <Link href="/products" className="hidden text-sm font-semibold underline-offset-4 hover:underline sm:block">
            View all →
          </Link>
        </div>
        {products?.length ? (
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {products.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        ) : (
          <p className="mt-8 text-muted">No products yet.</p>
        )}
      </section>
    </>
  );
}
