# Audits, release gates and production

## Auditing an eval you didn't build

Before trusting a number, check ten things; evidence you can't see is unknown, not passed.

1. **The task:** does it measure the outcome that matters? For an agent that acts, the resulting state, not its account.
2. **The data:** current, representative of the rate being claimed, allowed to be kept; written or model-made expected answers marked; no duplicates or shared conversations across splits.
3. **The trace:** the output, the score, the model and the usage come from the same execution.
4. **The grader:** try a known pass, a known fail, an empty output and an answer to a different question. Check the expected answer before blaming the agent, and never tune the agent around a wrong one. When a grader's instructions contradict the docs, test the real API.
5. **The harness:** break something locally and see it reported as an execution error, not a capability score of zero; check retries, timeouts, results written as they arrive, and that a resumed run is the same run.
6. **The comparison:** recompute the headline from the raw rows; same cases, judge, config and environment on both sides; error rates and denominators shown; the setting being compared really reached the agent and its subagents.
7. **The resolution:** is the uncertainty smaller than the smallest improvement worth having? Repetitions on one built index don't measure what rebuilding it would change.
8. **Stronger models and more thinking score higher:** run a smaller and a more capable model, at low and high effort. If scores don't rise, ambiguous tasks or a miscalibrated grader are often holding them down.
9. **Headroom:** the most capable model at the highest effort stays well below 100%, or you can't judge how changes move it. A baseline already at about 95% or higher should aim a hillclimb at cost or latency, not quality.
10. **The gap isn't impossible tasks:** a task that fails every run, however many repetitions, is a common tell of an impossible or ambiguous task.

Report each finding as P0 to P3, with the artifact, consequence and fix. The old blocking/important/improvement labels map to P1/P2/P3; reserve P0 for an actually critical condition. Severity and the release decision are separate. [confident-ai/eval-skills, eval-audit]

## Release gates

- **One gate per dimension,** each pass, warn or fail: the goal, behaviour (loops, scope, safe tool use), reliability (same result twice, safe to retry), speed (95th percentile, not the mean) and cost, security, coordination between agents, observability. Thresholds differ per gate (security is strictest), so a good average can't hide a security regression.
- **Lead with the verdict:** ship, hold or not ready, how sure, and the shortest ordered path to green.
- **Each failure kind gets its own exit code and its own step:** an absolute threshold missed; a regression against the baseline; a key case broken while the average looks fine; a case that passed before and fails now; too many low-confidence verdicts.
- **Hold for a person** when the pass rate's interval straddles the bar or the verdict flips within a small margin of it. A hold never overrides a real fail.
- **The baseline is a committed file.** CI reads it and never writes it; a person updates it on purpose, for a trade-off they accept.
- **Every declared requirement has at least one case,** or the gate fails.
- **Before a release, run the gate several times;** a verdict that changes between runs isn't one.
- **Keep a decision log:** who accepted, held or overrode a gate, and why. A threshold that is lowered is reviewed by someone other than the person proposing it. When the same borderline reason keeps showing up, check whether the threshold can be reached at this sample size at all.

## Gates that lie

- **Freeze the harness within an experiment.** Choose the primary outcome and guardrails before looking; do not alter cases, graders or thresholds mid-experiment to buy acceptance. A harness revision is a separate change with its own calibration. Keep a decline from the stated baseline visible even when the candidate still clears an absolute floor. [bgauryy/octocode, octocode-graph-eval/references/held-out-and-guards.md and kpi-contract.md]
- **A required or forbidden check is a gate, not a contribution to a passing average.** Missing cases stay incomplete. The source's supplied grader averages required/forbidden checks and can ignore missing answer files when setting batch success; that implementation is not the contract adopted here. [bgauryy/octocode, octocode-graph-eval/scripts/eval-eval.mjs]

