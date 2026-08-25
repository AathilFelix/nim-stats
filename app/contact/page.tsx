import type { Metadata } from "next";

import { ProsePage } from "@/components/site/prose-page";
import { CONTACT_PAGE } from "@/lib/content/pages";

export const metadata: Metadata = {
  title: CONTACT_PAGE.title,
  description: CONTACT_PAGE.summary,
  alternates: { canonical: CONTACT_PAGE.path },
};

export default function ContactPage() {
  return <ProsePage page={CONTACT_PAGE} />;
}
