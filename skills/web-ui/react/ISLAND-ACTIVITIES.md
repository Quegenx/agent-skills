# Optional islandcn live activities

Use this integration when the requested interface already calls for an islandcn activity. It is not a replacement for the product's status or notification design. Sources: the supplied `islandcn/SKILL.md`, checked against the [engine README](https://github.com/opencoredev/islandcn/blob/main/lib/island/README.md) and [registry definitions](https://github.com/opencoredev/islandcn/blob/main/registry/presets.json). Existing `app-ui`, `landing-page-ui` and `agent-chat-ui` decisions remain authoritative.

## Install only the selected layer

[islandcn, SKILL.md, Set up the engine; engine quick start](https://github.com/opencoredev/islandcn/blob/main/lib/island/README.md)

- Look for the engine under the project's `lib` alias and an existing `IslandProvider` before adding another. The documented engine setup requires React 19 and a shadcn-configured project; use the project's actual aliases.
- `island-core` writes the engine into `lib/island/`. Its registry has no extra npm dependencies; the engine uses React and React DOM.
- The content kit is separate. The supplied skill first says it adds no packages, then names its Hugeicons dependencies. The current registry confirms `island-content` installs `@hugeicons/core-free-icons` and `@hugeicons/react`; do not describe the whole kit as dependency-free. Read the selected item's transitive registry dependencies before installing it. [registry/presets.json](https://github.com/opencoredev/islandcn/blob/main/registry/presets.json), [registry/engine.json](https://github.com/opencoredev/islandcn/blob/main/registry/engine.json)
- Mount the provider above components that start activities. In Next App Router, the provider belongs in a client component rendered by the layout. `placement="viewport"` pins the island to the window; the default uses its positioned container.

## Connect real activity state

[islandcn, SKILL.md, Pick the presentations and Map the app's events; engine README, API, Hooks and Updates]

| State or event | Engine contract |
|---|---|
| No active task | `idle` |
| One active task | Its compact leading and trailing content |
| Two displayed tasks | Split presentation, with a minimal fallback when content cannot fit |
| More detail or an explicit action | Expanded content |
| Task starts | `start`, returning a handle with `update` and `end` |
| A value changes | In-place `update`; nested content merges |
| The content changes kind | `update` with `transition: "crossfade"` |
| A task ends | Show its actual final state, then `end` |

Give activities stable IDs and labels describing their actual state. Use `useIslandActions()` when only issuing actions; `useIsland()` also subscribes to activity and presentation changes. Call actions from an effect or event handler, not render. The optional content kit's `useActivity` binds an activity to a mounted component's lifetime. [islandcn, SKILL.md, Build the activity; engine README, Hooks]

Priority chooses the primary displayed activity, then start order. Activities sharing a `group` show one at a time; an alert or `expand(id)` can bring a hidden member forward. Use alerting updates for an event that needs notice, rather than routine progress; an approval that must remain open uses explicit expansion. These are library policies, not platform-wide notification rules. [engine README, Presentations and Groups; islandcn, SKILL.md, Pick the presentations]

## Preserve semantics and library motion

[islandcn, SKILL.md, Meet the quality bar; engine README, Interaction and accessibility]

- Supply compact content, a minimal fallback and expanded content for every reachable presentation. Check a second activity with long values; content fitting the main pill can still clip in the split capsule.
- Let the engine own the pill's shape and transition clock. Use its number and progress primitives for in-place changes rather than layering a competing shape animation over them.
- Give each activity a meaningful label. Check the actual button name, Enter/Space expansion, Escape collapse, content controls and focus return when expanded content disappears.
- The provider's reduced-motion default is `"user"`; use `useIslandReducedMotion()` for custom content. Verify the shape and content under the system setting rather than assuming a custom animation inherits it.
- The source's dimensions and spring fits are source-reported simulator measurements, not measurements of the current app or a universal device specification. Its controlled `IslandView` is a preview surface, not evidence that a task actually started or completed.

## Prove it

Start, update and end an activity from real app state. Exercise every reachable presentation, two simultaneous activities, group handoff, long content, keyboard controls, focus return and reduced motion at the app's supported widths. Report the actual checks and installed registry revision; a library demo or generated target image does not establish product behavior. [islandcn, SKILL.md, Meet the quality bar; engine README, Interaction and accessibility]
