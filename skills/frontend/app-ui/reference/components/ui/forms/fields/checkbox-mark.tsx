import { LazyMotion, domAnimation, useReducedMotion } from "motion/react";
import {
  line as MotionLine,
  path as MotionPath,
  svg as MotionSvg,
} from "motion/react-m";

/**
 * amichai-all's checkbox tick (components/ui/checkbox/checkbox.tsx): drawn as
 * a stroke, 0.2s after the box fills; unchecking erases it in 0.2s. The
 * indeterminate mark is a dash drawn the same way. Shared by the checkbox and
 * the dropdown's multiple-choice rows.
 *
 * @returns The tick, or the dash when indeterminate.
 */
export const CheckboxMark = ({
  checked,
  indeterminate = false,
}: {
  checked: boolean;
  indeterminate?: boolean;
}) => {
  const reduce = useReducedMotion();

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionSvg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3.5}
        aria-hidden="true"
        initial={reduce === true ? false : "unchecked"}
        animate={checked || indeterminate ? "checked" : "unchecked"}
      >
        {indeterminate ? (
          <MotionLine
            x1="5"
            y1="12"
            x2="19"
            y2="12"
            strokeLinecap="round"
            initial={reduce === true ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: reduce === true ? 0 : 0.2 }}
          />
        ) : (
          <MotionPath
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
            variants={{
              checked: {
                pathLength: 1,
                opacity: 1,
                transition: {
                  duration: reduce === true ? 0 : 0.2,
                  delay: reduce === true ? 0 : 0.2,
                },
              },
              unchecked: {
                pathLength: 0,
                opacity: 0,
                transition: { duration: reduce === true ? 0 : 0.2 },
              },
            }}
          />
        )}
      </MotionSvg>
    </LazyMotion>
  );
};
