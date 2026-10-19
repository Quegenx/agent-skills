# Standards and specification review

Use this when a change must be checked against both repository conventions and its requested behavior. Source: [mattpocock/skills, code-review, SKILL.md]. Keep the two verdicts separate so conformity cannot hide a missing requirement and a working feature cannot hide a broken repository contract.

## Establish the inputs

[mattpocock/skills, code-review, SKILL.md]

- Resolve the review target through [CHANGE-SCOPE.md](CHANGE-SCOPE.md#resolving-the-scope). Give both reviewers the same resolved comparison, revision and change inventory; reject an invalid or empty target before delegating.
- Find the originating specification from the request, a supplied document, references associated with the change, or the repository's matching specification. If its authority remains unclear, ask. If none exists, report the specification axis as unavailable instead of inventing requirements.
- Collect the applicable repository standards, including `CODING_STANDARDS.md` and `CONTRIBUTING.md` when present. Read their actual rules and the code under review; filenames alone are not evidence of compliance.

## Independent lanes

[mattpocock/skills, code-review, SKILL.md]

| Lane | Inputs | Findings |
| --- | --- | --- |
| Standards | The resolved change, applicable repository guidance and relevant existing patterns | Cite the standard's file and rule, then the violating hunk. Distinguish a documented violation from a possible design smell. |
| Specification | The same change and the authoritative requirements | Quote the requirement and identify missing, partial, incorrect or unrequested behavior. |

- When parallel reviewers are available and authorized, give each lane independent context and its complete brief. The source limits each lane's returned report to 400 words; preserve the evidence rather than fill that allowance.
- The standards lane uses code smells as hypotheses, with repository standards taking precedence. Reuse the [refactoring techniques](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/refactoring/SKILL.md), [design principles](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/refactoring/DESIGN.md) and [anti-slop rules](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-code/RULES.md), rather than adding a second definition. A smell needs the affected hunk and a reason it matters in this change.
- Skip a mechanical standards observation already reliably enforced by the project's tooling; concentrate the review on judgments the tool does not settle. A failed or unavailable tool is not evidence that it enforced the rule.

## Report without hiding either result

[mattpocock/skills, code-review, SKILL.md]

- Present standards findings and specification findings separately. Do not merge them into one ranked list or choose a winner across lanes.
- State the finding count and most consequential supported issue within each lane. A missing specification is a coverage limitation, not a specification pass.
- Use the existing [finding format and severity](REVIEWER.md#tags-and-output), [status by cause](CHANGE-SCOPE.md#status-by-cause), and [review convergence policy](TUNING-THE-REVIEWER.md#review-has-to-converge). This method adds a second question, not another unbounded repair loop.

## Prove it

[mattpocock/skills, code-review, SKILL.md]

Both lanes used the same resolved change; every standards finding cites its rule or names a heuristic; every specification finding quotes its requirement; an unavailable specification is explicit; and the final report preserves separate counts and verdicts.
