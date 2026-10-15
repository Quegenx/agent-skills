# Performance: smooth on a slow phone

At 60 Hz a frame is 16.7 ms and the browser keeps part of it: budget about 10 ms of your work per frame, less on 120 Hz screens.

## Move only what the compositor can move

- **`transform` and `opacity` (and usually `filter`) animate without layout or paint.** Animating `width`, `height`, `top`, `left`, `margin`, `padding` or `font-size` recalculates layout every frame, often for everything after the element. Move with `translate`, resize with `scale` (counter-scale content that must not stretch, or let Motion's `layout` do it), reveal with `clip-path` or `opacity`. One measured case dropped half its frames animating `top`/`left` and about 1% with transforms.
- **Compositor animations survive a busy main thread.** CSS transitions and animations and the Web Animations API on transform and opacity keep running during a long task; JavaScript that writes styles every frame stutters the moment the page does other work. Motion (14.2 and later) runs independent transforms (x, y, scale and rotate animated separately, started at different times or with springs) hardware accelerated through `animate` and `motion` components.
- **Independent transforms:** the CSS `translate`, `rotate` and `scale` properties animate separately from each other but not per axis; animating x and y on different timings in plain CSS needs composite animations, which compose in start order. A library that keeps each value separate avoids that.
- **Keep the transform function list identical across keyframes** (`translate(...) rotate(...) scale(...)` everywhere). When the lists differ, the browser interpolates through matrices, and a turned card swings along an unexpected path.
- **`will-change: transform` only for a measured problem,** on elements about to animate, removed afterwards; every promoted layer costs memory, and promoting everything makes scrolling worse.

## React: animate without re-rendering

- A value that changes every frame lives in a motion value (`useMotionValue`, `useTransform`, `useSpring`, `useScroll`) or a ref that writes the style, never in state: state re-renders the component tree on every frame.
- Don't animate by toggling classes in a loop or reading layout (`getBoundingClientRect`, `offsetHeight`) inside an animation frame after writing styles: a read after a write forces layout. Read everything first, then write.
- Hundreds of animated items: animate a container, or only the visible ones; virtualize the rest.

## Reduced motion

- Respect `prefers-reduced-motion: reduce`: slides, zooms, parallax and large movements become 100-150 ms opacity cross-fades; colour and state changes stay; nothing becomes unreachable or invisible.
- In Motion, wrap the app in `<MotionConfig reducedMotion="user">`, which turns off transform and layout animations while keeping opacity and colour. The default is `"never"`, so the user's setting is ignored until you set it.
- In CSS: `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms; transition-duration: 150ms; } }` is a blunt fallback; better, write the reduced version of each animation deliberately.
- Autoplaying motion that lasts more than five seconds (carousels, background video, looping animations) needs a pause control.

## Bundle

Motion's `LazyMotion` with `domAnimation` and the `m` component starts at about 4.6 kB instead of the full `motion` component; load `domMax` (drag, layout) only where it's used. Heavy effects (3D galleries, Lottie, WebGL) load with a dynamic `import()` on the screen that needs them.

## Measuring

The Performance panel with 4x CPU slowdown: record the interaction and look at the animation frames for long tasks, Layout and Paint entries. The Rendering tab's "Paint flashing" and "Layer borders" show what repaints and what got its own layer. Interaction responsiveness is INP: an animation that starts late because a click handler did heavy work first is an INP problem, not an animation one; respond visually first, then do the work.
