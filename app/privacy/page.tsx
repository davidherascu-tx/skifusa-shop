import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { Bullets, LegalSection, Updated } from "@/components/legal";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function Privacy() {
  return (
    <PageShell eyebrow="Legal" title="Privacy policy">
      <Updated date="October 4, 2026" />
      <p>
        This policy explains what personal information the S.K.I.F.-USA Shop (Shotokan Karate-Do International
        Federation USA, “we”, “us”) collects, how we use it and the choices you have. We keep it simple: we collect
        only what we need to run the shop, and we do not sell your information.
      </p>

      <LegalSection title="Information we collect">
        <Bullets
          items={[
            <><strong>Account:</strong> your name, email address and password. Passwords are stored in encrypted form by our authentication provider. We cannot see them.</>,
            <><strong>Orders:</strong> the items you buy, order totals and status, your shipping address (for physical items), and the PayPal payment reference. We never see or store your card number.</>,
            <><strong>Member access requests:</strong> the S.K.I.F. member number, dojo or instructor and note you send us.</>,
            <><strong>Online events:</strong> that you registered for an event, so we can give you the Zoom access details.</>,
            <><strong>Contact form:</strong> your name, email address, the order number if you add one, and your message.</>,
            <><strong>Technical data:</strong> to stop spam we keep a coded (hashed) form of your IP address with contact messages. Our hosting provider also keeps standard security logs.</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="How we use it">
        <Bullets
          items={[
            "To process and deliver your orders, take payment and give refunds.",
            "To run your account, show your order history and verify S.K.I.F. member access.",
            "To send emails about your account and orders (order confirmation, payment receipt, shipping, cancellation, event access). We do not send marketing email.",
            "To answer your messages and give support.",
            "To protect the shop from fraud, spam and abuse, and to meet legal and accounting duties.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Payments">
        <p>
          Payments are handled by PayPal. When you pay, PayPal collects your payment details under its own privacy
          policy. We only receive the result of the payment and a reference number.
        </p>
      </LegalSection>

      <LegalSection title="Who we share it with">
        <p>We do not sell your personal information and we do not share it for advertising. We use these service providers, who only process it for us:</p>
        <Bullets
          items={[
            "Supabase: database, accounts and sign-in.",
            "Cloudflare: website hosting, security and the Turnstile spam check.",
            "PayPal: payments.",
            "Resend: sending our emails.",
            "Zoom: live online training sessions.",
            "Shipping carriers: only your name and address, so we can deliver your order.",
          ]}
        />
        <p>We may also share information if the law requires it, or to protect our rights or the safety of others.</p>
      </LegalSection>

      <LegalSection title="Cookies and similar technologies">
        <p>
          We use only what the shop needs to work. We do not use advertising, analytics or tracking cookies, so we do
          not show a cookie banner.
        </p>
        <Bullets
          items={[
            <><strong>Sign-in cookie</strong> (set by our authentication provider): keeps you logged in. Essential.</>,
            <><strong>Shopping cart</strong>: your cart is kept in your browser&apos;s local storage on your device so it is still there when you come back. Essential.</>,
            <><strong>PayPal:</strong> when you open the payment page, PayPal may set its own cookies to process and secure the payment.</>,
            <><strong>Cloudflare Turnstile:</strong> on the contact form, Cloudflare may use a cookie or similar technology to tell people from bots.</>,
          ]}
        />
        <p>You can delete or block cookies in your browser settings. Parts of the shop (login, cart, payment) will not work without them.</p>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <p>
          We keep order and payment records for as long as the law requires us to keep business and tax records. We keep
          your account until you ask us to delete it. We keep contact messages only as long as needed to help you.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <Bullets
          items={[
            <>You can see and change your name and shipping address in <Link href="/account" className="underline">My account</Link>.</>,
            <>You can ask us to give you a copy of your information, to correct it, or to delete your account, using the <Link href="/contact" className="underline">Contact page</Link>. We may keep records we must keep by law, such as order records.</>,
            "If you live in a state or country with privacy rights (for example California), you can use the same contact route to exercise them. We will not treat you differently for doing so.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Security">
        <p>
          We use encrypted connections (HTTPS), access controls and trusted providers to protect your information. No
          online service can promise perfect security, so please use a strong password and keep it private.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          The shop is not meant for children under 13, and we do not knowingly collect their information. Students under
          18 should order with a parent or guardian.
        </p>
      </LegalSection>

      <LegalSection title="Where your data is processed">
        <p>We are based in the United States, and our providers may process information in the United States.</p>
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <p>If we change this policy, we will post the new version on this page and update the date at the top.</p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about your privacy? Use the <Link href="/contact" className="font-semibold text-crimson underline">Contact page</Link>.
        </p>
      </LegalSection>
    </PageShell>
  );
}
