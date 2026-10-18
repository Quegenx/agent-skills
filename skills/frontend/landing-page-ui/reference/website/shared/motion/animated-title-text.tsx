import type { ClassValue } from "cn";
import { constVoid } from "effect/Function";
import { gsap } from "gsap";
import type { PointerEvent } from "react";
import { useEffect, useRef } from "react";

import { splitTextGraphemes } from "@/lib/split-text-graphemes";

import { cn } from "../styles/site-class-merge";
import { animatedTitleTextStyles as styles } from "./animated-title-text.styles";

interface AnimatedTitleSegment {
  as?: "span" | "sup";
  className?: ClassValue;
  letterClassName?: ClassValue;
  text: string;
}

interface AnimatedTitleLine {
  breakBefore?: boolean;
  className?: ClassValue;
  segments: readonly AnimatedTitleSegment[];
}

interface AnimatedTitleTextProps {
  lines?: readonly AnimatedTitleLine[];
  text?: string;
}

const rtlCharacter = /[\p{Script=Arabic}\p{Script=Hebrew}]/u;
const ltrCharacter = /[\p{Letter}\p{Number}]/u;
const titleToken = /\s+|\S+/gu;
const whitespaceToken = /^\s+$/u;

const animateTitleLetterEnter = (event: PointerEvent<HTMLSpanElement>) => {
  gsap.to(event.currentTarget, {
    duration: 0.22,
    ease: "back.out(2.8)",
    scaleX: 1.08,
    scaleY: 0.82,
    y: 6,
  });
};

const animateTitleLetterLeave = (event: PointerEvent<HTMLSpanElement>) => {
  gsap.to(event.currentTarget, {
    duration: 0.42,
    ease: "elastic.out(1, 0.48)",
    scaleX: 1,
    scaleY: 1,
    y: 0,
  });
};

const addOccurrenceKeys = <Item,>(
  items: readonly Item[],
  getFingerprint: (item: Item) => string
) => {
  const occurrences = new Map<string, number>();

  return items.map((item) => {
    const fingerprint = getFingerprint(item);
    const occurrence = (occurrences.get(fingerprint) ?? 0) + 1;
    occurrences.set(fingerprint, occurrence);

    return { item, key: `${fingerprint}-${occurrence}` };
  });
};

interface DirectionalTextRun {
  direction: "ltr" | "rtl";
  text: string;
}

const getCharacterDirection = (
  character: string
): DirectionalTextRun["direction"] | null => {
  if (rtlCharacter.test(character)) {
    return "rtl";
  }

  if (ltrCharacter.test(character)) {
    return "ltr";
  }

  return null;
};

const splitDirectionalTextRuns = (text: string): DirectionalTextRun[] => {
  const runs: DirectionalTextRun[] = [];
  let baseDirection: DirectionalTextRun["direction"] | null = null;
  let direction: DirectionalTextRun["direction"] | null = null;
  let pendingNeutralText = "";
  let runText = "";

  for (const character of text) {
    const characterDirection = getCharacterDirection(character);

    if (!characterDirection) {
      pendingNeutralText += character;
    } else if (direction === null) {
      baseDirection = characterDirection;
      direction = characterDirection;
      runText = pendingNeutralText + character;
      pendingNeutralText = "";
    } else if (characterDirection === direction) {
      runText += pendingNeutralText + character;
      pendingNeutralText = "";
    } else {
      runs.push({ direction, text: runText + pendingNeutralText });
      direction = characterDirection;
      pendingNeutralText = "";
      runText = character;
    }
  }

  if (direction) {
    if (pendingNeutralText && direction !== baseDirection) {
      runs.push(
        { direction, text: runText },
        {
          direction: baseDirection ?? direction,
          text: pendingNeutralText,
        }
      );
    } else {
      runs.push({ direction, text: runText + pendingNeutralText });
    }
  } else if (pendingNeutralText) {
    runs.push({ direction: "ltr", text: pendingNeutralText });
  }

  return runs;
};

