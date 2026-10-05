import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { ContactForm } from "@/components/contact-form";
import { createClient } from "@/lib/supabase/server";
import { makeFormToken } from "@/lib/contact";

export const metadata: Metadata = { title: "Contact" };

export default async function Contact() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  // Logged-in customers get their details and order numbers prefilled.
  let prefill = { name: "", email: "" };
  let orderNumbers: string[] = [];
  if (auth.user) {
    const [{ data: profile }, { data: orders }] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", auth.user.id).single(),
      supabase.from("orders").select("id").order("created_at", { ascending: false }).limit(20),
    ]);
    prefill = { name: profile?.full_name ?? "", email: auth.user.email ?? "" };
    orderNumbers = (orders ?? []).map((o) => o.id.slice(0, 8).toUpperCase());
  }

  return (
    <PageShell eyebrow="We are here to help" title="Contact us">
      <p>Questions about an order or a product? Send us a message and we will reply by email as soon as possible.</p>
      <div className="not-prose mt-8">
        <ContactForm
          formToken={await makeFormToken()}
          turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined}
          prefill={prefill}
          orderNumbers={orderNumbers}
        />
      </div>
      <p className="pt-4">
        <span className="block text-sm font-semibold uppercase tracking-wider text-muted">Email address</span>
        <a href="mailto:skifusa@gmail.com" className="text-lg font-medium text-ink underline-offset-4 hover:text-crimson hover:underline">
          skifusa@gmail.com
        </a>
      </p>
    </PageShell>
  );
}
