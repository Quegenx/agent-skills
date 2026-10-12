# AGENTS.md

## Architecture

- When a change makes a path obsolete, remove it. Use an explicit data or schema
  migration when valid persisted data requires one. Keep an old path only when
  compatibility is required; mark it deprecated and point to its replacement.
- Grow in layers from the smallest version that works end to end. Never trade a
  working product for unfinished complexity.
- Keep related behavior together. Split a component only when it owns unrelated
  responsibilities.
- Prefer established, already-installed dependencies over new packages or
  reimplementation. Check their docs and types first.
- Make architectural decisions for the long term. Do not accept a stopgap meant
  to be replaced later. Study how established products solve the problem; adopt
  their patterns rather than inventing an approach from scratch.
- When documenting architecture, separate interpretation from measurement. Trace
  every claimed dependency and flow to source code. Derive counts mechanically.
  Never invent unverifiable relationships.

## Code Discoverability

Write code so humans and agents can find it through plain-text search.

- Public symbols: two to four words with a domain term. Give generic verbs their
  object: `validateSmtpConfig`, not `validate`. Use the shortest name that
  searches uniquely; do not rely on a directory or import path to disambiguate.
- One spelling and one definition site per concept. Reuse established vocabulary.
  When moving code, delete the original in the same change. Rename symbols and
  files when behavior or audience changes; stale names are defects.
- Name files after the concept they implement, not `utils`, `helpers`, `types`,
  `config`, or `handlers` unless a framework requires it.
- Prefer precise, searchable types over `any` or swappable primitives. For
  privileged operations, accept a capability-scoped type instead of a broad
  client when that prevents unintended access.
- Put non-obvious constraints at the definition, including the phrase a
  developer would search for. Choose imported names and definition comments so
  callers need not open the source module.
- Prefer direct named exports and imports. Avoid broad re-export barrels unless
  a framework requires one.
- Keep event names, flags, error codes, and other identifiers as complete
  literals. Give errors a distinctive literal prefix. Keep one searchable
  concept per file and orchestration modules thin.
- Follow the project's test-location convention. Name tests after the source or
  behavior they cover. If expected behavior is deliberately absent, document
  that where a developer would search for it.

## Working Style

These guidelines bias toward caution over speed. For one-line or
documentation-only changes, skip the full planning workflow unless the change is
risky, ambiguous, or cross-cutting. Work like a lazy senior developer: efficient,
not careless. Do not cut corners on understanding the problem, input validation
at trust boundaries, error handling that prevents data loss, security,
accessibility, hardware calibration, or anything explicitly requested. The
platform is never the spec ideal: a clock drifts, a sensor reads off.

### Think Before Coding

**Surface material assumptions and tradeoffs.**

- Read the relevant code, tests, and configuration directly. Do not work from
  search snippets or guesses.
- Resolve routine implementation choices using the task and repository context.
  State material assumptions. Ask when unresolved uncertainty would materially
  affect scope, correctness, or an irreversible action; continue independent
  work that does not depend on the answer.
- If a simpler approach satisfies the requirements with fewer dependencies,
  files, or abstractions, propose it before implementing the more complex option.

Bug fix = root cause, not symptom. Find every caller of the function you touch
and fix the shared function once. One guard there is smaller than one per
caller. Patching only the path the ticket names leaves a sibling caller still
broken.

### Simplicity First

The ladder runs after you understand the problem: read the task and the code it
touches, trace the flow end to end, then climb. Before adding reusable
functionality, search by name and behavior. Inspect existing implementations,
callers, tests, and contracts first.

1. Does this need to be built at all? (YAGNI)
2. Does it already exist here? Reuse it.
3. Does the standard library already do this? Use it.
4. Does a native platform feature cover it? Use it.
5. Does an already-installed dependency solve it? Use it.
6. Can this be one line? Make it one line.
7. Only then: write the minimum code that works.

- No features beyond what was asked.
- No abstractions for single-use code.
- No new dependency when the standard library or existing project code
  suffices.
- Remove only dead code created by the current change unless broader cleanup
  was requested.
- No error handling for impossible scenarios. If you write 200 lines and it
  could be 50, rewrite it. Deletion over addition. Boring over clever. Fewest
  files possible. Shortest working diff wins, but only once you understand the
  problem. The smallest change in the wrong place is a second bug.
- When two standard-library approaches are the same size, pick the
  edge-case-correct one.
- Mark a deliberate simplification that cuts a real corner (global lock, O(n²)
  scan, naive heuristic) with a comment naming the ceiling and upgrade path.

### Surgical Changes

- Do not improve adjacent code, comments, or formatting.
- Do not refactor things that are not broken. Match existing style.
- If you notice unrelated dead code, mention it; do not delete it.
- Remove imports, variables, or functions that your changes made unused. Do not
  remove pre-existing dead code unless asked.
