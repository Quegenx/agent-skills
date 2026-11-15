# Scoped alternatives for surfaces and page grids

Use these only when the requested direction selects one of the supplied `borderless`, `grid` or `tactile-design` systems. They are different production choices, not a merged default style. The existing [purpose-based filter](SKILL.md#4-allowed-with-a-written-reason) remains the generic policy; `app-ui`, `landing-page-ui` and `agent-chat-ui` keep their exact owner designs. A source's instruction to remove an owner's accepted styling is a conflict to report, not authority to change it. [borderless/SKILL.md; grid/SKILL.md; tactile-design/SKILL.md; repository owner-design rule]

For named whole-page art directions and exact source-scoped material recipes, read [visual-system presets](STYLE-PRESETS.md). For documentary, portfolio, service-booking, product-proof and operational page narratives, including twelve optional portfolio motion recipes, read [editorial page presets](EDITORIAL-PAGE-PRESETS.md). These remain selected alternatives under the owner-design rule above. [MengTo, style SKILL.md collection; editorial-portfolio-chapters ARTICLE.md]

## A border-removal audit

[borderless, SKILL.md, Two modes, The test and Check loop]

For an explicitly requested borderless retrofit, inventory lines, rings and shadows in the actual render. Before changing them, classify each as keep, replace with a surface step, or remove. Keep the scope on boundaries and surfaces rather than redesigning the layout. Use the site's tokens and record before/after counts and every retained line's job.

The source keeps edges that identify a same-colored input, focus, a secondary action beside a solid primary, dense scanned rows, a genuine region seam, a total that still needs a rule, or a disappearing image edge. It replaces ornamental card/panel outlines with a surface step or a floating shadow. Rows and idle controls use spacing, with fills for interaction states. Selected choice cards get an indicator as well as a surface change; an almost indistinguishable fill is insufficient.

For the selected recipe, distinguish a gray region holding white controls from a floating white region whose fields use gray fills. A white field next to white buttons on the same gray ground can need its identifying line back. Keep no solid primary on a settings surface where nothing awaits confirmation. The source's palette values are examples of that system, not automatically contrast-safe replacements for the project's roles. [borderless/SKILL.md, The system and Default palette]

**Both views:** borderless excludes rings combined with shadows, bevels and gradients; [DETAILS.md](DETAILS.md) and [SKILL.md](SKILL.md) permit deliberately justified treatments, and the owner app uses its own surface recipes. Borderless's ban on copying a reference composition also differs from an explicitly requested [exact reconstruction](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/pixel-reverse-engineer/SKILL.md). Keep the selected job and existing rules; do not turn this optional audit into a universal prohibition. [borderless/SKILL.md, Never; existing anti-slop-ui]

## A rail-and-cell page grid

[grid, SKILL.md, Two modes, The structure and How to build it]

This source's optional layout has two outer rails, whole sections and shared cell hairlines. For a retrofit, preserve content positions and the site's scale; do not add a nav or footer just to carry a line. Compare the original with the proposed layout before promotion.

- Use named full-width and content grid lines to place content and bleed regions without arbitrary negative offsets. The source also describes stepping out and padding back in when a fixed wrapper cannot change.
- Keep section headings and their cells in one section. A section boundary may cross the gutters; internal row and heading lines stop at the rails. Otherwise the outer gutters become a stack of unintended boxes.
- Share cell edges instead of doubling adjacent borders. Keep one level of cells and check the last row at each column count so the grid's line-colored background does not become a solid empty block.
- Distinguish full-bleed art from ordinary content. Labels stay within the content region; a hero's art stays out of navigation and the following section. For a line-free opening, start the frame below it. The source separately permits rails through a text-only hero; choose that branch deliberately.
- Align repeated cell content on shared baselines. A narrower chatbot or figure changes its own width, not the page rails.
- The source also offers a hidden-grid branch with no visible rails or section lines, and an optional ruled seam between sections. These are selected alternatives, not additional decorations to stack together.

**Both views:** grid prescribes one opaque line color and weight, while borderless removes most lines and tactile-design uses its own theme-specific edges. Those systems cannot all define the same surface. Grid's pixel values, measured-brand examples, minimum seam distances and default 12-column hidden layout are source choices; they do not replace the owner's grid or prove a general visibility threshold. Its audit script is upstream only; an empty result does not substitute for inspecting rail joins, text clearance, line visibility and clipping in the rendered page. [grid/SKILL.md, One line, Space, Variant and Check loop; borderless/SKILL.md; tactile-design/SKILL.md]

## A tactile surface system

[tactile-design, SKILL.md, Operating posture and The decision order; references/tokens.md]

The transferable method is to decide in order: primary task, amount of data, placement, component, surface, typography/spacing, semantic color, motion, phone behavior and rendered review. The source maps fill, edge and drop from the immediate parent surface, so a control on a card and one on the page can use the same role with different working values. Re-declare the working surface roles where the parent changes rather than freezing one appearance everywhere.

Its chosen light treatment is a raised white surface with a fine ring and crisp downward drop; its dark treatment uses a lighter fill, solid fine outline and dark drop. Preserve geometry across themes while designing elevation separately. Remap the role ladder to the selected palette and typeface, then check actual rendered contrast instead of assuming a particular numbered step passes on every ground. Keep text, semantic status and identity roles distinct. [tactile-design/references/tokens.md; references/surfaces-and-layering.md; references/buttons-and-controls.md]

**Both views:** this source selects one medium font weight, sentence-case labels, pills, wells, per-row hover fills and theme-specific fine outlines. Other source systems choose Title Case, forbid pills or wells, or use a moving shared highlight. Keep those as tagged style alternatives; this skill's existing type, [highlight](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/HIGHLIGHTS-AND-SELECTION.md) and owner-design decisions remain. Its row limits, widths, target sizes and animation numbers are house settings, not general standards. Use the [accessibility owner](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/SKILL.md) for criteria and pointer/zoom behavior. [tactile-design/SKILL.md; defaults/SKILL.md; motion/SKILL.md; existing anti-slop-ui]

The related `color` source specifically chooses alpha neutrals for borders, dividers and interaction fills, and lighter fills for dark raised surfaces. Those are stronger prescriptions than the existing [palette alternatives](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/color-system/PALETTES.md) and [dark-mode policy](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/color-system/DARK-MODE-AND-GAMUT.md), which retain their source choices and owner exceptions. Keep that optional view tagged; neither an alpha token nor a lighter step establishes contrast without checking the rendered pair. [color/SKILL.md, Neutrals on surfaces are translucent and Dark mode is its own palette; existing color-system]

## Prove it

[borderless/SKILL.md, Check loop; grid/SKILL.md, Check loop; tactile-design/SKILL.md, Review]

The report names the selected system, scope, token mapping and deviations. A border audit records each line's disposition; a grid review shows correct joins, gutters and last rows; a tactile review checks each parent surface, theme and reachable state. Screenshots and measurements support the claims made. No source style silently overrides an accepted owner design, and unperformed render or interaction checks stay explicit.
