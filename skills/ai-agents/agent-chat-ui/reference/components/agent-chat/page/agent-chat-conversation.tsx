import { constVoid } from "effect/Function";
import { useEffect, useRef } from "react";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import type { StickToBottomContext } from "use-stick-to-bottom";

import {
  app_chat_agent_answer,
  app_chat_conversation,
  app_chat_latest_message,
  app_try_again,
} from "#/paraglide/messages";
import {
  AgentChatLinkDetailsContext,
  agentChatLinkDetailsOf,
} from "@/components/agent-chat/message/agent-chat-link-details";
import { AgentChatMessageItem } from "@/components/agent-chat/message/agent-chat-message";
import type { AgentChatMessageHandlers } from "@/components/agent-chat/message/agent-chat-message";
import { agentChatLiveActivity } from "@/components/agent-chat/work/agent-chat-answer-work";
import type { AgentChatLiveActivity } from "@/components/agent-chat/work/agent-chat-answer-work";
import { AgentChatStatusLine } from "@/components/agent-chat/work/agent-chat-work-log";
import { TooltipHint } from "@/components/ui/display/tooltip";
import { AppIcon } from "@/components/ui/general/app-icon";
import { agentChatAnswerPartShows } from "@/lib/agent-chat/conversation/agent-chat-messages";
import type { AgentChatMessage } from "@/lib/agent-chat/conversation/agent-chat-messages";

import { isNonEmptyText } from "../../../../backend/shared/text/non-empty-text";

// Opens a conversation at its end, and brings the end back into view each
// time the user sends a message. The ref goes on StickToBottom's contextRef.
const useFollowSentAgentChatMessages = (
  latestUserMessageId: string | undefined
) => {
  const stickToBottomRef = useRef<StickToBottomContext>(null);
  const followedRef = useRef<string | null | undefined>(null);
  useEffect(() => {
    if (followedRef.current === latestUserMessageId) {
      return;
    }

    const opening = followedRef.current === null;
    followedRef.current = latestUserMessageId;
    void stickToBottomRef.current?.scrollToBottom({
      animation: opening ? "instant" : "smooth",
    });
  }, [latestUserMessageId]);

  return stickToBottomRef;
};

const agentChatOuterHeight = (element: Element | null | undefined) =>
  element?.getBoundingClientRect().height ?? 0;

// AI Elements' ConversationContentSpacer: room under the latest exchange so
// the user's last message can scroll up to the top of the view, the way
// ChatGPT leaves space for the answer. It measures the conversation against
// the last user message and everything after it (the answer, its status
// line); the 80px (20px on phones) of breathing room at the end is in
// agent-chat.css.
// The room is written straight onto the spacer from the observers, which run
// before the browser paints: kept in React state it lagged a render behind,
// so each time "חושב…" gave way to the answer the conversation was briefly
// shorter, the scroll clamped and the chat jumped down, then back up.
const AgentChatContentSpacer = () => {
  const spacerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const spacer = spacerRef.current;
    const content = spacer?.closest(".agent-chat-conversation-content");
    const scroller = content?.parentElement;

    if (!(spacer && content && scroller)) {
      return constVoid;
    }

    // null never matches a lookup's result (an element or undefined), so the
    // first look always measures.
    let lastUser: Element | null | undefined = null;
    // Everything after it: the answer, its status line, an error.
    let after: Element[] = [];

    const measure = () => {
      spacer.style.setProperty(
        "--agent-chat-spacer-room",
        `${
          agentChatOuterHeight(scroller) -
          agentChatOuterHeight(lastUser) -
          after.reduce(
            (total, element) => total + agentChatOuterHeight(element),
            0
          )
        }px`
      );
    };

    // Follows the last user message and what comes after it. Other changes,
    // such as the shimmer's per-frame style, leave them as they are.
    const follow = () => {
      const nextUser = [...content.querySelectorAll('[data-from="user"]')].at(
        -1
      );

      const nextAfter: Element[] = [];

      for (
        let element = nextUser?.nextElementSibling;
        element && element !== spacer;
        element = element.nextElementSibling
      ) {
        nextAfter.push(element);
      }

      if (
        nextUser === lastUser &&
        nextAfter.length === after.length &&
        nextAfter.every((element, index) => element === after[index])
      ) {
        return;
      }

      lastUser = nextUser;
      after = nextAfter;
      measure();
    };

    // The messages live inside the content, so watching it and the scroller
    // catches every size change; the first report sets the first measurement.
    const resize = new ResizeObserver(() => {
      follow();
      measure();
    });

    resize.observe(scroller);
    resize.observe(content);
    const mutations = new MutationObserver(follow);
    mutations.observe(content, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return () => {
      resize.disconnect();
      mutations.disconnect();
    };
  }, []);

  return (
    <>
      <div
        ref={spacerRef}
        aria-hidden="true"
        className="agent-chat-conversation-spacer"
      />
      <div aria-hidden="true" className="agent-chat-conversation-breathing" />
    </>
  );
};

