import {
  app_change_save_failed,
  app_chat_opportunities_failed,
} from "#/paraglide/messages";
import { TaskOpportunityItems } from "@/components/opportunities/task-opportunity-item";
import {
  useTaskOpportunitiesById,
  useTaskOpportunityStatusChange,
} from "@/lib/opportunities/task-opportunity-atoms";

// Most opportunities one answer shows; the rest are on the opportunities
// page.
const agentChatOpportunityCardMax = 5;

/**
 * The opportunities an answer talked about, as the opportunities page shows
 * them: score, what the person wants and why it fits, the post, a link to it
 * on Facebook, and the status, which changes here as on the page. The tool
 * gives the model a short version and the stored message keeps only ids; the
 * full opportunities arrive beside the answer (data-opportunities), so the
 * cards show at once. A stored chat opened later reads them by id.
 *
 * @returns The opportunity cards, with a save error when a status change
 *   failed.
 */
export const AgentChatOpportunityCards = ({
  userId,
  opportunityIds,
}: {
  userId: string;
  opportunityIds: string[];
}) => {
  const shownIds = opportunityIds.slice(0, agentChatOpportunityCardMax);
  const { opportunities, failed } = useTaskOpportunitiesById(userId, shownIds);
  const statusChange = useTaskOpportunityStatusChange(userId);
  const saveError = statusChange.failed ? app_change_save_failed() : null;

  if (failed) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {app_chat_opportunities_failed()}
      </p>
    );
  }

  return (
    <div className="agent-chat-opportunity-cards">
      {saveError && (
        <p className="text-sm text-destructive" role="alert">
          {saveError}
        </p>
      )}
      <TaskOpportunityItems
        opportunities={opportunities}
        onStatus={async (opportunityId, status) => {
          await statusChange.changeStatus(opportunityId, status);
        }}
      />
    </div>
  );
};
