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
        © {new Date().getFullYear()} S.K.I.F.-USA. All rights reserved.
      </div>
    </footer>
  );
}
