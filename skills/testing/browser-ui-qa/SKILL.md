---
name: browser-ui-qa
description: "Audits browser UI changes with evidence: adversarial checks, responsive and container coverage, component worst-case fixtures, consent journeys and measured UI invariants. Use when checking a rendered web interface, stressing a component, verifying cookie consent or reviewing layout and interaction failures."
---

# Browser UI QA

Browser QA workflows from Browserbase qa, Emil Kowalski break-ui, Jakub Krehel break, c15t verify-consent, responsive-craft, flornkm prefer-container-queries and fluid-functionalism. The sources use different browser tools and proof budgets; select the workflow and its evidence contract before executing it. This is separate from Patrol, Maestro and the tester-army/e2e runner. [Browserbase, qa; Emil Kowalski, break-ui; Jakub Krehel, break; c15t, verify-consent; responsive-craft; flornkm, prefer-container-queries; fluid-functionalism]

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Adversarial browser QA of a change, delegated checks, assertion markers, accessibility, responsive, design and UX evidence | [ADVERSARIAL-UI-QA.md](ADVERSARIAL-UI-QA.md) |
| Stress one real component with a worst-case fixture toggle or an isolated scenario page | [WORST-CASE-DATA.md](WORST-CASE-DATA.md) |
| Pick realistic worst-case names, strings, quantities, money, dates, media, states and environments | [WORST-CASE-VALUES.md](WORST-CASE-VALUES.md) |
| Verify consent through vendor requests, rejection persistence, withdrawal and backend failure | [CONSENT-JOURNEY.md](CONSENT-JOURNEY.md) |
| Check viewport sweeps, side-by-side previews and container queries | [RESPONSIVE-CHECKS.md](RESPONSIVE-CHECKS.md) |
| Measure rendered hover, tab shift, CSS durations, control heights, font-descriptor limits and overflow | [UI-INVARIANT-AUDIT.md](UI-INVARIANT-AUDIT.md) |

## The rules

1. **No PASS without concrete evidence.** Follow the selected workflow's deterministic check, tree match, before/after comparison or explicitly limited screenshot judgment. [Browserbase, qa]
2. **Keep source workflow limits distinct.** In-place break-ui permits inferred CSS findings marked as inferred; isolated break reports only observed breaks from its one-look workflow. [Emil Kowalski, break-ui; Jakub Krehel, break]
3. **Stress real boundaries.** Use the real component and plausible or schema-backed data; preserve its own tokens and styles. [Emil Kowalski, break-ui; Jakub Krehel, break]
4. **Report the evidence limit.** UI measurements are evidence rather than automatic recommendations; missing upstream scripts, unavailable browsers, untested states and unvisited areas stay explicit. [fluid-functionalism, audit.mjs and stack-audit.md; Browserbase, qa]
5. **Preserve owner-design conflicts.** Report the existing tagged focus and design disagreements; never change protected owner production designs without approval for that specific change. [Browserbase, qa; owner app-ui; owner authorization rule]
6. **Use the existing browser owner when driving a browser.** Its command, local/cloud and signed-in-session contracts are named required references in the selected browser workflow, available through direct links without copying its definition. Domain-specific recommendations use the named domain owner. [Browserbase, qa; browser-automation owner; Jakub Krehel, break]

## Prove it

Apply only the selected topic's acceptance. Every finding states its observed or inferred basis, failures carry the prescribed evidence, skipped/unavailable checks are listed, and report counts add up. Consent proves sent requests and saved choices; component stress and invariant measurements keep their own source limits. [Browserbase, qa; c15t, verify-consent; Emil Kowalski, break-ui; Jakub Krehel, break; fluid-functionalism, stack-audit.md]
