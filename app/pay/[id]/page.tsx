import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PayPalButtons } from "@/components/paypal-buttons";
import { isSandbox, paypalConfigured } from "@/lib/paypal";
import { money, shippingOf, taxOf, SALES_TAX_LABEL } from "@/lib/format";

export const metadata: Metadata = { title: "Pay for your order", robots: { index: false } };

type Order = {
  id: string;
  status: string;
  total_cents: number;
  tax_cents: number | null;
  order_items: { name: string; quantity: number; size: string | null; unit_price_cents: number }[];
};

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(`/login?next=/pay/${id}`);

  // RLS: only the owner can read this order.
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, total_cents, tax_cents, order_items(name, quantity, size, unit_price_cents)")
    .eq("id", id)
    .maybeSingle<Order>();
  if (!order) notFound();

  const configured = paypalConfigured();

  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <p className="eyebrow">Checkout</p>
      <h1 className="display mt-2 text-5xl">Pay for your order</h1>
      <p className="mt-2 text-sm text-muted">Order #{order.id.slice(0, 8).toUpperCase()}</p>

      <ul className="mt-8 divide-y divide-line rounded-2xl border border-line">
        {order.order_items.map((i, n) => (
          <li key={n} className="flex justify-between gap-4 p-4 text-sm">
            <span>{i.quantity}× {i.name}{i.size ? ` (${i.size})` : ""}</span>
            <span className="font-medium">{money(i.unit_price_cents * i.quantity)}</span>
          </li>
        ))}
        {shippingOf(order) > 0 && (
          <li className="flex justify-between gap-4 p-4 text-sm">
            <span>Shipping</span>
            <span className="font-medium">{money(shippingOf(order))}</span>
          </li>
        )}
        {taxOf(order) > 0 && (
          <li className="flex justify-between gap-4 p-4 text-sm">
            <span>{SALES_TAX_LABEL}</span>
            <span className="font-medium">{money(taxOf(order))}</span>
          </li>
        )}
        <li className="flex justify-between p-4 text-lg font-bold">
          <span>Total</span>
          <span>{money(order.total_cents)}</span>
        </li>
      </ul>

      <div className="mt-8">
        {order.status !== "pending" ? (
          <p className="rounded-2xl bg-mist p-6 text-center">
            This order is already <strong>{order.status}</strong>.{" "}
            <Link href="/account" className="font-semibold text-crimson underline">View my orders</Link>
          </p>
        ) : !configured ? (
          <p className="rounded-2xl bg-amber-50 p-6 text-sm text-amber-800">
            PayPal is not set up yet. Your order is saved and you can pay for it later from <Link href="/account" className="font-semibold underline">My account</Link>.
          </p>
        ) : (
          <>
            {isSandbox() && (
              <p className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                <strong>Test mode.</strong> This is PayPal Sandbox: no real money is charged. Pay with a PayPal sandbox test account.
              </p>
            )}
            <PayPalButtons clientId={process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!} orderId={order.id} />
          </>
        )}
      </div>

      <p className="mt-8 text-center text-sm text-muted">
        <Link href="/account" className="underline">Pay later from My account</Link>
      </p>
    </div>
  );
}
