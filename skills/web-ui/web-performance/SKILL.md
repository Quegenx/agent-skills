---
name: web-performance
description: "Measures and improves browser loading and interaction performance: loading boundaries, media and lists, main-thread scheduling, interaction traces, React profiling evidence and Lighthouse gates. Use when a page loads slowly, typing or scrolling stalls, layout shifts, an interaction needs profiling, or a Lighthouse result or performance budget needs review."
---

# Web performance

Measure the page or interaction, connect the recorded work to its source, then change the part that costs time. Sources are the existing browser guides below: Florian Kiem's loading demos, kciter.so's main-thread article, Vercel's performance rules, React Doctor's performance skill, Lighthouse and Lighthouse CI, with the linked browser and framework documentation and existing source corrections preserved.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Choose the page-loading, responsiveness, tracing or lab-gate task | [SKILL.md](SKILL.md) |
| Loading boundaries, prefetching, fonts/scripts, images/video, layout shifts, long lists, DOM/canvas and tab icons | [BROWSER.md](BROWSER.md) |
| Long tasks, yielding, batching, priorities, layout reads/writes, scrolling and Web Workers | [MAIN-THREAD.md](MAIN-THREAD.md) |
| Record one interaction, distinguish browser and React work, connect timing to source and compare a fix | [RUNTIME-TRACE.md](RUNTIME-TRACE.md) |
| Read Lighthouse scores and audit IDs, configure assertions and budgets, manage variance and report storage | [LIGHTHOUSE-CI.md](LIGHTHOUSE-CI.md) |

## The rules

1. **Start with one reproducible flow and its evidence.** Record the URL, actions, expected result, build mode and capture limits through the [interaction trace](RUNTIME-TRACE.md#define-the-interaction). A render count alone is not a defect. [React Doctor, performance]
2. **Keep the shell and independent regions available while data arrives.** Use the [loading-state workflow](BROWSER.md#loading-states) for boundaries, prefetching, cached visits and media. Preserve the source's measured conditions and the owner's production design choices. [existing performance-and-caching, BROWSER.md, Loading states]
3. **Shape work around the main thread.** Use the [task-splitting](MAIN-THREAD.md#split-long-tasks), batching and Worker guidance for the measured bottleneck; yielding improves responsiveness while adding overhead. [kciter.so, The Browser's Main Thread Is Expensive]
4. **Name the measurement the capture actually provides.** Follow the [signal definitions and tool limitations](RUNTIME-TRACE.md#what-each-signal-means), including the difference between summed layout shifts and field CLS. [React Doctor, performance; https://web.dev/articles/cls]
5. **Use version-matched lab gates and repeated measurements.** Follow [Lighthouse's audit-ID and variance rules](LIGHTHOUSE-CI.md), then confirm the result with field data. A single lab run is a quick look. [lighthouse-ci, configuration.md, troubleshooting.md; Lighthouse, docs/variability.md]

## Related owners

- Server timing, query plans, cache validity/invalidation and Vercel production metrics: [performance-and-caching](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/SKILL.md).
- React, Next.js and React Native semantics: the [global React skill](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/react/SKILL.md). Motion and compositor choices: [ui-animation](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md).

## Gotchas

- A generated chunk name identifies browser work, not the source component that owns it; trace that ownership before reporting a fix. [React Doctor, performance]
- Production timing and development/profiling component evidence have different overhead and availability; label the build used for each. [https://react.dev/reference/dev-tools/react-performance-tracks]

## Prove it

The selected topic's checks pass for the work performed. A trace names the exact flow, build and viewport, retains capture warnings and ties each finding to a source line in that flow. A fix uses comparable before/after evidence without moving useful work outside the recording or regressing behavior/accessibility. Lighthouse assertions name IDs present in the pinned version's report. [React Doctor, performance; lighthouse-ci, configuration.md]
