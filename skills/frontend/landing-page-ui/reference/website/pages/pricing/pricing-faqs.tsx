import {
  faq_section_show_less,
  faq_section_show_more,
  pricing_faqs_title,
  pricing_faqs_title_muted,
} from "#/paraglide/messages";

import { MarketingExpandableFaqSection } from "../home/faq/marketing-expandable-faq-section";
import { getPricingFaqItems } from "./pricing-faqs-data";

const getShowMoreLabel = (count: number) => faq_section_show_more({ count });

/**
 * The pricing page's FAQ, with show more and less.
 *
 * @returns The FAQ section.
 */
export const PricingFaqs = () => (
  <MarketingExpandableFaqSection
    items={getPricingFaqItems()}
    mutedTitle={pricing_faqs_title_muted()}
    showLessLabel={faq_section_show_less()}
    showMoreLabel={getShowMoreLabel}
    title={pricing_faqs_title()}
  />
);
