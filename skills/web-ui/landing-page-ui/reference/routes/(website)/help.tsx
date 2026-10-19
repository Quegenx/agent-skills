import { createFileRoute } from "@tanstack/react-router";

import { help_meta_description, help_title } from "#/paraglide/messages";

import { HelpPage } from "../../website/pages/help/page/help-page";
import { getMarketingPageHead } from "../../website/shared/layout/page/marketing-page-head";

export const Route = createFileRoute("/(website)/help")({
  component: HelpPage,
  head: () =>
    getMarketingPageHead({
      description: help_meta_description(),
      path: "/help",
      title: help_title(),
    }),
});
