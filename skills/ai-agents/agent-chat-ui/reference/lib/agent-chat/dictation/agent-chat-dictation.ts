import { RegistryContext } from "@effect/atom-react";
import { Effect } from "effect";
import { useContext, useEffect, useRef, useState } from "react";

import {
  app_dictation_failed,
  app_dictation_unsupported,
  app_mic_denied,
  app_mic_missing,
  app_mic_network,
} from "#/paraglide/messages";
import { createAgentChatDictationKey } from "@/lib/agent-chat/dictation/agent-chat-dictation-key";
import { runClientEffect } from "@/lib/atoms/app-atom-runtime";
import { callServerFunction } from "@/lib/atoms/server-function-call";

import { streamAgentChatDictation } from "./agent-chat-soniox-stream";
import type { AgentChatDictationSession } from "./agent-chat-soniox-stream";

// Dictation for the agent chat composer, transcribed by Soniox as the user
// speaks, the way Kotev dictates: the microphone streams 16-bit PCM over
// Soniox's real-time WebSocket (model stt-rt-v5, the app's language hinted
// first, language identification on). Stopping ends the audio, waits for
// Soniox to finalize what it heard (up to 10 seconds, keeping what was
// final by then), and returns the text for the text box. The server hands
// out a single-use key per dictation (createSonioxDictationKey), so the
// Soniox API key never reaches the browser. The microphone stream also
// draws the recording waveform.

// The microphone's refusal, by DOMException name.
const agentChatMicrophoneError = (cause: unknown) => {
  const name = cause instanceof DOMException ? cause.name : "";

  if (name === "NotAllowedError" || name === "SecurityError") {
    return app_mic_denied();
  }

  return name === "NotFoundError" ? app_mic_missing() : app_dictation_failed();
};

const stopAgentChatMicrophone = (stream: MediaStream | null) => {
  for (const track of stream?.getTracks() ?? []) {
    track.stop();
  }
};

// Opens the microphone, then the Soniox session. current says whether this
// start still stands (it was not stopped or cancelled meanwhile); one that
// no longer does releases what it opened and ends with null.
const startAgentChatDictation = Effect.fnUntraced(
  function* startAgentChatDictation(
    userId: string,
    current: () => boolean,
    onMicrophone: (stream: MediaStream) => void,
    fail: (message: string) => void
  ) {
    const microphone = yield* Effect.tryPromise({
      try: async () =>
        await navigator.mediaDevices.getUserMedia({ audio: true }),
      catch: agentChatMicrophoneError,
    });

    if (!current()) {
      stopAgentChatMicrophone(microphone);

      return null;
    }

    onMicrophone(microphone);

    const apiKey = yield* callServerFunction(
      async () => await createAgentChatDictationKey({ data: { userId } })
    ).pipe(Effect.mapError(() => app_mic_network()));

    const session = yield* streamAgentChatDictation(
      microphone,
      apiKey,
      fail
    ).pipe(Effect.mapError(() => app_dictation_failed()));

    if (!current()) {
      session.cancel();

      return null;
    }

    return session;
  }
);

type AgentChatDictationPhase = "idle" | "starting" | "listening" | "finishing";

/**
 * Dictation in the composer: the microphone streamed to Soniox while the person
 * speaks, with stop to transcribe and cancel to drop it.
 *
 * @param userId - The signed-in user, for whom the server makes a temporary
 *   Soniox key.
 * @returns Whether it listens, its phase, the microphone's stream and the
 *   error, and start, stop and cancel.
 */
export const useAgentChatDictation = (userId: string) => {
  const registry = useContext(RegistryContext);
  const [phase, setPhase] = useState<AgentChatDictationPhase>("idle");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<AgentChatDictationSession | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Each start's number; stopping or cancelling moves it on, so a start
  // still waiting on the microphone or the key releases what it opened.
  const attemptRef = useRef(0);

  const release = () => {
    attemptRef.current += 1;
    stopAgentChatMicrophone(streamRef.current);
    streamRef.current = null;
    setStream(null);
  };

  const cancel = () => {
    sessionRef.current?.cancel();
    sessionRef.current = null;
    release();
    setPhase("idle");
  };

  // Leaving the page ends the dictation.
  useEffect(
    () => () => {
      attemptRef.current += 1;
      sessionRef.current?.cancel();
      stopAgentChatMicrophone(streamRef.current);
    },
    []
  );

  const start = () => {
    if (
      // Insecure origins have no mediaDevices (a secure-context API), whatever
      // the DOM types say.
      !("mediaDevices" in navigator) ||
      typeof AudioWorkletNode === "undefined"
    ) {
      setError(app_dictation_unsupported());

      return;
    }

    attemptRef.current += 1;
    const attempt = attemptRef.current;
    const current = () => attemptRef.current === attempt;

    const fail = (message: string) => {
      if (current()) {
        cancel();
        setError(message);
      }
    };

    setError(null);
    setPhase("starting");
    void runClientEffect(
      registry,
      startAgentChatDictation(
        userId,
        current,
        (microphone) => {
          streamRef.current = microphone;
          setStream(microphone);
        },
        fail
      ).pipe(
        Effect.match({
          onFailure: fail,
          onSuccess: (session) => {
            if (session) {
              sessionRef.current = session;
              setPhase("listening");
            }
          },
        })
      )
    );
  };

  // Ends dictation with what Soniox heard, for the text box; empty when it
  // is cancelled while Soniox finishes.
  const stop = () => {
    const session = sessionRef.current;

    if (!session) {
      cancel();

      return Effect.succeed("");
    }

    setPhase("finishing");
    release();
    const attempt = attemptRef.current;

    return session.finish.pipe(
      Effect.map((heard) => {
        if (attemptRef.current !== attempt) {
          return "";
        }

        sessionRef.current = null;
        setPhase("idle");

        return heard;
      })
    );
  };

  return {
    // Whether the composer shows the recording strip.
    listening: phase !== "idle",
    phase,
    stream,
    error,
    start,
    stop,
    // Ends dictation and throws away what was heard.
    cancel,
  };
};
