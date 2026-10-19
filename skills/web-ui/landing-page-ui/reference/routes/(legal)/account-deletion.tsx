import { createFileRoute } from "@tanstack/react-router";

import {
  account_deletion_meta_description,
  account_deletion_title,
} from "#/paraglide/messages";

import { getAccountDeletionDocument } from "../../website/pages/legal/account-deletion-document";
import { LegalPage } from "../../website/pages/legal/legal-page";
import { getMarketingPageHead } from "../../website/shared/layout/page/marketing-page-head";

export const Route = createFileRoute("/(legal)/account-deletion")({
  component: () => (
    <LegalPage document={getAccountDeletionDocument()} revealSections />
  ),
  head: () =>
    getMarketingPageHead({
      description: account_deletion_meta_description(),
      path: "/account-deletion",
      title: account_deletion_title(),
    }),
});
