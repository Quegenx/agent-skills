import {
  accessibility_alternative_body,
  accessibility_alternative_title,
  accessibility_contact_body_one,
  accessibility_contact_body_two,
  accessibility_contact_title,
  accessibility_feature_keyboard,
  accessibility_feature_language,
  accessibility_feature_motion,
  accessibility_feature_responsive,
  accessibility_feature_structure,
  accessibility_features_body,
  accessibility_features_title,
  accessibility_intro_one,
  accessibility_intro_two,
  accessibility_limitations_body_one,
  accessibility_limitations_body_two,
  accessibility_limitations_title,
  accessibility_standard_body_one,
  accessibility_standard_body_two,
  accessibility_standard_title,
  accessibility_support_body,
  accessibility_support_title,
  accessibility_title,
  legal_updated,
} from "#/paraglide/messages";

import type { LegalDocument } from "./legal-page.types";

/**
 * The accessibility statement, in the page's language.
 *
 * @returns The legal document.
 */
export const getAccessibilityDocument = (): LegalDocument => ({
  intro: [accessibility_intro_one(), accessibility_intro_two()],
  sections: [
    {
      id: "standard",
      paragraphs: [
        accessibility_standard_body_one(),
        accessibility_standard_body_two(),
      ],
      title: accessibility_standard_title(),
    },
    {
      id: "adjustments",
      paragraphs: [accessibility_features_body()],
      points: [
        accessibility_feature_keyboard(),
        accessibility_feature_structure(),
        accessibility_feature_motion(),
        accessibility_feature_language(),
        accessibility_feature_responsive(),
      ],
      title: accessibility_features_title(),
    },
    {
      id: "environments",
      paragraphs: [accessibility_support_body()],
      title: accessibility_support_title(),
    },
    {
      id: "limitations",
      paragraphs: [
        accessibility_limitations_body_one(),
        accessibility_limitations_body_two(),
      ],
      title: accessibility_limitations_title(),
    },
    {
      id: "alternative",
      paragraphs: [accessibility_alternative_body()],
      title: accessibility_alternative_title(),
    },
    {
      id: "contact",
      paragraphs: [
        accessibility_contact_body_one(),
        accessibility_contact_body_two(),
      ],
      title: accessibility_contact_title(),
    },
  ],
  title: accessibility_title(),
  updated: legal_updated(),
});
