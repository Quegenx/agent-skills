import { MarketingMotionPage } from "../../shared/layout/page/marketing-motion-page";
import { BusinessCta } from "./business-cta";
import { BusinessFaqs } from "./business-faqs";
import { BusinessHero } from "./business-hero";
import { businessPageStyles as styles } from "./business-page.styles";
import { BusinessStory } from "./business-story";

/**
 * App for businesses: leads, market and competitors on Facebook.
 *
 * @returns The page.
 */
export const BusinessPage = () => (
  <MarketingMotionPage className={styles.main}>
    <BusinessHero />
    <BusinessStory />
    <BusinessFaqs />
    <BusinessCta />
  </MarketingMotionPage>
);
