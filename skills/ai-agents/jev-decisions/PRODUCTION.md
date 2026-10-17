# Running it

## Errors, timeouts, retries

The client retries by itself: 2 retries after the first attempt, backoff from 500 ms doubling to 5 s with 25% jitter, on 408, 429 and 5xx, on connection failures and on timeouts, honouring `Retry-After` up to 60 s. The timeout is **per attempt** (10 s by default) with no total budget, so the worst case is about three timeouts plus backoff. On a request path, set both:

```ts
import { APIConnectionError, APIError, RateLimitError } from "@typesafe-ai/sdk";

const result = await jev
  .systemOne({ state, questions }, { timeout: 2_000, retry: { maxRetries: 1 }, signal: AbortSignal.timeout(5_000) })
  .withResponse()
  .then(({ data, requestId }) => ({ ok: true as const, data, requestId }))
  .catch((error: unknown) => {
    if (error instanceof RateLimitError) return { ok: false as const, reason: "rate_limited", retryAfterMs: error.retryAfterMs };
    if (error instanceof APIError) return { ok: false as const, reason: `http_${error.status}`, requestId: error.requestId };
    if (error instanceof APIConnectionError) return { ok: false as const, reason: "unreachable" };   // includes APITimeoutError
    throw error;                                       // TypeSafeError: invalid questions or config, a bug; fail loudly
  });
```

- **A failed decision is a middle-band decision.** No answer means ask, queue for a person or keep the old path, never act and never auto-close. Write that fallback next to the gate.
- **429 and 529** mean rate limited (per organisation, in tokens and requests per second) and overloaded; both are retried with backoff by the client. Keep concurrency modest on a shared key (about eight in flight) and raise it slowly.
- **4xx other than 429 is your bug** (bad key, bad request, unknown model): don't retry it, alert on it.
- **`APIUserAbortError`** means your own signal fired; it is not an outage.
- Logging: `logLevel: "info"` logs request summaries; `"debug"` adds headers and bodies (credential headers are redacted, bodies are not, so never in production with personal data).

## Pinning and versions

`jev-latest` is a moving target and every threshold is tuned against one model's probabilities. Pin a version in configuration (`defaultModel: "jev-1.13.0"`), store the `model` string returned with every decision, and treat an upgrade like a migration: replay the labelled set on the new version, compare per gate, retune, then switch.

If a project deliberately tracks the newest release instead, it needs two things in exchange: every answer logs the model it asked for next to the one that answered (so a drift traces to a release), and each Jev use has its own eval that is rerun as the check after every release. An unknown model ID is a 400 that is never retried.

As of October 2026: `jev-1.13.0` is the stable release behind `jev-latest`, `jev-1.14.0` (from October 14, needed for box questions) sits behind `jev-preview`. `models.list()` returns the aliases; versioned IDs are accepted whether listed or not. The same weights serve every account and are not trained on customer requests; zero data retention is an enterprise option.

## Jev inside a product

- **Jev only adds safety or hints.** When it is off, slow or failing, the product does exactly what it would do without it: a vendor outage never stops a reply. Each use says in code what happens without Jev.
- **Budgets per use, not per request:** a whole-ask budget on the reply path (a few seconds, interrupting the request), a longer one off it; inside it, a per-request timeout and retries only when the service is busy (429, 529) or timed out. The SDK's own defaults (10 s per attempt, 2 retries, backoff) can reach about 30 s in the worst case, so the caller's budget is what bounds the turn.
- **A kill switch** (an environment flag, or no key) stops all asks without a redeploy.
- **Parse answers strictly** with a schema per question type, and give failures typed kinds (missing key, timeout, rejected with status, invalid shape).
- **Privacy:** send only the state and the questions; don't propagate your tracing headers to the vendor. Trace each use under its own name, and log its answers as an event the product's run records keep, so a reviewer can see why a reminder fired.
- **Few questions per turn.** Questions that duplicate what the prompt or a skill already does add latency on every turn and earn nothing; delete them. A handful per turn is normal.
- **A narrow code rule where Jev misreads,** and never over its safer verdict: a written entry code sometimes reads as "not mentioned", so code may upgrade that to "given", but never override "needs a call".
- **Fall back below the confidence bar** to the rule the product used before (keywords, a default). In one measurement on labelled courier notes, Jev with a keyword fallback under it was right on 161 of 165 runs; keywords alone on 32 of 55 notes.
- **Every threshold names the eval that set it,** and the eval stays in the full run.

