import {
  monitoring_faq_answer_frequency,
  monitoring_faq_answer_groups,
  monitoring_faq_answer_opportunity,
  monitoring_faq_answer_statuses,
  monitoring_faq_answer_threshold,
  monitoring_faq_question_frequency,
  monitoring_faq_question_groups,
  monitoring_faq_question_opportunity,
  monitoring_faq_question_statuses,
  monitoring_faq_question_threshold,
} from "#/paraglide/messages";

import type { FaqPageJsonLdItem } from "../../shared/layout/page/faq-page-json-ld";

/**
 * The monitoring page's FAQ, shown in its accordion and in its FAQPage schema.
 *
 * @returns The questions and answers, in the page's language.
 */
export const getMonitoringFaqItems = (): readonly FaqPageJsonLdItem[] => [
  {
    answer: monitoring_faq_answer_opportunity(),
    question: monitoring_faq_question_opportunity(),
  },
  {
    answer: monitoring_faq_answer_frequency(),
    question: monitoring_faq_question_frequency(),
  },
  {
    answer: monitoring_faq_answer_groups(),
    question: monitoring_faq_question_groups(),
  },
  {
    answer: monitoring_faq_answer_threshold(),
    question: monitoring_faq_question_threshold(),
  },
  {
    answer: monitoring_faq_answer_statuses(),
    question: monitoring_faq_question_statuses(),
  },
];
