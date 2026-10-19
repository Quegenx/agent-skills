import type { ClassValue } from "cn";
import { useReducedMotion } from "motion/react";
import { span as MotionSpan } from "motion/react-m";
import { Fragment } from "react";

import { cn } from "../styles/site-class-merge";

const wordRevealHidden = { opacity: 0, rotate: 0, rotateX: -45, y: "50%" };
const wordRevealVisible = { opacity: 1, rotate: 0, rotateX: 0, y: 0 };
const wordRevealEase = [0.19, 1, 0.22, 1] as const;

interface AnimatedWordRevealProps {
  animateHidden?: boolean;
  delay?: number;
  isVisible?: boolean;
  prefersReducedMotion?: boolean | null;
  text: string;
  wordClassName: ClassValue;
  wrap?: boolean;
}

/**
 * Reveals localized text word by word while preserving its original whitespace.
 *
 * @returns The words, wrapped in a span when wrap is set.
 */
export const AnimatedWordReveal = ({
  animateHidden = false,
  delay = 0.3,
  isVisible = true,
  prefersReducedMotion: reducedMotionOverride,
  text,
  wordClassName,
  wrap = false,
}: AnimatedWordRevealProps) => {
  const systemPrefersReducedMotion = useReducedMotion();

  const prefersReducedMotion =
    reducedMotionOverride ?? systemPrefersReducedMotion;

  const words = Array.from(text.matchAll(/\S+/gu), (match) => ({
    id: `${match[0]}-${match.index}`,
    text: match[0],
  }));

  const visibleAnimation = isVisible ? wordRevealVisible : undefined;

  const wordAnimation =
    animateHidden && !isVisible ? wordRevealHidden : visibleAnimation;

  const content = words.map((word, index) => (
    <Fragment key={word.id}>
      {index > 0 ? " " : null}
      <MotionSpan
        animate={wordAnimation}
        initial={wordRevealHidden}
        transition={
          prefersReducedMotion === true
            ? { duration: 0 }
            : {
                delay: delay + index * 0.05,
                duration: 0.937,
                ease: wordRevealEase,
              }
        }
        className={cn(wordClassName)}
      >
        {word.text}
      </MotionSpan>
    </Fragment>
  ));

  if (wrap) {
    return <span>{content}</span>;
  }

  return content;
};
