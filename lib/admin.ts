import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Guard for every admin page AND every admin server action.
 * Not logged in -> login. Logged in but not an admin -> 404 (the admin area is not advertised).
 * Database writes then use the admin's own session, so Postgres RLS enforces it a second time.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin");
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", auth.user.id).single();
  if (!profile?.is_admin) notFound();
  return { supabase, user: auth.user };
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
