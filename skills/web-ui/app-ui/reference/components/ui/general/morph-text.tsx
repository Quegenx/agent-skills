import { cn } from "cn";
import { constVoid } from "effect/Function";
import { useEffect, useRef, useState } from "react";
import { useTextMorph } from "torph/react";
import type { TextMorphProps } from "torph/react";

type MorphTextProps = Omit<TextMorphProps, "children"> & {
  children: string | number;
};

type TextMorphTextProps = Omit<
  TextMorphProps,
  "children" | "as" | "cursorIndex" | "style"
> & {
  children: string;
};

// torph's root, as plain text: the same box (display, position, alignment,
// wrapping), so nothing moves when the morph takes over.
const morphRootClassName = "relative inline-block align-top whitespace-nowrap";

// The morph, mounted on the text shown first and moved to the current one,
// so the first change animates too. torph rebuilds the element's content;
// React renders it once, since the first text never changes.
const StartedTextMorph = ({
  from,
  children,
  className,
  ...options
}: TextMorphTextProps & { from: string }) => {
  // Always honors prefers-reduced-motion (the text swaps with no morph);
  // set last so no caller can turn it off.
  const { ref, update } = useTextMorph({
    ...options,
    respectReducedMotion: true,
  });

  // The text torph shows now.
  const shownRef = useRef<string | null>(null);
  // torph's first update is its initial render, which never animates.
  useEffect(() => {
    update(from);
    shownRef.current = from;
  }, [from, update]);
  useEffect(() => {
    // The first change waits a frame for that initial render to be laid
    // out: applied in the same instant, torph had nothing to morph from and
    // the text snapped (the first מחיקה in ניהול נתונים), while every later
    // change morphed.
    if (shownRef.current === from && children !== from) {
      const frame = requestAnimationFrame(() => {
        update(children);
        shownRef.current = children;
      });

      return () => {
        cancelAnimationFrame(frame);
      };
    }

    update(children);
    shownRef.current = children;

    return constVoid;
  }, [children, from, update]);

  return (
    <span
      ref={(element) => {
        ref.current = element;
      }}
      className={className}
    >
      {from}
    </span>
  );
};

// torph measures every character when it mounts, a forced layout per
// instance: a table with a morphing label in each row spent over a second on
// labels that never changed. So the text stays plain until its value first
// changes, and only then does the morph start, from the first value.
const LazyTextMorph = ({
  children,
  className,
  ...options
}: TextMorphTextProps) => {
  const [first, setFirst] = useState<{ text: string; changed: boolean }>({
    text: children,
    changed: false,
  });

  const changed = first.changed || children !== first.text;

  if (changed !== first.changed) {
    setFirst({ text: first.text, changed });
  }

  if (!changed) {
    return (
      <span className={cn(morphRootClassName, className)}>{children}</span>
    );
  }

  return (
    <StartedTextMorph from={first.text} className={className} {...options}>
      {children}
    </StartedTextMorph>
  );
};

// Values made only of digits and number punctuation, e.g. "26", "3 / 26", "0/250".
const numericValue = /^[\d\s.,/%+-]+$/u;
const numberRun = /(?<number>\d[\d.,]*)/u;

const NumberMorph = ({ className, ...props }: TextMorphTextProps) => (
  <LazyTextMorph
    className={cn("tabular-nums [direction:ltr]", className)}
    {...props}
  />
);

/**
 * Animated text for values that change in place (counts, progress, states).
 * Static labels gain nothing from it, since the morph only runs on change.
 *
 * torph has no RTL support: it renders digits as separate inline-blocks, and an
 * RTL paragraph lays those blocks out right to left, so "26" displays as "62".
 * Numbers therefore always morph in their own left-to-right root: a pure number
 * directly, and text with numbers in it as alternating text and number runs.
 * torph also defaults to the "en" locale; Hebrew needs "he".
 *
 * @returns The morphing text, or a number that flows for a numeric value.
 */
export const MorphText = ({
  children,
  locale = "he",
  className,
  ...props
}: MorphTextProps) => {
  const value = String(children);

  if (numericValue.test(value)) {
    return (
      <NumberMorph locale={locale} className={className} {...props}>
        {value}
      </NumberMorph>
    );
  }

  if (!numberRun.test(value)) {
    return (
      <LazyTextMorph locale={locale} className={className} {...props}>
        {value}
      </LazyTextMorph>
    );
  }

  // Split keeps captured numbers at odd positions: "טוען 3 מתוך 26" → text, 3,
  // text, 26, text. Each run is identified by its slot in that template
  // ("number-1" is the second number), so "3 מתוך 26" → "4 מתוך 26" morphs the 3.
  const runs = value.split(numberRun).map((run, position) => ({
    run,
    isNumber: position % 2 === 1,
    slot: `${position % 2 === 1 ? "number" : "text"}-${Math.floor(position / 2)}`,
  }));

  return (
    <span className={className}>
      {runs.map(({ run, isNumber, slot }) => {
        if (isNumber) {
          return (
            <NumberMorph key={slot} locale={locale} {...props}>
              {run}
            </NumberMorph>
          );
        }

        const text = run.trim();

        return (
          <span key={slot}>
            {run.slice(0, run.length - run.trimStart().length)}
            {text && (
              <LazyTextMorph locale={locale} {...props}>
                {text}
              </LazyTextMorph>
            )}
            {run.slice(run.trimEnd().length)}
          </span>
        );
      })}
    </span>
  );
};
