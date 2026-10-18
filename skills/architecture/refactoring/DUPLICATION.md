# Duplication and maintenance hotspots

Use jscpd to find candidate copies and rank maintenance work, then read the actual code before changing it. Sources: [kucherenko/jscpd, jscpd, dry-refactoring, codebase-refactoring], checked against the [official CLI](https://github.com/kucherenko/jscpd/blob/v5.4.1/rust/crates/cpd/src/cli.rs) and the version qualifications below. This is a tool reference; the [reuse test](../../anti-ai-slop/anti-slop-code/RULES.md#structure) and [refactoring transformations](SKILL.md#techniques-smallest-first) keep their definitions at those owners.

## Establish the scan

[kucherenko/jscpd, jscpd; dry-refactoring; codebase-refactoring]

- Check the installed version and its supported options. Record the scoped paths, exclusions, formats, detection flags and report locations so a later measurement compares the same thing.
- Start with an exact-clone scan. Use `--reporters ai` for compact locations and kinds, `--reporters json` for structured processing, or `--reporters html` for a browsable clone report. `--output` chooses the report directory.
- Exclude installed packages, generated code and build output with `--ignore`. `.gitignore` is respected by default; `--no-gitignore` changes that. `--pattern` narrows files; `--format` narrows languages. Keep those choices visible in the report.
- For a mixed JavaScript/TypeScript tree, `--cross-formats "js-ts"` shares a comparison pool across JavaScript, JSX, TypeScript and TSX. TypeScript's erasable type syntax is stripped for this comparison; reported positions still refer to the original files. Without cross-format grouping, formats are compared separately.
- Use `--summary` to add hotspot rankings. A large file with a large duplicated share is a useful place to inspect first. `--summary-by` selects tokens, lines, size or complexity, and `--summary-top` controls how many entries are shown. Folder rows aggregate direct parents rather than recursively accumulating every ancestor.
- Keep changed detection configurations separate. Normalized runs produce different clone fingerprints from exact runs, so each configuration needs its own baseline if a baseline is used.

The source's exact-scan command, unchanged: [kucherenko/jscpd, dry-refactoring/SKILL.md]

```bash
npx jscpd --reporters ai <path>
```

## Widen one detector at a time

[kucherenko/jscpd, jscpd; dry-refactoring]

| Pass | What the report means | Triage |
| --- | --- | --- |
| Exact | Matching token sequences; no kind suffix in the compact report | Read the reported source spans before extraction. |
| Renamed | `(renamed)` after ignoring selected names, literals or annotations | List the differences explicitly; normalization can hide distinct responsibilities. |
| Gap | A `gap` similarity suffix joins exact fragments across a bounded unmatched span | Inspect the unmatched lines and whether they change meaning. |
| AST | An `ast` similarity suffix compares normalized function structure | Read both functions; score is structural overlap, not behavioral equivalence. |

- Run renamed and near-miss passes after the exact scan, separately enough to attribute each hit to the detector that produced it. Never report a normalized count as a count of confirmed duplicate implementations.
- `--ignore-identifiers` widens name matching, `--ignore-literals` widens value matching, and `--ignore-annotations` removes supported annotations/decorators. Add literal normalization only when changed constants are the suspected difference. In the supported stack, annotation normalization includes Dart, JavaScript and TypeScript.
- Raise `--min-tokens` for identifier-normalized scans because short normalized blocks contain little distinguishing information. The source starts this pass at 70 tokens as an author workflow choice, rather than a universal defect threshold.
- `--max-gap-lines` merges exact fragments separated by at most that many unmatched lines; its default is off. The source's conservative starting choice is one or two gap lines.
- `--similarity` adds AST matches for supported JavaScript/TypeScript functions; `--min-nodes` excludes very small normalized trees. Do not infer Dart AST-similarity support from Dart annotation support. For other formats use a supported detector rather than silently treating an empty AST result as no duplication.
- The source offers different AST starting thresholds in different sections: a tight `0.85`-or-higher triage pass and the tool's `0.8` default. Keep the chosen threshold in the record; neither is a probability that a pair is safe to merge.
- Do not gate on noisy normalized passes until their findings have been reviewed for the actual codebase. `--kind` filters reported kinds; it does not enable a detector.

## Read before extracting

[kucherenko/jscpd, dry-refactoring]

- Read both original spans and name their behavior, side effects and differences. Skip generated code, intentional model/configuration/route/test boilerplate, unrelated reducers or switches, and candidates whose shared abstraction cannot receive a precise name.
- A small candidate or weak structural match may be a shared idiom rather than a shared implementation. Record why it stays separate. The source's approximate size/score heuristics are triage preferences, not automatic merge rules.
- Use the existing [reuse test](../../anti-ai-slop/anti-slop-code/RULES.md#structure) and [transformations](SKILL.md#techniques-smallest-first) to choose an extraction. For a gap match, decide whether the unmatched step belongs with the caller or is a real variation in the shared behavior. If it changes the meaning, keep the distinct functions and consider only their shared parts.
- A cross-format copy can be an incomplete move: find the canonical implementation before creating a third copy. Several renamed copies may share one real seam; inspect the group before extracting each pair independently.
- Update every caller through the existing canonical reuse workflow. Remeasure with the same detector and flags that found the candidate; an exact-only scan cannot show that a renamed candidate disappeared.
- Report rejected candidates separately from refactored ones, with their reason. A falling duplicate percentage does not establish preserved behavior; use the project's authorized verification separately.

## Dead code, complexity and the dashboard

[kucherenko/jscpd, codebase-refactoring; jscpd]

- `--dashboard` gives the combined duplication, complexity and dead-code view. Its console reporter includes per-file detail; the `ai` form is a compact health summary. Use JSON for structured detail. `--health` returns the aggregate score alone.
- `n/a` means that dimension was not measured, not that it is clean. Compare health scores only with the same dimensions and file scope. The score is a calibrated tool heuristic, not independent proof of project quality.
- Let the weakest measured dimension guide the first pass. The source's default ordering is duplication, dead code, complexity, so later work does not analyze paths an earlier pass will remove. Keep changes attributable to the dimension they address.
- `--dead-code` follows entry-point reachability for JavaScript, TypeScript, JSX and TSX in this stack. `--entry` adds project entry points. An unused caller can make its private dependency unreachable too; after an approved removal, another finding may become true.
- Categories are unused file, export, module-private symbol and import. `--dead-code-categories` narrows them; `--include-entry-exports` includes entry-file exports normally treated as public API; `--min-confidence` sets a reporting floor, not deletion permission.
- Inspect dynamic lookup, string-based routing, unsupported files and parse failures before deleting a finding. The JSON `statistics.unparsedFiles` field helps identify incomplete analysis. Keep intentionally public exports and unresolved findings visible rather than deleting them to improve the score.
- `--complexity` reports a token-based branching estimate. Read it as a ranking signal. A split that moves the same branching into another file has not simplified the function. The tool's health calibration uses a complexity threshold of 50; that setting is not a project-wide maximum.
- After an approved change, recheck the affected dimension with its original settings and retain the before/after evidence. For two-tree function comparison, use [FUNCTION-PARITY.md](../system-migration/FUNCTION-PARITY.md).

## Corrections to the supplied reference

- **P2, identifier flag version.** In the verified [v5.4.1 CLI](https://github.com/kucherenko/jscpd/blob/v5.4.1/rust/crates/cpd/src/cli.rs#L468), `--ignore-identifiers` is boolean. The source describes consistent-renaming matching plus `--ignore-identifiers=blind`, which belongs to the later [master CLI](https://github.com/kucherenko/jscpd/blob/master/rust/crates/cpd/src/cli.rs#L469). Do not assume that syntax or guarantee for an unqualified package runner. [kucherenko/jscpd, jscpd/SKILL.md]
- **P2, test-file inclusion.** The [official CLI](https://github.com/kucherenko/jscpd/blob/master/rust/crates/cpd/src/cli.rs#L646) defines `--include-tests` as reporting dead code inside test, fixture and example files. Test files remain entry points; this is separate from identifying production exports used only by tests. The supplied skills instead described opposite changes to whether test-only usage counts as used. [kucherenko/jscpd, jscpd/SKILL.md; codebase-refactoring/SKILL.md]
- **P2, confidence reasons.** The [official scorer](https://github.com/kucherenko/jscpd/blob/master/rust/crates/basta/src/confidence.rs) can give an unused export 85 with no contrary-evidence reasons. Read reasons when present; their absence does not imply a score of at least 90. The source promised a reason for every score below 90. [kucherenko/jscpd, codebase-refactoring/SKILL.md]
- **P3, AST fallback.** The [official similarity implementation](https://github.com/kucherenko/jscpd/blob/master/rust/crates/cpd-similarity/src/lib.rs#L53) uses the configured ratio, otherwise `0.8`, when the CLI option has no ratio. One source command comment instead says 82 percent. [kucherenko/jscpd, jscpd/SKILL.md]

## Prove it

The report records the installed version, paths, formats, exclusions and detector settings; every acted-on candidate has both source spans inspected and its semantic differences accounted for; rejected candidates have reasons; before/after scans use identical settings; health comparisons name unmeasured or changed dimensions; dead-code deletions have independent reachability evidence; and behavior verification is reported separately from tool scores. [kucherenko/jscpd, jscpd; dry-refactoring; codebase-refactoring]
