import { RegistryContext, useAtomValue } from "@effect/atom-react";
import { Effect, Schema } from "effect";
import { Atom, AtomRegistry } from "effect/reactivity";
import { useContext, useEffect } from "react";

import {
  app_chat_new,
  app_chats_load_failed,
  app_chats_save_failed,
} from "#/paraglide/messages";
import type { AgentChatMessage } from "@/lib/agent-chat/conversation/agent-chat-messages";
import { parseAgentChatConversations } from "@/lib/agent-chat/conversation/agent-chat-persistence";
import { runClientEffect } from "@/lib/atoms/app-atom-runtime";
import { makeServerReadAtom } from "@/lib/atoms/server-read-atom";

import { isNonEmptyText } from "../../../../backend/shared/text/non-empty-text";
import { AgentChatServerCalls } from "./agent-chat-server-calls";

/**
 * The agent's conversations, stored in agent_chat_conversations and
 * agent_chat_messages. The chat endpoint stores messages as the agent
 * answers; these atoms keep the list, names and pins, and a copy of each
 * conversation's messages for titles, search and download.
 */
export interface AgentChatConversation {
  id: string;
  // The name the user gave it; until then it is named by its first message.
  name: string | null;
  pinned: boolean;
  createdAt: string;
  messages: AgentChatMessage[];
}

// The limit on a chat's name.
export const agentChatConversationNameMaxLength = 120;

interface AgentChatConversationSnapshot {
  userId: string | null;
  loaded: boolean;
  conversations: AgentChatConversation[];
  // The conversation the agent page shows.
  activeId: string;
  saveError: string | null;
}

/**
 * A new, empty conversation with a fresh id, created now.
 *
 * @returns The conversation.
 */
export const newAgentChatConversation = (): AgentChatConversation => ({
  id: crypto.randomUUID(),
  name: null,
  pinned: false,
  createdAt: new Date().toISOString(),
  messages: [],
});

// Until the stored conversations load, the page shows a new one.
const initialAgentChatConversations = (): AgentChatConversationSnapshot => {
  const conversation = newAgentChatConversation();

  return {
    userId: null,
    loaded: false,
    conversations: [conversation],
    activeId: conversation.id,
    saveError: null,
  };
};

// The conversations shown in this registry (one browser tab, or one server
// render).
export const agentChatConversationStateAtom = Atom.make(
  initialAgentChatConversations()
).pipe(Atom.keepAlive);

/**
 * The atom registry the chat's state lives in.
 */
export type AgentChatRegistry = AtomRegistry.AtomRegistry;

/**
 * The chat's state as the registry has it now, outside React.
 *
 * @param registry - The chat's atom registry.
 * @returns The state.
 */
export const readAgentChatState = (registry: AgentChatRegistry) =>
  registry.get(agentChatConversationStateAtom);

/**
 * Changes part of the chat's state.
 *
 * @param registry - The chat's atom registry.
 * @param change - The fields to change, given the current state.
 * @returns The update's result.
 */
export const updateAgentChatState = (
  registry: AgentChatRegistry,
  change: (
    state: AgentChatConversationSnapshot
  ) => Partial<AgentChatConversationSnapshot>
) => {
  registry.update(agentChatConversationStateAtom, (state) => ({
    ...state,
    ...change(state),
  }));
};

/**
 * Whether the registry's chat state still belongs to this user, so a read that
 * ends after a sign-out does not write into another's.
 *
 * @param registry - The chat's atom registry.
 * @param userId - The user the read was for.
 * @returns Whether the user still owns the state.
 */
export const stillAgentChatOwner = (
  registry: AgentChatRegistry,
  userId: string
) => readAgentChatState(registry).userId === userId;

/**
 * The keys a conversations read is invalidated by.
 *
 * @param userId - The signed-in user.
 * @returns The reactivity keys.
 */
export const agentChatConversationReactivityKeys = (userId: string) => [
  `agent-chat-conversations:${userId}`,
];

/**
 * The stored conversations as first read (the server's JSON text), so the
 * agent page's loader can start the read (on the server for the first paint,
 * on a link hover after that). The conversation state owns them once
 * restored, so this read never goes stale; sign-out resets the registry.
 */
export const storedAgentChatConversationsAtom = Atom.family((userId: string) =>
  makeServerReadAtom({
    key: `agent-chat-conversations:${userId}`,
    success: Schema.String,
    read: Effect.flatMap(Effect.service(AgentChatServerCalls), (calls) =>
      calls.listAgentChatConversations(userId)
    ),
    reactivityKeys: agentChatConversationReactivityKeys(userId),
  })
);

const agentChatRestorations = new WeakMap<
  AgentChatRegistry,
  { userId: string; promise: Promise<unknown> }
>();

