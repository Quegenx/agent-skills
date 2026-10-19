import { MarketingMotionPage } from "../../shared/layout/page/marketing-motion-page";
import { PersonalCta } from "./personal-cta";
import { PersonalFaqs } from "./personal-faqs";
import { PersonalHero } from "./personal-hero";
import { personalPageStyles as styles } from "./personal-page.styles";
import { PersonalStory } from "./personal-story";

/**
 * App for people searching for themselves: homes, jobs, deals.
 *
 * @returns The page.
 */
export const PersonalPage = () => (
  <MarketingMotionPage className={styles.main}>
    <PersonalHero />
    <PersonalStory />
    <PersonalFaqs />
    <PersonalCta />
  </MarketingMotionPage>
);
