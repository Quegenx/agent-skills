import { constVoid } from "effect/Function";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { cn } from "../../styles/site-class-merge";
import { accordionListResizerStyles as styles } from "./accordion-list-resizer.styles";

const isPresent = <Value,>(value: Value | null): value is Value =>
  value !== null;

const measureVisibleHeight = (node: HTMLElement, visibleCount: number) => {
  const rows = [...node.querySelectorAll<HTMLElement>("[data-faq-row]")];
  const lastVisible = visibleCount > 0 ? rows.at(visibleCount - 1) : undefined;

  if (lastVisible === undefined) {
    return node.getBoundingClientRect().height;
  }

  return (
    lastVisible.getBoundingClientRect().bottom -
    node.getBoundingClientRect().top
  );
};

/**
 * Animates an accordion list's height as rows are shown or hidden, clipping
 * while it moves.
 *
 * @param props - children: the rows; clip: whether to clip while it moves;
 *   durationMs: how long; visibleCount: how many rows show.
 * @returns The resizing list.
 */
export const AccordionListResizer = ({
  children,
  clip,
  durationMs,
  visibleCount,
}: {
  children: ReactNode;
  clip: boolean;
  durationMs: number;
  visibleCount: number;
}) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<"auto" | number>("auto");

  useEffect(() => {
    const node = innerRef.current;

    if (!isPresent(node)) {
      return constVoid;
    }

    const update = () => {
      setHeight(measureVisibleHeight(node, visibleCount));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [visibleCount]);

  return (
    <div
      className={cn(styles.resizer, clip && styles.clip)}
      style={{
        height: clip ? height : "auto",
        transitionDuration: `${durationMs}ms`,
      }}
    >
      <div ref={innerRef} className={styles.inner}>
        {children}
      </div>
    </div>
  );
};