- **A check turned on that never fires:** the field means something other than its name, a hidden default already scores it, a misspelt category matches nothing, or the check isn't on the path the work takes. Prove each check with a crafted failing case.
- **Smoke the gate itself** with a good output, a bad one and a runner error, and see three different results. Skipped cases and missing credentials show as incomplete, never as passed.
- **When the gate is a checker** (a lint rule or detector) changed in the pull request, run it on base and head with exit `2` for invalid evidence outranking any diff: [lint-rule-authoring BASE-HEAD-PARITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/lint-rule-authoring/BASE-HEAD-PARITY.md#exit-codes); testing the rule itself for false positives and misses: [lint-rule-authoring LINT-RULES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/lint-rule-authoring/LINT-RULES.md).
- **One results folder per purpose:** mixing runs of different kinds in one trend or baseline folder invents regressions, and a baseline file of the wrong shape silently finds none. Check the shape when loading.
- **Blocking and scoring are separate code paths:** the guardrail that stops a tool call before it runs never scores, and the batch scorer afterwards never blocks.
- **Pull requests from outside run without secrets;** the eval job that needs keys runs only on trusted code.

## Gating an agent's findings

A gate can run inside the product too, on each finding an agent writes before a person sees it. Vercel's `vercel-optimize` audit runs the claim checks and the code-scored rubric from [JUDGES.md](JUDGES.md#checking-the-claims-in-an-agents-findings) on every recommendation, then decides [Vercel, vercel-optimize]:

| Condition | Action |
|---|---|
| `passRate < 0.8` and at least 2 verifiable claims | Re-run the writer with `topFailures` (the first 5 failed claims) injected as "Previous attempt failed these checks" |
| A contradiction with project config, a cache-safety failure or a framework-semantic failure | A hard re-run; the report holds back the original until the re-run fixes it or abstains |
| `passRate >= 0.8`, or fewer than 2 verifiable claims | Accept |

- **The claim floor is 2, not 5:** "a rec with 1/1 failed claim is just as broken as 1/5, and the old floor let many small recs escape re-gen entirely." Below 2 claims "is below the noise floor".
- **A re-run must improve to replace the original:** `regenPassRate >= originalPassRate`, it drops no more than 50% of the recommendations, and the findings stay cited. "If re-gen makes things worse, keep the original output unless the trigger was hard safety". "Hard-safety failures must not ship to the customer report."
- **A pass rate misses a wrong answer, so hard triggers come first:** "a 'turn on Fluid' rec on a project where Fluid is already on passes 8/9 claims but is the wrong rec." The order is `project_config_contradiction > cache_vary_safety > semantic_safety > pass_rate_below_threshold`, each with its own hint for the re-run.
- **Three buckets out, none silent:** recommendations that passed; recommendations held back with a reason (the trigger, `quality_floor` or `needs_review`); and abstentions, observations and items a sanitizer dropped. The summary reports the average pass rate and the average quality.
- **Version the thresholds:** "Bump on any threshold change so report + iteration baselines can detect gate-logic drift" (`GATE_VERSION = '1.8.0'`).

The orchestration around this (who re-spawns, the join key) is in [agent-harness WORKFLOWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-harness/WORKFLOWS.md#fan-out-contract), and the renderer's last check in [agent-harness CHECKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-harness/CHECKS.md#rewriting-and-dropping-a-finished-answer).

## Production

- **Sample live conversations two ways,** tracked apart: a random share of normal traffic, and every conversation a complaint or a low rating points to.
- **One production judge per failure you have seen** (an answer that ends with no result, a count that doesn't match the tool, a source read twice, a tool error left unexplained), code where code can tell, each score written back to the trace (1 means the failure is there) so flagged traces can be filtered. Labels a person hasn't checked keep a judge provisional; write the flagged answers to a file for the owner to mark.
- **Real conversations become cases** through a mining script that masks before writing anything (phones, emails, names from tool output, ids as stable fakes), writes outside git, and adds a case only after the owner reviews it, with the user's wording kept and the case marked as an incident with its date. For the code reviewer's incident cases and cadence, use [reviewer tuning](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/TUNING-THE-REVIEWER.md#incidents-are-the-eval).
- **Map the workflows before writing cases:** each user goal against each source, what the agent should do end to end, what it does today (measured, with the path) and what the data store lacks for it. The map shows which goals have no end-to-end case.
- **Autonomy is earned on a measured sample:** an outbound agent's responses to positive, objection, information and referral replies are drafts a person sends "until accuracy is proven over 100+ replies", and Tier 2 first touches run alone while "a human reviews a sample weekly" [coreyhaines31/marketingskills, marketing-loops]; the full approval table is in [marketing-loops OUTBOUND-OPERATOR.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-loops/OUTBOUND-OPERATOR.md) and the send-time code gate in [agent-harness CHECKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-harness/CHECKS.md#authorization-classifiers).
- **Grade a conversation only once it is over,** by a stated rule (closed, or quiet for a set time).
- **Alerts need a minimum sample,** carry the failing cases, and group repeats. Tell an incomplete window from a real drop, and a provider outage from a drift in quality.
- **No data is not a clean monitor.** A missing, partial or undersized window follows the agreed incomplete policy and names its coverage; it never silently passes. Record the owner who reviewed a changed reference or accepted a measurement change. The source monitor returned normally when no traces were sampled, before its documented incomplete-window check. [confident-ai/eval-skills, eval-maintain, SKILL.md and templates/monitor.py]
- **Refresh the cases and recalibrate** after a change of model, prompt, tool, retrieval or audience.
- Build and test the review screen like any app handling untrusted text: the trace is escaped, links and images don't load from outside, saves are atomic and a stale edit is a conflict, not an overwrite. Test it with a script tag in a message, a huge tool result, unusual characters and a missing attachment.

## Prove it

[bgauryy/octocode, octocode-graph-eval/references/held-out-and-guards.md and scripts/eval-eval.mjs]

- A failed required or forbidden criterion cannot pass through an average, and a missing case remains incomplete.
- The experiment uses the fixed harness, stated baseline, primary outcome and guardrails; a passing absolute floor does not hide deterioration.
