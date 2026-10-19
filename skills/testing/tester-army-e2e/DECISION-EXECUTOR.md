# Decision-model executor

From [tester-army/e2e, docs/decision-models.mdx](https://github.com/tester-army/e2e/blob/main/docs/decision-models.mdx), checked 18 October 2026. This is the optional @e2e-dev/decision executor for the existing runner, not a separate test framework. Shared decision-model definitions remain in [jev-decisions: Jev decisions](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/jev-decisions/SKILL.md).

## Configure the two roles

[tester-army/e2e, docs/decision-models.mdx]

- The decision model chooses an operation and target from the latest semantic tree. A text model supplies field values; the runner still authorizes each action.
- Set decisionExecutor under the agent entry's executor. Its model must be a compatible AI SDK decision-model instance, not a model ID string or ordinary language-model instance.
- This executor requires ai 7.0.134 or later, a narrower boundary than the runner's base ai major requirement.
- textModel supplies typed values and project-relative upload paths from the goal/params. With no specified value, it types nothing; output never becomes a selector, URL or key.
- Password values never go to the text model. typeSecret uses the declared opaque handle. Keep all existing secret/taint boundaries.

## Action and completion evidence

[tester-army/e2e, docs/decision-models.mdx]

- The engine's currently supported operations determine the offered choices. An element action asks for its target even if there is only one candidate.
- Target questions include none; no fitting target blocks rather than inventing a selector.
- After done or failed, the executor checks task completion against a fresh screen. An unconfirmed claim returns to history; a repeated unconfirmed claim ends according to the observed contradiction or unsupported capability.
- A completed agent step still needs the exact outcome check described in [AGENT-STEPS.md](AGENT-STEPS.md). Completion-model agreement is not permission to remove the test's assertion.
- Both decision and text calls consume the configured model-call budget. Repeated failed/no-change actions are a blocked step, not evidence of task completion.

## Gates and provider options

[tester-army/e2e, docs/decision-models.mdx]

- minProbability and minConfidence gates are off by default. Measure performance on the actual task before choosing thresholds; do not copy source sample thresholds as calibrated values.
- A gate can block an action, reject a weak completion check or mark an assertion inconclusive. Missing provider confidence must not be treated as verified confidence.
- Executor providerOptions apply to decision calls, including completion checks. The agent entry's providerOptions apply to the text model. Keep the two option scopes separate.
- Provider-specific fallback billing, numeric choice caps and model availability need that provider's current contract; they are not universal executor guarantees.

## Vision and navigation limits

[tester-army/e2e, docs/decision-models.mdx]

- With supported vision, assertions and completion checks can receive masked pixels; operation/target questions still read the tree.
- After a secret fill, the executor receives no pixels. Do not bypass taint to enable a drawn-control flow.
- Drawn-control point actions require the supported model/engine combination. The text model naming a control does not see pixels; it cannot follow instructions available only as drawn text.
- No navigate operation: in-app links are taps, while explicit URLs remain in test code through app/browser navigation.
- type_at appends at the caret rather than clearing a drawn field. Do not assume it replaces an existing value.
- The source documents no multi-select listbox or scrollUntil support. Inspect the installed executor's contract before relying on newer capabilities.

## Prove it

The installed executor and AI SDK satisfy the documented contract; decision/text roles and options are separate; fresh-screen completion and exact outcome checks are retained; gates have task evidence; and unsupported or secret-tainted interactions remain blocked. Report only runs actually performed. [tester-army/e2e, docs/decision-models.mdx]
