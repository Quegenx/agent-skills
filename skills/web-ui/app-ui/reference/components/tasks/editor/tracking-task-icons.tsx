import { cn } from "cn";

import { AppIcon } from "@/components/ui/general/app-icon";
import type {
  TrackingTaskPriority,
  TrackingTaskStatus,
} from "@/lib/tasks/tracking-task-schema";

const trackingTaskStatusIcons = {
  suggested: "agent-status-backlog",
  active: "agent-status-progress",
  paused: "agent-status-todo",
  finished: "agent-status-done",
} as const;

/**
 * The status icons: a dashed circle for suggestions, a half-filled
 * circle while running, a plain circle when paused, and a check once
 * finished, all one size. Colors live in tracking-tasks.css: muted when not
 * running, the warning tone while running, green once finished.
 *
 * @returns The icon.
 */
export const TrackingTaskStatusIcon = ({
  status,
}: {
  status: TrackingTaskStatus;
}) => (
  <span className="tracking-task-status-icon" data-status={status}>
    <AppIcon icon={trackingTaskStatusIcons[status]} />
  </span>
);

/**
 * The priority icon: three dashes for none, rising bars filled to the
 * level for low, medium and high, and a square with "!" for urgent.
 *
 * @returns The icon.
 */
export const TrackingTaskPriorityIcon = ({
  priority,
  className,
}: {
  priority: TrackingTaskPriority;
  className?: string;
}) => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
    className={cn("tracking-task-priority-icon", className)}
    data-priority={priority}
  >
    {priority === "none" &&
      [1.5, 6.5, 11.5].map((x) => (
        <rect
          key={x}
          x={x}
          y={7.25}
          width={3}
          height={1.5}
          rx={0.5}
          opacity={0.9}
        />
      ))}
    {priority === "urgent" && (
      <path d="M3 1C1.91 1 1 1.91 1 3V13C1 14.09 1.91 15 3 15H13C14.09 15 15 14.09 15 13V3C15 1.91 14.09 1 13 1H3ZM7 4L9 4L8.75 9H7.25L7 4ZM9 11C9 11.55 8.55 12 8 12C7.45 12 7 11.55 7 11C7 10.45 7.45 10 8 10C8.55 10 9 10.45 9 11Z" />
    )}
    {(priority === "low" || priority === "medium" || priority === "high") &&
      [
        { x: 1.5, y: 8, height: 6, level: 1 },
        { x: 6.5, y: 5, height: 9, level: 2 },
        { x: 11.5, y: 2, height: 12, level: 3 },
      ].map((bar) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={bar.y}
          width={3}
          height={bar.height}
          rx={1}
          fillOpacity={
            bar.level <= { low: 1, medium: 2, high: 3 }[priority] ? 1 : 0.4
          }
        />
      ))}
  </svg>
);
