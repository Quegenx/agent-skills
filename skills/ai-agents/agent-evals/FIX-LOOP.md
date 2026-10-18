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

## Before the loop starts, and inside each round

- **Agree on the frame first:** the metric to raise and the ones that must not drop, what may be edited and what is off-limits, the spend budget, a maximum number of rounds (three by default), and when a plateau ends it.
- **One hypothesis per round:** the cases that support it, the gain it predicts and what it could break. Save the diff and the run fingerprint with it.
- **Check the lever engaged** before reading the score: did retrieval fetch the context the change was meant to supply, did the new tool get called. A change that never ran can't have helped.
- **Distrust a sudden big jump;** look for a leak or a broken check first. Don't keep a win that sits inside the noise.
- **When rounds stall, name the bottleneck:** a missing capability or missing content, a grader that disagrees with people, infrastructure errors, information the agent can't reach, or plain variance. Fix that, not more prompt paragraphs.
- **What the loop never does:** lower a threshold, delete a hard case, switch the provider or model without asking, or merge and deploy by itself. When a failure isn't understood, add trace detail before making broad changes. A change to the runner or a grader is a measurement change, reviewed as one; fixing a grader keeps the old grades and regrades every output being compared.
- **To finish:** restore the best variant, confirm it once on the untouched test split, and report the deltas with their uncertainty and the spend. If the gain is within noise, say so and recommend against merging.
- **Effort fixes missed edge cases, not a wrong approach:** raising effort tends to reduce failures from missing edge cases, but does not fix a run where the model took the wrong approach.
- **Working on one part at a time:** open its lowest sub-score (an empty one means not measured, not low), read 5 to 10 failing cases, write the cause in one sentence, change one thing (the prompt, the code or a setting), check no other part fell, and log one line: version, change, before and after, proof.

## Hillclimbing

Improving a score one change at a time against a fixed eval:

- **What may change,** chosen by the owner: the system prompt, skills or instruction files, tool descriptions, the model, effort and other API parameters, the harness code. Prefer a surface that is cheap to change and revert (text such as prompts and skills) over open-ended harness edits, and one whose score is attributable to it: a skill's trigger rate is coupled to its description.
- **Name the goal first:** performance, or cost while performance holds. Open-ended "improve performance" on an eval near saturation tends to stall; on a saturated eval, cost is a strong goal (prompt caching, a prompt audit for the selected model, the model and effort setting).
- **Check the noise before the first round:** if how far the score can move by chance alone isn't smaller than the smallest improvement you'd act on, say so and add repetitions or cases.
- **One change per round, as a patch,** read from the previous round's train transcripts and aimed above the noise: fix the failing behaviour at its root (rewrite the section that causes it, add a missing rule) rather than reword a line.
- **Keep or revert:** train up and test flat, suspect overfitting and revert; any regression, revert; train and test both up, keep. The splits are in [HARNESS.md](HARNESS.md).
- **When the score stalls for two or three rounds,** run a round that makes no edit and sorts every remaining train failure by cause; do the same early if no single fix could gain more than the noise, and add repetitions or cases. It catches ambiguous cases, harness errors and run-to-run variance; only legitimate failures go into later rounds.
- **Once a model clears the bar, step down a tier** to see if a cheaper one clears it too. On a 44-ticket support benchmark (30 searched, 14 held out), a prompt audit that removed mandatory tool-call rituals, a scratchpad step and contradictory rules, then a newer model at low effort, then a cheaper tier and prompt fixes took accuracy on the searched tickets from 74.4% to 98.9% and cost from 4.6 to about 1 cent per ticket; on the held-out tickets, 90.5% against 78.6%, at about a fifth of the cost.
- **Give the hillclimber the primary sources** (the docs, the SDKs), so it can find errors and correct them itself.

## Finding failures nobody has named yet

Definitions and assignments have separate human acceptance, with unresolved notes and stable revision lineage: [REVIEW-AND-TAXONOMY.md](REVIEW-AND-TAXONOMY.md). [confident-ai/eval-skills, eval-discover and eval-error-analysis]

Before writing checks for a new agent, or when the suite passes and users still complain, find the failures in real traffic:

1. **A sample** of real conversations (around 50), spread across the kinds of users and requests.
2. **Open notes by a person:** for each, what happened, described as behaviour ("asked for the address twice"), not as a cause, and pass or fail. The person who knows the product writes these; an agent can prepare the sample and the review queue, not the judgment.
3. **Group the notes** into a short list of failure kinds, and count each.
4. **Decide per kind:** a fix (most), a code check, or a judge. Fix the frequent and costly kinds first; a kind seen once waits for a second sighting, unless it is severe, which stays visible however rare. When the agent runs on several models, a failure one model makes and the others don't stays out of the rules until it repeats.

