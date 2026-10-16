import type { HTMLMotionProps } from "motion/react";
import { domAnimation, LazyMotion } from "motion/react";
import {
  div as MotionDiv,
  hr as MotionHr,
  span as MotionSpan,
} from "motion/react-m";

type ScrollRevealProps = Omit<
  HTMLMotionProps<"div">,
  "initial" | "transition" | "viewport" | "whileInView"
> & {
  viewportAmount?: number;
};

const scrollRevealMotion = {
  initial: { filter: "blur(8px)", opacity: 0 },
  transition: { duration: 0.8, ease: "easeOut" },
  whileInView: { filter: "blur(0px)", opacity: 1 },
} satisfies Pick<
  HTMLMotionProps<"div">,
  "initial" | "transition" | "whileInView"
>;

/**
 * Reusable Gimo-style reveal that repeats as content enters the viewport.
 *
 * @returns The content, fading up as it scrolls into view.
 */
export const ScrollReveal = ({
  children,
  viewportAmount = 0.3,
  ...props
}: ScrollRevealProps) => (
  <LazyMotion features={domAnimation} strict>
    <MotionDiv
      {...scrollRevealMotion}
      viewport={{ amount: viewportAmount }}
      {...props}
    >
      {children}
    </MotionDiv>
  </LazyMotion>
);

type ScrollRevealSeparatorProps = Omit<
  HTMLMotionProps<"hr">,
  "initial" | "transition" | "viewport" | "whileInView"
> & {
  as?: "hr" | "span";
  enabled?: boolean;
  viewportAmount?: number;
};

/**
 * A separator line that draws in as it scrolls into view, or a plain one when
 * disabled.
 *
 * @param props - as: the element (hr by default); enabled: whether it animates;
 *   viewportAmount: how much must be in view; the rest go to the element.
 * @returns The separator.
 */
export const ScrollRevealSeparator = ({
  as = "hr",
  enabled = true,
  viewportAmount = 0.3,
  ...props
}: ScrollRevealSeparatorProps) => {
  if (!enabled) {
    return (
      <LazyMotion features={domAnimation} strict>
        {as === "span" ? <MotionSpan {...props} /> : <MotionHr {...props} />}
      </LazyMotion>
    );
  }

  const motionProps = {
    ...scrollRevealMotion,
    viewport: { amount: viewportAmount },
    ...props,
  };

  return (
    <LazyMotion features={domAnimation} strict>
      {as === "span" ? (
        <MotionSpan {...motionProps} />
      ) : (
        <MotionHr {...motionProps} />
      )}
    </LazyMotion>
  );
};
