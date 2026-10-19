import { createFileRoute } from "@tanstack/react-router";

import { privacy_meta_description, privacy_title } from "#/paraglide/messages";

import { LegalPage } from "../../website/pages/legal/legal-page";
import { getPrivacyDocument } from "../../website/pages/legal/privacy-document";
import { getMarketingPageHead } from "../../website/shared/layout/page/marketing-page-head";

export const Route = createFileRoute("/(legal)/privacy-policy")({
  component: () => <LegalPage document={getPrivacyDocument()} revealSections />,
  head: () =>
    getMarketingPageHead({
      description: privacy_meta_description(),
      path: "/privacy-policy",
      title: privacy_title(),
    }),
});
