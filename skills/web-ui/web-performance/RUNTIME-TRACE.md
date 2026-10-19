# Trace one slow interaction

One interaction, recorded in the browser and read end to end: what the user did, which long animation frames it produced, what the browser and React did inside them, and which source line owns the cost. The method is React Doctor's `performance` skill ([React Doctor, performance]; millionco/react-doctor, © 2026 Million Software, Inc., Modified MIT License), each browser fact checked against the W3C, MDN, web.dev, Chrome and react.dev page linked beside it. It works with any recorder: React Doctor's `scan`, the DevTools Performance panel, or chrome-devtools-mcp's `performance_start_trace` ([pixel-reverse-engineer INSPECTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/pixel-reverse-engineer/INSPECTION.md) in pixel-reverse-engineer). Loading, media and lists are in [BROWSER.md](BROWSER.md), fixes for a busy main thread in [MAIN-THREAD.md](MAIN-THREAD.md), server and benchmark timing in [performance-and-caching MEASURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/MEASURE.md).

"Measure one reproducible interaction, connect browser work to React renders, and report only conclusions supported by the trace." [React Doctor, performance]

## Define the interaction

[React Doctor, performance] Before recording:

1. Identify the target URL
2. Write the exact actions to reproduce
3. Choose the expected result
4. Confirm whether authentication is required

"Use a production build when available. Development builds add framework work that can distort render and script timings. If you must measure a development build, label that limitation in the report."

The catch is that React's own evidence lives in the other builds ([react.dev: React Performance tracks](https://react.dev/reference/dev-tools/react-performance-tracks)): the tracks are "enabled by default" in development; the profiling build enables only the Scheduler tracks (Components only inside `<Profiler>` or with the React DevTools extension); in production they are "disabled … by default" because the instrumentation "adds some additional overhead". The profiling build comes from importing `react-dom/profiling` instead of `react-dom/client` (the docs suggest a bundler alias). So take the timings from a production build and the component evidence from a profiling or development build, and say in the report which number came from which.

## Record it

[React Doctor, performance] "Run the scan in an interactive terminal":

```bash
npx react-doctor@latest scan http://localhost:3000 --format json
```

"React Doctor opens an isolated Chrome profile. Perform the planned interaction while purple outlines identify rendered components. Press Enter after the interaction settles; recordings stop automatically after five minutes." "Agents must always pass the explicit URL so automated runs never wait for input."

