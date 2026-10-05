export const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

/** Flat shipping fee, charged once per order that contains at least one physical item. Virtual-only orders ship free. */
export const SHIPPING_FLAT_CENTS = 1000;
export const shippingFor = (hasPhysical: boolean) => (hasPhysical ? SHIPPING_FLAT_CENTS : 0);
/** Shipping already included in an order's total (total minus the line items). */
export const shippingOf = (o: { total_cents: number; order_items: { unit_price_cents: number; quantity: number }[] }) =>
  Math.max(0, o.total_cents - o.order_items.reduce((n, i) => n + i.unit_price_cents * i.quantity, 0));

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  sale_price_cents: number | null;
  image_url: string | null;
  /** Gallery (front, back, ...). Optional until migration 0003 is applied. */
  images?: string[] | null;
  sizes?: string[] | null;
  /** 'virtual' = live online event (no shipping). Optional until migration 0006 is applied. */
  kind?: string | null;
  event_start?: string | null;
  event_minutes?: number | null;
  stock: number;
  members_only: boolean;
  categories: { slug: string; name: string } | null;
};

export const effectivePrice = (p: Pick<Product, "price_cents" | "sale_price_cents">) =>
  p.sale_price_cents ?? p.price_cents;

/** Everything in the S.K.I.F. Members category (or flagged members_only) is for members only. */
export const isMembersOnly = (p: Pick<Product, "members_only" | "categories">) =>
  p.members_only || p.categories?.slug === "members";
