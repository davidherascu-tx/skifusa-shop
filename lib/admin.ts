import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, profiles } from "@/lib/db";
import { getUser } from "@/lib/session";

/**
 * Guard for every admin page AND every admin server action.
 * Not logged in -> login. Logged in but not an admin -> 404 (the admin area is not advertised).
 * There is no database-level row security any more, so every admin entry point must call this first.
 */
export async function requireAdmin() {
  const user = await getUser();
  if (!user) redirect("/login?next=/admin");
  const db = getDb();
  const [profile] = await db.select({ is_admin: profiles.is_admin }).from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (!profile?.is_admin) notFound();
  return { db, user };
}

export const ORDER_STATUSES = ["pending", "paid", "shipped", "cancelled", "refunded"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orderStatusStyle: Record<OrderStatus, { label: string; cls: string }> = {
  pending: { label: "New · awaiting payment", cls: "bg-amber-100 text-amber-800" },
  paid: { label: "Paid", cls: "bg-emerald-100 text-emerald-800" },
  shipped: { label: "Shipped", cls: "bg-sky-100 text-sky-800" },
  cancelled: { label: "Cancelled", cls: "bg-stone-200 text-stone-700" },
  refunded: { label: "Refunded", cls: "bg-stone-200 text-stone-700" },
};

export type Shipping = {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
};
