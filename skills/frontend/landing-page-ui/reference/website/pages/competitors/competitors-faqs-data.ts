import {
  competitors_faq_answer_inactive,
  competitors_faq_answer_source,
  competitors_faq_answer_spend,
  competitors_faq_answer_who,
  competitors_faq_question_inactive,
  competitors_faq_question_source,
  competitors_faq_question_spend,
  competitors_faq_question_who,
} from "#/paraglide/messages";

import type { FaqPageJsonLdItem } from "../../shared/layout/page/faq-page-json-ld";

/**
 * The competitors page's FAQ, shown in its accordion and in its FAQPage schema.
 *
 * @returns The questions and answers, in the page's language.
 */
export const getCompetitorsFaqItems = (): readonly FaqPageJsonLdItem[] => [
  {
    answer: competitors_faq_answer_source(),
    question: competitors_faq_question_source(),
  },
  {
    answer: competitors_faq_answer_who(),
    question: competitors_faq_question_who(),
  },
  {
    answer: competitors_faq_answer_inactive(),
    question: competitors_faq_question_inactive(),
  },
  {
    answer: competitors_faq_answer_spend(),
    question: competitors_faq_question_spend(),
  },
];
