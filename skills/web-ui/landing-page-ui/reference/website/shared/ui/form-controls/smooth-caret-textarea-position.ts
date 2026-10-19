import type { MotionValue } from "motion";
import type { RefObject } from "react";

import {
  readCssPixelValue,
  scheduleSmoothCaretFrame,
  synchronizeSmoothCaretAxis,
} from "./smooth-caret-position";

interface SmoothTextareaCaretUpdateInput {
  animationFrameRef: RefObject<number | null>;
  caretOpacity: MotionValue<number>;
  caretX: MotionValue<number>;
  caretY: MotionValue<number>;
  marker: HTMLSpanElement | null;
  mirror: HTMLDivElement | null;
  textarea: HTMLTextAreaElement;
  visualCaretX: MotionValue<number>;
  visualCaretY: MotionValue<number>;
}

interface SmoothTextareaCaretPositionInput {
  clientHeight: number;
  clientWidth: number;
  lineHeight: number;
  markerLeft: number;
  markerTop: number;
  scrollLeft: number;
  scrollTop: number;
}

const syncTextareaMirror = (
  mirror: HTMLDivElement,
  textarea: HTMLTextAreaElement,
  computedStyle: CSSStyleDeclaration
) => {
  mirror.style.boxSizing = computedStyle.boxSizing;
  mirror.style.direction = computedStyle.direction;
  mirror.style.font = computedStyle.font;
  mirror.style.fontFeatureSettings = computedStyle.fontFeatureSettings;
  mirror.style.fontVariationSettings = computedStyle.fontVariationSettings;
  mirror.style.height = `${textarea.clientHeight}px`;
  mirror.style.letterSpacing = computedStyle.letterSpacing;
  mirror.style.lineHeight = computedStyle.lineHeight;
  mirror.style.padding = computedStyle.padding;
  mirror.style.tabSize = computedStyle.tabSize;
  mirror.style.textAlign = computedStyle.textAlign;
  mirror.style.width = `${textarea.clientWidth}px`;
  mirror.style.wordBreak = computedStyle.wordBreak;
};

/**
 * Where a textarea's smooth caret goes: the mirrored marker's place minus the
 * scroll, and whether that is inside the visible box.
 *
 * @param position - The textarea's visible size, line height and scroll, and
 *   the marker's place in the mirror.
 * @returns The caret's x and y, and whether it is visible.
 */
export const calculateSmoothTextareaCaretPosition = ({
  clientHeight,
  clientWidth,
  lineHeight,
  markerLeft,
  markerTop,
  scrollLeft,
  scrollTop,
}: SmoothTextareaCaretPositionInput) => {
  const x = markerLeft - scrollLeft;
  const y = markerTop - scrollTop + Math.max(0, (lineHeight - 16) / 2);

  return {
    visible: x >= 0 && x <= clientWidth && y >= 0 && y + 16 <= clientHeight,
    x,
    y,
  };
};

/**
 * Moves a textarea's smooth caret on the next animation frame, measuring the
 * caret's place through a mirror of its text.
 *
 * @param update - The textarea, its mirror and marker, the caret's motion
 *   values, and the pending frame's ref.
 */
export const scheduleSmoothTextareaCaretUpdate = ({
  animationFrameRef,
  caretOpacity,
  caretX,
  caretY,
  marker,
  mirror,
  textarea,
  visualCaretX,
  visualCaretY,
}: SmoothTextareaCaretUpdateInput) => {
  if (!(marker && mirror)) {
    return;
  }

  scheduleSmoothCaretFrame({
    animationFrameRef,
    caretOpacity,
    element: textarea,
    place: (selectionStart, computedStyle) => {
      syncTextareaMirror(mirror, textarea, computedStyle);
      mirror.textContent = textarea.value.slice(0, selectionStart);
      mirror.append(marker);

      const lineHeight =
        readCssPixelValue(computedStyle.lineHeight) ||
        readCssPixelValue(computedStyle.fontSize) * 1.5;

      const position = calculateSmoothTextareaCaretPosition({
        clientHeight: textarea.clientHeight,
        clientWidth: textarea.clientWidth,
        lineHeight,
        markerLeft: marker.offsetLeft,
        markerTop: marker.offsetTop,
        scrollLeft: textarea.scrollLeft,
        scrollTop: textarea.scrollTop,
      });

      const snap = caretOpacity.get() === 0;
      synchronizeSmoothCaretAxis({
        position: position.x,
        snap,
        source: caretX,
        visual: visualCaretX,
      });
      synchronizeSmoothCaretAxis({
        position: position.y,
        snap,
        source: caretY,
        visual: visualCaretY,
      });
      caretOpacity.set(position.visible ? 1 : 0);
    },
  });
};
