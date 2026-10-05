import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CartView } from "@/components/cart-view";
import type { Address } from "@/lib/address";

export const metadata: Metadata = { title: "Your cart" };

export default async function CartPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  let address: Address | null = null;
  if (auth.user) {
    const { data } = await supabase.from("profiles").select("address").eq("id", auth.user.id).single();
    address = (data?.address as Address | null) ?? null;
  }
  return <CartView defaults={address} />;
}
