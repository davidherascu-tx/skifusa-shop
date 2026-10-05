import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "About" };

export default function About() {
  return (
    <PageShell eyebrow="Who we are" title="About S.K.I.F.-USA">
      <p>
        The Shotokan Karate-Do International Federation (S.K.I.F.) USA is dedicated to the teaching and preservation
        of traditional Shotokan karate. This shop is the official source for our instructional DVDs, books and
        accessories.
      </p>
      <h2 className="display pt-4 text-3xl text-ink">Supporting the Art Through Commerce</h2>
      <p>
        Our online store exists to serve the SKIF-USA community. Every item — from uniforms and equipment to
        educational materials and digital resources — is selected to support authentic Shotokan training and help
        practitioners at every stage of their journey.
      </p>
      <p>
        As a not-for-profit organization, proceeds from store purchases help fund our educational programs, national
        events, instructor certifications, and community outreach initiatives. When you shop with SKIF-USA, you invest
        directly in the growth of karate in America.
      </p>
    </PageShell>
  );
}
