import {
  faq_answer_get_started,
  faq_answer_facebook_account,
  faq_answer_pricing,
  faq_answer_what_is_app,
  faq_question_get_started,
  faq_question_facebook_account,
  faq_question_pricing,
  faq_question_what_is_app,
} from "#/paraglide/messages";

interface HomeFaqItem {
  answer: string;
  question: string;
}

/**
 * Homepage FAQ pairs shown in the accordion and copied into FAQPage JSON-LD.
 *
 * @returns The questions and answers, in the page's language.
 */
export const getHomeFaqItems = (): readonly HomeFaqItem[] => [
  {
    answer: faq_answer_what_is_app(),
    question: faq_question_what_is_app(),
  },
  {
    answer: faq_answer_facebook_account(),
    question: faq_question_facebook_account(),
  },
  {
    answer: faq_answer_pricing(),
    question: faq_question_pricing(),
  },
  {
    answer: faq_answer_get_started(),
    question: faq_question_get_started(),
  },
];
