import { useState } from "react";

import { TrackingTaskCreateDialog } from "@/components/tasks/editor/tracking-task-create-dialog";
import { TrackingTaskSheet } from "@/components/tasks/editor/tracking-task-sheet";
import type {
  TrackingTask,
  TrackingTaskStatus,
} from "@/lib/tasks/tracking-task-schema";

/**
 * Which task is open for editing, and whether the new-task dialog is open,
 * for a page that lists tasks.
 *
 * @returns The task being edited and the dialog's state, with their setters,
 *   and the handleOpenTask and handleCreateTask actions a page wires to its
 *   tasks.
 */
export const useTrackingTaskEditors = () => {
  const [editing, setEditing] = useState<TrackingTask | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // The status the dialog was last opened for, kept while it closes.
  const [createStatus, setCreateStatus] =
    useState<TrackingTaskStatus>("active");

  return {
    editing,
    setEditing,
    createOpen,
    setCreateOpen,
    createStatus,
    handleOpenTask: setEditing,
    handleCreateTask: (status: TrackingTaskStatus) => {
      setCreateStatus(status);
      setCreateOpen(true);
    },
  };
};

/**
 * The task sheet and the new-task dialog that useTrackingTaskEditors opens.
 *
 * @returns The sheet and the dialog.
 */
export const TrackingTaskEditors = ({
  userId,
  editors,
}: {
  userId: string;
  editors: ReturnType<typeof useTrackingTaskEditors>;
}) => (
  <>
    <TrackingTaskSheet
      userId={userId}
      task={editors.editing}
      onClose={() => {
        editors.setEditing(null);
      }}
    />
    <TrackingTaskCreateDialog
      userId={userId}
      defaultStatus={editors.createStatus}
      open={editors.createOpen}
      onOpenChange={(open) => {
        editors.setCreateOpen(open);
      }}
    />
  </>
);
