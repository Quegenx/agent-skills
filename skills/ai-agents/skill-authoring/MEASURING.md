# Measuring and improving a skill

Usage logging shows which skills are popular or under-triggering; an eval of the skill shows whether it does the task correctly, and a hillclimb against that eval improves it one change at a time.

## Logging skill usage

- **Log every load with a PreToolUse hook:** the Claude Code team logs skill usage across the company with a PreToolUse hook ([example code](https://gist.github.com/ThariqS/24defad423d701746e23dc19aace4de5)).
- **Read it for popularity and under-triggering:** the log shows which skills are popular and which are under-triggering compared to expectations.
- **Popularity is not quality:** Vercel's [State of agent skills](https://vercel.com/blog/state-of-agent-skills) calls install count "the best signal of a skill's quality" today but expects "the measure of a skill will also shift from popularity to effectiveness"; its install figures "do not represent unique people or necessarily independent choices."

## Evaluating a skill

- **Build the eval from the source the skill teaches:** the claude-api skill is tested with an evaluation set derived from the documentation, checking that the skill can correctly implement code that uses the APIs.
- **Lightweight evals with separate agents:** spin off separate agents in a worktree to produce outputs, then comparison agents to grade them against a rubric, for example to evaluate and then refine a skill you've created against particular criteria.
- **A skill must beat no skill:** "a skill justifies itself only if the agent does the job better with it than without it", and as models improve, the bar rises ([State of agent skills](https://vercel.com/blog/state-of-agent-skills)). Vercel runs its product-design fixtures "without the skill to measure whether it changed the agent's behavior" ([Teaching agents product design](https://vercel.com/blog/teaching-agents-product-design-at-vercel)).
- **Save the baseline first:** generate once with no new context and save the prompt, inputs, configuration and screenshot; "You cannot tell whether new context helped without a before." Before generating, write a short rubric: supplied facts survived, the reader's decision is clear, the correction you keep making by hand got resolved. Then one matched comparison (same input, model, viewport, now with the file), shuffled with the baseline and scored blind ([design.md](https://vercel.com/blog/how-our-agents-build-on-brand-pages-with-design-md)).
- **Freeze the scenarios, change the file:** Vercel's design.md was tested on seven prompts "pulled from real use cases and paired with mock inputs"; "The prompts stayed fixed while the file changed, so any difference in the output traced back to the guidance." A round makes a fresh page from every scenario against the current file version, on more than one model; targeted reruns cover only the affected scenarios or one model. Include scenarios where the guidance should and should not apply.
- **Before and after fixtures, with holdouts:** "An agent edits a before state, then a judge checks the results against a rubric." "Build training fixtures from documented examples and holdouts from interfaces whose expected edits do not appear in the skill."
- **Score rule correctness apart from similarity:** "Shipped code can contain a flaw that the agent should improve instead of reproduce."
- **Test the trigger apart from the rules:** "failing to load the skill and failing to follow a rule are different problems." "Ask the agent to report which surfaces and references it loaded, then verify that its findings cite those sources."
- **Full suites and audits:** for building a full suite, see [agent-evals](../agent-evals/SKILL.md); to audit a SKILL.md with subagents attempting a real task, see [DX-AUDIT.md](../agent-evals/DX-AUDIT.md).

## Hillclimbing a skill

- **Skills are a good surface:** hillclimbing works well where iteration is cheap; prompts and skills are text, easy to change and revert.
- **Keep the score attributable:** several successful hillclimbs have focused on skill triggering, where the metric (the trigger rate) is directly coupled to the description being modified.
- **`/claude-api hillclimb` can edit skills:** among the surfaces you can let it change are skills or instruction files. Each round it reads the previous round's train transcripts and proposes one change as a patch, keeps it only when both train and test improve, and reverts it when only train rises or either drops.
- **What a skill hillclimb found:** on the claude-api skill's eval, given the documentation and SDKs, the score went from 66% to about 88% over 24 rounds. Adding sections for eight missing features took it to 74%; fixing errors in the C# and Java type tables to 77%; a table near the top steering Claude from the API forms it remembered to the current ones, with warnings moved above their examples, to 80%; then fixing flawed tasks and graders plus more skill edits to about 88%.
- **Keep or revert by blind A/B against the earlier file:** at milestones Vercel runs "blind A/B rounds that put the updated design.md against an earlier version of the file to decide whether to keep, revise, or revert each change", because "A change that helped one artifact could quietly hurt another." Its review app keeps, per run, the prompt, inputs, model configuration, guidance-file version, screenshots and reviewer feedback; "Reviewers record every correction against the exact run that produced it."
- **What a design-skill eval showed, and didn't:** design.md took "well over 200 runs". On three scenarios, each page made with and without the file on the first attempt, deterministic checks counted 39 known failures with it and 91 without, "57% fewer in this test." The checks only catch failures already named, so it "says nothing about whether a page is well designed overall"; six pages is "far too small a sample to make claims about quality or reliability"; and every page "still had at least one failure serious enough to block shipping." What it shows: "once we name a failure and encode it, that failure tends to stay gone."
- **When the score stalls, sort the failures:** after two stalled rounds, the reflection step makes no edit and only sorts every remaining failure by root cause. Tasks that never improve despite addressing obvious content gaps are tells that the example or grader is flawed: one task asked for code catching one error type while its grader wanted a chain of at least three, and another grader contradicted the docs, which testing the real API showed were right.

## Keeping a skill current from real use

- **Collect real requests with their feedback:** Vercel's `@design-agent` in Slack loads the current design.md and posts a screenshot and deployment URL to the thread, so each thread holds a real request, its output and the steering. Weekly, Slack threads, GitHub review and Figma comments are gathered, repeating comments grouped, and each repeated complaint becomes a proposed change; a person checks whether the system already handles it and decides where the fix belongs. A request for an untested kind of page becomes a new eval scenario.
- **Separate collection from judgment:** in the product-design skill's weekly intake, a collector gathers evidence without proposing rules, a separate judge groups and verifies it, and "Automation ends with the review packet. A human decides whether a candidate becomes agent guidance, a lint rule, an example, an eval, or no change." Every candidate links to its source and stays pending. The prompts:
  ```
  Collector prompt
  You are the collector. Gather messages, links, files, and nearby context.
  Write raw artifacts only. Do not score candidates or propose rules.
  Judge prompt
  You are the judge. Validate coverage before grouping related evidence.
  Separate verified facts, inferences, and open questions.
  Keep every candidate pending. Do not edit the guidance.
  Human review
  Choose: rule, reference, exemplar, lint rule, eval, coverage gap, or no change.
  Require stable evidence, explicit scope and exceptions, and an approver.
  ```
- **Keep a decision log:** record "what changed, why, and which source supported it. Treat new rules as product changes, reviewing and testing each one, and removing those that stop helping."
- **Count the complaint after the fix:** "count how often each kind of complaint shows up in similar work over time. Once we encode a fix, that count should start falling. When it does not, something about the fix is wrong": the rule is unclear, it isn't loading when needed, the stylesheet lacks a primitive that can express it, or it needs a deterministic check instead of prose. "A passing evaluation matters less if people keep correcting the same mistake in production."

## Prove it

A usage log exists and is read for skills that under-trigger; a description change is checked against a trigger-rate eval; a content change is checked against an eval built from the source the skill teaches, on a held-out split; a task that won't move despite content fixes has its grader checked before the skill is edited again; the eval is run with and without the skill, and the trigger is tested apart from rule-following; every rule change has a human approver and a decision-log entry.
