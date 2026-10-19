# Scanner triage: baselines, rule control and a verdict per finding

A static scanner or linter gives evidence, not a review. This file is how to run one against a change, keep what it reports tied to the change, tune its rules without hiding real issues, give every finding a verdict, and decide when "no findings" may be called clean. Sources: [React Doctor, react-doctor] (the skill and its `references/explain.md`), its local triage playbook at https://www.react.doctor/prompts/react-doctor-agent.md (tagged [React Doctor, playbook]), and [React Doctor, improve-react] (its whole-codebase audit). The React Doctor commands are kept as the worked example; the method applies to any diff-aware checker. Running a checker on a pull request's base and head and diffing the output is [lint-rule-authoring BASE-HEAD-PARITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/lint-rule-authoring/BASE-HEAD-PARITY.md); status by cause (`Introduced`, `Regression`, `Pre-existing`) is [CHANGE-SCOPE.md](CHANGE-SCOPE.md#status-by-cause).

Severity follows the one scale in [REVIEWER.md](REVIEWER.md#tags-and-output): improve-react's `HIGH`, `MEDIUM` and `LOW` are written here as P1, P2 and P3.

## Scope the scan to the change

Source: [React Doctor, react-doctor], [React Doctor, playbook].

| Scope | What it reports |
|---|---|
| `full` | The whole codebase (the default) |
| `files` | Uncommitted work: `--scope files --base HEAD --include-untracked` (the CLI has it; the skill's flag table leaves it out) |
| `changed` | "Only report issues introduced vs the base branch" |
| `lines` | "Only report issues on the changed lines" |
| `contextual` | "Report findings in modified functions, JSX elements, or files, as selected by each rule" |

- **Let each rule declare what it owns.** "Rules can select an element, function, file, or an explicit set of related nodes. For `exhaustive-deps`, edits in the hook call or a resolved local callback can surface a finding on an unchanged dependency array. Rules without wider ownership keep changed-line filtering." A checker that only reads changed lines misses that finding.
- "Use `--scope contextual --base origin/main` when a team wants existing findings in the code it is editing." "Keep `--scope changed` when the task is limited to newly introduced findings."
- **The regression gate after an edit:** "Run `npx react-doctor@latest --verbose --scope changed` and check the score did not regress. If the score dropped, fix the regressions before committing." For a full cleanup, "Fix issues by severity: errors first, then warnings."

## Baselines

### A baseline scan

Source: [React Doctor, react-doctor]. "Save a complete `--json` scan, then pass `--baseline base-report.json` to report only new findings."

- "Use the same version and rules for both scans."
- "Findings are grouped by rule and file path, following Git renames. Only increases in each group's count are reported; groups without an increase skip location matching. Fingerprints, message similarity, and Git-adjusted line distance select the added findings. Formatting and edits that keep the same counts report no new findings."
- Regenerate the base report after changing the settings that filter findings, "or use a Git comparison".

### Baseline the checks before editing

Source: [React Doctor, playbook]. "Before editing, run the same repository-mandated test, typecheck, lint, and format-check suite that final validation will use. Record each command, exit status, and failure fingerprint. A later failure is caused by the bucket only when it is new or worsened; unchanged failures remain explicitly preexisting. If the full baseline cannot run, do not attribute a later full-suite failure to the edit."

### One pinned tool for the whole run

Source: [React Doctor, playbook].

- "Create a fresh run directory and never reuse global diagnostic or prompt files from an earlier run".
- "Inspect `--version` and `--help` before selecting an executable. Require support for every requested flag." "Use the same pinned command for scan, `why`, `rules explain`, and every rescan." Check the report's schema version and stop on a mismatch "before reading report fields".
- "Parse the report even if the process exits nonzero."
- **Fetched rule guidance:** fetch each rule's page once into the run directory, "Require HTTP 200, verify the requested key and required headings, then atomically rename the temporary file. A 200 proves route availability, not detector-version parity." On a 404, "record version drift"; on a transport or server error, "report unavailable guidance; do not reuse stale data."

### Warnings in CI

Source: [React Doctor, react-doctor]. "For GitLab CI, `--warning-exit-code 123` returns `123` for non-blocking warnings. Pair it with `allow_failure: { exit_codes: 123 }`. Errors still return `1`." A separate exit code for warnings shows a warning state without failing the job.

## Change a rule with the narrowest control

Source: [React Doctor, react-doctor] `references/explain.md`. Explain the rule before changing anything (`npx react-doctor@latest rules explain <rule>`), then "Match the control to the intent, prefer the narrowest one":

| The intent | The control |
|---|---|
| "User disagrees with one rule / it's a false positive for them" | Disable that rule (`rules disable <rule>`) |
| "Rule is fine but wrong severity" | `rules set <rule> warn` or `error` |
| "A whole area is unwanted" | Turn the category off |
| "A behavioral family is noisy" | Ignore the tag (`rules ignore-tag <tag>`) |
| "Keep it locally but hide from PR comment / score / CI gate only" | "do NOT disable. Edit `surfaces` in your config". "The rule still shows in local `cli` output." |

- **Whether a check runs is separate from where its result shows.** "`ignore.tags` disables every rule carrying that tag **before** linting, so a tagged rule stays off even if `rules`/`categories` set it to `warn`/`error`". Otherwise "`rules` overrides `categories` overrides the rule's default. `surfaces` is visibility-only and never changes whether a rule runs."
- Rescan to confirm the change did what was meant (`npx react-doctor@latest --verbose --diff`).
- "Only after they understand it should you offer to disable it, many 'bad' rules are catching real issues."
- On the reviewer side, a false positive is cleared by closing the thread with a short reason ([REVIEWER.md](REVIEWER.md#every-finding-has-to-be-answered)); a finding that keeps coming back is fixed at the source ([TUNING-THE-REVIEWER.md](TUNING-THE-REVIEWER.md#fix-it-at-the-source)).

## Triage the scanner's findings

Source: [React Doctor, improve-react].

- **Run the scan once, read-only, as JSON,** before any judgment, and keep the report outside the plans folder. "This is your ground truth for what's technically wrong, you do not re-derive it by eye."
- **Two passes per area:** "(a) triage the React Doctor findings in its category, which are real and which are noise on this codebase, and (b) hunt for what the scanner missed".
- **Vet every finding at its line.** "Reject anything by-design, mis-attributed, duplicated, or that React Doctor over-reports on this codebase (a `useMemo` the scanner suggests on a cold path is premature; a 'prop drilling' flag through two levels is fine). Never present a finding you haven't confirmed at its `file:line`."
- **Leverage sets severity, not the rule.** "A perf finding on a 10,000-row table is HIGH; the identical finding on a page shown once is noise. This map drives severity, not the rule's own severity." The hot path is what renders "per keystroke, per list row, per frame, or on every route".
- **Each row names its rule,** so the reader can explain it: `| # | Severity | Category | Location | Rule | Finding | Fix summary |`. A finding the scanner did not raise is labelled "Beyond the scan".
- **Missed opportunities stay separate** from diagnostics, and each states "what runtime or product evidence would confirm its value".
- "The scan supplies evidence; the senior audit supplies leverage and context."
- **Group by root cause.** "Group occurrences sharing `fixGroupId` so one root-cause fix is not applied repeatedly" [React Doctor, playbook].

## A verdict per finding

Source: [React Doctor, playbook]. Every surviving finding gets one outcome. It sits beside its status by cause, which says who caused it; this says what is known about it.

- "**Confirmed failure:** the invariant or policy is established and violated."
- "**Rejected:** a documented exception or false-positive predicate is proven."
- "**Needs evidence:** named evidence can still be collected."
- "**Unavailable:** required evidence cannot be collected in this run."
- "**Waived with evidence:** the failure is established, but an authorized, scoped, evidenced exception applies. Record its authority and review or expiry condition. A waiver is not a pass or false positive."
- "**Observation:** a preference or optional tradeoff is recorded without claiming a defect."

"A suppression is valid only when every documented predicate is observed. Record the file, line, predicate, and the read or search evidence."

**Design-tagged rules on an owner's design.** "the tag is not a proof class. Some are creative-direction preferences; others are accessibility, behavior, compatibility, or performance risks." "Never auto-ship a creative-direction change without explicit design-review authorization, a supplied brief, rendered comparison, and local design-system context." "For a design review, keeping an intentional pattern with documented evidence is a valid outcome." app-ui records such a decision: "no focus ring anywhere (a recorded design decision, the browser default included: `:focus, :focus-visible { outline: none }` in the base layer)" ([app-ui SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/SKILL.md)). React Doctor's `no-outline-none` ("`outline:none` removes the focus ring" [React Doctor, improve-react]) fires on that line; keeping it, with that line as the evidence, is the outcome there.

## When a fix counts

Source: [React Doctor, playbook]. "A finding counts as fixed only when all applicable checks pass":

1. "Focused tests for the changed behavior."
2. "The repository-mandated typecheck, lint, test, and formatting checks."
3. "A React Doctor rescan using the same executable version, scope, projects, and original categories to prove the target disappeared."
4. "A separate unfiltered regression scan over the affected projects or files to prove no cross-category diagnostic was introduced. If only a filtered scan is available, say 'no new diagnostic in the selected categories.'"
5. "Runtime, rendered, accessibility, or performance evidence required by the claim was actually collected."

- "If a check could not run, mark it **not run**; never convert unavailable evidence into a pass."
- "Never compare scores from different selections." "Label every score with its scanner version, project, scope, and category selection."
- improve-react's plan check is the same ratchet: the scanner's changed scope "clears the diagnostic without dropping the score", plus typecheck, lint and tests [React Doctor, improve-react].

## When a scan may be called clean

Source: [React Doctor, playbook]. "A scan is usable only when the JSON parses and `ok === true`." "Do not call an empty diagnostic list clean unless all of these hold":

- "React was not explicitly undetected."
- "Every selected project is present and complete."
- "The requested lint coverage completed."
- "No required check was unexpectedly skipped."
- "The baseline is not degraded."
- "At least the expected project and file scope was analyzed."

"Otherwise report an incomplete scan and its exact coverage reason." When the selected scope holds no changed supported source files, report "**Skipped: no applicable source files in the selected scope**. This is neither a clean React scan nor an incomplete scan." "Never reconstruct the score manually." "The code here is already solid" is a valid audit result once these hold [React Doctor, improve-react].

## Prove it

The scan's version, scope, selected projects and coverage state are recorded; the pre-edit check baseline lists each command, exit status and failure fingerprint; every finding in the report has a rule id (or "Beyond the scan"), a P0 to P3 severity set by leverage, a status by cause and one verdict, with each Rejected or suppressed finding carrying its predicate and evidence; any rule change used the narrowest control and was rescanned; every fixed finding passed the same-selection rescan and a separate unfiltered scan, with checks that did not run marked **not run**; and "clean" appears only when all six conditions above hold.
