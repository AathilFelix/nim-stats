import type { Metadata } from "next";

import { ProsePage } from "@/components/site/prose-page";
import { ABOUT_PAGE } from "@/lib/content/pages";

export const metadata: Metadata = {
  title: ABOUT_PAGE.title,
  description: ABOUT_PAGE.summary,
  alternates: { canonical: ABOUT_PAGE.path },
};

export default function AboutPage() {
  return <ProsePage page={ABOUT_PAGE} />;
}
