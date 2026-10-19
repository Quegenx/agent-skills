import { useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";

/**
 * FLIP glide for re-sorted rows: each [data-row-id] row animates from its old
 * position to its new one when `sortKey` changes. Filtering and paging do not
 * glide, since rows there appear or disappear rather than move. Timing reads
 * --duration-fast and --ease-smooth-out so it stays on the motion-token scale.
 *
 * @param container - The element holding the rows.
 * @param sortKey - The current sort; a change starts the glide.
 */
export const useRowSortGlide = (
  container: RefObject<HTMLElement | null>,
  sortKey: string
) => {
  const positions = useRef(new Map<string, number>());
  const lastSortKey = useRef(sortKey);
  useLayoutEffect(() => {
    const element = container.current;

    if (!element) {
      return;
    }

    const rows = [...element.querySelectorAll<HTMLElement>("[data-row-id]")];

    // offsetTop is layout-relative, so scrolling between renders cannot skew it.
    const next = new Map(
      rows.map((row) => [row.dataset.rowId ?? "", row.offsetTop])
    );

    const previous = positions.current;
    const resorted = lastSortKey.current !== sortKey;
    positions.current = next;
    lastSortKey.current = sortKey;

    if (
      !resorted ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const styles = getComputedStyle(element);

    const duration =
      Number(
        styles.getPropertyValue("--duration-fast").trim().replace(/ms$/u, "")
      ) || 250;

    const easing = styles.getPropertyValue("--ease-smooth-out").trim();

    for (const row of rows) {
      const id = row.dataset.rowId ?? "";
      const before = previous.get(id);
      const after = next.get(id) ?? 0;

      if (before !== undefined && before !== after) {
        row.animate(
          [
            { transform: `translateY(${before - after}px)` },
            { transform: "none" },
          ],
          { duration, easing: easing || "ease-out" }
        );
      }
    }
  });
};
