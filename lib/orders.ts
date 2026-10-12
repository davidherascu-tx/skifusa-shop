import { and, eq, sql } from "drizzle-orm";
import { getDb, order_items, orders, products } from "@/lib/db";

type Db = ReturnType<typeof getDb>;

/** Total quantity per product in an order. */
async function quantities(db: Db, orderId: string) {
  const items = await db.select({ product_id: order_items.product_id, quantity: order_items.quantity }).from(order_items).where(eq(order_items.order_id, orderId));
  const perProduct = new Map<string, number>();
  for (const i of items) if (i.product_id) perProduct.set(i.product_id, (perProduct.get(i.product_id) ?? 0) + i.quantity);
  return perProduct;
}

/**
 * Marks an order paid and takes the quantities out of stock.
 * Safe to call twice: only the call that flips "pending" -> "paid" touches stock.
 */
export async function markOrderPaid(orderId: string, paymentRef: string) {
  const db = getDb();
  const flipped = await db
    .update(orders)
    .set({ status: "paid", payment_ref: paymentRef })
    .where(and(eq(orders.id, orderId), eq(orders.status, "pending")))
    .returning({ id: orders.id });
  if (!flipped.length) return false; // already processed

  for (const [productId, qty] of await quantities(db, orderId)) {
    // Atomic in the database, so two orders paid at once cannot overwrite each other.
    await db.update(products).set({ stock: sql`greatest(${products.stock} - ${qty}, 0)` }).where(eq(products.id, productId));
  }
  return true;
}

/** Puts an order's quantities back into stock (used when a PAID order is cancelled or refunded). */
export async function restockOrder(orderId: string) {
  const db = getDb();
  for (const [productId, qty] of await quantities(db, orderId)) {
    await db.update(products).set({ stock: sql`${products.stock} + ${qty}` }).where(eq(products.id, productId));
  }
}
