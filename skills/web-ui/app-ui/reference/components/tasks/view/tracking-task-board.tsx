import {
  app_column_actions_label,
  app_column_hide,
  app_scan_failed,
  app_task_add,
} from "#/paraglide/messages";
import { TrackingTaskStatusIcon } from "@/components/tasks/editor/tracking-task-icons";
import {
  TrackingTaskPriorityPicker,
  TrackingTaskStatusPicker,
} from "@/components/tasks/editor/tracking-task-pickers";
import { TrackingTaskDnd } from "@/components/tasks/view/tracking-task-dnd";
import {
  TrackingTaskAddButton,
  TrackingTaskCreated,
  TrackingTaskLabels,
  TrackingTaskSortableItems,
  TrackingTaskStatusTitle,
  useTrackingTaskOpenProps,
} from "@/components/tasks/view/tracking-task-view-parts";
import { TrackingTaskMorph } from "@/components/tasks/view/tracking-task-view-switch";
import { TooltipHint } from "@/components/ui/display/tooltip";
import { AppIcon } from "@/components/ui/general/app-icon";
import { SmoothDropdown } from "@/components/ui/navigation/dropdown/smooth-dropdown";
import { trackingTaskStatusLabels } from "@/lib/tasks/tracking-task-labels";
import type {
  TrackingTask,
  TrackingTaskStatus,
} from "@/lib/tasks/tracking-task-schema";
import type { TrackingTaskColumns } from "@/lib/tasks/tracking-task-view";

import { isNonEmptyText } from "../../../../backend/shared/text/non-empty-text";

/**
 * The board card: the status picker and the task, its labels, then
 * the day it was created and the priority picker. The title opens the task.
 * The agent chat shows the tasks it worked on with the same card.
 *
 * @returns The card.
 */
export const TrackingTaskCard = ({
  task,
  onOpen,
}: {
  task: TrackingTask;
  onOpen: () => void;
}) => {
  const openProps = useTrackingTaskOpenProps(task, onOpen);

  return (
    <div className="tracking-task-card">
      <div className="tracking-task-card-head">
        <TrackingTaskStatusPicker task={task} />
        <button type="button" className="tracking-task-title" {...openProps}>
          <bdi>{task.sentence}</bdi>
        </button>
      </div>
      <TrackingTaskLabels labels={task.labels} />
      {isNonEmptyText(task.lastScanError) && (
        <TooltipHint label={task.lastScanError}>
          <p className="tracking-task-scan-error">{app_scan_failed()}</p>
        </TooltipHint>
      )}
      <div className="tracking-task-card-foot">
        <TrackingTaskCreated createdAt={task.createdAt} />
        <TrackingTaskPriorityPicker task={task} />
      </div>
    </div>
  );
};

// One column: its status, count, a menu that hides it (the last visible
// column stays), and "+" to add a task in this status; the cards; and an
// add button that shows while the column is hovered.
const TrackingTaskColumn = ({
  status,
  tasks,
  canHide,
  dragDisabled,
  onOpenTask,
  onCreate,
  onHide,
}: {
  status: TrackingTaskStatus;
  tasks: TrackingTask[];
  canHide: boolean;
  dragDisabled: boolean;
  onOpenTask: (task: TrackingTask) => void;
  onCreate: () => void;
  onHide: () => void;
}) => (
  // The whole column morphs into its status's gray card in the list, so the
  // gray well glides too instead of appearing at once.
  <TrackingTaskMorph name={`tracking-task-status-${status}`}>
    <section
      className="tracking-task-column"
      aria-label={trackingTaskStatusLabels[status]}
    >
      <header className="tracking-task-column-head">
        <TrackingTaskStatusIcon status={status} />
        <TrackingTaskStatusTitle count={tasks.length} heading status={status} />
        <div className="tracking-task-column-actions">
          <SmoothDropdown
            appearance="icon"
            label={app_column_actions_label()}
            panelWidth={160}
            actions={[
              {
                label: app_column_hide(),
                disabled: !canHide,
                onSelect: onHide,
              },
            ]}
          >
            <AppIcon icon="more" />
          </SmoothDropdown>
          <TrackingTaskAddButton onCreate={onCreate} status={status} />
        </div>
      </header>
      <TrackingTaskSortableItems
        className="tracking-task-column-content"
        dragDisabled={dragDisabled}
        renderTask={(task) => (
          <TrackingTaskCard
            task={task}
            onOpen={() => {
              onOpenTask(task);
            }}
          />
        )}
        status={status}
        tasks={tasks}
      >
        <button
          type="button"
          className="tracking-task-column-add"
          onClick={onCreate}
        >
          {/* One child, so the dialog grows out of this button as it does
              out of the column's "+" (useDialogMorph morphs only a button
              whose content is one element). */}
          <span className="inline-flex items-center gap-1.5">
            <AppIcon icon="agent-plus" />
            {app_task_add()}
          </span>
        </button>
      </TrackingTaskSortableItems>
    </section>
  </TrackingTaskMorph>
);

/**
 * The kanban board: one column per visible status, side by side and
 * scrolling sideways when they do not fit. Cards drag within a column to
 * reorder and across columns to change status. While the tasks are sorted
 * or filtered the order is not the stored one, so dragging is off.
 *
 * @returns The board.
 */
export const TrackingTaskBoard = ({
  columns,
  visibleStatuses,
  reorderAllowed,
  onOpenTask,
  onCreate,
  onHideStatus,
}: {
  columns: TrackingTaskColumns;
  visibleStatuses: readonly TrackingTaskStatus[];
  reorderAllowed: boolean;
  onOpenTask: (task: TrackingTask) => void;
  onCreate: (status: TrackingTaskStatus) => void;
  onHideStatus: (status: TrackingTaskStatus) => void;
}) => (
  <TrackingTaskDnd columns={columns}>
    {(tasksIn) => (
      <div className="tracking-task-board">
        {visibleStatuses.map((status) => (
          <TrackingTaskColumn
            key={status}
            status={status}
            tasks={tasksIn(status)}
            canHide={visibleStatuses.length > 1}
            dragDisabled={!reorderAllowed}
            onOpenTask={onOpenTask}
            onCreate={() => {
              onCreate(status);
            }}
            onHide={() => {
              onHideStatus(status);
            }}
          />
        ))}
      </div>
    )}
  </TrackingTaskDnd>
);
