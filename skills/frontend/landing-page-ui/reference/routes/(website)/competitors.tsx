import { createFileRoute } from "@tanstack/react-router";

import {
  competitors_meta_description,
  competitors_meta_title,
} from "#/paraglide/messages";

import { getCompetitorsFaqItems } from "../../website/pages/competitors/competitors-faqs-data";
import { CompetitorsPage } from "../../website/pages/competitors/competitors-page";
import { getFaqPageStructuredData } from "../../website/shared/layout/page/faq-page-json-ld";
import { getMarketingPageHead } from "../../website/shared/layout/page/marketing-page-head";

export const Route = createFileRoute("/(website)/competitors")({
  component: CompetitorsPage,
  head: () => {
    const pageHead = getMarketingPageHead({
      description: competitors_meta_description(),
      path: "/competitors",
      title: competitors_meta_title(),
    });

    return {
      ...pageHead,
      scripts: [
        ...pageHead.scripts,
        getFaqPageStructuredData("/competitors", getCompetitorsFaqItems()),
      ],
    };
  },
});
