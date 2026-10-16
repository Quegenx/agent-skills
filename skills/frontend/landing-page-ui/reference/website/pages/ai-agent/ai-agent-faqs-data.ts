import {
  ai_agent_faq_answer_actions,
  ai_agent_faq_answer_chats,
  ai_agent_faq_answer_context,
  ai_agent_faq_answer_privacy,
  ai_agent_faq_answer_requests,
  ai_agent_faq_question_actions,
  ai_agent_faq_question_chats,
  ai_agent_faq_question_context,
  ai_agent_faq_question_privacy,
  ai_agent_faq_question_requests,
} from "#/paraglide/messages";

import type { FaqPageJsonLdItem } from "../../shared/layout/page/faq-page-json-ld";

/**
 * The AI agent page's FAQ, shown in its accordion and in its FAQPage schema.
 *
 * @returns The questions and answers, in the page's language.
 */
export const getAiAgentFaqItems = (): readonly FaqPageJsonLdItem[] => [
  {
    answer: ai_agent_faq_answer_requests(),
    question: ai_agent_faq_question_requests(),
  },
  {
    answer: ai_agent_faq_answer_actions(),
    question: ai_agent_faq_question_actions(),
  },
  {
    answer: ai_agent_faq_answer_context(),
    question: ai_agent_faq_question_context(),
  },
  {
    answer: ai_agent_faq_answer_chats(),
    question: ai_agent_faq_question_chats(),
  },
  {
    answer: ai_agent_faq_answer_privacy(),
    question: ai_agent_faq_question_privacy(),
  },
];
