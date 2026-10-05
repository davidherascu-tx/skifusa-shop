"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { itemKey, useCart } from "@/components/cart-provider";
import { money, shippingFor, taxFor, SALES_TAX_LABEL } from "@/lib/format";
import { AddressFields } from "@/components/address-fields";
import type { Address } from "@/lib/address";

export function CartView({ defaults }: { defaults: Partial<Address> | null }) {
  const { items, total, setQty, clear } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  // Online events need no shipping address; any physical item does.
  const needsShipping = items.some((i) => !i.virtual);
  const shippingCost = shippingFor(needsShipping);
  const tax = taxFor(total + shippingCost);

  async function placeOrder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    setNeedsLogin(false);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, qty: i.qty, size: i.size })),
          ...(needsShipping ? { shipping: Object.fromEntries(f.entries()) } : {}),
        }),
      });
      const json = await res.json();
      if (res.status === 401) setNeedsLogin(true);
      if (!res.ok) throw new Error(json.error ?? "Could not place order");
      clear(); // the order is saved; the customer pays on the next page
      window.location.href = `/pay/${json.orderId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place order");
      setBusy(false);
    }
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-32 text-center">
        <p className="display text-6xl text-stone-300">Empty</p>
        <h1 className="mt-4 text-2xl font-semibold">Your cart is empty</h1>
        <Link href="/products" className="btn btn-primary mt-8">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-14">
      <h1 className="display text-5xl">Your cart</h1>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_420px]">
        <ul className="divide-y divide-line border-y border-line">
          {items.map((i) => (
            <li key={itemKey(i)} className="flex gap-5 py-6">
              <Link href={`/products/${i.slug}`} className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-mist">
                {i.image_url ? (
                  <Image src={i.image_url} alt={i.name} fill sizes="96px" className="object-cover" />
                ) : (
                  <span className="display grid h-full place-items-center text-3xl text-stone-300">空手</span>
                )}
              </Link>
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex justify-between gap-4">
                  <div>
                    <Link href={`/products/${i.slug}`} className="font-medium hover:text-crimson">{i.name}</Link>
                    {i.size && <p className="mt-1 text-sm text-muted">Size: {i.size}</p>}
                    {i.virtual && <p className="mt-1 text-sm text-muted">Live online event · 1 seat</p>}
                  </div>
                  <p className="font-semibold">{money(i.price_cents * i.qty)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-line text-sm">
                    <button aria-label="Decrease" onClick={() => setQty(itemKey(i), i.qty - 1)} className="h-9 w-9 hover:text-crimson">−</button>
                    <span className="w-6 text-center font-semibold">{i.qty}</span>
                    <button aria-label="Increase" disabled={i.virtual} onClick={() => setQty(itemKey(i), i.qty + 1)} className="h-9 w-9 hover:text-crimson disabled:cursor-not-allowed disabled:opacity-30">+</button>
                  </div>
                  <button onClick={() => setQty(itemKey(i), 0)} className="text-sm text-muted underline-offset-4 hover:text-crimson hover:underline">Remove</button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <form onSubmit={placeOrder} className="h-fit space-y-3 rounded-3xl bg-mist p-7">
          {needsShipping ? (
            <>
              <h2 className="display text-3xl">Shipping details</h2>
              <AddressFields defaults={defaults} />
            </>
          ) : (
            <>
              <h2 className="display text-3xl">Online event</h2>
              <p className="text-sm leading-relaxed text-stone-600">
                No shipping address is needed. After payment, your Zoom access details appear under <strong>My account</strong> and are emailed to you shortly before the event.
              </p>
            </>
          )}

          <div className="space-y-2 border-t border-line pt-5">
            <div className="flex items-center justify-between text-sm text-stone-600">
              <span>Subtotal</span>
              <span>{money(total)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-stone-600">
              <span>Shipping</span>
              <span>{needsShipping ? money(shippingCost) : "Free"}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-stone-600">
              <span>{SALES_TAX_LABEL}</span>
              <span>{money(tax)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 text-lg font-semibold">
              <span>Total</span>
              <span>{money(total + shippingCost + tax)}</span>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted">
            Next step: pay securely with PayPal. Your order is saved to your account, so you can also pay later.
          </p>
          <p className="text-xs leading-relaxed text-muted">
            By continuing you agree to our{" "}
            <Link href="/refund-policy" className="underline">Refund &amp; Returns Policy</Link> and{" "}
            <Link href="/privacy" className="underline">Privacy Policy</Link>.
          </p>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}{" "}
              {needsLogin && <Link href="/login?next=/cart" className="font-semibold underline">Log in</Link>}
            </p>
          )}
          <button disabled={busy} className="btn btn-primary w-full !py-4">
            {busy ? "Placing order…" : "Continue to payment"}
          </button>
        </form>
      </div>
    </div>
  );
}
