import { createFileRoute } from "@tanstack/react-router";

import { terms_meta_description, terms_title } from "#/paraglide/messages";

import { LegalPage } from "../../website/pages/legal/legal-page";
import { getTermsDocument } from "../../website/pages/legal/terms-document";
import { getMarketingPageHead } from "../../website/shared/layout/page/marketing-page-head";

export const Route = createFileRoute("/(legal)/terms-of-service")({
  component: () => <LegalPage document={getTermsDocument()} revealSections />,
  head: () =>
    getMarketingPageHead({
      description: terms_meta_description(),
      path: "/terms-of-service",
      title: terms_title(),
    }),
});