**Through the AI SDK.** A project already on the AI SDK can ask the same questions through its experimental decisions call (`experimental_decide`, from AI SDK 7.0.128; 7.0.105 to 7.0.127 named it `experimental_evaluate`, which Vercel's Jev guide still uses and later versions keep as a deprecated alias) with a Jev decision model, which keeps one provider setup and one test double. The shapes match: a boolean answer is P(true), choice and score answers may carry their distributions, and Jev's separate confidence statistic sits in the provider metadata, keyed by question id (it is not the chosen option's probability). Through Vercel AI Gateway the model is the plain string `typesafe-ai/jev`; the AI SDK then authenticates with `AI_GATEWAY_API_KEY` or a Vercel OIDC token. Its limits: text and JSON state only through that provider, a question type the model doesn't support fails the whole call, a refusal of any question fails the call and is not retried, and the default retries (2) need the same budget as above. Pin the model id there too.

```ts
import { experimental_decide, type Experimental_DecisionModel } from "ai";

export async function routeRefundMessage(model: Experimental_DecisionModel, message: string) {
  const { answers } = await experimental_decide({
    model,
    state: { message },
    questions: { requestsRefund: { type: "boolean", instructions: "Does the customer ask for money back for an order?" } },
  });
  const p = answers.requestsRefund.probability;
  return p >= 0.8 ? "refunds_queue" : p <= 0.2 ? "normal_reply" : "staff_review";
}
// Tests pass a mock decision model from "ai/test" whose doDecide returns { answers: { requestsRefund: { type: "boolean", probability: 0.5 } }, warnings: [] }.
```

**Questions and thresholds live in one module.** They are the part a reviewer must read, so keep every question, criterion and threshold constant in one file, not scattered through handlers. Coding agents write mediocre questions; expect to edit them by hand.

## Record and replay

Store, for every call: the model, a hash of the state, a hash of the questions (so a reworded criterion is a new version), the answers, and per decision the rules that fired with the inputs they read. Then:

- **Replay is free.** A changed threshold or rule is re-decided over stored answers without calling the model; only a changed state or question needs new calls.
- **Replays are not reruns.** A cached answer reproduces the decision exactly; a live rerun of the same request can differ slightly on close calls. Key the cache on the model, the state and the full question set (a reworded criterion is a new key), record the model version each answer came from, and price from stored token counts so a price change needs no new calls.
- **Cache identical calls** by `hash(model, canonical JSON of state, canonical JSON of questions)`. Retries, re-runs and evals then cost nothing, and tests run against recorded answers offline.

```ts
import { createHash } from "node:crypto";

const canonical = (v: unknown): string =>
  Array.isArray(v) ? `[${v.map(canonical).join(",")}]`
  : v && typeof v === "object" ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`).join(",")}}`
  : JSON.stringify(v);

export const jevCacheKey = (model: string, state: unknown, questions: unknown) =>
  createHash("sha256").update(canonical({ model, state, questions })).digest("hex");
```

## Calibrating thresholds

Jev's probabilities are trained to be calibrated (answers at 0.9 right about nine times in ten across many cases), which is what makes thresholds meaningful. It is a property of groups of cases, never of one answer, and it holds on the vendor's data, not necessarily on yours. So:

