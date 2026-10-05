"use client";

import { useState } from "react";
import { useCart } from "./cart-provider";
import { effectivePrice, type Product } from "@/lib/format";
import { isVirtual, registrationClosed } from "@/lib/event";
import { productImage } from "@/lib/images";

export function AddToCart({ product, locked = false }: { product: Product; locked?: boolean }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState<string | null>(null);
  const [needSize, setNeedSize] = useState(false);
  const sizes = product.sizes ?? [];
  const virtual = isVirtual(product);
  const closed = registrationClosed(product);
  const out = product.stock <= 0 || locked || closed;

  return (
    <div>
      {sizes.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-sm font-semibold">
            Size{size && <span className="ml-2 font-normal text-muted">{size}</span>}
          </p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={size === s}
                onClick={() => {
                  setSize(s);
                  setNeedSize(false);
                }}
                className={`min-w-14 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
                  size === s ? "border-ink bg-ink text-white" : "border-line hover:border-ink"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {needSize && <p role="alert" className="mt-3 text-sm text-crimson">Please choose a size.</p>}
        </div>
      )}

      <div className="flex items-center gap-3">
        {!virtual && (
        <div className="flex items-center rounded-full border border-line">
          <button type="button" aria-label="Decrease" onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-12 w-12 text-lg hover:text-crimson">−</button>
          <span className="w-8 text-center text-sm font-semibold" aria-live="polite">{qty}</span>
          <button type="button" aria-label="Increase" onClick={() => setQty((q) => Math.min(Math.max(product.stock, 1), q + 1))} className="h-12 w-12 text-lg hover:text-crimson">+</button>
        </div>
        )}
        <button
          disabled={out}
          onClick={() => {
            if (sizes.length && !size) {
              setNeedSize(true);
              return;
            }
            add(
              {
                id: product.id,
                slug: product.slug,
                name: product.name,
                price_cents: effectivePrice(product),
                image_url: productImage(product),
                ...(size ? { size } : {}),
                ...(virtual ? { virtual: true } : {}),
              },
              virtual ? 1 : qty,
            );
            setAdded(true);
            setTimeout(() => setAdded(false), 1800);
          }}
          className="btn btn-primary h-12 flex-1 sm:flex-none sm:px-12"
        >
          {locked ? "Members only" : closed ? "Registration closed" : product.stock <= 0 ? (virtual ? "Fully booked" : "Sold out") : out ? "Sold out" : added ? "Added to cart ✓" : virtual ? "Register" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}
