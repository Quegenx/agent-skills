import { constVoid } from "effect/Function";
import { useReducedMotion } from "motion/react";
import type { RefObject } from "react";
import { useEffect, useEffectEvent, useRef } from "react";

import { cn } from "../../styles/site-class-merge";
import {
  calculateVanishingCanvasDimensions,
  calculateVanishingTextLineCenter,
  getVanishingCanvasLetterSpacing,
  vanishingCanvasLeftOffset,
  vanishingCanvasScale,
  wrapVanishingInputText,
} from "./vanishing-input-canvas";
import { vanishingInputOverlayStyles as styles } from "./vanishing-input-overlay.styles";
import type { VanishingInputParticle } from "./vanishing-input-particles";
import {
  advanceVanishingInputParticles,
  createVanishingInputParticles,
} from "./vanishing-input-particles";

const canvasSize = 800;
const wipeStep = 8;

interface VanishingInputOverlayProps {
  active: boolean;
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  onComplete: () => void;
  value: string;
}

const drawVanishingParticles = (
  context: CanvasRenderingContext2D,
  particles: VanishingInputParticle[],
  threshold: number,
  width: number,
  height: number
) => {
  context.clearRect(threshold, 0, width, height);

  for (const particle of particles) {
    if (particle.x <= threshold) {
      continue;
    }

    context.fillStyle = particle.color;
    context.fillRect(particle.x, particle.y, particle.radius, particle.radius);
  }
};

const prepareVanishingCanvas = (
  canvas: HTMLCanvasElement,
  input: HTMLInputElement | HTMLTextAreaElement,
  value: string
) => {
  const context = canvas.getContext("2d");

  if (context === null) {
    return null;
  }

  const dimensions = calculateVanishingCanvasDimensions(
    input.clientWidth,
    input.clientHeight
  );

  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  context.clearRect(0, 0, dimensions.width, dimensions.height);

  const inputStyle = getComputedStyle(input);
  const fontSize = Number(inputStyle.fontSize.replace("px", "")) || 16;
  const inputLineHeight = Number(inputStyle.lineHeight.replace("px", ""));
  const lineHeight = inputLineHeight || fontSize * 1.5;
  const paddingTop = Number(inputStyle.paddingTop.replace("px", "")) || 0;
  const isRtl = inputStyle.direction === "rtl";
  const paddingLeft = Number(inputStyle.paddingLeft.replace("px", "")) || 0;
  const paddingRight = Number(inputStyle.paddingRight.replace("px", "")) || 0;

  const textX = isRtl
    ? (input.clientWidth - paddingRight - vanishingCanvasLeftOffset) /
      vanishingCanvasScale
    : 0;

  context.font = `${inputStyle.fontStyle} ${inputStyle.fontWeight} ${fontSize / vanishingCanvasScale}px ${inputStyle.fontFamily}`;
  context.fillStyle = inputStyle.color;
  context.letterSpacing = getVanishingCanvasLetterSpacing(
    inputStyle.letterSpacing
  );
  context.direction = isRtl ? "rtl" : "ltr";
  context.textAlign = isRtl ? "right" : "left";
  context.textBaseline = "middle";

  const maxTextWidth =
    (input.clientWidth - paddingLeft - paddingRight) / vanishingCanvasScale;

  const lines =
    input instanceof HTMLTextAreaElement
      ? wrapVanishingInputText(
          (text) => context.measureText(text).width,
          value,
          maxTextWidth
        )
      : [value];

  for (const [index, line] of lines.entries()) {
    context.fillText(
      line,
      textX,
      calculateVanishingTextLineCenter({
        lineHeight,
        lineIndex: index,
        paddingTop,
      })
    );
  }

  return { context, dimensions };
};

/**
 * The canvas over a field that turns its text into particles and sweeps them
 * away, then reports it is done.
 *
 * @param props - active: whether to vanish now; inputRef: the field; value: its
 *   text; onComplete: told once the text is gone.
 * @returns The canvas.
 */
export const VanishingInputOverlay = ({
  active,
  inputRef,
  onComplete,
  value,
}: VanishingInputOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<VanishingInputParticle[]>([]);
  const frameRef = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const completeVanish = useEffectEvent(onComplete);

  useEffect(() => {
    const canvas = canvasRef.current;
    const input = inputRef.current;

    if (!(active && canvas && input && value)) {
      return constVoid;
    }

    if (prefersReducedMotion === true) {
      completeVanish();

      return constVoid;
    }

    const preparedCanvas = prepareVanishingCanvas(canvas, input, value);

    if (preparedCanvas === null) {
      completeVanish();

      return constVoid;
    }

    const { context, dimensions } = preparedCanvas;

    particlesRef.current = createVanishingInputParticles(
      context.getImageData(0, 0, dimensions.width, dimensions.height).data,
      dimensions.width,
      dimensions.height
    );
    let threshold = 0;

    for (const particle of particlesRef.current) {
      threshold = Math.max(threshold, particle.x);
    }

    let cancelled = false;

    const animateParticles = () => {
      if (cancelled) {
        return;
      }

      particlesRef.current = advanceVanishingInputParticles(
        particlesRef.current,
        threshold
      );
      drawVanishingParticles(
        context,
        particlesRef.current,
        threshold,
        dimensions.width,
        dimensions.height
      );

      if (particlesRef.current.length > 0) {
        threshold -= wipeStep;
        frameRef.current = requestAnimationFrame(animateParticles);

        return;
      }

      frameRef.current = null;
      completeVanish();
    };

    frameRef.current = requestAnimationFrame(animateParticles);

    return () => {
      cancelled = true;

      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [active, inputRef, prefersReducedMotion, value]);

  return (
    <canvas
      aria-hidden="true"
      height={canvasSize}
      ref={canvasRef}
      tabIndex={-1}
      width={canvasSize}
      className={cn(styles.canvas, active && styles.visible)}
    />
  );
};
