# A playable game loop

Use this when constructing the browser game's first vertical slice or changing state and presentation boundaries. The source favors a complete playable loop with authored content and deterministic state before adding parallel systems or visual polish. [MengTo/Skills, build-isometric-arpg; build-game-monster-system]

## Separate authored content, runtime and views

[MengTo/Skills, build-isometric-arpg; build-game-monster-system; build-threejs-enemy-systems]

- Authored definitions describe items, moves, enemies, encounters and levels. Runtime state records what is happening now. View adapters turn that state into meshes, animation, effects and interface feedback.
- Keep runtime state serializable and resets repeatable. Seeded fixtures should be able to reproduce a combat phase or progression transition without depending on prior visual callbacks.
- A monster's definition, rig, runtime and view adapter have separate contracts. Replacing its model or LOD must preserve gameplay footprint, collision, move timing and contacts.
- Simulation owns the clock and discrete transitions. Presentation samples it. Do not add an independent enemy animation clock that later becomes a hidden damage or cooldown authority.

## Finish the vertical slice

[MengTo/Skills, build-isometric-arpg; design-action-combat; design-game-encounters; build-game-inventory]

Make movement, one encounter, the core action, an authoritative contact, a visible reaction, reward/progression and reset work together. Keep input intent separate from committing an action and from awarding a hit. An encounter needs a completion condition and a reward that happens once; a loss or retry needs a coherent reset.

Inventory and save transitions use the transactions in [INVENTORY-AND-RELEASES.md](INVENTORY-AND-RELEASES.md). Combat and enemy state use [COMBAT-AND-ENEMIES.md](COMBAT-AND-ENEMIES.md). Extra visual systems must consume these owners rather than recreate their rules.

## Keep pause and quality coherent

[MengTo/Skills, build-isometric-arpg; build-mobile-threejs-games; optimize-threejs-games; test-playable-web-games]

- Pause, menu and resume preserve the declared game state. Backgrounding, canceled touch input and orientation changes cannot leave a held action stuck or silently reset progression.
- Treat quality as presentation. Reduce decorative pass cost, distant detail or effect density before removing combat cues; do not change damage, action speed, collision or enemy decisions to meet a visual frame budget.
- Generic render-loop, GPU-resource and resize checks remain with [webgl](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/webgl/THREEJS-AND-R3F.md). Its demand-rendering rule applies to scenes that change only on input; a running simulation is a different condition.

## Prove it

One new game can reach a real encounter, resolve contact and reward once, lose/retry and reset deterministically. Pause/resume and quality changes preserve authoritative state. Replace a view or reduce its visual quality and repeat the same fixture; contact, collision and progression remain unchanged. Report only checks actually performed. [MengTo/Skills, build-isometric-arpg; build-game-monster-system; test-playable-web-games; optimize-threejs-games]
