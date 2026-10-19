import {
  ai_agent_faqs_title,
  ai_agent_faqs_title_muted,
  faq_section_show_less,
  faq_section_show_more,
} from "#/paraglide/messages";

import { MarketingExpandableFaqSection } from "../home/faq/marketing-expandable-faq-section";
import { getAiAgentFaqItems } from "./ai-agent-faqs-data";

const getShowMoreLabel = (count: number) => faq_section_show_more({ count });

/**
 * The AI agent page's FAQ, with show more and less.
 *
 * @returns The FAQ section.
 */
export const AiAgentFaqs = () => (
  <MarketingExpandableFaqSection
    items={getAiAgentFaqItems()}
    mutedTitle={ai_agent_faqs_title_muted()}
    showLessLabel={faq_section_show_less()}
    showMoreLabel={getShowMoreLabel}
    title={ai_agent_faqs_title()}
  />
);