// Loads the user's stored conversations once per owner and opens the newest;
// with none stored, the new conversation stays. A stale response cannot
// change another user's chats.
const restoreAgentChatConversations = async (
  registry: AgentChatRegistry,
  userId: string
): Promise<void> => {
  const current = readAgentChatState(registry);

  if (current.userId === userId && current.loaded) {
    return;
  }

  const pending = agentChatRestorations.get(registry);

  if (pending?.userId === userId) {
    await pending.promise;

    return;
  }

  registry.set(agentChatConversationStateAtom, {
    ...initialAgentChatConversations(),
    userId,
  });
  // Registered before the run starts, so a run that ends at once still
  // removes its own entry.
  const { promise, resolve } = Promise.withResolvers();
  const restoring = { userId, promise };
  agentChatRestorations.set(registry, restoring);
  resolve(
    Effect.runPromise(
      Effect.gen(function* restoreStoredAgentChats() {
        const text = yield* AtomRegistry.getResult(
          registry,
          storedAgentChatConversationsAtom(userId)
        );

        const stored = yield* Effect.try(() =>
          parseAgentChatConversations(text)
        );

        if (!stillAgentChatOwner(registry, userId)) {
          return;
        }

        updateAgentChatState(registry, () =>
          stored.length > 0
            ? {
                loaded: true,
                conversations: stored,
                activeId: stored[0].id,
              }
            : { loaded: true }
        );
      }).pipe(
        Effect.catchCause(() =>
          Effect.sync(() => {
            if (stillAgentChatOwner(registry, userId)) {
              updateAgentChatState(registry, () => ({
                saveError: app_chats_load_failed(),
              }));
            }
          })
        ),
        Effect.ensuring(
          Effect.sync(() => {
            if (agentChatRestorations.get(registry) === restoring) {
              agentChatRestorations.delete(registry);
            }
          })
        )
      )
    )
  );

  await promise;
};

/**
 * Restores the user's stored conversations into the chat's state once the page
 * mounts.
 *
 * @param userId - The signed-in user.
 */
export const useAgentChatConversationRestore = (userId: string) => {
  const registry = useContext(RegistryContext);
  useEffect(() => {
    void restoreAgentChatConversations(registry, userId);
  }, [registry, userId]);
};

/**
 * Saves a change to a stored conversation in the background. A failed save
 * is reported, and the next load shows what was stored.
 *
 * @param registry - The chat's atom registry.
 * @param save - The save to run, given the signed-in user's id.
 */
export const saveAgentChatChange = (
  registry: AgentChatRegistry,
  save: (
    userId: string
  ) => Effect.Effect<unknown, unknown, AgentChatServerCalls>
) => {
  const { userId, loaded } = readAgentChatState(registry);

  if (!(isNonEmptyText(userId) && loaded)) {
    return;
  }

  void runClientEffect(
    registry,
    save(userId).pipe(
      Effect.match({
        onSuccess: () => null,
        onFailure: () => app_chats_save_failed(),
      }),
      Effect.flatMap((saveError) =>
        Effect.sync(() => {
          if (stillAgentChatOwner(registry, userId)) {
            updateAgentChatState(registry, () => ({ saveError }));
          }
        })
      )
    )
  );
};

/**
 * The last failed save of a conversation change, to show in the chat.
 *
 * @returns The error message, or null.
 */
export const useAgentChatSaveError = () =>
  useAtomValue(agentChatConversationStateAtom, (state) => state.saveError);

/**
 * A conversation's name: the one the user gave it or the title written
 * after an answer (titleAgentChatConversation), or else its first message
 * until then.
 *
 * @param conversation - The conversation.
 * @returns The title, or the new-chat label for a conversation with no name
 *   and no message yet.
 */
export const agentChatConversationTitle = (
  conversation: AgentChatConversation
) => {
  if (isNonEmptyText(conversation.name)) {
    return conversation.name;
  }

  for (const message of conversation.messages) {
    for (const part of message.parts) {
      if (message.role === "user" && part.type === "text") {
        return part.text;
      }
    }
  }

  return app_chat_new();
};

/**
 * The list and the open conversation; load and save state are read apart.
 *
 * @returns The conversations and the open one's id.
 */
export const useAgentChatConversations = () => {
  const { conversations, activeId } = useAtomValue(
    agentChatConversationStateAtom
  );

  return { conversations, activeId };
};

/**
 * Pinned conversations, then the rest; newest first within each, as
 * How the chat list sorts.
 *
 * @param conversations - The conversations.
 * @returns A sorted copy.
 */
export const sortAgentChatConversations = (
  conversations: AgentChatConversation[]
) =>
  conversations.toSorted(
    (first, second) =>
      Number(second.pinned) - Number(first.pinned) ||
      second.createdAt.localeCompare(first.createdAt)
  );

/**
 * The open conversation, or the first one when none is open.
 *
 * @returns The conversation.
 */
export const useActiveAgentChatConversation = () =>
  useAtomValue(
    agentChatConversationStateAtom,
    ({ conversations, activeId }) =>
      conversations.find((conversation) => conversation.id === activeId) ??
      conversations.at(0)
  );
