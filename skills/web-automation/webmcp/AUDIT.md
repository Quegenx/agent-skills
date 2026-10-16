# The report and the quality rubric

## The report

- **Coverage:** list the capabilities considered and explain every exclusion.
- **Per implemented tool:** its contract, the backing code path, its risk and confirmation treatment, the actual Stagehand discovery and invocation result, and the probes it survived (PROBING.md).
- **Limits:** state the environments and browser support not tested.

## When to score

Only for a benchmark, quality audit, comparative or scored assessment; an ordinary integration needs no score. Apply the gates before any score: a high diagnostic score must not hide fabricated behavior, an unsafe consequence boundary or missing production discovery.

## The four gates

All are required; failing any one makes the integration **not qualified**, whatever the score.

1. **Real capability:** every tool traces to working behavior or data already in the product. No fabricated services, fake success, or wrappers around broken placeholders.
2. **Safe consequence boundary:** irreversible or external actions keep the existing auth and confirmation, and stay discovery-only in automated validation unless an explicitly authorized synthetic sandbox exists.
3. **Production discovery:** Stagehand v4 discovers the tools from the built app without an injected init script.
4. **Invocation proof:** Stagehand v4 invokes at least one read-only or reversible tool and verifies a structured result.

## Scoring

Each dimension scores 0 to 4; the weighted score is `sum(score / 4 * weight)`.

| Dimension | Weight |
|---|---|
| Capability fidelity | 20 |
| Input/schema quality | 15 |
| Safety and risk semantics | 15 |
| Stagehand behavior | 15 |
| Output quality | 10 |
| Integration lifecycle | 10 |
| UI/state congruence | 10 |
| Regression evidence | 5 |
| **Total** | **100** |

| Band | Score |
|---|---|
| Excellent | 90 to 100 |
| Good | 75 to 89 |
| Needs revision | 60 to 74 |
| Poor | below 60 |

**Coverage is reported separately and not scored:** the credible capabilities inventoried, the tools implemented, and the candidates rejected or deferred with reasons. A narrow one-tool integration can score highly, so never present the weighted score as proof of application-wide coverage.

## Required evidence

- Repo URL, immutable revision, license and category.
- The untouched scan summary and the manual inventory.
- Implemented and rejected tools, with reasons.
- Build and test commands with their outcomes.
- The Stagehand version and the v4 API used; the discovery count without injection, the invocation status, and the asserted output subset.
- A DOM check or an independent read-after-write for every mutation.
- Per-dimension scores, with evidence for every score below 4.
- Exact upstream, dependency, environment and coverage limits.

State that the evaluation measures an agent following this skill, not deterministic code generation, and prefer deterministic local functionality for comparative tests. Because the validator is a bounded happy-path subset check, a high-confidence audit adds the target-specific tests listed at the end of VALIDATION.md.

## What good looks like

- **A commerce app:** UI handlers traced through validation, authorization and side effects before choosing tools; search is read-only while the final checkout stays behind an app-enforced confirmation; existing schemas and business logic reused; Stagehand discovers every expected tool and invokes only safe synthetic fixtures.
- **A support portal:** tools mirror existing validators and current-user permissions; search and draft fixtures run against disposable data; sending a reply is not autosubmitted and is discovery-only unless an authorized sandbox exists; untrusted ticket and user content is annotated and treated as data; tools are registered at the app root.
- **Only a live URL:** the work routes to the init-script path (INIT-SCRIPT.md) and does not pretend to analyze source that was not provided.

## Prove it

All four gates pass with their evidence attached before a score is written; every non-perfect dimension cites its evidence; the coverage line sits beside the score, not inside it.
