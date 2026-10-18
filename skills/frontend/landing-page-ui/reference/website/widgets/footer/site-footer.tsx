import { HugeiconsIcon } from "@hugeicons/react";
import type { MouseEvent } from "react";

import {
  footer_cookie_settings,
  footer_home_aria,
  footer_legal_text,
  footer_nav_label,
} from "#/paraglide/messages";
import { getLocale, localizeHref } from "#/paraglide/runtime";

import { isNonEmptyText } from "../../../../backend/shared/text/non-empty-text";
import { ScrollReveal } from "../../shared/motion/scroll-reveal";
import { trackAnalyticsEvent } from "../../shared/site/google-analytics";
import { cn } from "../../shared/styles/site-class-merge";
import { typography } from "../../shared/styles/typography";
import { AppLockup } from "../../shared/ui/brand/app-lockup";
import { reopenCookieConsent } from "../cookie-consent/cookie-consent-banner";
import { getSiteFooterGroups } from "./site-footer-links";
import { SiteFooterReveal } from "./site-footer-reveal";
import { siteFooterStyles as styles } from "./site-footer.styles";

const footerConversionHrefs = new Set([
  "/business",
  "/contact",
  "/personal",
  "/pricing",
]);

const trackFooterNavigation = (event: MouseEvent<HTMLAnchorElement>) => {
  const destination = event.currentTarget.dataset.analyticsDestination;

  if (!isNonEmptyText(destination)) {
    return;
  }

  if (!footerConversionHrefs.has(destination)) {
    return;
  }

  trackAnalyticsEvent("navigation_cta_clicked", {
    cta_location: "footer",
    destination,
    locale: getLocale(),
  });
};

/**
 * The website's footer: the logo, the link groups and the cookie settings
 * control.
 *
 * @returns The footer.
 */
export const SiteFooter = () => {
  const groups = getSiteFooterGroups();

  return (
    <SiteFooterReveal>
      <section className={styles.wrapper}>
        <div className={styles.footer}>
          <div className={styles.body}>
            <ScrollReveal className={styles.brandColumn}>
              <a
                aria-label={footer_home_aria()}
                href={localizeHref("/")}
                className={styles.logoWrapper}
              >
                <AppLockup size="large" tone="onDark" />
              </a>
            </ScrollReveal>
            <ScrollReveal className={styles.navColumn}>
              <nav aria-label={footer_nav_label()}>
                <ul className={styles.navLists}>
                  {groups.map((group) => (
                    <li key={group.title} className={styles.navGroup}>
                      <h2 className={cn(typography.label, styles.navTitle)}>
                        {group.title}
                      </h2>
                      <ul className={styles.navList}>
                        {group.links.map((link) => (
                          <li key={link.href} className={styles.navListItem}>
                            <a
                              data-analytics-destination={link.href}
                              href={localizeHref(link.href)}
                              onClick={trackFooterNavigation}
                              className={cn(typography.label, styles.link)}
                            >
                              <span className={styles.linkWithIcon}>
                                <span
                                  aria-hidden="true"
                                  className={styles.linkIcon}
                                >
                                  <HugeiconsIcon
                                    icon={link.icon}
                                    size={20}
                                    strokeWidth={1.5}
                                  />
                                </span>
                                {link.label}
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </nav>
            </ScrollReveal>
          </div>
          <ScrollReveal className={styles.legalRegion}>
            <div className={cn(typography.legal, styles.legalText)}>
              {footer_legal_text()}
            </div>
            <button
              onClick={reopenCookieConsent}
              type="button"
              className={cn(typography.legal, styles.cookieSettings)}
            >
              {footer_cookie_settings()}
            </button>
          </ScrollReveal>
        </div>
      </section>
    </SiteFooterReveal>
  );
};
