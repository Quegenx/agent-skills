import { useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";

// tor-app's favorite flight (favorite_flight.dart, favorite_pop_bounce.dart),
// for a dialog that shows one thing enlarged out of where it sits (the
// sidebar's avatar): the popup flies from its source along a cubic curve
// that arcs up through the middle (control points 90px back and 100px up,
// 70px past and 80px up), on easeInOutCubic over 950ms, growing from the
// source's size to its own with a slight lift on the way. Closing flies it
// back along the same arc, solid all the way, and swaps with the source in
// one frame where they match, so only one is ever shown; the source then
// lands with tor-app's pop bounce: 1.15, 0.95, 1.05 and back, tilting 3°,
// -3° and 1° over 600ms. The source hides while its popup is out. Base UI
// waits for the popup's animation before it unmounts it, however the dialog
// closed. Under prefers-reduced-motion nothing flies; the popup keeps its
// own fade.
const flightMs = 950;
const landingMs = 600;
const flightSteps = 48;
const control1 = { x: -90, y: -100 };
const control2 = { x: 70, y: -80 };

interface FlightPoint {
  x: number;
  y: number;
}

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

const cubicPoint = (
  t: number,
  p0: FlightPoint,
  p1: FlightPoint,
  p2: FlightPoint,
  p3: FlightPoint
) => {
  const u = 1 - t;

  return {
    x:
      u * u * u * p0.x +
      3 * u * u * t * p1.x +
      3 * u * t * t * p2.x +
      t ** 3 * p3.x,
    y:
      u * u * u * p0.y +
      3 * u * u * t * p1.y +
      3 * u * t * t * p2.y +
      t ** 3 * p3.y,
  };
};

// The lift on the way: 10% larger at 30% of the flight, back to size by its
// end (tor-app's flight grows 30% and shrinks into its tab; this one lands
// at full size).
const flightLift = (t: number) =>
  t < 0.3 ? 1 + (t / 0.3) * 0.1 : 1.1 - ((t - 0.3) / 0.7) * 0.1;

const centerOf = (rect: DOMRect) => ({
  x: rect.left + rect.width / 2,
  y: rect.top + rect.height / 2,
});

// The popup's transform at each step of the flight from the source to its
// own place: where the arc is, as an offset from the popup's center, and the
// size it has grown to, as a scale of its own.
const flightKeyframes = (popup: DOMRect, source: DOMRect): Keyframe[] => {
  const p0 = centerOf(source);
  const p3 = centerOf(popup);
  // The arc bends the same way in a right-to-left page as in tor-app's.
  const mirror = document.documentElement.dir === "rtl" ? -1 : 1;
  const middleY = (p0.y + p3.y) / 2;
  const p1 = { x: p0.x + control1.x * mirror, y: middleY + control1.y };
  const p2 = { x: p3.x + control2.x * mirror, y: middleY + control2.y };

  return Array.from({ length: flightSteps + 1 }, (_, step) => {
    const t = easeInOutCubic(step / flightSteps);
    const at = cubicPoint(t, p0, p1, p2, p3);
    const width = source.width + (popup.width - source.width) * t;
    const scale = (width / popup.width) * flightLift(t);

    return {
      transform: `translate(${at.x - p3.x}px, ${at.y - p3.y}px) scale(${scale})`,
    };
  });
};

// tor-app's pop bounce, on the source as the popup lands back in it.
const landOnSource = (source: HTMLElement) =>
  source.animate(
    [
      { transform: "scale(1) rotate(0deg)" },
      { transform: "scale(1.15) rotate(-3deg)" },
      { transform: "scale(0.95) rotate(3deg)" },
      { transform: "scale(1.05) rotate(-1deg)" },
      { transform: "scale(1) rotate(0deg)" },
    ],
    { duration: landingMs, easing: "ease-in-out" }
  );

const prefersReducedMotion = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Spread the result on the dialog's popup; sourceRef is what it flies out of
 * and back into.
 *
 * @param open - Whether the dialog is open.
 * @param sourceRef - The element the dialog flies out of and back into.
 * @returns The ref to spread on the dialog's popup.
 */
export const useFlightMorph = (
  open: boolean,
  sourceRef: RefObject<HTMLElement | null>
) => {
  const flying = useRef<{ popup: HTMLElement; source: HTMLElement } | null>(
    null
  );

  // Closing starts before Base UI checks the popup's animations, so it waits.
  useLayoutEffect(() => {
    if (open || !flying.current) {
      return;
    }

    const { popup, source } = flying.current;
    flying.current = null;

    if (!(popup.isConnected && source.isConnected)) {
      source.style.opacity = "";

      return;
    }

    const back = popup.animate(
      flightKeyframes(
        popup.getBoundingClientRect(),
        source.getBoundingClientRect()
      ).toReversed(),
      // Held at its end until Base UI unmounts the popup.
      { duration: flightMs, fill: "forwards" }
    );

    // One avatar at a time: the popup stays solid until it sits exactly on
    // the source, then the two swap in one frame (same place, same size),
    // and the source lands.
    back.onfinish = () => {
      popup.style.opacity = "0";
      source.style.opacity = "";
      landOnSource(source);
    };
  }, [open]);

  const startFlight = (popup: HTMLElement | null) => {
    const source = sourceRef.current;

    if (!(popup && source) || flying.current || prefersReducedMotion()) {
      return;
    }

    popup.dataset.flight = "";
    source.style.opacity = "0";
    popup.animate(
      flightKeyframes(
        popup.getBoundingClientRect(),
        source.getBoundingClientRect()
      ),
      { duration: flightMs }
    );
    flying.current = { popup, source };
  };

  return { ref: startFlight };
};
