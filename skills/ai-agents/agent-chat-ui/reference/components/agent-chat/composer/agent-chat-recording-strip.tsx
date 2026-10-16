import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ComponentProps } from "react";

import {
  app_chat_finishing,
  app_chat_stop_dictation,
  app_chat_stop_review,
} from "#/paraglide/messages";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/display/tooltip";

// Muse's HatchDictationRecordingStrip: the elapsed time and a waveform of
// the microphone level that scrolls toward the start. Bars are 4px wide
// every 8px, cross the strip in 5s and fade over the last 28px at each
// edge. The level is sampled every 50ms and smoothed. The waveform starts
// with the recording, flat until the microphone stream opens, and the timer
// runs on through that; with reduced motion only the timer shows. While
// Soniox finishes the transcript, the strip says so. Its name is in a
// tooltip (stop and review), as the composer's buttons.
const barWidth = 4;
const barStep = 8;
const scrollMs = 5000;
const fadeEdgePx = 28;
const sampleIntervalMs = 50;
const smoothingAlpha = 0.35;
const levelCurveExponent = 0.55;
const maxDeltaFraction = 0.5;
const noiseFloor = 0.03;
const inputGain = 3.2;

const formatAgentChatElapsed = (ms: number) => {
  const seconds = Math.floor(ms / 1000);

  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

const subscribeReducedMotion = (onChange: () => void) => {
  const query = matchMedia(reducedMotionQuery);
  query.addEventListener("change", onChange);

  return () => {
    query.removeEventListener("change", onChange);
  };
};

// The strip itself is one button (stop and review), owned here so its
// tooltip can render it as its trigger.
const AgentChatRecordingStripButton = (props: ComponentProps<"button">) => (
  <button type="button" className="agent-chat-recording-strip" {...props} />
);

/**
 * The composer's strip while the microphone records: the live waveform
 * (none under reduced motion), the time recorded, and a stop button. While
 * the recording is transcribed (finishing) only the disabled stop button
 * stays.
 *
 * @param props - stream: the microphone's stream, null until it opens;
 *   finishing: whether the recording is being transcribed; onStop: stops
 *   recording.
 * @returns The strip.
 */
export const AgentChatRecordingStrip = ({
  stream,
  finishing,
  onStop,
}: {
  stream: MediaStream | null;
  finishing: boolean;
  onStop: () => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // When the recording began, kept when the microphone stream opens later.
  const startedAtRef = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState("0:00");

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => matchMedia(reducedMotionQuery).matches,
    () => false
  );

  const showWaveform = !reducedMotion && !finishing;

  useEffect(() => {
    const startedAt = startedAtRef.current ?? performance.now();
    startedAtRef.current = startedAt;
    const canvas = canvasRef.current;
    const context = showWaveform ? canvas?.getContext("2d") : null;
    let audio: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let samples: Uint8Array<ArrayBuffer> | null = null;

    if (context && stream) {
      audio = new AudioContext();
      void audio.resume();
      analyser = audio.createAnalyser();
      analyser.fftSize = 1024;
      source = audio.createMediaStreamSource(stream);
      source.connect(analyser);
      samples = new Uint8Array(analyser.fftSize);
    }

    const bars: { height: number; spawnedAt: number }[] = [];
    let level = 0;
    let lastHeight = 0;
    let lastSample = startedAt;
    let lastSpawn = startedAt;
    let label = "";
    let frame = 0;

    const sample = (now: number) => {
      if (now - lastSample < sampleIntervalMs || !analyser || !samples) {
        return;
      }

      lastSample = now;
      analyser.getByteTimeDomainData(samples);
      let sum = 0;

      for (const value of samples) {
        const centered = (value - 128) / 128;
        sum += centered * centered;
      }

      const rms = Math.min(1, Math.sqrt(sum / samples.length) * inputGain);
      level += smoothingAlpha * (rms - level);
    };

    const draw = (now: number) => {
      if (!context || !canvas) {
        return;
      }

      const ratio = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (width === 0 || height === 0) {
        return;
      }

      const pixelWidth = Math.round(width * ratio);
      const pixelHeight = Math.round(height * ratio);

      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }

      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.fillStyle = getComputedStyle(canvas).color;
      sample(now);
      const spawnEvery = (scrollMs * barStep) / width;

      while (now - lastSpawn >= spawnEvery) {
        lastSpawn += spawnEvery;

        const target =
          Math.max(0, level - noiseFloor) ** levelCurveExponent * height;

        const maxDelta = maxDeltaFraction * height;

        const next = Math.max(
          lastHeight - maxDelta,
          Math.min(lastHeight + maxDelta, target)
        );

        const barHeight = Math.max(barWidth, next);
        bars.push({ height: barHeight, spawnedAt: lastSpawn });
        lastHeight = barHeight;
      }

      const speed = width / scrollMs;

      for (let index = bars.length - 1; index >= 0; index -= 1) {
        const bar = bars[index];
        const x = width - (now - bar.spawnedAt) * speed;

        if (x < -barWidth) {
          bars.splice(0, index + 1);
          break;
        }

        const fadeIn =
          x > width - fadeEdgePx ? Math.max(0, (width - x) / fadeEdgePx) : 1;

        const fadeOut = x < fadeEdgePx ? Math.max(0, x / fadeEdgePx) : 1;
        context.globalAlpha = Math.min(fadeIn, fadeOut);
        context.beginPath();
        context.roundRect(
          x,
          (height - bar.height) / 2,
          barWidth,
          bar.height,
          barWidth / 2
        );
        context.fill();
      }

      context.globalAlpha = 1;
    };

    const tick = () => {
      const now = performance.now();
      const next = formatAgentChatElapsed(now - startedAt);

      if (next !== label) {
        label = next;
        setElapsed(next);
      }

      draw(now);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      source?.disconnect();
      analyser?.disconnect();
      void audio?.close();
    };
  }, [stream, showWaveform]);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <AgentChatRecordingStripButton
            aria-label={app_chat_stop_dictation()}
            disabled={finishing}
            onClick={onStop}
          />
        }
      >
        {!finishing && <span aria-hidden="true">{elapsed}</span>}
        {showWaveform && <canvas ref={canvasRef} aria-hidden="true" />}
        {finishing && <span>{app_chat_finishing()}</span>}
      </TooltipTrigger>
      <TooltipContent>{app_chat_stop_review()}</TooltipContent>
    </Tooltip>
  );
};
