import { constVoid } from "effect/Function";
import { AnimatePresence, m, stagger } from "motion/react";
import type { Variants } from "motion/react";
import { useEffect, useRef, useState } from "react";

import {
  app_chat_ph_1,
  app_chat_ph_2,
  app_chat_ph_3,
  app_chat_ph_4,
  app_chat_ph_5,
  app_chat_ph_6,
  app_chat_ph_personal_2,
  app_chat_ph_personal_3,
  app_chat_ph_personal_4,
} from "#/paraglide/messages";
import { splitTextGraphemes } from "@/lib/split-text-graphemes";

// Example requests the empty composer cycles through, one letter at a time:
// a business's (customers, competitors), or a person's on the personal plan
// (userPlanServesBusiness).
const agentChatPlaceholderPrompts = (business: boolean) =>
  business
    ? [
        app_chat_ph_1(),
        app_chat_ph_2(),
        app_chat_ph_3(),
        app_chat_ph_4(),
        app_chat_ph_5(),
        app_chat_ph_6(),
      ]
    : [
        app_chat_ph_1(),
        app_chat_ph_personal_2(),
        app_chat_ph_personal_3(),
        app_chat_ph_personal_4(),
        app_chat_ph_6(),
      ];

// The placeholder, motion-primitives' TextEffect per letter with the
// "fade" preset: letters fade in 30ms apart over 0.3s, the line holds for 2s,
// then fades out last letter first at 2.5x speed before the next line.
const agentChatPlaceholderLine: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { delayChildren: stagger(0.03) },
  },
  exit: { transition: { delayChildren: stagger(0.012, { from: "last" }) } },
};

const agentChatPlaceholderLetter: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

const agentChatPlaceholderHoldMs = 2000;

/**
 * Shown over the empty text box only; typing hides it, and clearing the box
 * starts the current line again.
 *
 * @returns The placeholder, or nothing while hidden.
 */
export const AgentChatPlaceholder = ({
  hidden,
  business,
}: {
  hidden: boolean;
  business: boolean;
}) => {
  const [index, setIndex] = useState(0);
  const [showing, setShowing] = useState(true);
  const phaseRef = useRef<"enter" | "hold" | "exit">("enter");
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hidden) {
      return constVoid;
    }

    if (holdRef.current) {
      clearTimeout(holdRef.current);
    }

    return () => {
      phaseRef.current = "enter";
      setShowing(true);
    };
  }, [hidden]);
  useEffect(
    () => () => {
      if (holdRef.current) {
        clearTimeout(holdRef.current);
      }
    },
    []
  );

  if (hidden) {
    return null;
  }

  const text = agentChatPlaceholderPrompts(business)[index] ?? "";

  return (
    <div className="agent-chat-placeholder" aria-hidden="true">
      <AnimatePresence
        mode="wait"
        onExitComplete={() => {
          setIndex(
            (current) =>
              (current + 1) % agentChatPlaceholderPrompts(business).length
          );
          phaseRef.current = "enter";
          setShowing(true);
        }}
      >
        {showing && (
          <m.span
            key={index}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={agentChatPlaceholderLine}
            onAnimationComplete={() => {
              if (phaseRef.current !== "enter") {
                return;
              }

              phaseRef.current = "hold";
              holdRef.current = setTimeout(() => {
                phaseRef.current = "exit";
                setShowing(false);
              }, agentChatPlaceholderHoldMs);
            }}
          >
            {text.split(/(?<space>\s+)/u).map((segment, segmentIndex) => (
              <span
                // A line never reorders; position is each segment's identity.
                key={`${segmentIndex}-${segment}`}
                className="agent-chat-placeholder-segment"
              >
                {splitTextGraphemes(segment).map((letter, letterIndex) => (
                  <m.span
                    key={`${letterIndex}-${letter}`}
                    variants={agentChatPlaceholderLetter}
                    className="agent-chat-placeholder-segment"
                  >
                    {letter}
                  </m.span>
                ))}
              </span>
            ))}
          </m.span>
        )}
      </AnimatePresence>
    </div>
  );
};
