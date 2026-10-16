import { useChat } from "@ai-sdk/react";
import { RegistryContext } from "@effect/atom-react";
import { lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";
import type { AtomRegistry } from "effect/reactivity";
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import {
  useContext,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";

import { agentChatRequestFailure } from "@/agent/chat/turn/agent-chat-errors";
import { AgentChatComposer } from "@/components/agent-chat/composer/agent-chat-composer";
import type { AgentChatMessageHandlers } from "@/components/agent-chat/message/agent-chat-message";
import { AgentChatConversation } from "@/components/agent-chat/page/agent-chat-conversation";
import { AgentChatEmptyState } from "@/components/agent-chat/page/agent-chat-empty-state";
import { useChatFirstReplyTiming } from "@/components/agent-chat/page/agent-chat-first-reply-timing";
import {
  agentAnswerRanTool,
  createAgentChatTransport,
  readAgentChatAttachments,
} from "@/components/agent-chat/page/agent-chat-transport";
import { AgentTasksPanel } from "@/components/agent-chat/page/agent-tasks-panel";
import { TrackingTaskSheet } from "@/components/tasks/editor/tracking-task-sheet";
import type { AgentChatAttachment } from "@/lib/agent-chat/attachments/agent-chat-attachments";
import {
  findAgentChatConversation,
  syncAgentChatMessages,
  titleAgentChatConversation,
} from "@/lib/agent-chat/conversation/agent-chat-conversation-actions";
import {
  useActiveAgentChatConversation,
  useAgentChatSaveError,
} from "@/lib/agent-chat/conversation/agent-chat-conversation-atoms";
import type { AgentChatConversation as AgentChatConversationRecord } from "@/lib/agent-chat/conversation/agent-chat-conversation-atoms";
import type { AgentChatMessage } from "@/lib/agent-chat/conversation/agent-chat-messages";
import {
  combineQueuedAgentChatMessages,
  queueAgentChatMessage,
  removeQueuedAgentChatMessage,
} from "@/lib/agent-chat/conversation/agent-chat-queue";
import type { QueuedAgentChatMessage } from "@/lib/agent-chat/conversation/agent-chat-queue";
import { invalidateReactivityKeysAtom } from "@/lib/atoms/app-atom-runtime";
import { invalidateFacebookGroupLists } from "@/lib/groups/joined/joined-group-atoms";
import { seedTaskOpportunities } from "@/lib/opportunities/task-opportunity-atoms";
import { userPlanServesBusiness } from "@/lib/plans/user-plan";
import { useUserPlan } from "@/lib/plans/user-plan-atoms";
import {
  useUserSettings,
  userSettingsReactivityKeys,
} from "@/lib/settings/user-settings/user-settings-atoms";
import {
  trackingTaskReactivityKeys,
  useTrackingTaskActions,
  useTrackingTasks,
} from "@/lib/tasks/tracking-task-atoms";
import { newTrackingTask } from "@/lib/tasks/tracking-task-schema";
import type { TrackingTask } from "@/lib/tasks/tracking-task-schema";
import type { GroupPostSearchProgress } from "@/server/posts/group-post-search.server";
import type { SiteSearchProgress } from "@/server/sites/site-search-pages.server";

import { isNonEmptyText } from "../../../../backend/shared/text/non-empty-text";

// The running tools' progress, by tool call, from the answer's transient
// parts: each group posts search's (data-groupPostsProgress, for its card,
// until its output replaces it) and each site or Marketplace search's
// (data-searchProgress, for the status line).
const useAgentChatToolProgress = () => {
  const [groupPosts, setGroupPosts] = useState<
    ReadonlyMap<string, GroupPostSearchProgress[]>
  >(new Map());

  const [searches, setSearches] = useState<
    ReadonlyMap<string, SiteSearchProgress>
  >(new Map());

  const readProgressPart = (part: AgentChatMessage["parts"][number]) => {
    if (part.type === "data-groupPostsProgress") {
      setGroupPosts((current) =>
        new Map(current).set(part.data.toolCallId, part.data.groups)
      );
    }

    if (part.type === "data-searchProgress") {
      const { toolCallId, ...progress } = part.data;
      setSearches((current) => new Map(current).set(toolCallId, progress));
    }
  };

  return {
    readProgressPart,
    groupPostsProgress: (toolCallId: string) => groupPosts.get(toolCallId),
    searchProgress: (toolCallId: string) => searches.get(toolCallId),
  };
};

// After an answer ends: what the agent changed is read again wherever it
// shows, and a chat without a name gets its title.
const refreshAfterAgentAnswer = (
  registry: AtomRegistry.AtomRegistry,
  userId: string,
  conversationId: string,
  {
    message,
    isError,
    isAbort,
  }: { message: AgentChatMessage; isError: boolean; isAbort: boolean }
) => {
  // What the agent changed is read again wherever it shows.
  if (
    agentAnswerRanTool(message, [
      "tool-saveFacebookGroups",
      "tool-removeSavedGroups",
      "tool-joinFacebookGroup",
    ])
  ) {
    invalidateFacebookGroupLists(registry, userId);
  }

  if (
    agentAnswerRanTool(message, [
      "tool-updateUserSettings",
      "tool-updateFacebookActionPace",
    ])
  ) {
    registry.set(
      invalidateReactivityKeysAtom,
      userSettingsReactivityKeys(userId)
    );
  }

  // A chat without a name gets its title once an answer is complete;
  // one that only said hello so far tries again after the next answer.
  if (
    !(isError || isAbort) &&
    (findAgentChatConversation(registry, conversationId)?.name ?? "") === ""
  ) {
    titleAgentChatConversation(registry, conversationId);
  }

  if (
    agentAnswerRanTool(message, [
      "tool-createTrackingTask",
      "tool-updateTrackingTask",
      "tool-setTrackingTaskSiteSearches",
      "tool-deleteTrackingTasks",
    ])
  ) {
    registry.set(
      invalidateReactivityKeysAtom,
      trackingTaskReactivityKeys(userId)
    );
  }
};

// One conversation with the agent (AI SDK useChat on /api/agent/chat).
// Approvals continue the answer by themselves once decided.
const AgentChatSession = ({
  userId,
  userName,
  conversation,
}: {
  userId: string;
  userName: string | null;
  conversation: AgentChatConversationRecord;
}) => {
  const [draft, setDraft] = useState("");
  const registry = useContext(RegistryContext);

  const transport = useMemo(
    () => createAgentChatTransport(registry, userId),
    [registry, userId]
  );

  const textRef = useRef<HTMLTextAreaElement>(null);
  const { settings } = useUserSettings(userId);
  // A business's suggestions until the plan says personal.
  const plan = useUserPlan(userId);
  const business = plan === null || userPlanServesBusiness(plan);
  const { saveTrackingTask } = useTrackingTaskActions();
  // The tasks the chat shows as cards and approval cards name; a card's
  // title opens the task for editing in the sheet.
  const tasks = useTrackingTasks(userId);
  const [editingTask, setEditingTask] = useState<TrackingTask | null>(null);

  // The model call the server is trying again, with how many parts the answer
  // had then (data-retry); messagesRef lets onData read the answer.
  const [reconnecting, setReconnecting] = useState<{
    attempt: number;
    of: number;
    answerParts: number;
  } | null>(null);

  const messagesRef = useRef<AgentChatMessage[]>([]);
  const toolProgress = useAgentChatToolProgress();

  const {
    messages,
    status,
    error,
    sendMessage,
    regenerate,
    stop,
    addToolApprovalResponse,
  } = useChat<AgentChatMessage>({
    id: conversation.id,
    messages: conversation.messages,
    transport,
    // agent_chat_messages ids are uuids.
    generateId: () => crypto.randomUUID(),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    // Opportunities a listing found, sent beside the answer so their cards
    // show without another read (AgentChatOpportunityCards).
    onData: (part) => {
      if (part.type === "data-opportunities") {
        seedTaskOpportunities(registry, userId, part.data);
      }

      toolProgress.readProgressPart(part);

      if (part.type === "data-retry") {
        setReconnecting({
          ...part.data,
          answerParts: messagesRef.current.at(-1)?.parts.length ?? 0,
        });
      }
    },
    onFinish: (finished) => {
      refreshAfterAgentAnswer(registry, userId, conversation.id, finished);
    },
  });

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  // The sidebar, search and download read the store's copy; it follows the
  // chat whenever an answer is not mid-stream.
  useEffect(() => {
    if (status !== "streaming") {
      syncAgentChatMessages(registry, conversation.id, messages);
    }
  }, [registry, conversation.id, status, messages]);

  const { markSent } = useChatFirstReplyTiming(messages, registry);

  const send = async (text: string, attachments: AgentChatAttachment[]) => {
    markSent();
    const files = await readAgentChatAttachments(attachments);
    const metadata = { createdAt: new Date().toISOString() };
    void sendMessage(text ? { text, files, metadata } : { files, metadata });
  };

  // What the user sent while the agent answered (agent-chat-queue.ts). It
  // goes as one message once the answer ends (finished or stopped) with no
  // approval card waiting: a message sent then would leave the card
  // unanswered, which the agent reads as aborted.
  const [queued, setQueued] = useState<QueuedAgentChatMessage[]>([]);

  const waitingForApproval =
    messages
      .at(-1)
      ?.parts.some(
        (part) => "state" in part && part.state === "approval-requested"
      ) ?? false;

  // Set while the queued messages are being sent, so a render before the
  // chat turns busy does not send them twice. Only the messages sent leave
  // the queue (one queued meanwhile waits for the next answer), and only
  // once sent: if the files cannot be read, they stay.
  const sendingQueuedRef = useRef(false);

  const sendQueued = useEffectEvent(async () => {
    sendingQueuedRef.current = true;
    const sent = new Set(queued.map((message) => message.id));
    const combined = combineQueuedAgentChatMessages(queued);

    try {
      await send(combined.text, combined.files);
    } catch (sendError) {
      sendingQueuedRef.current = false;
      throw sendError;
    }

    setQueued((current) => current.filter((message) => !sent.has(message.id)));
    sendingQueuedRef.current = false;
  });

  useEffect(() => {
    if (
      status === "ready" &&
      !waitingForApproval &&
      queued.length > 0 &&
      !sendingQueuedRef.current
    ) {
      void sendQueued();
    }
  }, [status, waitingForApproval, queued]);

  // A suggested task becomes a tracking task with the user's scan frequency,
  // as one added on משימות does, and its potential as its priority.
  const handlers: AgentChatMessageHandlers = {
    handleDecide: (approvalId, decision) => {
      void addToolApprovalResponse({
        id: approvalId,
        approved: decision !== "denied",
      });
    },
    // A revise note denies the action with the note as its reason; the agent
    // reads it and asks again with the change (AgentChatApprovalCard).
    handleRevise: (approvalId, note) => {
      void addToolApprovalResponse({
        id: approvalId,
        approved: false,
        reason: note,
      });
    },
    handleAddTask: settings
      ? (task) => {
          saveTrackingTask({
            ...newTrackingTask(
              task.sentence,
              { scanFrequency: settings.automation.scanFrequency },
              {
                details: task.details,
                location: task.location ?? "",
                // It waits in הצעות until the user starts it, as suggested
                // tasks go to the backlog.
                status: "suggested",
                priority: task.potential ?? "none",
              }
            ),
          });
        }
      : null,
    userId,
    tasks,
    handleOpenTask: setEditingTask,
    groupPostsProgress: toolProgress.groupPostsProgress,
    searchProgress: toolProgress.searchProgress,
    handleFollowUp: (question) => {
      void send(question, []);
    },
  };

  // A suggestion fills the composer and puts the caret at its end.
  const fillComposer = (prompt: string) => {
    setDraft(prompt);
    requestAnimationFrame(() => {
      const text = textRef.current;
      text?.focus();
      text?.setSelectionRange(text.value.length, text.value.length);
    });
  };

  const answering = status === "submitted" || status === "streaming";

  // A retry shows until the answer gains a part after it.
  const shownReconnect =
    reconnecting &&
    (messages.at(-1)?.parts.length ?? 0) === reconnecting.answerParts
      ? { attempt: reconnecting.attempt, of: reconnecting.of }
      : null;

  const failure = error ? agentChatRequestFailure(error) : null;

  const composer = (
    <AgentChatComposer
      draft={draft}
      onDraftChange={setDraft}
      textRef={textRef}
      answering={answering}
      onSend={send}
      onQueue={(text, files) => {
        const next = queueAgentChatMessage(queued, {
          id: crypto.randomUUID(),
          text,
          files,
        });

        if (next) {
          setQueued(next);
        }

        return next !== null;
      }}
      queued={queued}
      onRemoveQueued={(id) => {
        setQueued((current) => removeQueuedAgentChatMessage(current, id));
      }}
      onStop={() => {
        void stop();
      }}
      business={business}
      userId={userId}
    />
  );

  const sheet = (
    <TrackingTaskSheet
      userId={userId}
      task={editingTask}
      onClose={() => {
        setEditingTask(null);
      }}
    />
  );

  if (messages.length === 0) {
    return (
      <AgentChatEmptyState
        userName={userName}
        business={business}
        composer={composer}
        onPickSuggestion={fillComposer}
      />
    );
  }

  return (
    <>
      {sheet}
      <AgentChatConversation
        messages={messages}
        handlers={handlers}
        answering={answering}
        errorMessage={failure?.message}
        reconnecting={shownReconnect}
        onRetry={
          failure?.retry === true
            ? () => {
                void regenerate();
              }
            : null
        }
      />
      <div className="agent-chat-bottom-composer">{composer}</div>
    </>
  );
};

/**
 * The agent page, laid out as a chat: a new chat shows the greeting
 * with the composer and suggestions; once it has messages the conversation
 * fills the page with the composer pinned below. The tasks panel sits beside
 * both.
 *
 * @returns The page.
 */
export const AgentChatPage = ({
  userId,
  userName,
}: {
  userId: string;
  userName: string | null;
}) => {
  const conversation = useActiveAgentChatConversation();
  const saveError = useAgentChatSaveError();

  return (
    // motion's animation features load once for the page; the placeholder
    // and suggestions use the lighter "m" components.
    // Under reduced motion they keep their fades and drop the movement.
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div className="agent-chat">
          <div className="agent-chat-main">
            {isNonEmptyText(saveError) && (
              <p className="agent-chat-save-error" role="alert">
                {saveError}
              </p>
            )}
            {conversation && (
              <AgentChatSession
                key={`${userId}:${conversation.id}`}
                userId={userId}
                userName={userName}
                conversation={conversation}
              />
            )}
          </div>
          <AgentTasksPanel userId={userId} />
        </div>
      </MotionConfig>
    </LazyMotion>
  );
};
