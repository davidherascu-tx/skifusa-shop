import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { getDb, profiles } from "@/lib/db";
import { getUser } from "@/lib/session";
import { CartView } from "@/components/cart-view";
import type { Address } from "@/lib/address";

export const metadata: Metadata = { title: "Your cart" };

export default async function CartPage() {
  const user = await getUser();
  let address: Address | null = null;
  if (user) {
    const [row] = await getDb().select({ address: profiles.address }).from(profiles).where(eq(profiles.id, user.id)).limit(1);
    address = (row?.address as Address | null) ?? null;
  }
  return <CartView defaults={address} />;
}