The package itself (react-doctor 0.9.18, `dist/cli.js` and `dist/runtime-scan/browser-probe.iife.js`) confirms the five-minute stop (`RUNTIME_SCAN_MAX_RECORDING_DURATION_MS = 300 * 1e3`), records in a browser 1440 px wide (`RUNTIME_SCAN_BROWSER_WIDTH_PX`), and keeps at most 2,000 component events (`RUNTIME_SCAN_MAX_COMPONENT_EVENTS`); the rest are the "dropped component events" the report warns about. Its probe observes `long-animation-frame`, `event` (with `durationThreshold: 16`, skipping entries whose `interactionId` is 0), `layout-shift`, `largest-contentful-paint` and `measure` (React's `detail.devtools.track` entries), all with `buffered: true`.

For a signed-in session, connect over the Chrome DevTools Protocol (CDP):

```bash
npx react-doctor@latest scan https://app.example.com \
  --cdp http://127.0.0.1:9222 \
  --format json
```

- **Tracing covers the whole browser:** "Use a dedicated debug profile for CDP because Chrome tracing is browser-wide. Sign in, close every non-blank tab, and then start the scan." "Never request cookies, copy a browser profile, or close an externally managed browser." (Cookies as credentials: [browser-automation SIGNED-IN-SESSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-automation/browser-automation/SIGNED-IN-SESSIONS.md).)
- **The trace is sensitive data:** "The compressed `.json.gz` trace can contain URLs, source paths, and application behavior. Keep it local unless an upload is explicitly approved."

## Read it in this order

[React Doctor, performance]

1. **Capture support**: confirm React detection, build type, React tracks, and Long Animation Frame support
2. **User impact**: inspect the worst interaction, total blocking duration, Largest Contentful Paint (LCP), and Cumulative Layout Shift (CLS)
3. **Browser work**: inspect long frames and script hotspots for event handling, JavaScript, style, layout, and paint cost
4. **React work**: inspect component render count, total self time, and maximum self time
5. **Capture limits**: read every warning, especially dropped event counts

Interpretation rules:

- A high render count is evidence, not a defect. Pair it with duration and user impact
- Generated chunk names identify browser work, not the owning source component
- A slow interaction can be browser-bound even when every component render is cheap
- Repeated Event Timing records with one interaction identifier represent one interaction
- Dropped component events make hotspot totals incomplete
- Use purple labels to identify the active subtree, then use recorded timings to set severity

The render outlines locate the work; only the timings rank it.

## What each signal means

### Long Animation Frames

[MDN: Long animation frame timing](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Long_animation_frame_timing), [Chrome: Long Animation Frames API](https://developer.chrome.com/docs/web-platform/long-animation-frames)

- **A long animation frame is "a rendering update that is delayed beyond 50ms".** Its `blockingDuration` is the sum, over the long tasks in it above 50 ms, of each one minus 50 ms, with the rendering time added to the longest. `firstUIEventTimestamp` "can be before the start of this animation frame". The frame carries `renderStart` and `styleAndLayoutStart`; each script carries `forcedStyleAndLayoutDuration` and `pauseDuration` (`alert`, synchronous XHR).
- **Chromium only:** shipped in Chrome and Edge 123, not supported in Firefox or Safari. A Firefox or Safari repro has no long-frame evidence; check `PerformanceObserver.supportedEntryTypes.includes("long-animation-frame")` before relying on it.
- **Use an observer, not the buffer:** the `"long-animation-frame"` buffer holds 200 entries, then drops new ones.
- **Script attribution points at the entry point, not the costly function.** Each script has `sourceURL`, `sourceFunctionName`, `sourceCharPosition`, `invoker` and `invokerType` (`user-callback`, `event-listener`, `resolve-promise`, `reject-promise`, `classic-script`, `module-script`). Only scripts "longer than 5 milliseconds" are listed. A no-cors cross-origin script gives only `sourceURL` until it is loaded with `crossOrigin="anonymous"`, and cross-origin iframes, workers and extensions are not attributed. This is why a generated chunk name identifies browser work and not the component that owns it.

### Event Timing and interactions

[MDN: PerformanceEventTiming](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceEventTiming), [W3C Event Timing](https://w3c.github.io/event-timing/)

- **Thresholds:** entries appear by default when `duration` is 104 ms or more; the smallest `durationThreshold` is 16 ms; `duration` is "rounded to the nearest 8ms". Baseline 2025, newly available since December 2025.
- **One interaction, several records:** the spec says "we compute a new interaction ID and set it on both the pointerdown and the pointerup (and later, the click if it occurs)", and a keyup matches its keydown. `interactionId` "is 0 unless" the event type qualifies, so group by `interactionId` and drop the zeros.

### INP

[web.dev: Interaction to Next Paint](https://web.dev/articles/inp)

Good is 200 ms or less, poor is above 500 ms, judged at the 75th percentile, split by mobile and desktop. Only clicks, taps and key presses count (not hover, scroll or zoom). The value is the worst interaction, except that one highest interaction is ignored for every 50. Each interaction has three phases: input delay, processing duration, presentation delay.

### Linking an interaction to its frames

"There is no direct API to link an INP entry with its related LoAF entry or entries" ([Chrome](https://developer.chrome.com/docs/web-platform/long-animation-frames)): match them by start and end times, and expect that "it's possible for an INP event to span two LoAFs". Then [React Doctor, performance]: "Open the DevTools trace when the summary cannot explain a long frame. Correlate the interaction timestamp with script tasks, style or layout work, React tracks, and paint. Do not infer causality from neighboring timestamps alone."

### Layout shift: the tool's CLS is not web.dev's CLS

[web.dev: Cumulative Layout Shift](https://web.dev/articles/cls) defines CLS as the largest session window (shifts less than 1 s apart, a window at most 5 s long), not a sum; shifts within 500 ms of discrete input carry `hadRecentInput`. Good is 0.1 or less, poor above 0.25.

React Doctor 0.9.18's probe instead adds up every `layout-shift` value without `hadRecentInput` across the whole recording (`cumulativeLayoutShift += layoutShiftEntry.value`). Over a long recording that number is an upper bound and can exceed the field CLS. Report it as "total layout shift during the recording", never as CLS. Per-region shift tracking is in [BROWSER.md](BROWSER.md#layout-shift).

### LCP inside an interaction recording

The same probe takes LCP as the largest `startTime` among the recording's `largest-contentful-paint` entries (observed with `buffered: true`). [web.dev: Largest Contentful Paint](https://web.dev/articles/lcp): "The browser will stop reporting new entries as soon as the user interacts with the page (via a tap, scroll, or keypress)", so the number describes the page load before the first input, not the recorded interaction.

## Connect measurements to source

[React Doctor, performance] "Search the repository for measured component display names and event handlers. Confirm that each candidate runs in the recorded flow before reporting it."

"Do not pad the report with static lint findings. Include source findings only when runtime evidence connects them to the tested flow." React Doctor's agent playbook says the same of its own rules: "Performance findings are hypotheses unless the rule proves a correctness bug. Do not infer slowness from syntax. Establish whether the bottleneck is network/server, shipped JavaScript, React render/commit, effects, style/layout/paint, memory, or third party." [React Doctor, react-doctor-agent playbook]

## Report findings

[React Doctor, performance] Use this structure:

```markdown
## Flow tested

tested_url, build_type, and exact_interaction

## Verdict

one_evidence_backed_paragraph

## Evidence

| Signal            |                  Measurement | Interpretation  |
| ----------------- | ---------------------------: | --------------- |
| Worst interaction |                  duration_ms | measured_cause  |
| Total blocking    |                  duration_ms | measured_scope  |
| Top component     | render_count and duration_ms | measured_impact |

## Findings

1. `path/to/component.tsx:42`: measured_problem, evidence, and smallest_fix

## Limits

capture_warnings, missing_support, or environmental_caveats
```

Name the layout-shift row "total layout shift during the recording" when it comes from React Doctor, and list a missing Long Animation Frame capture (Firefox, Safari) under Limits.

## Validate a fix

[React Doctor, performance] "Do not edit code unless code changes are requested. After a fix:"

1. Rebuild with the same mode
2. Record the same interaction at the same viewport
3. Run three before and three after samples when timing variance could change the conclusion
4. Compare medians for interaction, blocking, and component duration
5. Confirm behavior and accessibility did not regress

"Reject improvements that only move work outside the recorded window or disable useful behavior." The server-side version of the same trap is in [performance-and-caching MEASURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/MEASURE.md#compare-honestly).

## Prove it

The report names the URL, build type and exact interaction; says whether Long Animation Frames and React tracks were captured; groups Event Timing records by `interactionId`; matches every cited long frame to the interaction by time, not by proximity alone; calls a summed shift "total layout shift during the recording"; ties every finding to a `file:line` that ran in the recorded flow; and, after a fix, shows the medians of three before and three after samples recorded in the same build mode and viewport.
