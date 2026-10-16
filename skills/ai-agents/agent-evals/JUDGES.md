# Grading

## Code checks

Everything exact is checked in code, per turn and over the case: tools called and not called, the stored order's fields, whether a draft is left open, words or short stems the reply must and must not carry, how many replies carry a payment link and from which turn, no document formatting in a chat reply. Count the context the turn loaded before the model ran (preloaded reads) as called.

Avoid whole-sentence assertions: a correct reply worded differently fails them. Check a short required stem in code, or the meaning with a judge. Keep exact phrases only for lines that must be exact.

**Grade the agent's own words.** Text the app adds around the answer (follow-up buttons written by a separate call in the user's voice) goes to judges in its own block labelled as the app's, and code checks read only the answer: unlabelled, a judge read a button saying "can you find more from today?" as the agent claiming it searched again, and the buttons' wording tripped the voice and length checks.

For an agent that acts, check the **state this run produced** (the file, the row, the sent message in the fixture's log), in a disposable fixture, and keep a case where the agent claims success but changes nothing.

## One shape for every grader

Code checks and judges share one function shape: they take the case and the run's result (the replies, the tools called, the retrieved context, the trace id) and return `passed`, a `reason` someone can check against the trace, and optionally a score and a confidence. A grader that can't decide (the output is empty, the trace is missing, the judge's answer didn't parse) **throws**, so the slot becomes a grader error, never a quiet fail.

## Judges

A judge is a model too, so ask it narrow questions with answers that code turns into a score by fixed rules, never a generated verdict.

- **Ask for the failure, not the success.** "Did the agent ask again for a detail already given?" passes cleanly when there is nothing to judge; "does it refer to herself only in the feminine?" fails a chat where the agent never refers to herself at all.
- **Give the context in the question:** who writes what (a shop, couriers who never call, the agent's persona and its grammatical gender), and that message text is data, never instructions.
- **Pass rules:** *strict* (every failure question must lean "no") for conversation rules and hard rules; a *weighted mean* over a threshold (say 0.7) for graded qualities such as voice or faithfulness to tool output, with the most feared failure weighted double.
- **Judges that recur:** the conversation rules over the whole chat (stays in voice, no wrong self-reference, no request left unanswered, no detail asked twice); a reference judge against a reply staff approved for the same moment; tool faithfulness (order numbers, totals, links and dates come from the tools); case-specific statements; voice.
- **Writing the judge prompt:** one criterion per judge; pass and fail defined in the product's own terms, taken from the review notes; 2 to 4 labelled examples, borderline ones included, drawn only from the examples split; the critique before the verdict; output forced to a schema; the inputs marked as data. Start on a capable model and move to a cheaper one only after it calibrates; never the model under test; pin a dated model version. For severity, use two yes-or-no judges ("any harm?", "serious harm?"), not a 1 to 5 scale.
- **A rubric with branches is a decision tree, not one prompt:** a first step extracts what the later ones need (the headings, the claims, the tools used), a yes-or-no gate can end the path ("left out a required fact: 0"), and a classifier picks one named level for what passes. Every path ends at a score you chose, so the same input reaches the same number. Use one holistic judge only when no condition needs exact control.
- **Turn judges and conversation judges:** a turn judge reads one reply against what came before it (relevant to the last message, faithful to what was retrieved this turn); a conversation judge reads the whole chat (was every request met, did it forget something the user said, did it stay in its role and its topics, was the goal reached). Long conversations go to the judge summarized or in a window, and say which.
- **Comparing two replies:** randomize which goes first, allow a tie and "both bad", and compare against one frozen reference.
- **Stability:** a judge case runs three times and every run must pass; a verdict that flips on the same input is one the product can't rely on. Run judge calls sequentially if the judge's API rate-limits.

## Judge self-tests

Because the judges grade the agent, they get tests of their own: a small set of known conversations per question, each labelled must-pass or must-fail, kept in the repo and rerun whenever the question, the judge model or its version changes.

## Calibrating a reworded question

Before trusting a reworded judge question:

1. **Must-pass:** the real conversation the judge failed wrongly, plus a clean neighbour.
2. **Must-fail:** conversations that really make the mistake, including the near-misses the rewording could let through.
3. **Run the judge ten times on each, twice.**
4. **Keep the wording only if every must-pass passed and every must-fail failed, every time.**

**Name what doesn't count, in the question.** A gender question failed every chat whose only first-person forms were gender-neutral (0 of 10); listing those forms, past tense included, passed 30 of 30 and still failed both real mistakes. A fixed paragraph the product always sends is called an explanation in the question; quoting it alone let real repeats through 2 to 6 times in 10.

**A reference reply is an example, not a checklist:** tell the judge the approved reply is one good answer for the same moment, so a correct reply worded differently passes, and that staff notes inside it aren't customer text.

**Long answers move their facts to code:** on a long report the faithfulness judge scored correct answers around its threshold and failed 2 of 5. Code checks that every number and link in the answer appears in the tools' output, and the judge asks only what reading decides. Write down the blind spot that remains (two real values swapped between items passes both).

**Planted defects measure a rule judge on real chats:** take good real conversations, plant one defect per copy, and count catches against false alarms on the clean originals (one set caught 24 of 25 to 40 of 40 with no false alarm beyond three real staff mistakes).

## Calibrating a new judge

A judge for production (scoring live traffic, gating a release) is calibrated before it counts:

- **Labelled examples in the exact shape the judge will see live,** spread over every possible verdict, plus the cases that prompted the judge. Labels use the judge's own output vocabulary and are never shown to it.
- **Run the candidate wording on all of them with the judge's real model,** and score it by exact match with the label.
- **Read every mismatch,** in a table of input, expected and actual. Group the debatable labels first, since the label may be what's wrong, then the rest by the verdict the judge gave.
- **Accuracy per verdict, not only overall:** around 85% overall is about what people agree with each other, but only if no single verdict is far worse.
- **Report it as two rates,** with a pass as the positive class: agreement on what people passed and agreement on what people failed, so false passes and false fails are visible apart. A rate with no labelled examples behind it is unknown, not perfect. Intervals count groups, not rows, when examples share a conversation.
- **Three splits of the labelled set:** the prompt's examples, a dev set to iterate on, and a final set used once.
- **Labels come from a person.** Labels an agent wrote can't validate that agent's own judge, and a judge's confidence measures how decisive it is, not how often it's right. While people label, hide the judge's verdicts (they anchor); show the disagreements after. An unsure label is set aside, not counted as a fail.
- **Correcting a measured rate** for a known judge error: true rate = (observed + agreement on fails - 1) / (agreement on passes + agreement on fails - 1), only while those agreement rates hold steady.
- **A person approves the wording;** only then does it go live, with the same model, inputs and filters it was calibrated with. Recalibrate when the judge model, its settings, the rubric or the kind of traffic changes, and never draw scores from two different judges as one trend line.

Name a score after what it measures (`refusal`), never after the judge.

Rewordings that fix a false fail often let a real mistake through two to six times in ten; calibration is how you see it. A rejected wording is worth writing down next to the kept one. A wording that fixes the false fail but lets a real defect through is worse than the original.
