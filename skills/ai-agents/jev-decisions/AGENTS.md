# Agents

An agent loop is full of small decisions that don't need a frontier model: is this command safe, which tool next, is the work done, did that run go well. Each becomes a typed Jev call that returns in a fraction of a second, and the big model keeps the work that needs words.

```
user -> LLM (plan) -> Jev (route) -> tool -> Jev (worked? relevant? risky?) -> continue? -> tool ... or -> LLM (final answer)
```

Find them by reading a trace: count the calls whose output nobody reads as text and that end in a branch. In a coding loop, each kind of loop hides one:

| Loop | The decision inside it | Question |
|---|---|---|
| Turn-based: the agent checks itself against a rubric | Is this step good enough to hand back | Score on the rubric |
| Goal-based: run until the goal holds | Is the goal met yet | Yes/no over the evidence |
| Time-based: check every few minutes | Did anything change that needs the agent | Choice |
| Proactive: pick up work, fix it, review it | Which item, how risky, ship or hold | Choice and yes/no |

## The harness around it

The full method for building the agent around these checks (where each rule lives, a cache-stable prompt, gates with caps, tools, history, compaction, memory) is the `agent-harness` skill; measuring it and the fix loop to a clean run are the `agent-evals` skill. The minimum, whatever Jev says:

- **Hard limits in code:** a cap on actions and on money per run, checked before every step.
- **Progress saved after every action**, so a retry never repeats a side effect; after an interruption, inspect the last completed action before doing anything again. A confident answer can't prove a file was written or a payment went through.
- **An outcome check after "done":** verify independently that the thing happened (the record exists, the page shows it), never take the decision's word for it.
- **A person on everything irreversible:** publishing, deleting, paying, sending outside, posting in the user's name.
- **Observed facts apart from inferred ones** in the agent's memory, and a freshness check before applying an old judgment to a state that has since changed.

## Gating a tool call

Before a consequential call runs, ask whether it is allowed. Exact rules first, in code; then Jev on what needs reading; then a decision with three outcomes.

```ts
// .claude/hooks/jev-gate.ts: a Claude Code PreToolUse hook (matcher "Bash"). Node 22.18+ runs .ts directly.
import { TypeSafeClient, choice } from "@typesafe-ai/sdk";

type HookInput = { tool_name: string; tool_input: { command?: string }; cwd: string };
const input: Buffer[] = [];
for await (const chunk of process.stdin) input.push(chunk);
const event = JSON.parse(Buffer.concat(input).toString()) as HookInput;
const command = event.tool_input.command ?? "";

function decide(permissionDecision: "allow" | "deny" | "ask", permissionDecisionReason: string): never {
  console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision, permissionDecisionReason } }));
  process.exit(0);
}

// Hard rules never reach the model: a command can be written to mislead a classifier.
for (const pattern of ["rm -rf /", "git push --force", "| sh", "| bash", "curl -X POST"]) {
  if (command.includes(pattern)) decide("deny", `blocked by rule: ${pattern}`);
}

let risk;
try {
  const jev = new TypeSafeClient({ defaultModel: "jev-1.13.0", timeout: 3_000, retry: { maxRetries: 1 } });
  ({ answers: { risk } } = await jev.systemOne({
    state: { command, cwd: event.cwd },
    questions: {
      risk: choice("What happens if `command` runs inside `cwd`?", {
        read_only: "Only reads, lists or searches files, or runs the tests",
        local_edit: "Changes files inside the project that git can restore",
        destructive: "Deletes data, rewrites git history or touches files outside the project",
        external: "Sends data out, pushes, deploys, installs from the internet or spends money",
        other: "None of the above fits",
      }),
    },
  }));
} catch {
  decide("ask", "jev unavailable");                     // no key, timeout, outage: fail to a person, never open
}
if ((risk.choice === "read_only" || risk.choice === "local_edit") && risk.confidence >= 0.9) decide("allow", `jev: ${risk.choice} ${risk.confidence.toFixed(2)}`);
if (risk.choice === "destructive" && risk.confidence >= 0.9) decide("deny", `jev: destructive ${risk.confidence.toFixed(2)}`);
decide("ask", `jev: ${risk.choice} ${risk.confidence.toFixed(2)}`);   // external always reaches a person; other is never auto-approved
```

Register it in `.claude/settings.json` under `hooks.PreToolUse` with `"matcher": "Bash"` and `"command": "node .claude/hooks/jev-gate.ts"`.

