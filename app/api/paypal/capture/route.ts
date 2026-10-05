import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { capturePayPalOrder, paypalConfigured, usd } from "@/lib/paypal";
import { markOrderPaid } from "@/lib/orders";
import { notifyOrderPaid } from "@/lib/notify";

export async function POST(request: Request) {
  if (!paypalConfigured()) return NextResponse.json({ error: "PayPal is not configured yet" }, { status: 503 });

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Please log in" }, { status: 401 });

  const body = z.object({ paypalOrderId: z.string().min(5).max(64) }).safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid payment" }, { status: 400 });

  // The PayPal order must belong to one of THIS customer's shop orders.
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, status, total_cents")
    .eq("payment_ref", body.data.paypalOrderId)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status === "paid") return NextResponse.json({ ok: true, orderId: order.id }); // already done

  const result = await capturePayPalOrder(body.data.paypalOrderId);
  if (!result.ok) {
    const msg = result.code === "INSTRUMENT_DECLINED" ? "Your payment method was declined. Please try another one." : "The payment could not be completed.";
    return NextResponse.json({ error: msg, code: result.code }, { status: 402 });
  }

  // Trust but verify: completed, right amount, right currency.
  const c = result.capture;
  if (result.status !== "COMPLETED" || c?.status !== "COMPLETED" || c.amount?.value !== usd(order.total_cents) || c.amount?.currency_code !== "USD") {
    return NextResponse.json({ error: "Payment is pending or did not match the order. We will contact you." }, { status: 409 });
  }

  const justPaid = await markOrderPaid(admin, order.id, body.data.paypalOrderId);
  if (justPaid) await notifyOrderPaid(order.id); // only the call that actually flipped the order sends the receipt
  return NextResponse.json({ ok: true, orderId: order.id });
}
