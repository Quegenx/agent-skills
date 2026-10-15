# Media, lists and rendering in the browser

A page feels slow when media arrives late or shifts the layout, long lists render everything, or the main thread is busy when someone taps. Measure first (the Performance panel's frames and long tasks, INP for interactions, LCP and CLS for loading; [MEASURE.md](MEASURE.md)), then fix in this order.

## Animation

Which properties to animate, GPU versus main thread, motion values instead of React state, interruptible and shared-element transitions, and reduced motion are in the `ui-animation` skill (PERFORMANCE.md and PATTERNS.md).

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

Record the page load and the main interactions in the Performance panel with 4x CPU slowdown: the largest image arrives early, no layout shift when media loads, only visible videos play, and long lists render only what's on screen.
