import { Effect } from "effect";

import type { AgentChatMessage } from "@/lib/agent-chat/conversation/agent-chat-messages";
import { runClientEffect } from "@/lib/atoms/app-atom-runtime";

import { isNonEmptyText } from "../../../../backend/shared/text/non-empty-text";
import {
  agentChatConversationNameMaxLength,
  agentChatConversationStateAtom,
  newAgentChatConversation,
  readAgentChatState,
  saveAgentChatChange,
  stillAgentChatOwner,
  updateAgentChatState,
} from "./agent-chat-conversation-atoms";
import type {
  AgentChatConversation,
  AgentChatRegistry,
} from "./agent-chat-conversation-atoms";
import { AgentChatServerCalls } from "./agent-chat-server-calls";

// What the user and the chat do to the conversations
// (agent-chat-conversation-atoms.ts holds them): open, pick, rename, pin,
// delete, keep the messages in step and title a chat.

/**
 * Opens an empty conversation, at the top of the list. An active
 * conversation that is still empty is reused instead of piling up blanks;
 * it is stored with its first message.
 *
 * @param registry - The chat's atom registry.
 */
export const startAgentChatConversation = (registry: AgentChatRegistry) => {
  const { conversations, activeId } = readAgentChatState(registry);

  const active = conversations.find(
    (conversation) => conversation.id === activeId
  );

  if (active?.messages.length === 0) {
    return;
  }

  const conversation = newAgentChatConversation();
  updateAgentChatState(registry, () => ({
    conversations: [conversation, ...conversations],
    activeId: conversation.id,
  }));
};

/**
 * The conversation as this registry has it now, outside React.
 *
 * @param registry - The chat's atom registry.
 * @param id - The conversation's id.
 * @returns The conversation, or undefined when the registry has none by that
 *   id.
 */
export const findAgentChatConversation = (
  registry: AgentChatRegistry,
  id: string
) =>
  readAgentChatState(registry).conversations.find(
    (conversation) => conversation.id === id
  );

/**
 * Makes a conversation the open one.
 *
 * @param registry - The chat's atom registry.
 * @param id - The conversation's id.
 * @returns The state update.
 */
export const selectAgentChatConversation = (
  registry: AgentChatRegistry,
  id: string
) => {
  updateAgentChatState(registry, () => ({ activeId: id }));
};

const updateAgentChatConversation = (
  registry: AgentChatRegistry,
  id: string,
  change: { name?: string; pinned?: boolean }
) => {
  const { conversations } = readAgentChatState(registry);
  const conversation = conversations.find((item) => item.id === id);
  updateAgentChatState(registry, () => ({
    conversations: conversations.map((item) =>
      item.id === id ? { ...item, ...change } : item
    ),
  }));

  // A chat not stored yet (no message) keeps the change until its first
  // message is saved; then the next change saves it.
  if (conversation && conversation.messages.length > 0) {
    saveAgentChatChange(registry, (userId) =>
      Effect.flatMap(Effect.service(AgentChatServerCalls), (calls) =>
        calls.changeAgentChatConversation({
          userId,
          conversationId: id,
          change,
        })
      )
    );
  }
};

/**
 * An empty or unchanged name leaves the conversation as it is.
 *
 * @param registry - The chat's atom registry.
 * @param id - The conversation's id.
 * @param name - The new name; trimmed and cut to
 *   agentChatConversationNameMaxLength.
 */
export const renameAgentChatConversation = (
  registry: AgentChatRegistry,
  id: string,
  name: string
) => {
  const trimmed = name.trim().slice(0, agentChatConversationNameMaxLength);

  if (trimmed) {
    updateAgentChatConversation(registry, id, { name: trimmed });
  }
};

/**
 * Pins a conversation to the top of the list, or unpins it.
 *
 * @param registry - The chat's atom registry.
 * @param id - The conversation's id.
 * @param pinned - Whether it is pinned.
 * @returns The state update.
 */
export const setAgentChatConversationPinned = (
  registry: AgentChatRegistry,
  id: string,
  pinned: boolean
) => {
  updateAgentChatConversation(registry, id, { pinned });
};

/**
 * After all of the user's stored conversations were deleted (הגדרות \> ניהול
 * נתונים): this registry shows only a new, empty conversation.
 *
 * @param registry - The chat's atom registry.
 * @param userId - The signed-in user.
 */
export const clearAgentChatConversations = (
  registry: AgentChatRegistry,
  userId: string
) => {
  const conversation = newAgentChatConversation();
  registry.set(agentChatConversationStateAtom, {
    userId,
    loaded: true,
    conversations: [conversation],
    activeId: conversation.id,
    saveError: null,
  });
};

/**
 * Deleting the open conversation opens a new one, returning to the
 * new chat page.
 *
 * @param registry - The chat's atom registry.
 * @param id - The conversation's id.
 */
export const deleteAgentChatConversation = (
  registry: AgentChatRegistry,
  id: string
) => {
  const { conversations, activeId } = readAgentChatState(registry);
  const conversation = conversations.find((item) => item.id === id);
  updateAgentChatState(registry, () => ({
    conversations: conversations.filter((item) => item.id !== id),
  }));

  if (id === activeId) {
    startAgentChatConversation(registry);
  }

  if (conversation && conversation.messages.length > 0) {
    saveAgentChatChange(registry, (userId) =>
      Effect.flatMap(Effect.service(AgentChatServerCalls), (calls) =>
        calls.deleteAgentChatConversation({ userId, conversationId: id })
      )
    );
  }
};

/**
 * Keeps this registry's copy of a conversation's messages in step with the
 * chat (the endpoint has already stored them).
 *
 * @param registry - The chat's atom registry.
 * @param conversationId - The conversation.
 * @param messages - Its messages as the chat has them.
 * @returns The state update.
 */
export const syncAgentChatMessages = (
  registry: AgentChatRegistry,
  conversationId: string,
  messages: AgentChatMessage[]
) => {
  updateAgentChatState(registry, ({ conversations }) => ({
    conversations: conversations.map((item) =>
      item.id === conversationId ? { ...item, messages } : item
    ),
  }));
};

// The chats with this one named by its title, unless it has a name by then.
const nameUntitledAgentChat = (
  conversations: readonly AgentChatConversation[],
  conversationId: string,
  title: string
) =>
  conversations.map((item) =>
    item.id === conversationId && !isNonEmptyText(item.name)
      ? { ...item, name: title }
      : item
  );

/**
 * Titles a chat once an answer ends, unless it has a name by then (the
 * server saves the title the same way).
 *
 * @param registry - The chat's atom registry.
 * @param conversationId - The conversation whose answer ended.
 */
export const titleAgentChatConversation = (
  registry: AgentChatRegistry,
  conversationId: string
) => {
  const { userId, loaded } = readAgentChatState(registry);

  if (!(isNonEmptyText(userId) && loaded)) {
    return;
  }

  void runClientEffect(
    registry,
    Effect.flatMap(Effect.service(AgentChatServerCalls), (calls) =>
      calls.nameAgentChatConversation({ userId, conversationId })
    ).pipe(
      Effect.flatMap((title) =>
        Effect.sync(() => {
          if (isNonEmptyText(title) && stillAgentChatOwner(registry, userId)) {
            updateAgentChatState(registry, ({ conversations }) => ({
              conversations: nameUntitledAgentChat(
                conversations,
                conversationId,
                title
              ),
            }));
          }
        })
      ),
      // The chat keeps its first message as its name.
      Effect.catchCause((cause) =>
        Effect.logError("AGENT_CHAT_TITLE_FAILED", cause)
      )
    )
  );
};
