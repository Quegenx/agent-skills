---
name: design-system-maintenance
description: "Extracts and maintains a design system from an app's shipped UI, maps raw values to existing tokens, documents canonical components and plans behavior-preserving adoption. Use when consolidating an existing interface, auditing token coverage, documenting a component or moving screens onto an established system."
---

# Design system maintenance

Start from the interface the app already ships. This skill consolidates its tokens, components and adoption evidence; it supplies no visual direction. Sources: the supplied `build-design-system`, `component-docs`, `design-system-boss`, `migrate-design-system`, `token-mapping` and `ui-review` skills, their references and scripts, tagged by source file below. The scripts were read as source, not imported or executed.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Scope the work and preserve the installed system | [SKILL.md](SKILL.md) |
| Inventory surfaces, extract roles, map values and establish component readiness | [EXTRACTION-AND-MAPPING.md](EXTRACTION-AND-MAPPING.md) |
| Write one component's documentation from its implementation and real uses | [COMPONENT-DOCS.md](COMPONENT-DOCS.md) |
| Move screens onto the system with captured visual and behavior evidence | [MIGRATION.md](MIGRATION.md) |

Color notation and token definitions remain in [color-system](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/color-system/SKILL.md), general behavior comparison in [system-migration](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/system-migration/SKILL.md), rendered critique in [anti-slop-ui REVIEW.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/REVIEW.md), and accessibility requirements in [web-accessibility](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/SKILL.md).

## The rules

1. **Use the installed system.** Read the app's instructions, manifest, route tree, token source and components. A public reference system can suggest documentation structure or missing roles; its values, names and branding never replace the project's. [supplied design skills, design-system-boss/SKILL.md; build-design-system/references/taste.md]
2. **Separate the jobs.** A component-doc request produces a sourced draft; a token audit produces a read-only mapping; extraction builds the shared system; adoption moves consumers onto an already-ready system. A vague cleanup request does not silently become a whole-app migration. [supplied design skills, design-system-boss/SKILL.md; migrate-design-system/SKILL.md]
3. **Frame the complaint and pilot.** Record the person's words, the first visible change that answers them and a representative flow. Invent no color, font, shadow, gradient or motion value absent from the app unless the person chose a design source and confirmed a sample. [supplied design skills, build-design-system/SKILL.md]
4. **Make gaps visible before fan-out.** A missing token, slot, state or primitive belongs to the system's owner; do not patch each consumer around it. Establish the readiness matrix in [EXTRACTION-AND-MAPPING.md](EXTRACTION-AND-MAPPING.md#readiness-before-adoption). [supplied design skills, build-design-system/SKILL.md; references/components.md]
5. **Bind claims to evidence.** Counts name their command, scope and unit. Captures name the surface, state, width, theme and revision. Report a missing render or behavior check as unverified; a static checker does not establish visual or interaction parity. [supplied design skills, build-design-system/references/glossary.md; migrate-design-system/SKILL.md]
6. **Preserve the owner's production decisions.** `app-ui`, `landing-page-ui` and `agent-chat-ui` remain the design authority for their surfaces. Report a conflicting source rule with both views; change a production decision only after approval of that specific change. [supplied design skills, design-system-boss/SKILL.md, instruction precedence; repository standing owner-design rule]

## Source conflicts kept explicit

- The supplied component rules keep the idle label, add a spinner and use `aria-disabled` while pending. The production app instead morphs the running label, uses words and shimmer, disables the button and disables an in-flight form's fieldset. Keep [app-ui STATES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/STATES.md#pending). [supplied design skills, build-design-system/references/components.md, Variants and states; app-ui/STATES.md]
- The supplied traps require a focus ring. The production app records no focus ring, including the browser default. Keep that design and report the accessibility conflict through the existing [focus guidance](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/FOCUS-AND-KEYBOARD.md). [supplied design skills, build-design-system/references/traps.md, trap/focus-ring-shape; app-ui/SKILL.md, rule 6]
- The supplied token and trap rules allow only transform and opacity animation. The production systems include deliberate layout and blur animation; keep their own [app](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/SKILL.md), [site](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SKILL.md) and [chat](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-chat-ui/SKILL.md) motion contracts. [supplied design skills, build-design-system/references/tokens.md, Motion; references/traps.md, trap/motion-layout-property]
- The supplied review says user-chosen identifying text never truncates. The production app explicitly supports a truncated name as a tooltip trigger; keep that behavior instead of applying a global no-truncation rule. [supplied design skills, ui-review/references/criteria.md, criterion 11; app-ui/CONTROLS.md, Tooltips]
- The supplied button trap prescribes a non-wrapping label at narrow widths. The production app's ordinary button labels wrap, with a deliberate one-line exception inside table cells; keep [app-ui CONTROLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CONTROLS.md#buttons). [supplied design skills, build-design-system/references/traps.md, trap/button-label-wrap; app-ui/CONTROLS.md, Buttons]

## Prove it

The task is classified, the installed system and pilot are named, every mapping or documentation fact points to source, readiness gaps have one owner, and every parity claim names the evidence collected. The report distinguishes completed changes, unverified behavior, unresolved product choices and production-design conflicts. [supplied design skills, design-system-boss/SKILL.md; build-design-system/SKILL.md; migrate-design-system/SKILL.md]
