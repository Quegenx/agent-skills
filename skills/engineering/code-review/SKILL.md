---
name: code-review
description: "Reviews code at the volume agents write it: the review layers from verified work before the pull request through AI and security review, required CI, risk-tiered human approval, the merge queue, flags and fast rollback; the AI reviewer with CLAUDE.md and REVIEW.md, findings verified by vote with P0 to P3 severity and separate origin/status, scoping one change to its merge base and blast radius with Introduced, Regression and Pre-existing statuses and the removed lines read, round caps and diff-only re-review; evals that score the reviewer on past incidents and measure its noise; who owns a change once it lands; separate standards/specification review, feedback reception, repository audits and Ultracite setup/migration. Use when setting up or tuning code review for a team or repo, adding an AI reviewer or security review, writing risk tiers, approval rules or a REVIEW.md, or reviewing an agent-written pull request."
---

# Code review

When agents write the code, the number of changes goes up fast, and manual, line-by-line review becomes incredibly difficult if not impossible. Review still does two jobs: find and fix issues before they ship, and build shared context across the team. "Did a human read the code?" is an imprecise proxy for "what could go wrong with this change, and which check, automated or human, is the right one to catch it?" Most of the reading moves to machines, human time goes where the risk is, and mistakes are made fast and easy to undo. What to look for inside one diff (slop, defenses in the wrong places, should it exist, the per-file verdict table) is [anti-slop-code](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-code/SKILL.md); whether the tests can catch a bug is [testing](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/testing/SKILL.md).

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| The layers a change passes through (verified work, CI, AI review, security review, approval, merge queue, flags, rollback), the human-time goal and its guardrail, ownership, changing direction, sharing context, and rolling the process out | [LAYERS.md](LAYERS.md) |
| Risk tiers, who may approve what, approvals tied to a commit, the paths that always need a person, and the decisions humans keep | [APPROVAL.md](APPROVAL.md) |
| Setting up and running the AI reviewer: what it reads, CLAUDE.md and REVIEW.md, review depth, verifying findings, P0 to P3 severity with origin/status separate, output, review prompts, security review, rule-by-rule and fan-out reviews | [REVIEWER.md](REVIEWER.md) |
| Reviewing one change: resolving the range and its base, pull request refs, excluded paths, blast radius to consumers, Introduced, Regression and Pre-existing by cause with `git blame`, removed UI signals, absent states, the read-only rule, the scope block and report | [CHANGE-SCOPE.md](CHANGE-SCOPE.md) |
| Running a scanner or linter on a change: scopes with per-rule ownership, baseline scans and pre-edit check baselines, one pinned tool, warning exit codes, the narrowest rule control, triaging its findings by leverage, a verdict per finding, when a fix counts and when a scan may be called clean | [SCANNER-TRIAGE.md](SCANNER-TRIAGE.md) |
| Creating or evaluating a lint rule or detector, including comparisons of checker revisions | [lint-rule-authoring](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/lint-rule-authoring/SKILL.md) |
| Making the reviewer better: incidents as an eval, measuring noise, round caps and convergence, fixing repeated findings at the source | [TUNING-THE-REVIEWER.md](TUNING-THE-REVIEWER.md) |
| Checking repository standards and requested behavior as independent review lanes, with separate evidence and verdicts | [TWO-AXIS.md](TWO-AXIS.md) |
| Receiving feedback: verifying a suggestion, preserving accepted decisions, resolving dependent uncertainty and correcting evidence-based pushback | [RECEIVING-FEEDBACK.md](RECEIVING-FEEDBACK.md) |
| A repository audit: intent, expected load, coverage, confidence and fix risk, grounded direction options and selected plan artifacts | [REPOSITORY-AUDIT.md](REPOSITORY-AUDIT.md) |
| Security audit evidence: principal, boundary and result, coverage gaps, prior-result revalidation and independent verification of material replacements | [SECURITY-AUDITS.md](SECURITY-AUDITS.md) |
| Operating or migrating an explicitly selected Ultracite setup: installed commands, backend presets, doctor limits and conditional v5 to v8 migrations | [ultracite skill](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/ultracite/SKILL.md) |

## The rules

1. **Pick the check by what could go wrong,** not by whether a person read the code. Each layer catches some problems and misses others; incident reviews ask which layer should have caught the issue.
2. **The work is verified before anyone else looks.** Give the agent something it can run (tests, a build, a screenshot to compare against the design, a sandboxed browser's screenshots attached to the PR) and ask it to show the output instead of saying it's done; then a subagent reviews the diff with fresh context.
3. **Findings are verified before they're posted and answered before merge.** Several agents look for bugs, a separate group votes, and only findings enough of them agree on are posted. Each one is fixed or resolved with a reason; a PR can't merge while a bug-review or security-review finding is open.
4. **The change sets the risk tier, not the author.** Only trusted authors get the lighter paths, an agent's approval never fills a slot that calls for a human, and an approval covers one specific commit.
5. **Review has to converge.** After three rounds the reviewer asks the author to step back and reconsider the approach; later passes re-review only the new diff, flag the class of bug, and never repeat a posted finding.
6. **Score the reviewer, don't trust it.** Past incidents become its eval, run daily; its noise is measured by what people do with its comments; it's rescored whenever its prompts, tools or model change.
7. **Fix a repeated finding at the source:** in the skill, with a lint rule, or in CLAUDE.md or REVIEW.md, so the reviewer stops flagging the same thing.
8. **Whoever prompted the change is on the hook for it.** Changes stay small and reversible, blast radius sets the bar, and the person who lands a change usually fixes it.

## Prove it

For one change, use the selected review lane's evidence, findings and scope limits. The team-wide metrics, merge controls and reviewer evals below apply when setting up or evaluating the review process; they are not setup requirements for reviewing one diff.

Human time per PR is measured (human approvals per PR at the median and 95th percentile, human comments, how long a PR waits on a person) and revert and incident rates have not risen; every review thread on a merged PR is resolved; the paths that always need a person are enforced by CODEOWNERS and branch protection; the reviewer's incident eval runs and rounds-to-pass is tracked alongside recall; and every file's own Prove it checks pass for the parts you touched.
