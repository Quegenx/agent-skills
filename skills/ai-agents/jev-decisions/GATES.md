# Gates: from probabilities to actions

Jev returns numbers; code decides what they mean. Keep gates in code, named, ordered and logged, so a policy change is a diff of thresholds and rules, not a rewritten prompt.

## Primitives

Five readings cover almost every rule. Write them once, typed against the SDK's answer types:

```ts
import type { ChoiceCriteria, ChoiceResponse, NoulResponse, ScoreResponse } from "@typesafe-ai/sdk";

/** P(level >= k) for a score answer: the tail, the honest way to gate risk. */
export const scoreTail = (a: ScoreResponse, k: number) =>
  Object.entries(a.probabilities).reduce((sum, [level, p]) => (Number(level) >= k ? sum + p : sum), 0);

/** P(level <= k): "mostly calm", "unclear request". */
export const scoreHead = (a: ScoreResponse, k: number) =>
  Object.entries(a.probabilities).reduce((sum, [level, p]) => (Number(level) <= k ? sum + p : sum), 0);

/** A yes/no read as true above a threshold you choose per action. */
export const isYes = (a: NoulResponse, t = 0.5) => a.noul > t;

/** Sure enough of one label to act on it. */
export const choiceIs = <C extends ChoiceCriteria>(a: ChoiceResponse<C>, label: keyof C & string, t: number) =>
  a.choice === label && a.confidence > t;

/** Mass on a set of labels, whichever wins: "any money-related intent". */
export const choiceMass = <C extends ChoiceCriteria>(a: ChoiceResponse<C>, labels: readonly (keyof C & string)[]) =>
  labels.reduce((sum, l) => sum + (a.probabilities[l] ?? 0), 0);

/** Gap between the top two labels: small means a near tie. */
export const choiceGap = (a: ChoiceResponse) => {
  const [first = 0, second = 0] = Object.values<number>(a.probabilities).sort((x, y) => y - x);
  return first - second;
};
```

The sixth input is a **fact**: a boolean code computed from the record (`refund.amount <= 50`, `card.status === "active"`, `grant.requiresConfirmation`). Rules combine readings and facts with `&&`, `||`, `!`; facts are free and exact, so put them first.

- Decide on `confidence`, not `probabilities[choice]` (it usually runs a little lower); every threshold was calibrated on one of them, so switching fields means recalibrating.

Use `scoreTail` for risk ("a third of the mass at angry or above hands off"), `score` (the expectation) only together with a confidence floor.
- Use `choiceIs` to act on one label, `choiceMass` to enter a branch that several labels share.
- A yes/no threshold follows the cost of each mistake: 0.5 when both errors cost the same, higher when a false yes is expensive (paging someone, paying out), lower when a missed yes is (a safety flag). Below the act threshold is "not established", not "no"; "no" is its own threshold on the other side (`a.noul < 0.15`), and the space between is the middle band. A starting band of no below 0.3, yes above 0.7 and a person between absorbs the run-to-run wobble around 0.5.
- **Don't read magnitudes off a score.** The expected level says which side of a cut a case falls; it is not calibrated enough to interpolate an exact number between two levels.
- **A runner-up with real mass is information.** A ticket that is 0.61 returns and 0.35 billing goes to returns and sends billing a copy; gate the copy on the runner-up's probability (above about 0.25).
- **Thresholds can depend on facts code reads.** Merging two wrapped lines takes a lower bar after a line with no closing punctuation than after one that ends a sentence; a high-risk asset gets a stricter bar than a test box. Compute the fact, pick the bar, then compare.

## Bands: act, middle, close

```ts
type Band = "close" | "middle" | "act";

export function alertBand(t: { trueAlarm: NoulResponse; contextExplains: NoulResponse }, assetTier: number): Band {
  const p = t.trueAlarm.noul;
  if (p < 0.15 && t.contextExplains.noul > 0.5 && assetTier !== 0) return "close";   // never auto-close the crown jewels
  if (p > 0.75) return "act";
  return "middle";                                                                    // a person, or a deeper check
}
```

