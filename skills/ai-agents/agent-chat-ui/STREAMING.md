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

- **Each new character fades in from a light blur** (opacity 0 and blur 5px to clear) over a fixed length with a soft ease-out. No stagger: the buffer already paces them, so the fades overlap into one soft trailing edge. Per character, not per word, so the edge moves smoothly. List markers fade with their item.
- **Opacity and filter only:** the character spans are inline, a transform does nothing on them, and layout must not move.
- **Fix the animation length in CSS** (600 ms on every animated character span). A markdown renderer that re-renders on every character and resets earlier characters to a zero-length animation cuts each fade after one frame; a fixed duration keeps the running animation through re-renders. The CSS length wins over the renderer's own animation setting (450 ms, which still times the list markers' fade, since the CSS fixes only the characters), and the settle time above matches the CSS: 600 ms.
- **Switch the renderer between streaming and static by `revealing`,** the same flag that drives its animating state. Finished text renders once, statically, with no animation. Under reduced motion, none.

## Markdown that is safe and complete

- **A streaming-aware renderer** that memoizes blocks and completes unfinished syntax, so half-written bold or a link never shows as raw characters; an unfinished link shows as its words until its address arrives. Turn off controls you don't support (diagram toolbars).
- **Touch only what is still changing:** memoizing finished blocks removes `O(message length)` work per chunk. One rebuilt renderer that also moved tokenization for growing code fences to a worker and revealed tables cell by cell cut a long reply's main-thread blocking from about 750 ms in total to about 200, on about a third of the CPU, holding 120 fps from start to finish on a 120 Hz MacBook.
- **Run the plugins in this order:** raw HTML, sanitize, harden, then direction per block, so sanitizing doesn't strip the `dir` it adds.
- **Harden links and images:** http and https (any host) plus mailto and tel, no inline data images, and `javascript:`, `vbscript:`, `data:`, `file:` blocked; a blocked link or image shows as its text.
- **Direction per block from its first letter** (`dir="auto"` on every paragraph, list item, heading, cell, quote). A renderer that counts letters instead flipped a Hebrew line ending in a long URL to left-to-right. Keep code left-aligned in right-to-left (`text-align: left` on `pre`).
- **A message with no letters at all** (an answer of "20") keeps the page's direction instead of `dir="auto"`, which would turn it left-to-right.
- **Long words break anywhere** (`overflow-wrap: anywhere` on the answer and the user's message); tables scroll inside their own box.
- **Load the code highlighter lazily,** the first time a code fence appears (it is around 190 KB; detect a fence on the raw markdown with `/^ {0,3}(?:```|~~~)/m`), and each language the first time it appears; until then code shows plain. Keep one shared loading promise (`loader ??= import(...)`) and reset it on failure, so the next code block retries; cache the loaded highlighter at module level so later messages start highlighted. A light-only app passes its light theme for both theme slots. Copy and download buttons on code and tables, no line numbers for short snippets.
- **Copy each code block into a one-byte string before highlighting it.** If the reply's markdown contains any non-Latin-1 character (an em dash, a curly quote), V8 stores the entire string as UTF-16, which puts every syntax-highlighting regex on its slower two-byte path. Measured: the first TypeScript block on a page went from 1.0 s to 0.35 s of main-thread time, and each later pass on that block from 100 ms to 40 ms.
- **Style every element yourself** when the renderer's own classes are not scanned by your CSS tool: select by the renderer's element attributes, use logical properties, keep the first and last block flush, and paint code frames and their action bar with the card surface instead of the renderer's default color. Reset the borders the renderer draws on its code and table frames with an unlayered rule, so it wins over layered utility classes.

## Links and source chips

- **The product's own links open at once** (https only, host matched as `hostname === host || hostname.endsWith("." + host)`; the leading dot keeps a look-alike host from counting). An http link to the product's host becomes a confirmed chip like any other. Any other site becomes a **source chip** (favicon and domain) after the words it backs, and opens only after a confirm that shows its full address (left-to-right, breaking anywhere), then opens with `noreferrer`, so a link written into a post the agent quotes can't pass itself off as something else. Everything that is not an outside http(s) link (the product's own, mailto, tel, an address that doesn't parse) renders as a plain `<a target="_blank" rel="noreferrer">`.
- **The chip** is a `<button>` labelled with its host (a leading `www.` dropped), a 14px favicon with `alt=""` and the host in a left-to-right `bdi`, nudged `vertical-align: -0.125em` to centre on the line.
- **Don't repeat link text that is itself the address** (the text equals the address or contains its host). Compare the address with the link's text read from the syntax node, not from the rendered children, which while streaming are animation spans. A link whose address is still being written renders as a span of its words.
- **Preview on hover:** after a short delay a card springs up above the chip, centred, with a screenshot of the page and its domain (in a left-to-right `bdi`), leaning toward the pointer by half its distance from the chip's centre, clamped to 12px and reset to 0 on each open. Apply the lean through the independent `translate` property so it composes with the scale animation. Request the screenshot only while the card is open, at three times the card's size with a phone viewport and the light scheme, using the screenshot service's image address directly as the `<img>` source (no fetch from script; `referrerPolicy="no-referrer"`, `decoding="async"`, explicit width and height, alt "preview of <host>"). Each open starts at "loading"; key the image by its source, keep it mounted under the placeholder and fade it in once loaded; on error remove it and show "unavailable" (a free screenshot tier runs out, around 50 a day). Under reduced motion it appears at once, with no lean. Keep the portal mounted so the exit animation plays, and its styles unscoped since it renders outside the answer; collision padding keeps it on screen.

## Scrolling

- **Stick to the bottom while the reader is there,** let them scroll away freely, and offer a round outline "latest message" button (the same words as its tooltip and its label) that is hidden (and inert) at the end and rises into view elsewhere. Centre it with `left: 50%` and `translate: -50% 0`, and hide it with the independent `scale` and `translate`, so hiding composes with the centring.
- **Opening a chat jumps to its end instantly;** growing content and each message the user sends follow smoothly.
- **Leave room under the latest exchange** so the user's last message can scroll to the top of the view while the answer grows below it: the room is the scroller's height minus the last user message and everything after it, less some breathing space at the end. Draw them as two `aria-hidden` blocks (the room, at least 0, then the breathing space), and cancel the conversation's own bottom padding with a negative margin.
- **Write that room straight to a CSS variable from resize and mutation observers,** which run before paint. Kept in component state it lagged a render behind, so each time the status line gave way to the answer the content was briefly shorter, the scroll clamped, and the chat jumped down and back up. Observe the size of both the scroller and the content, and child lists, the subtree and attributes; re-measure only when the last user message or what follows it changed (a null starting value forces the first measurement), and skip the write when the measured value did not change: the shimmer mutates styles every frame.
- **The scrollbar on the right in both directions:** a right-to-left scroller draws its bar on the left, so the scroller runs left-to-right and its children take right-to-left back (`:root[dir="rtl"] .scroller > *`, or `:dir(rtl)` on result lists); `scrollbar-gutter: stable both-edges` keeps the content centred. The same for long result lists.
- **`role="log"`** on the conversation; each message an `article` named for who wrote it. The status line sits in its own `article` named as the agent's answer.

## Message layout

The user's message sits at the end in a rounded gray box, at most about 75 characters or 85% wide, as plain text (not markdown) with the no-letters direction rule; its files sit above it (images as tiles that open a viewer, documents as chips). The agent's answer runs full width. Each send stamps the message with its client time (`metadata.createdAt`), which the times read; a send with no text has files only, with no empty text part.

- **Image tiles** are buttons labelled "show <name>" around an `<img alt="">`, 96px with cover fit. They fade and grow in from 95%, 100 ms apart by position among all the files. A hovered tile is ringed in the primary color 2px out from a 2px gap, drawn as stacked box-shadows. An image shows as a tile only while the message still holds its contents: a picture lives only as long as the page that attached it, a stored message keeps the name and type, so after a reload it shows as a document chip.
- **Document chips** show the name in a `bdi` with the full name in a tooltip and the MIME type as the type line (the media type stands in when there is no name). The name shows up to its first dot (the type line carries the extension, so "a.b.pdf" shows "a"); when that part is over 18 characters it shortens to its first and last seven characters around three dots ("...").
- **Times** are a `<time dateTime>`: the hour and minute for today, else month, day and year, with the full date and time in a tooltip below; build the formatters once per locale.
- **Actions:** the user's message shows time then copy, the answer copy then time; copy shows only when the message has text. The copy button's icon morphs into a check for 1.5 s and its tooltip says "copied"; a refused clipboard leaves it as it was. The user's actions show on hover from the start; the answer's only once it ended.

The image viewer zooms the picture out of its thumbnail (measured after the image decodes, accounting for `object-fit: contain` inside the viewer and `cover` on the tile) and back into it on close, fading only at the end while the dialog holds still (scale and opacity 1 on its starting and ending styles) so the library waits before unmounting; the close keyframes hold their end state (`fill: "forwards"`). Only the first image of an opening zooms in, once (a ref guard cleared on close), and only the transform animates, with its own entrance turned off. Zoom back only while the viewer still shows the image it opened on and its tile is still on the page; otherwise close plainly. A failed decode still zooms; a tile that left the page during decoding skips it. Other images grow in from 90%. The image loads at high fetch priority, a visually hidden title names it, and the viewer renders nothing without a picture. Previous, next and close each carry a label and a tooltip; padding comes from all four safe-area insets. Arrows move between images and wrap, bound on the window only while it is open with more than one image, and laid out for right-to-left, where the previous image is on the right: ArrowRight shows the previous image and ArrowLeft the next, in both directions.
