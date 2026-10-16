import { RegistryContext } from "@effect/atom-react";
import type { FileUIPart } from "ai";
import { Effect } from "effect";
import { useContext, useState } from "react";
import type { ComponentProps, ReactElement } from "react";

import {
  app_chat_agent_answer,
  app_chat_approve_all,
  app_chat_your_message,
  app_copied,
  app_copy,
} from "#/paraglide/messages";
import { getLocale } from "#/paraglide/runtime";
import { AgentChatAnswerPart } from "@/components/agent-chat/message/agent-chat-answer-part";
import { AgentChatFollowUps } from "@/components/agent-chat/message/agent-chat-follow-ups";
import { AgentChatMessageFiles } from "@/components/agent-chat/message/agent-chat-message-files";
import {
  agentChatAnswerSources,
  agentChatWorkLogParts,
} from "@/components/agent-chat/work/agent-chat-answer-work";
import {
  AgentChatSources,
  AgentChatWorkedFor,
} from "@/components/agent-chat/work/agent-chat-work-log";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/display/tooltip";
import { Button } from "@/components/ui/general/button";
import { IconSwap } from "@/components/ui/general/icon-swap";
import type {
  AgentChatApprovalStatus,
  AgentChatFile,
  AgentChatMessage,
  AgentChatSuggestedTask,
} from "@/lib/agent-chat/conversation/agent-chat-messages";
import { agentChatMessageText } from "@/lib/agent-chat/conversation/agent-chat-messages";
import { runClientEffect } from "@/lib/atoms/app-atom-runtime";
import type { TrackingTask } from "@/lib/tasks/tracking-task-schema";
import type { GroupPostSearchProgress } from "@/server/posts/group-post-search.server";
import type { SiteSearchProgress } from "@/server/sites/site-search-pages.server";

import { isNonEmptyText } from "../../../../backend/shared/text/non-empty-text";

/**
 * What the user can do from inside a message.
 */
export interface AgentChatMessageHandlers {
  handleDecide: (approvalId: string, status: AgentChatApprovalStatus) => void;
  // Denies an action with what to change, so the agent asks again.
  handleRevise: (approvalId: string, note: string) => void;
  // Null until the user's task defaults load.
  handleAddTask: ((task: AgentChatSuggestedTask) => void) | null;
  handleFollowUp: (question: string) => void;
  userId: string;
  // The user's tasks, which the chat shows as cards and approvals name.
  tasks: TrackingTask[];
  handleOpenTask: (task: TrackingTask) => void;
  // A running group posts search's progress, by its tool call
  // (AgentChatGroupPostsCard).
  groupPostsProgress: (
    toolCallId: string
  ) => GroupPostSearchProgress[] | undefined;
  // A running site or Marketplace search's progress, by its tool call (the
  // status line).
  searchProgress: (toolCallId: string) => SiteSearchProgress | undefined;
}

// Today's messages show the time; older ones the date. The tooltip has both.
const agentChatTimeFormatOptions = {
  hour: "numeric",
  minute: "numeric",
} as const;

const agentChatTimeFormatByLocale = {
  he: new Intl.DateTimeFormat("he-IL", agentChatTimeFormatOptions),
  en: new Intl.DateTimeFormat("en-US", agentChatTimeFormatOptions),
};

const agentChatTimeFormat = () => agentChatTimeFormatByLocale[getLocale()];

const agentChatDateFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
} as const;

const agentChatDateFormatByLocale = {
  he: new Intl.DateTimeFormat("he-IL", agentChatDateFormatOptions),
  en: new Intl.DateTimeFormat("en-US", agentChatDateFormatOptions),
};

const agentChatDateFormat = () => agentChatDateFormatByLocale[getLocale()];

const agentChatFullDateFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
} as const;

const agentChatFullDateFormatByLocale = {
  he: new Intl.DateTimeFormat("he-IL", agentChatFullDateFormatOptions),
  en: new Intl.DateTimeFormat("en-US", agentChatFullDateFormatOptions),
};

const agentChatFullDateFormat = () =>
  agentChatFullDateFormatByLocale[getLocale()];

