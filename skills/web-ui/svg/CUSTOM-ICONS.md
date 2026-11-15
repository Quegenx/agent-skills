# Adding custom icons

Add a missing glyph to the project's existing icon family, using the family's drawing conventions and component API. [newsi, icons/SKILL.md] supplies the authoring workflow; its mandatory sheet and cubic-only morph format are that source's house rules. The platform's path rules are in [PATHS.md](PATHS.md), and the specific three-line morphing implementation stays in [MORPHING-ICONS.md](MORPHING-ICONS.md).

## Reuse and scope

[newsi, icons/SKILL.md, steps 1, 2 and 9]

- Search the installed icon package, local icon folder and inline icon map before drawing. Add only the missing requested glyph, beside its siblings, using the existing component props and file shape.
- Keep logos and brand marks outside the measured family. Report existing outliers separately; changing them is a separate scope decision.
- Match the project's existing icon API, including size, color and accessibility behavior. Naming a control and marking decorative artwork are owned by [ACCESSIBILITY.md](ACCESSIBILITY.md).

## Record the family

[newsi, icons/SKILL.md, steps 2 to 4 and 7; icons/sheet.html, measurement and derivation]

- Record the reference icons, viewBox, rendered sizes, stroke width, caps, joins, corner radii, grid, padding and round overshoot before drawing. When the family ships separate drawings per size, inspect each relevant size separately.
- State the cohort and exclusions. The source sheet derives its main specification from the most common viewBox, and compares outline coverage with outline and filled coverage with filled. A missing comparison kind remains unverified.
- Separate measured geometry from what the eye sees. The source helper reads local bounding boxes and the first stroke style; it does not establish all painted bounds under ancestor transforms or mixed styles. Verify the actual artwork before accepting an inferred grid, padding or coverage result.
- Follow the established family's conventions. The source mandates a grid, minimum gaps and a particular pixel-icon process; these are authoring constraints, not universal SVG requirements. Render-size selection and optical adjustments are defined in [Icons beside text](EMBEDDING-AND-ICONS.md#icons-beside-text).

## Morph only the requested transitions

[newsi, icons/SKILL.md, steps 5, 6 and 8; icons/sheet.html, conversion preview]

- The source normalizes every new icon to equal path counts with an absolute `M` followed by equal counts of explicit `C` segments. It also chooses topmost starts, orders paths by length and pads with zero-length segments. This is one normalization strategy; do not impose it on unrelated static icons or on the three-line implementation.
- Native path interpolation requires matching command types, counts and order, as defined in [Animating d](PATHS.md#animating-d). Matching syntax does not establish a useful correspondence between parts. The source's length ordering and conversion preview remain guesses to inspect, not proof of faithful conversion.
- Preserve both endpoints' painting while normalizing: inspect transforms, fill rules, stroke, closure and unused parts. The helper's converted preview can discard group transforms and unify paint; it is not automatically the form to ship.
- **Closure correction:** the source replaces `Z` with a segment returning to the start. SVG distinguishes them: `Z` joins the first and last segments; an open path returning to its start caps the ends. Preserve the required appearance and compatible structure ([W3C, closepath](https://www.w3.org/TR/SVG2/paths.html#PathDataClosePathCommand)).
- **Filled-path correction:** the source says a fill cannot morph. Filled path geometry can interpolate under the same compatible-command rule; filling does not itself prohibit it. A cross-fade is the source's choice for its outline/filled swap, not a platform limit ([W3C, d](https://www.w3.org/TR/SVG2/paths.html#DProperty)).
- Shape-preserving rotations and the watched transition sequence already have an owner in [MORPHING-ICONS.md](MORPHING-ICONS.md). Animation timing and reduced motion stay in [JS-AND-REACT.md](JS-AND-REACT.md).

## Review the set and the shipped output

[newsi, icons/SKILL.md, steps 7 to 9; icons/sheet.html]

- Show requested additions beside unchanged peers at their actual render sizes and relevant light/dark surfaces. Compare outline and filled families separately. Check gaps, clipping, weight and recognizability at the smallest size, rather than judging an enlarged icon alone.
- Pixel enlargement and blurred weight views are review aids. A soft edge is an observation to investigate, not proof of one grid error; an empty findings list does not verify unknown measurements or visual quality.
- If morphing is requested, watch the actual pairs for twists, crossings and flashing collapsed parts, as well as checking both static endpoints. A converted preview needs the same review.
- Check the project's actual optimizer output. Merging paths, changing shapes or rewriting commands can break an animation's correspondence even when the static image survives. The relevant plugins are described once in [OPTIMIZING-AND-SECURITY.md](OPTIMIZING-AND-SECURITY.md#what-the-preset-does-to-your-markup); preserve the chosen animation contract rather than applying a blanket plugin ban to all icons.
- Record which icons, sizes, themes and transitions were reviewed, with unresolved findings and unverified cases. A report label or preview is not a substitute for that evidence.

## Prove it

- The requested glyph was absent from the set, lives beside its siblings and uses the existing component API; existing outliers and brand marks remain separate from the change. [newsi, icons/SKILL.md]
- The family record names the reference cohort, measured conventions, exclusions and unknowns; additions read consistently beside peers at every requested render size. [newsi, icons/SKILL.md; icons/sheet.html]
- Each requested morph preserves the two endpoints' painting, uses compatible path data where native interpolation is intended, and has been watched through its intermediate states. Closure and filled paths follow the official forms above. [W3C, paths](https://www.w3.org/TR/SVG2/paths.html)
- The shipped optimized output retains the intended animated elements and correspondence, and its rendered endpoints still match the reviewed artwork. [newsi, icons/SKILL.md; OPTIMIZING-AND-SECURITY.md]
