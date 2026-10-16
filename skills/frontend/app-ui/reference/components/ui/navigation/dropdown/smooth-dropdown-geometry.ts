import { autoUpdate } from "@floating-ui/dom";
import { constVoid } from "effect/Function";
import { useLayoutEffect, useState } from "react";
import type { RefObject } from "react";

import { getTextDirection } from "#/paraglide/runtime";

import type {
  SmoothDropdownAction,
  SmoothDropdownOption,
} from "./smooth-dropdown-rows";
import {
  menuSearchHeight,
  menuSearchMinOptions,
} from "./smooth-dropdown-search";

// Where the smooth dropdown's surface sits and how big it is
// (smooth-dropdown.tsx): the closed trigger's shape, the open menu's, which
// way it opens, and a floating surface's place on the page.

// The surface's spring between closed and open (380/34/0.8).
export const dropdownSpring = {
  type: "spring",
  damping: 34,
  stiffness: 380,
  mass: 0.8,
} as const;

/**
 * The closed trigger's corners and the open menu's (tor-app's 20px card),
 * by trigger: a form field (tor-app's 16px input), a pill chip in a toolbar,
 * a small icon on a card (amichai-all's compact "player" trigger), or a
 * round icon button (the header's bell, the size of the app's icon button).
 */
export type SmoothDropdownAppearance = "field" | "chip" | "icon" | "round";

const closedRadius: Record<SmoothDropdownAppearance, number> = {
  field: 16,
  chip: 16,
  icon: 8,
  round: 20,
};

const openRadius = 20;
const triggerHeight = 44;
const rowHeight = 44;
const listPadding = 16;
const closedShadow = "0 0px 0px rgba(0, 0, 0, 0), 0 0px 0px rgba(0, 0, 0, 0)";

const openShadow =
  "0 16px 32px rgba(0, 0, 0, 0.075), 0 4px 10px rgba(0, 0, 0, 0.04)";

/**
 * The surface's shape closed (the trigger's size) or open (the menu's), and
 * where a floating surface's left edge is.
 *
 * @param appearance - The trigger's appearance (field, chip, icon).
 * @param open - Whether the surface is open.
 * @param width - The open menu's width.
 * @param height - The open menu's height.
 * @param left - A floating surface's left edge.
 * @returns The surface's CSS variables.
 */
export const dropdownSurface = (
  appearance: SmoothDropdownAppearance,
  open: boolean,
  width: number,
  height: number,
  left: number
) => ({
  "--menu-width": `${width}px`,
  "--menu-height": `${height}px`,
  "--menu-left": `${left}px`,
  borderRadius: open ? openRadius : closedRadius[appearance],
  boxShadow: open ? openShadow : closedShadow,
});

// Whether the menu has room to open toward the reading end of its trigger.
const dropdownFitsAtStart = (bounds: DOMRect, menuWidth: number) =>
  getTextDirection() === "rtl"
    ? bounds.right - menuWidth >= 8
    : bounds.left + menuWidth <= window.innerWidth - 8;

// The menu's height before it is measured: a row per option and action.
// A list shows this many rows and scrolls for the rest; the half row shows
// there is more (smooth-dropdown.module.css caps .items to the same).
const menuVisibleRows = 5.5;

/**
 * The menu's height before it is measured, from its rows (at most
 * menuVisibleRows), padding and its search field.
 *
 * @param options - The menu's options.
 * @param actions - The menu's actions, if any.
 * @returns The estimated height in pixels.
 */
export const dropdownMenuEstimate = (
  options: SmoothDropdownOption[],
  actions: SmoothDropdownAction[] | undefined
) =>
  rowHeight *
    Math.min(options.length + (actions?.length ?? 0), menuVisibleRows) +
  listPadding +
  (options.length > menuSearchMinOptions ? menuSearchHeight : 0);

/**
 * A floating menu's left edge: under its trigger's reading start, or centered
 * under it (a wide panel such as the date picker), kept 16px inside the
 * viewport.
 *
 * @param trigger - The trigger's bounds.
 * @param menuWidth - The menu's width.
 * @param align - start or center.
 * @returns The menu's left edge, in pixels from the viewport's left.
 */
export const dropdownMenuLeft = (
  trigger: DropdownTriggerBounds,
  menuWidth: number,
  align: SmoothDropdownAlign
) => {
  let { left } = trigger;

  if (align === "center") {
    left = trigger.left + (trigger.width - menuWidth) / 2;
  } else if (getTextDirection() === "rtl") {
    left = trigger.left + trigger.width - menuWidth;
  }

  return Math.min(Math.max(left, 16), window.innerWidth - menuWidth - 16);
};

// Opens upward when it would not fit below but fits (or fits better) above,
// within the boundary (a scrolling table) when there is one, and how tall the
// menu may grow there.
const dropdownOpening = (
  bounds: DOMRect,
  boundary: Element | null | undefined,
  menuHeight: number
) => {
  const boundaryBounds = boundary?.getBoundingClientRect();
  const spaceAbove = bounds.bottom - (boundaryBounds?.top ?? 0);

  const spaceBelow =
    (boundaryBounds?.bottom ?? window.innerHeight) - bounds.top;

  const upward =
    spaceBelow < menuHeight &&
    (boundaryBounds ? spaceAbove > spaceBelow : spaceAbove > menuHeight);

  return {
    upward,
    maxHeight: Math.max(
      boundaryBounds ? 44 : 180,
      (upward ? spaceAbove : spaceBelow) - 16
    ),
  };
};

/**
 * Where a floating menu sits under its trigger: from the trigger's reading
 * start, or centered under it.
 */
export type SmoothDropdownAlign = "start" | "center";

