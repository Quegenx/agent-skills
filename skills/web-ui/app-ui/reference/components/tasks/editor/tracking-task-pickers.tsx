import type { ComponentProps, SyntheticEvent } from "react";

import {
  app_task_priority_change_label,
  app_task_status_change_label,
} from "#/paraglide/messages";
import {
  trackingTaskPriorityChoices,
  trackingTaskStatusChoices,
} from "@/components/tasks/editor/tracking-task-choices";
import { SmoothSelect } from "@/components/ui/navigation/dropdown/smooth-select";
import { useTrackingTaskActions } from "@/lib/tasks/tracking-task-atoms";
import {
  trackingTaskPriorityLabels,
  trackingTaskStatusLabels,
} from "@/lib/tasks/tracking-task-labels";
import type { TrackingTask } from "@/lib/tasks/tracking-task-schema";

// The picker sits on a card or row that opens or drags the task, so its
// presses and keys stay its own.
const keepTaskPress = (event: SyntheticEvent) => {
  event.stopPropagation();
};

// A picker on a card or row: the value's icon, opening into the choices
// with their icons. A new choice is saved at once.
const TrackingTaskPicker = <Value extends string>({
  items,
  label,
  onPick,
  value,
}: {
  items: ComponentProps<typeof SmoothSelect<Value>>["items"];
  label: string;
  onPick: (value: Value) => void;
  value: Value;
}) => (
  <span
    role="presentation"
    className="tracking-task-picker"
    onPointerDown={keepTaskPress}
    onClick={keepTaskPress}
    onKeyDown={keepTaskPress}
  >
    <SmoothSelect
      appearance="icon"
      label={label}
      items={items}
      value={value}
      onChange={(next) => {
        if (next !== value) {
          onPick(next);
        }
      }}
    />
  </span>
);

/**
 * The status picker on a card or row.
 *
 * @returns The status picker.
 */
export const TrackingTaskStatusPicker = ({ task }: { task: TrackingTask }) => {
  const { updateTrackingTasks } = useTrackingTaskActions();

  return (
    <TrackingTaskPicker
      items={trackingTaskStatusChoices()}
      label={app_task_status_change_label({
        status: trackingTaskStatusLabels[task.status],
      })}
      onPick={(status) => {
        updateTrackingTasks([task.id], { status });
      }}
      value={task.status}
    />
  );
};

/**
 * The priority picker, the same way.
 *
 * @returns The priority picker.
 */
export const TrackingTaskPriorityPicker = ({
  task,
}: {
  task: TrackingTask;
}) => {
  const { updateTrackingTasks } = useTrackingTaskActions();

  return (
    <TrackingTaskPicker
      items={trackingTaskPriorityChoices()}
      label={app_task_priority_change_label({
        priority: trackingTaskPriorityLabels[task.priority],
      })}
      onPick={(priority) => {
        updateTrackingTasks([task.id], { priority });
      }}
      value={task.priority}
    />
  );
};
