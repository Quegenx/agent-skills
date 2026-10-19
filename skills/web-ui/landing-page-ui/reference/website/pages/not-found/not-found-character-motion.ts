import type { Transition } from "motion/react";

// The question marks bobbing above the 404 character's head
// (not-found-head-drawing.tsx), each one (index 0-2) out of step with the others.
export const notFoundQuestionMarkBob = { rotate: [-4, 4], y: [4, -4] };

/**
 * The 404 character's question marks' sway, each a little behind the one
 * before.
 *
 * @param index - The question mark's place, from 0.
 * @returns The question mark's motion transition.
 */
export const notFoundQuestionMarkTransition = (index: number): Transition => ({
  rotate: {
    delay: 0.75 - 0.5 * index,
    duration: 1.5,
    ease: "easeInOut",
    repeat: Number.POSITIVE_INFINITY,
    repeatType: "reverse",
  },
  y: {
    delay: -0.5 * index,
    duration: 1.5,
    ease: "easeInOut",
    repeat: Number.POSITIVE_INFINITY,
    repeatType: "reverse",
  },
});
