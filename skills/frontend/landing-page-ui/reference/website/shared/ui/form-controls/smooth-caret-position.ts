import type { MotionValue } from "motion";
import type { RefObject } from "react";

interface SmoothCaretPositionInput {
  clientWidth: number;
  direction: "ltr" | "rtl";
  paddingLeft: number;
  paddingRight: number;
  prefixWidth: number;
  scrollLeft: number;
}

interface SmoothCaretPosition {
  visible: boolean;
  x: number;
}

interface SmoothCaretUpdateInput {
  animationFrameRef: RefObject<number | null>;
  caretOpacity: MotionValue<number>;
  caretX: MotionValue<number>;
  input: HTMLInputElement;
  measure: HTMLSpanElement | null;
  visualCaretX: MotionValue<number>;
}

interface SynchronizeSmoothCaretAxisInput {
  position: number;
  snap: boolean;
  source: MotionValue<number>;
  visual: MotionValue<number>;
}

/**
 * Moves one axis of the smooth caret: jumping there at once when snapping,
 * otherwise letting its spring follow.
 *
 * @param axis - position: where the caret goes; snap: whether to jump; source
 *   and visual: the axis's motion values.
 */
export const synchronizeSmoothCaretAxis = ({
  position,
  snap,
  source,
  visual,
}: SynchronizeSmoothCaretAxisInput) => {
  if (snap) {
    source.jump(position);
    visual.jump(position);

    return;
  }

  source.set(position);
};

/**
 * Where an input's smooth caret goes, kept inside its padding in either reading
 * direction.
 *
 * @param input - The input's width, padding, scroll, direction and the width of
 *   the text before the caret.
 * @returns The caret's x, and whether it is visible.
 */
export const calculateSmoothCaretPosition = ({
  clientWidth,
  direction,
  paddingLeft,
  paddingRight,
  prefixWidth,
  scrollLeft,
}: SmoothCaretPositionInput): SmoothCaretPosition => {
  const minX = paddingLeft - 1;
  const maxX = clientWidth - paddingRight;

  const position =
    direction === "rtl"
      ? maxX - prefixWidth - scrollLeft
      : paddingLeft + prefixWidth - scrollLeft;

  return {
    visible: position >= minX && position <= maxX + 1,
    x: Math.min(Math.max(position, minX), maxX),
  };
};

/**
 * A CSS pixel value as a number.
 *
 * @param value - The value, such as "12px".
 * @returns The number, or 0 when it is not one.
 */
export const readCssPixelValue = (value: string) =>
  Number(value.replace("px", "")) || 0;

interface SmoothCaretFrameInput<
  Element extends HTMLInputElement | HTMLTextAreaElement,
> {
  animationFrameRef: RefObject<number | null>;
  caretOpacity: MotionValue<number>;
  element: Element;
  place: (selectionStart: number, computedStyle: CSSStyleDeclaration) => void;
}

/** Places a field's caret on the next frame, replacing a placement still
 * pending; a selected range hides the caret, the browser draws the range. */
export const scheduleSmoothCaretFrame = <
  Element extends HTMLInputElement | HTMLTextAreaElement,
>({
  animationFrameRef,
  caretOpacity,
  element,
  place,
}: SmoothCaretFrameInput<Element>) => {
  if (animationFrameRef.current !== null) {
    cancelAnimationFrame(animationFrameRef.current);
  }

  animationFrameRef.current = requestAnimationFrame(() => {
    animationFrameRef.current = null;
    const selectionStart = element.selectionStart ?? 0;
    const selectionEnd = element.selectionEnd ?? 0;

    if (selectionStart !== selectionEnd) {
      caretOpacity.set(0);

      return;
    }

    place(selectionStart, window.getComputedStyle(element));
  });
};

/**
 * Moves an input's smooth caret on the next animation frame, measuring the text
 * before the caret.
 *
 * @param update - The input, how to measure its text, the caret's motion
 *   values, and the pending frame's ref.
 */
export const scheduleSmoothCaretUpdate = ({
  animationFrameRef,
  caretOpacity,
  caretX,
  input,
  measure,
  visualCaretX,
}: SmoothCaretUpdateInput) => {
  if (!measure) {
    return;
  }

  scheduleSmoothCaretFrame({
    animationFrameRef,
    caretOpacity,
    element: input,
    place: (selectionStart, computedStyle) => {
      measure.style.font = computedStyle.font;
      measure.style.fontFeatureSettings = computedStyle.fontFeatureSettings;
      measure.style.fontVariationSettings = computedStyle.fontVariationSettings;
      measure.style.letterSpacing = computedStyle.letterSpacing;
      measure.textContent = input.value.slice(0, selectionStart);

      const position = calculateSmoothCaretPosition({
        clientWidth: input.clientWidth,
        direction: computedStyle.direction === "rtl" ? "rtl" : "ltr",
        paddingLeft: readCssPixelValue(computedStyle.paddingLeft),
        paddingRight: readCssPixelValue(computedStyle.paddingRight),
        prefixWidth: measure.offsetWidth,
        scrollLeft: input.scrollLeft,
      });

      synchronizeSmoothCaretAxis({
        position: position.x,
        snap: caretOpacity.get() === 0,
        source: caretX,
        visual: visualCaretX,
      });
      caretOpacity.set(position.visible ? 1 : 0);
    },
  });
};
