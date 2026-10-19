import { getLocale } from "#/paraglide/runtime";

import { SITE_ORIGIN, serializeJsonLdScript } from "./marketing-page-head";

/**
 * One FAQ question and its answer, as a page shows it and its JSON-LD repeats
 * it.
 */
export interface FaqPageJsonLdItem {
  answer: string;
  question: string;
}

/**
 * Maps FAQ question/answer pairs into schema.org FAQPage mainEntity entries.
 *
 * @param items - The page's questions and answers.
 * @returns The questions as schema.org Question objects.
 */
export const faqItemsToJsonLdQuestions = (
  items: readonly FaqPageJsonLdItem[]
) =>
  items.map((item) => ({
    "@type": "Question" as const,
    acceptedAnswer: {
      "@type": "Answer" as const,
      text: item.answer,
    },
    name: item.question,
  }));

/**
 * A page's FAQ as schema.org FAQPage, for its route's head (scripts). The
 * items are the same ones the page shows, so the markup matches the visible
 * text. Google no longer shows FAQ rich results (from May 7, 2026,
 * https://developers.google.com/search/updates); the markup stays valid
 * schema.org, and unused structured data "does not cause problems for Search"
 * (https://developers.google.com/search/blog/2023/08/howto-faq-changes).
 *
 * @param path - The page's path, for its canonical URL.
 * @param items - The page's questions and answers.
 * @returns The JSON-LD script for the route's head.
 */
export const getFaqPageStructuredData = (
  path: string,
  items: readonly FaqPageJsonLdItem[]
) => {
  const locale = getLocale();
  const canonicalUrl = `${SITE_ORIGIN}${locale === "en" ? "/en" : ""}${path}`;

  return {
    children: serializeJsonLdScript({
      "@context": "https://schema.org",
      "@id": `${canonicalUrl}/#faq`,
      "@type": "FAQPage",
      inLanguage: locale === "he" ? "he-IL" : "en-US",
      mainEntity: faqItemsToJsonLdQuestions(items),
      url: canonicalUrl,
    }),
    type: "application/ld+json",
  };
};
