import { app_chat_files, app_nav_agent, app_user } from "#/paraglide/messages";
import type { AgentChatConversation } from "@/lib/agent-chat/conversation/agent-chat-conversation-atoms";

/**
 * The conversation as markdown, for download: a "## role"
 * section per message with its text and the names of its files; a message
 * with only thoughts keeps them.
 *
 * @param conversation - The conversation.
 * @returns The markdown.
 */
export const agentChatConversationMarkdown = (
  conversation: AgentChatConversation
) =>
  conversation.messages
    .flatMap((message) => {
      const text = message.parts
        .flatMap((part) => (part.type === "text" ? [part.text] : []))
        .join("\n\n");

      const files = message.parts.flatMap((part) =>
        part.type === "file" ? [part.filename ?? part.mediaType] : []
      );

      const thoughts = message.parts
        .flatMap((part) =>
          part.type === "reasoning" && part.text.trim()
            ? [part.text.trim()]
            : []
        )
        .join("\n\n");

      const body = [
        text || thoughts,
        files.length > 0 ? app_chat_files({ files: files.join(", ") }) : "",
      ]
        .filter(Boolean)
        .join("\n\n")
        .trim();

      return body
        ? [
            `## ${message.role === "user" ? app_user() : app_nav_agent()}\n\n${body}`,
          ]
        : [];
    })
    .join("\n\n");
