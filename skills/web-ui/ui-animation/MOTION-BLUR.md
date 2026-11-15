# Optional motion blur for moving elements

Use this when motion blur is explicitly part of the chosen interaction. Raphael Salaja's `motion` skill and the upstream `@web-kits/motion-blur` README describe a directional streak derived from transform travel, frame time and shutter angle. This is different from a uniform blur hiding a crossfade in [REVEALS.md](REVEALS.md#blur-bridges-a-crossfade). No package or runtime is bundled here. [raphaelsalaja/skills, motion/SKILL.md and recipes.md; web-kits, packages/motion-blur/README.md]

## Choose the surface

[raphaelsalaja/skills, motion/SKILL.md, Motion blur only where the eye cannot follow]

The source selects thrown cards, dismissed sheets, snapping panels and spinners. It leaves blur off scrolling, carousel pages, sliding lists and text the reader follows. That is a scoped placement policy, not a requirement to add blur to every fast element. Preserve the accepted owner design and measure the selected interaction's cost.

## Keep host and layer separate

[Upstream README](https://github.com/raphaelsalaja/web-kits/blob/main/packages/motion-blur/README.md), Quick Start and Options

- `motionBlur(element)` is the plain JavaScript entry; React exports `useMotionBlur`, `MotionBlur` and `MotionBlurProvider` from `@web-kits/motion-blur/react`. Read the installed package's API before using it. The inspected upstream manifest is 0.2.0, with Node `>=22` and an optional React `>=19` peer; this is not an instruction to install or upgrade either. [package.json](https://github.com/raphaelsalaja/web-kits/blob/main/packages/motion-blur/package.json)
- The moving element is the host. Its first child is the visual layer. Attach the hook ref to the element that actually transforms; put backgrounds, borders and shadows on the layer or inside it, leaving the host transparent.
- The technique owns the layer's transform. Put an additional tilt or scale inside the layer rather than making it compete with that transform. `squeeze()` and `svg()` require exactly one element child in the layer.
- CSS transitions, CSS animations, WAAPI and inline transform changes can start automatic watching. A provider supplies defaults; local options and nested providers override them. A zero shutter disables blur.
- Keep `reducedMotion: "user"`, which drops blur under the user's preference. The source's `"never"` option deliberately bypasses that preference and is not the default here.

## Technique and shutter are explicit choices

[Upstream README](https://github.com/raphaelsalaja/web-kits/blob/main/packages/motion-blur/README.md), Options and Techniques

| Technique | Recorded defaults | Mechanism and limit |
|---|---|---|
| `echo()` | spacing 1.5px, at most 16 copies | Copies along the path, combined with `plus-lighter`; follows curves, rotation and scale. More copies cost more. |
| `squeeze()` | factor 16 | A stretched CSS blur, without copies; a directional approximation. |
| `svg()` | no options listed | A one-axis `feGaussianBlur` rotated toward the motion. |
| `smear()` | limit 1.05 | Stretches the layer without blurring it; keep text distortion bounded. |

The package defaults to Echo and a 180-degree shutter. In its model, 180 degrees covers half a frame's travel and 360 covers all of it. At equal speed and shutter, a shorter frame interval produces a shorter streak. A quarter-speed inspection uses a shutter four times as large to preserve the full-speed streak; these are renderer settings, not a guarantee about the display's actual presentation cadence. [raphaelsalaja/skills, motion/recipes.md, Checking motion blur; upstream README]

## Manual paths and cleanup

[Upstream README](https://github.com/raphaelsalaja/web-kits/blob/main/packages/motion-blur/README.md), Writing a Technique, Positions You Work Out Yourself and Instance

For authored physics, `render(previous, current)` draws one frame manually and stops automatic watching on the first call. Pass a path for a curved trajectory; its argument is in frames, with `-0.5` half a frame back. A pair of transforms alone does not describe the curve between them.

Retain the returned instance. `set` updates options except the layer; `clear` removes the current streak; `destroy` stops watching and removes added state. A custom painter undoes every style in `clear` and removes added DOM in `destroy`. A stable technique `key` prevents rebuilding an equivalent painter just because a render created a new function.

## Prove it

[raphaelsalaja/skills, motion/recipes.md, Checking motion blur; upstream README]

Inspect the fastest moment in a focused tab: the streak follows the actual travel, sideways motion preserves sharp top/bottom edges, Echo's copies do not show unwanted steps, and the element is sharp again at rest. Check the chosen frame rates and reduced-motion path, measure the actual cost and verify teardown. A background tab's throttled callbacks are not a valid refresh-rate comparison.
