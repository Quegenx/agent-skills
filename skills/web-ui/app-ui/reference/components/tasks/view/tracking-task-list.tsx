import { Collapsible } from "@base-ui/react/collapsible";

import { app_task_select } from "#/paraglide/messages";
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
import { Checkbox } from "@/components/ui/forms/fields/checkbox";
import { AppIcon } from "@/components/ui/general/app-icon";
import type {
  TrackingTask,
  TrackingTaskStatus,
} from "@/lib/tasks/tracking-task-schema";
import type { TrackingTaskColumns } from "@/lib/tasks/tracking-task-view";

interface TrackingTaskSelection {
  selectedIds: ReadonlySet<string>;
  onToggle: (taskId: string, selected: boolean) => void;
}

// The list row: a checkbox that shows on hover (or once ticked), the
// status picker (on wider rows), the priority picker, the task, its labels
// (on the widest rows) and the day it was created. The task opens it.
const TrackingTaskRow = ({
  task,
  selection,
  onOpen,
}: {
  task: TrackingTask;
  selection?: TrackingTaskSelection;
  onOpen: () => void;
}) => {
  const selected = selection?.selectedIds.has(task.id) ?? false;
  const openProps = useTrackingTaskOpenProps(task, onOpen);

  return (
    <div className="tracking-task-row" data-selected={selected || undefined}>
      {selection && (
        <span className="tracking-task-row-check">
          <Checkbox
            checked={selected}
            aria-label={app_task_select({ sentence: task.sentence })}
            onCheckedChange={(checked) => {
              selection.onToggle(task.id, checked);
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
          />
        </span>
      )}
      <span className="tracking-task-row-status">
        <TrackingTaskStatusPicker task={task} />
      </span>
      <TrackingTaskPriorityPicker task={task} />
      <button type="button" className="tracking-task-row-open" {...openProps}>
        <bdi className="tracking-task-row-title">{task.sentence}</bdi>
        <TrackingTaskLabels labels={task.labels} />
        <TrackingTaskCreated createdAt={task.createdAt} />
      </button>
    </div>
  );
};

/**
 * The list view (also the tasks panel's): a group per visible status
 * with a sticky header that folds it, its count and "+", then its rows.
 * Rows drag like the board's cards.
 *
 * @returns The list.
 */
export const TrackingTaskList = ({
  columns,
  visibleStatuses,
  reorderAllowed,
  selection,
  onOpenTask,
  onCreate,
}: {
  columns: TrackingTaskColumns;
  visibleStatuses: readonly TrackingTaskStatus[];
  reorderAllowed: boolean;
  selection?: TrackingTaskSelection;
  onOpenTask: (task: TrackingTask) => void;
  onCreate: (status: TrackingTaskStatus) => void;
}) => {
  const renderTask = (task: TrackingTask) => (
    <TrackingTaskRow
      task={task}
      selection={selection}
      onOpen={() => {
        onOpenTask(task);
      }}
    />
  );

  return (
    <TrackingTaskDnd columns={columns}>
      {(tasksIn) => (
        <div className="tracking-task-list">
          {visibleStatuses.map((status) => (
            // The whole gray card morphs from and into its board column.
            <TrackingTaskMorph
              key={status}
              name={`tracking-task-status-${status}`}
            >
              <Collapsible.Root defaultOpen className="tracking-task-group">
                <div className="tracking-task-group-head">
                  <Collapsible.Trigger className="tracking-task-group-trigger">
                    <span className="tracking-task-group-chevron">
                      <AppIcon icon="chevron-down" />
                    </span>
                    <TrackingTaskStatusIcon status={status} />
                    <TrackingTaskStatusTitle
                      count={tasksIn(status).length}
                      status={status}
                    />
                  </Collapsible.Trigger>
                  <TrackingTaskAddButton
                    onCreate={() => {
                      onCreate(status);
                    }}
                    status={status}
                  />
                </div>
                <Collapsible.Panel className="collapsible-panel">
                  <TrackingTaskSortableItems
                    className="tracking-task-group-rows"
                    dragDisabled={!reorderAllowed}
                    renderTask={renderTask}
                    status={status}
                    tasks={tasksIn(status)}
                  />
                </Collapsible.Panel>
              </Collapsible.Root>
            </TrackingTaskMorph>
          ))}
        </div>
      )}
    </TrackingTaskDnd>
  );
};
