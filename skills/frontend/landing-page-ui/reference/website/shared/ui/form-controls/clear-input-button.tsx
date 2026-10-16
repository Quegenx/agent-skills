import { Cancel01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import { button as MotionButton } from "motion/react-m";

import { cn } from "../../styles/site-class-merge";
import { clearInputButtonStyles as styles } from "./clear-input-button.styles";

interface ClearInputButtonProps {
  label: string;
  onClear: () => void;
  visible: boolean;
}

const clearInputVisible = { filter: "blur(0px)", opacity: 1 } as const;

/**
 * Clears a populated text field without moving focus away from that field.
 *
 * @returns The clear button, or nothing while hidden.
 */
export const ClearInputButton = ({
  label,
  onClear,
  visible,
}: ClearInputButtonProps) => {
  const prefersReducedMotion = useReducedMotion();

  const hidden = {
    filter: prefersReducedMotion === true ? "blur(0px)" : "blur(4px)",
    opacity: 0,
  } as const;

  return (
    <AnimatePresence initial={false}>
      {visible ? (
        <MotionButton
          animate={clearInputVisible}
          aria-label={label}
          exit={{
            ...hidden,
            transition: {
              duration: prefersReducedMotion === true ? 0.12 : 0.22,
              ease: "easeInOut",
            },
          }}
          initial={hidden}
          key="clear-input"
          onClick={onClear}
          transition={{
            duration: prefersReducedMotion === true ? 0.12 : 0.22,
            ease: "easeInOut",
          }}
          type="button"
          className={cn(styles.button, styles.inputButton)}
        >
          <span aria-hidden="true" className={styles.surface}>
            <span className={styles.icon}>
              <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={1.8} />
            </span>
          </span>
        </MotionButton>
      ) : null}
    </AnimatePresence>
  );
};
