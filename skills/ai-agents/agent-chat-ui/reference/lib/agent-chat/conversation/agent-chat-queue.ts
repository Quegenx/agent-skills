import type { AgentChatAttachment } from "@/lib/agent-chat/attachments/agent-chat-attachments";
import {
  agentChatMaxFiles,
  agentChatMessageMaxLength,
} from "@/lib/agent-chat/conversation/agent-chat-messages";

// Messages the user writes while the agent answers wait on the page and go
// out as one user message once the answer ends, their texts joined in the
// order written and their files together, as love, coffee folds a
// customer's close messages into one turn (LC:convex/functions/assistant/
// workflows/batching/messagebatching.ts). They live only in the page: closing
// it drops them, since they were never sent. The server's AGENT_CHAT_BUSY
// still refuses a second answer (a second tab, a stale page).

/**
 * One message waiting for the answer to end.
 */
export interface QueuedAgentChatMessage {
  id: string;
  text: string;
  files: AgentChatAttachment[];
}

/**
 * The texts and files the waiting messages send as one.
 *
 * @param queue - The waiting messages.
 * @returns Their texts joined by blank lines, and all their files.
 */
export const combineQueuedAgentChatMessages = (
  queue: readonly QueuedAgentChatMessage[]
) => ({
  text: queue
    .flatMap(({ text }) => (text.trim() === "" ? [] : [text.trim()]))
    .join("\n\n"),
  files: queue.flatMap((message) => message.files),
});

/**
 * The queue with the message added at its end, or null when the combined
 * message would pass the chat's limits on one message (its length and
 * number of files), so the composer keeps the draft instead.
 *
 * @param queue - The waiting messages.
 * @param message - The message to add.
 * @returns The new queue, or null.
 */
export const queueAgentChatMessage = (
  queue: readonly QueuedAgentChatMessage[],
  message: QueuedAgentChatMessage
): QueuedAgentChatMessage[] | null => {
  const queued = [...queue, message];
  const combined = combineQueuedAgentChatMessages(queued);

  return combined.text.length > agentChatMessageMaxLength ||
    combined.files.length > agentChatMaxFiles
    ? null
    : queued;
};

/**
 * The queue without a message the user removed before it was sent.
 *
 * @param queue - The waiting messages.
 * @param id - The removed message's id.
 * @returns The new queue.
 */
export const removeQueuedAgentChatMessage = (
  queue: readonly QueuedAgentChatMessage[],
  id: string
) => queue.filter((message) => message.id !== id);
