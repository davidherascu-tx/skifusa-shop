"use client";

import { useEffect, useRef, useState } from "react";

type Actions = { close?: () => void; render: (el: HTMLElement) => Promise<void> };
type PayPalSdk = {
  Buttons: (opts: {
    style?: Record<string, string | number | boolean>;
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    onError: (err: unknown) => void;
    onCancel?: () => void;
  }) => Actions;
};
declare global {
  interface Window {
    paypal?: PayPalSdk;
  }
}

export function PayPalButtons({ clientId, orderId }: { clientId: string; orderId: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let buttons: Actions | undefined;
    let cancelled = false;

    const render = () => {
      if (cancelled || !box.current || !window.paypal) return;
      box.current.innerHTML = "";
      buttons = window.paypal.Buttons({
        style: { layout: "vertical", shape: "pill", label: "pay", height: 48 },
        createOrder: async () => {
          setError("");
          const res = await fetch("/api/paypal/create-order", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ orderId }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error ?? "Could not start the payment");
          return json.id as string;
        },
        onApprove: async (data) => {
          setBusy(true);
          const res = await fetch("/api/paypal/capture", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ paypalOrderId: data.orderID }),
          });
          const json = await res.json();
          if (!res.ok) {
            setBusy(false);
            setError(json.error ?? "The payment could not be completed.");
            return;
          }
          window.location.href = `/checkout/success?order=${orderId}`;
        },
        onError: (err) => setError(err instanceof Error ? err.message : "Something went wrong with PayPal."),
        onCancel: () => setError("Payment cancelled. You can try again below."),
      });
      buttons.render(box.current).then(() => setLoading(false)).catch(() => {});
    };

    if (window.paypal) {
      render();
    } else {
      const existing = document.querySelector<HTMLScriptElement>("script[data-paypal-sdk]");
      const script = existing ?? document.createElement("script");
      if (!existing) {
        script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture&components=buttons`;
        script.async = true;
        script.dataset.paypalSdk = "1";
        script.onerror = () => {
          setLoading(false);
          setError("Could not load PayPal. Check your connection and the PayPal Client ID.");
        };
        document.body.appendChild(script);
      }
      script.addEventListener("load", render);
    }

    return () => {
      cancelled = true;
      buttons?.close?.();
    };
  }, [clientId, orderId]);

  return (
    <div>
      {loading && <p className="py-6 text-center text-sm text-muted">Loading PayPal…</p>}
      <div ref={box} className={busy ? "pointer-events-none opacity-50" : ""} />
      {busy && <p className="mt-3 text-center text-sm text-muted" role="status">Completing your payment…</p>}
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}
