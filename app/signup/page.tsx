import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Create account" };

async function signup(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
    options: {
      data: { full_name: String(formData.get("full_name") ?? "") },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/account`,
    },
  });
  if (error) redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  // With email confirmation on, there is no session yet.
  redirect(data.session ? "/account" : "/signup?sent=1");
}

export default async function Signup({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  const { error, sent } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-5 py-20">
      {sent ? (
        <div className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-crimson text-2xl text-white">✉</span>
          <h1 className="display mt-6 text-5xl">Check your email</h1>
          <p className="mt-3 text-stone-600">We sent you a link to confirm your account.</p>
        </div>
      ) : (
        <>
          <p className="eyebrow">Join us</p>
          <h1 className="display mt-2 text-5xl">Create account</h1>
          <p className="mt-4 rounded-xl bg-mist p-4 text-sm text-stone-600">
            This creates a normal shop account for ordering and order tracking. If you are a S.K.I.F. member, you can
            request member access later from <strong>My account</strong>.
          </p>
          <form action={signup} className="mt-6 space-y-3">
            {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <input name="full_name" required placeholder="Full name" autoComplete="name" className="input" />
            <input name="email" type="email" required placeholder="Email" autoComplete="email" className="input" />
            <input name="password" type="password" required minLength={8} placeholder="Password (min. 8 characters)" autoComplete="new-password" className="input" />
            <button className="btn btn-primary w-full !py-4">Create account</button>
            <p className="text-center text-xs leading-relaxed text-muted">
              By creating an account you agree to our <Link href="/privacy" className="underline">Privacy Policy</Link> and{" "}
              <Link href="/refund-policy" className="underline">Refund &amp; Returns Policy</Link>.
            </p>
          </form>
          <p className="mt-6 text-center text-sm text-muted">
            Already registered? <Link href="/login" className="font-semibold text-ink underline underline-offset-4">Log in</Link>
          </p>
        </>
      )}
    </div>
  );
}
