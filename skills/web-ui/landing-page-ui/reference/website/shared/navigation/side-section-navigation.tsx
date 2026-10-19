import { domMax, LazyMotion, useReducedMotion } from "motion/react";
import { span as MotionSpan } from "motion/react-m";

import { ScrollReveal } from "../motion/scroll-reveal";
import { cn } from "../styles/site-class-merge";
import { typography } from "../styles/typography";
import { sideSectionNavigationStyles as styles } from "./side-section-navigation.styles";

interface SideSectionNavigationItem {
  id: string;
  label: string;
}

interface SideSectionNavigationProps {
  activeItemId: string;
  indicatorLayoutId: string;
  items: readonly SideSectionNavigationItem[];
  label: string;
  reveal?: boolean;
}

/**
 * On-this-page rail with a shared sliding active indicator.
 *
 * @returns The navigation.
 */
export const SideSectionNavigation = ({
  activeItemId,
  indicatorLayoutId,
  items,
  label,
  reveal = true,
}: SideSectionNavigationProps) => {
  const prefersReducedMotion = useReducedMotion();

  const list = (
    <ul className={styles.list}>
      {items.map((item) => {
        const isActive = item.id === activeItemId;

        return (
          <li key={item.id} className={styles.item}>
            <a
              aria-current={isActive ? "location" : undefined}
              href={`#${item.id}`}
              className={styles.link}
            >
              {isActive ? (
                <MotionSpan
                  aria-hidden="true"
                  layoutId={indicatorLayoutId}
                  transition={
                    prefersReducedMotion === true
                      ? { duration: 0 }
                      : { damping: 30, stiffness: 400, type: "spring" }
                  }
                  className={styles.activeIndicator}
                />
              ) : null}
              <p
                className={cn(
                  typography.marketingBodyCompact,
                  styles.label,
                  isActive ? styles.labelActive : styles.labelInactive
                )}
              >
                {item.label}
              </p>
            </a>
          </li>
        );
      })}
    </ul>
  );

  return (
    <LazyMotion features={domMax} strict>
      <nav aria-label={label} className={styles.navigation}>
        {reveal ? (
          <ScrollReveal viewportAmount={0.1}>{list}</ScrollReveal>
        ) : (
          list
        )}
      </nav>
    </LazyMotion>
  );
};
