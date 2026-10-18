import { createFileRoute } from "@tanstack/react-router";

import {
  homepage_meta_description,
  homepage_meta_title,
} from "#/paraglide/messages";

import { HomePage } from "../../website/pages/home/page/home-page";
import { getHomepageStructuredData } from "../../website/pages/home/page/home-structured-data";
import {
  getMarketingPageHead,
  serializeJsonLdScript,
} from "../../website/shared/layout/page/marketing-page-head";

export const Route = createFileRoute("/(website)/")({
  component: HomePage,
  head: () => {
    const pageHead = getMarketingPageHead({
      description: homepage_meta_description(),
      path: "/",
      title: homepage_meta_title(),
    });

    return {
      ...pageHead,
      scripts: [
        {
          children: serializeJsonLdScript(getHomepageStructuredData()),
          type: "application/ld+json",
        },
      ],
    };
  },
});
