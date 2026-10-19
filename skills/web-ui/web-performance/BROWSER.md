# Media, lists and rendering in the browser

A page feels slow when it makes you wait for content it could have had ready, when media arrives late or shifts the layout, long lists render everything, or the main thread is busy when someone taps. Measure first (the Performance panel's frames and long tasks, INP for interactions, LCP and CLS for loading; [performance-and-caching MEASURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/MEASURE.md); one slow interaction traced end to end in [RUNTIME-TRACE.md](RUNTIME-TRACE.md)), then fix in this order. A long task is anything over 50 ms holding the main thread; INP and TBT (total blocked time during load) both express how long it was blocked. Splitting, batching, prioritizing and moving JavaScript work to a worker are in [MAIN-THREAD.md](MAIN-THREAD.md).

**Contents:** [Animation](#animation) · [Loading states](#loading-states) · [Connections, fonts and scripts](#connections-fonts-and-scripts) · [Images and video](#images-and-video) · [Layout shift](#layout-shift) · [Long lists](#long-lists) · [Real DOM or canvas](#real-dom-or-canvas) · [Bundle](#bundle) · [The tab icon and background tabs](#the-tab-icon-and-background-tabs) · [Prove it](#prove-it)

## Animation

Which properties to animate, GPU versus main thread, motion values instead of React state, interruptible and shared-element transitions, and reduced motion are in the `ui-animation` skill (PERFORMANCE.md and PATTERNS.md).

- **Measure once, not on every interaction:** Argyle's custom select caches offsets in a `WeakMap` and hardcodes its layout constants to avoid `getComputedStyle` reflows ([modern-css SELECT-AND-FORMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/SELECT-AND-FORMS.md#a-nice-select-part-by-part) in modern-css).

## Loading states

The first visit is the one wait you can't avoid: the content comes from the server, in the first paint (server rendering) or right after. That first HTML is also what crawlers read: "Crawlers and AI engines need the content in the initial HTML" [coreyhaines31/marketingskills, programmatic-seo]. Everything after that should be already there. Audit in this order:

1. **The shell renders on the first frame.** Navigation, header and layout are static; they never wait for data. A root-level loading state, if you keep one, must not block navigation. Put the data boundary (`<Suspense>`, a route's pending component) around the content area, not around the app. Florian Kiem's demo of the difference: the shell at 25 ms, the header at 1,400 ms and the list at 2,400 ms, against a root spinner that holds everything until 2,400 ms.

   The main input can go further: bake a static copy of it into the HTML so users can type during React initialization, and let React paint directly on top of it; what was typed is kept when the real one takes over. In a throttled 4G recording, the input took typing at 0.36 s instead of 2.93 s; across the push that included it, time to a typeable page on a fresh load went from 3,085 to 550 ms at p75. The stand-in is brittle by design (if the React render is off by even a pixel, the effect is lost), so guard it:
   - generate the static markup by rendering the real React component in jsdom, with a test that guarantees they never drift;
   - an integration test compares the static page against the React render across many viewport sizes (fourteen in the measured case) and asserts alignment within 1 px;
   - a keystroke test types straight through the handoff and fails on any lost or reordered key;
   - in the field, every handoff reports shifts to a tenth of a pixel, and any event with nonzero movement gets a look.

   Roll it out to employees first, then one percent of users, then everyone ([api-design FLAGS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/api-design/FLAGS.md)): four hours after one internal release, a teammate's screen recording caught a layout shift that no metric saw. Keep that input mounted between pages instead of remounting it on each navigation.
2. **Fetch before the click.** Between the pointer landing on a link and the click there are roughly 300-500 ms, enough to load most route data (Kiem takes the window from Nielsen Norman Group's "Timing Guidelines for Exposing Hidden Content", where a cursor stopped on a target for 0.3-0.5 s signals hover intent). In his demo a fetch takes 450 ms after a click; on hover it starts after 300 ms of dwell, so the click renders from the prefetched data. Prefetch on hover and focus (and on touch start), not on click:

```tsx
// TanStack Router + Query: preload a route's loader on hover/focus; Query owns freshness.
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",          // hover, focus, touch start; preloadDelay defaults to 50 ms
  defaultPreloadStaleTime: 0,        // let Query decide what is fresh, not the router's own 30 s cache
});

// Outside a router: warm the cache yourself, then the click renders from it.
const warm = () => void queryClient.query(dayQuery(day)).catch(() => {});   // already fresh in cache: no request
<a href={`/calendar/${day}`} onPointerEnter={warm} onFocus={warm} onTouchStart={warm}>Today</a>
```

   A route loader that prefetches without awaiting never delays navigation; skip it during server rendering, where an unawaited prefetch streams data in before hydration, the page no longer matches its HTML, and the first clicks are dropped.

   In Next.js, `<Link>` prefetches routes in the viewport in production; for client-fetched data, warm the query on hover the same way.
3. **Visited stays visited.** Keep every viewed page's data in the cache with a `staleTime` that matches how fast it really changes, so going back renders instantly from the cache with no new request while it is fresh, and at most a silent background refresh after that, never a placeholder. When the key changes (next page, another filter), keep the previous data on screen (`placeholderData: keepPreviousData`) instead of dropping to a placeholder. A placeholder is shown only after checking the cache came up empty.
4. **Parts resolve on their own.** Split the page into independently loading regions, each with its own boundary, so the fast parts render as their data arrives and the slow one doesn't hold the rest hostage.
5. **Kill waterfalls.** List which component waits on which query. A request that can't start until another finishes (a child fetching after its parent rendered) belongs in the route loader or in one combined query, started together. Slow queries leave the critical path: fetch them after the first paint, page them, or ask for one list instead of the whole table (Kiem's demo: 2,400 ms for the whole table's 15 rows, 120 ms for one list of 5). Some of this is a backend change (an endpoint that returns what one screen needs, an index); list those separately. A component that walks every page of a list to compute totals or a chart (one `fetchNextPage` after another) shows numbers that keep moving while the tail loads: compute them on the server, and give pickers a search query with a limit instead of the whole table.
6. **No spinners for data.** Find every one first (search the code for spinner and loader components, `isLoading` and `isPending` branches, and pending fallbacks), then replace each with prefetched content, a skeleton shaped like the real layout (so nothing moves when content arrives), or nothing at all for waits under about 300 ms. A live chart's skeleton can be its own flat line: Liveline (a live line chart for React) shows a breathing line while it waits for a connection, morphs that line into the chart when data arrives, and falls back to a quiet empty state if data never comes. A placeholder that does appear should feel urgent, not calm: short cycles, under a second per pass ([the `ui-animation` skill's TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md)). A user-triggered action is different: update optimistically, and show progress only when the outcome can't be predicted. The one place a working indicator is arguably fair is an agent's live reasoning or tool steps, and even there streamed status text (what it is doing now) says more than a spinner ([the `api-design` skill's STREAMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/api-design/STREAMING.md)).
7. **Media without the wait spinner:** a soft frame first and sharper as it arrives (`srcset`, and adaptive streaming such as HLS with several renditions for video, not one 4K file sent whole), self-hosted or lightweight players instead of heavy third-party iframes, and the poster in place from the first frame. Kiem's hand-made stand-in for adaptive streaming layers each sharper `<video>` (240p at 0 ms, 480p at 800 ms, 720p at 1,600 ms, 1080p at 2,400 ms in the demo) on top of the playing one, syncs its `currentTime` to it, and fades it in with `opacity` over 300 ms ease-out; the videos are `muted loop autoPlay playsInline preload="auto"`.

Report what you changed and, separately, what needs a backend change.

## Connections, fonts and scripts

- **Open connections early:** "Add `<link rel="preconnect">` for CDN/asset domains" [Vercel, web-design-guidelines]. React DOM exposes the same hints as functions, "especially useful in server components to start loading resources before the client even receives the HTML" [Vercel, react-best-practices]:

| API | Use case |
|-----|----------|
| `prefetchDNS` | Third-party domains you'll connect to later |
| `preconnect` | APIs or CDNs you'll fetch from immediately |
| `preload` | Critical resources needed for current page |
| `preloadModule` | JS modules for likely next navigation |
| `preinit` | Stylesheets/scripts that must execute early |
| `preinitModule` | ES modules that must execute early |

```tsx
import { preconnect, prefetchDNS } from 'react-dom'

export default function App() {
  prefetchDNS('https://analytics.example.com')
  preconnect('https://api.example.com')

  return <main>{/* content */}</main>
}
```

  [react.dev: preinit](https://react.dev/reference/react-dom/preinit): "React-based frameworks frequently handle resource loading for you, so you might not have to call this API yourself." For a stylesheet, `precedence` is "Required with stylesheets" (`reset`, `low`, `medium` or `high`); the source's `preinit('/styles/critical.css', { as: 'style' })` leaves it out.
- **Preload a critical font, with `crossorigin`:** "Critical fonts: `<link rel="preload" as="font">` with `font-display: swap`" [Vercel, web-design-guidelines]. That line leaves out what [MDN: rel=preload](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preload) requires: "`font` and `fetch` preloading requires the `crossorigin` attribute to be set", and it "needs to be set to match the resource's CORS and credentials mode, even when the fetch is not cross-origin". MDN's form:

```html
<link
  rel="preload"
  href="fonts/cicle_fina-webfont.woff2"
  as="font"
  type="font/woff2"
  crossorigin />
```

  The React DOM form carries it too: `preload('/fonts/inter.woff2', { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' })` [Vercel, react-best-practices].
- **No script blocks parsing:** [Vercel, react-best-practices] "Script tags without `defer` or `async` block HTML parsing while the script downloads and executes." "`defer`: Downloads in parallel, executes after HTML parsing completes, maintains execution order"; "`async`: Downloads in parallel, executes immediately when ready, no guaranteed order". "Use `defer` for scripts that depend on DOM or other scripts. Use `async` for independent scripts like analytics."

```tsx
<head>
  {/* Independent script - use async */}
  <script src="https://example.com/analytics.js" async />
  {/* DOM-dependent script - use defer */}
  <script src="/scripts/utils.js" defer />
</head>
```

  In Next.js, `next/script` and its `strategy` values (and the source's misplaced `beforeInteractive` example) are in the `react` skill's [react NEXTJS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/react/NEXTJS.md#nextscript).

## Images and video

- **Reserve the space:** `width` and `height` attributes (or `aspect-ratio`) on every image and video, so nothing shifts when it loads.
- **Media delivery, one site's list:** reliable `alt`, lazy loading, async decoding, [client hints](https://web.dev/performance-optimizing-content-efficiency-client-hints/), multiple formats, compression, CDN delivery, and "videos always offer controls and only loop on demand" ([nerdy.dev: New Year, New Site](https://nerdy.dev/new-year-new-site), 2023-01-01). The muted autoplay hero loop below does the opposite; neither wins.
- **Load what's visible:** `loading="lazy"` below the fold, `fetchpriority="high"` and no lazy loading on the largest image above the fold, `srcset` and `sizes` so a phone doesn't download the desktop file, and `decoding="async"`.
  - **Resolution switching or art direction** [responsive-craft]: "Use `srcset` for resolution switching and `<picture>` for art direction." "`sizes` tells the browser how wide the image will display at each viewport, so it picks the smallest `srcset` that covers that width at the device's pixel density." The source's resolution-switching example is a hero marked `loading="lazy"`; [web.dev](https://web.dev/articles/lcp-lazy-loading) says a page "may benefit from more eagerly loading images above the fold", so the copy below leaves that attribute out:

```html
<img
  src="hero-800.jpg"
  srcset="hero-400.jpg 400w, hero-800.jpg 800w, hero-1200.jpg 1200w, hero-2400.jpg 2400w"
  sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 1200px"
  alt="Hero image"
  width="2400"
  height="1200"
>

<picture>
  <source media="(max-width: 640px)" srcset="hero-mobile.jpg">
  <source media="(max-width: 1024px)" srcset="hero-tablet.jpg">
  <img src="hero-desktop.jpg" alt="Hero" width="2400" height="1200">
</picture>
```

  "Use `<picture>` when the mobile image should be a different crop or composition, not just a smaller version." [responsive-craft]
  - **Next.js 16 deprecated `priority`** for `preload`, and the docs prefer `loading="eager"` or `fetchPriority="high"`; the Vercel guidelines' "`priority` or `fetchpriority="high"`" predates that ([react NEXTJS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/react/NEXTJS.md#nextimage)).
- **Every image compressed, as WebP:** never ship the original export or camera file. Resize to the widths `srcset` lists (the largest at about twice its biggest display size), strip metadata, and encode WebP at quality 75 to 82 for photos; screenshots and UI with text or sharp edges as lossless (or near-lossless) WebP, which also keeps transparency and is usually far smaller than the PNG. Every current browser decodes WebP, so no JPEG or PNG fallback is needed. Encode once at build or upload, never on request; check the result by eye at 100% on a high-density screen. A byte target from one source, for a blog hero: "compress to <200KB, serve as WebP with JPEG fallback" [coreyhaines31/marketingskills, image] (no official threshold; its JPEG fallback is that source's view, this file's is that none is needed).

```bash
cwebp -q 80 -m 6 -metadata none photo.jpg -o photo.webp
cwebp -lossless -z 9 -metadata none screen.png -o screen.webp
```

```ts
await sharp(input).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80, effort: 6 }).toFile("photo-1600.webp");
```

- **Sharp after small:** show the small image first; load the large one when it's wanted (start on `pointerdown` or hover intent, before the click completes), wait for it to decode, then crossfade it over the small one:

```ts
export async function upgradeImage(img: HTMLImageElement, largeSrc: string): Promise<void> {
  const large = new Image();
  large.src = largeSrc;
  await large.decode();                                   // decoded off the main thread: swapping now can't flash
  const layer = img.cloneNode() as HTMLImageElement;
  layer.src = largeSrc;
  layer.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .25s";
  img.parentElement!.style.position ||= "relative";
  img.after(layer);
  requestAnimationFrame(() => (layer.style.opacity = "1"));
}
```

- **Blur-up before the first image:** Kiem's image cards put a tiny inline PNG (32×23 px, a base64 data URI) under the real image at `filter: blur(20px)`, `scale-110` (hides the blurred edge) and `object-fit: cover`. The real `<img>` starts at `opacity: 0`, and the two cross-fade with `transition: opacity 400ms ease-out`. The real image is a `srcSet` of 640w, 1280w and 2048w WebP with `sizes="(min-width: 768px) 384px, 90vw"`, `loading="lazy" decoding="async"` and its intrinsic `width="3024" height="2016"`.

- **Every video compressed, as WebM with VP9 or AV1,** never the raw export; keep H.264 MP4 only as the last fallback. **Encode it as a ladder, best codec first:** AV1 is the smallest for the same quality, VP9 in WebM next, H.264 in MP4 last as the file every browser plays. List them as `<source>` elements with the codec in `type`; the browser takes the first it can play, so each visitor gets the smallest file their device decodes:

```html
<video muted playsinline loop autoplay poster="hero.webp" width="1920" height="1080">
  <source src="hero.av1.mp4" type='video/mp4; codecs="av01.0.08M.08"'>
  <source src="hero.vp9.webm" type='video/webm; codecs="vp09.00.40.08"'>
  <source src="hero.h264.mp4" type='video/mp4; codecs="avc1.640028"'>
</video>
```

```bash
ffmpeg -i master.mov -c:v libsvtav1 -crf 35 -preset 6 -pix_fmt yuv420p -movflags +faststart -an hero.av1.mp4
ffmpeg -i master.mov -c:v libvpx-vp9 -b:v 0 -crf 32 -row-mt 1 -deadline good -cpu-used 2 -pix_fmt yuv420p -an hero.vp9.webm
ffmpeg -i master.mov -c:v libx264 -crf 23 -preset slow -profile:v high -pix_fmt yuv420p -movflags +faststart -an hero.h264.mp4
```

  - **Why all three, not WebM alone:** Safari plays AV1 only on devices with a hardware decoder (iPhone 15 Pro and later, M3 Macs and later), and WebM only from Safari 14.1 / iOS 15, with VP9 decoded in software on older iPhones (battery). The H.264 file is what an older iPhone or Mac falls back to; never ship without it.
  - **Settings that bite:** 8-bit `yuv420p` everywhere (4:4:4 VP9 fails in Safari, and 10-bit isn't decoded everywhere); `-movflags +faststart` on MP4 so playback starts before the whole file arrives; no audio track (`-an`) for muted loops; the codec string in `type` must match the file (`av01.0.08M.08` is AV1 Main, level 4.0, 8-bit; `avc1.640028` is H.264 High 4.0), or the browser may pick a file it can't play.
  - **Pick the CRF by eye per clip,** and compare sizes at equal quality, not equal CRF; the CRF scales differ between encoders. AV1 encodes are the slowest by far; encode once at upload, never on request.
  - **Transparent video:** VP9 WebM with alpha for Chrome and Firefox, HEVC with alpha (a `.mov`, `hevc_videotoolbox` with `-alpha_quality`) listed first with `type='video/mp4; codecs="hvc1"'` for Safari; check both on a real device.
  - **Longer than a short loop** (product videos, anything with a scrubber): adaptive streaming (HLS with several renditions, or a video host that does it), so the first frame arrives fast and quality rises with the connection, instead of one large file.
  - **An MP4 as an image source helps only Safari:** "Short non-essential loops: Safari H.264 MP4 `<picture>` source, `prefers-reduced-motion` media condition, and still fallback" [Vercel, web-design-guidelines]. WebKit: "WebKit in Safari now supports loading H.264 encoded MP4 video with an HTML <img> tag" (Safari 11.1, [webkit.org/blog/8216](https://webkit.org/blog/8216/new-webkit-features-in-safari-11-1/)), and MDN's image types guide: "Safari 11.1 added the ability to use a video format, as an animated gif replacement. No other browser supports this." Elsewhere the `<picture>` falls through to its GIF or still fallback, so the `<video>` above stays the cross-browser route.
- **Play only what's on screen, and only a few:** `preload="none"` (or `metadata`) with a `poster`, and an `IntersectionObserver` that plays videos entering the viewport and pauses those leaving, with a cap on how many play at once:

```ts
export function playVisibleVideos(videos: HTMLVideoElement[], maxPlaying = 3): () => void {
  const playing = new Set<HTMLVideoElement>();
  const observer = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      const video = target as HTMLVideoElement;
      if (isIntersecting && playing.size < maxPlaying) {
        playing.add(video);
        video.play().catch(() => playing.delete(video));   // autoplay can be refused: muted + playsinline helps
      } else if (!isIntersecting && playing.delete(video)) {
        video.pause();
      }
    }
  }, { threshold: 0.5 });
  videos.forEach((v) => { v.muted = true; v.playsInline = true; observer.observe(v); });
  return () => observer.disconnect();
}
```

  A video that scrolls in while the cap is full waits for its next visibility change; if a freed slot should start it at once, keep a queue of visible-but-waiting videos and start the first when one pauses.
- **The same goes for anything that runs continuously:** carousels, animated promo banners and live charts are pure waste while off screen. Run them while visible and stop them when they leave; a heavy widget's initialization can wait until it nears the screen.

## Layout shift

- **CLS can pass while the page jumps.** Sidebar rows popping in after load scored about 0.008 per shift, well within the good threshold of 0.1, and no monitor noticed. Read the Layout Instability API directly: map the `sources` of each `layout-shift` entry to a named region (sidebar, transcript) and a phase (before first paint, after typeable), and send that as a telemetry event. In the measured case, 31% of web page loads moved something after the page was usable, without any user interaction. Work through the causes by name (a header row that arrived late, a caret that slid sideways once the user's name loaded, a list that moved when the scrollbar popped in), fix the top offenders as a batch, then find the next batch.
- **A banner injected above the content shifts everything below it.** [web.dev, CLS](https://web.dev/articles/cls) names "DOM elements are dynamically added to the page before existing content" as a cause; good CLS is "0.1 or less" and poor "greater than 0.25", at the 75th percentile. A shift is excused only "within 500 milliseconds of user input", and only for taps, clicks and keypresses, not scrolls. So an announcement bar, cookie notice or promo that appears on a timer or on scroll reserves its space from the first paint or overlays the page ([cro POPUPS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cro/POPUPS.md) in cro).
- **Test it:** open the page with a populated list, hold its data until after first paint, and fail on any shift in any named region. The fix is proven when the test is red on every run on main and green on every run with the fix (20 of 20 each).
- **Prerendering can shift the first frame.** While a user types the URL into the address bar, Chrome's speculative loading prerenders the page in the background at the current tab's height. On browsers managed by an organization the new-tab page is shorter by a 56 px footer, so the first frame shows the shorter layout and Chrome resizes it about a tenth of a second later. Pin the layout across the resize and add a test that simulates the prerender flow; headless Chrome has no browser UI to retract, so ordinary layout tests can't see it. A shift like this was always latent: it shows once the page paints that early.

## Long lists

Render what's visible: virtualize long lists (TanStack Virtual), or let the browser skip off-screen sections with `content-visibility: auto` plus `contain-intrinsic-size`. A third way: keep off-screen items as empty shells that hold their height, fill them through an `IntersectionObserver` as they approach, and empty them when they leave. It matters for a kept-alive feed, where returning to it otherwise recomputes style and layout for every post, including far-off ones (in a demo with 1,500 posts, stacked that high on purpose, rendering everything froze for hundreds of ms on every return; rendering only the visible ones was instant):

```js
const io = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) fill(entry.target); // fill as it approaches
      else empty(entry.target); // empty it when it leaves, keeping its place
    }
  },
  { rootMargin: '400px' } // headroom to fill before the scroll arrives
);

feed.querySelectorAll('.feed-item').forEach((el) => io.observe(el));
```

The two readings of `content-visibility`: this file recommends it as above; the article "The Browser's Main Thread Is Expensive" (kciter.so) prefers the observer, "the option that behaves predictably everywhere", because as of its writing (July 2026) "implementations vary between engines, and Safari has a performance bug that makes returning to the page slower rather than faster". It names no Safari version and links no bug. WebKit's own notes say Safari supports `content-visibility` from 18.0, and the Safari 26.0 notes list `content-visibility` fixes (skipped content made findable, repaint when changing to `hidden`); no WebKit or MDN source found describes the slower-return bug, so treat it as the article's unverified claim and measure in Safari before choosing.

`auto`, not `hidden`, for content people still use ([MDN: content-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/content-visibility)). With `hidden`, "The skipped contents must not be accessible to user-agent features, such as find-in-page, tab-order navigation, etc., nor be selectable or focusable. This is similar to giving the contents `display: none`." With `auto`, "the skipped contents must still be available as normal to user-agent features such as find-in-page, tab order navigation, etc., and must be focusable and selectable as normal", and off-screen content "remains in the document object model and the accessibility tree". One source calls `hidden` "like display:none but accessible" [css-modern-features]; MDN says the opposite.

Endless carousels from a few items are in the `ui-animation` skill's PATTERNS.md.

## Real DOM or canvas

Real elements keep accessibility, text selection, find-in-page, SEO, CSS styling and native lazy loading; CSS 3D transforms on real elements go further than most expect (rings, coverflow, a helix of cards). Reach for canvas or WebGL when the count is in the thousands, when every pixel is computed (particles, shaders), or when the DOM's layout cost is the measured bottleneck, and then rebuild what you gave up (an accessible list, focus handling, alt text).

- **A chart redrawn every frame** is a canvas case: Liveline is one `<canvas>` and one `requestAnimationFrame` loop, built because "every charting library I tried was either too heavy for a simple live feed, or too rigid to feel alive."
- **An effect on live content stays on live DOM.** An SVG filter keeps the content underneath selectable, scrollable and clickable "on the same compositor as the rest of the page"; Aave's glass drops to WebGL only where there is no live DOM (a canvas-drawn QR code) or the browser won't filter it (Safari won't apply an SVG filter to a live `<video>`), with the same displacement map driving both renderers. The filter details are in the `svg` skill's [svg FILTERS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/FILTERS.md).
- **Past canvas, only when the profile shows compute, not transfer:** lagging UI, dropped frames or a main thread busy for too long are the sign; then profile which part is expensive. "In many apps it's still the network, too much data or too many requests, and in that case these tools won't help." WASM fits CPU-heavy data processing and transformations; WebGPU fits massively parallel work (physics, graphics, large-scale computation). In one demo, plain JS with Canvas 2D started struggling at around 40k particles on the author's machine, WebGPU ran more than 500,000 with their own physics, and WASM was roughly 2 to 3 times faster than an optimized JS equivalent for a mapping step that ran once per rebuild; a reader noted the Canvas 2D version was a software rasterizer using Canvas 2D only for the final `putImageData` blit, not the best possible Canvas 2D, so the numbers describe that workload.
- **Size a canvas in whole device pixels** ([MDN: WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)): "the common approach is to set `canvas.width = width * devicePixelRatio`, this will cause moire artifacts with non-integer values of `devicePixelRatio`, as is common with UI scaling on Windows, as well as zooming on all platforms." Instead, "use non-integer values for CSS's `top`/`bottom`/`left`/`right` to fairly reliably 'pre-snap' our canvas to whole integer device coordinates"; on supporting browsers, a `ResizeObserver` observing with `box: "device-pixel-content-box"` reports the element's true device-pixel size.
- **Push Canvas 2D further before leaving it:** pre-render a sprite once on an `OffscreenCanvas`, reuse it, and move the rest to workers so the main thread only issues draw calls.
- **WebGPU needs a fallback:** it is not yet universally supported, with gaps especially on mobile devices and in environments like Linux. Rust compiled to WASM and WebGPU shaders fit into an ordinary React app, added incrementally when needed.

## Bundle

Load heavy, rarely used components with a dynamic `import()` on the route that needs them, and check that the build actually produced the split chunks: often everything still ends up in one big bundle even though on paper there's code splitting. Animation-library bundle size is in the `ui-animation` skill's PERFORMANCE.md.

## The tab icon and background tabs

- **Most sites shouldn't animate the favicon:** a spinning icon in every tab gets annoying fast, and it eats CPU. It fits real state the user cares about in a page that lives in a background tab: loading or processing (long uploads, exports, builds: users switch tabs while they wait), notification badges (a subtly pulsing red dot gets noticed faster than a static one), live data feeds (trading dashboards, monitoring, sports scores), and brand moments, sparingly. It's a bad fit when it is just decoration, runs the entire time the tab is open, or targets Safari and mobile, where it barely works.
- **Static first:** for "1 unread message", swap to a static red-dot version of the favicon. A tab title change or a static badge often says the same thing.
- **The technique:** draw a frame to a hidden canvas, export it as a PNG data URL, and assign it to the icon link:

```js
// 1. Get or create the favicon link element
let link = document.querySelector('link[rel~="icon"]');
if (!link) {
  link = document.createElement('link');
  link.rel = 'icon';
  document.head.appendChild(link);
}
// 2. Draw a frame to a hidden canvas
const canvas = document.createElement('canvas');
canvas.width = 32;
canvas.height = 32;
const ctx = canvas.getContext('2d');
function drawFrame(t) {
  const scale = 0.5 + 0.5 * Math.abs(Math.sin(t / 400));
  ctx.clearRect(0, 0, 32, 32);
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(16, 16, 14 * scale, 0, Math.PI * 2);
  ctx.fill();
  // 3. Export the canvas to a data URL and assign it to the favicon
  link.href = canvas.toDataURL('image/png');
  requestAnimationFrame(drawFrame);
}
requestAnimationFrame(drawFrame);
```

- **16x16 or 32x32, as PNG:** the icon renders tiny anyway, and a bigger canvas means larger data URLs and more CPU per frame. `canvas.toDataURL('image/png')` is the only thing that works reliably; don't encode ICO yourself. To judge detail, mirror the same canvas at 8x with nearest-neighbor scaling.
- **Background tabs throttle it.** Firefox animates smoothly even when the tab isn't focused. Chrome and Edge animate while the tab is active; when you switch away, `requestAnimationFrame` throttles to roughly once per second. Safari sometimes updates the icon only at slow intervals even while focused. That is fine for dots and progress states, which only need to update every second or so.
- **A worker keeps it moving in a background tab,** by the article's claim (it measures nothing): workers aren't throttled in the background, and `OffscreenCanvas` renders frames without the DOM. The demo draws every 20 ms, exports with `convertToBlob` and `FileReader`, and the main thread only assigns the string to the link's `href`. Worth it for apps users park in a background tab (chat clients, build dashboards, monitoring tools); otherwise the main-thread version is simpler and good enough.

```js
// In your page
const worker = new Worker('favicon-worker.js');
worker.onmessage = (e) => {
  if (e.data.type === 'updateFavicon') {
    document.querySelector('link[rel~="icon"]').href = e.data.dataUrl;
  }
};
worker.postMessage({ type: 'init', images: ['icon-a.png', 'icon-b.png'] });

// In favicon-worker.js
const canvas = new OffscreenCanvas(16, 16);
const ctx = canvas.getContext('2d');
// ...draw a frame...
const blob = await canvas.convertToBlob();
const reader = new FileReader();
reader.onloadend = () => self.postMessage({ type: 'updateFavicon', dataUrl: reader.result });
reader.readAsDataURL(blob);
```

- **A flip between two icons:** hold icon A for 3 seconds, compress its width to zero along a cosine, swap to icon B and expand it back: `width = canvas.width * Math.abs(Math.cos(progress * Math.PI))`, with the second image taking over once `progress` crosses 0.5 (from Aymkdn/animated-favicon's `favicon_worker.js`).
- **Stop it, and put the original back:** even a subtle pulse drains battery on mobile. Stop when the loading state ends, when the user reads the notification, or when the tab loses focus. Save `link.href` before animating and restore it on `beforeunload` or when the operation completes; a tab that keeps showing a half-broken animation after navigation looks buggy.

## Prove it

Record the page load and the main interactions in the Performance panel with 4x CPU slowdown and network throttling: the shell paints before any data, hovering a link then clicking shows the next page with no placeholder, going back shows the previous page instantly, no spinner appears for data, the largest image arrives early and isn't lazy, font preloads carry `crossorigin`, no script without `defer` or `async` blocks parsing, no layout shift when media loads, no shift in any named region after first paint, only visible videos play, long lists render only what's on screen, and an animated tab icon stops and returns to the original when its state ends.
