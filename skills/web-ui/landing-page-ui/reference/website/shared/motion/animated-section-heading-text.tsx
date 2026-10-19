import { useInView, useReducedMotion } from "motion/react";
import { Fragment, useRef } from "react";

import { animatedSectionHeadingTextStyles as styles } from "./animated-section-heading-text.styles";
import { AnimatedWordReveal } from "./animated-word-reveal";

interface HeadingSegment {
  muted: boolean;
  separatorBefore: string;
  text: string;
}

interface AnimatedSectionHeadingTextProps {
  mutedText: string;
  text: string;
}

const leadingWhitespacePattern = /^\s/u;
const trailingWhitespacePattern = /\s$/u;
const countWords = (text: string) => text.match(/\S+/gu)?.length ?? 0;

const splitHeadingText = (
  text: string,
  mutedText: string
): HeadingSegment[] => {
  const mutedStart = text.indexOf(mutedText);

  if (mutedStart === -1) {
    throw new Error("Section heading muted text must exist in its title");
  }

  const mutedEnd = mutedStart + mutedText.length;
  const textBefore = text.slice(0, mutedStart);
  const textAfter = text.slice(mutedEnd);

  return [
    { muted: false, separatorBefore: "", text: textBefore.trim() },
    {
      muted: true,
      separatorBefore: trailingWhitespacePattern.test(textBefore) ? " " : "",
      text: mutedText.trim(),
    },
    {
      muted: false,
      separatorBefore: leadingWhitespacePattern.test(textAfter) ? " " : "",
      text: textAfter.trim(),
    },
  ].filter((segment) => segment.text.length > 0);
};

/**
 * Shared Customers-style word reveal and tonal emphasis for section H2s.
 *
 * @returns The heading's text, its muted part dimmer, revealed once in view.
 */
export const AnimatedSectionHeadingText = ({
  mutedText,
  text,
}: AnimatedSectionHeadingTextProps) => {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const isVisible = useInView(wrapperRef, { once: true });
  const reducedMotion = Boolean(useReducedMotion());
  const segments = splitHeadingText(text, mutedText);

  const segmentWordOffsets = segments.map((_, segmentIndex) =>
    segments
      .slice(0, segmentIndex)
      .reduce((total, segment) => total + countWords(segment.text), 0)
  );

  return (
    <span ref={wrapperRef}>
      {segments.map((segment, index) => (
        <Fragment key={segment.text}>
          {segment.separatorBefore}
          <AnimatedWordReveal
            delay={0.3 + segmentWordOffsets[index] * 0.05}
            isVisible={isVisible}
            prefersReducedMotion={reducedMotion}
            text={segment.text}
            wordClassName={segment.muted ? styles.mutedWord : styles.word}
            wrap
          />
        </Fragment>
      ))}
    </span>
  );
};