const agentChatMessageWhen = (createdAt: string) => {
  const date = new Date(createdAt);

  return date.toDateString() === new Date().toDateString()
    ? agentChatTimeFormat().format(date)
    : agentChatDateFormat().format(date);
};

// The chat's small ghost icon button: the agent-chat-button style, owned
// here so a tooltip can render it as its trigger.
const AgentChatIconButton = (props: ComponentProps<"button">) => (
  <button
    type="button"
    className="agent-chat-button"
    data-variant="ghost"
    data-size="icon-md"
    {...props}
  />
);

// MessageAction: a ghost icon button with its name in a tooltip
// below.
const AgentChatMessageAction = ({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactElement;
}) => (
  <Tooltip>
    <TooltipTrigger
      render={<AgentChatIconButton aria-label={label} onClick={onClick} />}
    >
      {children}
    </TooltipTrigger>
    <TooltipContent side="bottom">{label}</TooltipContent>
  </Tooltip>
);

// Copies the message's text; the icon turns into a check for a moment.
const AgentChatCopyButton = ({ text }: { text: string }) => {
  const registry = useContext(RegistryContext);
  const [copied, setCopied] = useState(false);

  return (
    <AgentChatMessageAction
      label={copied ? app_copied() : app_copy()}
      onClick={() => {
        // A refused clipboard leaves the icon as it was.
        void runClientEffect(
          registry,
          Effect.tryPromise(async () => {
            await navigator.clipboard.writeText(text);
          }).pipe(
            Effect.andThen(
              Effect.sync(() => {
                setCopied(true);
                setTimeout(() => {
                  setCopied(false);
                }, 1500);
              })
            ),
            Effect.ignore
          )
        );
      }}
    >
      <IconSwap icon={copied ? "agent-check" : "copy"} />
    </AgentChatMessageAction>
  );
};

// A file part as the chat shows it; an image shows itself while its contents
// are in the message (until a reload).
const agentChatMessageFile = (part: FileUIPart, id: string): AgentChatFile => ({
  id,
  name: part.filename ?? part.mediaType,
  mimeType: part.mediaType,
  previewUrl: part.mediaType.startsWith("image/") && part.url ? part.url : null,
});

// The buttons under the last answer: the questions written after it ended
// (data-followUps, agent-follow-up-questions.ts). A question the agent asked
// shows its answers in its own card (AgentChatQuestionCard).
const agentChatFollowUpQuestions = (message: AgentChatMessage) =>
  message.parts.findLast((part) => part.type === "data-followUps")?.data
    .questions ?? [];

// The actions in this answer still waiting for the user's approval. Several
// at once (joining a list of groups) can be approved together, each card
// still showing exactly what it does; the answer goes on once all are
// decided.
const agentChatPendingApprovalIds = (message: AgentChatMessage) =>
  message.parts.flatMap((part) =>
    "approval" in part &&
    part.state === "approval-requested" &&
    part.approval.isAutomatic !== true
      ? [part.approval.id]
      : []
  );

// A message (AI Elements Message). The user's sits at the end in a
// gray rounded box, with its files above it and, on hover, the time and a
// copy button below it. The agent's runs full width: once it ends, its
// folded work log ("עבד במשך…", AgentChatWorkedFor), then its text, cards,
// approvals and suggested tasks in order, its sources ("מקורות"), and copy
// and its time, which show on hover as under the user's messages. The last
// answer also offers follow-up questions.
// Each message is an article named for who wrote it, so assistive
// technology tells the user's messages from the agent's answers.
// When a message was sent, beside its copy button; hovered, the full date.
const AgentChatMessageTime = ({ createdAt }: { createdAt: string }) => (
  <span className="agent-chat-message-time">
    <Tooltip>
      <TooltipTrigger render={<time dateTime={createdAt} />}>
        {agentChatMessageWhen(createdAt)}
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {agentChatFullDateFormat().format(new Date(createdAt))}
      </TooltipContent>
    </Tooltip>
  </span>
);

// dir="auto" reads a message's direction from its first letter; one with no
// letters ("20", an answer to a question card) would turn left-to-right and
// leave the page's side, so it keeps the page's direction.
const agentChatLetterPattern = /\p{L}/u;

const agentChatHasLetters = (text: string) => agentChatLetterPattern.test(text);