- Every changed line traces to the request. Leave no debug code, backup copies,
  or scratch files.

**Pause and confirm.** Read-only discovery is always allowed. If the task has
not already authorized it, get approval before:

- Expanding the scope or touching unrelated files
- Adding a dependency, framework, service, or new test infrastructure
- Changing a public API, schema, storage format, or wire format
- Deleting user data, discarding uncommitted work, rewriting history, or keeping
  two implementations of the same behavior

### Goal-Driven Execution

Use a brief plan when complexity or risk warrants it. Explain the intended
outcome, consequential decisions, and how success will be checked; routine
changes do not need a fixed planning template.

Continue through implementation, appropriate verification, and fixes caused by
the requested change within the authorized scope. Do not stop after the first
implementation merely to request review. Seek additional approval when the next
action exceeds the existing authorization.

Choose verification proportional to the change and its risks. Prefer relevant
existing tests; add or extend coverage when changed behavior warrants it or the
user requests it. For bug fixes, reproduce the failure first when practical.
Do not create a separate self-check merely to satisfy a workflow requirement.
Once the relevant checks pass, repeat or broaden them only when new changes,
failures, or unresolved concerns justify it.

Done means the requested behavior works, relevant checks are complete, and
actual validation results and remaining limitations are reported plainly.

## End-to-End and Acceptance Tests

When writing tests for user-facing journeys:

- Cover one coherent user journey per test.
- Write steps as plain-language instructions a teammate could follow without
  reading the implementation. Describe user intent and observable outcomes, not
  selectors, component names, internal APIs, or arbitrary waits.
- Give each step one purpose and stopping point. Keep actions and assertions
  separate. Use visible labels and business context to disambiguate actions.
- Make every assertion specific enough to pass or fail objectively. Require
  exact wording only when the wording is part of the behavior.
- Keep secrets out of test definitions, output, and reports.
- Report the exact validation performed and its actual result. Do not claim
  coverage for tests that were not created, updated, and run.

## Writing and Editing

When editing prose:

- Preserve the writer's meaning, vocabulary, cadence, personality, uncertainty,
  and polish. Make the minimum effective edit. Leave strong sentences alone; do
  not rewrite distinctive language for consistency or equalize polish.
- Do not invent claims, examples, statistics, quotes, or opinions. Ask when
  meaning, audience, or format is unclear.
- Lead with the point. Prefer active voice, concrete facts, and direct verbs.
  Remove filler, inflated claims, vague attribution, robotic repetition,
  rhetorical setups, and redundant summaries only when they weaken the writing.
- Preserve nuance, structure, bluntness, humor, and imperfections that belong
  to the writer's voice.
- For detection or audit requests, name each pattern and quote the evidence. Do
  not rewrite, score, or claim that AI wrote it.
- After rewriting, verify intent is preserved and return the complete draft
  with a short "What changed" summary.

## Tooling

- When a task needs multiple independent MCP or tool calls, run them in
  parallel when safe.
- For local code discovery, search, and retrieval, use the installed tools
  below instead of built-in file-search or grep tools. Choose the tool that
  answers the task; do not call all three by default:
  1. **FFF MCP** for file discovery and focused text/content search.
  2. **CodeDB MCP** for symbols, callers, dependencies, code context, and
     source retrieval. Pass `semantic="local"` on context requests.
  3. **ast-grep MCP** for syntax-aware code patterns: `find_code` for simple
     patterns and `find_code_by_rule` for contextual or complex rules. Use
     `test_match_code_rule` and `dump_syntax_tree` when developing or debugging
     a rule. Pass the active project's absolute path as `project_folder`.
     For Dart call patterns, use `find_code_by_rule` with function context and
     an `expression_statement` selector when a bare pattern would parse as a
     declaration.
- Keep searches and indexing scoped to the active project. Do not pass another
  repository in CodeDB's `project` argument unless the user requests it.
- Before completeness claims, verify index freshness and exhaust result
  pagination. Do not treat fuzzy matches or truncated output as exhaustive
  exact-search results.
- If a required tool is unavailable or cannot perform the requested operation,
  report the limitation; do not silently substitute built-in search, `rg`,
  `grep`, `find`, or a Python search script.
- Native file-editing tools and shell commands remain available for edits,
  builds, and tests. Use **Python** for bespoke analysis, not as a replacement
  for the code-search tools above.
- Use the **Octocode MCP** for source-first research in external GitHub repos,
  upstream behavior, and cross-repo comparisons, not as another local-search
  layer.
- Use the **Context7 MCP** first for library or framework documentation.
- Use the **Mintlify MCP** for implementation questions that need a compact
  cited answer from primary developer documentation and the web.
- For web search, choose one of **Tavily**, **Exa**, or **octen** per question;
  never fan out all three or use the default web search tools.
