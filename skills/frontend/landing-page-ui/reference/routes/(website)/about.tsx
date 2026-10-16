import { createFileRoute } from "@tanstack/react-router";

import { about_meta_description, about_meta_title } from "#/paraglide/messages";

import { AboutPage } from "../../website/pages/about/page/about-page";
import { getMarketingPageHead } from "../../website/shared/layout/page/marketing-page-head";

export const Route = createFileRoute("/(website)/about")({
  component: AboutPage,
  head: () =>
    getMarketingPageHead({
      description: about_meta_description(),
      path: "/about",
      title: about_meta_title(),
    }),
});
