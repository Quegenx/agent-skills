# Architecture skills

The design and structure of any codebase: architecture styles, system design, domain modeling, migrations, refactoring, algorithms, source research, testing, code review, debugging and engineering planning/execution. Details in the [main README](../../README.md#architecture).

13 skills.

## Skills

| Skill | Covers |
|---|---|
| [software-architecture](./software-architecture/SKILL.md) | Monolith, modular monolith or services; Clean Architecture vs vertical slices; module boundaries and data isolation; extracting a module; strangler-fig migration. Also: One-question logic prototypes with pure state, visible transitions and known-state scenarios. Transaction scope, source-qualified slice policies, isolation and rollback limits. |
| [system-design](./system-design/SKILL.md) | Load balancing, caching, queues, CDNs, feeds, sandboxes; worked designs from URL shorteners to data recovery. Commit-order limits and idempotent feed fan-out. |
| [domain-modeling](./domain-modeling/SKILL.md) | Bounded contexts, aggregates, invariants, domain and integration events, sagas, CQRS, event sourcing. Also: Canonical domain glossaries and lightweight ADRs for consequential tradeoffs. Shallow collection protection and projection watermark gaps. |
| [system-migration](./system-migration/SKILL.md) | Incremental ports, legacy rewrites, replacing a dependency whose license changed. Also: jscpd function comparisons, unmatched-function inspection and source-test coverage maps, with similarity separate from behavior. |
| [refactoring](./refactoring/SKILL.md) | Small verified steps, typed errors, a functional core, design principles as moves, dependency direction. Also: Deep modules, interface leverage/locality, deletion tests, jscpd clone/dead-code/complexity triage and corrected TypeScript structural compatibility. Updated coverage: Behavior-preserving changes, typed errors, deep modules, duplication and dependency-usage audits. Behavior-preserving validation, typestate and undo tradeoffs. |
| [algorithm-patterns](./algorithm-patterns/SKILL.md) | Recognizing the problem's shape: hash maps, windows, prefix sums, graphs, dynamic programming, budgets. JavaScript midpoint coercion and source-qualified numeric budgets. |
| [testing](./testing/SKILL.md) | Behavior tests, real Postgres, architecture/contracts, lint-rule validation, vertical slices and terminal harnesses. Independent oracles, re-auditing results after oracle faults, provider evidence, deliberate malformed fixtures, equivalent mutants and strike-lookahead coverage. |
| [code-review](./code-review/SKILL.md) | Review layers, risk tiers, reviewer evidence and round caps, change scope, base/head parity, scanner triage, repository/security audits, Ultracite and Lighthouse CI. P0 to P3 severity stays separate from introduced/regression/pre-existing status. Reachable failures, evidence levels, scoped no-finding reports, fresh fact derivation, symlink-safe scripts and consented decision storage. |
| [code-research](./code-research/SKILL.md) | Code questions answered from exact source, callers, history and observed results: strongest handles, evidence lanes, version identity, claim ledgers and bounded localization returns. |
| [debugging](./debugging/SKILL.md) | Reproduction, falsifiable hypotheses, shared root causes and evidence-based verification. Discriminating controls, tested-artifact identity and state-effect evidence limits. |
| [engineering-planning](./engineering-planning/SKILL.md) | Interviews, specifications, local work breakdown, decision maps, handoff plans, RFCs, human-only steps and accepted-plan execution/resume with a durable progress ledger. |
| [reverse-engineering](./reverse-engineering/SKILL.md) | Shipped JS/Electron, retained captures/scripts, source maps/import tracing, passive Node inspection, Flutter APK/AOT and offline WASM/SQLite artifacts, with scoped evidence and behavior-only handoffs. Routes exact UI reconstruction to pixel-reverse-engineer. |
| [pixel-reverse-engineer](./pixel-reverse-engineer/SKILL.md) | Exact component, section and animation reconstruction from live DOM, CSS, assets, JavaScript and behavior, adapted to the target stack without invented defaults. |
