import type { ClassValue } from "cn";
import type { ReactNode, Ref } from "react";

import { layouts } from "../../styles/layouts";
import { cn } from "../../styles/site-class-merge";
import { marketingContentSectionStyles as styles } from "./marketing-content-section.styles";

interface MarketingContentSectionProps {
  children: ReactNode;
  intro?: boolean;
  ref?: Ref<HTMLElement>;
  className?: ClassValue;
}

/**
 * A marketing page's content section: its centered inner column, with the first
 * section's spacing when it opens the page.
 *
 * @param props - children; intro: whether it is the page's first section; ref;
 *   className: extra classes.
 * @returns The section.
 */
export const MarketingContentSection = ({
  children,
  intro = false,
  ref,
  className,
}: MarketingContentSectionProps) => (
  <section
    data-alternate-styling="false"
    data-full-width="false"
    ref={ref}
    className={cn(
      layouts.centeredColumn,
      layouts.sectionBlockPadding,
      styles.section,
      intro && styles.introSection,
      className
    )}
  >
    <div className={styles.inner}>{children}</div>
  </section>
);

interface MarketingContentSectionHeaderProps {
  children: ReactNode;
  grouped?: boolean;
  ref?: Ref<HTMLDivElement>;
}

/**
 * A content section's centered header, its children grouped in one column when
 * asked.
 *
 * @param props - children; grouped: whether to group them; ref.
 * @returns The header.
 */
export const MarketingContentSectionHeader = ({
  children,
  grouped = false,
  ref,
}: MarketingContentSectionHeaderProps) => (
  <header data-align="center" data-variant="primary" className={styles.header}>
    <div ref={ref} className={styles.headerContent}>
      {grouped ? (
        <div className={styles.headingGroup}>{children}</div>
      ) : (
        children
      )}
    </div>
  </header>
);
