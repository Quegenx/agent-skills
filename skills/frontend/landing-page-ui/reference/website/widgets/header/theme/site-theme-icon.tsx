import { useReducedMotion } from "motion/react";
import {
  circle as MotionCircle,
  g as MotionG,
  path as MotionPath,
} from "motion/react-m";
import { useId } from "react";
import type { CSSProperties } from "react";

import type { SiteTheme } from "./site-theme";

/**
 * The sun that morphs into a moon: the website header's theme switcher draws
 * it.
 *
 * @returns The icon's SVG.
 */
export const SiteThemeIcon = ({
  theme,
  className,
  style,
}: {
  theme: SiteTheme;
  className?: string;
  style?: CSSProperties;
}) => {
  const clipPathId = useId();
  const prefersReducedMotion = useReducedMotion();
  const isDark = theme === "dark";

  const transition = {
    duration: prefersReducedMotion === true ? 0 : 0.3,
    ease: "easeInOut" as const,
  };

  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      strokeLinecap="round"
      viewBox="0 0 32 32"
      className={className}
      style={style}
    >
      <clipPath id={clipPathId}>
        <MotionPath
          animate={{ x: isDark ? -12 : 0, y: isDark ? 10 : 0 }}
          d="M0-5h30a1 1 0 0 0 9 13v24H0Z"
          transition={transition}
        />
      </clipPath>
      <g clipPath={`url(#${clipPathId})`}>
        <MotionCircle
          animate={{ r: isDark ? 10 : 8 }}
          cx="16"
          cy="16"
          initial={false}
          transition={transition}
        />
        <MotionG
          animate={{
            opacity: isDark ? 0 : 1,
            rotate: isDark ? -100 : 0,
            scale: isDark ? 0.5 : 1,
          }}
          stroke="currentColor"
          strokeWidth="1.5"
          transition={transition}
        >
          <path d="M16 5.5v-4" />
          <path d="M16 30.5v-4" />
          <path d="M1.5 16h4" />
          <path d="M26.5 16h4" />
          <path d="m23.4 8.6 2.8-2.8" />
          <path d="m5.7 26.3 2.9-2.9" />
          <path d="m5.8 5.8 2.8 2.8" />
          <path d="m23.4 23.4 2.9 2.9" />
        </MotionG>
      </g>
    </svg>
  );
};
