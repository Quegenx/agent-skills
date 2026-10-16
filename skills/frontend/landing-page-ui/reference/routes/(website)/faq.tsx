import { createFileRoute } from "@tanstack/react-router";

import { faq_meta_description, faq_page_title } from "#/paraglide/messages";

import { FaqPage } from "../../website/pages/faq/faq-page";
import { getFaqPageSections } from "../../website/pages/faq/faq-page-data";
import { getFaqPageStructuredData } from "../../website/shared/layout/page/faq-page-json-ld";
import { getMarketingPageHead } from "../../website/shared/layout/page/marketing-page-head";

export const Route = createFileRoute("/(website)/faq")({
  component: FaqPage,
  head: () => {
    const pageHead = getMarketingPageHead({
      description: faq_meta_description(),
      path: "/faq",
      title: faq_page_title(),
    });

    return {
      ...pageHead,
      scripts: [
        ...pageHead.scripts,
        getFaqPageStructuredData(
          "/faq",
          getFaqPageSections().flatMap((section) => section.items)
        ),
      ],
    };
  },
});
