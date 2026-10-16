import { createFileRoute } from "@tanstack/react-router";

import { contact_meta_description, contact_title } from "#/paraglide/messages";

import { ContactPage } from "../../website/pages/contact/contact-page";
import { getMarketingPageHead } from "../../website/shared/layout/page/marketing-page-head";

export const Route = createFileRoute("/(website)/contact")({
  component: ContactPage,
  head: () =>
    getMarketingPageHead({
      description: contact_meta_description(),
      path: "/contact",
      title: contact_title(),
    }),
});
