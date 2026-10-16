import {
  pricing_payment_note,
  pricing_plans_description,
  pricing_plans_title,
  pricing_plans_title_muted,
} from "#/paraglide/messages";

import { ScrollReveal } from "../../shared/motion/scroll-reveal";
import { cn } from "../../shared/styles/site-class-merge";
import { typography } from "../../shared/styles/typography";
import { MarketingStorySection } from "../../widgets/marketing-story/marketing-story";
import { pricingPageStyles as styles } from "./pricing-page.styles";
import { PricingPlanCard } from "./pricing-plan-card";
import { getPricingPlans } from "./pricing-plans-data";

/**
 * The three plans side by side, each revealed on its own like the story
 * cards on the product pages, with the payment note under them.
 *
 * @returns The plans section.
 */
export const PricingPlans = () => (
  <MarketingStorySection
    description={pricing_plans_description()}
    mutedText={pricing_plans_title_muted()}
    title={pricing_plans_title()}
  >
    <div className={styles.plans}>
      {getPricingPlans().map((plan) => (
        <ScrollReveal key={plan.id} className={styles.planReveal}>
          <PricingPlanCard plan={plan} />
        </ScrollReveal>
      ))}
    </div>
    <ScrollReveal>
      <p className={cn(typography.marketingBodyCompact, styles.note)}>
        {pricing_payment_note()}
      </p>
    </ScrollReveal>
  </MarketingStorySection>
);
