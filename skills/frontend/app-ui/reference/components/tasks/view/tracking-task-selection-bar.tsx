import { useState } from "react";

import {
  app_clear_selection,
  app_delete,
  app_set_priority,
  app_set_status,
  app_tasks_delete_description,
  app_tasks_selected,
} from "#/paraglide/messages";
import {
  trackingTaskPriorityChoices,
  trackingTaskStatusChoices,
} from "@/components/tasks/editor/tracking-task-choices";
import {
  TrackingTaskPriorityIcon,
  TrackingTaskStatusIcon,
} from "@/components/tasks/editor/tracking-task-icons";
import { InPlaceConfirmButton } from "@/components/ui/feedback/confirm/in-place-confirm-button";
import { Button } from "@/components/ui/general/button";
import { AppIcon } from "@/components/ui/general/app-icon";
import { MorphText } from "@/components/ui/general/morph-text";
import { SmoothDropdown } from "@/components/ui/navigation/dropdown/smooth-dropdown";
import { useTrackingTaskActions } from "@/lib/tasks/tracking-task-atoms";
import {
  trackingTaskPriorityItems,
  trackingTaskStatusItems,
} from "@/lib/tasks/tracking-task-labels";

/**
 * Bulk actions for the tasks ticked in the list, laid out as our
 * selection bar (the groups table's): how many are chosen, clear, set their
 * status or priority, and delete them. Deleting asks in place, as ניהול
 * נתונים does: the button turns solid red, ביטול springs out beside it and
 * the count morphs into what will be lost. It opens
 * and closes as a disclosure panel.
 *
 * @returns The selection bar.
 */
export const TrackingTaskSelectionBar = ({
  selectedIds,
  onClear,
}: {
  selectedIds: readonly string[];
  onClear: () => void;
}) => {
  const { removeTrackingTasks, updateTrackingTasks } = useTrackingTaskActions();
  const [confirming, setConfirming] = useState(false);
  const open = selectedIds.length > 0;
  // While the bar collapses, keep the last count instead of showing zero.
  const [shown, setShown] = useState(0);

  if (open && shown !== selectedIds.length) {
    setShown(selectedIds.length);
  }

  // A closed bar asks nothing; reopened, it starts from מחיקה again.
  if (!open && confirming) {
    setConfirming(false);
  }

  return (
    <div className="disclosure-panel" data-open={open} inert={!open}>
      <div className="disclosure-panel-inner">
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-secondary px-4 py-2">
          {/* The count, morphing into what deleting loses while it asks:
              only as wide as what it says, so ניקוי הבחירה sits right beside
              it and slides along as the text changes. */}
          <output
            aria-live="polite"
            className={`text-sm ${confirming ? "text-muted-foreground" : "font-medium"}`}
          >
            <MorphText>
              {confirming
                ? app_tasks_delete_description()
                : app_tasks_selected({ count: shown })}
            </MorphText>
          </output>
          <Button variant="destructive-soft" size="sm" onClick={onClear}>
            {app_clear_selection()}
          </Button>
          <span className="ms-auto">
            <SmoothDropdown
              appearance="chip"
              label={app_set_status()}
              options={trackingTaskStatusChoices().map((item) => ({
                ...item,
                selected: false,
              }))}
              onSelect={(value) => {
                const status = trackingTaskStatusItems.find(
                  (item) => item.value === value
                )?.value;

                if (status) {
                  updateTrackingTasks(selectedIds, { status });
                }
              }}
            >
              <TrackingTaskStatusIcon status="active" />
              {app_set_status()}
            </SmoothDropdown>
          </span>
          <SmoothDropdown
            appearance="chip"
            label={app_set_priority()}
            options={trackingTaskPriorityChoices().map((item) => ({
              ...item,
              selected: false,
            }))}
            onSelect={(value) => {
              const priority = trackingTaskPriorityItems.find(
                (item) => item.value === value
              )?.value;

              if (priority) {
                updateTrackingTasks(selectedIds, { priority });
              }
            }}
          >
            <TrackingTaskPriorityIcon priority="high" />
            {app_set_priority()}
          </SmoothDropdown>
          <InPlaceConfirmButton
            asking={confirming}
            label={app_delete()}
            confirmLabel={app_delete()}
            size="sm"
            icon={<AppIcon icon="agent-trash" />}
            cancelSide="start"
            onAsk={() => {
              setConfirming(true);
            }}
            onConfirm={() => {
              removeTrackingTasks(selectedIds);
              onClear();
            }}
            onCancel={() => {
              setConfirming(false);
            }}
          />
        </div>
      </div>
    </div>
  );
};
