import { ViewTransition } from "react";
import type { ReactElement } from "react";

// The transition type the board ⇄ list switch runs under
// (addTransitionType). Only it turns the morph on, so a navigation, a
// filter or the theme's circle reveal never animates the tasks.
export const trackingTaskViewSwitchType = "tracking-task-view-switch";

// How long the whole switch runs, the last step of the wave included
// (--tracking-task-morph-duration plus nine 24ms steps, in
// tracking-task-view-transition.css), rounded up.
export const trackingTaskViewSwitchMs = 850;

// Steps of the wave: the tasks at the top of a status move first, each
// step a little later; past the last step they all move with it.
const trackingTaskWaveSteps = 9;

/**
 * One task (or a status head) that morphs between its board card and its
 * list row when the view switches: the same name in both views pairs them,
 * so the browser's view transition flies the card to the row's place and
 * shape while the card's content fades out and the row's fades in (the view
 * switch rules in tracking-task-view-transition.css). index is its place in its
 * status, for the wave.
 *
 * @returns The child, wrapped in its view transition.
 */
export const TrackingTaskMorph = ({
  name,
  index = 0,
  children,
}: {
  name: string;
  index?: number;
  children: ReactElement;
}) => (
  <ViewTransition
    name={name}
    default="none"
    share={{
      [trackingTaskViewSwitchType]: `tracking-task-morph tracking-task-wave-${Math.min(index, trackingTaskWaveSteps)}`,
      default: "none",
    }}
  >
    {children}
  </ViewTransition>
);
