import { ArrowUpRight01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ClassValue } from "cn";
import { useReducedMotion } from "motion/react";
import { span as MotionSpan } from "motion/react-m";
import { useState } from "react";

import { directionalArrowStyles } from "../../styles/directional-arrow.styles";
import { cn } from "../../styles/site-class-merge";
import { hoverArrowTrackStyles } from "./hover-arrow-track.styles";

interface HoverArrowTrackProps {
  arrowIsMoving: boolean;
  buttonClassName?: ClassValue;
  isActive: boolean;
  onAnimationComplete: () => void;
  prefersReducedMotion: boolean | null;
}

/**
 * Hover and focus state that drives the dual outgoing/incoming arrow.
 *
 * @returns The arrow's state (moving, active, reduced motion) and its focus,
 *   hover and animation handlers.
 */
export const useHoverArrowMotion = () => {
  const [arrowIsMoving, setArrowIsMoving] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  return {
    arrowIsMoving,
    isActive: isFocused || isHovered,
    handleAnimationComplete: () => {
      setArrowIsMoving(false);
    },
    handleBlur: () => {
      setIsFocused(false);
    },
    handleFocus: () => {
      setIsFocused(true);
    },
    handleMouseEnter: () => {
      setArrowIsMoving(true);
      setIsHovered(true);
    },
    handleMouseLeave: () => {
      setIsHovered(false);
    },
    prefersReducedMotion,
  };
};

/**
 * Decorative dual-arrow control that springs on card hover.
 *
 * @returns The arrow's track.
 */
export const HoverArrowTrack = ({
  arrowIsMoving,
  buttonClassName,
  isActive,
  onAnimationComplete,
  prefersReducedMotion,
}: HoverArrowTrackProps) => (
  <span
    aria-hidden="true"
    className={cn(
      hoverArrowTrackStyles.button,
      buttonClassName,
      directionalArrowStyles.mirrorInRtl,
      isActive && hoverArrowTrackStyles.buttonHovered
    )}
  >
    <MotionSpan
      animate={
        arrowIsMoving && prefersReducedMotion !== true
          ? { x: 20, y: -20 }
          : { x: 0, y: 0 }
      }
      onAnimationComplete={onAnimationComplete}
      transition={
        arrowIsMoving
          ? { bounce: 0.35, duration: 0.35, type: "spring" }
          : { duration: 0 }
      }
      className={hoverArrowTrackStyles.track}
    >
      <span
        className={cn(
          hoverArrowTrackStyles.icon,
          hoverArrowTrackStyles.iconOutgoing
        )}
      >
        <HugeiconsIcon
          aria-hidden="true"
          icon={ArrowUpRight01Icon}
          size={20}
          strokeWidth={1.75}
        />
      </span>
      <span
        className={cn(
          hoverArrowTrackStyles.icon,
          hoverArrowTrackStyles.iconIncoming
        )}
      >
        <HugeiconsIcon
          aria-hidden="true"
          icon={ArrowUpRight01Icon}
          size={20}
          strokeWidth={1.75}
        />
      </span>
    </MotionSpan>
  </span>
);
