import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { Bullets, LegalSection, Updated } from "@/components/legal";

export const metadata: Metadata = { title: "Refund & Returns Policy" };

export default function Refunds() {
  return (
    <PageShell eyebrow="Legal" title="Refund & returns">
      <Updated date="October 4, 2026" />
      <p>
        This policy applies to everything you buy from the S.K.I.F.-USA Shop (Shotokan Karate-Do International Federation
        USA). If something is not right, please <Link href="/contact" className="font-semibold text-crimson underline">contact us</Link>{" "}
        first. We will do our best to make it right.
      </p>

      <LegalSection title="Returns of physical items">
        <Bullets
          items={[
            "You can return an item within 30 days of the delivery date.",
            "The item must be unused, unaltered and in its original packaging, with all tags and accessories.",
            <>Contact us through the <Link href="/contact" className="underline">Contact page</Link> within the 30 days. Include your order number and the reason. Please wait for our approval before you send anything back.</>,
            "Ship the item back with a trackable carrier and send us the tracking number. The buyer pays the return shipping, and we are not responsible for packages lost on their way back to us.",
            "Once we receive and inspect the item, we refund it to your original payment method (see “How refunds are paid” below). Original shipping charges, if any, are not refunded.",
          ]}
        />
      </LegalSection>

      <LegalSection title="What cannot be returned">
        <Bullets
          items={[
            "Items marked “Sold AS-IS” or “Final sale”, unless they are defective or not as described.",
            "Membership documents (passports, stamps and certificates) once they have been filled in, stamped or marked.",
            "Items that were used, altered or damaged after delivery.",
            "Returns requested more than 30 days after delivery.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Damaged, defective or wrong items">
        <p>
          If your order arrives damaged or defective, or you received the wrong item, tell us within 7 days of delivery.
          Send your order number, a short description and photos through the Contact page. We cover the return shipping
          and send a replacement or give a full refund, whichever you prefer.
        </p>
      </LegalSection>

      <LegalSection title="Exchanges">
        <p>
          We do not exchange items directly. If you need a different size or product, return the original item for a
          refund and place a new order.
        </p>
      </LegalSection>

      <LegalSection title="Cancelling an order">
        <p>
          You can ask to cancel an order that has not shipped yet. Open <strong>My account</strong>, find the order and
          choose <strong>Request cancellation</strong>. We review every request. If the order has not shipped, we cancel
          it and refund any payment in full. Once an order has shipped, please follow the return steps above.
        </p>
      </LegalSection>

      <LegalSection title="Virtual training (live online events)">
        <Bullets
          items={[
            "Your spot is reserved when your payment is complete.",
            "If you ask us to cancel at least 7 days before the start of the event, you get a full refund.",
            "Inside 7 days before the start, or if you do not attend, the fee is not refundable. If an emergency stops you from attending, contact us and we will look at your situation.",
            "If we cancel or reschedule an event, you can choose a full refund or a spot in the new session.",
            "Zoom access links are personal. Please do not share the meeting link, ID or password. We may remove access without a refund if a link is shared.",
            "Technical problems on your side (internet, device, Zoom account) are not a reason for a refund. Please join 5 minutes early to check your setup.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Members-only items">
        <p>
          Some items are only for approved S.K.I.F. members. If your membership cannot be verified after you place an
          order, we cancel the order and refund you in full.
        </p>
      </LegalSection>

      <LegalSection title="How refunds are paid">
        <p>
          Refunds go back to the payment method you used, through PayPal. We usually issue a refund within 5–10 business
          days after we approve it (for returns, after we receive and inspect the item). Your bank or card issuer may need
          a few more days to show it. If part of an order is missing or damaged, we may refund only that part.
        </p>
      </LegalSection>

      <LegalSection title="Questions">
        <p>
          Use the <Link href="/contact" className="font-semibold text-crimson underline">Contact page</Link> and
          include your order number (you will find it in your confirmation email and in My account).
        </p>
      </LegalSection>
    </PageShell>
  );
}
