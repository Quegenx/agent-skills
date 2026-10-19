import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "cn";
import {
  AnimatePresence,
  LazyMotion,
  MotionConfig,
  domAnimation,
} from "motion/react";
import { button as MotionButton } from "motion/react-m";
import { useRef } from "react";
import type { ComponentProps } from "react";

import { app_clear_search } from "#/paraglide/messages";
import { AppIcon } from "@/components/ui/general/app-icon";

// The clear button's spring in and out: IconSwap's, no bounce.
const searchClearSpring = { type: "spring", duration: 0.3, bounce: 0 } as const;

// Empties a controlled input the way typing does: React's onChange hears
// the input event, so the caller's state clears as for any edit.
const clearSearchInput = (input: HTMLInputElement | null) => {
  if (!input) {
    return;
  }

  Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )?.set?.call(input, "");
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.focus();
};

/**
 * A search field's clear button: a round × with its own tint (the
 * app-search-clear style) that springs in while show is true and out
 * when it turns false. SearchInput and the chat search use it.
 *
 * @returns The clear button.
 */
export const SearchClearButton = ({
  show,
  onClear,
}: {
  show: boolean;
  onClear: () => void;
}) => (
  <LazyMotion features={domAnimation} strict>
    <MotionConfig reducedMotion="user">
      <AnimatePresence initial={false}>
        {show && (
          <MotionButton
            key="clear"
            type="button"
            className="app-search-clear"
            aria-label={app_clear_search()}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={searchClearSpring}
            onClick={onClear}
          >
            <AppIcon icon="close" />
          </MotionButton>
        )}
      </AnimatePresence>
    </MotionConfig>
  </LazyMotion>
);

// The source search label owns the background, icon, and 50px corners. Once
// there is text, a round × with its own tint springs in at the end to clear
// it (the browser's own clear button is hidden: it could neither animate nor
// take a tint), and springs out when the field is empty again.
const SearchInput = ({
  className,
  id,
  size = "default",
  ...props
}: Omit<ComponentProps<"input">, "type" | "size"> & {
  id: string;
  size?: "default" | "sm";
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const filled = String(props.value ?? "") !== "";

  return (
    <label
      htmlFor={id}
      className="app-search"
      data-slot="search-input"
      data-size={size}
    >
      <span className="app-search-icon" aria-hidden="true">
        <AppIcon icon="search" />
      </span>
      <InputPrimitive
        ref={inputRef}
        id={id}
        type="search"
        data-slot="input"
        className={cn("app-search-control", className)}
        {...props}
      />
      <SearchClearButton
        show={filled && props.disabled !== true}
        onClear={() => {
          clearSearchInput(inputRef.current);
        }}
      />
    </label>
  );
};

export { SearchInput };
