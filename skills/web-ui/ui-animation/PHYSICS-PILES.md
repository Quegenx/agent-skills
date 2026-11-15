# A pile of colliding pieces

The supplied Bots source adds a bounded multi-body interaction to [PHYSICS.md](PHYSICS.md): shape-aware rigid bodies that collide while a spring drags one piece, with a separate visual squash layer. Reuse that mechanism only when the selected product calls for a playful pile. Its branded marks, page structure, controls and publishing workflow are not part of this recipe. [bots, SKILL.md, Build the pile; pile.js; marks.js]

## Keep collision geometry and drawn deformation distinct

[bots, SKILL.md, Build the pile; pile.js; marks.js]

- Derive a body's collision outline from the piece rather than assigning every silhouette a circle. The source uses convex hulls. A convex hull bridges concavities; it does not preserve holes or every indentation.
- The source uses Matter.js rigid bodies. Its squash is a rendering effect driven by contacts and velocity, not soft-body simulation. Clamp deformation and normalize its area so pieces neither grow nor invert.
- Keep the physics world stepping during a drag. Pull the chosen body through a spring constraint so it pushes neighboring bodies instead of teleporting through a paused world.
- Bound any shake impulse to the stage. The source's exact dimensions, velocities and shake-button layout are local choices, not new global physics constants.

[Matter.js documents](https://github.com/liabru/matter-js/blob/master/_autodocs/api-reference/Bodies.md) that `Bodies.fromVertices` uses convex hulls unless concave decomposition is supplied. Do not describe the source's hull construction as exact concave collision geometry or silently install another package. Use the target project's dependency and approval rules before choosing an engine. [Matter.js, Bodies.fromVertices; bots, marks.js; repository dependency rules]

## Preserve input and lifecycle contracts

[bots, SKILL.md, Build the pile; pile.js]

Separate a tap from a drag before opening the piece's detail. Use the existing [gesture rules](GESTURES.md) for grip offset, cancellation and browser scrolling rather than copying the source's fixed movement threshold as universal. A piece that moved as a drag must not also activate its tap action.

Run the live loop only while the stage is visible and bodies or visual wobble still move. Stop when settled; clean up the owning simulation on unmount. The source captures dimensions and reduced motion at creation, so its presence alone does not establish resize handling or live preference changes. [bots, SKILL.md, Build the pile; pile.js]

Under reduced motion, the source settles the drop offscreen and renders one finished pile, with an instant reshuffle instead of a live shake. Keep that source-specific still alternative distinct from this skill's ordinary short-fade alternative. Any optional impact sound follows [browser audio](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-audio/SKILL.md) user-activation and mute contract. [bots, SKILL.md, Build the pile; ui-animation, SKILL.md, rule 8]

## Prove it

[bots, SKILL.md, Build the pile; pile.js]

Observe representative shapes resting and colliding, drag one through its neighbors, and check that deformation remains bounded and area-normalized. Confirm release and cancellation, tap suppression after a drag, stage containment, offscreen pause, settled sleep and reduced-motion output. Report any unverified resize or preference-change path; source code and a static settled image do not establish live simulation behavior.
