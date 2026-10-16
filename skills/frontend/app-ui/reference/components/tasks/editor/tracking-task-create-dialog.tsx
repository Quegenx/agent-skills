import { Dialog } from "@base-ui/react/dialog";
import { useState } from "react";

import {
  app_cancel,
  app_task_create,
  app_task_create_description,
  app_task_details,
  app_task_details_placeholder,
  app_task_labels,
  app_task_priority,
  app_task_sentence,
  app_task_sentence_example,
  app_task_sentence_required_create,
  app_task_status,
} from "#/paraglide/messages";
import {
  trackingTaskPriorityChoices,
  trackingTaskStatusChoices,
} from "@/components/tasks/editor/tracking-task-choices";
import { TrackingTaskLabelsField } from "@/components/tasks/editor/tracking-task-labels-field";
import { Card, CardContent } from "@/components/ui/display/card";
import { useDialogMorph } from "@/components/ui/feedback/dialog/dialog-morph";
import { AppDialogHeader } from "@/components/ui/feedback/dialog/app-dialog-header";
import { Field, FieldLabel } from "@/components/ui/forms/fields/field";
import { Input } from "@/components/ui/forms/fields/input";
import { Button } from "@/components/ui/general/button";
import { SmoothSelect } from "@/components/ui/navigation/dropdown/smooth-select";
import { appDirection } from "@/lib/i18n/app-direction";
import { useUserSettings } from "@/lib/settings/user-settings/user-settings-atoms";
import { useTrackingTaskActions } from "@/lib/tasks/tracking-task-atoms";
import { newTrackingTask } from "@/lib/tasks/tracking-task-schema";
import type {
  TrackingTaskPriority,
  TrackingTaskStatus,
} from "@/lib/tasks/tracking-task-schema";

const trackingTaskDetailsMaxLength = 1000;

// The form, keyed by each opening so it starts empty with the column's
// status.
const TrackingTaskCreateForm = ({
  formId,
  defaultStatus,
  onSubmit,
}: {
  formId: string;
  defaultStatus: TrackingTaskStatus;
  onSubmit: (task: {
    sentence: string;
    details: string;
    status: TrackingTaskStatus;
    priority: TrackingTaskPriority;
    labels: string[];
  }) => void;
}) => {
  const [sentence, setSentence] = useState("");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState(defaultStatus);
  const [priority, setPriority] = useState<TrackingTaskPriority>("none");
  const [labels, setLabels] = useState<string[]>([]);
  const [invalid, setInvalid] = useState(false);

  // On a gray card, as the settings' forms are: the fields inside it are
  // white, so they stand out on the white dialog.
  return (
    <Card>
      <CardContent>
        <form
          id={formId}
          noValidate
          className="tracking-task-create-form"
          onSubmit={(event) => {
            event.preventDefault();

            if (!sentence.trim()) {
              setInvalid(true);
              document
                .querySelector<HTMLInputElement>(`#${formId}-title`)
                ?.focus();

              return;
            }

            onSubmit({
              sentence: sentence.trim(),
              details: details.trim(),
              status,
              priority,
              labels,
            });
          }}
        >
          <Field data-invalid={invalid || undefined}>
            <FieldLabel htmlFor={`${formId}-title`}>
              {app_task_sentence()}
            </FieldLabel>
            <Input
              id={`${formId}-title`}
              required
              maxLength={300}
              aria-invalid={invalid || undefined}
              aria-describedby={invalid ? `${formId}-title-error` : undefined}
              placeholder={app_task_sentence_example()}
              value={sentence}
              onChange={(event) => {
                setSentence(event.target.value);

                if (event.target.value.trim()) {
                  setInvalid(false);
                }
              }}
            />
            {invalid && (
              <p
                id={`${formId}-title-error`}
                className="text-sm text-destructive"
              >
                {app_task_sentence_required_create()}
              </p>
            )}
          </Field>
          <Field>
            <div className="flex items-baseline justify-between">
              <FieldLabel htmlFor={`${formId}-details`}>
                {app_task_details()}
              </FieldLabel>
              <span className="text-xs text-muted-foreground">
                {details.length}/{trackingTaskDetailsMaxLength}
              </span>
            </div>
            <textarea
              id={`${formId}-details`}
              className="app-input app-textarea tracking-task-details-input"
              maxLength={trackingTaskDetailsMaxLength}
              placeholder={app_task_details_placeholder()}
              value={details}
              onChange={(event) => {
                setDetails(event.target.value);
              }}
            />
          </Field>
          <div className="tracking-task-create-grid">
            <Field>
              <FieldLabel htmlFor={`${formId}-status`}>
                {app_task_status()}
              </FieldLabel>
              <SmoothSelect
                triggerId={`${formId}-status`}
                label={app_task_status()}
                fullWidth
                items={trackingTaskStatusChoices()}
                value={status}
                onChange={setStatus}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`${formId}-priority`}>
                {app_task_priority()}
              </FieldLabel>
              <SmoothSelect
                triggerId={`${formId}-priority`}
                label={app_task_priority()}
                fullWidth
                items={trackingTaskPriorityChoices()}
                value={priority}
                onChange={setPriority}
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor={`${formId}-labels`}>
              {app_task_labels()}
            </FieldLabel>
            <TrackingTaskLabelsField
              id={`${formId}-labels`}
              value={labels}
              onChange={setLabels}
            />
          </Field>
        </form>
      </CardContent>
    </Card>
  );
};

