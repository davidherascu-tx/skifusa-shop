"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin", label: "Overview", badge: null },
  { href: "/admin/orders", label: "Orders", badge: "orders" },
  { href: "/admin/events", label: "Events", badge: null },
  { href: "/admin/members", label: "Member requests", badge: "members" },
  { href: "/admin/messages", label: "Messages", badge: "messages" },
  { href: "/admin/stock", label: "Stock & prices", badge: null },
] as const;

export function AdminNav({ counts }: { counts: { orders: number; members: number; messages: number } }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-2 overflow-x-auto border-b border-line pb-4 text-sm font-medium" aria-label="Admin">
      {tabs.map((t) => {
        const active = t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href);
        const n = t.badge ? counts[t.badge] : 0;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 transition ${active ? "bg-ink text-white" : "bg-mist hover:bg-stone-200"}`}
          >
            {t.label}
            {n > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-crimson px-1.5 text-[11px] text-white">{n}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
