import Image from "next/image";
import Link from "next/link";
import { isMembersOnly, money, type Product } from "@/lib/format";
import { productImage } from "@/lib/images";
import { LockIcon } from "./icons";
import { eventDateLabel, isVirtual, registrationClosed } from "@/lib/event";

export function ProductCard({ p }: { p: Product }) {
  const out = p.stock <= 0;
  const img = productImage(p);
  const own = !!p.image_url;
  const sale = p.sale_price_cents !== null;
  const virtual = isVirtual(p);
  const closed = registrationClosed(p);
  const back = p.images && p.images.length > 1 ? p.images[1] : null;

  return (
    <Link href={`/products/${p.slug}`} className="group flex flex-col">
      {/* Image: a blurred copy fills the frame, the real photo sits on top uncropped */}
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-mist">
        {img ? (
          <>
            {own && (
              <Image src={img} alt="" fill sizes="25vw" aria-hidden className="scale-125 object-cover opacity-60 blur-2xl" />
            )}
            <Image
              src={img}
              alt={p.name}
              fill
              sizes="(min-width:1024px) 25vw, 50vw"
              className={`transition duration-500 group-hover:scale-105 ${own ? "object-contain p-5 drop-shadow-xl" : "object-contain p-6"}`}
            />
            {back && (
              <Image
                src={back}
                alt=""
                fill
                sizes="(min-width:1024px) 25vw, 50vw"
                aria-hidden
                className="bg-white object-contain p-5 opacity-0 transition duration-300 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-stone-300">
            <span className="display text-7xl">空手</span>
            <span className="text-[11px] uppercase tracking-widest">Image coming soon</span>
          </div>
        )}
        {(sale || out || virtual) && (
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {virtual && <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-crimson shadow">Live online</span>}
            {sale && <span className="rounded-full bg-crimson px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">Sale</span>}
            {out && <span className="rounded-full bg-ink px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">{virtual ? "Fully booked" : "Sold out"}</span>}
            {closed && !out && <span className="rounded-full bg-ink px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">Closed</span>}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="mt-4 flex flex-1 flex-col">
        {p.categories && <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted">{p.categories.name}</p>}
        <h3 className="mt-1 font-semibold leading-snug transition group-hover:text-crimson">{p.name}</h3>
        <p className="mt-2 flex items-baseline gap-2">
          {sale ? (
            <>
              <span className="text-lg font-bold text-crimson">{money(p.sale_price_cents!)}</span>
              <span className="text-sm text-muted line-through">{money(p.price_cents)}</span>
            </>
          ) : (
            <span className="text-lg font-bold">{money(p.price_cents)}</span>
          )}
        </p>
        {virtual && p.event_start && (
          <p className="mt-2 text-sm text-stone-600">{eventDateLabel(p.event_start)}</p>
        )}
        {p.stock > 0 && p.stock <= (virtual ? 10 : 5) && (
          <p className="mt-2 text-xs font-semibold text-amber-600">Only {p.stock} {virtual ? "spots " : ""}left</p>
        )}
        {isMembersOnly(p) && (
          <p className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-crimson/10 px-3 py-1 text-xs font-semibold text-crimson">
            <LockIcon /> Approved members only
          </p>
        )}
      </div>
    </Link>
  );
}
