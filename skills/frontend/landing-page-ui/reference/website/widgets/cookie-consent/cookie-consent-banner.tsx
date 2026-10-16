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
  setCookieConsent,
} from "./cookie-consent-storage";

const cookieConsentChangeEvent = "app-cookie-consent-change";

const subscribeToCookieConsent = (onStoreChange: () => void) => {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === cookieConsentStorageKey) {
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

const getCookieConsentSnapshot = () => getCookieConsent(window.localStorage);
const getCookieConsentServerSnapshot = () => null;

const chooseCookieConsent = (decision: CookieConsentDecision) => {
  setCookieConsent(window.localStorage, decision);
  updateAnalyticsConsent(decision === "accepted");
  window.dispatchEvent(new Event(cookieConsentChangeEvent));
};

const handleAcceptCookies = () => {
  chooseCookieConsent("accepted");
};

const handleDenyCookies = () => {
  chooseCookieConsent("denied");
};

const cookieConsentOffsetCustomProperty = "--cookie-consent-offset";

/**
 * The website's cookie banner until the visitor chooses; accepting turns
 * analytics on (Consent Mode).
 *
 * @returns The banner, or nothing once they chose.
 */
export const CookieConsentBanner = () => {
  const consent = useSyncExternalStore(
    subscribeToCookieConsent,
    getCookieConsentSnapshot,
    getCookieConsentServerSnapshot
  );

  const overlayRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isCookiePromptOpen = consent === null;

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
              delay: 1,
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
                    className={styles.denyButton}
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
