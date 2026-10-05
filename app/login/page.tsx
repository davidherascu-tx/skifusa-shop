import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Log in" };

async function login(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });
  const next = String(formData.get("next") ?? "/account");
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  // only allow same-site relative redirects
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/account");
}

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <p className="eyebrow">Welcome back</p>
      <h1 className="display mt-2 text-5xl">Log in</h1>
      <form action={login} className="mt-8 space-y-3">
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <input type="hidden" name="next" value={next ?? "/account"} />
        <input name="email" type="email" required placeholder="Email" autoComplete="email" className="input" />
        <input name="password" type="password" required placeholder="Password" autoComplete="current-password" className="input" />
        <button className="btn btn-primary w-full !py-4">Log in</button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        New here? <Link href="/signup" className="font-semibold text-ink underline underline-offset-4">Create an account</Link>
      </p>
    </div>
  );
}
