import {
  ai_agent_faq_answer_actions,
  ai_agent_faq_answer_chats,
  ai_agent_faq_answer_context,
  ai_agent_faq_answer_requests,
  ai_agent_faq_question_actions,
  ai_agent_faq_question_chats,
  ai_agent_faq_question_context,
  ai_agent_faq_question_requests,
  business_faq_answer_accounts,
  business_faq_answer_pace,
  business_faq_question_accounts,
  business_faq_question_pace,
  faq_answer_facebook_account,
  faq_answer_get_started,
  faq_answer_pricing,
  faq_answer_what_is_app,
  faq_page_answer_account_deletion,
  faq_page_answer_audience,
  faq_page_answer_connect,
  faq_page_answer_data_delete,
  faq_page_answer_data_storage,
  faq_page_question_account_deletion,
  faq_page_question_audience,
  faq_page_question_connect,
  faq_page_question_data_delete,
  faq_page_question_data_storage,
  faq_page_section_agent,
  faq_page_section_data,
  faq_page_section_facebook,
  faq_page_section_general,
  faq_page_section_monitoring,
  faq_question_facebook_account,
  faq_question_get_started,
  faq_question_pricing,
  faq_question_what_is_app,
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
  personal_faq_answer_posting,
  personal_faq_question_posting,
} from "#/paraglide/messages";

import type { FaqPageJsonLdItem } from "../../shared/layout/page/faq-page-json-ld";

interface FaqPageItem extends FaqPageJsonLdItem {
  id: string;
}

/**
 * One topic of the FAQ page: its id, title and questions.
 */
export interface FaqPageSection {
  id: string;
  items: FaqPageItem[];
  title: string;
}

/**
 * The FAQ page by topic. A question that a product page also answers uses
 * that page's message, so the answer is written once.
 *
 * @returns The FAQ page's sections, in the page's language.
 */
export const getFaqPageSections = (): FaqPageSection[] => [
  {
    id: "general",
    items: [
      {
        answer: faq_answer_what_is_app(),
        id: "general-what-is-app",
        question: faq_question_what_is_app(),
      },
      {
        answer: faq_page_answer_audience(),
        id: "general-audience",
        question: faq_page_question_audience(),
      },
      {
        answer: faq_answer_get_started(),
        id: "general-get-started",
        question: faq_question_get_started(),
      },
      {
        answer: faq_answer_pricing(),
        id: "general-pricing",
        question: faq_question_pricing(),
      },
    ],
    title: faq_page_section_general(),
  },
  {
    id: "facebook",
    items: [
      {
        answer: faq_answer_facebook_account(),
        id: "facebook-account",
        question: faq_question_facebook_account(),
      },
      {
        answer: faq_page_answer_connect(),
        id: "facebook-connect",
        question: faq_page_question_connect(),
      },
      {
        answer: business_faq_answer_accounts(),
        id: "facebook-accounts",
        question: business_faq_question_accounts(),
      },
      {
        answer: personal_faq_answer_posting(),
        id: "facebook-posting",
        question: personal_faq_question_posting(),
      },
      {
        answer: business_faq_answer_pace(),
        id: "facebook-pace",
        question: business_faq_question_pace(),
      },
    ],
    title: faq_page_section_facebook(),
  },
  {
    id: "agent",
    items: [
      {
        answer: ai_agent_faq_answer_requests(),
        id: "agent-requests",
        question: ai_agent_faq_question_requests(),
      },
      {
        answer: ai_agent_faq_answer_actions(),
        id: "agent-actions",
        question: ai_agent_faq_question_actions(),
      },
      {
        answer: ai_agent_faq_answer_context(),
        id: "agent-context",
        question: ai_agent_faq_question_context(),
      },
      {
        answer: ai_agent_faq_answer_chats(),
        id: "agent-chats",
        question: ai_agent_faq_question_chats(),
      },
    ],
    title: faq_page_section_agent(),
  },
  {
    id: "monitoring",
    items: [
      {
        answer: monitoring_faq_answer_opportunity(),
        id: "monitoring-opportunity",
        question: monitoring_faq_question_opportunity(),
      },
      {
        answer: monitoring_faq_answer_frequency(),
        id: "monitoring-frequency",
        question: monitoring_faq_question_frequency(),
      },
      {
        answer: monitoring_faq_answer_groups(),
        id: "monitoring-groups",
        question: monitoring_faq_question_groups(),
      },
      {
        answer: monitoring_faq_answer_threshold(),
        id: "monitoring-threshold",
        question: monitoring_faq_question_threshold(),
      },
      {
        answer: monitoring_faq_answer_statuses(),
        id: "monitoring-statuses",
        question: monitoring_faq_question_statuses(),
      },
    ],
    title: faq_page_section_monitoring(),
  },
  {
    id: "data",
    items: [
      {
        answer: faq_page_answer_data_storage(),
        id: "data-storage",
        question: faq_page_question_data_storage(),
      },
      {
        answer: faq_page_answer_data_delete(),
        id: "data-delete",
        question: faq_page_question_data_delete(),
      },
      {
        answer: faq_page_answer_account_deletion(),
        id: "data-account-deletion",
        question: faq_page_question_account_deletion(),
      },
    ],
    title: faq_page_section_data(),
  },
];
