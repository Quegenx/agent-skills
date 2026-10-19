import { createFileRoute } from "@tanstack/react-router";

import {
  personal_meta_description,
  personal_meta_title,
} from "#/paraglide/messages";

import { getPersonalFaqItems } from "../../website/pages/personal/personal-faqs-data";
import { PersonalPage } from "../../website/pages/personal/personal-page";
import { getFaqPageStructuredData } from "../../website/shared/layout/page/faq-page-json-ld";
import { getMarketingPageHead } from "../../website/shared/layout/page/marketing-page-head";

export const Route = createFileRoute("/(website)/personal")({
  component: PersonalPage,
  head: () => {
    const pageHead = getMarketingPageHead({
      description: personal_meta_description(),
      path: "/personal",
      title: personal_meta_title(),
    });

    return {
      ...pageHead,
      scripts: [
        ...pageHead.scripts,
        getFaqPageStructuredData("/personal", getPersonalFaqItems()),
      ],
    };
  },
});
