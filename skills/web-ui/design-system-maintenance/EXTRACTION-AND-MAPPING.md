# Extract and map an existing system

Inventory the shipped interface before proposing tokens or canonical components. Sources: the supplied `build-design-system` skill and `references/components.md`, `references/tokens.md`, `references/taste.md`; `token-mapping` and `references/mapping-rules.md`; and the inspected `legacy.mjs` and `pixdiff.mjs` scripts. Color theory and naming remain in [color-system](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/color-system/SKILL.md).

## Inventory by surface and state

[supplied design skills, build-design-system/SKILL.md, steps 1 to 4; references/components.md]

- Record every route, shared layout and smaller interactive surface in scope, its states and whether it can write data. Capture before edits at the app's supported narrow and wide widths and in each shipped theme; state the reason for anything not captured.
- Count raw values as occurrences, separately from lines and mapping rows. A line holding several literals is one line and several occurrences. Keep palette utilities separate from raw literals.
- Count primitive call sites before choosing a pilot: text, small text, icons, buttons, fields, badges, links and dividers as well as overlays. The source's failed migrations repeatedly lacked text primitives; include the families the actual app needs before moving screens.
- Group duplicates by job. Choose a canonical implementation using real usage, accessibility and the props needed for its job. Record import path, status and old-to-new replacement in the registry.
- Keep an existing foundation component stock unless customization is deliberate. Record customized copies with their source and hash so future edits can be reviewed as drift.
- Show a representative family before widespread adoption. Include disabled, required, error and long-text states; a shared contract bug discovered after adoption requires a consumer sweep.

## Mapping report

[supplied design skills, token-mapping/SKILL.md; references/mapping-rules.md]

1. Read the actual token list and its modes. A styling framework's default palette is not the team's semantic system. If the list is absent or unreadable, report that limit rather than reconstructing it from memory.
2. For each raw value, record file, line, property and job. Follow aliases to the final value in every mode; state disagreements between sources and the project rule that resolves them.
3. Compare purpose first. An equal-valued border token does not become a text token. Use the existing [token-role definitions](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/color-system/TOKENS-AND-NAMING.md#use-a-token-only-in-its-role).
4. Normalize with code or rendered computed values, and record the basis. Length conversion uses the project's actual root size. Alpha is part of the color; equal opaque channels alone do not establish an equal rendered color.
5. Classify each row once per mode using the table below. Mark an inferred job as inferred. Report a missing role as a gap without inventing a new token name during an audit.
6. Report the summary, mapping, equal-valued but wrong-purpose candidates, ambiguous rows, gaps, choices for the owner and source coverage. Nothing changes in read-only mode.

| Class | Evidence required |
|---|---|
| Exact | The stated role covers the job and the resolved values are equal |
| Semantic | The role covers the job and a measured difference falls inside the project's accepted tolerance |
| Ambiguous | Several roles fit and no project rule selects one; list the candidates |
| Gap | No role covers the job, the fitting role is outside accepted tolerance, or the job cannot be read and no candidate is justified |

The source calls delta E OK below 0.5 identical to absorb rounding, but its pixel-comparison script requires zero per-channel tolerance for an identical-value swap. Keep approximate color matches under Semantic; do not use a perceptual threshold as evidence of exact value or pixel equality. [supplied design skills, token-mapping/references/mapping-rules.md, Normalising; build-design-system/scripts/pixdiff.mjs, header and tolerance handling]

The supplied tolerances are author defaults, not standards: color delta E OK 2 on the source's OKLab-distance-times-100 scale; spacing, size and radius 2 px; font size 1 px; line-height ratio 0.05; letter spacing 0.01 em; opacity 0.02; duration 30 ms. Border width, weight, family and easing have no automatic tolerance. Use the project's accepted values and preserve production tokens. The source's gap heuristic, over 30% and at least 12 mapping rows, signals that the wrong token list may have been chosen; it does not prove that diagnosis. [supplied design skills, token-mapping/references/mapping-rules.md; token-mapping/SKILL.md, step 6]

When a palette states no roles, mark matches Value only and group values by inferred role with counts and measured spread. Such a report establishes value reuse, not semantic coverage. Decorative graphics and alpha applied to an existing role are excluded from the source's mapping table; count exclusions and keep any necessary rendered-contrast check with [color-system](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/color-system/CONTRAST.md). [supplied design skills, token-mapping/references/mapping-rules.md, Classes and Consistency by role]

## Readiness before adoption

[supplied design skills, build-design-system/SKILL.md, Readiness audits; references/components.md]

| Audit | Required record |
|---|---|
| Slots and props | Every used legacy prop has a supported counterpart or a gap row |
| Behavior | Each interactive primitive has a what-fires-when contract; verification records actual outcomes |
| Tones and states | Every needed pressable or row tone, including muted, has support or an explicit unsupported row |
| Accessible strings | Existing role-name and text queries have a corresponding name and supported override |
| Hardest consumer | One demanding real call site per family renders in the showcase, with its capture |

Keep the family on the old implementation while required gaps remain. Before requesting a system change, read the current component API: a caller that failed to pass an existing prop is not a missing capability. [supplied design skills, migrate-design-system/SKILL.md, Ready?; build-design-system/SKILL.md, Readiness audits]

## Checks preserve their meaning

[supplied design skills, build-design-system/SKILL.md, Checks and Rules; migrate-design-system/references/correct.md]

- Use the project's existing checker and lint. A newly adopted rule needs an observed violating case before claiming enforcement; an unexercised rule remains unproven.
- Do not move a baseline or loosen a threshold to make a change pass. Fix a false-positive rule against the offending case rather than bending correct product code around it.
- Keep exceptions scoped to their actual literal or element. Payload strings, prompts, clipboard values, quotes, terms and version strings are not ordinary copy; preserve bytes when a style rule would change what a recipient receives.
- Repeated failures should move to the highest effective owner: architecture, types, a mechanical rule, behavior coverage, then documentation for judgment calls. Existing [app-ui CHECKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CHECKS.md) owns its production checker, allowlist, ratchet and blind spots; do not install a second implementation from this source.
- A legacy count that only stays below its initial ceiling is not completion. Require the intended legacy imports and mixed consumers to reach zero, record remaining raw or palette exceptions, and report how many files were scanned. Empty scanning is not a clean result.

## Prove it

Every surface and family has a scoped inventory; counts keep the same units; mappings resolve each shipped mode and distinguish exact from approximate values; readiness tables expose unsupported contracts; exceptions are named; and the checker report states what it did not inspect. [supplied design skills, build-design-system/SKILL.md; token-mapping/SKILL.md; migrate-design-system/scripts/legacy.mjs]
