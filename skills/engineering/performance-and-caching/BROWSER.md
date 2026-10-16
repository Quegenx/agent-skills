# Media, lists and rendering in the browser

A page feels slow when it makes you wait for content it could have had ready, when media arrives late or shifts the layout, long lists render everything, or the main thread is busy when someone taps. Measure first (the Performance panel's frames and long tasks, INP for interactions, LCP and CLS for loading; [MEASURE.md](MEASURE.md)), then fix in this order.

## Animation

Which properties to animate, GPU versus main thread, motion values instead of React state, interruptible and shared-element transitions, and reduced motion are in the `ui-animation` skill (PERFORMANCE.md and PATTERNS.md).

## Loading states

The first visit is the one wait you can't avoid: the content comes from the server, in the first paint (server rendering) or right after. Everything after that should be already there. Audit in this order:

1. **The shell renders on the first frame.** Navigation, header and layout are static; they never wait for data. A root-level loading state, if you keep one, must not block navigation. Put the data boundary (`<Suspense>`, a route's pending component) around the content area, not around the app.
2. **Fetch before the click.** Between the pointer landing on a link and the click there are roughly 300-500 ms, enough to load most route data. Prefetch on hover and focus (and on touch start), not on click:

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
5. **Kill waterfalls.** List which component waits on which query. A request that can't start until another finishes (a child fetching after its parent rendered) belongs in the route loader or in one combined query, started together. Slow queries leave the critical path: fetch them after the first paint, page them, or ask for one list instead of the whole table. Some of this is a backend change (an endpoint that returns what one screen needs, an index); list those separately. A component that walks every page of a list to compute totals or a chart (one `fetchNextPage` after another) shows numbers that keep moving while the tail loads: compute them on the server, and give pickers a search query with a limit instead of the whole table.
6. **No spinners for data.** Find every one first (search the code for spinner and loader components, `isLoading` and `isPending` branches, and pending fallbacks), then replace each with prefetched content, a skeleton shaped like the real layout (so nothing moves when content arrives), or nothing at all for waits under about 300 ms. A placeholder that does appear should feel urgent, not calm: short cycles, under a second per pass ([the `ui-animation` skill's TIMING.md](../ui-animation/TIMING.md)). A user-triggered action is different: update optimistically, and show progress only when the outcome can't be predicted. The one place a working indicator is arguably fair is an agent's live reasoning or tool steps, and even there streamed status text (what it is doing now) says more than a spinner ([the `api-design` skill's STREAMING.md](../api-design/STREAMING.md)).
7. **Media without the wait spinner:** a soft frame first and sharper as it arrives (`srcset`, and adaptive streaming such as HLS with several renditions for video, not one 4K file sent whole), self-hosted or lightweight players instead of heavy third-party iframes, and the poster in place from the first frame.

Report what you changed and, separately, what needs a backend change.

## Images and video

- **Reserve the space:** `width` and `height` attributes (or `aspect-ratio`) on every image and video, so nothing shifts when it loads.
- **Load what's visible:** `loading="lazy"` below the fold, `fetchpriority="high"` and no lazy loading on the largest image above the fold, `srcset` and `sizes` so a phone doesn't download the desktop file, and `decoding="async"`.
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

- **Encode video for the web as a ladder, best codec first:** AV1 is the smallest for the same quality, VP9 in WebM next, H.264 in MP4 last as the file every browser plays. List them as `<source>` elements with the codec in `type`; the browser takes the first it can play, so each visitor gets the smallest file their device decodes:

```html
<video muted playsinline loop autoplay poster="hero.jpg" width="1920" height="1080">
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

## Long lists

Render what's visible: virtualize long lists (TanStack Virtual), or let the browser skip off-screen sections with `content-visibility: auto` plus `contain-intrinsic-size`. Endless carousels from a few items are in the `ui-animation` skill's PATTERNS.md.

## Real DOM or canvas

Real elements keep accessibility, text selection, find-in-page, SEO, CSS styling and native lazy loading; CSS 3D transforms on real elements go further than most expect (rings, coverflow, a helix of cards). Reach for canvas or WebGL when the count is in the thousands, when every pixel is computed (particles, shaders), or when the DOM's layout cost is the measured bottleneck, and then rebuild what you gave up (an accessible list, focus handling, alt text).

## Bundle

Load heavy, rarely used components with a dynamic `import()` on the route that needs them; animation-library bundle size is in the `ui-animation` skill's PERFORMANCE.md.

## Prove it

Record the page load and the main interactions in the Performance panel with 4x CPU slowdown and network throttling: the shell paints before any data, hovering a link then clicking shows the next page with no placeholder, going back shows the previous page instantly, no spinner appears for data, the largest image arrives early, no layout shift when media loads, only visible videos play, and long lists render only what's on screen.
