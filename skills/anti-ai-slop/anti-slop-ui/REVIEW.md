# Cross-discipline interface review

One review of a screen, flow or feature across accessibility, layout, writing, type, color, and UI polish and motion, ending in one ranked table and one verdict. It is Jakub Krehel's `better-interface` skill (jakubkrehel/skills: SKILL.md and review-format.md), which owns no rules of its own: "Orchestration is all it owns." Here its six `better-*` domain skills are mapped to this repo's skills, and its HIGH, MEDIUM and LOW scale is mapped onto P0 to P3 as in [SKILL.md section 6](SKILL.md#6-delivery-report). A branch or pull request review is code-review's job ([Change reviews](#change-reviews)); a Flutter app's whole-app audit is [flutter-ux REVIEW.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/REVIEW.md).

## Evidence, not taste

[Jakub Krehel, better-interface] "Press hard on the escalation triggers and leave deliberate project choices alone. A trigger is a failure whatever the style guide says. A density, radius or voice you merely disagree with is not a finding." "The bar for reporting is evidence. The bar for `Approve` is that you inspected what you claim to have inspected."

## 1. Resolve the scope

[Jakub Krehel, better-interface]
- Infer the screen, flow, feature or repository scope from the request and the workspace, and state it in the output.
- Cover all of it in every domain, "including the empty, loading, error and narrow-width states where they exist."
- Too large to inspect credibly: "narrow it to one complete flow. Take the one the request centers on, or failing that the entry path every user must pass through. State the boundary and what it excluded. Never imply uninspected surfaces were reviewed."

## 2. Recon before judgment

[Jakub Krehel, better-interface]
- Identify the framework, styling system, component library, design tokens, supported viewports and any preview or test command. "Write every fix in the project's own idiom, never as a request to adopt a different stack."
- Read what the project wrote about its interface: `CONTRIBUTING.md`, `CODING_STANDARDS.md`, `AGENTS.md`, `CLAUDE.md`, a design-system doc, Storybook docs and interface ADRs. "Name which you found, or that there are none."
- "A documented convention settles matters of taste but never excuses a trigger or a domain rule violation. What it changes is **where** you report. When a guideline or shared token is the cause, report it once against that source, with the components as its locations."
- In the owner's app, `app-ui` is that documented convention: its recorded decisions (for example "no focus ring anywhere (a recorded design decision ...)", [app-ui SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/SKILL.md#the-rules)) settle what they cover.

## 3. Domain passes, in order

[Jakub Krehel, better-interface] "Review in this order so foundational failures are not hidden by polish." From each owning skill take "its principles, its references and its verification checks"; its own severity ladder and format are replaced by the ones in this file.

| # | Domain (source skill) | Owning skill here |
|---|---|---|
| 1 | Accessibility (`better-accessibility`) | [web-accessibility](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/SKILL.md), with this skill's absolutes ([SKILL.md](SKILL.md#3-absolute-no-purpose-excuses-these)) |
| 2 | Layout (`better-layout`) | [modern-css RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/RESPONSIVE.md) and [modern-css](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/SKILL.md) |
| 3 | Writing (`better-writing`) | [anti-slop-copy](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md), its [anti-slop-copy MICROCOPY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/MICROCOPY.md) for interface text |
| 4 | Typography (`better-typography`) | [modern-css TYPOGRAPHY-AND-UNITS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/TYPOGRAPHY-AND-UNITS.md) in modern-css, and [PATTERNS.md](PATTERNS.md#decoration-and-type) |
| 5 | Color (`better-colors`) | [color-system](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/color-system/SKILL.md), with [color-system scripts/contrast.py](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/color-system/scripts/contrast.py) for every pair |
| 6 | UI polish and motion (`better-ui`) | This skill ([PATTERNS.md](PATTERNS.md), [DETAILS.md](DETAILS.md)), [ui-animation](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md) for motion, and [app-ui](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/SKILL.md) for the owner's app components |

- **A missing owner:** "mark that domain `Not reviewed`, name it and continue with the rest. Do not recreate its rules from memory, substitute a neighbour or claim holistic coverage."
- **Overlap:** "When two skills appear to cover one issue, assign it to the owner of the underlying rule and note secondary effects in the **Why** cell."

## 4. Evidence

[Jakub Krehel, better-interface] "Every finding cites `path/to/file:line` and shows the current implementation. When runtime behavior determines the result, source alone cannot support a visual finding and a screenshot alone cannot support a code finding." The first half matches this skill's "Never claim visual verification from code alone" ([SKILL.md](SKILL.md#3-absolute-no-purpose-excuses-these)); the second half is the converse.

## 5. Severity: P0 to P3

The source ranks HIGH, MEDIUM and LOW and ends in `Block` or `Approve`; the mapping onto P0 to P3 is "One scale" in [SKILL.md section 6](SKILL.md#6-delivery-report); [anti-slop-copy MICROCOPY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/MICROCOPY.md#review-format) already uses P0 to P3.

The source's definitions, for placing a finding [Jakub Krehel, better-interface]:
- HIGH: "blocks a task, misleads the user, hides content or controls, causes data-loss risk or creates a repeated systemic failure."
- MEDIUM: "meaningfully harms comprehension, efficiency, adaptability or consistency."
- LOW: "isolated polish with limited task impact."

"Within a severity, rank by how many places the finding reaches and how much one fix buys. A token or shared-component fix outranks the same symptom in one leaf."

## 6. Escalation triggers

The thirteen triggers, the cap rule and the WCAG notes on them are "Escalation triggers" in [SKILL.md section 6](SKILL.md#6-delivery-report). [Jakub Krehel, better-interface] "The owning skill decides whether the symptom is present; this list decides what it costs."

## 7. The cheapest fix

[Jakub Krehel, better-interface] "Severity says how bad a finding is; this says which fix to propose. When more than one would work, take the earliest that does:"

1. **Delete.** "A separator that space would carry, an animation on a high-frequency interaction, an ARIA attribute a native element makes redundant, a ramp nothing imports."
2. **Use the platform.** "The native element, the native control or the browser's own focus ring, in place of a custom rebuild."
3. **Reuse what the project has.** "An existing token, spacing step or motion curve, before any new value."
4. **Correct the value.** "The wrong easing, radius, gap or contrast pair, using the exact value the owning skill gives."
5. **Add.** "A new token, a wrapper, a media query, an ARIA attribute the platform cannot supply."

"When the code under review adds what **Delete** would fix, that is a finding, and its **After** is the deletion."

- **Animations on frequent interactions, both ways.** This ladder deletes them [Jakub Krehel, better-interface]. ui-animation keeps them short: "Anything a user triggers dozens of times a day stays near the bottom of its range" ([ui-animation SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md#the-rules)). ui-animation's rule stands in this repo; the ladder's rung applies where the motion explains no change.
- **The browser's focus ring, both ways.** Rung 2 names "the browser's own focus ring". app-ui does without one: "no focus ring anywhere (a recorded design decision, the browser default included ...) while focus still reveals what hover reveals" ([app-ui SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/SKILL.md#the-rules)). In the owner's app that recorded decision settles it (section 2).

## 8. Consolidate

[Jakub Krehel, better-interface] "One root cause is one finding, with every confirmed location in the same row. Report at most 15 findings. Never pad toward the cap; a short review or no findings is a valid result." This is REVIEWER.md's "**Flag the class of bug,** so the author fixes every instance" with a number on "**Cap the nits.**"

## 9. Verify

[Jakub Krehel, better-interface] "Run the safe, relevant checks the project offers. Inspect the rendered interface when runtime behavior or visual judgment matters, and report the exact command or interaction and its result. A check you cannot run is **Not verified**, never a finding."

Treat a review as read-only. "Do not edit source unless the user also asks you to implement the findings. When they do, keep the consolidated report as the change scope and re-run the relevant verification afterward."

## Change reviews

[Jakub Krehel, better-interface] A request that names a branch, pull request, commit range or uncommitted changes is a change review: "Never resolve a change scope yourself, because a guessed diff gives the report a scope nobody can check." The source hands those to its `interface-review` skill; here the change review is [code-review REVIEWER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/REVIEWER.md#tags-and-output), with P0 to P3 severity and a separate [status by cause](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/CHANGE-SCOPE.md#status-by-cause). When a UI pass runs inside one, "The cap and the verdict cover `Introduced` and `Regression` findings only, so a change whose only findings are `Pre-existing` is an `Approve`."

## Output

Use the report in [SKILL.md section 6](SKILL.md#6-delivery-report) ("The report": coverage, findings, verification, verdict), with these changes from better-interface's review-format.md [Jakub Krehel, better-interface, review-format.md]:

- **Coverage** has one row per domain from section 3, `| Domain | Evidence inspected | Result |`. "`Clear` means inspected with no actionable finding; `Not reviewed` must explain why." Recon adds the convention documents found and any boundary.
- **Findings** are one table "ordered by severity, then by reach", with a **Domain** column (the domain name from section 3):

| Severity | Domain | Location | Before | After | Why |
| --- | --- | --- | --- | --- | --- |
| P1 | Accessibility | `src/Dialog.tsx:42` | `<button><XIcon /></button>` | Add `aria-label="Close"` and hide the icon from the accessibility tree | The icon-only control has no accessible name |

- With no findings, omit the table and state "No actionable interface findings." The format has no considered-but-rejected table.
- **Verdict** is `Block` while a P0 or P1 remains, otherwise `Approve`, with P2 and P3 left in the table as work. "`Approve` covers only the domains the coverage table shows as inspected. Name every `Not reviewed` domain in the verdict line."

## Before you finish

[Jakub Krehel, better-interface]

| Mistake | Fix |
| --- | --- |
| A separate findings section per domain | Merge them into one table ranked by severity, then reach |
| A rendering claim whose only evidence is source | Inspect the rendered state, or mark it **Not verified** |
| A missing accessible name or focus ring rated P2 because the surface is minor | Triggers are P0 or P1 on sight |
| A coverage row whose evidence cell names no file, component or check | Inspect that domain, or mark it `Not reviewed` with the reason |
| A domain marked `Clear` although its skill never loaded | Mark it `Not reviewed` and name the skill |
| The same symptom in several rows, one per component | One row against the shared token or component, listing every location |
| An **After** that adds a wrapper, token or ARIA attribute | Check whether a deletion or the native element fixes it first |
| A fix written in a library or styling system the project does not use | Rewrite it in the project's own idiom |

## Prove it

The report names its scope and boundary and the convention docs found. The coverage table lists all six domains, each with evidence or `Not reviewed` and a reason. Every finding has a `file:line` or screen location and its current code, at most 15 rows with triggers first and any excluded count stated. Every trigger is P0 or P1. Every check is reported with its command and result or as **Not verified**. The verdict line names each `Not reviewed` domain.
