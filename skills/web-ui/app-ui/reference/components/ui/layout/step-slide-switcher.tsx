import { constVoid } from "effect/Function";
import {
  AnimatePresence,
  LazyMotion,
  MotionConfig,
  animate,
  domAnimation,
  m,
  useIsPresent,
} from "motion/react";
import { useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";

// tor-app's StepSlideSwitcher (lib/ui/core/motion/step_slide_switcher.dart)
// on the web: the outgoing step leaves through one side while the incoming
// one enters from the other, with a barely-there fade that completes early,
// on Apple's "smooth" spring (0.5s, no bounce) like its sheet motion.
// `reverse` flips the direction for going back; forward enters from the
// reading end (the left on an RTL page). The login card's steps and the
// settings dialog's sections slide with it. A step that changes direction mid-slide
// turns around from where it is. The card's height follows the incoming
// step on the same spring, so nothing jumps. Reduced motion keeps only the
// fade (MotionConfig "user").
const stepSlideSpring = { type: "spring", duration: 0.5, bounce: 0 } as const;
const stepSlideFade = { duration: 0.3, ease: "easeOut" } as const;

const stepSlide = {
  enter: (direction: number) => ({ x: `${direction * 100}%`, opacity: 0 }),
  center: { x: "0%", opacity: 1 },
  exit: (direction: number) => ({ x: `${direction * -100}%`, opacity: 0 }),
};

// An outgoing step stays visible while it slides out, but is inert and
// hidden from assistive tech, so only the incoming step's form is reachable.
const StepSlide = ({ children }: { children: ReactNode }) => {
  const isPresent = useIsPresent();

  return (
    <div inert={!isPresent} aria-hidden={!isPresent || undefined}>
      {children}
    </div>
  );
};

/**
 * Slides one step out and the next in when stepKey changes, forward or back,
 * from the side the page's direction says.
 *
 * @param props - stepKey: the step shown; reverse: whether the step goes back;
 *   dir: the page's direction; children: the step.
 * @returns The switcher.
 */
export const StepSlideSwitcher = ({
  stepKey,
  reverse,
  dir,
  children,
}: {
  stepKey: string;
  reverse: boolean;
  // The page's direction, which side forward enters from.
  dir: "rtl" | "ltr";
  children: ReactNode;
}) => {
  const direction = (reverse ? -1 : 1) * (dir === "rtl" ? -1 : 1);
  const frameRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // The incoming step is the only one in flow (popLayout takes the outgoing
  // one out), so the content box's height is the incoming step's. The frame
  // holds an explicit pixel height: set once on mount, then animated to each
  // new step's height, so the card grows or shrinks instead of jumping.
  useLayoutEffect(() => {
    const frame = frameRef.current;
    const content = contentRef.current;

    if (!(frame && content)) {
      return constVoid;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let measured = false;

    const observer = new ResizeObserver(([entry]) => {
      const height = `${entry.borderBoxSize[0]?.blockSize ?? content.offsetHeight}px`;

      if (!measured || reducedMotion.matches) {
        measured = true;
        frame.style.height = height;

        return;
      }

      animate(frame, { height }, stepSlideSpring);
    });

    observer.observe(content);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <div ref={frameRef}>
          {/* The outgoing step slides out positioned against this box. */}
          <div ref={contentRef} className="relative">
            <AnimatePresence
              initial={false}
              mode="popLayout"
              custom={direction}
            >
              <m.div
                key={stepKey}
                custom={direction}
                variants={stepSlide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ x: stepSlideSpring, opacity: stepSlideFade }}
              >
                <StepSlide>{children}</StepSlide>
              </m.div>
            </AnimatePresence>
          </div>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
};
