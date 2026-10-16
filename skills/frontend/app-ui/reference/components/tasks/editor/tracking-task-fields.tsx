import {
  app_detail_location,
  app_task,
  app_task_alerts,
  app_task_budget,
  app_task_budget_example,
  app_task_choose_groups,
  app_task_competitors,
  app_task_competitors_hint,
  app_task_competitors_placeholder,
  app_task_details,
  app_task_details_placeholder,
  app_task_groups,
  app_task_groups_hint,
  app_task_labels,
  app_task_location_example,
  app_task_on_board,
  app_task_priority,
  app_task_reply_style,
  app_task_scan_frequency,
  app_task_scan_replies,
  app_task_sentence,
  app_task_sentence_example,
  app_task_sentence_hint,
  app_task_sentence_required_save,
  app_task_status,
  app_task_what_to_track,
} from "#/paraglide/messages";
import { SavedGroupPicker } from "@/components/groups/saved/saved-group-picker";
import { TrackingTaskLabelsField } from "@/components/tasks/editor/tracking-task-labels-field";
import { TrackingTaskSiteSearchesField } from "@/components/tasks/editor/tracking-task-site-searches";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/forms/fields/field";
import { Input } from "@/components/ui/forms/fields/input";
import { SelectField } from "@/components/ui/forms/fields/select-field";
import { Switch } from "@/components/ui/forms/fields/switch";
import { useUserPlan } from "@/lib/plans/user-plan-atoms";
import {
  trackingTaskPriorityItems,
  trackingTaskReplyStyleItems,
  trackingTaskScanFrequencyItems,
  trackingTaskStatusItems,
} from "@/lib/tasks/tracking-task-labels";
import type { TrackingTask } from "@/lib/tasks/tracking-task-schema";

// The task sheet's field groups (TrackingTaskForm in tracking-task-sheet.tsx).

interface TrackingTaskFieldsProps {
  draft: TrackingTask;
  set: <K extends keyof TrackingTask>(key: K, value: TrackingTask[K]) => void;
}

/**
 * What the task is after: the sentence, and what only the user can add.
 *
 * @returns The goal fields.
 */
export const TrackingTaskGoalFields = ({
  draft,
  set,
  sentenceInvalid,
  onSentenceValid,
}: TrackingTaskFieldsProps & {
  sentenceInvalid: boolean;
  onSentenceValid: () => void;
}) => (
  <FieldSet>
    <FieldLegend>{app_task()}</FieldLegend>
    <FieldGroup>
      <Field data-invalid={sentenceInvalid || undefined}>
        <FieldLabel htmlFor="tracking-task-sentence">
          {app_task_sentence()}
        </FieldLabel>
        <textarea
          id="tracking-task-sentence"
          className="app-input app-textarea"
          rows={2}
          maxLength={300}
          required
          aria-invalid={sentenceInvalid || undefined}
          aria-describedby="tracking-task-sentence-description"
          placeholder={app_task_sentence_example()}
          value={draft.sentence}
          onChange={(event) => {
            set("sentence", event.target.value);

            if (event.target.value.trim()) {
              onSentenceValid();
            }
          }}
        />
        {sentenceInvalid ? (
          <FieldError id="tracking-task-sentence-description">
            {app_task_sentence_required_save()}
          </FieldError>
        ) : (
          <FieldDescription id="tracking-task-sentence-description">
            {app_task_sentence_hint()}
          </FieldDescription>
        )}
      </Field>
      <Field>
        <FieldLabel htmlFor="tracking-task-details">
          {app_task_details()}
        </FieldLabel>
        <textarea
          id="tracking-task-details"
          className="app-input app-textarea"
          rows={3}
          maxLength={1000}
          placeholder={app_task_details_placeholder()}
          value={draft.details}
          onChange={(event) => {
            set("details", event.target.value);
          }}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="tracking-task-location">
          {app_detail_location()}
        </FieldLabel>
        <Input
          id="tracking-task-location"
          placeholder={app_task_location_example()}
          maxLength={200}
          value={draft.location}
          onChange={(event) => {
            set("location", event.target.value);
          }}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="tracking-task-budget">
          {app_task_budget()}
        </FieldLabel>
        <Input
          id="tracking-task-budget"
          placeholder={app_task_budget_example()}
          maxLength={100}
          value={draft.budget}
          onChange={(event) => {
            set("budget", event.target.value);
          }}
        />
      </Field>
    </FieldGroup>
  </FieldSet>
);

