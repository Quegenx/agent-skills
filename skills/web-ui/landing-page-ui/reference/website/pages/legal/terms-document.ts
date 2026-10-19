import {
  legal_updated,
  terms_accounts_body,
  terms_accounts_title,
  terms_ai_body_one,
  terms_ai_body_two,
  terms_ai_title,
  terms_changes_body_one,
  terms_changes_body_two,
  terms_changes_title,
  terms_data_body_one,
  terms_data_body_two,
  terms_data_title,
  terms_facebook_body_one,
  terms_facebook_body_two,
  terms_facebook_title,
  terms_general_body_one,
  terms_general_body_three,
  terms_general_body_two,
  terms_general_title,
  terms_intro_one,
  terms_intro_two,
  terms_liability_body_one,
  terms_liability_body_two,
  terms_liability_title,
  terms_ownership_body_one,
  terms_ownership_body_two,
  terms_ownership_title,
  terms_payments_body_one,
  terms_payments_body_two,
  terms_payments_title,
  terms_services_body_one,
  terms_services_body_two,
  terms_services_title,
  terms_termination_body_one,
  terms_termination_body_two,
  terms_termination_title,
  terms_title,
  terms_use_body,
  terms_use_point_access,
  terms_use_point_content,
  terms_use_point_law,
  terms_use_point_reverse_engineering,
  terms_use_point_security,
  terms_use_point_spam,
  terms_use_title,
} from "#/paraglide/messages";

import type { LegalDocument } from "./legal-page.types";

/**
 * The terms of use, in the page's language.
 *
 * @returns The legal document.
 */
export const getTermsDocument = (): LegalDocument => ({
  intro: [terms_intro_one(), terms_intro_two()],
  sections: [
    {
      id: "accounts-and-eligibility",
      paragraphs: [terms_accounts_body()],
      title: terms_accounts_title(),
    },
    {
      id: "using-the-service",
      paragraphs: [terms_services_body_one(), terms_services_body_two()],
      title: terms_services_title(),
    },
    {
      id: "facebook-accounts",
      paragraphs: [terms_facebook_body_one(), terms_facebook_body_two()],
      title: terms_facebook_title(),
    },
    {
      id: "ai-agent",
      paragraphs: [terms_ai_body_one(), terms_ai_body_two()],
      title: terms_ai_title(),
    },
    {
      id: "your-data",
      paragraphs: [terms_data_body_one(), terms_data_body_two()],
      title: terms_data_title(),
    },
    {
      id: "acceptable-use",
      paragraphs: [terms_use_body()],
      points: [
        terms_use_point_law(),
        terms_use_point_spam(),
        terms_use_point_content(),
        terms_use_point_access(),
        terms_use_point_security(),
        terms_use_point_reverse_engineering(),
      ],
      title: terms_use_title(),
    },
    {
      id: "plans-and-payments",
      paragraphs: [terms_payments_body_one(), terms_payments_body_two()],
      title: terms_payments_title(),
    },
    {
      id: "ownership",
      paragraphs: [terms_ownership_body_one(), terms_ownership_body_two()],
      title: terms_ownership_title(),
    },
    {
      id: "availability-and-liability",
      paragraphs: [terms_liability_body_one(), terms_liability_body_two()],
      title: terms_liability_title(),
    },
    {
      id: "suspension-and-termination",
      paragraphs: [terms_termination_body_one(), terms_termination_body_two()],
      title: terms_termination_title(),
    },
    {
      id: "general-and-contact",
      paragraphs: [
        terms_general_body_one(),
        terms_general_body_two(),
        terms_general_body_three(),
      ],
      title: terms_general_title(),
    },
    {
      id: "changes-to-these-terms",
      paragraphs: [terms_changes_body_one(), terms_changes_body_two()],
      title: terms_changes_title(),
    },
  ],
  title: terms_title(),
  updated: legal_updated(),
});
