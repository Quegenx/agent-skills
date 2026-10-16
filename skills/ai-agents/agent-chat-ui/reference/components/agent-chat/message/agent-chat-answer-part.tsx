import { isToolUIPart } from "ai";
import { Schema } from "effect";

import { agentPlanStepSchema } from "@/agent/tools/conversation/agent-plan-tool";
import { AgentChatAdCards } from "@/components/agent-chat/cards/agent-chat-ad-cards";
import {
  AgentChatGroupPostsCard,
  AgentChatSavedGroupsCard,
} from "@/components/agent-chat/cards/agent-chat-group-posts";
import { AgentChatGroupSearchCard } from "@/components/agent-chat/cards/agent-chat-group-search";
import {
  AgentChatMarketplaceListings,
  AgentChatMarketplaceSearchCard,
} from "@/components/agent-chat/cards/agent-chat-marketplace-listings";
import { AgentChatOpportunityCards } from "@/components/agent-chat/cards/agent-chat-opportunity-cards";
import { AgentChatQuestionCard } from "@/components/agent-chat/cards/agent-chat-question-card";
import { AgentChatSiteToolResult } from "@/components/agent-chat/cards/agent-chat-site-results";
import { AgentChatSuggestedTasks } from "@/components/agent-chat/cards/agent-chat-suggested-tasks";
import { AgentChatTaskCards } from "@/components/agent-chat/cards/agent-chat-task-cards";
import { AgentChatMarkdown } from "@/components/agent-chat/message/agent-chat-markdown";
import type { AgentChatMessageHandlers } from "@/components/agent-chat/message/agent-chat-message";
import { AgentChatApprovalCard } from "@/components/agent-chat/work/agent-chat-approval-card";
import {
  agentChatApprovalRevisionNote,
  agentChatApprovalStatus,
  agentChatApprovalText,
} from "@/components/agent-chat/work/agent-chat-approval-text";
import { AgentChatPlan } from "@/components/agent-chat/work/agent-chat-plan";
import { agentChatGroupSearch } from "@/components/agent-chat/work/agent-chat-tool-text";
import { AgentChatWorkRow } from "@/components/agent-chat/work/agent-chat-work-log";
import { TrackingTaskScanRunList } from "@/components/tasks/editor/tracking-task-scan-runs";
import {
  agentChatAnswerPartShows,
  agentChatSuggestedTaskSchema,
  agentChatToolRunning,
} from "@/lib/agent-chat/conversation/agent-chat-messages";
import type {
  AgentChatMessage,
  AgentChatMessagePart,
  AgentChatSuggestedTask,
  AgentChatToolPart,
} from "@/lib/agent-chat/conversation/agent-chat-messages";

import { isNonEmptyText } from "../../../../backend/shared/text/non-empty-text";

const toolOutputAvailable = "output-available";

// The tools whose answer shows as ad cards.
const adCardsToolType = Schema.Literals([
  "tool-searchSavedAds",
  "tool-searchFacebookAds",
  "tool-findSimilarAds",
  "tool-readCompetitorReport",
  "tool-checkCompetitors",
]);

const isAdCardsToolPart = (
  part: AgentChatToolPart
): part is Extract<AgentChatToolPart, { type: typeof adCardsToolType.Type }> =>
  Schema.is(adCardsToolType)(part.type);

// The ids the parts before this one already show; idsOf reads them from
// one earlier part (none from other tools' parts). A later call does not
// show them again.
const idsShownEarlier = (
  message: AgentChatMessage,
  part: AgentChatToolPart,
  idsOf: (earlier: AgentChatMessagePart) => string[]
) =>
  new Set(message.parts.slice(0, message.parts.indexOf(part)).flatMap(idsOf));

type AgentChatFinishedToolPart<Type extends AgentChatToolPart["type"]> =
  Extract<AgentChatToolPart, { type: Type; state: typeof toolOutputAvailable }>;