// The user's message: its files, its text, and on hover its time and copy.
const AgentChatUserMessage = ({ message }: { message: AgentChatMessage }) => {
  const text = agentChatMessageText(message);
  const createdAt = message.metadata?.createdAt;

  const files = message.parts.flatMap((part, index) =>
    part.type === "file"
      ? [agentChatMessageFile(part, `${message.id}-${index}`)]
      : []
  );

  return (
    <article
      className="agent-chat-message"
      data-from="user"
      aria-label={app_chat_your_message()}
    >
      {files.length > 0 && <AgentChatMessageFiles files={files} />}
      {text && (
        <div
          className="agent-chat-message-content"
          dir={agentChatHasLetters(text) ? "auto" : undefined}
        >
          {text}
        </div>
      )}
      <div className="agent-chat-message-actions">
        {isNonEmptyText(createdAt) && (
          <AgentChatMessageTime createdAt={createdAt} />
        )}
        {text && <AgentChatCopyButton text={text} />}
      </div>
    </article>
  );
};

// The agent's answer: its folded work log, its parts, sources and approve
// all, then copy and its time once it ended, and the last answer's
// follow-ups.
const AgentChatAnswerMessage = ({
  message,
  isLast,
  live,
  handlers,
}: {
  message: AgentChatMessage;
  isLast: boolean;
  live: boolean;
  handlers: AgentChatMessageHandlers;
}) => {
  const text = agentChatMessageText(message);
  const createdAt = message.metadata?.createdAt;
  const followUps = isLast ? agentChatFollowUpQuestions(message) : [];
  const pending = isLast ? agentChatPendingApprovalIds(message) : [];
  const work = live ? [] : agentChatWorkLogParts(message);
  const sources = live ? [] : agentChatAnswerSources(message);

  return (
    <article
      className="agent-chat-message"
      data-from="assistant"
      data-live={live ? "" : undefined}
      aria-label={app_chat_agent_answer()}
    >
      <div className="agent-chat-message-content">
        {work.length > 0 && (
          <AgentChatWorkedFor message={message} parts={work} />
        )}
        {message.parts.map((part, index) => {
          const key = `${message.id}-${index}`;

          return (
            <AgentChatAnswerPart
              key={key}
              part={part}
              message={message}
              handlers={handlers}
              live={live}
              isLast={isLast}
            />
          );
        })}
        {sources.length > 0 && <AgentChatSources urls={sources} />}
        {pending.length > 1 && (
          <div className="agent-chat-approve-all">
            <Button
              size="sm"
              onClick={() => {
                for (const approvalId of pending) {
                  handlers.handleDecide(approvalId, "allowed");
                }
              }}
            >
              {app_chat_approve_all({ count: pending.length })}
            </Button>
          </div>
        )}
      </div>
      {/* Copy and the time come once the answer has ended. */}
      {!live && (
        <div className="agent-chat-message-actions">
          {text && <AgentChatCopyButton text={text} />}
          {isNonEmptyText(createdAt) && (
            <AgentChatMessageTime createdAt={createdAt} />
          )}
        </div>
      )}
      {followUps.length > 0 && (
        <AgentChatFollowUps
          questions={followUps}
          onSelect={handlers.handleFollowUp}
        />
      )}
    </article>
  );
};

/**
 * One chat message: the user's text and files, or the agent's answer with its
 * parts, its work log and follow-ups.
 *
 * @param props - message: the message; isLast: whether it is the newest; live:
 *   whether the agent is writing it now; handlers: the chat's actions.
 * @returns The message.
 */
export const AgentChatMessageItem = ({
  message,
  isLast,
  live,
  handlers,
}: {
  message: AgentChatMessage;
  isLast: boolean;
  // The answer the agent is writing now: its finished actions show as rows
  // in place, and fold into "עבד במשך…" once it ends.
  live: boolean;
  handlers: AgentChatMessageHandlers;
}) => {
  if (message.role === "user") {
    return <AgentChatUserMessage message={message} />;
  }

  return (
    <AgentChatAnswerMessage
      message={message}
      isLast={isLast}
      live={live}
      handlers={handlers}
    />
  );
};
