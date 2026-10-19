import { MarketingMotionPage } from "../../shared/layout/page/marketing-motion-page";
import { MonitoringCta } from "./monitoring-cta";
import { MonitoringFaqs } from "./monitoring-faqs";
import { MonitoringHero } from "./monitoring-hero";
import { monitoringPageStyles as styles } from "./monitoring-page.styles";
import { MonitoringStory } from "./monitoring-story";

/**
 * The monitoring marketing page: hero, story, FAQs and the closing call to
 * action.
 *
 * @returns The page.
 */
export const MonitoringPage = () => (
  <MarketingMotionPage className={styles.main}>
    <MonitoringHero />
    <MonitoringStory />
    <MonitoringFaqs />
    <MonitoringCta />
  </MarketingMotionPage>
);
