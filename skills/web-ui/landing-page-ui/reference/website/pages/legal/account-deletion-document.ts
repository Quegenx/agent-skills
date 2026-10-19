import {
  account_deletion_billing_body_one,
  account_deletion_billing_title,
  account_deletion_contact_body_one,
  account_deletion_contact_title,
  account_deletion_how_body_one,
  account_deletion_how_body_two,
  account_deletion_how_title,
  account_deletion_intro_one,
  account_deletion_intro_two,
  account_deletion_keep_body_one,
  account_deletion_keep_body_two,
  account_deletion_keep_title,
  account_deletion_title,
  account_deletion_what_body_one,
  account_deletion_what_body_two,
  account_deletion_what_title,
  account_deletion_when_body_one,
  account_deletion_when_title,
  legal_updated,
} from "#/paraglide/messages";

import type { LegalDocument } from "./legal-page.types";

/**
 * How to delete an account and what deleting removes, in the page's language.
 *
 * @returns The legal document.
 */
export const getAccountDeletionDocument = (): LegalDocument => ({
  intro: [account_deletion_intro_one(), account_deletion_intro_two()],
  sections: [
    {
      id: "how",
      paragraphs: [
        account_deletion_how_body_one(),
        account_deletion_how_body_two(),
      ],
      title: account_deletion_how_title(),
    },
    {
      id: "what",
      paragraphs: [
        account_deletion_what_body_one(),
        account_deletion_what_body_two(),
      ],
      title: account_deletion_what_title(),
    },
    {
      id: "keep",
      paragraphs: [
        account_deletion_keep_body_one(),
        account_deletion_keep_body_two(),
      ],
      title: account_deletion_keep_title(),
    },
    {
      id: "when",
      paragraphs: [account_deletion_when_body_one()],
      title: account_deletion_when_title(),
    },
    {
      id: "billing",
      paragraphs: [account_deletion_billing_body_one()],
      title: account_deletion_billing_title(),
    },
    {
      id: "contact",
      paragraphs: [account_deletion_contact_body_one()],
      title: account_deletion_contact_title(),
    },
  ],
  title: account_deletion_title(),
  updated: legal_updated(),
});
