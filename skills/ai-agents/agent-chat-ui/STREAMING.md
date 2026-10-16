# Streaming text, markdown and scrolling

## Pace the text

Tokens arrive in uneven bursts. Shown as they come, the answer moves in small jumps however soft each word's fade is. Show it through a buffer that releases characters at a steady, adaptive rate:

```ts
const LAG_S = 0.6, MIN_CPS = 30, FINISH_S = 0.4, MAX_FRAME_S = 0.1, SETTLE_MS = 600;

function useSmoothText(text: string, streaming: boolean) {
  const [shown, setShown] = useState(() => (streaming ? 0 : text.length));   // history shows at once
  const [settled, setSettled] = useState(() => (streaming ? -1 : text.length));
  const shownRef = useRef(shown), carry = useRef(0), target = text.length;

  useEffect(() => {
    shownRef.current = Math.min(shownRef.current, target);                   // replaced shorter: go on from its end
    if (shownRef.current >= target) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0, last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, MAX_FRAME_S); last = now;     // a background tab doesn't dump everything
      if (reduced) { shownRef.current = target; setShown(target); return; }
      const waiting = target - shownRef.current;
      carry.current += Math.max(MIN_CPS, waiting / (streaming ? LAG_S : FINISH_S)) * dt;
      const step = Math.floor(carry.current);
      if (step > 0) { carry.current -= step; shownRef.current = Math.min(target, shownRef.current + step); setShown(shownRef.current); }
      if (shownRef.current < target) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, streaming]);

  let end = Math.min(shown, target);
  if (end > 0 && end < text.length && (text.codePointAt(end - 1) ?? 0) > 0xffff) end += 1;   // never split an emoji
  const caughtUp = end >= target;
  useEffect(() => {
    if (streaming || !caughtUp || settled === target) return;
    const t = setTimeout(() => setSettled(target), SETTLE_MS);              // let the last fades finish
    return () => clearTimeout(t);
  }, [streaming, caughtUp, settled, target]);

  return { text: text.slice(0, end), revealing: streaming || !caughtUp || settled !== target };
}
```

The rate is what is waiting divided by a target lag, so a burst flows out fast and eases as the buffer drains; once the stream ends the rest flows out within the finish time instead of snapping in.

## The reveal

- **Each new character fades in from a light blur** (opacity 0 and blur 5px to clear) over a fixed length with a soft ease-out. No stagger: the buffer already paces them, so the fades overlap into one soft trailing edge. Per character, not per word, so the edge moves smoothly.
- **Opacity and filter only:** the character spans are inline, a transform does nothing on them, and layout must not move.
- **Fix the animation length in CSS.** A markdown renderer that re-renders on every character and resets earlier characters to a zero-length animation cuts each fade after one frame; a fixed duration keeps the running animation through re-renders. Keep that length equal to the settle time above.
- **Finished text renders once, statically,** with no animation. Under reduced motion, none.

## Markdown that is safe and complete

- **A streaming-aware renderer** that memoizes blocks and completes unfinished syntax, so half-written bold or a link never shows as raw characters; an unfinished link shows as its words until its address arrives.
- **Harden links and images:** http and https (plus mailto and tel), no inline data images, and `javascript:`, `data:`, `file:` blocked; a blocked link or image shows as its text.
- **Direction per block from its first letter** (`dir="auto"` on every paragraph, list item, heading, cell, quote). A renderer that counts letters instead flipped a Hebrew line ending in a long URL to left-to-right.
- **A message with no letters at all** (an answer of "20") keeps the page's direction instead of `dir="auto"`, which would turn it left-to-right.
- **Load the code highlighter lazily,** the first time a code fence appears (it is large), and each language the first time it appears; until then code shows plain. Keep one shared loading promise (`loader ??= import(...)`) and reset it on failure, so the next code block retries. Copy and download buttons on code and tables, no line numbers for short snippets.
- **Style every element yourself** when the renderer's own classes are not scanned by your CSS tool: select by the renderer's element attributes, use logical properties, keep the first and last block flush, and paint code frames and their action bar with the card surface instead of the renderer's default color.

## Links and source chips

- **The product's own links open at once** (https only, host matched by suffix). Any other site becomes a **source chip** (favicon and domain) after the words it backs, and opens only after a confirm that shows its full address (left-to-right, breaking anywhere), then opens with `noreferrer`, so a link written into a post the agent quotes can't pass itself off as something else.
- **Don't repeat link text that is itself the address.** Compare the address with the link's text read from the syntax node, not from the rendered children, which while streaming are animation spans. A link whose address is still being written renders as a span of its words.
- **Preview on hover:** after a short delay a card springs up above the chip with a screenshot of the page and its domain (in a left-to-right `bdi`), leaning a few pixels toward the pointer as it moves along the chip. Request the screenshot only while the card is open, at three times the card's size with a phone viewport and the light scheme; show "loading" and "unavailable" states (a free screenshot tier runs out), and under reduced motion only fade. Keep the portal mounted so the exit animation plays; collision padding keeps it on screen.

## Scrolling

- **Stick to the bottom while the reader is there,** let them scroll away freely, and offer a round "latest" button that is hidden (and inert) at the end and rises into view elsewhere.
- **Opening a chat jumps to its end instantly;** each message the user sends scrolls there smoothly.
- **Leave room under the latest exchange** so the user's last message can scroll to the top of the view while the answer grows below it: the room is the scroller's height minus the last user message and everything after it, less some breathing space at the end.
- **Write that room straight to a CSS variable from resize and mutation observers,** which run before paint. Kept in component state it lagged a render behind, so each time the status line gave way to the answer the content was briefly shorter, the scroll clamped, and the chat jumped down and back up. Observe child lists, the subtree and attributes, and skip the write when the measured value did not change: the shimmer mutates styles every frame.
- **The scrollbar on the right in both directions:** a right-to-left scroller draws its bar on the left, so the scroller runs left-to-right and its content takes the page direction back. The same for long result lists.
- **`role="log"`** on the conversation; each message an `article` named for who wrote it.

## Message layout

The user's message sits at the end in a rounded gray box, at most about 75 characters or 85% wide, its files above it (images as tiles that open a viewer, documents as chips with a shortened name and their type). The agent's answer runs full width. Images fade and grow in from 95%, 100 ms apart; a hovered tile is ringed in the primary color 2px out from a 2px gap. A long file name shortens to its first and last seven characters around an ellipsis, with the extension as the type line. Times show the hour for today and the date for older messages, with the full date in a tooltip. The copy button's icon turns into a check for 1.5 s and its tooltip says "copied"; a refused clipboard leaves it as it was. The user's actions (time, copy) show on hover from the start; the answer's only once it ended.

The image viewer zooms the picture out of its thumbnail (measured after the image decodes, accounting for `object-fit: contain` inside the viewer and `cover` on the tile) and back into it on close, fading only at the end while the dialog holds still so the library waits before unmounting; other images grow in from 90%. Arrows move between images and wrap; in right-to-left the previous image is on the right.
