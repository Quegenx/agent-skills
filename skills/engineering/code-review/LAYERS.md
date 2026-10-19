# The review path

Review used to be a gate at the end of the road: write the code, open a PR, wait for a colleague. Now it runs continuously, more like spellcheck while you write. Most changes have been reviewed and fixed by an agent at least once before a person is asked to look, which catches most routine mistakes and saves team attention for higher-level questions. The Claude Code team kept review but moved most of the reading to machines; from June to September its merged pull requests more than doubled while the share that had to be reverted fell by more than 40 percent.

## The goal and its guardrail

Human time covers both sides of review's cost: the time people spend reviewing, and the time they spend fixing what bad code breaks. Cutting the first doesn't help if the time just shows up in the second.

- **The goal:** most pull requests merge with at most one human in the loop, who can be the author, with no increase in reverts or incidents.
- **Measure human time:** human approvals per PR (median and 95th percentile), human comments, and how long a PR waits on a person.
- **Revert and incident rates are the guardrail.** If they rise, you haven't saved human time, you've only moved it.
- **Output is not efficiency.** Florian Kiem's "The art of not shipping everything": "most companies measure their efficiency by lines of code changed, average PRs, net new features shipped per week", and "Shipping a lot of features is not the benchmark. Knowing what to ship is."

## The layers

Each layer catches some problems and misses others. Few get through all of them, and rollback handles the rest. A person's attention goes where the risk is.

| Layer | What runs | Blocks merge |
|---|---|---|
| 1. Verified work | Before the PR exists: the agent runs checks and shows the output, a fresh-context subagent reviews the diff, pre-PR skills | No; it happens before a PR exists |
| 2. AI review | A review of every PR against the whole repo and the PR's stated intent ([REVIEWER.md](REVIEWER.md)) | Yes, while a finding is open |
| 3. Security review | Its own automated review | Yes, while a finding is open |
| 4. Required CI | Lint, type checks, tests on every platform, a build | Yes |
| 5. Human approval | Scaled by risk ([APPROVAL.md](APPROVAL.md)) | Yes, where the tier requires it |
| 6. Merge queue, flags, gradual release | Every check re-run against main with the change applied; new behavior behind a flag, used internally first | Yes (the queue) |
| 7. Fast detection, fast rollback | Flags off without a deploy, on-call, revert and incident dashboards | After the merge |

### 1. Verified before anyone else looks

Most review now happens before a PR exists.

