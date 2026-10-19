import type { ReactElement, ReactNode } from "react";

import { app_task_add_to } from "#/paraglide/messages";
import {
  TrackingTaskDropZone,
  TrackingTaskSortable,
} from "@/components/tasks/view/tracking-task-dnd";
import { TrackingTaskMorph } from "@/components/tasks/view/tracking-task-view-switch";
import { TooltipHint } from "@/components/ui/display/tooltip";
import { AppIcon } from "@/components/ui/general/app-icon";
import { trackingTaskStatusLabels } from "@/lib/tasks/tracking-task-labels";
import { usePrefetchTrackingTaskScanRuns } from "@/lib/tasks/tracking-task-scan-run-atoms";
import type {
  TrackingTask,
  TrackingTaskStatus,
} from "@/lib/tasks/tracking-task-schema";
import { trackingTaskCreatedFormat } from "@/lib/tasks/tracking-task-view";

// The parts the board's cards and columns share with the list's rows and
// groups (tracking-task-board.tsx, tracking-task-list.tsx).

/**
 * What opens a task from its card or row: a click, and the scan history
 * fetched ahead on hover or focus. Pressing it does not start a drag.
 *
 * @param task - The task to open.
 * @param onOpen - Opens it.
 * @returns The click, focus, pointer-enter and pointer-down handlers to spread
 *   on the card or row.
 */
export const useTrackingTaskOpenProps = (
  task: TrackingTask,
  onOpen: () => void
) => {
  const prefetchScanRuns = usePrefetchTrackingTaskScanRuns();

  return {
    onClick: onOpen,
    onFocus: () => {
      prefetchScanRuns(task.id);
    },
    onPointerDown: (event: { stopPropagation: () => void }) => {
      event.stopPropagation();
    },
    onPointerEnter: () => {
      prefetchScanRuns(task.id);
    },
  };
};

/**
 * A task's labels as tags, or nothing when it has none.
 *
 * @param props - labels: the task's labels.
 * @returns The labels, or null.
 */
export const TrackingTaskLabels = ({
  labels,
}: {
  labels: readonly string[];
}) => {
  if (labels.length > 0) {
    return (
      <span className="tracking-task-labels" aria-hidden="true">
        {labels.map((label) => (
          <span key={label} className="app-tag tracking-task-label">
            {label}
          </span>
        ))}
      </span>
    );
  }

  return null;
};

/**
 * The day a task was created, as a date in the page's language.
 *
 * @param props - createdAt: when the task was created, as ISO.
 * @returns The time element.
 */
export const TrackingTaskCreated = ({ createdAt }: { createdAt: string }) => (
  <time dateTime={createdAt} className="tracking-task-created">
    {trackingTaskCreatedFormat().format(new Date(createdAt))}
  </time>
);

/**
 * A status's name and its task count, as a column or group title.
 *
 * @returns The title.
 */
export const TrackingTaskStatusTitle = ({
  count,
  heading = false,
  status,
}: {
  count: number;
  heading?: boolean;
  status: TrackingTaskStatus;
}) => {
  const Title = heading ? "h3" : "span";

  return (
    <Title className="tracking-task-column-title">
      {trackingTaskStatusLabels[status]}
      <span>{count}</span>
    </Title>
  );
};

/**
 * "+" beside a status's title: a new task in that status.
 *
 * @returns The add button.
 */
export const TrackingTaskAddButton = ({
  onCreate,
  status,
}: {
  onCreate: () => void;
  status: TrackingTaskStatus;
}) => {
  const label = app_task_add_to({ status: trackingTaskStatusLabels[status] });

  return (
    <TooltipHint label={label}>
      <button
        type="button"
        className="tracking-task-icon-button"
        aria-label={label}
        onClick={onCreate}
      >
        <AppIcon icon="agent-plus" />
      </button>
    </TooltipHint>
  );
};

/**
 * A status's tasks as a drop zone of sortable items, each morphing between
 * the board and the list. children is what follows the items.
 *
 * @returns The drop zone and its items.
 */
export const TrackingTaskSortableItems = ({
  children,
  className,
  dragDisabled,
  renderTask,
  status,
  tasks,
}: {
  children?: ReactNode;
  className: string;
  dragDisabled: boolean;
  renderTask: (task: TrackingTask) => ReactElement;
  status: TrackingTaskStatus;
  tasks: TrackingTask[];
}) => (
  <TrackingTaskDropZone status={status} tasks={tasks} className={className}>
    {tasks.map((task, index) => (
      <TrackingTaskSortable
        key={task.id}
        taskId={task.id}
        disabled={dragDisabled}
      >
        <TrackingTaskMorph name={`tracking-task-${task.id}`} index={index}>
          {renderTask(task)}
        </TrackingTaskMorph>
      </TrackingTaskSortable>
    ))}
    {children}
  </TrackingTaskDropZone>
);
