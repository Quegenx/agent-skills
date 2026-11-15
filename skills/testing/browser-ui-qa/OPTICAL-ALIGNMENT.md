# Check alignment in the rendered ink

Use this for a requested alignment pass on a running interface. Raphael Salaja's `alignment` supplies the measurement, candidate, crop and visual-weight workflow. Existing visual rules remain in [anti-slop-ui DETAILS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/DETAILS.md); this file owns the evidence for applying them. No upstream measurement script or report template is bundled. [raphaelsalaja/skills, alignment/SKILL.md; measure.js; report.html]

## Establish the capture

[raphaelsalaja/skills, alignment/SKILL.md, Open the shipped render and Run the measurement]

Record the actual route, viewport, theme, state and capture scale. Read the project's spacing tokens before comparing gaps or insets. The source uses a 2x capture, then judges the same surface at 1x; that is its inspection recipe, not permission to assume every screenshot pixel is one CSS pixel. Wait for the relevant fonts before measuring; the supplied script itself does not wait for them. [alignment/measure.js]

## Confirm candidates in the picture

[raphaelsalaja/skills, alignment/SKILL.md, Check the lines, Check the centres and Judge the weight]

- Compare shared column edges, repeated sibling gaps and spacing-token use. Distinguish a deliberate group break from an accidental gap.
- Compare the label's cap height and baseline with the control and neighboring icon. A centered line box does not establish centered ink.
- Inspect asymmetric glyphs such as triangles and arrows optically. Name a justified nudge rather than disguising it as a different spacing rule.
- Check nested radii and their inset with the existing [corner guidance](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/DETAILS.md).
- At normal size, name what attracts attention first. Compare stroke weight with text stems and filled versus outline glyphs. The source's 1-to-4px finding range and roughly 10% circle/triangle enlargement are house heuristics, not universal defect thresholds.

Keep a candidate only when the crop shows the claimed problem. Record the measured value, element rectangle and numbered crop together; retain the source location when found. A report template rendering a supplied verdict does not perform this verification. [alignment/SKILL.md, Report with proof; report.html]

## Know what the geometry omits

[raphaelsalaja/skills, alignment/measure.js]

The supplied helper's SVG bounds transform two box corners, which does not establish painted bounds under rotation or skew. Root stroke assumptions do not account for all descendant paint. Its text metrics and ranges approximate ink; they do not recover every glyph's actual pixels. Inspect transformed shapes, strokes and text in the capture instead of treating a numeric center as optical proof. Images, canvas and cross-origin content remain outside that helper's claimed DOM coverage.

When fixes are requested, change the responsible token or shared primitive and inspect the affected instances again. Preserve protected owner designs and the named scope; an alignment pass does not authorize a surrounding redesign. [alignment/SKILL.md, Fix only when asked; repository owner-design rule]

## Prove it

[raphaelsalaja/skills, alignment/SKILL.md, Reporting]

Each finding carries the route/state, capture scale, element, measured discrepancy and a crop that shows it. Separate visual-weight judgment from numeric measurement. Uninspected content stays unverified; after an authorized fix, report what the same capture and measurement show.