- **Give the agent something it can run** (tests, a build or a screenshot to compare against the design) and ask it to show the output instead of saying it's done. Boris Cherny, who created Claude Code, estimates this makes the final result two to three times better: "Verification looks different for each domain. It might be as simple as running a bash command, or running a test suite, or testing the app in a browser or phone simulator."
- **A session that can run your tests checks its own work before it hands the work back.** Without that, you review changes nobody has run.
- **UI proof travels with the PR.** In Vercel's Rillet story, agents "spin up a browser in a sandbox to test the change and attach screenshots as proof", while the engineer reviews the pull request and merges it.
- **Then a subagent reviews the diff with fresh context.**
- **Pre-PR skills:** one hunts for bugs, one simplifies the diff, and one checks the behavior end to end. UI changes also get checked against the design guidelines.
- **The built-in pair** ([Claude Code commands](https://code.claude.com/docs/en/commands)): `/code-review` reviews "the current diff, or a PR number, branch, or path you pass, for correctness bugs", and `--fix` applies the findings; `/review` is an alias of it (before v2.1.223 `/review` was a separate single-pass, read-only PR review). `/simplify`: "Review the changed code for cleanup opportunities and apply the fixes. Four review agents run in parallel, covering reuse of existing helpers, simplification, efficiency, and whether the change is at the right level of abstraction. The review doesn't look for correctness bugs." React Doctor's `ship` skill still calls `/review` and runs its review stage against the rules file: "Read `AGENTS.md` first (its rules change)", then fix real violations, pausing "only if a fix would change behavior or broaden scope" [React Doctor, ship].
- **Commit rules** [React Doctor, ship]: "Stage only the intended changes; never commit secrets." "Write a concise commit message in the repo's style, focused on the why." Push with `-u` on the first push. "Git safety: no force-push to `main`, no skipped hooks, no `git config` changes."
- **List the checks it can run in a short CLAUDE.md,** plus hooks that run formatters and linters.

### 2 and 3. AI review and security review

Every PR gets an AI review before a person looks, and security gets its own automated review. A PR can't merge while any finding from either is still open: fix it or close the thread with a short reason. Setup, depth, tags and output are in [REVIEWER.md](REVIEWER.md).

### 4. Automated checks that block

The usual: lint, type checks, tests on every platform, and a build. A typical CLI pull request may run dozens of checks before anyone looks at it.

- **A change to a checker itself** (a lint rule, a detector, an evaluator) gets a base-and-head run over pinned inputs with exit codes `0` match, `1` changes, `2` invalid evidence: [lint-rule-authoring BASE-HEAD-PARITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/lint-rule-authoring/BASE-HEAD-PARITY.md). Triage of a scanner's findings on a change, and when its "no findings" may be called clean: [SCANNER-TRIAGE.md](SCANNER-TRIAGE.md).

- **A Lighthouse CI gate** posts its own GitHub status check; make that check required, and drop the `|| echo` its GitLab example ends with. Tokens and setup: [web-performance LIGHTHOUSE-CI.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/LIGHTHOUSE-CI.md#upload-tokens-and-status-checks).

- **The PR template asks how the change was tested and how to undo it,** under the headings "Testing", "Risk" and "How to revert". The agent can fill it in, but the person who asked for the change signs off on it.
- **A duplication gate** ([ApparenceKit](https://apparencekit.dev/blog/deslop-duplicate-code-flutter/)): Deslop (the tool is in [refactoring DUPLICATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/refactoring/DUPLICATION.md#deslop)) fails the step with exit code 3 above the ceiling, naming the measured percentage and the ceiling. `only-changed` reports only clusters the diff touches, so legacy duplication doesn't block every PR; `upload-artifact` keeps the HTML report. It posts no PR comment: read the `duplication-percent` step output and post it yourself. "Pin the version. Do not float on a tag."

```yaml
name: deslop
on: [push, pull_request]

jobs:
  duplication-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Nimblesite/Deslop@v0.32.0
        with:
          fail-over: "5.0"
```

### 5. Human approval, scaled by risk

A docs fix and an auto-updater change carry different risk, so they get different review. The tiers and the approval rules are in [APPROVAL.md](APPROVAL.md).

### 6. Merge queue, flags and a gradual release

- **The merge queue re-runs every check against main with the change applied,** so two PRs that pass separately can't combine into a broken main.
- **New behavior usually ships behind a flag** to the company's own employees first; heavy internal use often surfaces regressions before users do.
- **Public releases go to a `latest` channel first,** and a `stable` channel trails it.
- **PRs sized for risk and review.** On the claude.ai performance sprint, the agent came back with a PR, often several, sized for risk and review, with anything user-visible behind a flag. The guardrails were set up front: every PR went through automated review with at least one human approval, unit tests always came before optimizations, and anything that could cause a user-visible problem shipped behind a short-lived feature flag.

### 7. Fast detection, fast rollback

Some mistakes will still get through, so the last layer is about catching them fast.

- **Flags turn off without a deploy.**
- **A weekly on-call rotation,** and incident reviews that ask which layer should have caught the issue.
- **Noticing a bad merge still depends on people:** the author and on-call, as well as the revert and incident dashboards.
- **The named gap:** there are no circuit breakers yet that tighten approval when those numbers move, and the engineers want them before more code moves to zero-human merges.
- **Get faster at fixing, not slower at shipping.** One colleague said slowing down does lower your error rate, but mostly because you're doing less of everything.

## "You land it, you own it"

If you land a small or medium change and something still goes wrong, it's a team norm that you usually fix it. What keeps this from going badly:

- **Changes are small,** so they're easy to review, debug and revert.
- **Everything is reversible.** Flags, reverts and staged releases undo most mistakes in minutes.
- **Blast radius sets the bar.** Expensive code gets more people and more checks.
- **Regressions surface fast** through telemetry and internal use.
- **It isn't blame.** Owning a fix means you have the most context; incident reviews look at the system.

Ownership is also shared. Much of the team works in open channels where anyone can see what others are building, pick up a thread, or point an agent at a gap, and feedback comes from people who don't own the code too. That openness is a big part of how quality stays high without a gate on every line.

## When to change direction

Agents make it cheap to start things, so some work shouldn't land. Usually someone in the channel asks why, points at an earlier decision, or suggests a simpler route, and the author closes or reshapes the PR. Since the code was fast to write, closing the PR doesn't feel like a loss.

- **Raise a different direction in the thread early,** not as a blocking comment on a finished PR.

## Sharing context without reading every diff

Review's second job is to spread codebase understanding. There's no formal process for it on the Claude Code team: nobody keeps a complete mental model of the codebase in their head, and nobody needs to.

- **Ask for an explainer of exactly the slice you're about to change.** It takes minutes and reflects the code as it is today. Some go a step further and have the agent build a small artifact that visualizes that part of the code and teaches it the way that person likes to learn.
- **This beats reading trivial diffs line by line.** A one-line copy change teaches you almost nothing; an explainer for the module you're about to change teaches you a lot.
- **Work in open channels,** so you see what others are building while they build it.

## Rolling it out

The adoption list, in the order a change travels:

**Before the pull request**
- Give your agent checks it can run, listed in a short CLAUDE.md, plus hooks that run formatters and linters.
- Run `/code-review` and `/security-review` locally, or a fresh-context subagent review.
- Add a REVIEW.md, and move repeated review comments into it.

**On every pull request**
- Require CI, and add "Testing", "Risk" and "How to revert" to your PR template.
- Add an AI reviewer (Code Review for Claude Code, or the Claude Code GitHub Action) on one repo, tune REVIEW.md for a few weeks, then widen.
- Add automated security review, and require every review thread resolved before merge.
- Match review effort to risk: a quick pass on routine changes, a deep one where a missed bug is expensive.
- Cap review rounds; after the first few, re-review only the new diff.

**Approval**
- Write down risk tiers, set from the change rather than the author; start strict and loosen with evidence.
- Keep the lighter approval paths for authors you trust.
- Use CODEOWNERS and branch protection so auth, billing, CI and release workflows, and installers always need a person.
- Never let a bot's approval replace a required human's; dismiss approvals on new commits.

**Merge and after**
- Use a merge queue, feature flags, internal use first, staged releases and one-step rollback.
- Turn incidents and reverts into an eval set, and rescore the reviewer whenever its prompts, tools or model change.
- Measure human time, with revert and incident rates as the guardrail.

## Anti-patterns

- **Human reading as the only gate:** every diff waits on a colleague, at a volume nobody can read.
- **Cutting review time with no guardrail:** approvals drop, and the saved time reappears as reverts and incidents.
- **A blocking comment on a finished PR** for a direction that should have been raised in the thread early.
- **A change with no undo:** no flag, no staged release, no "How to revert" in the PR.

## Prove it

Human approvals per PR (median and 95th percentile), human comments and PR wait time are tracked, and revert and incident rates are tracked beside them and have not risen. Required CI, AI review and security review all block merge; the merge queue re-runs checks against main; the PR template has "Testing", "Risk" and "How to revert"; new behavior ships behind a flag that turns off without a deploy; and the last incident review named the layer that should have caught it.
