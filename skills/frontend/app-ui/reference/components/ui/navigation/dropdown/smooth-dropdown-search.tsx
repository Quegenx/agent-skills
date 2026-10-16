import { constVoid } from "effect/Function";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, RefObject } from "react";

import { app_menu_no_results, app_menu_search } from "#/paraglide/messages";

import type { SmoothDropdownOption } from "./smooth-dropdown-rows";

import styles from "./smooth-dropdown-menu.module.css";

// A list longer than this gets a search field above its rows (the
// countries, the languages).
export const menuSearchMinOptions = 10;
export const menuSearchHeight = 52;

// A printable key typed in an open list that has a search field: it goes to
// the field, not to Radix's type-to-jump.
const isMenuSearchKey = (event: KeyboardEvent<HTMLElement>) =>
  event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey;

// The options whose label has the search's text, ignoring case.
const matchingMenuOptions = (
  options: SmoothDropdownOption[],
  query: string
) => {
  const text = query.trim().toLowerCase();

  return text
    ? options.filter((option) => option.label.toLowerCase().includes(text))
    : options;
};

/**
 * A long list's search field, at the top of its rows, and "no results" when
 * nothing matches; nothing for a list without search. Arrows, Escape and Tab
 * still move through and close the menu; every other key is typing, kept
 * from Radix's type-to-jump. Enter picks the first match.
 *
 * @returns The search field and the no-results row, or nothing.
 */
export const SmoothDropdownSearch = ({
  searchable,
  inputRef,
  query,
  onQueryChange,
  matches,
  onPick,
}: {
  searchable: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  query: string;
  onQueryChange: (query: string) => void;
  matches: SmoothDropdownOption[];
  onPick: (value: string) => void;
}) => {
  if (!searchable) {
    return null;
  }

  return (
    <>
      <div className={styles.search}>
        <input
          ref={inputRef}
          type="search"
          className={styles.searchInput}
          aria-label={app_menu_search()}
          placeholder={app_menu_search()}
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              const first = matches.at(0);

              if (first !== undefined) {
                onPick(first.value);
              }

              return;
            }

            if (
              !["ArrowDown", "ArrowUp", "Escape", "Tab"].includes(event.key)
            ) {
              event.stopPropagation();
            }
          }}
        />
      </div>
      {matches.length === 0 && (
        <p className={styles.empty}>{app_menu_no_results()}</p>
      )}
    </>
  );
};

/**
 * A long list's search (more than menuSearchMinOptions rows, not a panel):
 * its text, emptied on each opening (reset), the rows that match, the field
 * taking focus once the list is shown (Radix first focuses the menu itself),
 * and typing with a row focused (the pointer focuses rows) sent to the field
 * instead of to Radix's type-to-jump, which would take the focus back to a
 * row (handleTyping, on the list's keydown capture).
 *
 * @param options - The menu's options.
 * @param isList - Whether the menu is a list of options rather than a panel.
 * @param open - Whether the menu is open.
 * @param content - The menu's content element, once mounted.
 * @returns Whether it searches, the query and its setter, the field's ref, the
 *   matching options, reset, and handleTyping, which sends typing on a row to
 *   the field.
 */
export const useSmoothDropdownSearch = (
  options: SmoothDropdownOption[],
  isList: boolean,
  open: boolean,
  content: HTMLElement | null
) => {
  const searchable = isList && options.length > menuSearchMinOptions;
  const shown = open && content !== null;
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!(shown && searchable)) {
      return constVoid;
    }

    // preventScroll: focus scrolls the page to the field by default, which
    // jolted the page while the menu was still growing into place.
    const frame = requestAnimationFrame(() =>
      inputRef.current?.focus({ preventScroll: true })
    );

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [shown, searchable]);

  return {
    searchable,
    query,
    handleQueryChange: setQuery,
    inputRef,
    matches: searchable ? matchingMenuOptions(options, query) : options,
    reset: () => {
      setQuery("");
    },
    handleTyping: (event: KeyboardEvent<HTMLElement>) => {
      if (
        searchable &&
        event.target !== inputRef.current &&
        isMenuSearchKey(event)
      ) {
        event.stopPropagation();
        inputRef.current?.focus({ preventScroll: true });
      }
    },
  };
};
