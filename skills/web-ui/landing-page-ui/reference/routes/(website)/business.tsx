import { createFileRoute } from "@tanstack/react-router";

import {
  business_meta_description,
  business_meta_title,
} from "#/paraglide/messages";

import { getBusinessFaqItems } from "../../website/pages/business/business-faqs-data";
import { BusinessPage } from "../../website/pages/business/business-page";
import { getFaqPageStructuredData } from "../../website/shared/layout/page/faq-page-json-ld";
import { getMarketingPageHead } from "../../website/shared/layout/page/marketing-page-head";

export const Route = createFileRoute("/(website)/business")({
  component: BusinessPage,
  head: () => {
    const pageHead = getMarketingPageHead({
      description: business_meta_description(),
      path: "/business",
      title: business_meta_title(),
    });

    return {
      ...pageHead,
      scripts: [
        ...pageHead.scripts,
        getFaqPageStructuredData("/business", getBusinessFaqItems()),
      ],
    };
  },
});
