import { useLocation } from "@tanstack/react-router";
import { domAnimation, LazyMotion, useReducedMotion } from "motion/react";
import { div as MotionDiv } from "motion/react-m";
import { useEffect, useState, useSyncExternalStore } from "react";

import {
  app_action_log_in,
  app_action_sign_up,
  header_close_menu,
  header_home_aria,
  header_nav_main,
  header_open_menu,
  header_skip_to_content,
} from "#/paraglide/messages";
import { localizeHref } from "#/paraglide/runtime";

import {
  appLoginHref,
  appSignUpHref,
  trackAppEntryClick,
} from "../../../shared/navigation/app-links";
import { siteNavigationSections } from "../../../shared/navigation/site-navigation-items";
import { cn } from "../../../shared/styles/site-class-merge";
import { typography } from "../../../shared/styles/typography";
import { ButtonLink } from "../../../shared/ui/button/button";
import type { SiteHeaderLocaleValue } from "../locale/site-header-locale-href";
import { SiteHeaderLocaleTransition } from "../locale/site-header-locale-transition";
import { SiteHeaderThemeSwitcher } from "../theme/site-header-theme-switcher";
import type { SiteTheme } from "../theme/site-theme";
import {
  getServerSiteThemeSnapshot,
  getSiteThemeSnapshot,
  initializeSiteTheme,
  setSiteThemeWithCircleTransition,
  subscribeSiteTheme,
} from "../theme/site-theme";
import { SiteHeaderCard } from "./site-header-card";
import { SiteHeaderLogo } from "./site-header-logo";
import { useSiteHeaderMenu } from "./site-header-menu-motion";
import { SiteHeaderSettingsCard } from "./site-header-settings-card";
import { siteHeaderStyles as styles } from "./site-header.styles";

const widthSpring = { damping: 25, stiffness: 500, type: "spring" as const };

const handleHeaderSignUpClick = () => {
  trackAppEntryClick("sign_up");
};

const handleHeaderLogInClick = () => {
  trackAppEntryClick("log_in");
};

/**
 * The website's header: the logo, the menu with its navigation cards and
 * settings, the theme switch and the app's actions; its shell contracts once
 * the page scrolls.
 *
 * @returns The header.
 */
export const SiteHeader = () => {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  const [pendingLocale, setPendingLocale] =
    useState<SiteHeaderLocaleValue | null>(null);

  const theme = useSyncExternalStore(
    subscribeSiteTheme,
    getSiteThemeSnapshot,
    getServerSiteThemeSnapshot
  );

  const reducedMotion = useReducedMotion();

  const { isExpanded, navRef, contentRef, closeMenu, toggleMenu } =
    useSiteHeaderMenu(reducedMotion);

  // Scrolled once the page moves past its first 4px: a 4px marker at the
  // document's top leaves the viewport then.
  useEffect(() => {
    const marker = document.createElement("div");
    marker.setAttribute("aria-hidden", "true");
    Object.assign(marker.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "1px",
      height: "4px",
      pointerEvents: "none",
      visibility: "hidden",
    });
    document.body.prepend(marker);

    const observer = new IntersectionObserver(([entry]) => {
      setIsScrolled(entry !== undefined && !entry.isIntersecting);
    });

    observer.observe(marker);

    return () => {
      observer.disconnect();
      marker.remove();
    };
  }, []);

  useEffect(() => {
    const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

    return initializeSiteTheme(
      document.documentElement,
      window.localStorage,
      colorSchemeQuery
    );
  }, []);

  const toggleTheme = () => {
    const nextTheme: SiteTheme = theme === "dark" ? "light" : "dark";
    setSiteThemeWithCircleTransition(
      document,
      window.localStorage,
      nextTheme,
      reducedMotion === true
    );
  };

  const selectLocale = (nextLocale: SiteHeaderLocaleValue) => {
    closeMenu();
    setPendingLocale(nextLocale);
  };

  return (
    <LazyMotion features={domAnimation} strict>
      <a href="#main-content" className={cn(typography.body, styles.skipLink)}>
        {header_skip_to_content()}
      </a>
      <header className={styles.header}>
        <MotionDiv
          animate={{ maxWidth: isScrolled ? "68.75rem" : "75rem" }}
          initial={false}
          transition={widthSpring}
          className={cn(styles.shell, isScrolled && styles.shellScrolled)}
        >
          <nav
            aria-label={header_nav_main()}
            ref={navRef}
            className={styles.nav}
          >
            <div className={styles.topBar}>
              <div className={styles.headerActions}>
                <button
                  aria-expanded={isExpanded}
                  aria-label={
                    isExpanded ? header_close_menu() : header_open_menu()
                  }
                  onClick={toggleMenu}
                  type="button"
                  className={styles.hamburger}
                >
                  <span
                    className={cn(
                      styles.hamburgerLine,
                      isExpanded && styles.hamburgerLineTopOpen
                    )}
                  />
                  <span
                    className={cn(
                      styles.hamburgerLine,
                      isExpanded && styles.hamburgerLineBottomOpen
                    )}
                  />
                </button>
                <SiteHeaderThemeSwitcher onToggle={toggleTheme} theme={theme} />
                <ButtonLink
                  href={appSignUpHref()}
                  onClick={handleHeaderSignUpClick}
                  size="small"
                  tone="solidInk"
                >
                  {app_action_sign_up()}
                </ButtonLink>
                <ButtonLink
                  href={appLoginHref()}
                  onClick={handleHeaderLogInClick}
                  size="small"
                  className={styles.logInAction}
                  tone="softAccent"
                >
                  {app_action_log_in()}
                </ButtonLink>
              </div>
              <a
                aria-label={header_home_aria()}
                href={localizeHref("/")}
                onClick={closeMenu}
                className={styles.logo}
              >
                <SiteHeaderLogo />
              </a>
            </div>
            <div
              inert={!isExpanded}
              ref={contentRef}
              className={cn(
                styles.cards,
                isExpanded ? styles.cardsVisible : styles.cardsHidden
              )}
            >
              {siteNavigationSections.map((section) => (
                <SiteHeaderCard
                  currentPath={location.pathname}
                  key={section.id}
                  onNavigate={closeMenu}
                  section={section}
                />
              ))}
              <SiteHeaderSettingsCard onLocaleSelect={selectLocale} />
            </div>
          </nav>
        </MotionDiv>
      </header>
      <SiteHeaderLocaleTransition targetLocale={pendingLocale} />
    </LazyMotion>
  );
};
