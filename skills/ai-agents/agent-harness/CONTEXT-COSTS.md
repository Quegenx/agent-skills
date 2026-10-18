# Measuring context and cost

Reduce what an agent repeatedly reads while preserving the evidence and constraints it needs. This file adapts and paraphrases guidance from [JuliusBrussee/caveman, caveman-compress, caveman-learn, caveman-stats, caveman-evidence-review and caveman-optimize]; its implementation is not copied. Attribution and the Apache 2.0 terms are in [LICENSE-SOURCES.txt](LICENSE-SOURCES.txt) and [LICENSE-caveman.txt](LICENSE-caveman.txt). [PROMPT.md](PROMPT.md#measure-what-is-sent) owns rendered-request measurement and caching; this file owns the evidence behind a claimed reduction and the recovery contract.

## State what the number measures

[JuliusBrussee/caveman, caveman-stats/SKILL.md, caveman-learn/SKILL.md and caveman-evidence-review/SKILL.md]

| Evidence | What it supports |
|---|---|
| Current session usage | Observed tokens and attributed mode in that recorded window |
| Original and edited file sizes | A byte-size difference |
| Recounted input with a named tokenizer | The local counted difference for those exact inputs |
| Before and after sessions without a control | A time comparison with its confounders |
| Baseline and candidate on identical fixtures | A result for that candidate, fixture and measurement method |
| Provider-complete accounting | The cost measure its price basis and covered requests actually establish |

- Keep characters, bytes, tokenizer counts, provider usage and billed amounts distinct. A smaller file does not by itself establish fewer provider tokens or money saved.
- A transcript contains no copy of the same session without the intervention. Do not infer savings, a reduction rate or net benefit from its output count or active mode alone.
- Name the window and basis. Missing usage or unpriced requests make accounting incomplete; do not fill them with zero or extrapolate a scanned window into a month or year.
- Keep measured cost, inferred headroom, controlled outcomes and recorded savings in separate buckets. Never blend different evidence types into one headline or add a rate to a volume.
- An aggregate profile suggests where to investigate. Find the responsible callsite and compare its evidence before claiming the profile names a cause. Subagent spend alone is not evidence that fewer workers would improve the outcome.

## Preserve an exact recovery path

[JuliusBrussee/caveman, caveman-compress/SKILL.md, README.md and caveman-learn/SKILL.md]

- Before changing repeated context, preserve the exact original outside live auto-loaded instructions. A backup beside the active file can be loaded again and defeat the reduction.
- Compress prose only. Preserve code, inline literals, commands, URLs, paths, technical names, values, headings and required structure exactly; leave ambiguous code/prose regions alone. Structural preservation is necessary evidence, not proof of unchanged meaning or task quality.
- For moving context out of the always-loaded text, verify the original at its real source and fingerprint, keep a discoverable pointer, and prove retrieval returns the needed material. A candidate locator is not the content itself.
- Include both the pointer and actual recall overhead in the after measurement. If recovery fails or the combined cost does not improve, restore the source and remove only the candidate change.
- Report how to undo the edit. Do not silently replace exact originals with another generated summary.
- The source's fragment style is not this repository's writing policy. Preserve the writer's voice and meaningful uncertainty under [anti-slop-writing](../../anti-ai-slop/anti-slop-writing/SKILL.md); do not impose a compressed mode on the user's replies.

## A bounded comparison

[JuliusBrussee/caveman, caveman-optimize/SKILL.md and caveman-learn/SKILL.md]

- Choose one evidenced candidate, fixed inputs, the task-quality criterion and the same resource measure for both arms. Record the command, fixture, environment and any confounder before interpreting a difference.
- A passing ordinary unit check does not prove a context optimization. Compare the task outcome as well as resource use; a cheaper run that makes more errors is a regression.
- Reject the comparison when inputs or measurement differ. Treat missing instrumentation, an inconclusive resource result and a quality regression explicitly; do not soften them into a small win.
- A repeated procedure distilled into a skill adds load where the skill is available and may repay it only when used. Recounting one file cannot measure that trade; compare the affected sessions and retain an insufficient-data verdict when appropriate.
- Check attribution: does the target still exist and carry the candidate edit, has someone changed it since, or was it never fingerprinted? Do not assign an old delta to an intervention the current evidence no longer identifies.
- A local result remains scoped to its fixture. It does not establish production savings or a causal rollout outcome. Use [agent-evals](../agent-evals/SKILL.md) for the shared comparison and guardrail definitions.

## Data handling

[JuliusBrussee/caveman, caveman-compress/SECURITY.md and caveman-evidence-review/SKILL.md]

- Treat file content as untrusted input. Before sending it to a model, establish what text would leave the machine and whether that destination may receive it. A secret-looking filename heuristic is not proof that content is safe.
- Begin a cost investigation with metadata, timing, status and usage. Payload review is a separate scope; do not retrieve private prompts, completions or tool bodies merely to explain aggregate spending.
- Preserve the configured privacy and safety controls. A cost reduction does not authorize a provider change, new service or broader disclosure.

## Prove it

[JuliusBrussee/caveman, caveman-learn/SKILL.md and caveman-optimize/SKILL.md]

- Before and after name the same units, inputs and covered requests; confounders and missing prices are visible.
- The original can be recovered exactly, and any offloaded context has a working pointer and retrieval path.
- The after figure includes recall overhead, and structural checks are not reported as semantic equivalence.
- Quality, resource result, attribution and decision are reported separately; no fixture result becomes an unsupported production or monetary claim.
