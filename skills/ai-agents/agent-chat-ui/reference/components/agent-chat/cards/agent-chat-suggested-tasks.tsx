import { useState } from "react";
import type { ReactNode } from "react";

import {
  app_chat_added,
  app_chat_potential_high,
  app_chat_potential_low,
  app_chat_potential_medium,
  app_chat_what_agent_searches,
  app_chat_why,
  app_task_add,
} from "#/paraglide/messages";
import { AgentChatDisclosure } from "@/components/agent-chat/work/agent-chat-tool";
import { AppIcon } from "@/components/ui/general/app-icon";
import { IconSwap } from "@/components/ui/general/icon-swap";
import { MorphText } from "@/components/ui/general/morph-text";
import type {
  AgentChatSuggestedTask,
  AgentChatTaskPotential,
  AgentChatToolState,
} from "@/lib/agent-chat/conversation/agent-chat-messages";

import { isNonEmptyText } from "../../../../backend/shared/text/non-empty-text";

const agentChatPotentialLabel: Record<AgentChatTaskPotential, string> = {
  get high() {
    return app_chat_potential_high();
  },
  get medium() {
    return app_chat_potential_medium();
  },
  get low() {
    return app_chat_potential_low();
  },
};

// A disclosure inside the card, such as app_chat_what_agent_searches().
const AgentChatTaskDisclosure = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <AgentChatDisclosure
    triggerClassName="agent-chat-card-toggle"
    trigger={label}
  >
    {children}
  </AgentChatDisclosure>
);

/**
 * The tracking tasks the agent suggests, one card each, as the
 * suggested-task cards: badges for the potential and the place, the task and
 * its details, what it will look for and why, and a button that adds it to
 * משימות. A card's button turns into app_chat_added() once added. Tasks can be added
 * once the tool has finished and the user's task defaults have loaded.
 *
 * @returns The suggested-task cards.
 */
export const AgentChatSuggestedTasks = ({
  state,
  tasks,
  onAddTask,
}: {
  state: AgentChatToolState;
  tasks: AgentChatSuggestedTask[];
  // Null while adding is not possible yet.
  onAddTask: ((task: AgentChatSuggestedTask) => void) | null;
}) => {
  const [added, setAdded] = useState<ReadonlySet<number>>(new Set());
  const ready = state === "output-available" && onAddTask !== null;

  return (
    <div className="agent-chat-suggested-tasks">
      {tasks.map((task, index) => {
        const isAdded = added.has(index);

        return (
          <section
            key={task.sentence}
            className="agent-chat-card agent-chat-suggested-task"
            aria-label={task.sentence}
          >
            <div className="agent-chat-card-body">
              {(task.potential ?? task.location ?? "") !== "" && (
                <div className="agent-chat-suggested-task-badges">
                  {isNonEmptyText(task.location) && (
                    <span
                      className="app-tag agent-chat-badge"
                      data-variant="outline"
                    >
                      {task.location}
                    </span>
                  )}
                  {task.potential && (
                    <span
                      className="app-tag agent-chat-badge"
                      data-variant={task.potential}
                    >
                      {agentChatPotentialLabel[task.potential]}
                    </span>
                  )}
                </div>
              )}
              <div className="agent-chat-suggested-task-text">
                <h3 className="agent-chat-card-title">
                  <bdi>{task.sentence}</bdi>
                </h3>
                {task.details && (
                  <p className="agent-chat-card-details">{task.details}</p>
                )}
              </div>
              {(task.signals.length > 0 || isNonEmptyText(task.evidence)) && (
                <div className="agent-chat-suggested-task-disclosures">
                  {task.signals.length > 0 && (
                    <AgentChatTaskDisclosure
                      label={app_chat_what_agent_searches()}
                    >
                      <ul className="agent-chat-suggested-task-signals">
                        {task.signals.map((signal) => (
                          <li key={signal}>
                            <AppIcon icon="agent-check" />
                            <span>{signal}</span>
                          </li>
                        ))}
                      </ul>
                    </AgentChatTaskDisclosure>
                  )}
                  {isNonEmptyText(task.evidence) && (
                    <AgentChatTaskDisclosure label={app_chat_why()}>
                      <p className="agent-chat-suggested-task-evidence">
                        {task.evidence}
                      </p>
                    </AgentChatTaskDisclosure>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              className="agent-chat-button"
              data-variant="secondary"
              data-size="sm"
              data-added={isAdded || undefined}
              disabled={isAdded || !ready}
              onClick={() => {
                onAddTask?.(task);
                setAdded((current) => new Set(current).add(index));
              }}
            >
              <IconSwap icon={isAdded ? "agent-check" : "agent-plus"} />
              <MorphText>
                {isAdded ? app_chat_added() : app_task_add()}
              </MorphText>
            </button>
          </section>
        );
      })}
    </div>
  );
};
