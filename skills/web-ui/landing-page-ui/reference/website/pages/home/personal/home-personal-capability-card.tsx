import { HugeiconsIcon } from "@hugeicons/react";
import { a as MotionA } from "motion/react-m";

import { cn } from "../../../shared/styles/site-class-merge";
import { surfaces } from "../../../shared/styles/surfaces";
import { typography } from "../../../shared/styles/typography";
import {
  HoverArrowTrack,
  useHoverArrowMotion,
} from "../../../shared/ui/hover-arrow/hover-arrow-track";
import { homePersonalCapabilityCardStyles as styles } from "./home-personal-capability-card.styles";
import type { getHomePersonalCapabilities } from "./home-personal-capability-data";

interface HomePersonalCapabilityCardProps {
  capability: ReturnType<typeof getHomePersonalCapabilities>[number];
}

/**
 * One of the home page's personal capability cards, linking to its page, its
 * arrow moving on hover.
 *
 * @param props - capability: the card's name, description, statistic, icon and
 *   link.
 * @returns The card's link.
 */
export const HomePersonalCapabilityCard = ({
  capability,
}: HomePersonalCapabilityCardProps) => {
  const arrowMotion = useHoverArrowMotion();

  return (
    <MotionA
      data-card="true"
      dir="auto"
      href={capability.href}
      initial="rest"
      onBlur={arrowMotion.handleBlur}
      onFocus={arrowMotion.handleFocus}
      onMouseEnter={arrowMotion.handleMouseEnter}
      onMouseLeave={arrowMotion.handleMouseLeave}
      transition={{ duration: 0.15, ease: "easeIn", type: "tween" }}
      whileHover="hover"
      className={cn(surfaces.outlinedRaised, styles.card)}
    >
      <span aria-hidden="true" className={styles.cardGlass} />
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <div className={styles.cardLogo}>
            <HugeiconsIcon
              aria-hidden="true"
              icon={capability.icon}
              size={28}
              className={styles.cardIcon}
            />
          </div>
          <span className={cn(typography.callout, styles.cardName)}>
            {capability.name}
          </span>
        </div>
        <div className={styles.cardBody}>
          <p
            className={cn(typography.marketingSectionHeading, styles.cardStat)}
          >
            {capability.stat}
          </p>
          <p
            className={cn(
              typography.marketingBodyCompact,
              styles.cardDescription
            )}
          >
            {capability.description}
          </p>
        </div>
      </div>
      <HoverArrowTrack
        arrowIsMoving={arrowMotion.arrowIsMoving}
        buttonClassName={styles.cardArrow}
        isActive={arrowMotion.isActive}
        onAnimationComplete={arrowMotion.handleAnimationComplete}
        prefersReducedMotion={arrowMotion.prefersReducedMotion}
      />
    </MotionA>
  );
};
