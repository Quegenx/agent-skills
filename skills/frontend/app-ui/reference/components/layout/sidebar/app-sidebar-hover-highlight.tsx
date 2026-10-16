import { constVoid } from "effect/Function";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, FocusEvent, PointerEvent } from "react";

// The sidebar rows the highlight follows by default: page links and the
// agent's chats.
const appSidebarHoverRowSelector =
  '[data-slot="sidebar-menu-button"], .app-sidebar-collapsible-link';

type AppSidebarHoverStyle = CSSProperties & {
  "--app-sidebar-hover-x": string;
  "--app-sidebar-hover-y": string;
  "--app-sidebar-hover-width": string;
  "--app-sidebar-hover-height": string;
};

const appSidebarHoverStyle = (
  bounds: AppSidebarHoverBounds
): AppSidebarHoverStyle => ({
  "--app-sidebar-hover-x": `${bounds.left}px`,
  "--app-sidebar-hover-y": `${bounds.top}px`,
  "--app-sidebar-hover-width": `${bounds.width}px`,
  "--app-sidebar-hover-height": `${bounds.height}px`,
});

interface AppSidebarHoverBounds {
  top: number;
  left: number;
  width: number;
  height: number;
  // The selected row has its own highlight, so this one fades out over it.
  selected: boolean;
  // Arriving from nowhere: appear in place instead of sliding in.
  instant: boolean;
  // Faded out where it was: the pointer or focus left the rows.
  hidden: boolean;
}

/**
 * amichai-all's sidebar hover (CourseSidebarNavigation with
 * useCourseOutlineHover): one highlight shared by every row, sliding to
 * whichever row the pointer or keyboard focus is on and fading out when it
 * leaves. Spread containerProps on the sidebar's scrolling content and
 * highlightProps on an empty element inside it; the motion lives in
 * app-sidebar-hover-highlight.css. rowSelector names other rows that move the
 * same way, such as the settings dialog's tabs.
 *
 * @param rowSelector - Which descendants count as rows.
 * @returns The props for the container and for the highlight.
 */
export const useAppSidebarHoverHighlight = (
  rowSelector = appSidebarHoverRowSelector
) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLElement | null>(null);
  const [bounds, setBounds] = useState<AppSidebarHoverBounds | null>(null);

  // Hiding keeps the last position: without it the highlight would fall back
  // to the top corner at zero size and be seen sliding there as it fades.
  const hide = () => {
    setBounds((previous) => previous && { ...previous, hidden: true });
  };

  const measure = () => {
    const target = targetRef.current;
    const container = containerRef.current;

    if (!(target?.isConnected === true && container)) {
      hide();

      return;
    }

    const row = target.getBoundingClientRect();
    const origin = container.getBoundingClientRect();

    const next = {
      top: row.top - origin.top + container.scrollTop,
      left: row.left - origin.left + container.scrollLeft,
      width: row.width,
      height: row.height,
      selected:
        Object.hasOwn(target.dataset, "active") ||
        target.getAttribute("aria-current") === "page",
    };

    setBounds((previous) => {
      if (previous === null || previous.hidden) {
        return { ...next, instant: true, hidden: false };
      }

      const samePlace =
        previous.top === next.top && previous.left === next.left;

      const sameSize =
        previous.width === next.width && previous.height === next.height;

      return samePlace && sameSize && previous.selected === next.selected
        ? { ...previous, instant: false }
        : { ...next, instant: false, hidden: false };
    });
  };

  const measureRef = useRef(measure);
  useLayoutEffect(() => {
    measureRef.current = measure;
  });

  // The sidebar collapsing to icons or its content resizing moves the rows.
  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return constVoid;
    }

    const observer = new ResizeObserver(() => {
      measureRef.current();
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  const follow = (target: HTMLElement) => {
    targetRef.current = target;
    measure();
  };

  const clear = () => {
    targetRef.current = null;
    hide();
  };

  return {
    containerProps: {
      ref: containerRef,
      onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
        if (
          event.pointerType === "touch" ||
          !(event.target instanceof Element)
        ) {
          return;
        }

        const row = event.target.closest<HTMLElement>(rowSelector);

        if (row && !row.matches(":disabled")) {
          follow(row);
        }
      },
      onPointerLeave: clear,
      onFocusCapture: (event: FocusEvent<HTMLDivElement>) => {
        if (
          event.target instanceof HTMLElement &&
          event.target.matches(":focus-visible") &&
          event.target.matches(rowSelector)
        ) {
          follow(event.target);
        }
      },
      onBlurCapture: clear,
      // A menu finishing its open or close has moved the rows below it.
      onTransitionEnd: measure,
    },
    highlightProps: {
      "aria-hidden": true,
      className: "app-sidebar-hover-highlight",
      "data-visible":
        (bounds !== null && !bounds.hidden && !bounds.selected) || undefined,
      "data-instant": bounds?.instant === true || undefined,
      style: bounds ? appSidebarHoverStyle(bounds) : undefined,
    },
  };
};
