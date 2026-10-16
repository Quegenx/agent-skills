# The fix loop

## The loop

1. **Full run** in a separate worktree pinned to a commit, in the background. It is slow and costs money: run it when asked, and use targeted reruns in between.
2. **List the failures** from the run records.
3. **Read each failed run in full:** the conversation, every tool call and its result, the reply, the check's reason. Never fix from the summary line.
4. **Triage** (below).
5. **Fix the root cause,** with a unit test that fails without the fix whenever the fix is in code.
6. **Targeted rerun:** only the affected cases, 3 to 5 repetitions, plus the cases the fix could disturb. Any change to the prompt, a tool description, a skill description or a gate can move other cases; rerun the routing eval after any of them.
7. **Project checks:** unit tests, type check, lint, prompt snapshots refreshed on purpose.
8. **Ship:** commit, deploy, health-check, knowing which deployment is production.
9. **Next full run,** compared case by case with the previous one. Repeat until a full run has no failures.

## Finding failures nobody has named yet

Before writing checks for a new agent, or when the suite passes and users still complain, find the failures in real traffic:

1. **A sample** of real conversations (around 50), spread across the kinds of users and requests.
2. **Open notes by a person:** for each, what happened, described as behaviour ("asked for the address twice"), not as a cause, and pass or fail. The person who knows the product writes these; an agent can prepare the sample and the review queue, not the judgment.
3. **Group the notes** into a short list of failure kinds, and count each.
4. **Decide per kind:** a fix (most), a code check, or a judge. Fix the frequent and costly kinds first; a kind seen once waits for a second sighting.

A first case set is small: 5 to 12 cases that each test something, reviewed by a person. Expected outputs an AI wrote are a draft, not ground truth. Keep each case's input, expected result and notes in separate fields.

## Triage: whose mistake is it?

| Kind | How to tell | What to do |
|---|---|---|
| **The agent was wrong** | A code check failed, or the judge failed it confidently and a person reading the chat agrees | Fix the agent. Usually most of the work. |
| **The judge was wrong** | The reply reads as correct; the judge was unsure (probability near 0.5, low confidence) and flips between repetitions | Clarify the question, only after calibration ([JUDGES.md](JUDGES.md)) |
| **The test was wrong** | A missing fixture, an unexpected service called, or the case expects something wrong | Fix the harness or the case, and say why. Not the agent's failure. |

Some low-confidence "noise" turns out to be real (an entry code asked for again after she wrote it). Read first, label second.

## Fix patterns, strongest first

1. **Exact data in the tool output,** copied by the agent.
2. **A tool that refuses the wrong state** with a distinctive code and what to do instead.
3. **A gate on the finished reply** for a mistake the model repeats: narrow, at most once or twice a turn, logged, unit-tested with the real failing reply and a correct neighbour.
4. **A reply check** for hard rules; when correct new behaviour trips it, change the behaviour, not the check.
5. **Prompt wording,** last.

The details of each are in the `agent-harness` skill's CHECKS.md.

## Mistakes that cost rounds

- **Fixing the sentence, not the cause.** Patching the one reply the case shows leaves a sibling path broken; find the shared function and fix it once.
- **A gate or rule that is too broad:** it fixes one case and breaks five; one opener gate that also fired on gift openers made the agent load playbooks twice. Narrow it and rerun the neighbours.
- **Two checks that disagree:** a reply one rule asks for gets rewritten by another. When a fix keeps failing, look for the second check.
- **An example in a skill description** that looks like the common case pulls the common case into the skill.
- **Exact-sentence assertions** failing correct replies.
- **Trusting one repetition,** and **mixing results from changed code.**
- **Stopping at "almost":** the last percent is where the real edge cases are; a failure that repeats across runs is real.

## Safety

- Tests never message real people, charge cards or send campaigns: guard the network and fail any unfixtured call.
- Know which deployment is production before deploying, and health-check it after.
- Never print secrets in logs, reports or test files.
- No fallbacks added to pass, no lint suppressions, no loosening of the grader.

## Handing it to an agent

Give it this skill, the project's own eval docs and its coding rules, and say: *Run the loop until a full run has zero failures. Fix root causes. Do not loosen checks; clarify a judge question only with calibration. Report each round's numbers.*
