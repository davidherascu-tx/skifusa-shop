import type { Metadata } from "next";
import { PageShell, Todo } from "@/components/page-shell";

export const metadata: Metadata = { title: "About" };

export default function About() {
  return (
    <PageShell eyebrow="Who we are" title="About S.K.I.F.-USA">
      <p>
        The Shotokan Karate-Do International Federation (S.K.I.F.) USA is dedicated to the teaching and preservation
        of traditional Shotokan karate. This shop is the official source for our instructional DVDs, books and
        accessories.
      </p>
      <Todo>replace with the real text from skifusa-shop.com.</Todo>
    </PageShell>
  );
}