/**
 * What the user wants watched by name; the system picks everything else.
 * Competitors, whose ads it follows too, are the Ad Library's plans'.
 *
 * @returns The watch fields.
 */
export const TrackingTaskWatchFields = ({
  userId,
  draft,
  set,
}: TrackingTaskFieldsProps & { userId: string }) => {
  const plan = useUserPlan(userId);

  return (
    <FieldSet>
      <FieldLegend>{app_task_what_to_track()}</FieldLegend>
      <FieldGroup>
        <Field>
          <FieldLabel>{app_task_groups()}</FieldLabel>
          <SavedGroupPicker
            userId={userId}
            title={app_task_choose_groups()}
            selectedIds={draft.groupIds}
            disabled={false}
            onChange={(ids) => {
              set("groupIds", ids);
            }}
          />
          <FieldDescription>{app_task_groups_hint()}</FieldDescription>
        </Field>
        <TrackingTaskSiteSearchesField
          searches={draft.siteSearches}
          onChange={(searches) => {
            set("siteSearches", searches);
          }}
        />
        {plan?.adLibrary === true && (
          <Field>
            <FieldLabel htmlFor="tracking-task-competitors">
              {app_task_competitors()}
            </FieldLabel>
            <textarea
              id="tracking-task-competitors"
              className="app-input app-textarea"
              rows={3}
              maxLength={2000}
              placeholder={app_task_competitors_placeholder()}
              aria-describedby="tracking-task-competitors-description"
              value={draft.competitors}
              onChange={(event) => {
                set("competitors", event.target.value);
              }}
            />
            <FieldDescription id="tracking-task-competitors-description">
              {app_task_competitors_hint()}
            </FieldDescription>
          </Field>
        )}
      </FieldGroup>
    </FieldSet>
  );
};

/**
 * Where the task stands on the board: its status, priority and labels.
 *
 * @returns The board fields.
 */
export const TrackingTaskBoardFields = ({
  draft,
  set,
}: TrackingTaskFieldsProps) => (
  <FieldSet>
    <FieldLegend>{app_task_on_board()}</FieldLegend>
    <FieldGroup>
      <SelectField
        id="tracking-task-status"
        label={app_task_status()}
        items={trackingTaskStatusItems}
        value={draft.status}
        onChange={(value) => {
          set("status", value);
        }}
      />
      <SelectField
        id="tracking-task-priority"
        label={app_task_priority()}
        items={trackingTaskPriorityItems}
        value={draft.priority}
        onChange={(value) => {
          set("priority", value);
        }}
      />
      <Field>
        <FieldLabel htmlFor="tracking-task-labels">
          {app_task_labels()}
        </FieldLabel>
        <TrackingTaskLabelsField
          id="tracking-task-labels"
          value={draft.labels}
          onChange={(labels) => {
            set("labels", labels);
          }}
        />
      </Field>
    </FieldGroup>
  </FieldSet>
);

/**
 * How often the task scans, and how it replies and alerts.
 *
 * @returns The run fields.
 */
export const TrackingTaskRunFields = ({
  draft,
  set,
}: TrackingTaskFieldsProps) => (
  <FieldSet>
    <FieldLegend>{app_task_scan_replies()}</FieldLegend>
    <FieldGroup>
      <SelectField
        id="tracking-task-frequency"
        label={app_task_scan_frequency()}
        items={trackingTaskScanFrequencyItems}
        value={draft.scanFrequency}
        onChange={(value) => {
          set("scanFrequency", value);
        }}
      />
      <SelectField
        id="tracking-task-reply"
        label={app_task_reply_style()}
        items={trackingTaskReplyStyleItems}
        value={draft.replyStyle}
        onChange={(value) => {
          set("replyStyle", value);
        }}
      />
      <Field orientation="horizontal">
        <Switch
          id="tracking-task-alerts"
          checked={draft.alerts}
          onCheckedChange={(checked) => {
            set("alerts", checked);
          }}
        />
        <FieldLabel htmlFor="tracking-task-alerts">
          {app_task_alerts()}
        </FieldLabel>
      </Field>
    </FieldGroup>
  </FieldSet>
);
