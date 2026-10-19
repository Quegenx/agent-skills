import {
  faq_section_show_less,
  faq_section_show_more,
  personal_faqs_title,
  personal_faqs_title_muted,
} from "#/paraglide/messages";

import { MarketingExpandableFaqSection } from "../home/faq/marketing-expandable-faq-section";
import { getPersonalFaqItems } from "./personal-faqs-data";

const getShowMoreLabel = (count: number) => faq_section_show_more({ count });

/**
 * The personal page's FAQ, with show more and less.
 *
 * @returns The FAQ section.
 */
export const PersonalFaqs = () => (
  <MarketingExpandableFaqSection
    items={getPersonalFaqItems()}
    mutedTitle={personal_faqs_title_muted()}
    showLessLabel={faq_section_show_less()}
    showMoreLabel={getShowMoreLabel}
    title={personal_faqs_title()}
  />
);