// The opportunities a listing found, without those an earlier listing in the
// answer already shows.
const AgentChatListedOpportunities = ({
  part,
  message,
  userId,
}: {
  part: AgentChatFinishedToolPart<"tool-listTaskOpportunities">;
  message: AgentChatMessage;
  userId: string;
}) => {
  const shown = idsShownEarlier(message, part, (earlier) =>
    earlier.type === "tool-listTaskOpportunities" &&
    earlier.state === toolOutputAvailable
      ? earlier.output.opportunities.map((item) => item.id)
      : []
  );

  const opportunityIds = part.output.opportunities.flatMap((opportunity) =>
    shown.has(opportunity.id) ? [] : [opportunity.id]
  );

  if (opportunityIds.length === 0) {
    return null;
  }

  return (
    <AgentChatOpportunityCards
      userId={userId}
      opportunityIds={opportunityIds}
    />
  );
};

// The Marketplace listings read in full that no earlier search in the answer
// shows; reading listings only gave the agent their details.
const AgentChatReadListings = ({
  part,
  message,
}: {
  part: AgentChatFinishedToolPart<"tool-readMarketplaceListings">;
  message: AgentChatMessage;
}) => {
  const shown = idsShownEarlier(message, part, (earlier) =>
    earlier.type === "tool-searchFacebookMarketplace" &&
    earlier.state === toolOutputAvailable
      ? earlier.output.listings.map((listing) => listing.id)
      : []
  );

  const listings = part.output.listings.filter(
    (listing) => !shown.has(listing.id)
  );

  if (listings.length === 0) {
    return null;
  }

  return (
    <AgentChatMarketplaceListings
      listings={listings.map((listing) => ({
        ...listing,
        photoUrl: listing.photos[0] ?? null,
        place: listing.locationText,
      }))}
    />
  );
};

// What a finished tool call shows below its row, as the app's own
// components: the tasks it worked on, the opportunities it listed, the
// scans it read, or the Marketplace listings, jobs and apartments it found.
// Null for tools with nothing more to show.
const AgentChatToolResult = ({
  part,
  message,
  handlers,
}: {
  part: AgentChatToolPart;
  message: AgentChatMessage;
  handlers: AgentChatMessageHandlers;
}) => {
  if (part.state !== toolOutputAvailable) {
    return null;
  }

  const taskCards = (taskIds: string[]) => (
    <AgentChatTaskCards
      taskIds={taskIds}
      tasks={handlers.tasks}
      onOpenTask={handlers.handleOpenTask}
    />
  );

  if (part.type === "tool-listTrackingTasks") {
    return taskCards(part.output.map((task) => task.id));
  }

  if (
    part.type === "tool-createTrackingTask" ||
    part.type === "tool-updateTrackingTask" ||
    part.type === "tool-setTrackingTaskSiteSearches"
  ) {
    return taskCards([part.output.id]);
  }

  if (part.type === "tool-scanTrackingTaskNow") {
    return taskCards([part.input.taskId]);
  }

  if (part.type === "tool-listTaskOpportunities") {
    return (
      <AgentChatListedOpportunities
        part={part}
        message={message}
        userId={handlers.userId}
      />
    );
  }

  if (isAdCardsToolPart(part)) {
    return (
      <AgentChatAdCards
        cards={"cards" in part.output ? part.output.cards : undefined}
        userId={handlers.userId}
      />
    );
  }

  if (part.type === "tool-readMarketplaceListings") {
    return <AgentChatReadListings part={part} message={message} />;
  }

  if (part.type === "tool-listRecentScans") {
    return part.output.length > 0 ? (
      <TrackingTaskScanRunList runs={part.output} />
    ) : null;
  }

  return <AgentChatSiteToolResult part={part} />;
};

