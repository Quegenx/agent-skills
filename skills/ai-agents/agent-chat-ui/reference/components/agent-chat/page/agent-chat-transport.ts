import {
  DefaultChatTransport,
  convertFileListToFileUIParts,
  isToolUIPart,
} from "ai";
import type { AtomRegistry } from "effect/reactivity";

import { getLocale } from "#/paraglide/runtime";
import type { AgentChatAttachment } from "@/lib/agent-chat/attachments/agent-chat-attachments";
import { findAgentChatConversation } from "@/lib/agent-chat/conversation/agent-chat-conversation-actions";
import type { AgentChatMessage } from "@/lib/agent-chat/conversation/agent-chat-messages";

// What the agent page (agent-chat-page.tsx) sends and reads back: the
// request to /api/agent/chat, its attached files, and which tools an answer
// ran.

/**
 * Whether an answer finished one of these tools, so the page reloads what
 * the tool changed.
 *
 * @param message - The agent's answer.
 * @param toolTypes - The tool parts' types to look for.
 * @returns Whether the answer finished one of them.
 */
export const agentAnswerRanTool = (
  message: AgentChatMessage,
  toolTypes: readonly AgentChatMessage["parts"][number]["type"][]
) => {
  const wanted = new Set(toolTypes);

  return message.parts.some(
    (part) =>
      wanted.has(part.type) &&
      isToolUIPart(part) &&
      part.state === "output-available"
  );
};

/**
 * An attached file goes to the agent as a data URL (images and documents,
 * at most 5 × 10 MB; see AgentChatComposer), read by the AI SDK's own
 * converter.
 *
 * @param attachments - The composer's attachments.
 * @returns A promise of the files as UI file parts.
 */
export const readAgentChatAttachments = async (
  attachments: AgentChatAttachment[]
) => {
  const transfer = new DataTransfer();

  for (const attachment of attachments) {
    transfer.items.add(attachment.upload);
  }

  return await convertFileListToFileUIParts(transfer.files);
};

/**
 * The endpoint holds the conversation, so each request sends only the newest
 * message, with the conversation's name and pin (saved with its first
 * message).
 *
 * @param registry - The atom registry, to read the conversation's name and pin.
 * @param userId - The signed-in user.
 * @returns The chat's transport.
 */
export const createAgentChatTransport = (
  registry: AtomRegistry.AtomRegistry,
  userId: string
) =>
  new DefaultChatTransport<AgentChatMessage>({
    api: "/api/agent/chat",
    prepareSendMessagesRequest: ({ id, messages }) => {
      const stored = findAgentChatConversation(registry, id);

      return {
        body: {
          userId,
          id,
          message: messages.at(-1),
          conversation: {
            name: stored?.name ?? null,
            pinned: stored?.pinned ?? false,
          },
          locale: getLocale(),
        },
      };
    },
  });
