import {
  personal_faq_answer_account,
  personal_faq_answer_membership,
  personal_faq_answer_posting,
  personal_faq_answer_price,
  personal_faq_question_account,
  personal_faq_question_membership,
  personal_faq_question_posting,
  personal_faq_question_price,
} from "#/paraglide/messages";

import type { FaqPageJsonLdItem } from "../../shared/layout/page/faq-page-json-ld";

/**
 * The personal page's FAQ, shown in its accordion and in its FAQPage schema.
 *
 * @returns The questions and answers, in the page's language.
 */
export const getPersonalFaqItems = (): readonly FaqPageJsonLdItem[] => [
  {
    answer: personal_faq_answer_membership(),
    question: personal_faq_question_membership(),
  },
  {
    answer: personal_faq_answer_posting(),
    question: personal_faq_question_posting(),
  },
  {
    answer: personal_faq_answer_account(),
    question: personal_faq_question_account(),
  },
  {
    answer: personal_faq_answer_price(),
    question: personal_faq_question_price(),
  },
];
