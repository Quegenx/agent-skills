import {
  cancellation_cancel_body_one,
  cancellation_cancel_body_two,
  cancellation_cancel_title,
  cancellation_contact_body_one,
  cancellation_contact_title,
  cancellation_intro_one,
  cancellation_intro_two,
  cancellation_plans_body,
  cancellation_plans_title,
  cancellation_refunds_body_one,
  cancellation_refunds_body_two,
  cancellation_refunds_title,
  cancellation_rights_body,
  cancellation_rights_title,
  cancellation_title,
  legal_updated,
} from "#/paraglide/messages";

import type { LegalDocument } from "./legal-page.types";

/**
 * The cancellation and refund policy, in the page's language.
 *
 * @returns The legal document.
 */
export const getCancellationDocument = (): LegalDocument => ({
  intro: [cancellation_intro_one(), cancellation_intro_two()],
  sections: [
    {
      id: "plans",
      paragraphs: [cancellation_plans_body()],
      title: cancellation_plans_title(),
    },
    {
      id: "cancelling",
      paragraphs: [
        cancellation_cancel_body_one(),
        cancellation_cancel_body_two(),
      ],
      title: cancellation_cancel_title(),
    },
    {
      id: "refunds",
      paragraphs: [
        cancellation_refunds_body_one(),
        cancellation_refunds_body_two(),
      ],
      title: cancellation_refunds_title(),
    },
    {
      id: "consumer-rights",
      paragraphs: [cancellation_rights_body()],
      title: cancellation_rights_title(),
    },
    {
      id: "contact",
      paragraphs: [cancellation_contact_body_one()],
      title: cancellation_contact_title(),
    },
  ],
  title: cancellation_title(),
  updated: legal_updated(),
});
