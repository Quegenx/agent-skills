import {
  faq_answer_facebook_account,
  faq_question_facebook_account,
  pricing_faq_answer_cancel,
  pricing_faq_answer_choose,
  pricing_faq_answer_payment,
  pricing_faq_question_cancel,
  pricing_faq_question_choose,
  pricing_faq_question_payment,
} from "#/paraglide/messages";

import type { FaqPageJsonLdItem } from "../../shared/layout/page/faq-page-json-ld";

/**
 * The pricing page's FAQ, shown in its accordion and in its FAQPage schema.
 *
 * @returns The questions and answers, in the page's language.
 */
export const getPricingFaqItems = (): readonly FaqPageJsonLdItem[] => [
  {
    answer: pricing_faq_answer_payment(),
    question: pricing_faq_question_payment(),
  },
  {
    answer: pricing_faq_answer_choose(),
    question: pricing_faq_question_choose(),
  },
  {
    answer: faq_answer_facebook_account(),
    question: faq_question_facebook_account(),
  },
  {
    answer: pricing_faq_answer_cancel(),
    question: pricing_faq_question_cancel(),
  },
];
