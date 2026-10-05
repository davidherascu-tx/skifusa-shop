import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Marks an order paid and takes the quantities out of stock.
 * Safe to call twice: only the call that flips "pending" -> "paid" touches stock.
 * Pass the service-role client.
 */
export async function markOrderPaid(admin: SupabaseClient, orderId: string, paymentRef: string) {
  const { data: flipped } = await admin
    .from("orders")
    .update({ status: "paid", payment_ref: paymentRef })
    .eq("id", orderId)
    .eq("status", "pending")
    .select("id");
  if (!flipped?.length) return false; // already processed

  const { data: items } = await admin.from("order_items").select("product_id, quantity").eq("order_id", orderId);
  const perProduct = new Map<string, number>();
  for (const i of items ?? []) {
    if (i.product_id) perProduct.set(i.product_id, (perProduct.get(i.product_id) ?? 0) + i.quantity);
  }

  for (const [productId, qty] of perProduct) {
    // Optimistic update: only write if nobody changed the stock in between; retry a few times.
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: p } = await admin.from("products").select("stock").eq("id", productId).single();
      if (!p) break;
      const { data: ok } = await admin
        .from("products")
        .update({ stock: Math.max(p.stock - qty, 0) })
        .eq("id", productId)
        .eq("stock", p.stock)
        .select("id");
      if (ok?.length) break;
    }
  }
  return true;
}

/**
 * Puts an order's quantities back into stock (used when a PAID order is cancelled or refunded).
 * Pass the service-role client.
 */
export async function restockOrder(admin: SupabaseClient, orderId: string) {
  const { data: items } = await admin.from("order_items").select("product_id, quantity").eq("order_id", orderId);
  const perProduct = new Map<string, number>();
  for (const i of items ?? []) {
    if (i.product_id) perProduct.set(i.product_id, (perProduct.get(i.product_id) ?? 0) + i.quantity);
  }
  for (const [productId, qty] of perProduct) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: p } = await admin.from("products").select("stock").eq("id", productId).single();
      if (!p) break;
      const { data: ok } = await admin.from("products").update({ stock: p.stock + qty }).eq("id", productId).eq("stock", p.stock).select("id");
      if (ok?.length) break;
    }
  }
}
