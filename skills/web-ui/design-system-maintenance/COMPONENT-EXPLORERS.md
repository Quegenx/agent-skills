# Explore real components on a canvas

Build a local explorer around existing components through their public APIs. Sources: the supplied `component-canvas` and `create-canvas` skills. This is a development surface, not a new component system. A single component's reachable states remain in [STATE-PAGE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/STATE-PAGE.md); alternative designs and promotion after a pick remain in [VARIANTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/VARIANTS.md).

## Choose the canvas's job

[component-canvas, SKILL.md, Layout, Variants and Persistence; create-canvas, SKILL.md, Keep content in source and Save layout, not content]

| Job | Content and layout | Saved state |
|---|---|---|
| Component comparison | Fixed groups of requested components and supported variants; groups do not drag and must not overlap after expansion | Camera only; reset keeps preview input |
| Freeform exploration | A source registry of named live previews, each with a stable ID, dimensions, initial position and separate move handle; intentional overlap is allowed | Camera, supported theme preference and positions keyed by current registry IDs |

Keep membership, names, dimensions and implementations in source. Browser storage does not create, hide, duplicate or delete items. A request to try another version preserves the original and gives the new version its own ID and state; a request to change one version updates it in place. Do not add a runtime editor, connectors, resizing, snapping or undo unless requested. [create-canvas, SKILL.md, Keep content in source and Keep the workspace quiet]

## Start with one safe preview

[component-canvas, SKILL.md, Ground rules, Before building and Safety for previews; create-canvas, SKILL.md, Start with the project and Preserve live content]

- Read routes, component APIs, providers, tokens, existing themes and access controls. Reuse an existing explorer before creating one. Keep canvas code together and production components independent of it.
- Before mounting, supply synthetic data, mock services, safe providers or existing callbacks that prevent real requests and writes. Omit an unsafe example and explain the missing isolation. An iframe or separate document alone does not isolate data or effects.
- Start with one group and one live component, then grow the requested content and controls. Do not patch component source, exports, hooks, styles, browser APIs, rendered preview DOM or portal roots to make the canvas work.
- Keep experiments local to the canvas. Moving them into the product or exposing the explorer publicly requires the corresponding user request.

## Compare one thing at a time

[component-canvas, SKILL.md, Variants]

- Read supported prop axes and reachable states. Show useful composition and content cases; list omissions rather than inventing variants or generating the entire prop cross product.
- Change one prop while holding wrapper, data, text, icons, theme and spacing constant. Size or placement comparisons keep one style; style comparisons keep the size and content.
- Use real pointer and keyboard input for hover, focus and pressed behavior. The supplied `lab/lab.js` rewrites CSS selectors to approximate states; those forced selectors are visual fixtures, not proof that the browser entered the native state. [lab, SKILL.md and lab.js, forceStates]
- Keep disabled and read-only examples faithful. Portal examples use the component's real trigger and public options; do not force several modal dialogs open together.

## Preserve preview behavior

[component-canvas, SKILL.md, Interactions and Camera; create-canvas, SKILL.md, Preserve live content and Keep gestures separate from preview input]

- Clicking, typing, selection, focus, native shortcuts and nested scrolling still work. Moving a preview, copying its name, changing the camera or changing theme must not remount it or erase its draft.
- Canvas shortcuts belong to the shell. Space-to-pan must not steal Space activation from a focused control; preview arrow keys, Escape and undo remain native.
- Start ordinary pan on empty space. In a freeform workspace, a separate handle moves an item in canvas coordinates at the current zoom; the preview body stays interactive. Provide keyboard movement of the handle.
- Keep portals in their native roots at screen-space size and let the library own positioning and modal focus. Check alignment and hit areas under zoom. If transforms break them, report the limit or propose a separate preview document through a public container API.
- Handle navigation in the host: links to canvas items reveal them with the camera; define external navigation without changing component links or router internals.

## Camera and saved layout

[component-canvas, SKILL.md, Camera and Persistence; create-canvas, SKILL.md, Keep gestures separate from preview input and Save layout, not content]

- Zoom around the pointer; button and keyboard zoom use the viewport center. Keep fit-all and reset-camera controls named and reachable when content is offscreen. Reveal offscreen keyboard focus through camera movement.
- Fit measured content bounds after layout settles, including labels and handles. Fitting moves the camera, not the items. Ignore temporary containment placeholders when measuring.
- Track gesture ownership, pointer count changes, cancellation, lost capture, window blur and hidden tabs. Release captures and remove listeners, observers, timers and animation frames on teardown; restore document styles the canvas changed.
- Combine transforms into at most one write per animation frame. Keep active gesture values outside component-wide state, batch bounds reads, and avoid preview rerenders or synchronous storage writes per pointer event.
- Use a bounded, versioned, project-specific storage document with finite camera and position limits. Reconcile saved positions against current IDs, ignore stale IDs and always show new source entries. Handle malformed data, unavailable storage and quota failure without losing the explorer.
- Reset the camera without clearing membership, positions or preview drafts. Save no executable components, secrets, account data or form contents. Drafts need not survive reload unless requested.

## Prove it

Open the route and exercise the actual component at several zoom levels and widths: inputs, selection, shortcuts, nested scroll, portals, modal focus, focus reveal, fit and reset. Cancel gestures and change pointer count. Reload with current, stale and invalid saved layout; new registry entries remain visible and reset preserves a typed draft. Confirm component source stayed unchanged and previews made no real writes. Profile a representative populated canvas before claiming smoothness; name the preview count, browser and device. Compilation does not establish those results, and unavailable touch or trackpad checks stay unverified. [component-canvas, SKILL.md, Checks; create-canvas, SKILL.md, Test and report honestly]
