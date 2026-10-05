"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "./cart-provider";

const nav = [
  ["/products", "Shop"],
  ["/products?category=dvds", "DVDs"],
  ["/products?category=books", "Books"],
  ["/products?category=accessories", "Accessories"],
  ["/about", "About"],
  ["/contact", "Contact"],
] as const;

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span className={`shrink-0 overflow-hidden rounded-full ${light ? "bg-white" : ""}`}>
        <Image src="/skif_shop_logo.webp" alt="" width={56} height={56} className="h-12 w-12 object-contain sm:h-14 sm:w-14" priority />
      </span>
      <span className="flex flex-col leading-tight">
        <span className={`text-[10px] font-semibold uppercase tracking-wider sm:text-xs ${light ? "text-stone-300" : "text-stone-600"}`}>
          Shotokan Karate-Do International Federation USA
        </span>
        <span className="display text-xl text-crimson sm:text-2xl">Official Online Shop</span>
      </span>
    </span>
  );
}

export function Header({ signedIn }: { signedIn: boolean }) {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="bg-ink px-4 py-2 text-center text-xs tracking-wide text-white">
        Official S.K.I.F. merchandise · Fast shipping across the USA
      </div>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-5">
        <Link href="/" aria-label="S.K.I.F.-USA Shop home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium xl:flex">
          {nav.map(([href, label]) => (
            <Link key={href} href={href} className="text-stone-600 transition hover:text-ink">
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 text-sm font-medium">
          <Link href={signedIn ? "/account" : "/login"} className="hidden rounded-full px-4 py-2 hover:bg-mist sm:block">
            {signedIn ? "My account" : "Log in"}
          </Link>
          <Link href="/cart" className="btn btn-dark !px-5 !py-2.5">
            Cart
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-crimson px-1 text-[11px]">{count}</span>
          </Link>
          <button
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-mist xl:hidden"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <span className="text-xl leading-none">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-line bg-white px-5 py-3 xl:hidden">
          {[...nav, [signedIn ? "/account" : "/login", signedIn ? "My account" : "Log in"] as const].map(([href, label]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className="block py-3 text-base font-medium">
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
