// Helpers for live online events (virtual products).

export const ZONES = [
  ["Eastern", "America/New_York"],
  ["Central", "America/Chicago"],
  ["Mountain", "America/Denver"],
  ["Pacific", "America/Los_Angeles"],
  ["Hawaii", "Pacific/Honolulu"],
] as const;

/** The shop owner's time zone: dates typed in the admin are read in this zone. */
export const ADMIN_TZ = "America/Chicago";

export type EventFields = { kind?: string | null; event_start?: string | null; event_minutes?: number | null };

export const isVirtual = (p: EventFields) => p.kind === "virtual";

export const eventEnd = (start: string, minutes: number | null | undefined) =>
  new Date(new Date(start).getTime() + (minutes ?? 60) * 60_000);

/** Registration is open until the event starts. */
export const registrationClosed = (p: EventFields, now = new Date()) =>
  isVirtual(p) && !!p.event_start && new Date(p.event_start) <= now;

/** "Saturday, December 5, 2026" (shown in Eastern time, the first zone). */
export const eventDateLabel = (start: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: ZONES[0][1], weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(new Date(start));

/** One line per US time zone: "6:30 – 7:30 PM EST". */
export function eventTimesByZone(start: string, minutes: number | null | undefined) {
  const s = new Date(start);
  const e = eventEnd(start, minutes);
  return ZONES.map(([label, tz]) => {
    const t = (d: Date, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", { timeZone: tz, ...opts }).format(d);
    const abbr = t(s, { timeZoneName: "short" }).split(" ").pop();
    return { label, text: `${t(s, { hour: "numeric", minute: "2-digit" }).replace(/ ?[AP]M$/, "")} – ${t(e, { hour: "numeric", minute: "2-digit" })} ${abbr}` };
  });
}

/** Join details become visible to paid attendees this long before the start (and until 3 h after the end). */
export const REVEAL_HOURS_BEFORE = 12;
export const joinWindowOpen = (start: string, minutes: number | null | undefined, now = new Date()) =>
  now.getTime() >= new Date(start).getTime() - REVEAL_HOURS_BEFORE * 3_600_000 &&
  now.getTime() <= eventEnd(start, minutes).getTime() + 3 * 3_600_000;

// ---- admin: <input type="datetime-local"> <-> UTC, in ADMIN_TZ ----
const parts = (ms: number, tz: string) => {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date(ms));
  const g = (t: string) => Number(p.find((x) => x.type === t)!.value);
  return { y: g("year"), mo: g("month"), d: g("day"), h: g("hour"), mi: g("minute"), s: g("second") };
};

/** "2026-12-05T17:30" typed in `tz` -> the real UTC instant. */
export function zonedToUtc(local: string, tz: string = ADMIN_TZ): Date | null {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);
  const offset = (ms: number) => {
    const p = parts(ms, tz);
    return Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s) - ms;
  };
  let guess = asUtc - offset(asUtc);
  guess = asUtc - offset(guess); // second pass handles daylight-saving edges
  return new Date(guess);
}

/** UTC ISO -> "2026-12-05T17:30" in `tz` (for the datetime-local input). */
export function utcToLocalInput(iso: string, tz: string = ADMIN_TZ) {
  const p = parts(new Date(iso).getTime(), tz);
  const z = (n: number) => String(n).padStart(2, "0");
  return `${p.y}-${z(p.mo)}-${z(p.d)}T${z(p.h)}:${z(p.mi)}`;
}

/** "Add to Google Calendar" link. */
export function googleCalendarUrl(name: string, start: string, minutes: number | null | undefined) {
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: name,
    dates: `${f(new Date(start))}/${f(eventEnd(start, minutes))}`,
    details: "Online via Zoom. Access details: https://skifusa-shop.com/account",
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}
