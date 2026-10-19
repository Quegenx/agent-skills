import { MarketingMotionPage } from "../../shared/layout/page/marketing-motion-page";
import { CompetitorsCta } from "./competitors-cta";
import { CompetitorsFaqs } from "./competitors-faqs";
import { CompetitorsHero } from "./competitors-hero";
import { competitorsPageStyles as styles } from "./competitors-page.styles";
import { CompetitorsStory } from "./competitors-story";

/**
 * The competitors marketing page: hero, story, FAQs and the closing call to
 * action.
 *
 * @returns The page.
 */
export const CompetitorsPage = () => (
  <MarketingMotionPage className={styles.main}>
    <CompetitorsHero />
    <CompetitorsStory />
    <CompetitorsFaqs />
    <CompetitorsCta />
  </MarketingMotionPage>
);
