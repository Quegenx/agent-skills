# Architecture skills

The design and structure of any codebase: architecture styles, system design, domain modeling, migrations, refactoring, algorithms, source research, developer documentation, testing, lint-rule authoring, code review, debugging and engineering planning/execution. Details in the [main README](../../README.md#architecture).

17 skills.

Entry points apply only the selected job's routes and checks. Cross-skill references use named public sources and the installed skill when available; framework-specific guides are independent choices.

## Skills

| Skill | Covers |
|---|---|
| [tester-army-e2e](tester-army-e2e/SKILL.md) | The tester-army/e2e web/mobile runner: exact steps, optional agent goals, replay, setup, traces, bug bashes and migration into this runner. |
| [e2e-testing](e2e-testing/SKILL.md) | Framework-neutral E2E journey design, observable actions/outcomes and routing to the project's selected test framework. |
| [software-architecture](software-architecture/SKILL.md) | Monolith, modular monolith or services; layers, slices, module boundaries, data ownership, scaling and service extraction. Logic prototypes, transaction scope, isolation and rollback limits remain here; legacy replacement execution routes to system-migration. |
| [system-design](system-design/SKILL.md) | Component choices, failure modes, load balancing, caching, queues, feeds and sandboxes with worked designs. Shared recovery procedures route to deployment and Postgres; the design example retains its architectural context. |
| [domain-modeling](domain-modeling/SKILL.md) | Bounded contexts, aggregates, invariants, domain and integration events, sagas, CQRS, event sourcing. Also: Canonical domain glossaries and lightweight ADRs for consequential tradeoffs. Shallow collection protection and projection watermark gaps. |
| [system-migration](system-migration/SKILL.md) | Incremental ports, legacy replacement, routing seams, synchronization/reconciliation, shadow reads and cutover, with tagged first-module ordering alternatives. Dependency replacement and jscpd function comparisons retain identity and behavior evidence. |
| [refactoring](refactoring/SKILL.md) | Behavior-preserving transformations, typed errors, module boundaries and duplication tools; verify the actual code being refactored. |
| [algorithm-patterns](algorithm-patterns/SKILL.md) | Recognizing algorithm cues: hash maps/sets, windows, prefix sums, graphs and dynamic programming, with duplicate-set detection and iterable/equality qualifications. JavaScript numeric and allocation limits remain source-qualified. |
| [testing](testing/SKILL.md) | Behavior tests, real Postgres, architecture/contracts, vertical TDD and terminal harnesses. Independent oracles, malformed fixtures and mutation evidence remain; named UI stress fixtures and lint-rule authoring route to their canonical owners. |
| [lint-rule-authoring](lint-rule-authoring/SKILL.md) | Researching, writing and validating lint rules/detectors: supported contracts, adversarial fixtures, pinned real-code corpora, fuzzing and replay seeds, FP/FN audits and base/head parity. Audit-only mode stays distinct from implementation; scanner consumers stay in code-review. |
| [code-review](code-review/SKILL.md) | Evidence-based change reviews, P0 to P3 severity, security/scanner triage and repository audits; process-rollout checks stay separate. |
| [code-research](code-research/SKILL.md) | Code questions answered from exact source, callers, history and observed results: strongest handles, evidence lanes, version identity, claim ledgers and bounded localization returns. |
| [developer-docs](developer-docs/SKILL.md) | Task-focused tutorials, how-tos and reference from verified source, checked snippet regions, navigation, redirects and generated Markdown; prose rules stay in anti-slop-writing. |
| [debugging](debugging/SKILL.md) | Reproduction, falsifiable hypotheses, shared root causes and evidence-based verification. Discriminating controls, tested-artifact identity and state-effect evidence limits. |
| [engineering-planning](engineering-planning/SKILL.md) | Interviews, specifications, local work breakdown, decision maps, handoff plans, RFCs, human-only procedures and accepted-plan execution/resume. Caller-transition tickets define local migration dependencies and final removal. The developer-tool product brief is a separately scoped artifact. |
| [reverse-engineering](reverse-engineering/SKILL.md) | Shipped JS/Electron, retained captures/scripts, source maps/import tracing, passive Node inspection, Flutter APK/AOT and offline WASM/SQLite artifacts, with scoped evidence and behavior-only handoffs. Owns the complete observed-traffic OpenAPI generator and its source prerequisites. Routes exact UI reconstruction to pixel-reverse-engineer. |
| [pixel-reverse-engineer](pixel-reverse-engineer/SKILL.md) | Exact component, section and animation reconstruction from live DOM, CSS, assets, JavaScript and behavior, adapted to the target stack without invented defaults. Owns explanation-only page inspection, with evidence separated from heuristic conclusions. |
