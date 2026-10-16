import {
  business_faq_answer_accounts,
  business_faq_answer_fields,
  business_faq_answer_pace,
  business_faq_answer_replies,
  business_faq_question_accounts,
  business_faq_question_fields,
  business_faq_question_pace,
  business_faq_question_replies,
} from "#/paraglide/messages";

import type { FaqPageJsonLdItem } from "../../shared/layout/page/faq-page-json-ld";

/**
 * The business page's FAQ, shown in its accordion and in its FAQPage schema.
 *
 * @returns The questions and answers, in the page's language.
 */
export const getBusinessFaqItems = (): readonly FaqPageJsonLdItem[] => [
  {
    answer: business_faq_answer_fields(),
    question: business_faq_question_fields(),
  },
  {
    answer: business_faq_answer_replies(),
    question: business_faq_question_replies(),
  },
  {
    answer: business_faq_answer_accounts(),
    question: business_faq_question_accounts(),
  },
  {
    answer: business_faq_answer_pace(),
    question: business_faq_question_pace(),
  },
];
