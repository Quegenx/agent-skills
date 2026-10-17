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

Report each finding as blocking, important or an improvement, with the artifact, the consequence and the fix.

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

- **A check turned on that never fires:** the field means something other than its name, a hidden default already scores it, a misspelt category matches nothing, or the check isn't on the path the work takes. Prove each check with a crafted failing case.
- **Smoke the gate itself** with a good output, a bad one and a runner error, and see three different results. Skipped cases and missing credentials show as incomplete, never as passed.
- **One results folder per purpose:** mixing runs of different kinds in one trend or baseline folder invents regressions, and a baseline file of the wrong shape silently finds none. Check the shape when loading.
- **Blocking and scoring are separate code paths:** the guardrail that stops a tool call before it runs never scores, and the batch scorer afterwards never blocks.
- **Pull requests from outside run without secrets;** the eval job that needs keys runs only on trusted code.

## Production

- **Sample live conversations two ways,** tracked apart: a random share of normal traffic, and every conversation a complaint or a low rating points to.
- **One production judge per failure you have seen** (an answer that ends with no result, a count that doesn't match the tool, a source read twice, a tool error left unexplained), code where code can tell, each score written back to the trace (1 means the failure is there) so flagged traces can be filtered. Labels a person hasn't checked keep a judge provisional; write the flagged answers to a file for the owner to mark.
- **Real conversations become cases** through a mining script that masks before writing anything (phones, emails, names from tool output, ids as stable fakes), writes outside git, and adds a case only after the owner reviews it, with the user's wording kept and the case marked as an incident with its date. An agent that reviews code gets the same: past changes that caused incidents, with their fix-forwards and reverts, each bug and its location confirmed by engineers who know the code; it runs against the set daily, and a change to the reviewer is kept only if the score went up.
- **Map the workflows before writing cases:** each user goal against each source, what the agent should do end to end, what it does today (measured, with the path) and what the data store lacks for it. The map shows which goals have no end-to-end case.
- **Grade a conversation only once it is over,** by a stated rule (closed, or quiet for a set time).
- **Alerts need a minimum sample,** carry the failing cases, and group repeats. Tell an incomplete window from a real drop, and a provider outage from a drift in quality.
- **Refresh the cases and recalibrate** after a change of model, prompt, tool, retrieval or audience.
- Build and test the review screen like any app handling untrusted text: the trace is escaped, links and images don't load from outside, saves are atomic and a stale edit is a conflict, not an overwrite. Test it with a script tag in a message, a huge tool result, unusual characters and a missing attachment.
