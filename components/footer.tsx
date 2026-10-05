import Link from "next/link";
import { Logo } from "./header";

const cols = [
  {
    title: "Shop",
    links: [
      ["/products", "All products"],
      ["/products?category=dvds", "DVDs"],
      ["/products?category=books", "Books"],
      ["/products?category=accessories", "Accessories"],
      ["/products?category=seminars", "Virtual training"],
    ],
  },
  {
    title: "Support",
    links: [
      ["/contact", "Contact us"],
      ["/refund-policy", "Refund & returns"],
      ["/privacy", "Privacy policy"],
    ],
  },
  {
    title: "Account",
    links: [
      ["/login", "Log in"],
      ["/signup", "Create account"],
      ["/account", "My orders"],
    ],
  },
];

const socials = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/groups/skifusa",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: "X",
    href: "https://x.com/skif_usa",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/skif_usa",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

export function Footer() {
  return (
    <footer className="mt-24 bg-ink text-stone-400">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div>
          <Logo light />
          <p className="mt-5 max-w-xs text-sm leading-relaxed">
            Shotokan Karate-Do International Federation USA. The official source for instructional DVDs, books and
            accessories.
          </p>
          <ul className="mt-6 flex gap-3">
            {socials.map((x) => (
              <li key={x.label}>
                <a
                  href={x.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`S.K.I.F.-USA on ${x.label}`}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-stone-300 transition hover:border-white hover:bg-white hover:text-ink"
                >
                  {x.icon}
                </a>
              </li>
            ))}
          </ul>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white">{c.title}</p>
            <ul className="mt-5 space-y-3 text-sm">
              {c.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="transition hover:text-white">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 px-5 py-6 text-center text-xs">
        <p>Secure checkout with PayPal</p>
        <p className="mt-2">© {new Date().getFullYear()} S.K.I.F.-USA. All rights reserved.</p>
      </div>
    </footer>
  );
}
