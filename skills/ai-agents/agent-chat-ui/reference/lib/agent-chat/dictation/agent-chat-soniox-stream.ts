import { Deferred, Effect, Schema } from "effect";

import { app_dictation_failed, app_mic_network } from "#/paraglide/messages";
import { getLocale } from "#/paraglide/runtime";

import { isNonEmptyText } from "../../../../backend/shared/text/non-empty-text";

// One dictation streamed to Soniox's real-time WebSocket
// (agent-chat-dictation.ts): the microphone's audio as 16-bit PCM in, the
// final transcript out.

const sonioxDictationUrl = "wss://stt-rt.soniox.com/transcribe-websocket";
const sonioxDictationModel = "stt-rt-v5";
const agentChatDictationFinishTimeout = "10 seconds";

// Converts the microphone's float samples to 16-bit PCM, 4096 samples
// (about 85ms) per message, so the socket sends a few frames a second
// rather than one per 128-sample render quantum.
const agentChatPcmWorklet = `registerProcessor("agent-chat-pcm", class extends AudioWorkletProcessor {
  buffer = new Int16Array(4096);
  length = 0;
  process([input]) {
    const channel = input[0];
    if (!channel) return true;
    for (const sample of channel) {
      const clamped = Math.max(-1, Math.min(1, sample));
      this.buffer[this.length++] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
      if (this.length === this.buffer.length) {
        this.port.postMessage(this.buffer.buffer, [this.buffer.buffer]);
        this.buffer = new Int16Array(4096);
        this.length = 0;
      }
    }
    return true;
  }
});`;

// One message of Soniox's real-time stream, as far as dictation reads it.
const decodeSonioxDictationResponse = Schema.decodeUnknownSync(
  Schema.fromJsonString(
    Schema.Struct({
      tokens: Schema.optional(
        Schema.Array(
          Schema.Struct({ text: Schema.String, is_final: Schema.Boolean })
        )
      ),
      finished: Schema.optional(Schema.Boolean),
      error_message: Schema.optional(Schema.String),
    })
  )
);

// Soniox's control markers, not speech.
const sonioxControlTokens = new Set(["<end>", "<fin>"]);

// Sends the microphone's audio to the worklet that turns it into PCM.
const openAgentChatPcm = Effect.fnUntraced(function* openAgentChatPcm(
  stream: MediaStream
) {
  const audio = new AudioContext();

  const worklet = URL.createObjectURL(
    new Blob([agentChatPcmWorklet], { type: "text/javascript" })
  );

  yield* Effect.tryPromise(async () => {
    await audio.audioWorklet.addModule(worklet);
  }).pipe(
    Effect.ensuring(
      Effect.sync(() => {
        URL.revokeObjectURL(worklet);
      })
    ),
    Effect.tapError(() =>
      Effect.promise(async () => {
        await audio.close();
      })
    )
  );
  const source = audio.createMediaStreamSource(stream);
  const pcm = new AudioWorkletNode(audio, "agent-chat-pcm");
  source.connect(pcm);

  return {
    sampleRate: audio.sampleRate,
    port: pcm.port,
    close: () => {
      source.disconnect();
      pcm.disconnect();
      pcm.port.close();
      void audio.close();
    },
  };
});

/**
 * One dictation streamed to Soniox. fail reports an error while listening;
 * once finishing starts, errors only end the wait for the transcript.
 */
export const streamAgentChatDictation = Effect.fnUntraced(
  function* streamAgentChatDictation(
    stream: MediaStream,
    apiKey: string,
    fail: (message: string) => void
  ) {
    const pcm = yield* openAgentChatPcm(stream);
    const socket = new WebSocket(sonioxDictationUrl);
    const opened = Deferred.makeUnsafe<null>();
    const closed = Deferred.makeUnsafe<null>();
    const heard = { final: "", pending: "" };
    // Audio recorded before the socket opens, sent right after the config.
    const queued: ArrayBuffer[] = [];
    let finishing = false;

    socket.addEventListener("open", () => {
      const app = getLocale() === "en" ? "en" : "he";
      socket.send(
        JSON.stringify({
          api_key: apiKey,
          model: sonioxDictationModel,
          audio_format: "pcm_s16le",
          sample_rate: pcm.sampleRate,
          num_channels: 1,
          language_hints: [app, app === "he" ? "en" : "he"],
          enable_language_identification: true,
        })
      );

      for (const chunk of queued.splice(0)) {
        socket.send(chunk);
      }

      Deferred.doneUnsafe(opened, Effect.succeed(null));
    });
    socket.addEventListener("close", () => {
      Deferred.doneUnsafe(closed, Effect.succeed(null));
    });
    socket.addEventListener("error", () => {
      if (!finishing) {
        fail(app_mic_network());
      }
    });
    socket.addEventListener("message", (event: MessageEvent<string>) => {
      const response = decodeSonioxDictationResponse(event.data);

      if (isNonEmptyText(response.error_message)) {
        if (!finishing) {
          fail(app_dictation_failed());
        }

        return;
      }

      let pending = "";

      for (const token of response.tokens ?? []) {
        if (sonioxControlTokens.has(token.text)) {
          continue;
        }

        if (token.is_final) {
          heard.final += token.text;
        } else {
          pending += token.text;
        }
      }

      heard.pending = pending;

      if (response.finished === true) {
        socket.close();
      }
    });
    pcm.port.addEventListener("message", (event: MessageEvent<ArrayBuffer>) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(event.data);
      } else {
        queued.push(event.data);
      }
    });
    pcm.port.start();

    return {
      // Ends the audio and returns the transcript once Soniox finishes it.
      finish: Effect.gen(function* finishAgentChatDictation() {
        finishing = true;
        pcm.close();
        yield* Effect.raceFirst(Deferred.await(opened), Deferred.await(closed));

        if (socket.readyState === WebSocket.OPEN) {
          // An empty frame ends the stream; Soniox answers finished and
          // closes the socket.
          socket.send("");
          yield* Deferred.await(closed);
        }
      }).pipe(
        Effect.timeoutOption(agentChatDictationFinishTimeout),
        Effect.ensuring(
          Effect.sync(() => {
            socket.close();
          })
        ),
        Effect.map(() => `${heard.final}${heard.pending}`.trim())
      ),
      cancel: () => {
        finishing = true;
        pcm.close();
        socket.close();
      },
    };
  }
);

/**
 * One dictation's live session with Soniox, as streamAgentChatDictation opens
 * it.
 */
export type AgentChatDictationSession = Effect.Success<
  ReturnType<typeof streamAgentChatDictation>
>;
