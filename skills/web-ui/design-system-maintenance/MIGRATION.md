# Adopt a system without changing behavior

Move one ready family and representative flow at a time, with visual and behavior evidence kept separate. Sources: the supplied `migrate-design-system` skill, its incident lessons, parity and multi-agent references, `build-design-system` capture and pixel-diff scripts, and `ui-review`. General migration and function comparison remain in [system-migration](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/system-migration/SKILL.md); rendered critique remains in [anti-slop-ui REVIEW.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/REVIEW.md).

## Plan from current consumers

[supplied design skills, migrate-design-system/SKILL.md, steps 2 to 6]

- Confirm the adoption scope and [readiness audits](EXTRACTION-AND-MAPPING.md#readiness-before-adoption). Recheck old backlog rows against current code before treating them as missing work.
- Inventory the old imports, raw values, palette usage and consumers mixing both systems. Map every finding to a surface and record excluded paths.
- Establish baselines before edits with fixture data, a fixed clock, matching widths and themes, and a no-change control capture. An absent baseline does not establish parity.
- Give the shared layout and providers one owner. Complete and inspect the pilot by hand before deriving a codemod; compare generated output with the hand migration and check that a second application makes no changes.
- Give each worker exact editable paths and keep shared files under one owner. A retry receives the original brief, later directives and prior evidence. General delegation lives in [agent-harness WORKFLOWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-harness/WORKFLOWS.md).
- Treat missing component capabilities as system gaps. Do not create a consumer workaround that conceals an incomplete family.

## Capture without changing shared data

[supplied design skills, migrate-design-system/references/lessons.md, lesson 6; build-design-system/scripts/capture-guard.mjs]

Inventory the app's actual write requests in their actual network shape before browser automation. A method-only policy is insufficient: RPC reads can use POST, while a badly designed GET can change state. Prefer a local fixture-backed instance; prove that every known write is intercepted before driving its flow, then inspect the decisions and captured bodies.

The supplied capture guard is not a universal write barrier. It routes HTTP, defaults unlisted POST procedures to denial, admits listed reads, and explicitly does not handle WebSocket writes. Its so-called exact procedure allowlist also accepts matching last path segments. Review full procedure identity and transport coverage rather than relying on the name of the option. [supplied design skills, build-design-system/scripts/capture-guard.mjs, classifyName, decide and HELP]

Playwright has a separate `browserContext.routeWebSocket()` API for WebSocket connections created after registration; register applicable routing before creating pages. For HTTP interception, account for Service Workers and use the documented `serviceWorkers: 'block'` setting where they would hide requests. The source's guard lacks WebSocket interception; this is a limitation of that script, not the absence of a Playwright API. [Playwright BrowserContext](https://playwright.dev/docs/api/class-browsercontext#browser-context-route-web-socket), [Playwright network guide](https://playwright.dev/docs/network#missing-network-events-and-service-workers)

## Compare rendered and semantic output

[supplied design skills, build-design-system/scripts/capture.mjs; scripts/pixdiff.mjs; migrate-design-system/references/parity.md]

- Pair the same surfaces, states, widths, themes and data. Record changed-pixel percentage, size changes, changed bounds and tolerance when a pixel comparison is used.
- An identical-value replacement requires zero channel tolerance and no unexplained pixel difference. A nonzero threshold can hide changes; report it explicitly rather than calling the swap identical.
- Preserve the baseline. An existing bug is recorded separately and any deliberate fix is named as an intended change, not hidden by updating the before capture.
- Keep accessibility-tree comparison separate from image comparison: names, roles, headings and current/selected state can regress without visible pixel differences.
- The supplied capture script turns reduced motion on and finishes animations. Its stills do not prove ordinary motion, motion in flight, hover, pressed or focus behavior. Exercise and report those states separately when they matter.
- A static checker, type check or screenshot cannot establish a write control's behavior. Report the unexercised control as unverified and name the missing evidence.

## Compare the control, not only its appearance

[supplied design skills, migrate-design-system/references/parity.md; references/lessons.md, lessons 3, 4, 5 and 8]

For each class present in the migrated flow, record case, old result, new result, expectation and verdict. Distinguish Same, Rejected, Intended change and Pre-existing. Missing results fail to establish parity, and an intended fix that produces no change is not a successful fix.

| Class | Compare |
|---|---|
| Numbers and amounts | Typed text, displayed text, committed value and submit eligibility for decimals, signs, exponent notation, separators, whitespace, empty and malformed input, leading zeros, long precision and large values |
| Calendar dates | Stored payload as well as label across zones west and east of UTC |
| Uploads | Extension-only, MIME-only, uppercase extension, wrong MIME and rejected type |
| Picker activation | Whether immediate Enter or Space after opening accidentally writes before a deliberate selection |
| Focus | Escape, Cancel, successful and failed confirmation, and removal of the opener |
| Refetch failure | Whether a loaded record survives a failed background refresh |
| Filters | Actual stored operator/value, not only the chip label |
| Scrolling layout | Reachability of controls inside the scroll container, with long realistic content and more rows than fit |

For dates, preserve a date-only string when the product means a calendar day. JavaScript parses a standard date-only string as UTC; a date-time string without a zone uses local time. The source groups these paths under local-midnight conversion, but the failure depends on parsing and subsequent local formatting. Compare the actual payload and zone behavior. [MDN Date.parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse), [supplied design skills, migrate-design-system/references/lessons.md, lesson 4]

An HTML `accept` value may list extensions, MIME types or supported wildcards. It guides file selection and does not validate uploads; retain server validation. The source's MIME/extension cases are compatibility checks on the control, not a guarantee that the browser verifies file contents. [MDN accept](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/accept), [supplied design skills, migrate-design-system/references/parity.md, Upload inputs]

## Request evidence keeps its provenance

[supplied design skills, migrate-design-system/references/lessons.md, lesson 5; scripts/bodies-check.mjs]

- Drive before and after instances from the same recorded session with the same state steps. Record the changed procedures before collecting evidence, then retain source revision, endpoint identity, timestamps and actual blocked request bodies from both sides.
- Missing procedures, missing rows, mismatched session identity or captures outside that session do not establish equality. Do not merge unrelated captures into a pair.
- The supplied checker compares sets of body hashes per procedure; it discards duplicate counts and order. A passing result therefore proves equality of distinct captured body bytes, not equal request multiplicity, ordering or the complete behavior of the write path.
- The source also states that timestamps and a session identifier cannot prevent a script from fabricating files inside the window, and fixtures may miss the changed path. Preserve that limitation; a report is evidence to inspect, not an independent guarantee.

## Review and close

[supplied design skills, ui-review/SKILL.md; references/criteria.md; migrate-design-system/SKILL.md, Close]

Use the existing [interface review](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/REVIEW.md), with the installed system's rules first. Add findable role/name, capture, width, criterion and observed effect to each finding. Merge shared root causes. The source's blocking, should-fix and note buckets map here to P1, P2 and P3; reserve P0 for the repository's highest-impact cases. Unverified checks remain coverage limits rather than invented findings.

The source proposes checking press feedback with Event Timing durations under 100 ms. Event Timing's `duration` measures event creation to the next rendering paint, rounded to 8 ms; default observation exposes durations of at least 104 ms and the minimum configurable threshold is 16 ms. A missing entry or a short event duration does not by itself establish that the intended visible feedback appeared. Use [the existing runtime trace method](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/RUNTIME-TRACE.md#event-timing-and-interactions) and record what was actually measured. [MDN PerformanceEventTiming](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceEventTiming), [supplied design skills, ui-review/SKILL.md, step 5]

At close, tie verdicts to the final state of the files; an earlier revision's evidence is stale after relevant edits. Report remaining legacy usage, exceptions, unverified states and unfixed findings. Inspect repeated failure classes and move enforcement to their shared owner rather than adding more prose bans. Remove an obsolete implementation only when its callers and compatibility obligations have been accounted for. [supplied design skills, migrate-design-system/SKILL.md, steps 8 and 9; references/correct.md]

## Prove it

The pilot and shared layer are ready before adoption spreads; captures share conditions and retain unexplained differences; semantic and interaction comparisons cover the relevant controls; request evidence retains its limitations; every final claim matches the final file state; and remaining legacy, conflicts and unverified behavior are reported. [supplied design skills, migrate-design-system/SKILL.md; references/parity.md; references/lessons.md]
