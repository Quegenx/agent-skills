# Animation and media in the browser

A page feels slow when frames drop during motion, media arrives late or shifts the layout, or the main thread is busy when someone taps. Measure first (the Performance panel's frames and long tasks, INP for interactions, LCP and CLS for loading; [MEASURE.md](MEASURE.md)), then fix in this order.

## Animate what the compositor can move

- **Only `transform` and `opacity` (and usually `filter`) animate without layout or paint.** Animating `width`, `height`, `top`, `left`, `margin` or `font-size` recalculates layout every frame for the element and often everything after it. Move with `translate`, resize with `scale` (counter-scale children if their content must not stretch), reveal with `clip-path` or `opacity`.
- **Animations that run on the compositor keep running when the main thread is busy.** CSS transitions, CSS animations and the Web Animations API on transform and opacity do; an animation that writes a style from JavaScript on every frame stutters the moment a long task runs. Libraries differ in how much they hand to the compositor: Motion (14.2 and later) runs independent transforms, including separate x, y, scale and rotate animations started at different times or with springs, hardware accelerated through `animate` and `motion` components.
- **Independent transforms:** the CSS `translate`, `rotate` and `scale` properties animate separately from each other, but not per axis; animating x and y on different timings in plain CSS needs composite animations, which compose in start order. Use a library that keeps each value separate when moves overlap.
- **Keep the transform function list identical across keyframes** (`translate(...) rotate(...) scale(...)` in every keyframe). When the lists differ, the browser interpolates through matrices, and a turned card swings along an unexpected path instead of rotating. The same rule applies to any blend you write yourself: interpolate position, each rotation, scale and opacity separately, angles the short way round.
- **`will-change: transform` only on elements about to animate,** removed afterwards; every promoted layer costs memory, and promoting everything makes scrolling worse.
- **Don't re-render to animate.** In React, a value that changes every frame belongs in a motion value or a ref that writes the style directly (`useMotionValue`, `useTransform`, `useScroll`), not in state: state re-renders the component tree 60 times a second.

## Motion that reads as one change

- **Interruptible:** a new target starts from the current value and velocity, mid-flight, never from the previous rest position (springs do this; CSS transitions retarget from the current value, keyframe animations restart). A menu that snaps back before reopening feels broken.
- **One direction for a group:** when a list reorders, a grid re-flows or a panel opens, items should move together (all left, all outward), never cross each other's paths. Keep each layout ordered the same way so a change of layout can't produce crossing paths.
- **Shared elements instead of fade-and-replace:** a thumbnail growing into its detail view tells the user where the content went. Use the View Transitions API (`document.startViewTransition`, with `view-transition-name` on both elements) or measure-then-animate (FLIP: record the first box, apply the change, record the last, animate the transform from first to last).
- **Respect reduced motion:** with `prefers-reduced-motion: reduce`, replace movement (slides, zooms, parallax) with opacity changes and keep the feedback. Motion's `MotionConfig reducedMotion="user"` does this across an app; its default is `"never"`, so set it.

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

## Long lists and endless strips

- **Render what's visible:** virtualize long lists (TanStack Virtual), or let the browser skip off-screen sections with `content-visibility: auto` plus `contain-intrinsic-size`.
- **An endless carousel doesn't need endless items:** place each item by its offset from the focus wrapped into a window around it, and fade items out at the window's edges, so the one that jumps from one end to the other is invisible while it jumps.

## Real DOM or canvas

Real elements keep accessibility, text selection, find-in-page, SEO, CSS styling and native lazy loading; CSS 3D transforms on real elements go further than most expect (rings, coverflow, a helix of cards). Reach for canvas or WebGL when the count is in the thousands, when every pixel is computed (particles, shaders), or when the DOM's layout cost is the measured bottleneck, and then rebuild what you gave up (an accessible list, focus handling, alt text).

## Bundle

Import only the parts you use: animation libraries split features (Motion's `LazyMotion` with `domAnimation` and the `m` component starts at about 4.6 kB instead of the full `motion` component); load heavy, rarely used components with a dynamic `import()` on the route that needs them.

## Prove it

Record the interaction in the Performance panel with 4x CPU slowdown: no long tasks during the animation, no layout or paint in the animation frames, and no layout shift when media loads. Toggle reduced motion and check that movement becomes fades while feedback remains.
