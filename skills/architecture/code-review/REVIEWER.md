# The AI reviewer

Every pull request gets an AI review before a person looks. It reads the diff against the whole repo and the PR's stated intent, and asks: does the change solve its problem, fit the system, or break something else? On a bug fix, it looks for the root cause. What it should look for inside the diff is [anti-slop-code](../../anti-ai-slop/anti-slop-code/SKILL.md); this file is how the reviewer is set up, run and answered.

## What the reviewer reads

- **CLAUDE.md** tells the agent what the project is: the stack, the conventions, the goals and the non-goals. Every review loads it, so in a large codebase keep it short and point to other docs from there. The reviewer also flags code that breaks a convention in it, and changes that make a line in it out of date.
- **REVIEW.md,** written by code owners, tells the reviewer what matters in their part of the code. Check separately whether the reviewer actually follows it.

### Writing a REVIEW.md

The good ones are short. They:

- **Say what failure looks like in that repo:** for docs it's "it lies", for config it's "it misroutes".
- **Cap the nits.**
- **List paths to skip.**
- **Ask for a file and line as evidence** instead of a guess from a name.
- **Ask for a summary that starts with a count** and says plainly when there's nothing to fix.
- **Collect repeated review comments.** Move a comment you keep making into REVIEW.md ([TUNING-THE-REVIEWER.md](TUNING-THE-REVIEWER.md)).

## Review depth

Admins set each repo to Quick, Standard, or Deep. Deep is worth it where one missed bug costs more than the extra review time. Match review effort to risk: a quick pass on routine changes, a deep one where a missed bug is expensive.

- **What to expect:** when the research preview launched, the share of internal PRs getting substantive review comments went from 16% to 54%. Most PRs over 1,000 lines get findings, and most small ones come back clean.
- **Most coding tasks don't need a panel of five reviewers.** Ask whether it really needs more compute: dynamic workflows often use more tokens and are best suited for complex, high value tasks, and parallelism and specialization have to earn their coordination cost.

## Verifying findings before anyone sees them

Findings get verified by other agents before humans review them.

1. **Several agents look for bugs at the same time.**
2. **A separate group votes on each finding,** and it only gets posted if enough of them agree it's real.
3. **Findings that are only about style, diagnostics, or cleanup get dropped.** A/B test those filters on your own PRs before keeping them.
4. **What's left shows up as inline comments sorted by severity.**

**Keep the voters apart from the finders.** An agent tends to prefer its own results or findings, especially when asked to verify or judge them against a rubric; separate subagents with their own contexts and focused goals counter it.

## Tags and output

- **Each finding is tagged Important, Nit, or Pre-existing,** so a bug the PR didn't introduce doesn't look like the author's fault.
- **Sorted by severity,** inline on the line it's about, with the file and line as evidence.
- **Flag the class of bug,** so the author fixes every instance, not one line.
- **The summary starts with a count** and says plainly when there's nothing to fix.
- **For a per-file verdict** (clean, minor, inflated, unneeded, blocker), use the output table in [anti-slop-code](../../anti-ai-slop/anti-slop-code/SKILL.md).

A review prompt to run locally or in a subagent:

```prompt
Review the diff on this branch against main.
List only problems you'd block the merge for. For each one, give the file and line, why it's wrong, and how to show it fails.
```

To review code, or to explain a PR to someone reviewing your code, render it as an HTML page: the diff with margin annotations attached to specific lines, tagged blocking, nit and nice.

```prompt
Help me review this PR by creating an HTML artifact that describes it. I'm not very familiar with the streaming/backpressure logic, so focus on that. Render the actual diff with inline margin annotations, color-code findings by severity and whatever else might be needed to convey the concept well.
```

## Every finding has to be answered

- **Fix it or resolve the thread with a reason.** That's also how you clear a false positive: close the thread with a short reason.
- **No merge with an open finding.** A PR can't merge while any finding from the bug review or the security review is still open. Require every review thread resolved before merge.
- **A later commit that fixes the issue clears the finding on its own.**
- **An agent can pick up the fixes.** Often one picks them up overnight, so the author comes back to a PR that's already been through another round. A fixing agent pushes clear fixes for failing checks and review comments, explains what it changed, and asks about anything ambiguous or architectural.
- **Every round costs a round.** A person can wave off a nit in seconds; an agent author fixes it, which means another commit and another round, so noise and round caps matter ([TUNING-THE-REVIEWER.md](TUNING-THE-REVIEWER.md)).

## Security review

Security gets its own automated review, and it can block: its findings follow the same rule as the bug review's. Run it with the `/security-review` command or the open-source security review GitHub Action; setup is in [automated security reviews in Claude Code](https://support.claude.com/en/articles/11932705-automated-security-reviews-in-claude-code).

A long security review in one context can stop early and declare the job done after partial progress, for example addressing 35 of the 50 items. Split big reviews across agents (below).

## Running the reviewer locally

- **Before opening a PR:** run `/code-review` (a lighter local version of Code Review for Claude Code) and `/security-review`, or a fresh-context subagent review.
- **Review skills can run automatically,** as part of hooks or inside a GitHub Action. One example from the Claude Code team's skills: `adversarial-review` spawns a fresh-eyes subagent to critique, implements fixes, and iterates until findings degrade to nitpicks.
- **On a team:** Code Review for Claude Code (Team and Enterprise plans) or the Claude Code GitHub Action on every PR. Start on one repo, tune REVIEW.md for a few weeks, then widen.

## Bigger reviews with more agents

- **Split a review across a large codebase:** for an audit, a migration, or a review across a large codebase, ask the agent to split the work across subagents and check each result.
- **Rule-by-rule review.** For rules the agent misses even when they're in CLAUDE.md, run one verifier agent per rule in a clean context over the diff, then a skeptic agent that re-reads each flag to separate real violations from false positives.
- **Fix, then adversarial review, per unit.** For migrations and refactors, break the task into units (callsites, failing tests, modules), spin off a subagent for every fix in a worktree, have another agent adversarially review it, and merge.
- **A rubric for taste.** Give a review agent a rubric for what a good solution looks like (for example, what good API design looks like); the task is complete when the review agent judges the criteria met.
- **Old code too.** Review agents also run nightly over existing code, catching old bugs before they show up somewhere else.

## Anti-patterns

- **Posting every candidate finding** without a vote, including style and cleanup-only comments.
- **Untagged findings** that blame the author for a bug the PR didn't introduce.
- **A finding resolved with no reason,** or a merge with a thread still open.
- **A REVIEW.md nobody checks** the reviewer actually follows.
- **One long context for a big review,** which stops partway and calls it done.

## Prove it

CLAUDE.md is short and points to other docs; REVIEW.md names what failure looks like, caps nits, lists paths to skip and asks for file-and-line evidence and a summary that starts with a count; a check shows the reviewer follows REVIEW.md; every posted finding passed the vote, carries an Important, Nit or Pre-existing tag and a file and line; and branch protection blocks merge while any bug-review or security-review thread is open.
