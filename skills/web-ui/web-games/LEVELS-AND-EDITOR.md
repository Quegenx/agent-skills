# Level data and isolated editor drafts

Use this for level authoring or a game map editor. Authored data, production builders and draft editing have different ownership: a draft can preview a world without becoming a second production world or modifying the player's save. [MengTo/Skills, author-game-levels; build-game-map-editor, SKILL.md and references/vesperfall-implementation.md]

## Author playable space

[MengTo/Skills, author-game-levels]

- Keep stable authored data distinct from visual geometry, collision, navigation and encounter zones. Connect them by stable identifiers and declared adapters rather than discovering gameplay semantics from rendered meshes.
- Check movement, camera and dodge routes, early threat visibility and exits. Gates and encounter completion need explicit reset/reward paths and cannot strand the player without a valid route.
- Inventory local lights: each has an owner, a visible emitter or declared source, an attachment and a disable/disposal lifecycle. Describe ambient illumination separately instead of treating it as an untracked point light.
- The source's flat-world ARPG profile prohibits gameplay elevation and validates its plane/route constraints. Apply that restriction only when this is the selected project profile; other games can declare different elevation and navigation rules.

## Preview production through adapters

[MengTo/Skills, build-game-map-editor]

- Use the real production builders in an explicitly paused editor preview, through adapters for data and selection. Preview must not run combat, grant rewards or write player saves.
- Draft data is isolated, versioned and visibly labeled as draft. Editing creates a validated export proposal; source integration is a separate reviewed operation.
- Build the editable manifest from current production content, with stable IDs, item kinds and zone ownership. Reject unknown/stale identities, invalid combinations and nonfinite or out-of-range values at the draft boundary.
- A source-owned property becomes editable only when a validated writeback path exists. A control that changes the preview but cannot export the same result is not finished.
- The source reference's specific project paths, entity IDs, schema, timing and export location are examples. Preserve the actual game's contract rather than copying those identifiers.

## Make selection and history predictable

[MengTo/Skills, build-game-map-editor]

- Use selection proxies where visual geometry is unsuitable. Drag against the intended ground plane, preserve the initial pointer offset, apply the selected snapping rule and release pointer capture on completion or cancellation.
- One complete drag contributes one undo entry. Bounded immutable history restores a complete draft; a new edit after undo invalidates redo.
- Restore the draft before enabling autosave, and keep draft/content versions explicit so a stale restore or export cannot silently overwrite newer content.
- Focus happens from an intentional focus action. Do not automatically retarget the camera while a user types, and do not zoom out when the current view is already closer than the proposed focus distance.
- Draw AI/navigation overlays in world space against the same authored data. A screen decoration is not evidence of the actual walkable route or encounter zone.
- Reset is explicit and confirms the affected draft. Teardown releases editor-owned resources and listeners without disposing shared production assets still in use.

## Keep editor access distinct from obscurity

[MengTo/Skills, build-game-map-editor, references/vesperfall-implementation.md]

The source combines project-specific network restrictions and a signed-cookie recipe. A private URL and `noindex` do not authenticate a user. Do not transplant exact-IP, proxy-header or custom HMAC-cookie details into a new application; use the application's actual authentication and trusted-proxy contract. Preview/draft isolation still applies after access is granted.

## Prove it

A production level and its draft preview agree through the declared adapter, while editing changes no gameplay state or save. Selection, snapping, canceled drag, undo/redo, restored draft and reset yield the declared complete state; export rejects stale/invalid content and reproduces the intended edit. Routes, collision, navigation, encounters and light ownership match the chosen level profile. Report access and runtime checks actually performed. [MengTo/Skills, author-game-levels; build-game-map-editor]
