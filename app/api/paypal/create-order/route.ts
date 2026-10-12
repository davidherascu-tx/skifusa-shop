import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { getDb, orders } from "@/lib/db";
import { getUser } from "@/lib/session";
import { createPayPalOrder, paypalConfigured } from "@/lib/paypal";

export async function POST(request: Request) {
  if (!paypalConfigured()) return NextResponse.json({ error: "PayPal is not configured yet" }, { status: 503 });

  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Please log in" }, { status: 401 });

  const body = z.object({ orderId: z.uuid() }).safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid order" }, { status: 400 });

  // A customer can only pay for their own orders.
  const db = getDb();
  const [order] = await db
    .select({ id: orders.id, status: orders.status, total_cents: orders.total_cents })
    .from(orders)
    .where(and(eq(orders.id, body.data.orderId), eq(orders.user_id, user.id)))
    .limit(1);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status !== "pending") return NextResponse.json({ error: "This order is already paid or closed" }, { status: 409 });
  if (order.total_cents <= 0) return NextResponse.json({ error: "Nothing to pay" }, { status: 400 });

  try {
    const paypalOrderId = await createPayPalOrder(order.id, order.total_cents);
    await db.update(orders).set({ payment_ref: paypalOrderId }).where(eq(orders.id, order.id));
    return NextResponse.json({ id: paypalOrderId });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "PayPal error" }, { status: 502 });
  }
}
