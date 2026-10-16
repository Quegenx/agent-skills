import { useLocation } from "@tanstack/react-router";
import type { MouseEvent } from "react";

import {
  header_language,
  header_language_english,
  header_language_hebrew,
} from "#/paraglide/messages";
import { getLocale } from "#/paraglide/runtime";

import { cn } from "../../../shared/styles/site-class-merge";
import { typography } from "../../../shared/styles/typography";
import {
  getSiteHeaderLocaleHref,
  removeLocaleHrefFragment,
} from "../locale/site-header-locale-href";
import type { SiteHeaderLocaleValue } from "../locale/site-header-locale-href";
import { SiteHeaderLocaleMark } from "../locale/site-header-locale-mark";
import { siteHeaderStyles as styles } from "./site-header.styles";

interface SiteHeaderSettingsCardProps {
  onLocaleSelect: (locale: SiteHeaderLocaleValue) => void;
}

/**
 * The header menu's settings card: the language choice, each linking to this
 * page in that language.
 *
 * @param props - onLocaleSelect: told the language chosen, to run the
 *   transition.
 * @returns The card.
 */
export const SiteHeaderSettingsCard = ({
  onLocaleSelect,
}: SiteHeaderSettingsCardProps) => {
  const location = useLocation();
  const locale = getLocale();
  const currentHref = removeLocaleHrefFragment(location.href);

  const selectLocale =
    (nextLocale: SiteHeaderLocaleValue) =>
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();

      if (nextLocale !== locale) {
        onLocaleSelect(nextLocale);
      }
    };

  return (
    <section className={styles.card}>
      <h2 className={cn(typography.marketingCardTitle, styles.cardTitle)}>
        {header_language()}
      </h2>
      <div className={styles.cardLinks}>
        <a
          aria-current={locale === "he" ? "true" : undefined}
          href={getSiteHeaderLocaleHref(currentHref, "he")}
          onClick={selectLocale("he")}
          className={cn(
            typography.label,
            styles.cardLink,
            locale === "he" && styles.cardLinkCurrent
          )}
        >
          <SiteHeaderLocaleMark locale="he" />
          {header_language_hebrew()}
        </a>
        <a
          aria-current={locale === "en" ? "true" : undefined}
          href={getSiteHeaderLocaleHref(currentHref, "en")}
          onClick={selectLocale("en")}
          className={cn(
            typography.label,
            styles.cardLink,
            locale === "en" && styles.cardLinkCurrent
          )}
        >
          <SiteHeaderLocaleMark locale="en" />
          {header_language_english()}
        </a>
      </div>
    </section>
  );
};
