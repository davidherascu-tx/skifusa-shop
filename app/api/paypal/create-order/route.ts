import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { createPayPalOrder, paypalConfigured } from "@/lib/paypal";

export async function POST(request: Request) {
  if (!paypalConfigured()) return NextResponse.json({ error: "PayPal is not configured yet" }, { status: 503 });

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Please log in" }, { status: 401 });

  const body = z.object({ orderId: z.uuid() }).safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid order" }, { status: 400 });

  // RLS: a customer can only read their own orders.
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, total_cents")
    .eq("id", body.data.orderId)
    .maybeSingle();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status !== "pending") return NextResponse.json({ error: "This order is already paid or closed" }, { status: 409 });
  if (order.total_cents <= 0) return NextResponse.json({ error: "Nothing to pay" }, { status: 400 });

  try {
    const paypalOrderId = await createPayPalOrder(order.id, order.total_cents);
    await createAdminClient().from("orders").update({ payment_ref: paypalOrderId }).eq("id", order.id);
    return NextResponse.json({ id: paypalOrderId });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "PayPal error" }, { status: 502 });
  }
}
