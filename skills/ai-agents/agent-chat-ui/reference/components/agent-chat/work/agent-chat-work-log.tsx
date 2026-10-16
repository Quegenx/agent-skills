import { span as MotionSpan } from "motion/react-m";
import type { CSSProperties, ReactNode } from "react";

import {
  app_chat_reconnecting,
  app_chat_search_progress,
  app_chat_search_progress_sites,
  app_chat_sources,
  app_chat_thinking,
  app_chat_worked_actions,
  app_chat_worked_minute_seconds,
  app_chat_worked_minutes,
  app_chat_worked_minutes_seconds,
  app_chat_worked_one_minute,
  app_chat_worked_one_second,
  app_chat_worked_seconds,
} from "#/paraglide/messages";
import { AgentChatSourceChip } from "@/components/agent-chat/message/agent-chat-markdown";
import {
  agentChatFaviconUrl,
  agentChatToolIcon,
  agentChatToolServiceList,
} from "@/components/agent-chat/work/agent-chat-answer-work";
import type { AgentChatLiveActivity } from "@/components/agent-chat/work/agent-chat-answer-work";
import { AgentChatDisclosure } from "@/components/agent-chat/work/agent-chat-tool";
import { agentChatToolTitle } from "@/components/agent-chat/work/agent-chat-tool-text";
import {
  AppIcon,
  AppMorphIcon,
} from "@/components/ui/general/app-icon";
import { MorphText } from "@/components/ui/general/morph-text";
import type {
  AgentChatMessage,
  AgentChatToolPart,
} from "@/lib/agent-chat/conversation/agent-chat-messages";
import type { SiteSearchProgress } from "@/server/sites/site-search-pages.server";

import { isNonEmptyText } from "../../../../backend/shared/text/non-empty-text";

// One agent answer the ChatGPT way. While the agent works, one status line
// under the answer says what it does now: a pulse dot the moment the message
// is sent, then "חושב" or the running action, its icon morphing into the
// next (morphicons) and its label morphing too (MorphText), shimmering. Each
// finished action stays in the answer as a row, in order with its text and
// cards. Once the answer ends, those rows fold into one line, "עבד במשך 12
// שניות", that opens to them again, and the sites the answer links to sit
// under it ("מקורות"). The model's thinking itself is never shown: its
// summaries come in English, are often empty and quote its instructions.

const agentChatActivityIcon = (activity: AgentChatLiveActivity) => {
  if (activity.kind === "dot" || activity.kind === "reconnecting") {
    return "pulse-dot";
  }

  return activity.kind === "thinking"
    ? "agent-brain"
    : agentChatToolIcon(activity.part);
};

// A running site or Marketplace search's results so far, and with several
// sites how many finished.
const agentChatSearchProgressLabel = (progress: SiteSearchProgress) =>
  progress.sites > 1
    ? app_chat_search_progress_sites({
        found: progress.found,
        done: progress.sitesDone,
        sites: progress.sites,
      })
    : app_chat_search_progress({ found: progress.found });

const agentChatActivityLabel = (
  activity: AgentChatLiveActivity,
  progress: SiteSearchProgress | undefined
) => {
  if (activity.kind === "dot") {
    return "";
  }

  if (activity.kind === "reconnecting") {
    return app_chat_reconnecting({
      attempt: activity.attempt,
      of: activity.of,
    });
  }

  if (activity.kind === "thinking") {
    return app_chat_thinking();
  }

  const title = agentChatToolTitle(activity.part);

  return progress
    ? `${title} · ${agentChatSearchProgressLabel(progress)}`
    : title;
};

/**
 * The status line itself. It stays mounted while the answer runs, so its
 * icon and label morph from one activity to the next instead of swapping.
 * progress: the running search's, when it reports one (searchProgress).
 *
 * @returns The status line.
 */
export const AgentChatStatusLine = ({
  activity,
  progress,
}: {
  activity: AgentChatLiveActivity;
  progress: SiteSearchProgress | undefined;
}) => {
  const label = agentChatActivityLabel(activity, progress);

  // The ShimmerText band (shimmer-text.css), around a morphing label.
  const shimmerStyle: CSSProperties & { "--shimmer-spread": string } = {
    "--shimmer-spread": `${label.length * 2}px`,
  };

  return (
    <output className="agent-chat-tool-trigger">
      <span className="agent-chat-tool-summary">
        <AppMorphIcon icon={agentChatActivityIcon(activity)} />
        <span className="agent-chat-tool-label">
          <span className="shimmer-text" data-tone="muted" style={shimmerStyle}>
            <MorphText>{label}</MorphText>
          </span>
        </span>
      </span>
    </output>
  );
};

