"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { getAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { getDb, orders, profiles } from "@/lib/db";
import { getUser } from "@/lib/session";
import { addressFromForm } from "@/lib/address";
import { notifyCancelRequest } from "@/lib/notify";

const go = (key: "saved" | "error", message: string, anchor = ""): never =>
  redirect(`/account?${key}=${encodeURIComponent(message)}${anchor}`);

async function currentUser() {
  const user = await getUser();
  if (!user) redirect("/login?next=/account");
  return { db: getDb(), user };
}

/** Changes the signed-in user's password (customers and admins alike). */
export async function changePassword(formData: FormData) {
  await currentUser();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("password") ?? "");
  if (!current) go("error", "Please enter your current password.", "#password");
  if (next.length < 8) go("error", "The new password must be at least 8 characters.", "#password");
  if (next !== String(formData.get("confirm") ?? "")) go("error", "The two new passwords do not match.", "#password");
  let failure: string | null = null;
  try {
    await getAuth().api.changePassword({
      body: { currentPassword: current, newPassword: next, revokeOtherSessions: true },
      headers: await headers(),
    });
  } catch (e) {
    if (!(e instanceof APIError)) throw e;
    failure = /invalid/i.test(e.message) ? "Your current password is not correct." : "Could not change the password. Please try again.";
  }
  if (failure) go("error", failure, "#password");
  go("saved", "Password changed. Other devices were signed out.", "#password");
}

/** Saves the default shipping address on the customer's profile (used to prefill the cart). */
export async function saveAddress(formData: FormData) {
  const { db, user } = await currentUser();
  const parsed = addressFromForm(formData);
  if (!parsed.success) redirect("/account?addr=invalid#address");
  const saved = await db.update(profiles).set({ address: parsed.data }).where(eq(profiles.id, user.id)).returning({ id: profiles.id }).catch(() => []);
  if (!saved.length) redirect("/account?addr=error#address");
  revalidatePath("/account");
  redirect("/account?addr=saved#address");
}

/** Loads one of the customer's own orders and checks it can still be changed. */
async function editableOrder(orderId: string) {
  const { db, user } = await currentUser();
  const [order] = await db
    .select({ id: orders.id, status: orders.status, cancel_requested_at: orders.cancel_requested_at })
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.user_id, user.id)))
    .limit(1);
  return order && (order.status === "pending" || order.status === "paid") ? order : null;
}

/** Changes the shipping address of an order that has not shipped yet. */
export async function updateOrderAddress(formData: FormData) {
  const id = z.uuid().safeParse(formData.get("orderId"));
  const parsed = addressFromForm(formData);
  if (!id.success || !parsed.success) go("error", "Please fill in every address field.");
  const order = await editableOrder(id.data!);
  if (!order) go("error", "This order can no longer be changed because it has shipped or was closed.");
  // The ownership check happened in editableOrder().
  try {
    await getDb().update(orders).set({ shipping: parsed.data }).where(eq(orders.id, order!.id));
  } catch {
    go("error", "Could not update the address.");
  }
  revalidatePath("/account");
  go("saved", "Shipping address updated for that order");
}

/** Customer asks us to cancel an order. An admin reviews it. */
export async function requestCancellation(formData: FormData) {
  const id = z.uuid().safeParse(formData.get("orderId"));
  if (!id.success) go("error", "Invalid order.");
  const order = await editableOrder(id.data!);
  if (!order) go("error", "This order can no longer be cancelled because it has shipped or was closed.");
  if (order!.cancel_requested_at) go("saved", "Your cancellation request was already sent.");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500) || null;
  try {
    await getDb().update(orders).set({ cancel_requested_at: new Date().toISOString(), cancel_reason: reason }).where(eq(orders.id, order!.id));
  } catch {
    go("error", "Could not send your request.");
  }
  await notifyCancelRequest(order!.id);
  revalidatePath("/account");
  go("saved", "Cancellation requested. We will review it and update your order.");
}
