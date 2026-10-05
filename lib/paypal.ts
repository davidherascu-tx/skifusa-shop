// Minimal PayPal Orders v2 client (fetch only, so it runs on Cloudflare Workers).
// PAYPAL_ENV=sandbox (default) -> test money only. Set PAYPAL_ENV=live ONLY when going live.
const base = () => (process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com");

export const paypalConfigured = () =>
  !!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && !!process.env.PAYPAL_CLIENT_SECRET;

export const isSandbox = () => process.env.PAYPAL_ENV !== "live";

export const usd = (cents: number) => (cents / 100).toFixed(2);

async function accessToken() {
  const basic = btoa(`${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`);
  const res = await fetch(`${base()}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal auth failed (${res.status}). Check the Client ID and Secret.`);
  return (await res.json()).access_token as string;
}

type Json = Record<string, unknown>;

async function call(path: string, body: Json | undefined, requestId?: string) {
  const res = await fetch(`${base()}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
      ...(requestId ? { "PayPal-Request-Id": requestId } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as Json;
  return { ok: res.ok, status: res.status, json };
}

/** Creates a PayPal order for a shop order. The amount always comes from our database. */
export async function createPayPalOrder(shopOrderId: string, totalCents: number) {
  const r = await call(
    "/v2/checkout/orders",
    {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: shopOrderId,
          custom_id: shopOrderId,
          description: `S.K.I.F.-USA Shop order ${shopOrderId.slice(0, 8).toUpperCase()}`,
          amount: { currency_code: "USD", value: usd(totalCents) },
        },
      ],
    },
    `create-${shopOrderId}-${Date.now()}`,
  );
  if (!r.ok || typeof r.json.id !== "string") throw new Error("PayPal could not create the order");
  return r.json.id;
}

type Capture = { status?: string; amount?: { value?: string; currency_code?: string } };

/** Captures an approved PayPal order. Returns the capture details, or an error code. */
export async function capturePayPalOrder(paypalOrderId: string) {
  const r = await call(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, undefined, `capture-${paypalOrderId}`);
  if (!r.ok) {
    const issue = (r.json.details as { issue?: string }[] | undefined)?.[0]?.issue;
    return { ok: false as const, code: issue ?? "CAPTURE_FAILED" };
  }
  const units = r.json.purchase_units as { payments?: { captures?: Capture[] } }[] | undefined;
  const capture = units?.[0]?.payments?.captures?.[0];
  return { ok: true as const, status: r.json.status as string, capture };
}