// The services a finished action worked through (Firecrawl, Gemini), as
// favicons after its title; named for screen readers.
const AgentChatToolServices = ({ part }: { part: AgentChatToolPart }) => {
  const services = agentChatToolServiceList(part);

  if (services.length > 0) {
    return (
      <span className="agent-chat-favicon-stack">
        {services.map((service) => (
          <img
            key={service.url}
            src={agentChatFaviconUrl(service.url)}
            alt={service.name}
            title={service.name}
            width={16}
            height={16}
          />
        ))}
      </span>
    );
  }

  return null;
};

// The app's spring (no bounce, 0.35s, as the post collection form's comment
// count): a row comes in from a light blur at 96% scale.
const agentChatWorkRowEnter = { filter: "blur(4px)", opacity: 0, scale: 0.96 };
const agentChatWorkRowRest = { filter: "blur(0px)", opacity: 1, scale: 1 };

const agentChatWorkRowSpring = {
  bounce: 0,
  duration: 0.35,
  type: "spring",
} as const;

/**
 * A finished action: its icon and title, in the muted color of the status
 * line it replaced.
 *
 * @returns The row.
 */
export const AgentChatWorkRow = ({ part }: { part: AgentChatToolPart }) => (
  <MotionSpan
    className="agent-chat-tool-trigger"
    initial={agentChatWorkRowEnter}
    animate={agentChatWorkRowRest}
    transition={agentChatWorkRowSpring}
  >
    <span className="agent-chat-tool-summary">
      <AppIcon icon={agentChatToolIcon(part)} />
      <span className="agent-chat-tool-label">{agentChatToolTitle(part)}</span>
      <AgentChatToolServices part={part} />
    </span>
  </MotionSpan>
);

// "עבד במשך 12 שניות" from when the answer started to when it ended; an
// answer saved before its end was kept counts its actions instead.
const agentChatWorkedForLabel = (
  message: AgentChatMessage,
  actions: number
) => {
  const { createdAt, finishedAt } = message.metadata ?? {};

  if (!(isNonEmptyText(createdAt) && isNonEmptyText(finishedAt))) {
    return app_chat_worked_actions({ count: actions });
  }

  const total = Math.max(
    1,
    Math.round((Date.parse(finishedAt) - Date.parse(createdAt)) / 1000)
  );

  const minutes = Math.floor(total / 60);
  const seconds = total % 60;

  if (minutes === 0) {
    return total === 1
      ? app_chat_worked_one_second()
      : app_chat_worked_seconds({ seconds });
  }

  if (minutes === 1) {
    return seconds === 0
      ? app_chat_worked_one_minute()
      : app_chat_worked_minute_seconds({ seconds });
  }

  return seconds === 0
    ? app_chat_worked_minutes({ minutes })
    : app_chat_worked_minutes_seconds({ minutes, seconds });
};

// One line (summary) with a chevron, opening to its children.
const AgentChatFoldedLine = ({
  summary,
  children,
}: {
  summary: ReactNode;
  children: ReactNode;
}) => (
  <AgentChatDisclosure
    className="agent-chat-tool"
    triggerClassName="agent-chat-tool-trigger"
    trigger={<span className="agent-chat-tool-summary">{summary}</span>}
  >
    {children}
  </AgentChatDisclosure>
);

/**
 * A finished answer's actions, folded into one line that opens to them.
 *
 * @returns The folded line.
 */
export const AgentChatWorkedFor = ({
  message,
  parts,
}: {
  message: AgentChatMessage;
  parts: AgentChatToolPart[];
}) => (
  <AgentChatFoldedLine
    summary={
      <span className="agent-chat-tool-label">
        {agentChatWorkedForLabel(message, parts.length)}
      </span>
    }
  >
    <div className="agent-chat-work-log">
      {parts.map((part) => (
        <span key={part.toolCallId} className="agent-chat-tool-trigger">
          <span className="agent-chat-tool-summary">
            <AppIcon icon={agentChatToolIcon(part)} />
            <span className="agent-chat-tool-label">
              {agentChatToolTitle(part)}
            </span>
            <AgentChatToolServices part={part} />
          </span>
        </span>
      ))}
    </div>
  </AgentChatFoldedLine>
);

/**
 * "מקורות" with the first three sites' favicons, opening to every source
 * chip (each previews its page on hover and opens after the confirm).
 *
 * @returns The folded sources line.
 */
export const AgentChatSources = ({ urls }: { urls: string[] }) => (
  <AgentChatFoldedLine
    summary={
      <>
        <span className="agent-chat-favicon-stack">
          {urls.slice(0, 3).map((url) => (
            <img
              key={url}
              src={agentChatFaviconUrl(url)}
              alt=""
              width={16}
              height={16}
            />
          ))}
        </span>
        <span className="agent-chat-tool-label">{app_chat_sources()}</span>
      </>
    }
  >
    <div className="agent-chat-sources">
      {urls.map((url) => (
        <AgentChatSourceChip key={url} url={url} />
      ))}
    </div>
  </AgentChatFoldedLine>
);