- **Close needs two signals,** low probability of the bad thing and a positive reason it's fine ("a ticket covers this exact activity"); silence is not an explanation.
- **Some things never auto-close** whatever the probability: the domain controller, the payroll account, a regulated complaint. Make that a fact, checked first.
- **Let the levels be the bands.** When the outcomes are ordered and the middle one has a meaning of its own ("related, possibly the same: a curator decides"), make them the levels of one score and round to the nearest level. The wording of the middle level, not a fitted number, decides what reaches a person.
- **The middle is a product decision.** It can ask the user a clarifying question, notify, queue for a person, or run a second, more focused call. It must never silently default to either end.

## Ordered rules

A policy is a list of sections, each a list of rules (`when` -> actions + reply). Walk the sections in order. In a `"first"` section the first rule that holds is the only one that fires; in an `"all"` section every rule that holds fires. A fired rule ends the walk once its section is done, unless it is marked `stop: false` (record the intent, raise the priority, flag for review, then keep going).

```ts
type Rule<C> = { name: string; when: (c: C) => boolean; actions: string[]; reply?: string; stop?: boolean; why?: string };
type Section<C> = { name: string; mode: "first" | "all"; rules: Rule<C>[] };

export function applyPolicy<C>(sections: Section<C>[], c: C) {
  const fired: { section: string; rule: string }[] = [];
  const actions: string[] = [];
  let reply: string | undefined;
  for (const section of sections) {
    let stop = false;
    for (const rule of section.rules) {
      if (!rule.when(c)) continue;
      fired.push({ section: section.name, rule: rule.name });
      actions.push(...rule.actions);
      reply ??= rule.reply;
      stop ||= rule.stop !== false;
      if (section.mode === "first") break;                              // "all" keeps collecting in this section
    }
    if (stop) break;                                                    // a stopping rule ends the walk after its section
  }
  return { actions, reply: reply ?? "ask_clarify", fired };            // log `fired` with the inputs it read
}
```

