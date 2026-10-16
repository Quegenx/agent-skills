import type { RefObject, TransitionEvent } from "react";
import { useEffect, useRef, useState } from "react";

const closeFallbackDuration = 260;

/**
 * The help search dialog's lifetime (help-search.tsx): while open it locks
 * the page's scrolling and focuses the input; closing fades it out and
 * calls onClose when the fade ends, or after closeFallbackDuration.
 *
 * @param onClose - Closes the search once its fade ends.
 * @param inputRef - The search input.
 * @returns Whether it is closing, requestClose, and handleTransitionEnd for the
 *   dialog.
 */
export const useHelpSearchClose = (
  onClose: () => void,
  inputRef: RefObject<HTMLInputElement | null>
) => {
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  const finishClose = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    onClose();
  };

  const requestClose = () => {
    if (isClosing) {
      return;
    }

    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(
      finishClose,
      closeFallbackDuration
    );
  };

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => inputRef.current?.focus());

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousBodyOverflow;

      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
    // Runs once per open dialog: it locks scrolling and focuses the input;
    // the refs it reads are stable.
  }, [inputRef]);

  const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (
      isClosing &&
      event.currentTarget === event.target &&
      event.propertyName === "opacity"
    ) {
      finishClose();
    }
  };

  return { isClosing, requestClose, handleTransitionEnd };
};
