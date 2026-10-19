"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { cn } from "cn";
import { LazyMotion, domAnimation, useReducedMotion } from "motion/react";
import { button as MotionButton } from "motion/react-m";

import { CheckboxMark } from "@/components/ui/forms/fields/checkbox-mark";

// amichai-all's checkbox (course-practice-checkbox.tsx with its dropdown's
// box): pressing squishes it on a spring, and the tick draws itself in.
const checkboxPressSpring = {
  type: "spring",
  stiffness: 520,
  damping: 36,
  mass: 0.35,
} as const;

const Checkbox = ({
  className,
  indeterminate = false,
  ...props
}: CheckboxPrimitive.Root.Props) => {
  const reduce = useReducedMotion();

  return (
    <LazyMotion features={domAnimation} strict>
      <CheckboxPrimitive.Root
        data-slot="checkbox"
        indeterminate={indeterminate}
        nativeButton
        render={
          <MotionButton
            type="button"
            whileTap={
              reduce === true || props.disabled === true
                ? undefined
                : { scale: 0.96 }
            }
            transition={checkboxPressSpring}
          />
        }
        className={cn("app-checkbox peer shrink-0", className)}
        {...props}
      >
        <CheckboxPrimitive.Indicator
          keepMounted
          data-slot="checkbox-indicator"
          className="app-checkbox-indicator"
          render={(indicatorProps, state) => (
            <span {...indicatorProps}>
              <CheckboxMark
                checked={state.checked}
                indeterminate={state.indeterminate}
              />
            </span>
          )}
        />
      </CheckboxPrimitive.Root>
    </LazyMotion>
  );
};

export { Checkbox };
