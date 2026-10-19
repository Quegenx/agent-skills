# Tuning the reviewer

The reviewer improves in a loop: every incident becomes a case, every change to the reviewer is scored against all of them, and noise and review rounds are measured beside recall. Building the eval itself (harness, judges, the fix loop, gates) is the [agent-evals](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-evals/SKILL.md) skill; this file is what to measure for a code reviewer.

## Incidents are the eval

- **Collect past PRs that caused incidents,** with their fix-forwards and reverts.
- **Have engineers who know that code confirm each bug and where it lived.**
- **Run the reviewer against that set daily.**
- **Keep a change to the reviewer only if the score went up;** drop it if not, then start the loop again with the next change. The eval grows with every incident, and every change to the reviewer is scored against all of it.
- **Rescore whenever the reviewer's prompts, tools or model change.**

## Measure noise

It's easy to catch more bugs if you don't mind flagging a lot of non-bugs, so recall needs a check.

- **Sort every comment by how the person on the PR responded:** they fixed it, said it was wrong, said the behavior was intentional, or decided it didn't matter.
- **Run the reviewer on PRs you know are clean,** and count how often it reports something that would have led someone to make a harmful change.
- **Write the priority down:** catching real bugs first, cutting review rounds second.
- **Noise costs more when the author is an agent.** A person can wave off a nit in seconds. An agent fixes it, which means another commit and another round of review.

## Review has to converge

An agent author and an agent reviewer can keep each other busy indefinitely. One CLI PR went through more than fifty rounds of review and fixes overnight before its author stopped it.

When the team ran git blame on what the reviewer kept flagging, about 59% of it was code that had been there since the reviewer's first pass. The reviewer was rarely finding new bugs; it was finding a few more old ones each round. Running several rounds by default, since each pass catches something new, can be worthwhile on a risky change, but not on every PR.

- **Track rounds-to-pass alongside recall.**
- **A round cap.** After three rounds, the reviewer asks the author to step back and reconsider the approach.
- **Diff-only re-review** after the first few passes.
- **Flag the class of bug,** so the author fixes every instance, not one line.
- **No repeats** of findings already posted.
- **Review existing code on its own schedule:** review agents also run nightly over existing code, catching old bugs before they show up somewhere else.

What the convergence changes did on internal PRs:

| Measure | Before | After |
|---|---|---|
| PRs passing after one review and fix round | 65% | 78% |
| PRs needing five or more rounds | 8.9% | 1.5% |
| Mean reviews to pass | 2.08 | 1.32 |

## Fix it at the source

When the automated reviewer keeps flagging the same thing, fix it at the source: in the skill, with a lint rule, or with an update to an instruction file such as CLAUDE.md or REVIEW.md.

- **When a review misses something, ask what the model didn't have in front of it,** and put the fix into a CLAUDE.md, a skill or a new check.
- **Mine recent sessions and code review comments for corrections you keep making.** Cluster them with parallel agents, adversarially verify each candidate (would this rule have prevented a real mistake?), and distill the survivors back into a CLAUDE.md.
- **Move repeated review comments into REVIEW.md.**

## Anti-patterns

- **Tuning for recall alone,** with no count of wrong, intentional or didn't-matter responses and no clean-PR run.
- **Unlimited rounds by default** between an agent author and an agent reviewer.
- **Re-reviewing the whole PR every round,** which surfaces a few more old bugs each time instead of checking the new diff.
- **Keeping a reviewer change that wasn't scored** against the incident set.
- **The same comment posted on PR after PR** instead of a lint rule, a skill fix or a REVIEW.md line.

## Prove it

The incident set exists, each case confirmed by an engineer who knows the code, and the reviewer runs against it daily and after every prompt, tool or model change; every reviewer comment is bucketed as fixed, wrong, intentional or didn't matter; a clean-PR run counts harmful false reports; rounds-to-pass is tracked beside recall; after three rounds the reviewer asks the author to reconsider the approach, it re-reviews only the new diff after the first few passes; and no finding is posted twice.
