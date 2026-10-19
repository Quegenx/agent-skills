import { useState } from "react";

import {
  app_cancel,
  app_delete,
  app_duplicate,
  app_last_scan_failed,
  app_recent_scans,
  app_task_delete_description,
  app_task_delete_title,
  app_task_edit,
  app_task_edit_description,
  app_task_save,
} from "#/paraglide/messages";
import {
  TrackingTaskBoardFields,
  TrackingTaskGoalFields,
  TrackingTaskRunFields,
  TrackingTaskWatchFields,
} from "@/components/tasks/editor/tracking-task-fields";
import { TrackingTaskScanRuns } from "@/components/tasks/editor/tracking-task-scan-runs";
import { Card, CardContent } from "@/components/ui/display/card";
import { ConfirmDeleteDialog } from "@/components/ui/feedback/dialog/alert-dialog";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/feedback/dialog/sheet";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/feedback/status/alert";
import { FieldLegend, FieldSet } from "@/components/ui/forms/fields/field";
import { Button } from "@/components/ui/general/button";
import { appDirection, appSheetSide } from "@/lib/i18n/app-direction";
import { useTrackingTaskActions } from "@/lib/tasks/tracking-task-atoms";
import type { TrackingTask } from "@/lib/tasks/tracking-task-schema";

import { isNonEmptyText } from "../../../../backend/shared/text/non-empty-text";

// The task's fields: what it is after, its place on the board, what to
// watch, then scanning, replies and alerts. The sheet keys the form by task ID, so each opened task starts
// a new draft.
const TrackingTaskForm = ({
  userId,
  initialTask,
  onSaved,
}: {
  userId: string;
  initialTask: TrackingTask;
  onSaved: () => void;
}) => {
  const { saveTrackingTask } = useTrackingTaskActions();
  const [draft, setDraft] = useState(initialTask);
  const [sentenceInvalid, setSentenceInvalid] = useState(false);

  const set = <K extends keyof TrackingTask>(
    key: K,
    value: TrackingTask[K]
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  return (
    // As in the group details sheet: an LTR scroller keeps the scrollbar on
    // the right edge, and the form inside follows the page's direction.
    <div
      dir="ltr"
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
    >
      {isNonEmptyText(initialTask.lastScanError) && (
        <div dir={appDirection()} className="px-ui-md pb-ui-md">
          <Alert variant="destructive">
            <AlertTitle>{app_last_scan_failed()}</AlertTitle>
            <AlertDescription>{initialTask.lastScanError}</AlertDescription>
          </Alert>
        </div>
      )}
      <form
        id="tracking-task-form"
        dir={appDirection()}
        noValidate
        className="flex flex-col gap-ui-md px-ui-md"
        // A client action: React handles the submit, so the page never
        // navigates, and the controlled fields keep their values.
        action={() => {
          const sentence = draft.sentence.trim();

          if (!sentence) {
            setSentenceInvalid(true);
            document
              .querySelector<HTMLTextAreaElement>("#tracking-task-sentence")
              ?.focus();

            return;
          }

          saveTrackingTask({ ...draft, sentence });
          onSaved();
        }}
      >
        {/* Each section on a gray card with white fields, as the settings'
            and the posts page's forms are. */}
        <Card>
          <CardContent>
            <TrackingTaskGoalFields
              draft={draft}
              set={set}
              sentenceInvalid={sentenceInvalid}
              onSentenceValid={() => {
                setSentenceInvalid(false);
              }}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <TrackingTaskBoardFields draft={draft} set={set} />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <TrackingTaskWatchFields userId={userId} draft={draft} set={set} />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <TrackingTaskRunFields draft={draft} set={set} />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <FieldSet>
              <FieldLegend>{app_recent_scans()}</FieldLegend>
              <TrackingTaskScanRuns userId={userId} taskId={initialTask.id} />
            </FieldSet>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

/**
 * Edits one task; task is null while the sheet is closed. Nothing is saved
 * until app_task_save(), so closing discards the changes. שכפול adds a copy
 * right after it, and מחיקה deletes it after a confirmation; both close the
 * sheet.
 *
 * @returns The task sheet.
 */
export const TrackingTaskSheet = ({
  userId,
  task,
  onClose,
}: {
  userId: string;
  task: TrackingTask | null;
  onClose: () => void;
}) => {
  const { duplicateTrackingTask, removeTrackingTasks } =
    useTrackingTaskActions();

  const [removing, setRemoving] = useState(false);

  return (
    <>
      <Sheet
        open={task !== null}
        onOpenChange={(open) => {
          if (!open) {
            onClose();
          }
        }}
      >
        <SheetContent side={appSheetSide()} dir={appDirection()} size="wide">
          <SheetHeader>
            <SheetTitle>{app_task_edit()}</SheetTitle>
            <SheetDescription>{app_task_edit_description()}</SheetDescription>
          </SheetHeader>
          {task && (
            <TrackingTaskForm
              key={task.id}
              userId={userId}
              initialTask={task}
              onSaved={onClose}
            />
          )}
          {/* Saving and leaving first; the actions on the task itself, as
              buttons too, on their own row. */}
          <SheetFooter>
            <div className="flex gap-ui-sm">
              <Button
                type="submit"
                form="tracking-task-form"
                className="flex-1"
              >
                {app_task_save()}
              </Button>
              <SheetClose
                render={
                  <Button type="button" variant="outline" className="flex-1" />
                }
              >
                {app_cancel()}
              </SheetClose>
            </div>
            <div className="flex gap-ui-sm">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  if (task) {
                    duplicateTrackingTask(task.id);
                  }

                  onClose();
                }}
              >
                {app_duplicate()}
              </Button>
              <Button
                type="button"
                variant="destructive-soft"
                className="flex-1"
                onClick={() => {
                  setRemoving(true);
                }}
              >
                {app_delete()}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <ConfirmDeleteDialog
        description={app_task_delete_description()}
        onConfirm={() => {
          if (task) {
            removeTrackingTasks([task.id]);
          }

          setRemoving(false);
          onClose();
        }}
        onOpenChange={setRemoving}
        open={removing}
        subject={task?.sentence}
        title={app_task_delete_title()}
      />
    </>
  );
};
