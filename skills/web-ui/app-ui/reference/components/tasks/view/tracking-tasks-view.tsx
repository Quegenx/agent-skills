import {
  addTransitionType,
  startTransition,
  useEffect,
  useRef,
  useState,
} from "react";

import { app_tasks_drag_hint } from "#/paraglide/messages";
import {
  TrackingTaskEditors,
  useTrackingTaskEditors,
} from "@/components/tasks/editor/tracking-task-editors";
import { TrackingTaskBoard } from "@/components/tasks/view/tracking-task-board";
import { TrackingTaskList } from "@/components/tasks/view/tracking-task-list";
import { TrackingTaskSelectionBar } from "@/components/tasks/view/tracking-task-selection-bar";
import { TrackingTaskToolbar } from "@/components/tasks/view/tracking-task-toolbar";
import {
  trackingTaskViewSwitchMs,
  trackingTaskViewSwitchType,
} from "@/components/tasks/view/tracking-task-view-switch";
import { useTrackingTaskErrors } from "@/lib/tasks/tracking-task-atoms";
import type { TrackingTask } from "@/lib/tasks/tracking-task-schema";
import type { TrackingTaskViewState } from "@/lib/tasks/tracking-task-view";
import {
  filterTrackingTasks,
  groupTrackingTasksByStatus,
  sortTrackingTasks,
  trackingTaskReorderAllowed,
  trackingTaskVisibleStatuses,
  useRestoredTrackingTaskView,
  useTrackingTaskViewActions,
} from "@/lib/tasks/tracking-task-view";

/**
 * משימות: the toolbar, then the tasks as a board
 * (a column per status) or a list (a group per status, with ticking for
 * bulk changes). A task's title opens it for editing; "+" adds one in that
 * status. How the page is shown is remembered in this browser.
 *
 * @returns The tasks view.
 */
export const TrackingTasksView = ({
  userId,
  tasks,
}: {
  userId: string;
  tasks: TrackingTask[];
}) => {
  // The page shows every part of the view, the board or list choice included.
  const view = useRestoredTrackingTaskView((current) => current);
  const { setTrackingTaskView } = useTrackingTaskViewActions();

  // The board or list on screen: the stored choice, or the one just picked
  // in the toolbar. Picking reaches the screen only in a transition, so
  // each task morphs between its card and its row (TrackingTaskMorph); the
  // choice is stored once that has rendered, as storing it sooner would
  // swap the view at once, outside the transition.
  const [switchedTo, setSwitchedTo] = useState<
    TrackingTaskViewState["view"] | null
  >(null);

  const shownView = switchedTo ?? view.view;
  useEffect(() => {
    if (switchedTo !== null && switchedTo !== view.view) {
      setTrackingTaskView({ view: switchedTo });
    }
  }, [switchedTo, view.view, setTrackingTaskView]);
  // When the running switch's morph ends (performance.now() time). A switch
  // picked before then waits for it: starting a view transition skips the
  // one under way, which jumped the tasks to their places mid-glide.
  const switchFreeAtRef = useRef(0);

  const switchView = (next: TrackingTaskViewState["view"]) => {
    const now = performance.now();
    const wait = Math.max(0, switchFreeAtRef.current - now);
    switchFreeAtRef.current = now + wait + trackingTaskViewSwitchMs;

    const run = () => {
      startTransition(() => {
        addTransitionType(trackingTaskViewSwitchType);
        setSwitchedTo(next);
      });
    };

    if (wait === 0) {
      run();
    } else {
      setTimeout(run, wait);
    }
  };

  const taskError = useTrackingTaskErrors(userId);
  const editors = useTrackingTaskEditors();

  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    new Set()
  );

  const shown = sortTrackingTasks(filterTrackingTasks(tasks, view), view.sort);
  const columns = groupTrackingTasksByStatus(shown);
  const visibleStatuses = trackingTaskVisibleStatuses(view);
  const reorderAllowed = trackingTaskReorderAllowed(view);

  // Deleted tasks leave the selection.
  const selected = tasks.flatMap((task) =>
    selectedIds.has(task.id) ? [task.id] : []
  );

  return (
    <div className="tracking-tasks">
      {taskError && (
        <p className="text-sm text-destructive" role="alert">
          {taskError}
        </p>
      )}
      <TrackingTaskToolbar
        view={{ ...view, view: shownView }}
        tasks={tasks}
        onViewChange={switchView}
      />
      {!reorderAllowed && (
        <output className="text-sm text-muted-foreground">
          {app_tasks_drag_hint()}
        </output>
      )}
      {shownView === "board" ? (
        <TrackingTaskBoard
          columns={columns}
          visibleStatuses={visibleStatuses}
          reorderAllowed={reorderAllowed}
          onOpenTask={editors.handleOpenTask}
          onCreate={editors.handleCreateTask}
          onHideStatus={(status) => {
            setTrackingTaskView({
              hiddenStatuses: [...view.hiddenStatuses, status],
            });
          }}
        />
      ) : (
        <>
          <TrackingTaskSelectionBar
            selectedIds={selected}
            onClear={() => {
              setSelectedIds(new Set());
            }}
          />
          <TrackingTaskList
            columns={columns}
            visibleStatuses={visibleStatuses}
            reorderAllowed={reorderAllowed}
            selection={{
              selectedIds,
              onToggle: (taskId, isSelected) => {
                const next = new Set(selectedIds);

                if (isSelected) {
                  next.add(taskId);
                } else {
                  next.delete(taskId);
                }

                setSelectedIds(next);
              },
            }}
            onOpenTask={editors.handleOpenTask}
            onCreate={editors.handleCreateTask}
          />
        </>
      )}
      <TrackingTaskEditors userId={userId} editors={editors} />
    </div>
  );
};
