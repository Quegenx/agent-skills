# Study a folded-wave visual

Use this for a selected folded-sheet hero or a supplied Silk reference. The `silk` source contains a Three.js r178 study and brand-specific presets. This topic preserves its construction, framing and comparison method; it does not bundle `stripe-three.js`, the older ribbon engines, brand geometry or preset arrays. The source's dated observations are evidence about that supplied study, not a new inspection of a live brand site. [silk, SKILL.md; reference/stripe-notes.md; reference/stripe-three.js]

## Separate shape, surface and placement

[silk, SKILL.md, The form, The shading and The palette]

- The study starts from a folded sheet with a rounded bend and separated faces, then applies turns and a slowly changing displacement. Parts drift; the whole object does not simply spin. Its fixed folded-wave shape is a chosen art direction, not the default answer to every 3D brief.
- Treat the unlit palette, longitudinal fine streaks, edge tint and pale reverse face as separate surface channels. The source intentionally avoids conventional lit-plastic shading. Its written guidance recommends static screen-position dither, warning that changing grain can shimmer. The supplied engine differs: its post shader offsets the random sample by `fract(uTime) * 61.0`, with time updated during drawing. Do not claim that engine implements the stated static-grain policy. [silk/SKILL.md, The shading; reference/stripe-three.js, POST_FRAG and draw]
- Place the main gradient along the sheet and the edge tint across it. The source warns that random color blotches can leave the visible crop mostly one color. Keep the actual project's palette; the source's named color sets are not canonical brand tokens here.
- Fit with camera orientation, scale, position and crop before changing the selected shape. A tall frame can need a different camera orientation from a wide hero. Inspect the actual crop rather than assuming that a working preset transfers to a smaller cell.

## Keep the page readable

[silk, SKILL.md, Placement in the page]

The study fills and crops the art frame, keeps it out of navigation and the next section, and treats caption placement separately. It describes a double-text overlap: one normal copy below the visual and one matching tinted blend copy above it. If that technique is selected, both copies derive from the same content and layout; only the semantic copy is exposed to assistive technology, and interactive controls remain reachable. Inspect the brightest and darkest overlap moments. A blend mode is not evidence that text contrast passes.

That overlap is an optional technique, not permission to duplicate focusable controls or modify the owner's hero. The source forbids a plate or mask behind that particular overlap; existing product directions may choose those treatments instead. Preserve the chosen owner design and use the [accessibility owner's contrast and semantics](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/SKILL.md). [silk/SKILL.md; repository owner-design rule]

## Keep study settings out of platform policy

[silk, SKILL.md, Engineering rules; existing webgl, WIDGETS.md and THREEJS-AND-R3F.md]

The source pins r178, disables its color-management path, caps DPR at 2 and suggests a per-page context count. These are settings of its renderer, not current general Three.js advice or portable context limits. Keep the existing [color-space and renderer audit](THREEJS-AND-R3F.md) and [shared-context widget policy](WIDGETS.md#one-context-many-instances); inspect a selected upstream engine before adapting it rather than importing a missing local file or changing the installed Three.js version by assumption.

Its useful degradation order is to reduce the post pass, then render resolution, then settle on a still when performance requires it. Visibility pauses, reduced-motion stills, resize handling, fallback behavior and resource teardown retain the existing [live-page contracts](WIDGETS.md). A `stop()` method's existence alone does not prove every resource has been disposed. [silk/SKILL.md, Engineering rules; reference/ReactMount.tsx; existing webgl]

## Compare the chosen view

[silk, SKILL.md, Workflow]

Use matched frames and crops when tuning against a supplied reference, at wide and phone sizes. The source compares separated moments by image regions to distinguish local deformation from a uniform turn. Keep that as a candidate diagnostic: regional image change alone does not uniquely identify the geometry or prove the implementation. Inspect texture, crop, edge visibility and the movement itself. Requesting alternate takes is a separate branch from refining one selected wave.

## Prove it

[silk, SKILL.md, Workflow and Rejected, do not repeat; existing webgl]

The report identifies the selected art direction and actual source available, distinguishes shape from framing and surface changes, and names what was compared. The art fits both target frames, copy and controls remain usable, and fallback, reduced motion, visibility and teardown checks are reported with their real results. No source preset, dated brand observation or context count is presented as a universal platform rule.
