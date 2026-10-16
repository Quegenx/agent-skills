import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";

import {
  deleteAgentChatConversationRow,
  readStoredAgentChatConversations,
  updateAgentChatConversationRow,
} from "@/agent/chat/conversations/agent-chat-conversations.server";
import type { StoredAgentChatConversation } from "@/agent/chat/conversations/agent-chat-conversations.server";
import { nameStoredAgentChatConversation } from "@/agent/chat/conversations/agent-chat-title.server";
import type { AgentChatMessage } from "@/lib/agent-chat/conversation/agent-chat-messages";
import { userIdServerInput } from "@/lib/auth/user-id-server-input";
import { runAppRequest } from "@/server/runtime/app-runtime.server";
import { createOwnedSupabaseClient } from "@/server/user-data/user-page-state.server";

import { toStandardSchema } from "../../../../backend/shared/schema/standard-schema";

// A stored message's shape. The server validated each one against the agent's
// tools (validateAgentChatMessages) before sending it, so the client checks
// only that it is a message.
const looksLikeAgentChatMessage = Schema.is(
  Schema.Struct({
    id: Schema.String,
    role: Schema.Literals(["user", "assistant", "system"]),
    parts: Schema.Array(Schema.Unknown),
  })
);

const agentChatStoredMessage = Schema.declare(
  (value: unknown): value is AgentChatMessage =>
    looksLikeAgentChatMessage(value)
);

const decodeStoredAgentChatConversations = Schema.decodeUnknownSync(
  Schema.fromJsonString(
    Schema.Array(
      Schema.Struct({
        id: Schema.String,
        name: Schema.NullOr(Schema.String),
        pinned: Schema.Boolean,
        createdAt: Schema.String,
        messages: Schema.Array(agentChatStoredMessage),
      })
    )
  )
);

const conversationInput = Schema.Struct({
  ...userIdServerInput.fields,
  conversationId: Schema.String.check(Schema.isUUID()),
});

/**
 * The user's stored conversations with their messages, as a JSON string (see
 * StoredAgentChatConversation). A server function, so the agent page's loader
 * can read them on the server as well as on a link hover. Their messages are
 * written by the chat endpoint as the agent answers.
 */
export const listAgentChatConversations = createServerFn({ method: "GET" })
  .validator(toStandardSchema(userIdServerInput))
  .handler(
    async ({ data }) =>
      await runAppRequest(
        Effect.gen(function* listAgentChatConversationsHandler() {
          const supabase = yield* createOwnedSupabaseClient(data.userId);

          return JSON.stringify(
            yield* readStoredAgentChatConversations(supabase)
          );
        })
      )
  );

/**
 * The conversations from listAgentChatConversations' JSON text, which the
 * server wrote from validated stored messages.
 *
 * @param text - The server's JSON text.
 * @returns The stored conversations.
 */
export const parseAgentChatConversations = (
  text: string
): StoredAgentChatConversation[] =>
  decodeStoredAgentChatConversations(text).map((conversation) => ({
    ...conversation,
    messages: [...conversation.messages],
  }));

// These change a conversation the user acts on.

/**
 * Renames a stored conversation or pins it, on the server.
 *
 * @param context - data: the signed-in user's id, the conversation's id and the
 *   change (a name, pinned, or both).
 * @returns A promise that settles once it is saved.
 */
export const changeAgentChatConversation = createServerFn({ method: "POST" })
  .validator(
    toStandardSchema(
      Schema.Struct({
        ...conversationInput.fields,
        change: Schema.Struct({
          name: Schema.optional(
            Schema.Trim.check(Schema.isMinLength(1), Schema.isMaxLength(120))
          ),
          pinned: Schema.optional(Schema.Boolean),
        }).check(
          Schema.makeFilter(
            (change) => change.name !== undefined || change.pinned !== undefined
          )
        ),
      })
    )
  )
  .handler(async ({ data }) => {
    await runAppRequest(
      Effect.gen(function* changeAgentChatConversationHandler() {
        const supabase = yield* createOwnedSupabaseClient(data.userId);
        yield* updateAgentChatConversationRow(
          supabase,
          data.conversationId,
          data.change
        );
      })
    );
  });

/**
 * Deletes a stored conversation and its messages, on the server.
 *
 * @param context - data: the signed-in user's id and the conversation's id.
 * @returns A promise that settles once it is deleted.
 */
export const deleteAgentChatConversation = createServerFn({ method: "POST" })
  .validator(toStandardSchema(conversationInput))
  .handler(async ({ data }) => {
    await runAppRequest(
      Effect.gen(function* deleteAgentChatConversationHandler() {
        const supabase = yield* createOwnedSupabaseClient(data.userId);
        yield* deleteAgentChatConversationRow(supabase, data.conversationId);
      })
    );
  });

/**
 * Titles a chat without a name after an answer (see
 * nameStoredAgentChatConversation); null when it has a name or no subject yet.
 */
export const nameAgentChatConversation = createServerFn({ method: "POST" })
  .validator(toStandardSchema(conversationInput))
  .handler(
    async ({ data }) =>
      await runAppRequest(
        Effect.gen(function* nameAgentChatConversationHandler() {
          const supabase = yield* createOwnedSupabaseClient(data.userId);

          return yield* nameStoredAgentChatConversation(
            supabase,
            data.userId,
            data.conversationId
          );
        })
      )
  );
