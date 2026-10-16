import { Drawer } from "@base-ui/react/drawer";
import { useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

import {
  app_chat_close_tasks,
  app_chat_tasks_resize,
  app_chat_tasks_shortcut,
  app_nav_tasks,
} from "#/paraglide/messages";
import {
  TrackingTaskEditors,
  useTrackingTaskEditors,
} from "@/components/tasks/editor/tracking-task-editors";
import { TrackingTaskList } from "@/components/tasks/view/tracking-task-list";
import { TooltipHint } from "@/components/ui/display/tooltip";
import { AppIcon } from "@/components/ui/general/app-icon";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useAgentTasksPanelActions,
  useAgentTasksPanelOpen,
} from "@/lib/agent-chat/page/agent-tasks-panel-atoms";
import { useTrackingTasks } from "@/lib/tasks/tracking-task-atoms";
import {
  filterTrackingTasks,
  groupTrackingTasksByStatus,
  useRestoredTrackingTaskView,
  sortTrackingTasks,
  trackingTaskReorderAllowed,
  trackingTaskVisibleStatuses,
} from "@/lib/tasks/tracking-task-view";

/**
 * Opens and closes the panel; Cmd/Ctrl+J does the same.
 *
 * @returns The panel's toggle button.
 */
export const AgentTasksPanelTrigger = () => {
  const { toggleAgentTasksPanel } = useAgentTasksPanelActions();
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "j" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleAgentTasksPanel();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [toggleAgentTasksPanel]);

  return (
    <TooltipHint label={app_chat_tasks_shortcut()} side="bottom">
      <button
        type="button"
        className="agent-chat-button agent-tasks-trigger"
        data-variant="ghost"
        data-size="icon"
        aria-controls="agent-tasks-panel"
        aria-label={app_nav_tasks()}
        onClick={toggleAgentTasksPanel}
      >
        <AppIcon icon="agent-tasks" />
      </button>
    </TooltipHint>
  );
};

// The tasks panel holds its tasks list, with the tasks page's
// filters, sort and hidden statuses (shared through one stored
// table state). A task's title opens it for editing here, and "+" adds one.
const AgentTaskBoard = ({ userId }: { userId: string }) => {
  const tasks = useTrackingTasks(userId);

  // The panel is always a list, so the board or list choice is not read.
  const view = useRestoredTrackingTaskView(
    ({
      hiddenStatuses,
      sort,
      query,
      priorities,
      statuses,
      createdFrom,
      createdTo,
    }) => ({
      hiddenStatuses,
      sort,
      query,
      priorities,
      statuses,
      createdFrom,
      createdTo,
    })
  );

  const editors = useTrackingTaskEditors();

  return (
    <div className="agent-tasks-board">
      <TrackingTaskList
        columns={groupTrackingTasksByStatus(
          sortTrackingTasks(filterTrackingTasks(tasks, view), view.sort)
        )}
        visibleStatuses={trackingTaskVisibleStatuses(view)}
        reorderAllowed={trackingTaskReorderAllowed(view)}
        onOpenTask={editors.handleOpenTask}
        onCreate={editors.handleCreateTask}
      />
      <TrackingTaskEditors userId={userId} editors={editors} />
    </div>
  );
};

// Drag bounds of the resizable panel.
const agentTasksPanelMinWidth = 320;
const agentTasksPanelMaxWidth = 720;

/**
 * The tasks panel. On desktop it is a side panel that pushes the chat
 * aside as it opens (its width slides over 200ms) and can be dragged wider or
 * narrower by its edge; a click on the edge closes it. On phones it is a
 * drawer that rises from the bottom over a blurred backdrop.
 *
 * @returns The tasks panel.
 */
export const AgentTasksPanel = ({ userId }: { userId: string }) => {
  const open = useAgentTasksPanelOpen();
  const { setAgentTasksPanelOpen } = useAgentTasksPanelActions();
  const isMobile = useIsMobile();
  const panelRef = useRef<HTMLElement>(null);
  const draggedRef = useRef(false);

  const startResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const panel = panelRef.current;

    if (!panel) {
      return;
    }

    const startX = event.clientX;
    const startWidth = panel.getBoundingClientRect().width;
    draggedRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    panel.dataset.resizing = "";

    const onMove = (move: PointerEvent) => {
      // The panel sits at the left edge in this right-to-left page, so
      // dragging its edge right makes it wider.
      const delta = move.clientX - startX;

      if (Math.abs(delta) > 2) {
        draggedRef.current = true;
      }

      const width = Math.min(
        Math.max(startWidth + delta, agentTasksPanelMinWidth),
        agentTasksPanelMaxWidth
      );

      panel.style.setProperty("--agent-tasks-panel-width", `${width}px`);
    };

    const onEnd = () => {
      delete panel.dataset.resizing;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
  };

  if (isMobile) {
    return (
      <Drawer.Root
        open={open}
        onOpenChange={setAgentTasksPanelOpen}
        swipeDirection="down"
      >
        <Drawer.Portal>
          <Drawer.Backdrop className="app-backdrop" />
          <Drawer.Viewport className="agent-tasks-drawer-viewport">
            <Drawer.Popup id="agent-tasks-panel" className="agent-tasks-drawer">
              <span className="agent-tasks-drawer-handle" aria-hidden="true" />
              <Drawer.Title className="sr-only">{app_nav_tasks()}</Drawer.Title>
              <AgentTaskBoard userId={userId} />
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <aside
      ref={panelRef}
      id="agent-tasks-panel"
      className="agent-tasks-panel"
      data-open={open || undefined}
      aria-label={app_nav_tasks()}
      inert={!open}
    >
      {/* The hint shows beside the grip, toward the chat. */}
      <TooltipHint label={app_chat_tasks_resize()} side="inline-start">
        <button
          type="button"
          className="agent-tasks-panel-rail"
          aria-label={app_chat_close_tasks()}
          tabIndex={-1}
          onPointerDown={startResize}
          onClick={() => {
            if (draggedRef.current) {
              draggedRef.current = false;

              return;
            }

            setAgentTasksPanelOpen(false);
          }}
        >
          <span aria-hidden="true" />
        </button>
      </TooltipHint>
      <div className="agent-tasks-panel-clip">
        <div className="agent-tasks-panel-inner">
          <AgentTaskBoard userId={userId} />
        </div>
      </div>
    </aside>
  );
};