interface DropdownTriggerBounds {
  top: number;
  left: number;
  width: number;
  // From the viewport's bottom, for a menu that opens upward.
  bottom: number;
}

// The trigger's box on screen as laid out, without a scale on it or on its
// anchor (the round trigger's squishy press, a hover grow): a scale keeps
// the box's center, so the center comes from the screen and the size from
// layout. Measured mid-press, the surface would otherwise shrink back into a
// squashed box and the trigger jump to its place after it.
const unscaledTriggerRect = (trigger: HTMLElement) => {
  const rect = trigger.getBoundingClientRect();
  const width = trigger.offsetWidth;
  const height = trigger.offsetHeight;

  return new DOMRect(
    rect.left + (rect.width - width) / 2,
    rect.top + (rect.height - height) / 2,
    width,
    height
  );
};

const dropdownTriggerBounds = (bounds: DOMRect): DropdownTriggerBounds => ({
  top: bounds.top,
  left: bounds.left,
  width: bounds.width,
  bottom: window.innerHeight - bounds.bottom,
});

/**
 * A floating surface follows its trigger while the page scrolls. track sets
 * it on opening, so the surface's first frame already sits on the trigger.
 *
 * @param trigger - The dropdown's trigger.
 * @param floating - Whether the surface floats over the page.
 * @param open - Whether it is open.
 * @param closing - Whether it is closing.
 * @returns The trigger's position, and track to set it.
 */
export const useDropdownPosition = (
  trigger: RefObject<HTMLButtonElement | null>,
  floating: boolean,
  open: boolean,
  closing: boolean
) => {
  const enabled = floating && (open || closing);

  const [position, setPosition] = useState<DropdownTriggerBounds>({
    top: 0,
    left: 0,
    width: 0,
    bottom: 0,
  });

  useLayoutEffect(() => {
    if (!enabled) {
      return constVoid;
    }

    const button = trigger.current;

    if (!button) {
      return constVoid;
    }

    // Floating UI's autoUpdate measures again when a scroll container
    // scrolls, the window or the trigger resizes, or the layout moves the
    // trigger: event-driven, with no work while nothing moves.
    return autoUpdate(button, null, () => {
      setPosition(dropdownTriggerBounds(unscaledTriggerRect(button)));
    });
  }, [trigger, enabled]);

  return { position, track: setPosition };
};

/**
 * The trigger's size, which a transform does not change: on-screen bounds
 * read inside a dialog still growing out of its button (useDialogMorph) were
 * a fraction of it, and the field's surface stayed that small, so the closed
 * field looked see-through. Fractional, not offsetWidth: the closing label
 * copies this width, and half a pixel short cuts its text to an ellipsis.
 * With it, the viewport's width, which caps the open menu's.
 *
 * @param trigger - The dropdown's trigger.
 * @returns The trigger's size and the viewport's width.
 */
export const useDropdownTriggerSize = (
  trigger: RefObject<HTMLButtonElement | null>
) => {
  const [viewportWidth, setViewportWidth] = useState(1024);
  const [size, setSize] = useState({ width: 100, height: triggerHeight });
  useLayoutEffect(() => {
    const button = trigger.current;

    if (!button) {
      return constVoid;
    }

    const observer = new ResizeObserver(([entry]) => {
      const box = entry?.borderBoxSize.at(0);

      if (box !== undefined) {
        setSize({ width: box.inlineSize, height: box.blockSize });
      }
    });

    observer.observe(button);

    // The page's box resizes with the viewport's width.
    const viewportObserver = new ResizeObserver(() => {
      setViewportWidth(window.innerWidth);
    });

    viewportObserver.observe(document.documentElement);

    return () => {
      observer.disconnect();
      viewportObserver.disconnect();
    };
  }, [trigger]);

  return { size, viewportWidth };
};

/**
 * The open menu's measured height, or the estimate until it is measured.
 *
 * @param open - Whether the menu is open.
 * @param content - The menu's content element, once mounted.
 * @param estimate - The height before the menu is measured.
 * @returns The menu's height in pixels.
 */
export const useDropdownMenuHeight = (
  open: boolean,
  content: HTMLElement | null,
  estimate: () => number
) => {
  const [menuHeight, setMenuHeight] = useState(estimate);
  useLayoutEffect(() => {
    const menu = content;

    if (!open || !menu) {
      return constVoid;
    }

    const measure = () => {
      setMenuHeight(menu.getBoundingClientRect().height);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(menu);

    return () => {
      observer.disconnect();
    };
  }, [open, content]);

  return menuHeight;
};

/**
 * Read as the dropdown opens: the trigger's place, which way the menu opens
 * and how tall it may grow, and the trigger's field color. A floating
 * surface is portaled to the body, outside a card that sets --field (white
 * fields on a gray card), and would otherwise close back in the page's gray.
 *
 * @param trigger - The dropdown's trigger.
 * @param boundary - The element the menu must stay inside, if any.
 * @param menuHeight - The menu's height.
 * @param menuWidth - The menu's width.
 * @returns The trigger's position, whether the menu fits at its start, which
 *   way it opens and how tall it may grow, and the trigger's field color.
 */
export const measureDropdownOpening = (
  trigger: HTMLElement,
  boundary: Element | null | undefined,
  menuHeight: number,
  menuWidth: number
) => {
  const bounds = unscaledTriggerRect(trigger);

  return {
    position: dropdownTriggerBounds(bounds),
    alignStart: dropdownFitsAtStart(bounds, menuWidth),
    ...dropdownOpening(bounds, boundary, menuHeight),
    field: getComputedStyle(trigger).getPropertyValue("--field").trim(),
  };
};
