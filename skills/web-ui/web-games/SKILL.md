---
name: web-games
description: "Builds browser games with an authoritative simulation clock, action combat and enemies, imported or procedural rig contracts, safe inventory and save changes, level authoring and isolated map-editor drafts, player cameras, mobile controls and reproducible gameplay evidence. Use when building or reviewing a Three.js or WebGL game, an isometric ARPG, enemy AI, attack timing, fog of war, equipment, a game asset catalog, a map editor, a game changelog or a playable-game acceptance journey."
---

# Browser games

A rendered scene is only one view of the game. Gameplay owns time, action identity, contacts, items and progression; animation, effects, audio and review tools consume that state. These contracts come from [MengTo/Skills, build-isometric-arpg; design-action-combat; build-game-monster-system; build-rigged-game-assets] and the selected game topics below. The source's named game, paths, provider incidents, art scores and runtime limits remain project examples, not requirements for every game.

Read the route for the selected work. General Three.js rendering and resource ownership stay in [webgl THREEJS-AND-R3F.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/webgl/THREEJS-AND-R3F.md); browser playback permission and audio clocks stay in [web-audio](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-audio/SKILL.md). A selected game workflow does not authorize unrelated deployment or paid asset generation.

| The job | Read |
|---|---|
| Playable vertical slice, simulation/content/view boundaries, reset, pause and quality changes | [GAME-LOOP.md](GAME-LOOP.md) |
| Shared sight, hidden-target eligibility, a soft angular fog lookup and orthographic ground reconstruction | [PERCEPTION-AND-FOG.md](PERCEPTION-AND-FOG.md) |
| Action phases, contact deduplication, enemy decisions, encounters, animation probes and effect polish | [COMBAT-AND-ENEMIES.md](COMBAT-AND-ENEMIES.md) |
| Imported or procedural characters, skeletons, wearables, clip manifests, asset catalogs and generation handoff | [RIGGED-ASSETS.md](RIGGED-ASSETS.md) |
| Level data, collision/navigation, light ownership, map-editor drafts, selection and undo/export | [LEVELS-AND-EDITOR.md](LEVELS-AND-EDITOR.md) |
| Atomic item moves, save migrations, truthful player release history and changelog menu behavior | [INVENTORY-AND-RELEASES.md](INVENTORY-AND-RELEASES.md) |
| Camera ownership, mobile input, lock-on, shake and semantic game audio | [CAMERA-AND-FEEDBACK.md](CAMERA-AND-FEEDBACK.md) |
| Seeded game fixtures, live playthroughs, contact captures, matched performance and deployed-artifact evidence | [GAME-VERIFICATION.md](GAME-VERIFICATION.md) |

## The rules

1. **Make one complete playable loop before multiplying systems.** State and authored content are separate from rendering, and a view replacement must not change combat or progression. [MengTo/Skills, build-isometric-arpg]
2. **One game clock decides action phases and contacts.** Animation, effects and sound read it; an animation callback or click is not a second damage authority. [MengTo/Skills, design-action-combat; build-game-monster-system]
3. **Identify every action and target.** Deduplicate contact by the action's identity and target; a new looped attack gets a new action identity. [MengTo/Skills, build-game-monster-system; build-threejs-enemy-systems]
4. **Validate the complete item transaction before committing.** A failed destination cannot remove the source item or apply an effect twice. [MengTo/Skills, build-game-inventory]
5. **Keep drafts outside production state.** An editor uses production builders through explicit adapters, but its draft, undo and export cannot mutate a running game or player save. [MengTo/Skills, build-game-map-editor]
6. **Keep one declared asset contract.** Coordinate axes, skeleton, sockets, clips, equipment slots and colliders are checked at import and in the real runtime loader. Source metadata validation alone does not prove the GLB meets it. [MengTo/Skills, build-rigged-game-assets; build-game-monster-system]
7. **Preserve gameplay when reducing decorative cost.** Compare the same encounter, device, camera and quality state; a cheaper effect cannot remove the telegraph or change damage timing. [MengTo/Skills, optimize-threejs-games; create-game-vfx]
8. **Report observable game evidence.** A build, screenshot or stepped pose does not establish a complete live journey or actual-device frame pacing. [MengTo/Skills, test-playable-web-games; game-dev-combat-animation; ship-web-games]

## Gotchas

- The monster source calls forward `+Z`; the rigged-asset source calls it `-Z`. They are different project contracts. Declare the game's axes and convert at the import boundary. [MengTo/Skills, build-game-monster-system, references/monster-contract.md; build-rigged-game-assets]
- A manifest validator can pass while the file has missing bones or clips: the supplied validator checks metadata and paths, not the loaded model's complete runtime behavior. [MengTo/Skills, build-rigged-game-assets, scripts/validate_asset_manifest.py]
- Equal screenshot file sizes do not establish duplicate frames, and unsigned nearest-vertex distance does not establish absence of mesh penetration. Keep those source capture/viewer heuristics out of acceptance claims. [MengTo/Skills, game-dev-character-model, references and tools]
- The source's flat-world, four skin influences, fixed card size, patch-only version line and score targets belong to selected source projects. Apply only a project's declared equivalent. [MengTo/Skills, author-game-levels; build-rigged-game-assets; build-game-changelog; game-dev-combat-skill-polish]

## Prove it

The selected game's state has one owner, a repeated action cannot duplicate contact or rewards, inventory failures conserve items, drafts cannot write player saves, and imported assets work through the actual loader and action API. Report the coherent acceptance journey, capture conditions and actual results using [GAME-VERIFICATION.md](GAME-VERIFICATION.md). Unrun browser, device, release or gameplay checks remain unverified. [MengTo/Skills, test-playable-web-games; ship-web-games]