1. **Label a set** of real cases with the action a careful person would take: 100 to 300 to start, with the hard cases over-represented.
2. **Run the workflow** over it and keep every probability.
3. **Plot per gate** accuracy against the probability, and the share of cases above each cut. Set each threshold where the error rate is acceptable for that action's cost: an irreversible or external action needs the high end, a cheap reversible one or a "run the deeper check" gate can sit low.
4. **Hold out** part of the set and check the chosen thresholds on it before shipping.
5. **Shadow first.** Run Jev beside the existing logic for a week, deciding nothing, logging both. Read every disagreement; most will be thresholds or criteria, not the model. Switch on only the bands that matched.

## Rolling out

1. **One bounded, low-risk decision** whose possible answers you can name, already made today by code, a person or a chat model.
2. **Write the rubric before calling the model:** the options and what belongs in each.
3. **Try it by hand first.** A loop that reads input line by line and prints the choice, probabilities, confidence and latency for each is enough. Run one question on one real state, then change one field (tests fail, a migration appears) and watch the distribution move. A question that doesn't move when the deciding fact flips is badly worded or missing evidence.
4. **Collect real examples with expected answers,** the ambiguous and adversarial ones included (a request no option fits, a planted instruction).
5. **Shadow, calibrate, then automate the safest branch first;** keep a person or a stronger model on the rest.
6. **Questions are program code:** version them, review changes in pull requests, and rerun the evaluation set whenever the model, a question or a threshold changes.

## Tuning a question

Wording is the main lever. Split the labelled cases into a tuning set and a held-out set; reword the instructions and criteria against the tuning set only (read the cases it gets wrong, add the line that separates them), and report the held-out score once at the end. Tuning against the set you report on overfits the wording to it.

When a case fails, find which part failed before touching anything: the evidence was missing from the state, the candidates didn't include the answer, the model misjudged, the code combined the answers wrongly, or the service failed. Only the third is fixed by rewording.

## Evals

- **Agreement with the expected actions, per policy:** exact action-set match, primary-action match, and for each disagreement the missing and unexpected actions. Score one action set per case per policy; cost and latency per case next to it.
- **Facts are checked separately from judgments.** Compare the facts code derived against reference values on the keys both have, so a wrong computation is not blamed on the model.
- **Question mode:** run once with all questions in one call and once with one question per call on the same cases; the gap tells you whether questions bleed into each other.
- **Score a single output with fixed maths**, so the judge never writes a verdict: a yes/no contributes P(yes); a score of n levels contributes Σ k·P(k) / (n − 1); a choice contributes the credit you assign each label weighted by its probability, with a "not applicable" label that removes the question when it holds most of the mass. Weight and average the applicable questions; a strict mode passes only when every applicable question lands on its best answer. The breakdown per question is the explanation.
```ts
import { TypeSafeClient, choice, noul, score, type Questions } from "@typesafe-ai/sdk";

type Spec = { questions: Questions; weights?: Record<string, number>; credits?: Record<string, Record<string, number | null>>; strict?: boolean };

/** Fixed maths over Jev's answers: a yes/no is P(yes), a score its normalised expectation, a choice the credit of each label. */
export async function scoreOutput(jev: TypeSafeClient, state: Record<string, unknown>, spec: Spec) {
  const { answers } = await jev.systemOne({ state: state as never, questions: spec.questions });
  const rows = Object.entries(answers).map(([id, a]) => {
    const weight = spec.weights?.[id] ?? 1;
    if (a.type === "noul") return { id, weight, value: a.noul, best: a.noul >= 0.5 };
    if (a.type === "score") {
      const n = Object.keys(a.probabilities).length;
      return { id, weight, value: a.score / (n - 1), best: Math.round(a.score) === n - 1 };
    }
    if (a.type === "choice") {
      const credits = spec.credits?.[id] ?? {};
      const probs = a.probabilities as Record<string, number>;
      const na = Object.entries(credits).filter(([, c]) => c === null).reduce((s, [l]) => s + (probs[l] ?? 0), 0);
      if (na >= 0.5) return { id, weight, value: null, best: true };                  // not applicable: drops out
      const applicable = Object.entries(credits).filter(([, c]) => c !== null) as [string, number][];
      const mass = applicable.reduce((s, [l]) => s + (probs[l] ?? 0), 0);
      const value = applicable.reduce((s, [l, c]) => s + c * (probs[l] ?? 0), 0) / (mass || 1);
      return { id, weight, value, best: credits[a.choice] === 1 };
    }
    return { id, weight, value: null, best: true };
  });
  const used = rows.filter((r) => r.value !== null) as { id: string; weight: number; value: number; best: boolean }[];
  const weighted = used.reduce((s, r) => s + r.weight * r.value, 0) / (used.reduce((s, r) => s + r.weight, 0) || 1);
  const final = spec.strict ? (used.every((r) => r.best) ? 1 : 0) : weighted;
  const reason = used.map((r) => `${r.id}: ${r.value.toFixed(2)} (weight ${r.weight})`).join("; ");  // assembled, never generated
  return { score: final, rows, reason };
}

// Tool faithfulness: the answer may only state what the tools returned.
export const toolFaithfulness: Spec = {
  questions: {
    all_from_tools: noul("Every fact and figure in `answer` appears in the output of a tool in `tool_calls`."),
    values_accurate: noul("`answer` reports every value returned in `tool_calls` accurately."),
    grounded: score("How much of `answer` is grounded in `tool_calls`?", ["fabricated", "mostly fabricated", "mostly grounded", "fully grounded"]),
    missing_info: choice("What did `answer` do with information the tools did not return?", {
      left_it_out: null, flagged_as_unknown: null, hedged_it: null, stated_as_fact: null, nothing_missing: null,
    }),
  },
  weights: { all_from_tools: 2 },                                                       // the failure we fear most counts double
  credits: { missing_info: { left_it_out: 1, flagged_as_unknown: 1, hedged_it: 0.5, stated_as_fact: 0, nothing_missing: null } },
};
```

