import { constVoid } from "effect/Function";
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { RefObject } from "react";
import { flushSync } from "react-dom";

// GSAP does not parse a "cubic-bezier(...)" string; CustomEase takes the four numbers.
gsap.registerPlugin(CustomEase);
const menuEase = CustomEase.create("site-header-menu", "0.23,1,0.32,1");

const readRef = <T>(ref: RefObject<T | null>) => ref.current;

/**
 * The site header's menu (site-header.tsx): the nav grows to its cards'
 * height and the cards fade up in turn (GSAP), rebuilt on resize, and it
 * closes on Escape, on a press outside, or reversed faster.
 *
 * @param reducedMotion - Whether the visitor prefers reduced motion.
 * @returns Whether the menu is open, the nav's and content's refs, and
 *   closeMenu and toggleMenu.
 */
export const useSiteHeaderMenu = (reducedMotion: boolean | null) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLElement[]>([]);
  const timelineRef = useRef<gsap.core.Timeline>(null);

  const calculateHeight = () => {
    const content = readRef(contentRef);

    if (window.matchMedia("(min-width: 64rem)").matches) {
      let maxCardHeight = 0;

      for (const card of cardsRef.current) {
        maxCardHeight = Math.max(maxCardHeight, card.scrollHeight);
      }

      return maxCardHeight > 0 ? 68 + maxCardHeight + 24 : 300;
    }

    if (content === null) {
      return 300;
    }

    const previousStyles = {
      height: content.style.height,
      pointerEvents: content.style.pointerEvents,
      position: content.style.position,
      visibility: content.style.visibility,
    };

    Object.assign(content.style, {
      height: "auto",
      pointerEvents: "auto",
      position: "static",
      visibility: "visible",
    });
    const topBar = window.matchMedia("(min-width: 40rem)").matches ? 68 : 60;
    const height = topBar + content.scrollHeight + 16;
    Object.assign(content.style, previousStyles);

    return height;
  };

  const createTimeline = useEffectEvent(() => {
    const nav = readRef(navRef);

    if (nav === null) {
      return null;
    }

    const initialHeight = window.matchMedia("(min-width: 40rem)").matches
      ? 68
      : 60;

    gsap.set(nav, { height: initialHeight, overflow: "hidden" });
    gsap.set(cardsRef.current, {
      opacity: 0,
      y: reducedMotion === true ? 0 : 8,
    });

    return gsap
      .timeline({ paused: true })
      .to(nav, {
        duration: reducedMotion === true ? 0.15 : 0.22,
        ease: menuEase,
        height: calculateHeight,
      })
      .to(
        cardsRef.current,
        {
          duration: reducedMotion === true ? 0.15 : 0.18,
          ease: menuEase,
          opacity: 1,
          stagger: reducedMotion === true ? 0 : 0.03,
          y: 0,
        },
        reducedMotion === true ? "-=0.15" : "-=0.08"
      );
  });

  useLayoutEffect(() => {
    cardsRef.current = [
      ...(contentRef.current?.querySelectorAll<HTMLElement>(":scope > *") ??
        []),
    ];
  });

  // Every tween lives in one gsap.context, so cleanup reverts the inline
  // height and overflow GSAP set on the nav instead of leaving them behind.
  const contextRef = useRef<gsap.Context | null>(null);

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      timelineRef.current = createTimeline();
    });
    contextRef.current = context;

    return () => {
      context.revert();
      contextRef.current = null;
      timelineRef.current = null;
    };
  }, []);

  const rebuildTimeline = useEffectEvent(() => {
    const timeline = readRef(timelineRef);
    timeline?.kill();

    if (isExpanded) {
      gsap.set(navRef.current, { height: calculateHeight() });
    }

    const nextTimeline =
      contextRef.current?.add(() => createTimeline()) ?? createTimeline();

    if (nextTimeline && isExpanded) {
      nextTimeline.progress(1);
    }

    timelineRef.current = nextTimeline;
  });

  // The menu's height follows the page's width (its breakpoint and how its
  // links wrap); a change of height alone leaves it as it is.
  useLayoutEffect(() => {
    const page = document.documentElement;
    let width = page.clientWidth;

    const observer = new ResizeObserver(() => {
      if (page.clientWidth !== width) {
        width = page.clientWidth;
        rebuildTimeline();
      }
    });

    observer.observe(page);

    return () => {
      observer.disconnect();
    };
  }, []);

  const closeMenu = () => {
    const timeline = readRef(timelineRef);

    if (!(timeline && isExpanded)) {
      return;
    }

    timeline.timeScale(1.35);
    timeline.eventCallback("onReverseComplete", () => {
      setIsExpanded(false);
    });
    timeline.reverse();
  };

  const closeMenuFromDocument = useEffectEvent(closeMenu);

  const toggleMenu = () => {
    const timeline = readRef(timelineRef);

    if (!timeline) {
      return;
    }

    if (isExpanded) {
      closeMenu();

      return;
    }

    flushSync(() => {
      setIsExpanded(true);
    });
    timeline.timeScale(1);
    timeline.play(0);
  };

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenuFromDocument();
      }
    };

    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => {
    if (!isExpanded) {
      return constVoid;
    }

    const closeOnOutsidePointer = (event: PointerEvent) => {
      const nav = readRef(navRef);

      if (nav && event.target instanceof Node && !nav.contains(event.target)) {
        closeMenuFromDocument();
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer, true);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer, true);
    };
  }, [isExpanded]);

  return { isExpanded, navRef, contentRef, closeMenu, toggleMenu };
};
