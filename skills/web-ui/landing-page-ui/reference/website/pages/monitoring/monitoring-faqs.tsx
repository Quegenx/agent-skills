import {
  faq_section_show_less,
  faq_section_show_more,
  monitoring_faqs_title,
  monitoring_faqs_title_muted,
} from "#/paraglide/messages";

import { MarketingExpandableFaqSection } from "../home/faq/marketing-expandable-faq-section";
import { getMonitoringFaqItems } from "./monitoring-faqs-data";

const getShowMoreLabel = (count: number) => faq_section_show_more({ count });

/**
 * The monitoring page's FAQ, with show more and less.
 *
 * @returns The FAQ section.
 */
export const MonitoringFaqs = () => (
  <MarketingExpandableFaqSection
    items={getMonitoringFaqItems()}
    mutedTitle={monitoring_faqs_title_muted()}
    showLessLabel={faq_section_show_less()}
    showMoreLabel={getShowMoreLabel}
    title={monitoring_faqs_title()}
  />
);
