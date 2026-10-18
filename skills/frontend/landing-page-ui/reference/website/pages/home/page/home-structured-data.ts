import { getLocale } from "#/paraglide/runtime";

import { faqItemsToJsonLdQuestions } from "../../../shared/layout/page/faq-page-json-ld";
import { SITE_ORIGIN } from "../../../shared/layout/page/marketing-page-head";
import { getHomeFaqItems } from "../faq/home-faq-items";

const organizationId = `${SITE_ORIGIN}/#organization`;

/**
 * Organization, WebSite, and homepage FAQ JSON-LD for `/`.
 *
 * @returns The home page's JSON-LD graph.
 */
export const getHomepageStructuredData = () => {
  const locale = getLocale();
  const canonicalUrl = `${SITE_ORIGIN}${locale === "en" ? "/en" : ""}`;
  const inLanguage = locale === "he" ? "he-IL" : "en-US";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@id": organizationId,
        "@type": "Organization",
        logo: `${SITE_ORIGIN}/brand/app-logo.png`,
        name: "App",
        url: SITE_ORIGIN,
      },
      {
        "@id": `${SITE_ORIGIN}/#website`,
        "@type": "WebSite",
        inLanguage,
        name: "App",
        publisher: { "@id": organizationId },
        // Google site names: url is "the canonical home page of your site's
        // domain or subdomain"; subdirectories such as /en are not supported
        // (https://developers.google.com/search/docs/appearance/site-names).
        url: SITE_ORIGIN,
      },
      {
        "@id": `${canonicalUrl}/#webpage`,
        "@type": "WebPage",
        inLanguage,
        isPartOf: { "@id": `${SITE_ORIGIN}/#website` },
        name: "App",
        publisher: { "@id": organizationId },
        url: canonicalUrl,
      },
      {
        "@id": `${canonicalUrl}/#faq`,
        "@type": "FAQPage",
        inLanguage,
        mainEntity: faqItemsToJsonLdQuestions(getHomeFaqItems()),
        url: canonicalUrl,
      },
    ],
  } as const;
};
