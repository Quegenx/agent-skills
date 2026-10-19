import { constVoid } from "effect/Function";
import type { MotionValue } from "motion/react";
import {
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect, useEffectEvent, useRef } from "react";
import type {
  ChangeEvent,
  ChangeEventHandler,
  ComponentPropsWithoutRef,
  FocusEvent,
  FocusEventHandler,
  KeyboardEvent,
  KeyboardEventHandler,
  PointerEvent,
  PointerEventHandler,
  ReactEventHandler,
  ReactNode,
  RefObject,
  SyntheticEvent,
  UIEvent,
  UIEventHandler,
} from "react";

/** Props shared by native fields that render the smooth-caret overlay. */
export type SmoothCaretFieldProps<Tag extends "input" | "textarea"> = Omit<
  ComponentPropsWithoutRef<Tag>,
  "children"
> & {
  trailingControl?: ReactNode;
  wrapperClassName?: string;
};

type SmoothCaretElement = HTMLInputElement | HTMLTextAreaElement;

/**
 * Creates the shared spring-driven position and opacity values for smooth carets.
 *
 * @returns The caret's motion values, its springs, and its transforms for an
 *   input or a textarea.
 */
export const useSmoothCaretMotion = () => {
  const caretX = useMotionValue(0);
  const caretY = useMotionValue(0);
  const caretOpacity = useMotionValue(0);
  const prefersReducedMotion = useReducedMotion();

  const spring =
    prefersReducedMotion === true
      ? { damping: 100, mass: 0.1, stiffness: 10_000 }
      : { damping: 30, mass: 0.5, stiffness: 500 };

  const springCaretX = useSpring(caretX, spring);
  const springCaretY = useSpring(caretY, spring);

  const inputCaretTransform = useTransform(
    springCaretX,
    (position) => `translate3d(${position}px, -50%, 0)`
  );

  const textareaCaretTransform = useTransform(
    () => `translate3d(${springCaretX.get()}px, ${springCaretY.get()}px, 0)`
  );

  return {
    caretOpacity,
    caretX,
    caretY,
    inputCaretTransform,
    textareaCaretTransform,
    visualCaretX: springCaretX,
    visualCaretY: springCaretY,
  };
};

interface SmoothCaretListenerProps<Element extends SmoothCaretElement> {
  animationFrameRef: RefObject<number | null>;
  caretOpacity: MotionValue<number>;
  container: HTMLDivElement;
  element: Element;
  updateWhenFocused: () => void;
}

/**
 * Attaches and cleans up the shared browser listeners for a smooth caret field.
 *
 * @returns A cleanup that removes the listeners and restores the native caret.
 */
const attachSmoothCaretListeners = <Element extends SmoothCaretElement>({
  animationFrameRef,
  caretOpacity,
  container,
  element,
  updateWhenFocused,
}: SmoothCaretListenerProps<Element>) => {
  const previousCaretColor = element.style.caretColor;
  element.style.caretColor = "transparent";

  const updateWhenFontsReady = async () => {
    try {
      await document.fonts.ready;
    } catch {
      // Fonts that fail to load keep the fallback metrics already measured.
      return;
    }

    updateWhenFocused();
  };

  const resizeObserver = new ResizeObserver(updateWhenFocused);

  // The field's text scrolls without a selection change only under a wheel
  // or a touch pan; the caret follows on the frame after the scroll applies.
  let scrollFrame = 0;

  const followFieldScroll = () => {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(updateWhenFocused);
  };

  document.addEventListener("selectionchange", updateWhenFocused);
  document.fonts.addEventListener("loadingdone", updateWhenFocused);
  element.addEventListener("wheel", followFieldScroll, { passive: true });
  element.addEventListener("touchmove", followFieldScroll, { passive: true });
  resizeObserver.observe(container);
  void updateWhenFontsReady();

  return () => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    caretOpacity.set(0);
    element.style.caretColor = previousCaretColor;
    document.removeEventListener("selectionchange", updateWhenFocused);
    document.fonts.removeEventListener("loadingdone", updateWhenFocused);
    element.removeEventListener("wheel", followFieldScroll);
    element.removeEventListener("touchmove", followFieldScroll);
    cancelAnimationFrame(scrollFrame);
    resizeObserver.disconnect();
  };
};

