import type { Metadata } from "next";

import { ProsePage } from "@/components/site/prose-page";
import { PRIVACY_PAGE } from "@/lib/content/pages";

export const metadata: Metadata = {
  title: PRIVACY_PAGE.title,
  description: PRIVACY_PAGE.summary,
  alternates: { canonical: PRIVACY_PAGE.path },
};

export default function PrivacyPage() {
  return <ProsePage page={PRIVACY_PAGE} />;
}
