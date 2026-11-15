# Iterate against explicit quality gates

Preserve the requested task while making its quality target observable. Sources: [MengTo/Skills, iterate-until-verified/SKILL.md; workflow-score-to-target/SKILL.md and templates]. These methods operate the current task; they do not grant new execution or publishing authority.

## Keep the task authoritative

- Record outcome, deliverables, audience, inputs, constraints, exclusions, authorized actions and the definition of done. A verification process must not replace the deliverable or quietly relax its constraints. [MengTo/Skills, iterate-until-verified/SKILL.md, Lock the original task]
- Execute when the user requests the finished work. When asked to improve a prompt, compose the wrapper around the unchanged authoritative task; do not start executing it. [MengTo/Skills, iterate-until-verified/SKILL.md, Choose the mode; Compose mode template]
- Translate subjective ambitions into a compact matrix of gate, verification method, observable pass condition and evidence. Select relevant dimensions, such as correctness, completeness, craft, usability, robustness, performance or reference fidelity. Prefer binary acceptance conditions when a score adds no useful information. [MengTo/Skills, iterate-until-verified/SKILL.md, Convert ambition into gates]

## When the user requests a score

- List every item, the target and the actual benchmark. The source interprets “get them to 8” as every item reaching 8, rather than an average masking a weak item. State that interpretation and preserve any different user-specified aggregation. [MengTo/Skills, workflow-score-to-target/SKILL.md, Pin down the target and the items]
- Fix the rubric before scoring. The source's anchors are 10 best in class; 9 excellent; 8 polished with minor nits; 7 a noticeable flaw; 6 functional with visible rough edges; 5 distracting execution; 3 to 4 broken in places; 1 to 2 barely working. These are judgments, not measured physical units. [MengTo/Skills, workflow-score-to-target/SKILL.md, Anchor the rubric before scoring]
- Use five criteria worth 0 to 2 points each for a total of 10. The source says three to five such criteria total 10; only five do. If using another criterion count, explicitly define its normalization and keep it fixed across rounds. Keep quality scores distinct from this repository's P0 to P3 issue severity. [MengTo/Skills, workflow-score-to-target/SKILL.md, Anchor the rubric before scoring; repository severity convention]
- Measure criteria that can be measured, with units and conditions. Do not transplant the source's sample win rates, clipping distances, asset sizes or motion thresholds as universal acceptance values. [MengTo/Skills, workflow-score-to-target/SKILL.md, Anchor the rubric before scoring]

## Make, judge and revise

- Capture the baseline before changing it. Judge visual behavior from actual renders or measurements, not a code inspection presented as visual proof. Use [browser-automation VISUAL-CAPTURES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-automation/browser-automation/VISUAL-CAPTURES.md) for comparable captures. [MengTo/Skills, workflow-score-to-target/SKILL.md, Score honestly from real evidence]
- Where independent review is useful and permitted, give the verifier the task, rubric, candidate and real benchmark without the implementer's hopes or previous score. For blind comparison, anonymize and randomize comparable candidates; disclose remaining identity cues. Two judges and taking the lower score are source options, not mandatory infrastructure. Shared delegation remains in [agent-harness WORKFLOWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-harness/WORKFLOWS.md#delegation-packets). [MengTo/Skills, iterate-until-verified/SKILL.md, Separate making from judging; workflow-score-to-target/SKILL.md, Score honestly from real evidence]
- Fix the lowest item and its costliest criterion first. Re-capture under the same conditions and rubric; never round a score upward to pass. Record pass, fail or blocked, route failures to their owner, and recheck failed and affected gates after the smallest useful revision. [MengTo/Skills, workflow-score-to-target/SKILL.md, Improve in rounds; iterate-until-verified/SKILL.md, Run the loop]
- Keep other acceptance constraints intact. A higher visual score does not excuse a performance regression. Continue while safe in-scope work can resolve a failure; report a plateau, missing access or infeasible requirement with its actual consequence and next action. [MengTo/Skills, workflow-score-to-target/SKILL.md, Improve in rounds; iterate-until-verified/SKILL.md, Stop honestly]
- Keep a scorecard with item, before/after, criterion, fault or shortfall, evidence, judge method and date. Persistence to memory, automatic test creation and new project policy are source suggestions subject to the task's authorization. [MengTo/Skills, workflow-score-to-target/SKILL.md, Lock it in; Report]

## Prove it

The original task remains intact, gates are observable, rubric arithmetic is correct and unchanged between rounds, every item has evidence, comparisons disclose their conditions, no score was rounded into a pass, and remaining shortfalls are explicit. Report actual checks and reviewers; a requested verification method that could not run remains unverified. [MengTo/Skills, iterate-until-verified/SKILL.md, Completion checks; workflow-score-to-target/SKILL.md, Report]
