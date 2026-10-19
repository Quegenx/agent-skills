import { MarketingMotionPage } from "../../shared/layout/page/marketing-motion-page";
import { PricingCta } from "./pricing-cta";
import { PricingFaqs } from "./pricing-faqs";
import { PricingHero } from "./pricing-hero";
import { pricingPageStyles as styles } from "./pricing-page.styles";
import { PricingPlans } from "./pricing-plans";

/**
 * App's plans, built like the product pages: hero, plans, FAQ, CTA.
 *
 * @returns The page.
 */
export const PricingPage = () => (
  <MarketingMotionPage className={styles.main}>
    <PricingHero />
    <PricingPlans />
    <PricingFaqs />
    <PricingCta />
  </MarketingMotionPage>
);
