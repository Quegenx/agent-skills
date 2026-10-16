import { constVoid } from "effect/Function";
import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { ScrollReveal } from "../../motion/scroll-reveal";
import { cn } from "../../styles/site-class-merge";
import { typography } from "../../styles/typography";
import type { AccordionItemContent } from "./accordion-item";
import { AccordionItem } from "./accordion-item";
import { AccordionListResizer } from "./accordion-list-resizer";
import { useAccordionOpenItem } from "./accordion-open-item";
import { expandableFaqListStyles as styles } from "./expandable-faq-list.styles";

interface ExpandableFaqListProps {
  color?: "green" | "purple";
  initialVisibleCount?: number;
  items: readonly AccordionItemContent[];
  revealItems?: boolean;
  showLessLabel: string;
  showMoreLabel: (count: number) => string;
}

/**
 * Shared FAQ rows, open-row push motion, and show-more resizer.
 *
 * @returns The FAQ list, with show more and less.
 */
export const ExpandableFaqList = ({
  color = "purple",
  initialVisibleCount = 5,
  items,
  revealItems = false,
  showLessLabel,
  showMoreLabel,
}: ExpandableFaqListProps) => {
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);
  const [resizing, setResizing] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const canToggle = items.length > initialVisibleCount;
  const expanded = visibleCount === items.length;

  const { openIndex, setOpenIndex, handleItemToggles } = useAccordionOpenItem(
    items.length
  );

  useEffect(() => {
    if (!resizing) {
      return constVoid;
    }

    const timer = setTimeout(() => {
      setResizing(false);
    }, 600);

    return () => {
      clearTimeout(timer);
    };
  }, [resizing]);

  const toggleVisibleCount = () => {
    setOpenIndex((current) => (current >= initialVisibleCount ? -1 : current));
    setVisibleCount(expanded ? initialVisibleCount : items.length);
    setResizing(true);
  };

  const rows = (
    <div className={cn(canToggle && styles.accordion)}>
      {items.map((item, index) => {
        const accordionItem = (
          <AccordionItem
            color={color}
            index={index}
            isOpen={openIndex === index && index < visibleCount}
            item={item}
            onToggle={handleItemToggles[index]}
            prefersReducedMotion={prefersReducedMotion}
          />
        );

        return (
          <div
            data-faq-row=""
            inert={index >= visibleCount ? true : undefined}
            key={item.question}
            className={cn(
              index >= visibleCount && !resizing && styles.rowHidden
            )}
          >
            {revealItems ? (
              <ScrollReveal>{accordionItem}</ScrollReveal>
            ) : (
              accordionItem
            )}
          </div>
        );
      })}
    </div>
  );

  const showMoreButton = (
    <button
      aria-expanded={expanded}
      onClick={toggleVisibleCount}
      type="button"
      className={cn(
        typography.callout,
        styles.showMore,
        color === "green" ? styles.showMoreAccent : styles.showMorePurple
      )}
    >
      {expanded ? showLessLabel : showMoreLabel(items.length - visibleCount)}
    </button>
  );

  return (
    <div className={styles.content}>
      <div className={styles.body}>
        {canToggle ? (
          <div className={cn(resizing && styles.resizing)}>
            <AccordionListResizer
              clip={resizing}
              durationMs={resizing ? 600 : 0}
              visibleCount={visibleCount}
            >
              {rows}
            </AccordionListResizer>
          </div>
        ) : (
          rows
        )}
      </div>
      {canToggle && revealItems ? (
        <ScrollReveal>{showMoreButton}</ScrollReveal>
      ) : null}
      {canToggle && !revealItems ? showMoreButton : null}
    </div>
  );
};
