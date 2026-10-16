import { app_chat_more_tasks } from "#/paraglide/messages";
import { TrackingTaskCard } from "@/components/tasks/view/tracking-task-board";
import { useAgentTasksPanelActions } from "@/lib/agent-chat/page/agent-tasks-panel-atoms";
import type { TrackingTask } from "@/lib/tasks/tracking-task-schema";

// Most cards one answer shows; the rest are in the tasks panel.
const agentChatTaskCardMax = 6;

/**
 * The tasks an answer worked on, as the tasks board's cards, read live from
 * the user's tasks: the status and priority pickers change the task here and
 * on the board alike, and the title opens it for editing. A task the agent
 * just created shows once the tasks reload after the answer; a deleted one is
 * left out.
 *
 * @returns The task cards, with a link to the tasks panel.
 */
export const AgentChatTaskCards = ({
  taskIds,
  tasks,
  onOpenTask,
}: {
  taskIds: string[];
  tasks: TrackingTask[];
  onOpenTask: (task: TrackingTask) => void;
}) => {
  const { toggleAgentTasksPanel } = useAgentTasksPanelActions();
  const byId = new Map(tasks.map((task) => [task.id, task]));

  const shown = taskIds.flatMap((taskId) => {
    const task = byId.get(taskId);

    return task ? [task] : [];
  });

  if (shown.length === 0) {
    return null;
  }

  return (
    <div className="agent-chat-task-cards">
      {shown.slice(0, agentChatTaskCardMax).map((task) => (
        <TrackingTaskCard
          key={task.id}
          task={task}
          onOpen={() => {
            onOpenTask(task);
          }}
        />
      ))}
      {shown.length > agentChatTaskCardMax && (
        <button
          type="button"
          className="agent-chat-button"
          data-variant="ghost"
          data-size="sm"
          onClick={toggleAgentTasksPanel}
        >
          {app_chat_more_tasks({
            count: shown.length - agentChatTaskCardMax,
          })}
        </button>
      )}
    </div>
  );
};
