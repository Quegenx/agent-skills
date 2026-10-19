import { createFileRoute } from "@tanstack/react-router";

import {
  pricing_meta_description,
  pricing_meta_title,
} from "#/paraglide/messages";

import { getPricingFaqItems } from "../../website/pages/pricing/pricing-faqs-data";
import { PricingPage } from "../../website/pages/pricing/pricing-page";
import { getFaqPageStructuredData } from "../../website/shared/layout/page/faq-page-json-ld";
import { getMarketingPageHead } from "../../website/shared/layout/page/marketing-page-head";

export const Route = createFileRoute("/(website)/pricing")({
  component: PricingPage,
  head: () => {
    const pageHead = getMarketingPageHead({
      description: pricing_meta_description(),
      path: "/pricing",
      title: pricing_meta_title(),
    });

    return {
      ...pageHead,
      scripts: [
        ...pageHead.scripts,
        getFaqPageStructuredData("/pricing", getPricingFaqItems()),
      ],
    };
  },
});
