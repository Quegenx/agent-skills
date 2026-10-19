import {
  competitors_faqs_title,
  competitors_faqs_title_muted,
  faq_section_show_less,
  faq_section_show_more,
} from "#/paraglide/messages";

import { MarketingExpandableFaqSection } from "../home/faq/marketing-expandable-faq-section";
import { getCompetitorsFaqItems } from "./competitors-faqs-data";

const getShowMoreLabel = (count: number) => faq_section_show_more({ count });

/**
 * The competitors page's FAQ, with show more and less.
 *
 * @returns The FAQ section.
 */
export const CompetitorsFaqs = () => (
  <MarketingExpandableFaqSection
    items={getCompetitorsFaqItems()}
    mutedTitle={competitors_faqs_title_muted()}
    showLessLabel={faq_section_show_less()}
    showMoreLabel={getShowMoreLabel}
    title={competitors_faqs_title()}
  />
);