For an agent you run yourself, gate per call with three yes/no questions over the state **as it stood before the call** (the charter, the permission line for this operation, earlier turns and tool results, the call's arguments): `within_permission` (inside the stated entitlement and its limits), `user_asked_or_agreed` (requested, or proposed and accepted before acting; acting before the reply is a no), and `instructed_by_tool_output` ([QUESTIONS.md](QUESTIONS.md#prompt-injection-is-a-question)). Raise the bars when the permission line says the role is not entitled or needs explicit confirmation; a breach on any of them stops the call.

## Knowing when the work is done

An agent grading its own work praises it. Put the stop decision in a Claude Code `Stop` hook: a turn cap and the checks in code, Jev on whether the evidence covers the goal.

```ts
// .claude/hooks/jev-done.ts: answering {"decision":"block","reason"} makes Claude keep working.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { TypeSafeClient, noul } from "@typesafe-ai/sdk";

const COUNTER = ".claude/.pushes";
const pushes = existsSync(COUNTER) ? Number(readFileSync(COUNTER, "utf8")) : 0;
function stop(): never {
  rmSync(COUNTER, { force: true });
  process.exit(0);
}
function keepGoing(reason: string): never {
  writeFileSync(COUNTER, String(pushes + 1));
  console.log(JSON.stringify({ decision: "block", reason }));
  process.exit(0);
}

if (pushes >= 5) stop();                                                     // the turn cap is code
let evidence: string;
try {
  evidence = execFileSync("bash", [".claude/checks.sh"], { encoding: "utf8" });
} catch {
  keepGoing("checks.sh fails. Fix the failing checks, then try to finish again.");   // no model needed
}
const jev = new TypeSafeClient({ defaultModel: "jev-1.13.0" });
const { answers } = await jev.systemOne({
  state: { goal: readFileSync("GOAL.md", "utf8"), evidence: evidence.slice(-20_000) },
  questions: { done: noul("Does `evidence` show proof for every condition listed in `goal`?") },
});
const done = answers.done.noul;
if (done >= 0.9) stop();
if (done >= 0.5) { writeFileSync("REVIEW.md", `jev put done at ${done.toFixed(2)}\n\n${evidence.slice(-3_000)}`); stop(); }
keepGoing(`Goal not met (jev ${done.toFixed(2)}). Compare GOAL.md with the output of .claude/checks.sh and finish what is missing.`);
```

`checks.sh` prints the evidence Jev sees and nothing else: test results, a search for TODOs in changed files, the README diff, a performance score. The richer the evidence, the better the judgment.

## Waking the agent only when there is work

A scheduled loop that starts a full model turn every tick pays for every empty tick. Put a Jev triage in front: label each new item with a choice (`code_fix`, `question`, `feature`, `junk`, `other`), act only on `confidence >= 0.9` and never on `other` (those get `needs-human`), and start the agent only for the label that needs it. The cheapest agent turn is the one that never started.

## Choosing the next step

Browser, desktop and tool-using agents pick from a menu that changes every step. Rebuild the menu from live state each time (the controls visible on the page now, the reviewers online now, the passages held now, never last run's list), add an exit (`ask_user`, `stop`; a workflow step's menu is continue, retry, ask the user or stop), and let Jev pick; code clicks, and a small model types only when a field needs text.

```ts
const { answers } = await jev.systemOne({
  state: { goal, url: page.url(), visible_actions: actions.map((a) => a.id), last_error: lastError ?? null },
  questions: {
    next: choice("Which action moves `goal` forward from this page?", {
      ...Object.fromEntries(actions.map((a) => [a.id, a.description])),
      stop: "The goal is reached, or no visible action can move it forward",
    }),
  },
});
```

- **Offer only the moves legal here.** Filter the menu in code by the rules of the current position (no `return` outside a function, no `break` outside a loop), and offer existing entities as whole options (`use:<name>` for a name already defined) so the model reuses them instead of respelling them.
- **Describe each option by its result.** Put the state as it would be after that choice in the label's description (`{ meaning, replacement, resulting_python }` per label, the whole program rendered as if chosen), so the model compares outcomes rather than names. An exit says exactly what it closes: "Finish this call's positional argument list; the call expression is complete".

## Routing work to an agent or a model

The same choice sits at the front of a multi-agent system (research, code, support, sales) or a model fleet: describe what each worker or model is good for and when it is overkill, let Jev pick the cheapest one likely to finish the task, and send the low-confidence ones to the strongest. The expensive model wakes only for work that needs it.

The handler need not be a model at all. An intent of "order status" goes to a database lookup; product questions and returns go to specialist LLMs loaded with their own context; a complaint goes to an LLM only when a complexity score is low and its confidence is high, otherwise to a person; anything under the intent confidence floor goes to a person. When a yes/no says the request holds several distinct actions, let an LLM split it into single commands and route each one; when the intent is open conversation, fall back to a generative model, which Jev's 100 ms adds nothing noticeable to.

## Scoring the last step instead of asking a model

Replace "evaluate the previous output" calls with scores the loop branches on: relevance below the bar retries the search, quality below the bar sends the draft back once, risk above the bar goes to a person. Write those bars in code; the model never decides both the verdict and what happens next.

## Trimming a long session

Long sessions fill with tool output that no longer matters. Ask, per tool call, whether its result is still relevant to the current goal, and drop or collapse the ones that aren't before the next model turn. It is a relevance filter at decision speed, not a summary.

## Routing a sentence to a function

One call carries both the choice of function and the arguments of every function; read only the chosen one's answers.

- The **route** is a choice whose labels are the function names and whose descriptions say when each applies, plus `none`.
- A **closed-set argument** (a union of literals) is a choice over its members; a **set of members** is one yes/no per member ("is NVDA one of the tickers asked for?"); a **flag** is a yes/no.
- An **optional argument** gets a "was it stated?" yes/no; below 0.5 it keeps its default instead of being guessed.
- **Free text, numbers and dates are not Jev's**: parse them in code or with an extraction model, and keep their defaults otherwise.
- **The call's confidence is its weakest decision**, the minimum over the route and every argument's probability (for a member or flag, the mass on the side taken). One wrong argument spoils the call, so act only when the minimum clears the bar, and ask about the weakest argument when it doesn't.

## Judging a finished run

Score agent traces after the fact with the same machinery, so a fleet of runs triages itself and people see only what needs them.

1. **Safety, per consequential call** (destructive tool, or a permission line that conditions it): the three questions above. A breach pages someone, whatever else happened.
2. **Outcome, from tool results only:** `request_fulfilled` (a tool result shows it, an assistant saying "done" does not count), `handed_off` and `handoff_required` (a correct escalation counts as working), `claims_supported` (every amount, date, ID and "done" in the final message matches a tool result), `left_undone`.
3. **Reaction, from the user's words after the end only:** a satisfaction score and `reports_unresolved`; skipped when there was no feedback, and then success needs a higher bar.
4. **Four states** from worked x unhappy: healthy (close, unless claims are unsupported), **silent failure** (failed, user didn't complain: the most valuable find, it becomes a regression case), overt failure (route by attribution), expectation gap (worked, user unhappy: was the request clear and in scope?).
5. **Attribution, only when something failed:** a choice over `tool_or_service`, `infrastructure`, `agent_misuse`, `agent_reasoning`, `nothing_wrong`, and a choice over this run's steps for "where it first went wrong". Cross-check with code: infrastructure error codes (timeouts, rate limits) count only, while caller error codes (unknown tool, bad arguments) say the agent called wrongly.

Exact checks stay in code next to the judge: "the agent must look up the order before issuing the refund" is one line over the trace, not a question. Even reading the whole trace, a judge can rate a run that skipped the lookup as very likely correct (about 0.86 in one test), because the reply sounds right; the code check catches what the judge misses.

- **Judge the trajectory, not the reply:** the request, the rules, every tool call and result (errors and timeouts included) and the final message. The same reply passes or fails depending only on the tool results.
- **A correct escalation is not a failure:** "I couldn't confirm the refund, so I passed it to the team" follows a policy that says to escalate unknown outcomes; give the judge that policy, or it scores the run as unsure.
- **Multi-turn behaviour** needs the whole conversation in the state: did the assistant keep a constraint stated early, verify identity before acting, resolve the request, stay inside its role.
- **Rerun the same traces** a few times when setting up a judge, and keep only questions whose answers are stable.

## Citations, retrieval, memory, guardrails, tool suggestion

The LLM-side recipes (checking citations against the source, filtering retrieved passages before the answer, deciding what to remember, screening input and output, suggesting one tool from a large roster, verifying an extraction before escalating) are in [RECIPES.md](RECIPES.md).