interface SmoothCaretHandlerProps<Element extends SmoothCaretElement> {
  caretOpacity: MotionValue<number>;
  onBlur?: FocusEventHandler<Element>;
  onChange?: ChangeEventHandler<Element>;
  onFocus?: FocusEventHandler<Element>;
  onKeyUp?: KeyboardEventHandler<Element>;
  onPointerUp?: PointerEventHandler<Element>;
  onScroll?: UIEventHandler<Element>;
  onSelect?: ReactEventHandler<Element>;
  scheduleCaret: (element: Element) => void;
}

/**
 * Composes native field callbacks with smooth-caret scheduling in event order.
 *
 * @returns The field's event handlers, each moving the caret after the field's
 *   own handler.
 */
const useSmoothCaretHandlers = <Element extends SmoothCaretElement>({
  caretOpacity,
  onBlur,
  onChange,
  onFocus,
  onKeyUp,
  onPointerUp,
  onScroll,
  onSelect,
  scheduleCaret,
}: SmoothCaretHandlerProps<Element>) => ({
  onBlur: (event: FocusEvent<Element>) => {
    caretOpacity.set(0);
    onBlur?.(event);
  },
  onChange: (event: ChangeEvent<Element>) => {
    onChange?.(event);
    scheduleCaret(event.currentTarget);
  },
  onFocus: (event: FocusEvent<Element>) => {
    onFocus?.(event);
    scheduleCaret(event.currentTarget);
  },
  onKeyUp: (event: KeyboardEvent<Element>) => {
    onKeyUp?.(event);
    scheduleCaret(event.currentTarget);
  },
  onPointerUp: (event: PointerEvent<Element>) => {
    onPointerUp?.(event);
    scheduleCaret(event.currentTarget);
  },
  onScroll: (event: UIEvent<Element>) => {
    onScroll?.(event);
    scheduleCaret(event.currentTarget);
  },
  onSelect: (event: SyntheticEvent<Element>) => {
    onSelect?.(event);
    scheduleCaret(event.currentTarget);
  },
});

interface SmoothCaretFieldControllerProps<
  Element extends SmoothCaretElement,
> extends Omit<SmoothCaretHandlerProps<Element>, "scheduleCaret"> {
  containerRef: RefObject<HTMLDivElement | null>;
  disabled?: boolean;
  elementRef: RefObject<Element | null>;
  place: (
    element: Element,
    animationFrameRef: RefObject<number | null>
  ) => void;
}

/** Runs a smooth-caret field: places its caret on every event that moves it,
 * hides it while the field is disabled, and follows selection, scroll, size
 *
 * @returns The field's event handlers.
 * and font changes while it has focus. Returns the field's event handlers. */
export const useSmoothCaretField = <Element extends SmoothCaretElement>({
  caretOpacity,
  containerRef,
  disabled,
  elementRef,
  place,
  ...handlers
}: SmoothCaretFieldControllerProps<Element>) => {
  const animationFrameRef = useRef<number | null>(null);

  const placeCaret = useEffectEvent((element: Element) => {
    place(element, animationFrameRef);
  });

  const caretHandlers = useSmoothCaretHandlers({
    ...handlers,
    caretOpacity,
    scheduleCaret: (element: Element) => {
      if (element.disabled) {
        caretOpacity.set(0);

        return;
      }

      place(element, animationFrameRef);
    },
  });

  useEffect(() => {
    if (disabled === true) {
      caretOpacity.set(0);
    }
  }, [caretOpacity, disabled]);

  useEffect(() => {
    const element = elementRef.current;
    const container = containerRef.current;

    if (!(element && container)) {
      return constVoid;
    }

    return attachSmoothCaretListeners({
      animationFrameRef,
      caretOpacity,
      container,
      element,
      updateWhenFocused: () => {
        if (document.activeElement === element) {
          placeCaret(element);
        }
      },
    });
  }, [caretOpacity, containerRef, elementRef]);

  return caretHandlers;
};
