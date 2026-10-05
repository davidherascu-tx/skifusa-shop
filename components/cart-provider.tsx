"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  image_url: string | null;
  size?: string;
  /** live online event: no shipping address, one seat per order */
  virtual?: boolean;
  qty: number;
};

/** The same product in two sizes is two cart lines. */
export const itemKey = (i: Pick<CartItem, "id" | "size">) => (i.size ? `${i.id}|${i.size}` : i.id);

type Ctx = {
  items: CartItem[];
  count: number;
  total: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<Ctx | null>(null);
const KEY = "skif-cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, loaded]);

  const value = useMemo<Ctx>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      total: items.reduce((n, i) => n + i.qty * i.price_cents, 0),
      add: (item, qty = 1) =>
        setItems((cur) =>
          cur.some((i) => itemKey(i) === itemKey(item))
            ? cur.map((i) => (itemKey(i) === itemKey(item) ? { ...i, qty: item.virtual ? 1 : Math.min(i.qty + qty, 99) } : i))
            : [...cur, { ...item, qty }],
        ),
      setQty: (key, qty) =>
        setItems((cur) =>
          qty <= 0
            ? cur.filter((i) => itemKey(i) !== key)
            : cur.map((i) => (itemKey(i) === key ? { ...i, qty: Math.min(qty, 99) } : i)),
        ),
      clear: () => setItems([]),
    }),
    [items],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