// A tool call's result or, for an action that asks first, the approval
// card. While the answer is live, a finished action also shows its row
// (AgentChatWorkRow); once the answer ends, the rows fold into its
// AgentChatWorkedFor line instead.
const AgentChatToolCall = ({
  part,
  message,
  handlers,
  live,
}: {
  part: AgentChatToolPart;
  message: AgentChatMessage;
  handlers: AgentChatMessageHandlers;
  live: boolean;
}) => {
  const row = live && !agentChatToolRunning(part.state) && (
    <AgentChatWorkRow part={part} />
  );

  if (!part.approval || part.approval.isAutomatic === true) {
    return (
      <>
        {row}
        <AgentChatToolResult
          part={part}
          message={message}
          handlers={handlers}
        />
      </>
    );
  }

  const { approval } = part;

  return (
    <>
      <AgentChatApprovalCard
        approval={{
          ...agentChatApprovalText(part, message, handlers.tasks),
          status: agentChatApprovalStatus(approval),
        }}
        revisionNote={agentChatApprovalRevisionNote(approval)}
        onDecide={(status) => {
          handlers.handleDecide(approval.id, status);
        }}
        onRevise={(note) => {
          handlers.handleRevise(approval.id, note);
        }}
      />
      {part.state !== "output-denied" && row}
    </>
  );
};

/**
 * One part of the agent's answer.
 *
 * @returns The part as the chat shows it, or nothing for a part it does not
 *   show.
 */
export const AgentChatAnswerPart = ({
  part,
  message,
  handlers,
  live,
  isLast,
}: {
  part: AgentChatMessagePart;
  message: AgentChatMessage;
  handlers: AgentChatMessageHandlers;
  live: boolean;
  // The newest answer: its question still waits for the user's answer.
  isLast: boolean;
}) => {
  if (!agentChatAnswerPartShows(part)) {
    return null;
  }

  if (part.type === "text") {
    return (
      <AgentChatMarkdown streaming={part.state === "streaming"}>
        {part.text}
      </AgentChatMarkdown>
    );
  }

  // Narrows the part for the branches below; agentChatAnswerPartShows has
  // already let only tool parts through.
  if (!isToolUIPart(part)) {
    return null;
  }

  if (part.type === "tool-searchFacebookGroups") {
    return <AgentChatGroupSearchCard search={agentChatGroupSearch(part)} />;
  }

  if (part.type === "tool-listSavedGroups") {
    return <AgentChatSavedGroupsCard part={part} />;
  }

  if (part.type === "tool-searchFacebookMarketplace") {
    return (
      <AgentChatMarketplaceSearchCard
        part={part}
        message={message}
        progress={handlers.searchProgress}
      />
    );
  }

  if (part.type === "tool-searchGroupPosts") {
    return (
      <AgentChatGroupPostsCard
        part={part}
        progress={handlers.groupPostsProgress(part.toolCallId)}
      />
    );
  }

  if (part.type === "tool-updatePlan") {
    // Each update resends the whole plan; only the newest shows.
    const newest = message.parts.findLast(
      (item) => item.type === "tool-updatePlan"
    );

    return part === newest && part.input?.steps ? (
      <AgentChatPlan
        steps={part.input.steps.flatMap((step) =>
          Schema.is(agentPlanStepSchema)(step) ? [step] : []
        )}
      />
    ) : null;
  }

  if (part.type === "tool-askUserQuestion") {
    // The answers to pick show while the question waits: in the last answer.
    return isNonEmptyText(part.input?.question) ? (
      <AgentChatQuestionCard
        question={part.input.question}
        options={
          isLast && part.state === "output-available"
            ? part.input.options
            : null
        }
        onSelect={handlers.handleFollowUp}
      />
    ) : null;
  }

  if (part.type === "tool-suggestTrackingTasks") {
    return (
      <AgentChatSuggestedTasks
        state={part.state}
        tasks={(part.input?.tasks ?? []).filter(
          (task): task is AgentChatSuggestedTask =>
            Schema.is(agentChatSuggestedTaskSchema)(task)
        )}
        onAddTask={handlers.handleAddTask}
      />
    );
  }

  return (
    <AgentChatToolCall
      part={part}
      message={message}
      handlers={handlers}
      live={live}
    />
  );
};
