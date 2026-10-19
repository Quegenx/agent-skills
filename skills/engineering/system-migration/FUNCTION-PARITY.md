# Function comparison during a migration

Use jscpd's two-tree function report as a map of likely counterparts and work to inspect, not proof that a port behaves correctly. Sources: [kucherenko/jscpd, compare-codebases, code-migration], checked against the [official comparison implementation](https://github.com/kucherenko/jscpd/blob/v5.4.1/rust/crates/cpd/src/compare/mod.rs) and the focused verification in this topic. General scan setup and duplication options live in [refactoring DUPLICATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/refactoring/DUPLICATION.md); the migration's unchanged end-to-end contract stays in [SKILL.md](SKILL.md#incremental-ports-new-language-runtime-or-framework).

## Scope and model

[kucherenko/jscpd, compare-codebases; code-migration]

- `--compare SOURCE TARGET` accepts exactly two non-overlapping paths and performs function comparison rather than clone detection. For a port, keep source first and target second. Point at relevant code trees, excluding generated code, installed packages, vendored dependencies and build output.
- Keep paths, their order, exclusions, size filters and the model fixed across progress measurements. A denominator or model change needs its own explanation rather than a claimed migration gain.
- The in-process embedding model must be available before comparison. The source documents the CodeRankEmbed download through `--semantic-download`; this reference does not authorize installing or downloading it. `--semantic-model` selects a model and `--semantic-url` selects an embeddings API. Treat a new service or model download as a separate environment choice.
- Compare the supported JavaScript/TypeScript trees in this repository's stack. The supplied comparison catalogue does not list Dart; do not infer Dart function-comparison support merely from jscpd's wider token-format catalogue.
- Source and target may both stay in production. The same report can show parity in both directions; neither side is automatically the desired implementation of every feature.

## What is and is not counted

[kucherenko/jscpd, compare-codebases]

- Code and tests have separate sections, and tests pair only with tests. JavaScript/TypeScript test titles can identify callback test cases even though ordinary anonymous callbacks are not compared. File and folder test conventions affect classification.
- Functions meeting `--min-tokens` and `--min-lines` count toward totals; the verified comparison defaults are 30 tokens and 5 lines. Smaller functions can appear as partners without adding to the counted total. Keep filters visible when interpreting percentages.
- Bodyless declarations, interfaces, types, constants, SQL and UI markup are outside the function map. Ordinary anonymous callbacks are outside it too. Track those migration obligations separately rather than claiming complete parity from a complete function percentage.
- Functions are paired by code first, using the model's similarity and match-separation rules. Remaining same-named functions can pair after name normalization and a similarity check within already-linked modules. `matchedBy: name` needs inspection; a common name does not guarantee the same job.
- Model levels such as high, medium and low describe its similarity scale, not severity or a probability of correct behavior. Small behavioral differences can remain inside a strong pair.

## Read and validate the map

[kucherenko/jscpd, compare-codebases; code-migration]

- Start with both percentages and their denominators. File rows show paired counts, average similarity, low-pair counts and the file holding most counterparts. The source-side unmatched list suggests remaining port work; target-only code can be necessary platform glue or a missed match.
- Inspect a sample of strong pairs, every weak pair and name-based pairs before calling the map reliable. Name the wrong pair and why it is wrong when one appears. Renamed pairs can explain why a name-only search missed a completed port.
- Before declaring an unmatched function missing, inspect the counterpart file and search for renamed, split or merged implementations and library/platform replacements. A short renamed helper or cross-language constructor can be missed.
- Keep both trees' module layouts comparable where practical because linked modules constrain name-based pairing. Do not rename correct code simply to raise the score, add empty source-named stubs or remove source functions to shrink the denominator.
- If a side reports no functions, inspect the path, supported formats and filters first. Empty output is not evidence that the capability is absent.
- Refresh the map before each batch when the source keeps changing. An old pair may disappear after a rewrite, and new source work can change the remaining scope.

## Bind behavior evidence to port work

[kucherenko/jscpd, code-migration]

- Use existing source coverage to map each source function to the tests exercising its line range and each test to the functions it reaches. Prefer per-test coverage, or per-test-file coverage where that is all the tooling provides. Refresh the map when source tests change.
- A covered line proves execution, not that an assertion checks that function's result. Prefer tests whose assertions concern the function's behavior. When a function has no meaningful coverage, record that gap before treating a target pair as verified.
- Keep inputs and expected outputs when translating a behavior check. Deliberate target differences require an explicit reason. Verify that a target test actually reaches the new target implementation rather than a mock, helper or retained old path.
- `readyToPort` lists unmatched source functions whose callees already have counterparts and gives caller counts. Use it as one ordering aid alongside test readiness, not a guaranteed topological plan: mutually unpaired cycles can leave no ready item.
- Record intentional non-ports, platform-only glue, target-native replacements and user-dropped features separately. A remaining percentage is explainable work, not automatically a defect to erase.
- **Two source workflows, scoped:** this migration source ports tests first, permits not-yet-runnable target checks, then ports functions with their related checks. Matt's [vertical TDD](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/testing/TDD.md) instead completes one behavior slice before imagining later tests. Keep the migration-specific preparation view tagged; it does not change the existing requirement that migration end-to-end checks remain unchanged. [kucherenko/jscpd, code-migration; mattpocock/skills, tdd]

## Reports and decisions

[kucherenko/jscpd, compare-codebases; code-migration]

- `console-full` includes every pair with its similarity and matching mode. JSON supports structured processing; Markdown supports a document, and HTML provides an offline dependency/migration map with a pair table. Keep generated reports outside the source tree or deliberately excluded from version control.
- JSON has separate `code` and `tests` sections. Each contains two `sides` with paths, functions, matched counts, percentages, file summaries, unmatched functions and `readyToPort`; `pairs` contains both function locations, similarity, level, renamed status and matching method. Locations are relative to each side.
- Report both port mapping and behavior evidence: recognized counterparts, checks translated and passing when authorized, wrong pairs inspected, unresolved functions, intentional differences and excluded non-function artifacts. A comparison's success exit code does not establish completeness.
- **P3 correction:** the supplied main jscpd reference omitted HTML from its comparison reporter list, although another supplied skill used it. The [verified comparison writer](https://github.com/kucherenko/jscpd/blob/v5.4.1/rust/crates/cpd/src/compare/mod.rs#L215) supports HTML in addition to console, console-full, JSON and Markdown. [kucherenko/jscpd, jscpd; compare-codebases]

## Prove it

Both scoped trees and the model/options are recorded; percentages retain their denominators; strong/weak/name-pair inspection is described; each claimed missing capability has a target search behind it; non-function work and intentional differences remain visible; a function's behavior evidence actually reaches its target implementation; and similarity, coverage and assertions are reported as distinct forms of evidence. [kucherenko/jscpd, compare-codebases; code-migration]
