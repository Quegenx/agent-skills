# Runtime assets, rigs and review catalogs

Use this when choosing or importing a character, separating equipment, defining clips/sockets, generating a model or exposing assets for review. The sources distinguish a reference, an immutable master and a runtime artifact that must work through the game's actual loader. [MengTo/Skills, build-hybrid-game-assets; build-rigged-game-assets; build-game-monster-system; build-vesperfall-review-assets; game-dev-character-model]

## Choose the asset's role

[MengTo/Skills, build-hybrid-game-assets; game-dev-character-model]

- Decide whether the deliverable is an imported rigged asset, a procedural socket-aware model, direct 2D interface art, a reference only or an explicitly selected reconstruction. A reference image is not evidence that a runtime mesh exists.
- Preserve source, licence and the immutable master. Keep unrigged and rigged files when both are generated; runtime conversion must not overwrite the only original.
- Requested rigged assets must retain their intended identity, skeleton and action roles. Do not silently substitute unrelated procedural primitives for an unavailable requested source asset; state the missing artifact and the selected fallback.

## Declare one import contract

[MengTo/Skills, build-rigged-game-assets; build-game-monster-system, references/monster-contract.md]

- Declare units, origin/root, forward/up axes, dimensions, skeleton, semantic joints/sockets, collision proxies and clip roles. Convert incoming assets at the import boundary.
- **Source conflict:** the monster contract uses `+Z` forward; the rigged-asset manifest uses `-Z`. These are alternative project conventions. Choose the actual project's contract and conversion, rather than applying both.
- Four normalized skin influences are a source runtime constraint, not a universal glTF or engine limit. Check the installed runtime's supported contract and inspect loaded weights.
- Clips carry stable IDs, semantic role, loop behavior, root-motion policy, contact markers and provenance. An animation-only GLB should not duplicate the character's meshes and materials.
- Keep gameplay footprint, collider and timing stable across visual LODs. A placeholder preserves dimensions, pivot, sockets, collision and timing, logs once and remains visibly nonproduction.

## Separate body, equipment and animation

[MengTo/Skills, build-rigged-game-assets; build-game-monster-system; game-dev-character-model]

- Character base body is separate from wearable equipment. Declare supported and unsupported slots; distinguish active and stowed roots; show a clean all-equipment-off state.
- Disclose missing body beneath generated/fused clothing. A fused generated character cannot provide arbitrary swappable equipment without splitting it or supplying a usable underlayer.
- Split monster parts where gameplay requires them, rather than forcing humanoid equipment structure onto every creature. Expose meaningful nonhumanoid joints and sockets.
- Keep stable skeleton/clip identity through import. The runtime loader owns its resources; use the canonical [Three.js disposal rules](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/webgl/THREEJS-AND-R3F.md#disposal) for shared skeletons, textures and geometry.

## Generate and pose with evidence

[MengTo/Skills, game-dev-character-model, SKILL.md and references]

- Start an original character from a clean neutral full-body A-pose with readable hands and hips and no baked directional lighting when a riggable reference is needed. Inspect actual downloaded format and joints, including finger limitations.
- Pose from world segment directions and fit after chest rotation. Check actual skinned body/gear clearance; joint metadata alone is not a posed-mesh inspection.
- Quote the selected paid task and reconcile an ambiguous submission before paying to retry. Model names, prices, output contracts and provider incidents in the source are dated observations; verify the selected provider's current primary documentation rather than importing those values.
- Source browser polling, screenshot and navigation workarounds describe its environment. They are not provider API laws or reasons to bypass tool permissions.

## Review the real runtime model

[MengTo/Skills, build-rigged-game-assets; build-vesperfall-review-assets; game-dev-character-model]

- Build the catalog from the actual production manifest. Image-only cards show real transparent asset renders; the selected model gets one runtime inspector with the game's loader and action API.
- Give action controls real actions and explicit unavailable/fallback/error states. Ground from feet/contact, not a bounding box extended by a weapon tip. Identify asset, clip, camera and game time in review evidence.
- The source's square 512-pixel cards are one catalog recipe. Preserve the project's review layout and required resolution instead of making that size a universal rule.
- Validate the loaded GLB's bones, meshes, clip roles and resource budgets, not only manifest fields and file existence. The supplied source validator does not establish those runtime facts.
- An alpha-capable PNG header does not prove that any pixel is transparent, and equal image file sizes do not prove two captures are identical. Inspect actual contents and report the comparison performed. The source validators and capture tools are not bundled here.

## Prove it

The selected runtime model loads with declared scale/axes, supports its real gameplay actions and sockets, grounds from intended contact and releases resources through its owner. Equipment can be disabled as declared, unsupported slots and missing underlayers are visible, and animation-only assets do not duplicate the body. The report separates manifest checks, loaded-model checks, mesh heuristics and visual evidence, and preserves provenance and original artifacts. [MengTo/Skills, build-rigged-game-assets; build-game-monster-system; build-vesperfall-review-assets; game-dev-character-model]