// AI Elements' ConversationScrollButton: hidden at the end; elsewhere it
// rises 16px into view, grows from 95% and fades in over 150ms.
const AgentChatScrollButton = () => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  return (
    <TooltipHint label={app_chat_latest_message()}>
      <button
        type="button"
        className="agent-chat-button agent-chat-scroll-button"
        data-variant="outline"
        data-size="icon"
        data-hidden={isAtBottom || undefined}
        inert={isAtBottom}
        aria-label={app_chat_latest_message()}
        onClick={() => {
          void scrollToBottom();
        }}
      >
        <AppIcon icon="agent-scroll-down" />
      </button>
    </TooltipHint>
  );
};

/**
 * The conversation (AI Elements Conversation on
 * use-stick-to-bottom): it stays at the end while the reader is there, lets
 * them scroll away freely, and offers a way back. While the agent answers,
 * its status line (AgentChatStatusLine) sits under the answer; a failed
 * answer offers to try again.
 *
 * @returns The conversation.
 */
export const AgentChatConversation = ({
  messages,
  handlers,
  answering,
  errorMessage,
  onRetry,
  reconnecting,
}: {
  messages: AgentChatMessage[];
  handlers: AgentChatMessageHandlers;
  answering: boolean;
  // The model call being tried again, until the answer moves on.
  reconnecting: { attempt: number; of: number } | null;
  errorMessage: string | undefined;
  onRetry: (() => void) | null;
}) => {
  const latestUserMessageId = messages.findLast(
    (message) => message.role === "user"
  )?.id;

  const stickToBottomRef = useFollowSentAgentChatMessages(latestUserMessageId);

  // Until the answer shows something, its empty message stays out and only
  // the status line shows: rendering both left a blank frame above it.
  const latest = messages.at(-1);

  const answerPending =
    answering &&
    !(
      latest?.role === "assistant" &&
      latest.parts.some(agentChatAnswerPartShows)
    );

  const shown =
    answerPending && latest?.role === "assistant"
      ? messages.slice(0, -1)
      : messages;

  let activity: AgentChatLiveActivity | null = null;

  if (answering) {
    activity = reconnecting
      ? { kind: "reconnecting", ...reconnecting }
      : agentChatLiveActivity(latest);
  }

  return (
    <StickToBottom
      contextRef={stickToBottomRef}
      className="agent-chat-conversation"
      initial="smooth"
      resize="smooth"
      role="log"
      aria-label={app_chat_conversation()}
    >
      <StickToBottom.Content
        className="agent-chat-conversation-content"
        scrollClassName="agent-chat-conversation-scroller"
      >
        {/* What the conversation found, for its answers' link previews. */}
        <AgentChatLinkDetailsContext value={agentChatLinkDetailsOf(messages)}>
          {shown.map((message, index) => (
            <AgentChatMessageItem
              key={message.id}
              message={message}
              isLast={index === shown.length - 1}
              live={answering && message === latest}
              handlers={handlers}
            />
          ))}
        </AgentChatLinkDetailsContext>
        {/* The status line in an answer's own frame, one element for the
            whole answer: its icon and label morph from the pulse dot to
            each step instead of swapping. */}
        {activity && (
          <article
            className="agent-chat-message"
            data-from="assistant"
            aria-label={app_chat_agent_answer()}
          >
            <div className="agent-chat-message-content">
              <AgentChatStatusLine
                activity={activity}
                progress={
                  activity.kind === "tool"
                    ? handlers.searchProgress(activity.part.toolCallId)
                    : undefined
                }
              />
            </div>
          </article>
        )}
        {isNonEmptyText(errorMessage) && (
          <div className="agent-chat-answer-error" role="alert">
            <span>{errorMessage}</span>
            {onRetry && (
              <button
                type="button"
                className="agent-chat-button"
                data-variant="outline"
                data-size="sm"
                onClick={onRetry}
              >
                {app_try_again()}
              </button>
            )}
          </div>
        )}
        <AgentChatContentSpacer />
      </StickToBottom.Content>
      <AgentChatScrollButton />
    </StickToBottom>
  );
};
