import { m } from "motion/react";
import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";

import {
  app_chat_good_afternoon,
  app_chat_good_evening,
  app_chat_good_morning,
  app_chat_good_night,
  app_chat_how_help,
  app_chat_s1_label,
  app_chat_s1_personal_label,
  app_chat_s1_personal_prompt,
  app_chat_s1_prompt,
  app_chat_s2_label,
  app_chat_s2_personal_prompt,
  app_chat_s2_prompt,
  app_chat_s3_label,
  app_chat_s3_personal_prompt,
  app_chat_s3_prompt,
  app_chat_s4_label,
  app_chat_s4_personal_label,
  app_chat_s4_personal_prompt,
  app_chat_s4_prompt,
  app_chat_s5_label,
  app_chat_s5_prompt,
} from "#/paraglide/messages";
import { AppIcon } from "@/components/ui/general/app-icon";

import { isNonEmptyText } from "../../../../backend/shared/text/non-empty-text";

// The greeting by hour: 5-12 morning, 12-17 afternoon, 17-22 evening,
// otherwise night.
const agentChatGreeting = (hour: number) => {
  if (hour >= 5 && hour < 12) {
    return app_chat_good_morning();
  }

  if (hour >= 12 && hour < 17) {
    return app_chat_good_afternoon();
  }

  if (hour >= 17 && hour < 22) {
    return app_chat_good_evening();
  }

  return app_chat_good_night();
};

// The greeting follows the clock; the server, which does not know the
// reader's time, renders none.
const subscribeAgentChatClock = (onChange: () => void) => {
  const timer = setInterval(onChange, 60_000);

  return () => {
    clearInterval(timer);
  };
};

const useAgentChatGreeting = () =>
  useSyncExternalStore(
    subscribeAgentChatClock,
    () => agentChatGreeting(new Date().getHours()),
    () => null
  );

// The suggestion chips under the composer; each fills the composer with a
// fuller request: a business's (leads, competitors), or a person's on the
// personal plan (userPlanServesBusiness).
const agentChatSuggestions = (business: boolean) => [
  business
    ? {
        icon: "opportunities" as const,
        label: app_chat_s1_label(),
        prompt: app_chat_s1_prompt(),
      }
    : {
        icon: "opportunities" as const,
        label: app_chat_s1_personal_label(),
        prompt: app_chat_s1_personal_prompt(),
      },
  {
    icon: "agent-users" as const,
    label: app_chat_s2_label(),
    prompt: business ? app_chat_s2_prompt() : app_chat_s2_personal_prompt(),
  },
  {
    icon: "agent-search" as const,
    label: app_chat_s3_label(),
    prompt: business ? app_chat_s3_prompt() : app_chat_s3_personal_prompt(),
  },
  business
    ? {
        icon: "agent-target" as const,
        label: app_chat_s4_label(),
        prompt: app_chat_s4_prompt(),
      }
    : {
        icon: "agent-speech-bubble" as const,
        label: app_chat_s4_personal_label(),
        prompt: app_chat_s4_personal_prompt(),
      },
  {
    icon: "agent-chart" as const,
    label: app_chat_s5_label(),
    prompt: app_chat_s5_prompt(),
  },
];

// Chips rise 3px into place from a 4px blur, 0.1s apart (motion's default
// transition otherwise).
const AgentChatSuggestions = ({
  business,
  onPick,
}: {
  business: boolean;
  onPick: (prompt: string) => void;
}) => (
  <div className="agent-chat-suggestions">
    <div className="agent-chat-suggestions-row">
      {agentChatSuggestions(business).map((suggestion, index) => (
        <m.div
          key={suggestion.label}
          initial={{ opacity: 0, y: 3, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.1 * index }}
        >
          <button
            type="button"
            className="agent-chat-button agent-chat-suggestion"
            data-variant="outline"
            onClick={() => {
              onPick(suggestion.prompt);
            }}
          >
            <AppIcon icon={suggestion.icon} />
            <span>{suggestion.label}</span>
          </button>
        </m.div>
      ))}
    </div>
  </div>
);

/**
 * The new-chat screen: the greeting settles at the bottom of the upper
 * half, and the composer sits under it with the suggestions; from tablet
 * width up the suggestions move below the composer.
 *
 * @returns The new-chat screen.
 */
export const AgentChatEmptyState = ({
  userName,
  business,
  composer,
  onPickSuggestion,
}: {
  userName: string | null;
  business: boolean;
  composer: ReactNode;
  onPickSuggestion: (prompt: string) => void;
}) => {
  const greeting = useAgentChatGreeting();
  const firstName = userName?.split(" ")[0];

  return (
    <div className="agent-chat-empty">
      <div className="agent-chat-empty-headline">
        <h1>
          <span>
            <img
              src="/brand/app-logo.webp"
              alt=""
              width={36}
              height={36}
              className="agent-chat-empty-logo"
            />
            {greeting}
            {greeting && isNonEmptyText(firstName) && `, ${firstName}`}
          </span>
          <span className="agent-chat-empty-question">
            {app_chat_how_help()}
          </span>
        </h1>
      </div>
      <div className="agent-chat-empty-body">
        <AgentChatSuggestions business={business} onPick={onPickSuggestion} />
        <div className="agent-chat-empty-composer">{composer}</div>
      </div>
    </div>
  );
};
