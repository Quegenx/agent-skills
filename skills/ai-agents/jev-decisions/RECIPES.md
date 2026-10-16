# Recipes

Worked shapes for common jobs. Each one keeps code in charge of finding, computing and acting, and gives Jev only the judgments. The snippets assume `jev` is a `TypeSafeClient` ([QUESTIONS.md](QUESTIONS.md#calling)).

## Pick a value from candidates

Jev can't produce a string it wasn't given, so extraction is "find, pick, copy": a pattern that over-finds the candidates, a choice over them with a `none` exit, and code that copies the winner verbatim and normalises it. The value can't be invented or have a digit transposed.

```ts
import { choice, type TypeSafeClient } from "@typesafe-ai/sdk";

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

export async function pickValue(jev: TypeSafeClient, text: string, pattern: RegExp, question: string) {
  const candidates = [...new Set(text.match(pattern) ?? [])];                   // over-find; dedupe
  if (candidates.length === 0) return null;
  const criteria: Record<string, string | null> = Object.fromEntries(candidates.map((c) => [c, null]));
  criteria.none = "None of these is the requested value";
  const { answers } = await jev.systemOne({ state: text, questions: { pick: choice(question, criteria) } });
  const { choice: picked, confidence } = answers.pick;
  return picked === "none" ? null : { value: picked, confidence };               // a verbatim candidate
}

// "Which address does the sender want the receipt sent to?" -> the Reply-To from the body's request, not the To: alias
export const receiptAddress = (jev: TypeSafeClient, email: string) =>
  pickValue(jev, email, EMAIL, "Which email address does the sender want their receipt sent to?");
```

- Ask for the attributes code needs in the same call: the country (so a phone library formats E.164), the currency, a yes/no "is this amount a credit, not a charge".
- With more than about 240 candidates, narrow in two stages: the section first, then the span inside it.
- Values with no pattern (names) need candidates from a roster you own, an entity recogniser or an LLM that proposes them.

## Read a date, compute it in code

Dates are text to the model, so it reads the parts and code does the calendar. Each part is a small closed choice with a `none` label: how the date is written (`absolute`, `relative`, `none`), month, day, year (a range plus `none` and `out_of_range`), and for relative dates the anchor (`today`, `tomorrow`, `day_after`, `weekday`), the weekday and the week (`current`, `next`, unqualified). The instruction names the date by role ("the deadline to return the form"), so one document yields several dates.

Code assembles a real date, fills a missing year (this year, or next if the date is already more than a month past), resolves "next Thursday" by a stated convention, rejects impossible dates (February 30), and takes the **lowest confidence of the parts it used** as the date's confidence. Below the bar, or unassemblable, it goes to a person.

## Find the line that answers

Tag every line with an ID, ask a choice over the IDs ("which line answers: ...?", descriptions `null` because the text is in the state), and in the same request a yes/no "does any line address this at all?". A choice always sums to 1, so some line ranks first even when nothing answers; the yes/no is what says "not in this document".

```ts
import { choice, noul, type TypeSafeClient } from "@typesafe-ai/sdk";

export async function findLine(jev: TypeSafeClient, lines: string[], query: string) {
  const id = (i: number) => `L${String(i).padStart(3, "0")}`;
  const doc = lines.map((line, i) => `${id(i)}| ${line}`).join("\n");             // up to ~240 lines per request
  const { answers } = await jev.systemOne({
    state: doc,
    questions: {
      where: choice(`Which line of the document contains the answer to: "${query}"?`, Object.fromEntries(lines.map((_, i) => [id(i), null]))),
      exists: noul(`Does any line of the document address or answer: "${query}"?`, {
        true: "At least one line states or directly implies the answer",
        false: "No line of the document addresses this",
      }),
    },
  });
  const verdict = answers.exists.noul >= 0.7 ? "answered" : answers.exists.noul < 0.35 ? "not in the document" : "partly addressed";
  const ranked = Object.entries(answers.where.probabilities as Record<string, number>).sort((a, b) => b[1] - a[1]);
  return { verdict, top: ranked.slice(0, 3) };
}
```

Longer documents: pick a window of lines first, then rank inside it.

## Re-rank a shortlist

Fast search (keywords, embeddings) narrows thousands of documents to a few dozen; Jev then judges each query and candidate pair with one yes/no ("could this passage be the one the query cites?", with criteria separating "states the specific rule" from "on a similar topic") and code sorts by the probability. One request per pair, run concurrently; re-ranking can only reorder what the shortlist contains, so measure the shortlist's recall first.

## Walk a taxonomy

For deep hierarchies (product categories, patent classes, medical subjects, a file tree), one choice per level over the current node's children. Greedy descent can't recover from one wrong early turn; a **beam search** keeps the best few paths (three is plenty), expands their children in parallel, and scores each path by the geometric mean of its edge probabilities, `product(p) ** (1 / decisions)`, so shallow and deep leaves compare fairly (use the mean of logs for very deep trees). A node with one child needs no question. The top-to-second path ratio says how clear the win was.

**Answer coarser when unsure.** If the leaf's confidence is low, report its parent (the division instead of the industry group) from the same answer, no second call. On one set of filings, the confident half was right nine times in ten and the other half four in ten; reported one level up, that half went to seven in ten.

## Match records

Two catalogues, a candidate pair per row (code first discards pairs that can't match). Ask one **score whose levels are the outcomes**: different things, related but possibly not the same (a variant, an edition, an ambiguous name), the same thing. Round to the nearest level: leave unlinked, send to a curator, merge. No threshold to fit; the wording of the middle level moves pairs between the curator and the unlinked pile. Companion yes/no questions per field (same name, same maker, same type) ride along to show the curator where they disagree. Compare numeric fields in code. Merging wrongly is the expensive mistake, so the middle level exists to catch it.

## Recover structure from flat text

Text that lost its formatting comes back without the model rewriting a word: pass 1 asks one yes/no per pair of adjacent lines ("does this line pick up mid-sentence from the previous one?"), code merges the pairs; pass 2 classifies each block (heading, paragraph, list item, quote, code, callout) with companion questions asked up front for every block (heading level, "is this a step whose order matters?", callout kind), read only when the type needs them. Code reads what it can see (blank lines, explicit markers) and **conditions the threshold on it**: merge at 0.2 after a line with no closing punctuation, at 0.5 after one. Group decisions come from item answers: consecutive list items render numbered when their mean step probability is at least 0.5.

## Verify an extraction, escalate the doubtful

A cheap model extracts; Jev checks each field with narrow yes/no questions framed so **true means wrong** (unsupported by the source, pulled from incidental text, wrong type or format, a value wrongly left empty), each instruction an object holding the field's spec, the extracted value and the question. Escalate to the expensive model when **any** field flag clears the bar: a max, never a mean, so one confident red flag isn't averaged away. A whole-record "is this good?" question is weaker than the per-field battery. Schema-valid output can still be fabricated; this is what catches it, and sweeping the bar trades cost for quality.

## Check citations

String-match each quote against the source after normalising whitespace and quotes; a quote that isn't there is fabricated, no model needed, and the match tells you which section to read. Then one choice per citation over that section and the claim: `supports`, `contradicts`, `says_nothing`. A claim cited without a quote uses the section it names. Verdicts below the confidence bar go to a person. An accurate quote can still sit in a section that says nothing about the claim, which is why both steps exist.

## Filter retrieved passages before the answer

Per query and passage, one request with four yes/no questions: relevant, states usable evidence, contradicts a premise of the query, tries to instruct the system. Route in a fixed order, first match wins: injection out; contradiction to a separate "conflicting evidence" block; irrelevant out; evidence in; otherwise out. Give the writer two blocks so it can push back on a false premise, and keep all four numbers in one constant so re-routing costs no calls.

## Guard an LLM's input and output

A battery of yes/no hazards (jailbreak or override attempt, help with harm, a personal diagnosis or dose, self-harm signals; on the output side, "went along with something it should have refused") plus a severity score, all in one request, on the user's message and again on the model's reply. Each hazard has a **review threshold and an action threshold** and maps to its own action (block, review, a support path for self-harm), with a precedence order; a high severity turns a review into a block. Name the policies (`strict`, `permissive`) so the trade-off is a choice, not an accident: the same probabilities route differently under each.

## Remember what matters

After each call, a second request shows the original request and the answer and asks whether the request **states a lasting fact** about the customer (their edition, plan, contract, a standing preference), counting only what the customer or staff wrote, never what the answer implied (or a wrong inference gets saved and repeated). Saved items go into the state of that customer's later calls under their own key; the questions don't change. Store the request without the memories it was answered with, so memories don't nest. Grow it into: a relevance question to choose which memories to include, a "does this replace an older one" question, and a real store keyed by customer.

## Suggest one tool or skill from a large roster

Stage 1: a choice over the whole roster with one-line descriptions, plus yes/no questions on whether the turn needs a tool at all (acts on the user's things, follows a documented procedure; and inverted, "could a generalist answer this in prose?"); below the bar, suggest nothing. Stage 2: the top three again, now with full descriptions and the opening of each one's instructions, plus a yes/no per candidate "does it do the specific thing asked?"; if none clears, suggest nothing. Put the winner in one extra line after the unchanged roster ("relevant to this request: X; ignore if it doesn't fit"), so prefix caching holds, and send a "nothing applies" line when there is none. A confident wrong suggestion is more persuasive than none, so the empty answer is a feature.

## Moderate a fast stream

One request per message with the context that changes the meaning (which game is on, so "go left" is a backseat tip and a plot twist is a spoiler): a category choice plus yes/no questions for the overriding properties (toxic, spoiler). A separate `decide()` turns the answers into show, highlight, dim, hide or blur; changing a rule re-runs `decide()` over stored answers, no new requests. Live: run several requests concurrently, keep the platform's message ID with each, and decide whether a message waits hidden for its answer.

## Turn text into model features

Each question becomes columns for an ordinary model: a yes/no is one probability, a score two (its expected level and its spread). An LLM proposes the questions from labelled examples, Jev answers them for every row (all of a round's questions in one request per row), the model trains on the columns, and each round the proposer sees the worst and best predicted rows and the feature importances, then adds, rewords or drops. Drop columns that barely vary; keep a revision only if held-out error falls. Decomposed questions beat asking for the target directly, and a held-out set the loop never sees is the only honest score.

## Check consistency before trusting a rubric

Run the same case several times with an irrelevant field changed (a fresh ID) and look at how far each answer moves. Clear questions hold still; borderline ones wobble near their thresholds. Turn the wobble into a decision: `uncertain` when a choice's top probability is under about 0.6 or a yes/no sits between about 0.3 and 0.7, sent to a person. Repeatability is not accuracy; a stable answer can be stably wrong.