Count distinct cases per kind over the number of cases reviewed; keep what was seen (the symptom) apart from what you think caused it. Renaming a kind keeps its id, and a merge or split keeps the mapping, so old counts still line up. Embedding search only proposes candidates for a kind; a person assigns them.

**After a fix, watch its kind's count** in similar work over time: it should start falling. When it does not, something about the fix is wrong: the rule is unclear, it isn't loading when it is needed, the stylesheet lacks a primitive that can express it, or it needs a deterministic check instead of prose.

A first case set is small: 5 to 12 cases that each test something, reviewed by a person. Expected outputs an AI wrote are a draft, not ground truth. Keep each case's input, expected result and notes in separate fields.

## Triage: whose mistake is it?

| Kind | How to tell | What to do |
|---|---|---|
| **The agent was wrong** | A code check failed, or the judge failed it confidently and a person reading the chat agrees | Fix the agent. Usually most of the work. |
| **The judge was wrong** | The reply reads as correct; the judge was unsure (probability near 0.5, low confidence) and flips between repetitions | Clarify the question, only after calibration ([JUDGES.md](JUDGES.md)) |
| **The test was wrong** | A missing fixture, an unexpected service called, or the case expects something wrong; a case that never improves after the obvious content gaps are fixed (a task asked for one error type caught while its grader wanted a chain of three) | Fix the harness or the case, and say why. Not the agent's failure. |

Some low-confidence "noise" turns out to be real (an entry code asked for again after she wrote it). Read first, label second.

## Fix patterns, strongest first

1. **Exact data in the tool output,** copied by the agent.
2. **A tool that refuses the wrong state** with a distinctive code and what to do instead.
3. **A gate on the finished reply** for a mistake the model repeats: narrow, at most once or twice a turn, logged, unit-tested with the real failing reply and a correct neighbour.
4. **A reply check** for hard rules; when correct new behaviour trips it, change the behaviour, not the check.
5. **Prompt wording,** last.

The details of each are in the `agent-harness` skill's CHECKS.md.

**When a skill has the content but the model writes from memory** (older API shapes from its trained priors), put a table near the top of the skill that maps the forms it remembers to the current ones, and move warnings above the examples they apply to.

## Mistakes that cost rounds

- **Fixing the sentence, not the cause.** Patching the one reply the case shows leaves a sibling path broken; find the shared function and fix it once.
- **A gate or rule that is too broad:** it fixes one case and breaks five; one opener gate that also fired on gift openers made the agent load playbooks twice. Narrow it and rerun the neighbours.
- **Two checks that disagree:** a reply one rule asks for gets rewritten by another. When a fix keeps failing, look for the second check.
- **Leaking the eval into the harness:** a tool added because the eval's mix needs it though production rarely does (OCR), a rule that fits where the eval's tasks live ("always cd /app, run pytest"), a prompt tuned to distinctive phrasings, one patch per failure read. They raise the score and do nothing in production.
- **An example in a skill description** that looks like the common case pulls the common case into the skill.
- **Exact-sentence assertions** failing correct replies.
- **Trusting one repetition,** and **mixing results from changed code.**
- **Stopping at "almost":** the last percent is where the real edge cases are; a failure that repeats across runs is real.

## Safety

- Tests never message real people, charge cards or send campaigns: guard the network and fail any unfixtured call.
- Know which deployment is production before deploying, and health-check it after.
- Never print secrets in logs, reports or test files.
- No fallbacks added to pass, no lint suppressions, no loosening of the grader.

## A long improvement goal

For work spanning many phases and sessions, write a **goal file** and a **handoff file**:

- **The goal:** outcomes in priority order, ground rules (which paid runs are allowed, no new dependencies, one commit per green phase, what the agent may decide alone), the design per outcome with the files to read first, and phases each ending in a named eval gate (`--variant <name> --reps 3 --compare <baseline>`).
- **The handoff:** read first at every turn and after every compaction. The current phase and next step, a phase table with one result line each (run name, pass rate, interval), the owner's decisions with dates, open questions, blockers, a cost row per paid run, and a log newest first. When the goal and the handoff disagree on what is done, the handoff and the repository win.
- **A side check earns its place:** a question asked of every message (which flow is this?) stays only if its gate shows a gain; one that misrouted twice and showed none was removed.

## Handing it to an agent

Give it this skill, the project's own eval docs and its coding rules, and say: *Run the loop until a full run has zero failures. Fix root causes. Do not loosen checks; clarify a judge question only with calibration. Report each round's numbers.*
