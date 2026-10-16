import { createBlendy } from "blendy";
import { useId, useLayoutEffect, useRef } from "react";

// The control the user pressed last: the button that opened the dialog.
let lastPressedControl: { element: HTMLElement; at: number } | null = null;

const rememberPressedControl = (event: MouseEvent) => {
  const element =
    event.target instanceof Element
      ? event.target.closest<HTMLElement>("button, [role='button'], a[href]")
      : null;

  lastPressedControl = element ? { element, at: event.timeStamp } : null;
};

// Registered once for the page, ahead of any press (not during SSR).
if (typeof document !== "undefined") {
  document.addEventListener("click", rememberPressedControl, true);
}

// Blendy counter-scales only an end's first child element, so a button with
// an icon beside bare text would stretch; such a button just fades.
const hasSingleChild = (element: Element) =>
  element.children.length === 1 &&
  [...element.childNodes].every(
    (node) =>
      node === element.children[0] || (node.textContent?.trim() ?? "") === ""
  );

const findDialogMorphSource = () => {
  const pressed = lastPressedControl;

  // Only a press that just opened this dialog, not one from long before.
  if (
    pressed?.element.isConnected !== true ||
    performance.now() - pressed.at > 1000 ||
    !hasSingleChild(pressed.element)
  ) {
    return null;
  }

  return pressed.element;
};

// Blendy's "dynamic" timing, which the close and the backdrop
// (backdrop.css) share so open and close mirror each other.
const dialogMorphDuration = 450;

// How long the button stays held after the dialog has gone, for the
// browser to see the pointer over it again once the backdrop is removed.
const sourceHoverSettleMs = 200;
const dialogMorphEasing = "cubic-bezier(0.33, 1, 0.68, 1)";

// Shrinks the dialog back into its button. Blendy's own reverse grows the
// button instead and fades the dialog in its first 75ms, which shows nothing
// when the button has no fill (the board's ghost "+"). Base UI waits for this
// animation before it unmounts the popup, however the dialog closed.
const shrinkDialogIntoSource = (popup: HTMLElement, source: HTMLElement) => {
  // The button's return (below), kept until the hand-back.
  let sourceReturn: Animation | null = null;

  const restoreSource = () => {
    // Blendy leaves the button hidden while its dialog is open. The return
    // holds the button at full opacity until here, so its own styles take
    // over from what is on screen: a button shown only while its column is
    // hovered fades out on its own transition once the pointer has left,
    // and otherwise nothing changes. (Held only until the return's end, the
    // inline 0 showed for a frame and the button came in twice.)
    source.style.opacity = "";
    source.style.pointerEvents = "";
    delete source.dataset.blendyFrom;
    // Held a little longer: the backdrop is still up for a moment, so the
    // pointer over the column does not count as hovering it yet, and the
    // button flashed out and back in until the browser saw the hover again.
    setTimeout(() => sourceReturn?.cancel(), sourceHoverSettleMs);
  };

  if (!popup.isConnected || !source.isConnected) {
    restoreSource();

    return;
  }

  const from = popup.getBoundingClientRect();
  const to = source.getBoundingClientRect();
  popup.style.transformOrigin = "0 0";

  const shrink = popup.animate(
    [
      { transform: "none", opacity: 1 },
      { opacity: 1, offset: 0.6 },
      {
        transform: `translate(${to.x - from.x}px, ${to.y - from.y}px) scale(${to.width / from.width}, ${to.height / from.height})`,
        opacity: 0,
      },
    ],
    // Held at its end (shrunk and clear) until Base UI unmounts it, so the
    // dialog never shows again for a frame in between.
    {
      duration: dialogMorphDuration,
      easing: dialogMorphEasing,
      fill: "forwards",
    }
  );

  // The button comes back as the dialog fades into it, over the shrink's last
  // 40%, instead of appearing at once after it: it grows from 85% and fades
  // in, held until restoreSource hands it back.
  sourceReturn = source.animate(
    [
      { opacity: 0, transform: "scale(0.85)" },
      { opacity: 1, transform: "none" },
    ],
    {
      delay: dialogMorphDuration * 0.6,
      duration: dialogMorphDuration * 0.4,
      easing: dialogMorphEasing,
      fill: "both",
    }
  );
  // The content leaves first, so it is not seen squashing into the button.
  popup.firstElementChild?.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: dialogMorphDuration / 3,
    easing: "ease-out",
    fill: "forwards",
  });
  // Blendy's open has ended by then (it started earlier and runs as long),
  // so it cannot hide the button again afterwards.
  shrink.addEventListener("finish", restoreSource);
};

// Blendy's dialog morph, for a dialog that opens something new out of a
// button (the task board's "+" growing into the create-task dialog): the
// button grows into the dialog, and the dialog shrinks back into it when it
// closes, however it closes. Confirmations keep their plain fade. Spread the
// result on the dialog's popup, whose content is one wrapper element
// (Blendy counter-scales only the first child). Skipped under
// prefers-reduced-motion and when the pressed button has more than one
// child; the dialog keeps its own fade.
// The source is the button just pressed, unless findSource names another:
// a dialog opened from a menu that has closed by then (the chat's rename,
// from its title menu) grows out of the menu's trigger.
// The named source when there is one (a usable one-child button, or none),
// otherwise the button just pressed.
const dialogMorphSource = (findSource?: () => HTMLElement | null) => {
  if (!findSource) {
    return findDialogMorphSource();
  }

  const named = findSource();

  return named && hasSingleChild(named) ? named : null;
};

/**
 * Blendy's dialog morph: the button that opened the dialog grows into it, and
 * the dialog shrinks back into the button when it closes (see the notes above).
 *
 * @param open - Whether the dialog is open.
 * @param findSource - Finds the button it grows out of, when it is not the one
 *   just pressed.
 * @returns The props to spread on the dialog's popup: its Blendy id and ref.
 */
export const useDialogMorph = (
  open: boolean,
  findSource?: () => HTMLElement | null
) => {
  // Blendy finds both ends with an unquoted attribute selector, so the id
  // must be a plain CSS identifier; useId's has other characters.
  const id = `dialog-morph-${useId().replaceAll(/[^\w-]/gu, "")}`;

  const running = useRef<{ popup: HTMLElement; source: HTMLElement } | null>(
    null
  );

  // Closing starts before Base UI checks the popup's animations, so it waits.
  useLayoutEffect(() => {
    if (open || !running.current) {
      return;
    }

    const { popup, source } = running.current;
    running.current = null;
    shrinkDialogIntoSource(popup, source);
  }, [open]);

  // A fresh Blendy per opening: it keeps the first element it found for an
  // id, which would be stale once React replaces the button.
  const startDialogMorph = (popup: HTMLElement | null) => {
    if (
      !popup ||
      running.current ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const source = dialogMorphSource(findSource);

    if (!source) {
      return;
    }

    source.dataset.blendyFrom = id;
    popup.dataset.morph = "";
    createBlendy().toggle(id);
    running.current = { popup, source };
  };

  return { "data-blendy-to": id, ref: startDialogMorph };
};
