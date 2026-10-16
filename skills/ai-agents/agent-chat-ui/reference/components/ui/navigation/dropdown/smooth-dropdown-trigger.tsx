import { useReducedMotion } from "motion/react";
import { div as MotionDiv, span as MotionSpan } from "motion/react-m";
import { useSyncExternalStore } from "react";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { createPortal } from "react-dom";

import { Tooltip, TooltipContent } from "@/components/ui/display/tooltip";
import { AppIcon } from "@/components/ui/general/app-icon";

import type { SmoothDropdownAppearance } from "./smooth-dropdown-geometry";

import styles from "./smooth-dropdown.module.css";

// The backdrop's fade (backdrop.css): 500ms on vaul's curve.
const smoothDropdownBackdropFade = {
  duration: 0.5,
  ease: [0.32, 0.72, 0, 1],
} as const;

/**
 * The closed dropdown's face: its label fades and shrinks away as the
 * surface opens, and back once it has closed.
 *
 * @returns The trigger button.
 */
export const SmoothDropdownTrigger = ({
  ref,
  triggerId,
  label,
  disabled,
  open,
  onToggle,
  children,
  ...props
}: Omit<ComponentProps<"button">, "children"> & {
  triggerId?: string;
  label: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) => {
  const reduce = useReducedMotion();

  return (
    <button
      {...props}
      ref={ref}
      id={triggerId}
      type="button"
      aria-label={label}
      disabled={disabled}
      className={styles.trigger}
      onPointerDown={(event) => {
        if (event.button === 0 && !event.ctrlKey) {
          event.preventDefault();
        }
      }}
      onClick={onToggle}
    >
      <MotionSpan
        className={styles.triggerLabel}
        initial={false}
        animate={{ opacity: open ? 0 : 1, scale: open ? 0.8 : 1 }}
        transition={{
          duration: reduce === true ? 0 : 0.15,
          delay: open || reduce === true ? 0 : 0.12,
        }}
      >
        {children}
        <AppIcon icon="chevron-down" aria-hidden="true" />
      </MotionSpan>
    </button>
  );
};

// Whether this render is the client's: false on the server and while
// hydrating, true after; nothing changes it later, so nothing to subscribe.
const subscribeToNothing = () => () => {
  // Nothing to unsubscribe.
};

const clientRenders = () => true;
const serverRenders = () => false;

/**
 * Its children in document.body when portaled, else in place. Only the
 * client has document.body, so until hydrated they stay in place.
 *
 * @returns The children, portaled or in place.
 */
export const SmoothDropdownPortal = ({
  portaled,
  children,
}: {
  portaled: boolean;
  children: ReactElement;
}) => {
  const hydrated = useSyncExternalStore(
    subscribeToNothing,
    clientRenders,
    serverRenders
  );

  if (!portaled || !hydrated) {
    return children;
  }

  return <>{createPortal(children, document.body)}</>;
};

/**
 * The app's backdrop under a floating surface (z-index 60 over its 50),
 * fading in and out with it; a press on it is outside the menu, so it
 * closes.
 *
 * @returns The backdrop, or nothing when it is off.
 */
export const SmoothDropdownBackdrop = ({
  enabled,
  open,
  present,
  reduce,
}: {
  enabled: boolean | undefined;
  open: boolean;
  present: boolean;
  reduce: boolean | null;
}) => {
  if (enabled === true && present) {
    return (
      <SmoothDropdownPortal portaled>
        <MotionDiv
          aria-hidden="true"
          className="app-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: open ? 1 : 0 }}
          transition={
            reduce === true ? { duration: 0 } : smoothDropdownBackdropFade
          }
        />
      </SmoothDropdownPortal>
    );
  }

  return null;
};

/**
 * An icon-only trigger (a "…", a bell) names itself in the app's hint on
 * hover, hidden while its menu is open; a trigger showing its value needs
 * none.
 *
 * @returns The trigger, with its hint when it is icon-only.
 */
export const SmoothDropdownTriggerHint = ({
  label,
  appearance,
  open,
  children,
}: {
  label: string;
  appearance: SmoothDropdownAppearance;
  open: boolean;
  children: ReactNode;
}) => (
  <Tooltip disabled={open || (appearance !== "icon" && appearance !== "round")}>
    {children}
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);
