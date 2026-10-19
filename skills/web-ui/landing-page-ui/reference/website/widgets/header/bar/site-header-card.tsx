import { HugeiconsIcon } from "@hugeicons/react";

import { localizeHref } from "#/paraglide/runtime";

import type { SiteNavigationSection } from "../../../shared/navigation/site-navigation-items";
import { cn } from "../../../shared/styles/site-class-merge";
import { typography } from "../../../shared/styles/typography";
import { siteHeaderStyles as styles } from "./site-header.styles";

interface SiteHeaderCardProps {
  currentPath: string;
  onNavigate: () => void;
  section: SiteNavigationSection;
}

/**
 * One section of the header menu as a card of links, the current page marked.
 *
 * @param props - section: the navigation section; currentPath: the page's path;
 *   onNavigate: closes the menu.
 * @returns The card.
 */
export const SiteHeaderCard = ({
  currentPath,
  onNavigate,
  section,
}: SiteHeaderCardProps) => (
  <section className={styles.card}>
    <h2 className={cn(typography.marketingCardTitle, styles.cardTitle)}>
      {section.title()}
    </h2>
    <div className={styles.cardLinks}>
      {section.items.map((item) => {
        const href = localizeHref(item.href);
        const isCurrent = currentPath === href;

        return (
          <a
            aria-current={isCurrent ? "page" : undefined}
            href={href}
            key={item.href}
            onClick={onNavigate}
            className={cn(
              typography.label,
              styles.cardLink,
              isCurrent && styles.cardLinkCurrent
            )}
          >
            <HugeiconsIcon
              aria-hidden="true"
              icon={item.icon}
              size={17}
              strokeWidth={1.8}
            />
            <span>{item.title()}</span>
          </a>
        );
      })}
    </div>
  </section>
);
