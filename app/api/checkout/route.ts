import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { effectivePrice, shippingFor } from "@/lib/format";
import { addressSchema } from "@/lib/address";
import { isVirtual, registrationClosed } from "@/lib/event";
import { notifyOrderPlaced } from "@/lib/notify";

const Body = z.object({
  items: z.array(z.object({ id: z.uuid(), qty: z.number().int().min(1).max(99), size: z.string().max(40).optional() })).min(1).max(50),
  // Optional: online events need no address. The server decides below whether one is required.
  shipping: z.unknown().optional(),
});

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

/** Places an order (status "pending", no payment yet). Login required. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return fail("Please log in to place an order", 401);

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Invalid order details", 400);

  // Prices always come from the database, never from the client.
  const admin = createAdminClient();
  const { data: products, error } = await admin
    .from("products")
    .select("*")
    .in("id", parsed.data.items.map((i) => i.id));
  if (error || !products) return fail("Could not load products", 500);

  const { data: profile } = await supabase.from("profiles").select("is_member").eq("id", user.id).single();
  const isMember = !!profile?.is_member;

  const lines = [];
  for (const item of parsed.data.items) {
    const p = products.find((x) => x.id === item.id);
    if (!p || !p.active) return fail("A product is no longer available", 409);
    if (p.members_only && !isMember) return fail(`${p.name} is only available to approved S.K.I.F. members. Request member access in My account.`, 403);
    const virtual = isVirtual(p);

    if (virtual) {
      if (registrationClosed(p)) return fail(`Registration for ${p.name} is closed.`, 409);
      if (item.qty !== 1) return fail("Each member can register for one seat per order.", 400);
      // One registration per member.
      const { data: already } = await admin
        .from("order_items")
        .select("order_id, orders!inner(status, user_id)")
        .eq("product_id", p.id)
        .eq("orders.user_id", user.id)
        .in("orders.status", ["paid", "shipped"])
        .limit(1);
      if (already?.length) return fail(`You are already registered for ${p.name}. Find it under My account.`, 409);
      if (p.stock < 1) return fail(`${p.name} is fully booked.`, 409);
    }

    const sizes: string[] = p.sizes ?? [];
    if (sizes.length && (!item.size || !sizes.includes(item.size))) return fail(`Please choose a size for ${p.name}`, 400);
    if (p.stock < item.qty) return fail(`Not enough stock for ${p.name}`, 409);
    lines.push({ product: p, qty: item.qty, unit: effectivePrice(p), size: sizes.length ? item.size! : null, virtual });
  }

  // A shipping address is required only if something physical is in the order.
  let shipping: z.infer<typeof addressSchema> | null = null;
  if (lines.some((l) => !l.virtual)) {
    const addr = addressSchema.safeParse(parsed.data.shipping);
    if (!addr.success) return fail("Please fill in your shipping address", 400);
    shipping = addr.data;
  }

  const { data: order, error: orderErr } = await admin
    .from("orders")
    .insert({
      user_id: user.id,
      email: user.email,
      total_cents: lines.reduce((n, l) => n + l.unit * l.qty, 0) + shippingFor(shipping !== null),
      shipping,
    })
    .select("id")
    .single();
  if (orderErr || !order) return fail("Could not create order", 500);

  const { error: itemsErr } = await admin.from("order_items").insert(
    lines.map((l) => ({
      order_id: order.id,
      product_id: l.product.id,
      name: l.product.name,
      unit_price_cents: l.unit,
      quantity: l.qty,
      size: l.size,
    })),
  );
  if (itemsErr) {
    await admin.from("orders").delete().eq("id", order.id);
    return fail("Could not save order items", 500);
  }

  await notifyOrderPlaced(order.id);
  return NextResponse.json({ orderId: order.id });
}
