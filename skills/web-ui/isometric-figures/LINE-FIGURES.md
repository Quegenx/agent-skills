# An optional line-figure direction

Hairline proposes a quieter alternative to isokit's shaded machinery: one recognizable object, one pointer-controlled idea, a composed rest pose and a short external readout. This chapter paraphrases hairline-create's concepts.md, rules.md, source.md and look.md, and hairline-adopt's SKILL.md. Its kernel, page and commands are external prerequisites, not supplied APIs. Keep the existing [isokit craft](templates/isokit/references/craft.md) and [motion contract](templates/isokit/references/motion.md) as the default. [hairline-create, SKILL.md; hairline-adopt, SKILL.md]

## Resolve the object before drawing

[hairline-create, concepts.md]

- Name the object, what the pointer changes and what the readout says. Choose a single position, choice or rate that explains the idea.
- Name the features that make each kind of part recognizable. A row of rounded blocks does not become a particular machine merely because the caption names it.
- Compose rest before interaction. It must read alone at the intended thumbnail size, with a deliberate place for the eye to start.
- For an empty-state illustration, show the complete tool that would hold or find something, holding none. Absence is the subject; an undrawn object is not the same thing. Keep the product's real empty-state text and controls under their existing owner.
- A short demonstration tour visits distinct answers and returns to rest. It is a sentence about the figure, not a visit to every part. Use the existing [tour and takeover behavior](templates/isokit/references/motion.md#taking-over-from-the-tour).

## Keep the alternative's visual scope explicit

[hairline-create, rules.md, Accent, Rest, Honesty, Radius and Quiet; isokit, references/craft.md]

Hairline uses a rounded silhouette and a quieter inner crease, with one active stroke highlight and no decorative glow, shadow or labels inside the drawing. Hidden faces still need opaque ground-colored coverage and correct painter order. Isokit's default instead uses shaded thickness, bevels, a halo, detailed physical parts and its own tone table. Keep these as separate named directions; do not remove the existing toolkit's visual grammar as a generic cleanup.

Stable input targets already belong to [isokit craft](templates/isokit/references/craft.md#prove-it): the moving artwork must not move its own hit region out from under a stationary pointer. Hairline adds a useful stepped-part check: a single ground plane can select behind a raised part, so resolve selection against the relevant part's rest or target geometry. Hold the pointer on a moving edge and verify the answer settles rather than cycling through hover and unhover. [hairline-create, rules.md, Hit]

## A requested stylized rebuild

[hairline-create, source.md; hairline-adopt, SKILL.md]

When the user asks to turn an existing drawing into this kind of figure, inspect the drawing and record its identity, defining parts and proportions before proposing the gesture. Keep those across the concepts; if the user corrects the interpretation, revise it before building. Separate decorative surface treatment from the parts that make the object recognizable.

This source rebuilds the object as solids rather than tracing its paths. That is the selected transformation's scope. It does not replace [exact reconstruction](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/pixel-reverse-engineer/SKILL.md), authorize changing a supplied mark, or establish rights to another company's artwork. A source that was not rendered remains visually unverified. [hairline-create, source.md; hairline-adopt, SKILL.md; owner standing rules]

## Prove it

[hairline-create, look.md; concepts.md; rules.md]

Inspect rest and response at the real destination size, extreme input values and both shipped themes. Identify the concept's defining features in the small picture, check that nothing escapes the frame, and verify the selected part agrees with the readout. Review settling under a stationary pointer, occlusion and the tour's return. A validator can check structure; it does not establish that the figure reads as the intended object or matches a supplied drawing.
