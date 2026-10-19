import { a as MotionA } from "motion/react-m";

import {
  platform_card_agent_description,
  platform_card_agent_title,
  platform_card_alerts_description,
  platform_card_alerts_title,
  platform_card_business_description,
  platform_card_business_title,
  platform_card_competitors_description,
  platform_card_competitors_title,
  platform_card_control_description,
  platform_card_control_title,
  platform_card_personal_description,
  platform_card_personal_title,
} from "#/paraglide/messages";
import { localizeHref } from "#/paraglide/runtime";
import type { LocalizedString } from "#/paraglide/runtime";

import { ScrollReveal } from "../../../shared/motion/scroll-reveal";
import { cn } from "../../../shared/styles/site-class-merge";
import { typography } from "../../../shared/styles/typography";
import {
  HoverArrowTrack,
  useHoverArrowMotion,
} from "../../../shared/ui/hover-arrow/hover-arrow-track";
import { HomePlatformMetricIcon } from "./home-platform-metric-icon";
import type { HomePlatformMetricIconName } from "./home-platform-metric-icon";
import { homePlatformMetricStyles } from "./home-platform-metrics.styles";

interface HomePlatformMetric {
  description: () => LocalizedString;
  href: string;
  icon: HomePlatformMetricIconName;
  title: () => LocalizedString;
}

const metrics: readonly HomePlatformMetric[] = [
  {
    description: platform_card_agent_description,
    href: "/ai-agent",
    icon: "agent",
    title: platform_card_agent_title,
  },
  {
    description: platform_card_personal_description,
    href: "/personal",
    icon: "personal",
    title: platform_card_personal_title,
  },
  {
    description: platform_card_business_description,
    href: "/business",
    icon: "business",
    title: platform_card_business_title,
  },
  {
    description: platform_card_alerts_description,
    href: "/monitoring",
    icon: "alerts",
    title: platform_card_alerts_title,
  },
  {
    description: platform_card_competitors_description,
    href: "/competitors",
    icon: "competitors",
    title: platform_card_competitors_title,
  },
  {
    description: platform_card_control_description,
    href: "/help",
    icon: "control",
    title: platform_card_control_title,
  },
];

const HomePlatformMetricCard = ({ metric }: { metric: HomePlatformMetric }) => {
  const arrowMotion = useHoverArrowMotion();

  return (
    <MotionA
      href={localizeHref(metric.href)}
      onBlur={arrowMotion.handleBlur}
      onFocus={arrowMotion.handleFocus}
      onMouseEnter={arrowMotion.handleMouseEnter}
      onMouseLeave={arrowMotion.handleMouseLeave}
      className={homePlatformMetricStyles.card}
    >
      <div className={homePlatformMetricStyles.cardHeader}>
        <span className={homePlatformMetricStyles.icon}>
          <HomePlatformMetricIcon name={metric.icon} />
        </span>
        <HoverArrowTrack
          arrowIsMoving={arrowMotion.arrowIsMoving}
          buttonClassName={homePlatformMetricStyles.arrow}
          isActive={arrowMotion.isActive}
          onAnimationComplete={arrowMotion.handleAnimationComplete}
          prefersReducedMotion={arrowMotion.prefersReducedMotion}
        />
      </div>
      <div className={homePlatformMetricStyles.text}>
        <h3
          className={cn(typography.heading3, homePlatformMetricStyles.heading)}
        >
          {metric.title()}
        </h3>
        <p
          className={cn(
            typography.marketingBodyCompact,
            homePlatformMetricStyles.description
          )}
        >
          {metric.description()}
        </p>
      </div>
    </MotionA>
  );
};

/**
 * The home platform section's metric cards, each revealed on scroll.
 *
 * @returns The cards.
 */
export const HomePlatformMetrics = () => (
  <div className={homePlatformMetricStyles.cards}>
    {metrics.map((metric) => (
      <ScrollReveal key={metric.icon}>
        <HomePlatformMetricCard metric={metric} />
      </ScrollReveal>
    ))}
  </div>
);
