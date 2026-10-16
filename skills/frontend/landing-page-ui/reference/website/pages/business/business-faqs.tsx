import {
  business_faqs_title,
  business_faqs_title_muted,
  faq_section_show_less,
  faq_section_show_more,
} from "#/paraglide/messages";

import { MarketingExpandableFaqSection } from "../home/faq/marketing-expandable-faq-section";
import { getBusinessFaqItems } from "./business-faqs-data";

const getShowMoreLabel = (count: number) => faq_section_show_more({ count });

/**
 * The business page's FAQ, with show more and less.
 *
 * @returns The FAQ section.
 */
export const BusinessFaqs = () => (
  <MarketingExpandableFaqSection
    items={getBusinessFaqItems()}
    mutedTitle={business_faqs_title_muted()}
    showLessLabel={faq_section_show_less()}
    showMoreLabel={getShowMoreLabel}
    title={business_faqs_title()}
  />
);
