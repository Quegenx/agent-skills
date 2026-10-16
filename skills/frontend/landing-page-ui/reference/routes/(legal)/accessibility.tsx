import { createFileRoute } from "@tanstack/react-router";

import {
  accessibility_meta_description,
  accessibility_title,
} from "#/paraglide/messages";

import { getAccessibilityDocument } from "../../website/pages/legal/accessibility-document";
import { LegalPage } from "../../website/pages/legal/legal-page";
import { getMarketingPageHead } from "../../website/shared/layout/page/marketing-page-head";

export const Route = createFileRoute("/(legal)/accessibility")({
  component: () => (
    <LegalPage document={getAccessibilityDocument()} revealSections />
  ),
  head: () =>
    getMarketingPageHead({
      description: accessibility_meta_description(),
      path: "/accessibility",
      title: accessibility_title(),
    }),
});
