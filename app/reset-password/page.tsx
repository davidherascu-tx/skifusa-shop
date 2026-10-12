import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { APIError } from "better-auth/api";
import { getAuth } from "@/lib/auth";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

async function resetPassword(formData: FormData) {
  "use server";
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const back = `/reset-password?token=${encodeURIComponent(token)}`;
  if (password.length < 8) redirect(`${back}&error=${encodeURIComponent("Password must be at least 8 characters.")}`);
  if (password !== String(formData.get("confirm") ?? "")) redirect(`${back}&error=${encodeURIComponent("The two passwords do not match.")}`);
  try {
    await getAuth().api.resetPassword({ body: { newPassword: password, token }, headers: await headers() });
  } catch (e) {
    if (!(e instanceof APIError)) throw e;
    redirect("/reset-password?error=INVALID_TOKEN");
  }
  redirect("/login?reset=1");
}

export default async function ResetPassword({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams;
  const invalid = !token || error === "INVALID_TOKEN";
  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <p className="eyebrow">Account</p>
      <h1 className="display mt-2 text-5xl">New password</h1>
      {invalid ? (
        <div className="mt-8 space-y-4">
          <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">This reset link is invalid or has expired.</p>
          <Link href="/forgot-password" className="btn btn-primary w-full !py-4">Send a new link</Link>
        </div>
      ) : (
        <form action={resetPassword} className="mt-8 space-y-3">
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <input type="hidden" name="token" value={token} />
          <input name="password" type="password" required minLength={8} placeholder="New password (min. 8 characters)" autoComplete="new-password" className="input" />
          <input name="confirm" type="password" required minLength={8} placeholder="Repeat new password" autoComplete="new-password" className="input" />
          <button className="btn btn-primary w-full !py-4">Save new password</button>
        </form>
      )}
    </div>
  );
}
