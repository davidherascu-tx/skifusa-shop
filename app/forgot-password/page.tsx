import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getAuth } from "@/lib/auth";

export const metadata: Metadata = { title: "Forgot password" };

async function requestReset(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (email) {
    try {
      await getAuth().api.requestPasswordReset({ body: { email, redirectTo: "/reset-password" }, headers: await headers() });
    } catch {
      // Never reveal whether an account exists: the answer below is the same either way.
    }
  }
  redirect("/forgot-password?sent=1");
}

export default async function ForgotPassword({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const { sent } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <p className="eyebrow">Account</p>
      <h1 className="display mt-2 text-5xl">Forgot password</h1>
      {sent ? (
        <p role="status" className="mt-8 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
          If an account exists for that email, we sent a link to choose a new password. It expires in one hour.
        </p>
      ) : (
        <form action={requestReset} className="mt-8 space-y-3">
          <p className="text-sm text-stone-600">Enter your email and we will send you a link to choose a new password.</p>
          <input name="email" type="email" required placeholder="Email" autoComplete="email" className="input" />
          <button className="btn btn-primary w-full !py-4">Send reset link</button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="font-semibold text-ink underline underline-offset-4">Back to log in</Link>
      </p>
    </div>
  );
}
