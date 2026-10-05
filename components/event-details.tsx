import { eventDateLabel, eventTimesByZone, registrationClosed, type EventFields } from "@/lib/event";

/** Date, times in every US time zone, length and seats for a live online event. */
export function EventDetails({ product, stock }: { product: EventFields; stock: number }) {
  if (!product.event_start) return null;
  const closed = registrationClosed(product);
  const times = eventTimesByZone(product.event_start, product.event_minutes);
  const minutes = product.event_minutes ?? 60;

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-line" aria-label="Event details">
      <div className="flex items-center justify-between gap-3 bg-ink px-5 py-3 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.2em]">Live online · Zoom</p>
        {closed ? (
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">Registration closed</span>
        ) : stock <= 0 ? (
          <span className="rounded-full bg-crimson px-3 py-1 text-xs font-semibold">Fully booked</span>
        ) : (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${stock <= 10 ? "bg-amber-400 text-ink" : "bg-white/15"}`}>
            {stock <= 10 ? `Only ${stock} spots left` : `${stock} spots available`}
          </span>
        )}
      </div>
      <div className="p-5">
        <p className="display text-3xl">{eventDateLabel(product.event_start)}</p>
        <p className="mt-1 text-sm text-muted">{minutes >= 60 && minutes % 60 === 0 ? `${minutes / 60}-hour` : `${minutes}-minute`} live session</p>
        <dl className="mt-4 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          {times.map((t) => (
            <div key={t.label} className="flex justify-between gap-3 border-b border-line py-1.5">
              <dt className="text-muted">{t.label}</dt>
              <dd className="font-medium">{t.text}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm text-stone-600">
          After payment, your Zoom access details appear under <strong>My account</strong> and are emailed 6–12 hours before the event.
        </p>
      </div>
    </section>
  );
}