The section order is the policy: **safety and conduct** first (credentials pasted, legal threats, abuse; in `"all"` mode so several fire), then **a pending proposal** (the user's reply to what was offered), **handoffs**, **closing**, **intent** (nothing is acted on until the intent is clear), then **the domain branches** (fraud, money, retention), then a fallback that asks. Each rule carries a `why` a reviewer can read.

- **Consent is its own judgment.** "Accepts", "declines" and "accepts but changes the terms" are three outcomes; a yes to a different amount is not consent to the proposed one. Execute only what was accepted on the exact terms proposed, and re-check the fact (still eligible, still active) at execution.
- **Make the assistant's claims true or retract them.** If the conversation says "your card is secured" and the record shows it active, either freeze it now or correct the message; never leave a false claim standing.
- **Limits are facts:** "refund at most 50", "tenure at least 12 months". Probabilities say whether the reason is eligible; code says whether the amount is.

## Ladders: strongest action first

For responses that escalate (session revoke vs account disable, quarantine vs purge), group rules by what is happening and list each group's actions strongest first, each with stricter conditions:

```ts
const ACCESS_LADDER = [
  { action: "disable_account", when: (a: Containment) => a.sessionHijacked.noul > 0.65 && a.spread.noul > 0.5 },
  { action: "revoke_sessions", when: (a: Containment) => a.sessionHijacked.noul > 0.5 || a.credsExposed.noul > 0.6 },
  { action: "require_reauth", when: (a: Containment) => a.credsExposed.noul > 0.4 },
];
```

A group is entered when any of its signals crosses its lowest bar; the first eligible step wins. If no step in any group holds, fall back to "page a person", never to "do nothing".

## Profiles and tiers

One workflow, several policies: the same answers decided by a cautious profile and a generous one. Put every number in a typed profile object and pass it to the gates.

```ts
type Profile = { name: string; handoffTail: number; consent: number; fact: number; autoRefundMax: number; proposeRefundMax: number };

const TIERS: Record<"high" | "mid" | "low" | "unknown", Profile> = {
  high:    { name: "high",    handoffTail: 0.4, consent: 0.75, fact: 0.75, autoRefundMax: 0,  proposeRefundMax: 100 },
  mid:     { name: "mid",     handoffTail: 0.5, consent: 0.6,  fact: 0.65, autoRefundMax: 30, proposeRefundMax: 200 },
  low:     { name: "low",     handoffTail: 0.7, consent: 0.5,  fact: 0.6,  autoRefundMax: 60, proposeRefundMax: 300 },
  unknown: { name: "unknown", handoffTail: 0.5, consent: 0.75, fact: 0.75, autoRefundMax: 0,  proposeRefundMax: 100 },
};
```

- **Choose how careful to be before choosing what to do.** Stage one places the case in a risk tier (unauthorised activity is high, money is mid, questions are low, an unclear intent is "unknown" with the strictest numbers); stage two runs the same rule templates with that tier's thresholds.
- **Asymmetric bars.** Raising a problem ("this line was billed before") can take 0.5; accepting an excuse that clears it ("the PO price was split across two lines") can demand more. Write both in the profile.
- **Materiality.** Don't send a 40-dollar question to a review that costs 75 dollars of someone's time; compute the stake in code and skip the review below a multiple of its cost. Authorisation and fraud checks are never a materiality question.

## Staged nodes

A node is one `systemOne` call with its own focused state and question set. Run the cheap triage node on every case; run the deeper nodes only when triage makes them relevant, with **low entry floors** (running a node is cheap, missing it is not):

```ts
const triage = await jev.systemOne({ state: triageState(c), questions: TRIAGE });
const a = triage.answers;
const runFraud = a.reportsUnauthorized.noul > 0.3 || choiceMass(a.intent, ["unauthorized_charge"]) > 0.3;
const runMoney = choiceMass(a.intent, ["refund_request", "billing_dispute"]) > 0.2;
const [fraud, money] = await Promise.all([
  runFraud ? jev.systemOne({ state: fraudState(c), questions: FRAUD }) : undefined,         // adds the ledger entry
  runMoney ? jev.systemOne({ state: moneyState(c), questions: MONEY }) : undefined,         // adds the claim on file
]);
```

- **Record why each node ran or was skipped** ("intent mass on refund 0.34 > 0.2"). Rules that read a node check it ran; a skipped node is not a "no".
- **Break near ties with a narrower question.** When the top two intents are within 0.25, ask a second choice between just those two, with descriptions that contrast them, and renormalise the pair's mass by its answer.
- **Combine probabilities explicitly.** "Worked" = fulfilled, or not fulfilled but correctly handed off: `f + (1 - f) * handedOff * handoffRequired`. "Any of these claims is false" = `1 - Π(1 - p_i)`. Write the formula where the gate is, not inside a question.
- **Fan out per item.** One safety node per consequential tool call, one set of yes/no questions per invoice line or prior invoice, built from the record; each item's answers stay keyed to it.
- **Block before you pair.** Matching records across two lists (same product, same company, should page A link to page B) is a yes/no per candidate pair; code first discards the pairs that can't match (different category, no shared token, outside the date window), so the model judges hundreds of pairs, not the full cross product.

## Score once, decide many times

Store the raw judgments (every probability, keyed by case and question version), not only the decision. Then:

- **Normalise before you weight.** Divide each score by its top level (`score / (levels - 1)`) so a four-level and a three-level question sit on the same 0-to-1 scale and a weight of 0.6 against 0.3 means twice as much.
- **Weights, filters, rankings and views are code.** A composite score (`0.5 * fit + 0.3 * urgency + 0.2 * quality`), a user's slider, a different cut-off: none needs a new call while the evidence and the question wording are unchanged.
- **Weighted means are for qualities that can compensate** (a strong lead with a weak message). "Any serious violation blocks" is a separate condition per violation, checked before any average; a high mean must never hide one failed hard requirement.
- **Ranking uses comparable per-item scores:** the same score question on each candidate against the same query, then sort in code. With labelled outcomes, the stored judgments also become features for an ordinary model.

## Cascades

Aggregate a battery of "is something wrong here?" checks with **any** (the max), not the mean: one confident red flag escalates instead of being averaged into silence. Frame each so true is the bad case.

Put the cheap judgment in front and the expensive one behind it, on the slice that needs it: certain spam is hidden by code, the clear how-to gets the macro, and the gray zone (confidence under about 0.85, or signals that disagree, such as "not spam" with high toxicity) goes to a reasoning model or a person. One confident false positive that hides a real customer costs more than the whole gray zone.

## Precedence

When several branches each add actions, resolve them once at the end with an explicit order and a few blocking rules: a hard blocker (fraud review, duplicate, unauthorised) removes every payment action; a correction request still allows paying the undisputed part; "schedule" beats "pay now" when both appear. Return the ordered list, the primary action (first in precedence) and the trace of every rule with its inputs, fired or not.
