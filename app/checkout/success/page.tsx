"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/components/cart-provider";

export default function Success() {
  const { clear } = useCart();
  useEffect(() => clear(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto max-w-2xl px-5 py-32 text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-crimson text-2xl text-white">✓</span>
      <h1 className="display mt-6 text-5xl">Payment received</h1>
      <p className="mt-4 text-stone-600">
        Thank you! Your payment was successful. You can follow your order in your account. Oss!
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/account" className="btn btn-dark">View my orders</Link>
        <Link href="/products" className="btn border border-line hover:bg-mist">Keep shopping</Link>
      </div>
    </div>
  );
}
