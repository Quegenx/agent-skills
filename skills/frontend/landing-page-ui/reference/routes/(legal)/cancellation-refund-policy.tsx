import { createFileRoute } from "@tanstack/react-router";

import {
  cancellation_meta_description,
  cancellation_title,
} from "#/paraglide/messages";

import { getCancellationDocument } from "../../website/pages/legal/cancellation-document";
import { LegalPage } from "../../website/pages/legal/legal-page";
import { getMarketingPageHead } from "../../website/shared/layout/page/marketing-page-head";

export const Route = createFileRoute("/(legal)/cancellation-refund-policy")({
  component: () => (
    <LegalPage document={getCancellationDocument()} revealSections />
  ),
  head: () =>
    getMarketingPageHead({
      description: cancellation_meta_description(),
      path: "/cancellation-refund-policy",
      title: cancellation_title(),
    }),
});
