"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { addressFromForm } from "@/lib/address";
import { notifyCancelRequest } from "@/lib/notify";

const go = (key: "saved" | "error", message: string, anchor = ""): never =>
  redirect(`/account?${key}=${encodeURIComponent(message)}${anchor}`);

async function currentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/account");
  return { supabase, user: data.user };
}

/** Saves the default shipping address on the customer's profile (used to prefill the cart). */
export async function saveAddress(formData: FormData) {
  const { supabase, user } = await currentUser();
  const parsed = addressFromForm(formData);
  if (!parsed.success) redirect("/account?addr=invalid#address");
  const { data, error } = await supabase.from("profiles").update({ address: parsed.data }).eq("id", user.id).select("id");
  if (error || !data?.length) redirect("/account?addr=error#address");
  revalidatePath("/account");
  redirect("/account?addr=saved#address");
}

/** Loads one of the customer's own orders (RLS) and checks it can still be changed. */
async function editableOrder(orderId: string) {
  const { supabase } = await currentUser();
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, cancel_requested_at")
    .eq("id", orderId)
    .maybeSingle();
  return order && (order.status === "pending" || order.status === "paid") ? order : null;
}

/** Changes the shipping address of an order that has not shipped yet. */
export async function updateOrderAddress(formData: FormData) {
  const id = z.uuid().safeParse(formData.get("orderId"));
  const parsed = addressFromForm(formData);
  if (!id.success || !parsed.success) go("error", "Please fill in every address field.");
  const order = await editableOrder(id.data!);
  if (!order) go("error", "This order can no longer be changed because it has shipped or was closed.");
  // Customers cannot write to orders directly, so the change is applied here after the ownership check above.
  const { error } = await createAdminClient().from("orders").update({ shipping: parsed.data }).eq("id", order!.id);
  if (error) go("error", "Could not update the address.");
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
  const { error } = await createAdminClient()
    .from("orders")
    .update({ cancel_requested_at: new Date().toISOString(), cancel_reason: reason })
    .eq("id", order!.id);
  if (error) go("error", "Could not send your request.");
  await notifyCancelRequest(order!.id);
  revalidatePath("/account");
  go("saved", "Cancellation requested. We will review it and update your order.");
}
