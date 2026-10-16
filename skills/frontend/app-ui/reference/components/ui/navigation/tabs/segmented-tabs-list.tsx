import { Tabs } from "@base-ui/react/tabs";
import { constVoid } from "effect/Function";
import {
  LazyMotion,
  animate,
  domAnimation,
  useMotionValue,
  useReducedMotion,
  useTransform,
  useVelocity,
} from "motion/react";
import type { MotionStyle, MotionValue } from "motion/react";
import { div as MotionDiv, span as MotionSpan } from "motion/react-m";
import { useLayoutEffect, useRef, useState } from "react";
import type { ComponentProps } from "react";

// vibe-code-resources' sliding tabs (components/ui/sliding-tabs.tsx), 1:1 in
// motion, in our colors (a white pill on the tinted track): the chosen tab's
// pill springs to it (stiffness 420, damping 32) and stretches like jelly
// with its speed, narrowing up to 35% and growing up to 21% taller at
// 1000px/s, and the list squashes while pressed (103% by 94%).
const segmentedTabsSpring = {
  type: "spring",
  stiffness: 420,
  damping: 32,
  mass: 1,
} as const;

const segmentedTabsTapSpring = {
  type: "spring",
  stiffness: 500,
  damping: 20,
} as const;

const segmentedTabsMaxStretchVelocity = 1000;
const segmentedTabsStretch = 0.7;

/**
 * A Base UI Tabs.List in the segmented-tabs track, with the sliding pill;
 * index is the chosen tab's position among its tabs.
 *
 * @returns The tabs list with its pill.
 */
export const SegmentedTabsList = ({
  index,
  children,
  ...props
}: ComponentProps<typeof Tabs.List> & { index: number }) => {
  const reducedMotion = useReducedMotion();
  const listRef = useRef<HTMLDivElement>(null);
  // The pill mounts after the first measurement, as sliding-tabs.tsx does:
  // motion values set before it mounts never reach its style.
  const [placed, setPlaced] = useState(false);
  // Only a tab the person picks springs the pill; any other change (the
  // saved view arriving after load, a reset) puts it in place at once.
  const pickedRef = useRef(false);
  const left = useMotionValue(0);
  const width = useMotionValue(0);

  const distortion = useTransform(
    useVelocity(left),
    (velocity) =>
      Math.min(Math.abs(velocity) / segmentedTabsMaxStretchVelocity, 1) *
      segmentedTabsStretch
  );

  const pillStyle: MotionStyle &
    Record<`--${string}`, MotionValue<number> | MotionValue<string>> = {
    "--segmented-tabs-pill-x": useTransform(left, (value) => `${value}px`),
    "--segmented-tabs-pill-width": useTransform(width, (value) => `${value}px`),
    "--segmented-tabs-pill-scale-x": useTransform(
      distortion,
      (amount) => 1 - amount * 0.5
    ),
    "--segmented-tabs-pill-scale-y": useTransform(
      distortion,
      (amount) => 1 + amount * 0.3
    ),
  };

  useLayoutEffect(() => {
    const list = listRef.current;

    const place = (animated: boolean) => {
      const tab = list?.querySelectorAll<HTMLElement>('[role="tab"]')[index];

      if (!tab) {
        return;
      }

      if (!(animated && pickedRef.current) || reducedMotion === true) {
        left.set(tab.offsetLeft);
        width.set(tab.offsetWidth);
        setPlaced(true);

        return;
      }

      animate(left, tab.offsetLeft, segmentedTabsSpring);
      animate(width, tab.offsetWidth, segmentedTabsSpring);
    };

    place(true);
    pickedRef.current = false;

    if (!list) {
      return constVoid;
    }

    const observer = new ResizeObserver(() => {
      place(false);
    });

    observer.observe(list);

    return () => {
      observer.disconnect();
    };
  }, [index, left, reducedMotion, width]);

  return (
    <LazyMotion features={domAnimation} strict>
      <Tabs.List
        {...props}
        ref={listRef}
        className="segmented-tabs"
        data-pill-placed={placed || undefined}
        onPointerDown={() => {
          pickedRef.current = true;
        }}
        onKeyDown={() => {
          pickedRef.current = true;
        }}
        render={
          <MotionDiv
            whileTap={
              reducedMotion === true
                ? undefined
                : { scaleX: 1.03, scaleY: 0.94 }
            }
            transition={segmentedTabsTapSpring}
          />
        }
      >
        {children}
        {placed && (
          <MotionSpan
            aria-hidden="true"
            className="segmented-tabs-pill"
            style={pillStyle}
          />
        )}
      </Tabs.List>
    </LazyMotion>
  );
};
