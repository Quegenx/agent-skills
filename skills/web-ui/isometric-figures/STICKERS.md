# Playful isometric stickers

A small illustration style from Kelvin Adithya's supplied fun-isometric/SKILL.md. Use when the brief chooses playful feature stickers, empty-state art or onboarding illustrations. Its thick outlines and small part count are an explicit alternative to this skill's dense, restrained [mechanism craft](templates/isokit/references/craft.md), not a replacement for it or for the owner's production UI. No fun-isometric runtime is bundled here. [fun-isometric, SKILL.md; isokit, references/craft.md; repository owner-design rule]

## Draw a complete idea

[fun-isometric, SKILL.md, Workflow and Drawing]

- Name the object and its verb, then choose the motion for the verb. The source's drawing recipe uses a 500-unit square, a centered subject occupying about 50 to 60 percent, and room for its swing.
- Build a hero from three to six parts with real thickness: a raised plate, collar, button, ribbon or other feature that belongs to that object. Sparse details should support a recognizable silhouette rather than look painted onto one slab.
- Keep flat fills, a thick ink outline and a consistent extrusion direction. The source uses a 5-unit outline, or 4 for a small busy set, sharp joins and caps, and no gradients, glow or shadows. These are this sticker style's values, not general isokit values.
- Lean flat faces so rectangles foreshorten and circles become ellipses. Keep the side's direction consistent while the face turns. Put upright sparkles outside the leaned face's transform hierarchy.
- Assign palette roles rather than baking every accent into each shape: body, dark secondary, pale fill, reward, success and alert. The source usually budgets two accents plus white. Inspect the chosen colors in the actual result; palette conversion alone does not establish accessible contrast. [fun-isometric, SKILL.md, Drawing and Colours; color-system, CONTRAST.md]

## Rig and hold

[fun-isometric, SKILL.md, Workflow, Motion presets and Rules]

- Put a part's pivot at its physical hinge. Parent the parts that ride together; delay followers or use a lag track so every part does not move in lockstep.
- Pick an existing authored motion preset for the action, then tune its amplitude, start and direction. In the source recipe, the main action occupies the first half of the loop and finishes in a still hold; do not fill that hold with unrelated wobble.
- Put accents on the action's peak. Choose a complete, readable still for reduced motion and a one-shot ending, rather than an arbitrary intermediate pose.
- The source uses scale entrances rather than opacity because its stacked slab renderer reveals overlapping copies under transparency. Keep that explanation scoped to that renderer; it is not a general ban on opacity in UI animation.
- Keep a live player separate from a fixed-frame drawing function. For a film, use the existing [seek adapter](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/ISOMETRIC.md#into-seekt) and its clock contract. The source's claims of exact Lottie playback and universal export compatibility are not established by this procedure. [fun-isometric, SKILL.md, Using it on the web]

## Prove it

[fun-isometric, SKILL.md, Check before calling it done]

- Inspect the silhouette at 160px and the action's peak poses at a larger size. Outline weight stays consistent, extrusion agrees across parts, and every moving part pivots at its hinge with at least one follower lag.
- Inspect the requested palette and the full loop, including its seam. Review the complete still separately. Name clipping, morph or loop cases actually checked; a sampled toolkit check is not proof of every possible pose.
- For live delivery, verify reduced motion and offscreen behavior using the [existing live contract](templates/isokit/references/motion.md). Skipping paints alone does not prove the animation loop stopped. [fun-isometric, SKILL.md; isokit, references/motion.md]
