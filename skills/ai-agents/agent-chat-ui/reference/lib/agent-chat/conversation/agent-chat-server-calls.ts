import { Context, Layer } from "effect";
import type { Effect } from "effect";

import { callServerFunction } from "@/lib/atoms/server-function-call";
import type { ServerFunctionCallError } from "@/lib/atoms/server-function-call";

import {
  changeAgentChatConversation,
  deleteAgentChatConversation,
  listAgentChatConversations,
  nameAgentChatConversation,
} from "./agent-chat-persistence";

/**
 * The agent chat's conversation server functions (agent-chat-persistence) as
 * Effects, for the conversations' atoms (agent-chat-conversation-atoms). Tests
 * replace this service with a fake layer instead of calling the server.
 */
export class AgentChatServerCalls extends Context.Service<
  AgentChatServerCalls,
  {
    // The stored conversations as the server's JSON text.
    readonly listAgentChatConversations: (
      userId: string
    ) => Effect.Effect<string, ServerFunctionCallError>;
    readonly changeAgentChatConversation: (input: {
      userId: string;
      conversationId: string;
      change: { name?: string; pinned?: boolean };
    }) => Effect.Effect<void, ServerFunctionCallError>;
    readonly deleteAgentChatConversation: (input: {
      userId: string;
      conversationId: string;
    }) => Effect.Effect<void, ServerFunctionCallError>;
    readonly nameAgentChatConversation: (input: {
      userId: string;
      conversationId: string;
    }) => Effect.Effect<string | null, ServerFunctionCallError>;
  }
>()("app/lib/agent-chat/AgentChatServerCalls") {
  static readonly layer = Layer.succeed(AgentChatServerCalls, {
    listAgentChatConversations: (userId) =>
      callServerFunction(
        async () => await listAgentChatConversations({ data: { userId } })
      ),
    changeAgentChatConversation: (data) =>
      callServerFunction(async () => {
        await changeAgentChatConversation({ data });
      }),
    deleteAgentChatConversation: (data) =>
      callServerFunction(async () => {
        await deleteAgentChatConversation({ data });
      }),
    nameAgentChatConversation: (data) =>
      callServerFunction(async () => await nameAgentChatConversation({ data })),
  });
}