The weights say in code what matters most; the reason is built from the answers, so it can't drift from the score. Strict mode turns the same questions into an acceptance test (every citation supported, no prohibited behaviour, every required step done) for eval-driven development.

- **Escalate the unsure to a stronger judge.** Accept confident Jev verdicts and send the rest to a reasoning model or a person; with a threshold fixed in advance this beats either alone on cost and accuracy. Jev holds up when the verdict can be read off the evidence and falls behind when it needs maths, code or multi-step logic.
- **Keep questions and thresholds fixed while comparing agent versions,** or you are measuring the judge, not the agent.

## Cost and latency

Input tokens only, about $0.042 per million; output is free. A request holds about 64K tokens (the state plus any one question about 32K); a choice can have up to 255 labels and a score 2 to 10 levels. Cost scales with state size times calls, so one call with twelve questions over a 4,000-token state costs about a twelfth of twelve calls. Bodies of 1 KiB or more are zstd-compressed by default on Node 22.15+.

Measure the bill per completed task, not per call: a cheap wrong decision that sends a good change back, books the wrong thing or hides a real customer costs a person's time, which is more than any call. Speed and cost multiples published by the vendor are the favourable end of its own evaluations (TypeSafe AI reports Jev "up to 194 times faster and 445 times cheaper than language models" in its own workflow evaluations); measure yours.

Another view: Adam Argyle singles out "machine interfaces matter more than the chat interfaces" and "code owns the workflow and AI handles narrow, structured decisions" (the shape in [SKILL.md](SKILL.md)), and writes "No hallucinations because it's not using probability to hopefully create a pleasing string" ([nerdy.dev: Jev](https://nerdy.dev/jev), 2026-09-17). This skill treats every answer as a probability that can be wrong, calibrated only across many cases ([Calibrating thresholds](#calibrating-thresholds)), so the gates stay.

Besides the TypeSafe API, the model has been offered through gateways (Vercel AI Gateway lists it as `typesafe-ai/jev`, with an AI Gateway key in `AI_GATEWAY_API_KEY`); check the current options and the data-retention terms before routing personal data through any of them.

The habit that cuts the bill most is not a cheaper model but fewer, focused states: the node that judges consent sends the proposal and the reply, not the transcript.
