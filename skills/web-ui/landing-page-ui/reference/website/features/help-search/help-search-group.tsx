import type { MouseEvent } from "react";

import { cn } from "../../shared/styles/site-class-merge";
import { typography } from "../../shared/styles/typography";
import { HelpSearchIcon } from "./help-search-icons";
import { helpSearchStyles as styles } from "./help-search.styles";

/**
 * One result of the help search: a question or a topic, with its category and
 * link.
 */
export interface HelpSearchResult {
  category: string;
  categorySlug: string;
  description: string;
  details?: string[];
  href: string;
  kind: "question" | "topic";
  title: string;
}

interface HelpSearchGroupProps {
  heading: string;
  indexOffset: number;
  items: HelpSearchResult[];
  onSelect: (index: number) => void;
  selectedIndex: number;
}

/**
 * One group of help search results under its heading, as links to pick with
 * the keyboard or the pointer.
 *
 * @param props - heading: the group's title; items: its results; indexOffset:
 *   where its results start in the whole list; selectedIndex: the highlighted
 *   result; onSelect: picks one.
 * @returns The group.
 */
export const HelpSearchGroup = ({
  heading,
  indexOffset,
  items,
  onSelect,
  selectedIndex,
}: HelpSearchGroupProps) => {
  const headingId = `help-search-${heading.toLocaleLowerCase().replaceAll(/\s+/gu, "-")}`;

  const selectHoveredResult = (event: MouseEvent<HTMLAnchorElement>) => {
    onSelect(Number(event.currentTarget.dataset.resultIndex));
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      data-cmdk-group=""
      data-value={heading}
      role="presentation"
      className={styles.group}
    >
      <div
        data-cmdk-group-heading=""
        id={headingId}
        className={cn(typography.label, styles.groupHeading)}
      >
        {heading}
      </div>
      <fieldset
        aria-labelledby={headingId}
        data-cmdk-group-items=""
        className={styles.groupItems}
      >
        {items.map((item, localIndex) => {
          const index = indexOffset + localIndex;
          const isSelected = index === selectedIndex;

          return (
            <a
              aria-current={isSelected ? "true" : undefined}
              className={cn(
                typography.label,
                styles.item,
                isSelected && "selected"
              )}
              data-cmdk-item=""
              data-disabled="false"
              data-result-index={index}
              data-selected={isSelected}
              data-value={`${item.kind}-${item.title.toLocaleLowerCase().replaceAll(/\s+/gu, "-")}`}
              href={item.href}
              key={`${item.kind}-${item.title}`}
              onMouseEnter={selectHoveredResult}
            >
              <HelpSearchIcon kind={item.kind} />
              <span data-cmdk-item-title="" className={styles.itemTitle}>
                {item.title}
              </span>
              {isSelected ? (
                <span
                  data-cmdk-item-shortcut=""
                  className={cn(typography.legal, styles.itemShortcut)}
                >
                  Enter
                </span>
              ) : null}
            </a>
          );
        })}
      </fieldset>
    </div>
  );
};