const AnimatedTitleLetters = ({
  segment,
}: {
  segment: AnimatedTitleSegment;
}) => {
  const Segment = segment.as ?? "span";

  return (
    <Segment className={cn(segment.className)}>
      {addOccurrenceKeys(
        splitDirectionalTextRuns(segment.text),
        (run) => `${run.direction}-${run.text}`
      ).map(({ item: run, key: runKey }) => (
        <bdi dir={run.direction} key={runKey}>
          {addOccurrenceKeys(
            run.text.match(titleToken) ?? [],
            (token) => token
          ).map(({ item: token, key: tokenKey }) => {
            if (whitespaceToken.test(token)) {
              return <span key={tokenKey}>{token}</span>;
            }

            return (
              <span
                data-animated-title-word=""
                key={tokenKey}
                className={styles.word}
              >
                {addOccurrenceKeys(
                  splitTextGraphemes(token),
                  (character) => character
                ).map(({ item: character, key: characterKey }) => (
                  <span
                    data-animated-title-letter=""
                    key={characterKey}
                    onPointerEnter={animateTitleLetterEnter}
                    onPointerLeave={animateTitleLetterLeave}
                    className={cn(styles.letter, segment.letterClassName)}
                  >
                    {character}
                  </span>
                ))}
              </span>
            );
          })}
        </bdi>
      ))}
    </Segment>
  );
};

/**
 * BunUI-style elastic letter entrance and hover response for page titles.
 *
 * @returns The title, its letters revealed in turn, with its plain text for
 *   screen readers.
 */
export const AnimatedTitleText = ({ lines, text }: AnimatedTitleTextProps) => {
  const visualTextRef = useRef<HTMLSpanElement>(null);

  const resolvedLines = lines ?? [
    { segments: [{ text: text ?? "" }] } satisfies AnimatedTitleLine,
  ];

  const accessibleText = resolvedLines
    .map((line) => line.segments.map((segment) => segment.text).join(""))
    .join(" ")
    .trim();

  useEffect(() => {
    const lineElements = visualTextRef.current?.querySelectorAll(
      "[data-animated-title-line]"
    );

    if (lineElements === undefined) {
      return constVoid;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(
        visualTextRef.current?.querySelectorAll(
          "[data-animated-title-letter]"
        ) ?? [],
        { opacity: 1 }
      );

      return constVoid;
    }

    // The entrance tweens live in one gsap.context so unmounting reverts them;
    // hover tweens start from pointer events outside it, so they are killed
    // by target on cleanup. The letters are read now: React has already
    // cleared visualTextRef when this effect's unmount cleanup runs.
    const letters =
      visualTextRef.current?.querySelectorAll("[data-animated-title-letter]") ??
      [];
    const context = gsap.context(() => {
      for (const lineElement of lineElements) {
        gsap.fromTo(
          lineElement.querySelectorAll("[data-animated-title-letter]"),
          {
            opacity: 0,
            rotate: () => gsap.utils.random(-8, 8),
            scaleY: 0.72,
            y: 18,
          },
          {
            duration: 0.72,
            ease: "elastic.out(1, 0.62)",
            opacity: 1,
            rotate: 0,
            scaleY: 1,
            stagger: { amount: 0.48, from: "start" },
            y: 0,
          }
        );
      }
    }, visualTextRef.current ?? undefined);

    return () => {
      gsap.killTweensOf(letters);
      context.revert();
    };
  }, []);

  return (
    <>
      <span className={styles.screenReaderText}>{accessibleText}</span>
      <span aria-hidden="true" ref={visualTextRef}>
        {addOccurrenceKeys(resolvedLines, (line) =>
          line.segments.map((segment) => segment.text).join("")
        ).map(({ item: line, key: lineKey }) => (
          <span
            data-animated-title-line=""
            key={lineKey}
            className={cn(line.className)}
          >
            {line.breakBefore === true ? <br /> : null}
            {addOccurrenceKeys(line.segments, (segment) => segment.text).map(
              ({ item: segment, key: segmentKey }) => (
                <AnimatedTitleLetters key={segmentKey} segment={segment} />
              )
            )}
          </span>
        ))}
      </span>
    </>
  );
};
