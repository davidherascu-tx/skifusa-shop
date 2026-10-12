import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { ContactForm } from "@/components/contact-form";
import { desc, eq } from "drizzle-orm";
import { getDb, orders, profiles } from "@/lib/db";
import { getUser } from "@/lib/session";
import { makeFormToken } from "@/lib/contact";

export const metadata: Metadata = { title: "Contact" };

export default async function Contact() {
  const user = await getUser();

  // Logged-in customers get their details and order numbers prefilled.
  let prefill = { name: "", email: "" };
  let orderNumbers: string[] = [];
  if (user) {
    const db = getDb();
    const [[profile], myOrders] = await Promise.all([
      db.select({ full_name: profiles.full_name }).from(profiles).where(eq(profiles.id, user.id)).limit(1),
      db.select({ id: orders.id }).from(orders).where(eq(orders.user_id, user.id)).orderBy(desc(orders.created_at)).limit(20),
    ]);
    prefill = { name: profile?.full_name ?? "", email: user.email ?? "" };
    orderNumbers = myOrders.map((o) => o.id.slice(0, 8).toUpperCase());
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
