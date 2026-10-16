import { constVoid } from "effect/Function";
import { useReducedMotion } from "motion/react";
import { useEffect, useEffectEvent, useRef } from "react";
import type { RefObject } from "react";

import { setLocale } from "#/paraglide/runtime";

import { cn } from "../../../shared/styles/site-class-merge";
import { AppLockup } from "../../../shared/ui/brand/app-lockup";
import type { SiteHeaderLocaleValue } from "./site-header-locale-href";
import { siteHeaderLocaleTransitionStyles as styles } from "./site-header-locale-transition.styles";

const localeStairCount = 5;

const localeStairs = Array.from(
  { length: localeStairCount },
  (_, stair) => stair
);

const localeStairCoverDurationMs = 700;
const localeStairRevealDurationMs = 1100;

interface SiteHeaderLocaleTransitionProps {
  targetLocale?: SiteHeaderLocaleValue | null;
}

const localeTransitionStorageKey = "app-locale-transition";
const localeTransitionRevealValue = "reveal";

export const localeTransitionBootstrapScript = `(()=>{try{if(sessionStorage.getItem(${JSON.stringify(localeTransitionStorageKey)})===${JSON.stringify(localeTransitionRevealValue)})document.documentElement.dataset.localeTransition=${JSON.stringify(localeTransitionRevealValue)}}catch{}})()`;

const localeStairPhases = {
  // The stairs grow over the page one after another, the logo fading in.
  cover: {
    durationMs: localeStairCoverDurationMs,
    logo: { delay: 100, duration: 350, opacity: [0, 1] },
    stairDelay: (index: number) => 50 * index,
    stairHeight: ["0", "100%"],
  },
  // After the reload the stairs shrink back in reverse order, the logo first.
  reveal: {
    durationMs: localeStairRevealDurationMs,
    logo: { delay: 350, duration: 250, opacity: [1, 0] },
    stairDelay: (index: number) => 400 + 50 * (localeStairCount - 1 - index),
    stairHeight: ["100%", "0"],
  },
} as const;

const animateLocaleStairs = ({
  logo,
  onDone,
  phase,
  prefersReducedMotion,
  stairs,
}: {
  logo: HTMLElement | null;
  onDone: () => void;
  phase: keyof typeof localeStairPhases;
  prefersReducedMotion: boolean | null;
  stairs: HTMLElement[];
}) => {
  const {
    durationMs,
    logo: logoTiming,
    stairDelay,
    stairHeight,
  } = localeStairPhases[phase];

  const easing = "cubic-bezier(0.33, 1, 0.68, 1)";

  const stairAnimations = stairs.map((stair, index) =>
    stair.animate([{ height: stairHeight[0] }, { height: stairHeight[1] }], {
      delay: prefersReducedMotion === true ? 0 : stairDelay(index),
      duration: prefersReducedMotion === true ? 0 : 500,
      easing,
      fill: "forwards",
    })
  );

  const logoAnimation = logo?.animate(
    [{ opacity: logoTiming.opacity[0] }, { opacity: logoTiming.opacity[1] }],
    {
      delay: prefersReducedMotion === true ? 0 : logoTiming.delay,
      duration: prefersReducedMotion === true ? 0 : logoTiming.duration,
      easing,
      fill: "forwards",
    }
  );

  const doneTimer = window.setTimeout(
    onDone,
    prefersReducedMotion === true ? 0 : durationMs
  );

  return () => {
    for (const animation of stairAnimations) {
      animation.cancel();
    }

    logoAnimation?.cancel();
    window.clearTimeout(doneTimer);
  };
};

/**
 * The stairs' cover and reveal on an overlay marked with data-locale-stair
 * and data-locale-logo: covering for targetLocale, then switching to it
 * (paraglide's setLocale reloads in it); after that reload, the reveal. The
 * website header (SiteHeaderLocaleTransition) and the app sidebar
 * (AppLocaleTransition) draw their own overlays and share this. beforeSwitch
 * runs once the stairs cover the page, before the switch (the app saves
 * pending edits there). It returns the stairs to draw.
 *
 * @param overlayRef - The overlay with the stairs and the logo.
 * @param targetLocale - The language to switch to; nothing runs while it is
 *   empty.
 * @param beforeSwitch - Runs while the stairs cover the page, before the
 *   switch, such as saving unsaved settings.
 * @returns The stairs to draw, one element each.
 */
export const useLocaleStairTransition = (
  overlayRef: RefObject<HTMLDivElement | null>,
  targetLocale: SiteHeaderLocaleValue | null | undefined,
  beforeSwitch?: () => Promise<void>
) => {
  const prefersReducedMotion = useReducedMotion();

  const switchLocale = useEffectEvent(async (locale: SiteHeaderLocaleValue) => {
    try {
      await beforeSwitch?.();
    } catch {
      // The switch goes on: the stairs already cover the page.
    }

    try {
      sessionStorage.setItem(
        localeTransitionStorageKey,
        localeTransitionRevealValue
      );
    } catch {
      // Navigation still works when storage is unavailable.
    }

    void setLocale(locale);
  });

  useEffect(() => {
    // Effects run after commit, when the overlay div is mounted.
    const overlay = overlayRef.current;

    if (overlay === null) {
      return constVoid;
    }

    const stairs = [
      ...overlay.querySelectorAll<HTMLElement>("[data-locale-stair]"),
    ];

    const logo = overlay.querySelector<HTMLElement>("[data-locale-logo]");

    if (targetLocale) {
      return animateLocaleStairs({
        logo,
        onDone: () => {
          void switchLocale(targetLocale);
        },
        phase: "cover",
        prefersReducedMotion,
        stairs,
      });
    }

    if (
      document.documentElement.dataset.localeTransition !==
      localeTransitionRevealValue
    ) {
      return constVoid;
    }

    return animateLocaleStairs({
      logo,
      onDone: () => {
        delete document.documentElement.dataset.localeTransition;

        try {
          sessionStorage.removeItem(localeTransitionStorageKey);
        } catch {
          // The reveal can finish without storage access.
        }
      },
      phase: "reveal",
      prefersReducedMotion,
      stairs,
    });
  }, [overlayRef, prefersReducedMotion, targetLocale]);

  // The stairs to draw, one element each.
  return localeStairs;
};

/**
 * The website's language switch: stairs cover the page, the language changes
 * behind them, and they lift.
 *
 * @param props - targetLocale: the language to switch to, or empty while none
 *   is chosen.
 * @returns The overlay.
 */
export const SiteHeaderLocaleTransition = ({
  targetLocale,
}: SiteHeaderLocaleTransitionProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  useLocaleStairTransition(overlayRef, targetLocale);

  return (
    <div
      data-locale-transition-overlay
      ref={overlayRef}
      className={cn(styles.overlay, targetLocale && styles.overlayActive)}
    >
      <div className={styles.stairs}>
        {localeStairs.map((stair) => (
          <div
            data-locale-stair={stair}
            key={`locale-stair-${stair}`}
            className={cn(styles.stair, targetLocale && styles.stairCovering)}
          />
        ))}
      </div>
      <div
        aria-hidden="true"
        data-locale-logo
        // The English wordmark keeps its logo on the left in both languages.
        dir="ltr"
        className={cn(styles.logoWrap, targetLocale && styles.logoWrapCovering)}
      >
        <AppLockup size="large" tone="onDark" />
      </div>
    </div>
  );
};