/**
 * The "Create task" dialog in our dialog style: the task in one
 * sentence, its details, status,
 * priority and labels. The column it was opened from sets the status. The
 * task takes the user's scan frequency; location, budget and the rest are
 * edited on the task afterwards.
 *
 * @returns The dialog.
 */
export const TrackingTaskCreateDialog = ({
  userId,
  defaultStatus,
  open,
  onOpenChange,
}: {
  userId: string;
  defaultStatus: TrackingTaskStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { settings } = useUserSettings(userId);
  const { saveTrackingTask } = useTrackingTaskActions();
  const formId = "tracking-task-create";
  // The form stays while the dialog closes, and starts afresh once it has.
  const [formKey, setFormKey] = useState(0);
  // Grows out of the "+" that opened it (see useDialogMorph).
  const morph = useDialogMorph(open);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={(nextOpen) => {
        if (!nextOpen) {
          setFormKey(formKey + 1);
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="app-backdrop" />
        <Dialog.Popup
          {...morph}
          className="app-dialog"
          // The task's sentence takes focus, as a title field does.
          initialFocus={() =>
            document.querySelector<HTMLElement>(`#${formId}-title`)
          }
        >
          {/* One wrapper, so the morph can counter-scale the content. */}
          <div>
            <AppDialogHeader title={app_task_create()} />
            <Dialog.Description className="app-dialog-description">
              {app_task_create_description()}
            </Dialog.Description>
            {/* As in the task sheet: an LTR scroller keeps the scrollbar on
                the right edge, and the form inside follows the page's direction. */}
            <div className="tracking-task-create-body" dir="ltr">
              <div dir={appDirection()}>
                <TrackingTaskCreateForm
                  key={`${formKey}-${defaultStatus}`}
                  formId={formId}
                  defaultStatus={defaultStatus}
                  onSubmit={(task) => {
                    if (!settings) {
                      return;
                    }

                    saveTrackingTask(
                      newTrackingTask(
                        task.sentence,
                        { scanFrequency: settings.automation.scanFrequency },
                        {
                          details: task.details,
                          status: task.status,
                          priority: task.priority,
                          labels: task.labels,
                        }
                      )
                    );
                    onOpenChange(false);
                  }}
                />
              </div>
            </div>
            <div className="app-dialog-footer">
              <Dialog.Close render={<Button variant="outline" />}>
                {app_cancel()}
              </Dialog.Close>
              <Button type="submit" form={formId} disabled={!settings}>
                {app_task_create()}
              </Button>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
