# Live-source reconstruction workflow

The owner's supplied `pixel-reverse-engineer/SKILL.md`, steps 1 to 12. Use this after the [fidelity and no-defaults rules](SKILL.md#the-rules). The source implementation is the reference; adapt its implementation to the target project without redesigning its rendered appearance or behavior. [pixel-reverse-engineer, SKILL.md]

**Contents:** [1. Identify the target](#1-identify-the-target) · [2. Capture the live source](#2-capture-the-live-source) · [3. Extract CSS exactly](#3-extract-css-exactly) · [4. Extract JavaScript behavior](#4-extract-javascript-behavior) · [5. Identify source libraries](#5-identify-source-libraries) · [6. Assets](#6-assets) · [7. Build in the target project](#7-build-in-the-target-project) · [8. Responsive behavior](#8-responsive-behavior) · [9. Directionality and localization](#9-directionality-and-localization) · [10. Functional behavior](#10-functional-behavior) · [11. Verify against the source](#11-verify-against-the-source) · [12. Fidelity hierarchy](#12-fidelity-hierarchy) · [Prove it](#prove-it)

## 1. Identify the target

[pixel-reverse-engineer, SKILL.md]

Determine exactly what the user wants reproduced: a DOM selector, component, section, page, animation, interaction, or visual effect.

Port only the requested scope. Do not automatically clone unrelated sibling sections.

Include surrounding structure when it materially affects rendering, behavior, or selector resolution, including parent wrappers, clipping containers, background layers, preceding DOM siblings, structural-selector dependencies, canvas/shader layers, inherited CSS variables, route-specific backgrounds, layout wrappers, theme/context providers, or shared animation parents.

### Structural selectors

Before reproducing `nth-child`, `first-child`, `last-child`, adjacent sibling, or general sibling selectors, record the relevant parent's children in exact DOM order.

Structural selectors may depend on visually insignificant elements. Do not remove wrappers, separators, empty elements, or sibling elements until verifying they do not affect selectors, layout, painting, or behavior.

Here "empty elements" clarifies the source's "empty nodes": `:nth-child()` counts element siblings, including hidden elements, rather than text or comment nodes. This is a terminology clarification, not a claim that the source prescribed counting text nodes. [MDN :nth-child()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:nth-child)

## 2. Capture the live source

[pixel-reverse-engineer, SKILL.md]

Start from any HTML, URL, selector, or source information supplied by the user.

When a live page is available:

1. Fetch and inspect the rendered HTML.
2. Record the exact DOM structure of the requested target.
3. Identify generated or hashed classes.
4. Identify relevant stylesheet URLs.
5. Identify relevant JavaScript chunks.
6. Inspect inline styles and CSS variables.
7. Inventory custom attributes and custom elements.
8. Inventory SVGs, images, fonts, icons, and other rendered assets.
9. Identify external libraries responsible for visual or interactive behavior.
10. Inspect surrounding DOM affecting layout, clipping, backgrounds, selectors, inheritance, or animation.
11. Inspect route-, theme-, viewport-, and state-dependent behavior when relevant.

For generated or hashed classes, search source stylesheets until each relevant class maps to its actual rule. Do not infer generated-class styling from appearance alone.

### DOM inventory

Inventory every visual or behavioral node inside the target: text, controls, links, trailing elements, decorative wrappers, SVGs and paths, images, pseudo-element targets, empty layout elements, `data-*`, custom attributes/elements, visually hidden or initially transparent elements, animation-only elements, and measurement/layout nodes.

An invisible element may still participate in animation, measurement, clipping, or layout.

### Outside-the-target dependencies

Inventory dependencies outside the target that paint or control it: parent backgrounds, page gradients, sibling canvases, shaders, overlays, masks, inherited CSS variables, route-specific color maps, global styles, theme attributes, and shared animation containers.

Do not copy styling from another page merely because it looks similar. Trace the actual source dependency.

Do not download unrelated large binaries or linked resources not needed to render the target. Never copy credentials, private tokens, secrets, analytics identifiers, or unrelated production configuration.

## 3. Extract CSS exactly

[pixel-reverse-engineer, SKILL.md]

For every relevant selector, capture the complete rule and all contexts that modify it, including base/inherited styles, variables, pseudo-elements/classes, hover/focus/active/disabled/autofill/placeholder states, ancestor-driven states, sibling/child/structural selectors, media/container/feature queries, keyframes, transitions, transforms, masks, gradients, filters, backdrop effects, blend modes, clipping, overflow, stacking contexts, positioning, and relevant browser-specific behavior.

Preserve exact source values whenever available. Do not replace an extracted literal with an approximately matching design-system token. Use an existing token only when its resolved value and behavior are actually equivalent.

For the existing browser inspection recipes, route limitations and evidence labels, use [INSPECTION.md](INSPECTION.md). This workflow adds reconstruction; it does not duplicate those inspection mechanics. [pixel-reverse-engineer, SKILL.md]; [Jakub Krehel, explain-interface]

### Breakpoints

Preserve source breakpoints exactly as shipped. Never replace a source breakpoint with the target framework's nearest predefined breakpoint unless the resolved breakpoint is actually identical. Do not assume conventional breakpoint values.

### CSS variables

Resolve custom properties from their actual scope: root, theme, route/page, parent, component, state-dependent scopes, and media-query overrides. Do not guess. Trace the cascade.

### Selector relationships

Preserve ancestor hover/focus, group state, sibling relationships, structural selectors, pseudo-elements, nested selectors, state attributes, and data attributes. These often contain behavior missed when elements are inspected independently.

### Layout dependencies

Treat clipping, padding, negative offsets, masks, pseudo-elements, transforms, and overflow as relationships between boxes. Do not move a rule to a more convenient element unless rendered output and behavior remain identical.

## 4. Extract JavaScript behavior

[pixel-reverse-engineer, SKILL.md]

Inspect the JavaScript responsible for the target rather than recreating behavior from visual observation alone. Pretty-print relevant production chunks when necessary.

Record component state/transitions, handlers, validation, loading/success/error states, conditional rendering, timers/delays/intervals, animation sequences, mount/hover/exit animations, scroll/pointer/resize/intersection/visibility behavior, animation libraries, custom hooks, SVG/text/number morphing, measurement logic, and layout-dependent behavior.

Preserve exact timing and state behavior when extractable. Do not use conventional animation durations or framework defaults as substitutes.

### Animation extraction

Record the complete animation: every animated property, initial/target/intermediate values, duration, delay, easing, spring configuration, sequencing, overlap, stagger, repeat behavior/delays, direction, exit/interruption behavior, hover-in/out, mount, and unmount behavior.

Extract all values from the source. Never substitute remembered, conventional, framework-default, or previously observed values.

### Preserve animation semantics

Do not replace width, height, margin, positional, path, or layout-affecting animations with transforms merely for performance. Do not replace source semantics with layout/scaling/opacity approximations if rendered behavior changes. Fidelity takes precedence over optimization.

**Conflict, both views.** This source preserves the original animated properties when substitution changes the result. The generic motion rule says "Only transform and opacity move" ([ui-animation rule 7](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md#the-rules)). Retain that generic rule and report the concrete conflict before a conflicting recreation; do not silently rewrite the source animation or change a protected owner design. [pixel-reverse-engineer, SKILL.md]; [ui-animation, SKILL.md]; [owner standing rules]

### Animation sequences

When the source uses timelines, variants, imperative APIs, presence systems, or sequencing helpers, reproduce simultaneous, overlapping, relative-position, sequential, staggered, delayed, looping, mount, hover, trailing-child, and exit sequences.

Do not inspect only parent animation. Icons, labels, badges, SVG paths, and decorative children may move independently.

## 5. Identify source libraries

[pixel-reverse-engineer, SKILL.md]

Custom attributes/elements, generated wrappers, runtime behavior, imports, or bundled identifiers may reveal the library being used. Search those identifiers in source bundles/package ecosystem to determine what produces them.

Library-looking names are clues only, not assumptions. Never assume a library because it appeared in a previous task.

The [explanation-only inspection workflow](INSPECTION.md#explain-the-mechanism) says not to chase a library name from compiled output. Here a reconstruction may need a confirmed specialized dependency; a weak fingerprint remains an inference, not a confirmed identity. [pixel-reverse-engineer, SKILL.md]; [Jakub Krehel, explain-interface]

If a specialized library is responsible for behavior difficult or inaccurate to recreate manually, use it when appropriate. Preserve relevant props, timing/easing/spring configuration, locale, element type, sequencing, exported styles, host CSS, inline styles, custom-element styles, `::part(...)`, masks, CSS exports, and required DOM attributes.

Expose only parts/attributes actually required. Do not install a dependency merely because it exists in source if the target stack can reproduce behavior exactly; conversely, do not manually rewrite specialized behavior merely to avoid the library if fidelity suffers.

## 6. Assets

[pixel-reverse-engineer, SKILL.md]

Preserve source SVG markup/paths, logos, wordmarks, public image paths, background images, masks, icons, decorative assets, and fonts when relevant and legally/technically available.

Do not substitute similar target-project assets unless adaptation is requested or the original cannot legitimately/technically be used. Preserve SVG structure when paths/groups/masks/gradients/classes participate in animation.

## 7. Build in the target project

[pixel-reverse-engineer, SKILL.md]

Implement according to the target repository's architecture and existing conventions for naming, styling, hooks, utilities, assets, localization, state management, tests, and exports.

Keep components reasonably scoped. Split by responsibility/component boundaries rather than arbitrary line counts. Avoid unnecessary abstractions.

### Styling translation

Translate source CSS into the target styling system **without changing appearance or behavior**. Source and target styling systems need not match.

Use exact literals or arbitrary values when necessary. Do not force rules into target tokens/utilities if doing so changes the result. A dedicated local stylesheet is acceptable when clearer, safer, or more accurate.

### Existing components

Reuse target-project components only when they reproduce source geometry and behavior exactly. Do not force an existing button/card/typography/icon/layout primitive when built-in behavior alters the recreation. A local faithful implementation is preferable to approximate design-system reuse.

**Conflict, both views.** This source allows exact literals, arbitrary values and a faithful local component. The existing [design-file workflow](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/FROM-DESIGN.md#2-map-the-design-onto-the-project) instead maps unmatched values to the nearest existing token and says "Never add a token, a component variant or an arbitrary value to hit a number"; it reuses the project component variant. Keep that workflow's rule in its domain and report any concrete conflict. The owner's [app UI](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/SKILL.md), [landing page UI](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SKILL.md) and [agent chat UI](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-chat-ui/SKILL.md) retain their production designs unless the owner approves the specific change. Exact reconstruction of another component does not authorize changing them. [pixel-reverse-engineer, SKILL.md]; [Jakub Krehel, build-design]; [owner standing rules]

## 8. Responsive behavior

[pixel-reverse-engineer, SKILL.md]

Reproduce source breakpoints, wrapping, stacking, visibility, typography, spacing, image behavior, overflow, navigation, interactions, animation changes, and touch-specific behavior.

Do not assume desktop CSS scales down. Inspect source rules/runtime behavior for each relevant viewport condition. Do not invent responsive behavior absent from the source.

## 9. Directionality and localization

[pixel-reverse-engineer, SKILL.md]

Follow the target application's existing directionality/localization conventions.

If source or target supports RTL, prefer logical properties where appropriate, preserve physically anchored compositions, mirror directional icons/motion when necessary, and verify hover direction, alignment, and text flow.

Do not automatically introduce RTL/localization infrastructure. Do not rewrite source content unless requested. Distinguish application chrome from source data/content according to the target project's localization architecture.

## 10. Functional behavior

[pixel-reverse-engineer, SKILL.md]

For interactive components, reproduce visible behavior faithfully: forms, accordions, tabs, carousels, navigation, menus, loading, validation, success/error states, animated controls, hover/pointer/keyboard interactions, and other visible state transitions.

Do not blindly copy external production endpoints. For private backends, reproduce the frontend state machine using a local stub or target project's API layer unless the user provides an endpoint they control. Visible transitions, timing, validation, and flow should still match.

## 11. Verify against the source

[pixel-reverse-engineer, SKILL.md]

Do not consider the task complete immediately after implementation.

Verify:

### Structure
DOM hierarchy, wrappers, element order, structural-selector dependencies, pseudo-elements, trailing slots, data/custom attributes, hidden and animation-only elements.

### Visual fidelity
Width, height, padding, margins, gaps, alignment, positioning, typography, colors, borders, radii, shadows, gradients, opacity, masks, clipping, overflow, stacking, backgrounds.

### Motion
Initial state, mount, hover-in/out, active/focus, exit, delays, duration, easing, sequencing, overlap, stagger, loops, SVG/path/text/number animation, and child/trailing animations.

### Responsive behavior
Every relevant source breakpoint and responsive state, not desktop only.

### Outside dependencies
Backgrounds, gradients, canvases, shaders, inherited variables, theme state, and dependencies outside the immediate target when materially relevant.

### Runtime
No console errors, missing assets, hydration errors, broken imports, missing dependencies, animation conflicts, unintended clipping, or accidental layout shifts.

### Repository checks
The source recommends the repository's existing formatter, linter, type checker, relevant tests and build when appropriate, using its actual tooling/package manager. Apply the current task's authorization and repository policy: in this skills repo, do not run tests or builds unless asked; verification is reading plus `node --check` for changed `.js`/`.mjs` only. State which visual, interaction and runtime checks were not performed. [pixel-reverse-engineer, SKILL.md]; [owner standing rules]

Do not add disable comments merely to silence introduced problems. Fix underlying code while preserving source behavior.

## 12. Fidelity hierarchy

[pixel-reverse-engineer, SKILL.md]

When implementation choices conflict, prioritize:

1. **Rendered visual fidelity**
2. **Interaction and animation fidelity**
3. **Responsive fidelity**
4. **Correct source structure, assets, and content**
5. **Target repository compatibility**
6. **Maintainability**
7. **Implementation elegance**

Do not sacrifice visible 1:1 fidelity merely to be more idiomatic.

Do not replace unusual source behavior with a cleaner approximation because it is easier.

Do not copy irrelevant production implementation details when they have no effect on rendered result or behavior.

This hierarchy chooses between faithful implementations within the requested scope. It does not silently override the existing [domain-conflict rule](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/FROM-DESIGN.md#the-design-decides), accessibility requirements or protected owner designs: state both tagged positions, retain the existing rule and obtain the specific decision where they conflict. [pixel-reverse-engineer, SKILL.md]; [Jakub Krehel, build-design]; [owner standing rules]

The goal is:

> **Same pixels. Same motion. Same behavior. Native implementation for the target project.**

## Prove it

For the requested target, compare every relevant structure, visual, motion, responsive, outside-dependency and runtime item in [step 11](#11-verify-against-the-source) against the current source. Keep exact extracted values, list remaining unknowns and conflicts, and state which checks were actually performed. Do not claim identical pixels, motion or behavior from source inspection alone. [pixel-reverse-engineer, SKILL.md]; [Jakub Krehel, explain-interface]; [reverse-engineering, SKILL.md]
