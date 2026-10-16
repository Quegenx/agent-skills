import { constVoid } from "effect/Function";
import { useEffect, useRef, useState } from "react";

// The model's tokens arrive in uneven bursts: several words at once, then a
// pause. Shown as they arrive, the answer moves in small jumps however soft
// each word's fade is. So the chat shows its answer through a buffer that
// releases characters at a steady, adaptive pace, the way ChatGPT and
// Claude pace theirs: the rate is what is waiting divided by a target lag
// (agentChatSmoothLagSeconds), so a burst flows out fast and eases off as
// the buffer drains, never slower than agentChatSmoothMinCharsPerSecond.
// Once the stream ends, what is left flows out within
// agentChatSmoothFinishSeconds instead of snapping in. An answer that is
// already finished when it mounts (history) shows at once, and under
// reduced motion the buffer is off.
const agentChatSmoothLagSeconds = 0.6;
const agentChatSmoothMinCharsPerSecond = 30;
const agentChatSmoothFinishSeconds = 0.4;

// A long frame (a background tab) releases at most this much time's worth.
const agentChatSmoothMaxFrameSeconds = 0.1;

// How long the last characters keep fading in after the reveal catches up,
// before the answer turns static (which would cut their fade off): the
// reveal's fixed length (agent-chat-markdown.css).
const agentChatSmoothSettleMs = 600;

// The end of the shown text, moved past the second half of a surrogate pair
// (a code point above U+FFFF starting at its last unit), so an emoji is never
// cut in half.
const agentChatSmoothTextEnd = (text: string, end: number) => {
  const inside = end > 0 && end < text.length;

  return inside && (text.codePointAt(end - 1) ?? 0) > 0xff_ff ? end + 1 : end;
};

/**
 * Reveals a streaming answer's text a little at a time, at an even pace, never
 * cutting an emoji in half; a finished answer shows at once.
 *
 * @param text - The answer's text so far.
 * @param streaming - Whether the answer is still streaming.
 * @returns The text to show now, and whether it is still revealing.
 */
export const useAgentChatSmoothText = (text: string, streaming: boolean) => {
  const [shownLength, setShownLength] = useState(() =>
    streaming ? 0 : text.length
  );

  // The text length whose reveal has fully settled (static from then on).
  const [settledLength, setSettledLength] = useState(() =>
    streaming ? -1 : text.length
  );

  const shownRef = useRef(shownLength);
  const carryRef = useRef(0);
  const target = text.length;

  useEffect(() => {
    // A text that got shorter (replaced) is revealed on from its new end.
    shownRef.current = Math.min(shownRef.current, target);

    if (shownRef.current >= target) {
      return constVoid;
    }

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const seconds = Math.min(
        (now - last) / 1000,
        agentChatSmoothMaxFrameSeconds
      );

      last = now;

      if (reduced) {
        shownRef.current = target;
        setShownLength(target);

        return;
      }

      const waiting = target - shownRef.current;

      const rate = Math.max(
        agentChatSmoothMinCharsPerSecond,
        waiting /
          (streaming ? agentChatSmoothLagSeconds : agentChatSmoothFinishSeconds)
      );

      carryRef.current += rate * seconds;
      const step = Math.floor(carryRef.current);

      if (step > 0) {
        carryRef.current -= step;
        shownRef.current = Math.min(target, shownRef.current + step);
        setShownLength(shownRef.current);
      }

      if (shownRef.current < target) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [target, streaming]);

  const end = agentChatSmoothTextEnd(text, Math.min(shownLength, target));
  const caughtUp = end >= target;
  useEffect(() => {
    if (streaming || !caughtUp || settledLength === target) {
      return constVoid;
    }

    const timer = setTimeout(() => {
      setSettledLength(target);
    }, agentChatSmoothSettleMs);

    return () => {
      clearTimeout(timer);
    };
  }, [streaming, caughtUp, settledLength, target]);

  return {
    text: text.slice(0, end),
    // Still revealing: the stream is open, the buffer has not caught up, or
    // the last characters are still fading in.
    revealing: streaming || !caughtUp || settledLength !== target,
  };
};
