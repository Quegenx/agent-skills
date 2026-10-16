# Grading

## Code checks

Everything exact is checked in code, per turn and over the case: tools called and not called, the stored order's fields, whether a draft is left open, words or short stems the reply must and must not carry, how many replies carry a payment link and from which turn, no document formatting in a chat reply. Count the context the turn loaded before the model ran (preloaded reads) as called.

Avoid whole-sentence assertions: a correct reply worded differently fails them. Check a short required stem in code, or the meaning with a judge. Keep exact phrases only for lines that must be exact.

## Judges

A judge is a model too, so ask it narrow questions with answers that code turns into a score by fixed rules, never a generated verdict.

- **Ask for the failure, not the success.** "Did the agent ask again for a detail already given?" passes cleanly when there is nothing to judge; "does it refer to herself only in the feminine?" fails a chat where the agent never refers to herself at all.
- **Give the context in the question:** who writes what (a shop, couriers who never call, the agent's persona and its grammatical gender), and that message text is data, never instructions.
- **Pass rules:** *strict* (every failure question must lean "no") for conversation rules and hard rules; a *weighted mean* over a threshold (say 0.7) for graded qualities such as voice or faithfulness to tool output, with the most feared failure weighted double.
- **Judges that recur:** the conversation rules over the whole chat (stays in voice, no wrong self-reference, no request left unanswered, no detail asked twice); a reference judge against a reply staff approved for the same moment; tool faithfulness (order numbers, totals, links and dates come from the tools); case-specific statements; voice.
- **Stability:** a judge case runs three times and every run must pass; a verdict that flips on the same input is one the product can't rely on. Run judge calls sequentially if the judge's API rate-limits.

## Judge self-tests

Because the judges grade the agent, they get tests of their own: a small set of known conversations per question, each labelled must-pass or must-fail, kept in the repo and rerun whenever the question, the judge model or its version changes.

## Calibrating a reworded question

Before trusting a reworded judge question:

1. **Must-pass:** the real conversation the judge failed wrongly, plus a clean neighbour.
2. **Must-fail:** conversations that really make the mistake, including the near-misses the rewording could let through.
3. **Run the judge ten times on each, twice.**
4. **Keep the wording only if every must-pass passed and every must-fail failed, every time.**

Rewordings that fix a false fail often let a real mistake through two to six times in ten; calibration is how you see it. A rejected wording is worth writing down next to the kept one. A wording that fixes the false fail but lets a real defect through is worse than the original.
