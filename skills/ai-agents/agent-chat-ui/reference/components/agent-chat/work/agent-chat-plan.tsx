import {
  app_chat_plan,
  app_chat_plan_cancelled,
  app_chat_plan_completed,
  app_chat_plan_in_progress,
  app_chat_plan_pending,
} from "#/paraglide/messages";
import type { agentPlanStepStatuses } from "@/agent/tools/conversation/agent-plan-tool";

type AgentChatPlanStatus = (typeof agentPlanStepStatuses)[number];

const agentChatPlanStatusLabels = {
  pending: app_chat_plan_pending,
  in_progress: app_chat_plan_in_progress,
  completed: app_chat_plan_completed,
  cancelled: app_chat_plan_cancelled,
} satisfies Record<AgentChatPlanStatus, () => string>;

/**
 * The agent's plan for an answer (updatePlan) as a checklist: each step with
 * a mark for its status, the one in progress in full color, done and
 * cancelled steps struck through. Only the newest plan of an answer shows.
 *
 * @returns The plan's checklist.
 */
export const AgentChatPlan = ({
  steps,
}: {
  steps: readonly { text: string; status: AgentChatPlanStatus }[];
}) => (
  <ol className="agent-chat-plan" aria-label={app_chat_plan()}>
    {steps.map((step) => (
      <li
        // A plan's steps are distinct tasks, so their texts differ.
        key={step.text}
        className="agent-chat-plan-step"
        data-status={step.status}
        dir="auto"
      >
        <span className="sr-only">
          {agentChatPlanStatusLabels[step.status]()}:{" "}
        </span>
        {step.text}
      </li>
    ))}
  </ol>
);
