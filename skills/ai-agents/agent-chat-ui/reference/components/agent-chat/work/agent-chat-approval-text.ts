import { getToolName } from "ai";

import {
  app_chat_agree_rules,
  app_chat_answer_line,
  app_chat_confirm_action,
  app_chat_delete_tasks_summary,
  app_chat_delete_tasks_title,
  app_chat_group_fallback,
  app_chat_join_title,
  app_chat_message_person_fallback,
  app_chat_message_seller_fallback,
  app_chat_message_seller_title,
  app_chat_no_questions,
  app_chat_question,
  app_chat_send_message_title,
  app_chat_task_not_found,
  app_task_delete_title,
} from "#/paraglide/messages";
import type {
  AgentChatApprovalStatus,
  AgentChatMessage,
  AgentChatToolPart,
} from "@/lib/agent-chat/conversation/agent-chat-messages";
import type { TrackingTask } from "@/lib/tasks/tracking-task-schema";

import { isNonEmptyText } from "../../../../backend/shared/text/non-empty-text";

const toolOutputAvailable = "output-available";

// An approval card's text in the chat (agent-chat-answer-part.tsx): what the
// action will really do, the note a denied action was sent back with, and
// its status.

// The Marketplace listings and sellers this answer's tools read, by ID, to
// name a message's listing and recipient on its approval card.
const agentChatMarketplaceNames = (message: AgentChatMessage) => {
  const listings = new Map<string, string>();
  const people = new Map<string, string>();

  for (const part of message.parts) {
    let found: readonly {
      id: string;
      title: string;
      seller: { id: string; name: string } | null;
    }[] = [];

    if (
      part.type === "tool-searchFacebookMarketplace" &&
      part.state === toolOutputAvailable
    ) {
      found = part.output.listings;
    }

    if (
      part.type === "tool-readMarketplaceListings" &&
      part.state === toolOutputAvailable
    ) {
      found = part.output.listings;
    }

    for (const listing of found) {
      listings.set(listing.id, listing.title);

      if (isNonEmptyText(listing.seller?.name)) {
        people.set(listing.seller.id, listing.seller.name);
      }
    }
  }

  return { listings, people };
};

// A message's approval card: its recipient (and listing) and its exact text;
// null for any other action.
const agentChatMessageApprovalText = (
  part: AgentChatToolPart,
  message: AgentChatMessage
) => {
  if (part.type === "tool-messageMarketplaceSeller" && part.input) {
    const listingId = part.input.listingId ?? "";

    return {
      title: app_chat_message_seller_title({
        listing:
          agentChatMarketplaceNames(message).listings.get(listingId) ??
          app_chat_message_seller_fallback({ id: listingId }),
      }),
      summary: part.input.text ?? "",
    };
  }

  if (part.type === "tool-sendFacebookMessage" && part.input) {
    const recipientId = part.input.recipientId ?? "";

    return {
      title: app_chat_send_message_title({
        person:
          agentChatMarketplaceNames(message).people.get(recipientId) ??
          app_chat_message_person_fallback({ id: recipientId }),
      }),
      summary: part.input.text ?? "",
    };
  }

  return null;
};

/**
 * The approval card's question and summary for an action that asks first.
 * It shows what will really happen, whatever the agent said: a deletion
 * lists the tasks its ids name among the user's own tasks; a join names the
 * group and every answer from the membership form the agent read in this
 * message; a message shows its exact text, and names its listing and
 * recipient from what this answer's tools read (their IDs otherwise).
 *
 * @param part - The tool call that asks for approval.
 * @param message - The answer it belongs to.
 * @param tasks - The user's tasks, to name the ones it changes.
 * @returns The card's question and summary.
 */
export const agentChatApprovalText = (
  part: AgentChatToolPart,
  message: AgentChatMessage,
  tasks: TrackingTask[]
) => {
  if (part.type === "tool-deleteTrackingTasks" && part.input) {
    const taskIds = part.input.taskIds ?? [];

    const sentences = taskIds.map(
      (taskId) =>
        tasks.find((task) => task.id === taskId)?.sentence ??
        app_chat_task_not_found()
    );

    return {
      title:
        sentences.length === 1
          ? app_task_delete_title()
          : app_chat_delete_tasks_title({ count: sentences.length }),
      summary: app_chat_delete_tasks_summary({ tasks: sentences.join(" · ") }),
    };
  }

  if (part.type === "tool-joinFacebookGroup" && part.input) {
    const { groupId, answers = [] } = part.input;

    const form = message.parts.findLast(
      (item) =>
        item.type === "tool-prepareFacebookGroupJoin" &&
        item.state === toolOutputAvailable &&
        item.output.groupId === groupId
    );

    const prepared =
      form?.type === "tool-prepareFacebookGroupJoin" &&
      form.state === toolOutputAvailable
        ? form.output
        : null;

    const lines = answers.map((answer) => {
      const question = prepared?.questions.find(
        (item) => item.id === answer?.questionId
      );

      const chosen = (answer?.selectedOptions ?? []).map(
        (optionId) =>
          question?.options.find((option) => option.id === optionId)?.text ??
          optionId
      );

      return app_chat_answer_line({
        question: question?.text ?? app_chat_question(),
        answer: answer?.answer ?? chosen.join(", "),
      });
    });

    return {
      title: app_chat_join_title({
        group:
          prepared?.groupName ?? app_chat_group_fallback({ id: groupId ?? "" }),
      }),
      summary:
        [
          ...lines,
          ...(part.input.agreeRules === true ? [app_chat_agree_rules()] : []),
        ].join(" · ") || app_chat_no_questions(),
    };
  }

  return (
    agentChatMessageApprovalText(part, message) ?? {
      title: app_chat_confirm_action(),
      summary: getToolName(part),
    }
  );
};

/**
 * The note a denied action was sent back with (AgentChatApprovalCard's
 * revise), shown on its card.
 *
 * @param approval - The tool call's approval.
 * @returns The note, or undefined when the action was not denied.
 */
export const agentChatApprovalRevisionNote = (
  approval: NonNullable<AgentChatToolPart["approval"]>
) => (approval.approved === false ? approval.reason : undefined);

/**
 * Whether an approval waits, was allowed or was denied.
 *
 * @param approval - The tool call's approval.
 * @returns pending, allowed or denied.
 */
export const agentChatApprovalStatus = (
  approval: NonNullable<AgentChatToolPart["approval"]>
): AgentChatApprovalStatus => {
  if (approval.approved === undefined) {
    return "pending";
  }

  return approval.approved ? "allowed" : "denied";
};
