import { Tick02Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  app_action_sign_up,
  pricing_per_month,
  pricing_price_label,
} from "#/paraglide/messages";

import { isNonEmptyText } from "../../../../backend/shared/text/non-empty-text";
import {
  appSignUpHref,
  trackAppEntryClick,
} from "../../shared/navigation/app-links";
import { cn } from "../../shared/styles/site-class-merge";
import { typography } from "../../shared/styles/typography";
import { ButtonLink } from "../../shared/ui/button/button";
import { pricingPageStyles as styles } from "./pricing-page.styles";
import type { PricingPlan } from "./pricing-plans-data";

const handlePlanSignUpClick = () => {
  trackAppEntryClick("sign_up");
};

/**
 * One plan: who it is for, its monthly price, what it includes, and a
 * sign-up button. It uses the story-card surface of the product pages; the
 * recommended plan stands out by its badge and its solid button.
 *
 * @returns The plan's card.
 */
export const PricingPlanCard = ({ plan }: { plan: PricingPlan }) => (
  <article aria-labelledby={`pricing-plan-${plan.id}`} className={styles.plan}>
    <div className={styles.planHeader}>
      {/* The badge shares the name's line, so every plan's price lines up. */}
      <div className={styles.nameRow}>
        <h2
          id={`pricing-plan-${plan.id}`}
          className={cn(typography.marketingCardTitle, styles.name)}
        >
          {plan.name}
        </h2>
        {isNonEmptyText(plan.badge) ? (
          <span className={cn(typography.label, styles.badge)}>
            {plan.badge}
          </span>
        ) : null}
      </div>
      <p className={cn(typography.marketingBodyCompact, styles.audience)}>
        {plan.audience}
      </p>
    </div>
    <p className={styles.price}>
      <span className={typography.visuallyHidden}>
        {pricing_price_label({ price: plan.price })}
      </span>
      <span
        aria-hidden="true"
        className={cn(typography.marketingPageHeading, styles.priceAmount)}
      >
        ₪{plan.price}
      </span>
      <span
        aria-hidden="true"
        className={cn(typography.marketingBodyCompact, styles.pricePeriod)}
      >
        {pricing_per_month()}
      </span>
    </p>
    <ul className={styles.features}>
      {plan.features.map((feature) => (
        <li
          key={feature}
          className={cn(typography.marketingBodyCompact, styles.feature)}
        >
          <HugeiconsIcon
            aria-hidden="true"
            icon={Tick02Icon}
            size={20}
            className={styles.featureIcon}
          />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
    <ButtonLink
      href={appSignUpHref()}
      onClick={handlePlanSignUpClick}
      size="large"
      className={styles.action}
      tone={isNonEmptyText(plan.badge) ? "solidInk" : "softAccent"}
    >
      {app_action_sign_up()}
    </ButtonLink>
  </article>
);
