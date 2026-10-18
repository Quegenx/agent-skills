import { constVoid } from "effect/Function";
import {
  AnimatePresence,
  domAnimation,
  LazyMotion,
  useReducedMotion,
} from "motion/react";
import { section as MotionSection } from "motion/react-m";
import { useLayoutEffect, useRef, useSyncExternalStore } from "react";

import {
  cookie_consent_accept,
  cookie_consent_deny,
  cookie_consent_description,
  cookie_consent_policy,
  cookie_consent_region_label,
} from "#/paraglide/messages";
import { localizeHref } from "#/paraglide/runtime";

import { updateAnalyticsConsent } from "../../shared/site/google-analytics";
import { cn } from "../../shared/styles/site-class-merge";
import { typography } from "../../shared/styles/typography";
import { Button } from "../../shared/ui/button/button";
import { cookieConsentBannerStyles as styles } from "./cookie-consent-banner.styles";
import type { CookieConsentDecision } from "./cookie-consent-storage";
import {
  cookieConsentStorageKey,
  getCookieConsent,
  legacyCookieConsentStorageKey,
  setCookieConsent,
} from "./cookie-consent-storage";

const cookieConsentChangeEvent = "app-cookie-consent-change";

const subscribeToCookieConsent = (onStoreChange: () => void) => {
  const handleStorage = (event: StorageEvent) => {
    if (
      event.key === cookieConsentStorageKey ||
      event.key === legacyCookieConsentStorageKey
    ) {
      onStoreChange();
    }
  };

  window.addEventListener(cookieConsentChangeEvent, onStoreChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(cookieConsentChangeEvent, onStoreChange);
    window.removeEventListener("storage", handleStorage);
  };
};

// Reading window.localStorage itself throws when storage is blocked.
const readLocalStorage = () => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

// Holds the choice for this page view when storage is blocked, so the banner
// still closes after Accept or Deny.
let pageViewCookieConsent: CookieConsentDecision | null = null;

// True while the visitor has reopened the banner to change a stored choice;
// this tab only.
let isCookieConsentReopened = false;

const getCookieConsentReopenedSnapshot = () => isCookieConsentReopened;
const getCookieConsentReopenedServerSnapshot = () => false;

const getCookieConsentSnapshot = () => {
  const storage = readLocalStorage();
  const stored = storage === null ? null : getCookieConsent(storage);

  return stored ?? pageViewCookieConsent;
};
const getCookieConsentServerSnapshot = () => null;

const chooseCookieConsent = (decision: CookieConsentDecision) => {
  pageViewCookieConsent = decision;
  isCookieConsentReopened = false;
  const storage = readLocalStorage();

  if (storage !== null) {
    setCookieConsent(storage, decision);
  }
  updateAnalyticsConsent(decision === "accepted");
  window.dispatchEvent(new Event(cookieConsentChangeEvent));
};

const handleAcceptCookies = () => {
  chooseCookieConsent("accepted");
};

const handleDenyCookies = () => {
  chooseCookieConsent("denied");
};

/**
 * Reopens the cookie banner so the visitor can change or withdraw their choice
 * (GDPR Art. 7(3): "It shall be as easy to withdraw as to give consent",
 * https://eur-lex.europa.eu/eli/reg/2016/679/oj). The stored choice holds until
 * they pick again.
 */
export const reopenCookieConsent = () => {
  isCookieConsentReopened = true;
  window.dispatchEvent(new Event(cookieConsentChangeEvent));
};

const cookieConsentOffsetCustomProperty = "--cookie-consent-offset";

/**
 * The website's cookie banner until the visitor chooses, and again when they
 * reopen it; accepting turns analytics on (Consent Mode).
 *
 * @returns The banner, or nothing once they chose.
 */
export const CookieConsentBanner = () => {
  const consent = useSyncExternalStore(
    subscribeToCookieConsent,
    getCookieConsentSnapshot,
    getCookieConsentServerSnapshot
  );

  const isReopened = useSyncExternalStore(
    subscribeToCookieConsent,
    getCookieConsentReopenedSnapshot,
    getCookieConsentReopenedServerSnapshot
  );

  const overlayRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isCookiePromptOpen = consent === null || isReopened;

  useLayoutEffect(() => {
    const overlay = overlayRef.current;

    if (!(isCookiePromptOpen && overlay)) {
      document.documentElement.style.removeProperty(
        cookieConsentOffsetCustomProperty
      );

      return constVoid;
    }

    const syncCookieConsentOffset = () => {
      document.documentElement.style.setProperty(
        cookieConsentOffsetCustomProperty,
        `${overlay.getBoundingClientRect().height}px`
      );
    };

    syncCookieConsentOffset();
    const observer = new ResizeObserver(syncCookieConsentOffset);
    observer.observe(overlay);

    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty(
        cookieConsentOffsetCustomProperty
      );
    };
  }, [isCookiePromptOpen]);

  return (
    <LazyMotion features={domAnimation} strict>
      <AnimatePresence>
        {isCookiePromptOpen ? (
          <MotionSection
            animate={{
              opacity: 1,
              y: 0,
            }}
            aria-label={cookie_consent_region_label()}
            aria-live="polite"
            exit={
              prefersReducedMotion === true
                ? {
                    opacity: 0,
                  }
                : {
                    opacity: 0,
                    scale: 0.94,
                    transition: {
                      duration: 0.2,
                      ease: [0.19, 1, 0.22, 1],
                    },
                  }
            }
            initial={
              prefersReducedMotion === true
                ? {
                    opacity: 0,
                  }
                : {
                    opacity: 0,
                    y: 20,
                  }
            }
            ref={overlayRef}
            transition={{
              // Reopened on request: no first-visit delay.
              delay: isReopened ? 0 : 1,
              duration: prefersReducedMotion === true ? 0.2 : 0.5,
              ease: [0.19, 1, 0.22, 1],
            }}
            className={styles.overlay}
          >
            <div className={styles.container}>
              <div className={styles.content}>
                <p className={cn(typography.label, styles.text)}>
                  {cookie_consent_description()}{" "}
                  <a
                    href={localizeHref("/privacy-policy#cookies")}
                    className={styles.link}
                  >
                    {cookie_consent_policy()}
                  </a>
                </p>
                <div className={styles.buttons}>
                  <Button
                    onClick={handleAcceptCookies}
                    size="small"
                    tone="solidInk"
                  >
                    {cookie_consent_accept()}
                  </Button>
                  <Button
                    onClick={handleDenyCookies}
                    size="small"
                    tone="solidInk"
                  >
                    {cookie_consent_deny()}
                  </Button>
                </div>
              </div>
            </div>
          </MotionSection>
        ) : null}
      </AnimatePresence>
    </LazyMotion>
  );
};
