import Image from "next/image";
import Link from "next/link";
import { LockIcon } from "@/components/icons";
import { eventDateLabel, eventTimesByZone } from "@/lib/event";
import { effectivePrice, money, type Product } from "@/lib/format";

/** Home page section for virtual training: the Zoom banner, the intro copy, and the next upcoming event. */
export function VirtualTrainingTile({ event }: { event: Product | null; name?: string }) {
  const times = event?.event_start ? eventTimesByZone(event.event_start, event.event_minutes) : [];
  const left = event?.stock ?? 0;

  return (
    <div className="relative mt-4 overflow-hidden rounded-3xl bg-ink text-white">
      <Image src="/zoom_class_banner.webp" alt="" fill sizes="(min-width:1280px) 1216px, 100vw" className="object-cover object-center" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40 md:via-ink/70 md:to-ink/10" aria-hidden />

      <div className="relative grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-[1.15fr_1fr] lg:p-12">
        {/* Intro copy */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-crimson">Virtual Training</p>
          <h3 className="display mt-3 text-5xl sm:text-6xl">SKIF Online: Interactive Zoom Classes</h3>
          <p className="mt-4 max-w-xl text-lg text-white/90">
            Expert Shotokan instruction, straight to your screen. Join our nationwide community for live virtual training
            led directly by instructors from SKIF Headquarters.
          </p>
          <p className="mt-4 inline-flex items-start gap-2 rounded-2xl bg-white/10 p-3 text-sm text-white/90 backdrop-blur-sm">
            <span className="mt-0.5 text-crimson"><LockIcon /></span>
            <span>These exclusive sessions are reserved for registered SKIF Members only.</span>
          </p>
          {!event && <p className="mt-4 text-white/80">We are currently finalizing our digital schedule.</p>}
          <div className="mt-6">
            <Link href="/products?category=seminars" className="btn btn-ghost !px-8 !py-3.5">All virtual training</Link>
          </div>
        </div>

        {/* Next event */}
        {event && (
          <div className="rounded-2xl border border-line bg-white p-4 text-ink shadow-2xl shadow-black/30 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Next live session</p>
            <div className="mt-3 flex gap-4">
              {event.image_url && (
                <Link href={`/products/${event.slug}`} className="relative hidden aspect-[4/5] w-28 shrink-0 overflow-hidden rounded-xl ring-1 ring-black/10 sm:block" aria-label={event.name}>
                  <Image src={event.image_url} alt="" fill sizes="112px" className="object-cover" />
                </Link>
              )}
              <div className="min-w-0">
                <p className="font-semibold leading-snug">{event.name}</p>
                <p className="mt-2 text-sm text-stone-700">{eventDateLabel(event.event_start!)}</p>
                <p className="text-sm text-stone-700">{times[0]?.text}</p>
                <p className="text-sm text-stone-700">{times[1]?.text}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-mist px-3 py-1.5">{money(effectivePrice(event))}</span>
                  {left > 0 ? (
                    <span className={`rounded-full px-3 py-1.5 ${left <= 10 ? "bg-amber-400 text-ink" : "bg-mist"}`}>
                      {left <= 10 ? `Only ${left} spots left` : `${left} spots available`}
                    </span>
                  ) : (
                    <span className="rounded-full bg-crimson px-3 py-1.5">Fully booked</span>
                  )}
                </div>
              </div>
            </div>
            <Link href={`/products/${event.slug}`} className="btn btn-primary mt-5 w-full !py-3.5">View &amp; register</Link>
          </div>
        )}
      </div>
    </div>
  );
}
