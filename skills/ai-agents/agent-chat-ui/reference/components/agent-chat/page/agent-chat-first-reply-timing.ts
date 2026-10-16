import { isToolUIPart } from "ai";
import type { AtomRegistry } from "effect/reactivity";
import { useEffect, useRef } from "react";

import type { AgentChatMessage } from "@/lib/agent-chat/conversation/agent-chat-messages";
import { reportJourneyTiming } from "@/lib/perf/journey-timing-report";

/**
 * chat-first-reply: from sending until the agent's first words or tool.
 * markSent starts the clock when a message is sent.
 *
 * @param messages - The conversation's messages, watched for the first reply.
 * @param registry - The atom registry the timing is recorded through.
 * @returns markSent, which starts the clock.
 */
export const useChatFirstReplyTiming = (
  messages: AgentChatMessage[],
  registry: AtomRegistry.AtomRegistry
) => {
  const sentAt = useRef<number | null>(null);
  useEffect(() => {
    const last = messages.at(-1);

    if (
      sentAt.current === null ||
      last?.role !== "assistant" ||
      !last.parts.some(
        (part) =>
          (part.type === "text" && part.text.length > 0) || isToolUIPart(part)
      )
    ) {
      return;
    }

    void reportJourneyTiming(registry, {
      journey: "chat-first-reply",
      ms: Math.round(performance.now() - sentAt.current),
    });
    sentAt.current = null;
  }, [messages, registry]);

  return {
    markSent: () => {
      sentAt.current = performance.now();
    },
  };
};
