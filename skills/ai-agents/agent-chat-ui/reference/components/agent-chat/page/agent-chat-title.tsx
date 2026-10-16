import { RegistryContext } from "@effect/atom-react";
import { constVoid } from "effect/Function";
import { useContext, useEffect, useRef, useState } from "react";

import {
  app_chat_name,
  app_chat_new,
  app_chat_options_menu,
  app_page_title,
  app_rename,
} from "#/paraglide/messages";
import { AgentChatConversationMenu } from "@/components/agent-chat/page/agent-chat-conversation-menu";
import { TooltipHint } from "@/components/ui/display/tooltip";
import { AppIcon } from "@/components/ui/general/app-icon";
import { renameAgentChatConversation } from "@/lib/agent-chat/conversation/agent-chat-conversation-actions";
import {
  agentChatConversationNameMaxLength,
  agentChatConversationTitle,
  useActiveAgentChatConversation,
} from "@/lib/agent-chat/conversation/agent-chat-conversation-atoms";

/**
 * The chat title in the page header. Clicking the name turns it into a
 * field exactly as wide as its text, growing with it: Enter or leaving it
 * saves, Escape or an empty or unchanged name cancels. The chevron beside it
 * opens the chat menu; each lights only on its own hover. The browser tab
 * takes the chat's name while it is open.
 *
 * @returns The title, or its field while editing.
 */
export const AgentChatTitle = () => {
  const registry = useContext(RegistryContext);
  const conversation = useActiveAgentChatConversation();

  const title = conversation
    ? agentChatConversationTitle(conversation)
    : app_chat_new();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // The field takes focus with its text selected, a frame after it appears.
  useEffect(() => {
    if (!editing) {
      return constVoid;
    }

    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [editing]);

  const hasMessages = (conversation?.messages.length ?? 0) > 0;
  useEffect(() => {
    if (!hasMessages) {
      return constVoid;
    }

    const previous = document.title;
    document.title = app_page_title({ page: title });

    return () => {
      document.title = previous;
    };
  }, [hasMessages, title]);

  if (!conversation) {
    return null;
  }

  const save = () => {
    if (draft.trim() && draft.trim() !== title) {
      renameAgentChatConversation(registry, conversation.id, draft);
    }

    setEditing(false);
  };

  if (editing) {
    return (
      <span className="agent-chat-title-field" data-value={draft}>
        <input
          ref={inputRef}
          className="agent-chat-title-input"
          aria-label={app_chat_name()}
          // An input's own width (20 letters by default) would count in the
          // grid; at size 1 only the text's copy sets it.
          size={1}
          maxLength={agentChatConversationNameMaxLength}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
          onBlur={save}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              save();
            } else if (event.key === "Escape") {
              event.preventDefault();
              setEditing(false);
            }
          }}
        />
      </span>
    );
  }

  return (
    <span className="agent-chat-title">
      <TooltipHint label={app_rename()} side="bottom">
        <button
          type="button"
          className="agent-chat-title-name"
          onClick={() => {
            setDraft(title);
            setEditing(true);
          }}
        >
          <bdi>{title}</bdi>
        </button>
      </TooltipHint>
      <span className="agent-chat-title-menu">
        <AgentChatConversationMenu
          conversation={conversation}
          label={app_chat_options_menu()}
          icon={<AppIcon icon="chevron-down" />}
        />
      </span>
    </span>
  );
};
