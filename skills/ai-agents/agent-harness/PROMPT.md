# The prompt

## Measure what is sent

Size the rendered request, not the files: the system prompt as the model receives it, every tool schema, the skill list and the first reminders. Unused prompt files sitting next to the live one, and templates that render far shorter or longer than they look, both mislead. Count prompt and tools together: tool schemas are often several times the prompt.

There is no universal right size. A small prompt with heavy tool schemas and a long prompt that carries a tool API both work. For a business agent, a reasonable outcome after cutting every situational rule out and backing every hard rule with code is 10,000-20,000 characters of base prompt, measured, not a target to hit.

Pin the rendered prompt and the tool list as snapshot files in the repo, so every change to what the model sees shows up as a diff in review.

**Give the prompt and the tools sent up front their own budgets,** each held by a test (around 15,000 characters each is a good aim; one agent went from 31,554 characters of tools to 17,805 and its prompt to 17,064, with no drop in its evals). What gets them there:

- **A rule said in both the prompt and a tool description keeps one place,** usually the tool's; a rule about a group of tools loads with those tools.
- **Rare tools load through tool search,** and the prompt names every deferred tool with its namespace, built from the tool registry, so the model knows what it can find. A tool the user asks for in words that don't match its search terms stays up front: deferred, "forget what I told you" found no memory tool.
- **Schemas say formats in words:** a validation pattern compiled into the schema (an id's 240-character regular expression) is sent on every request; "a UUID" says the same.

**Splitting a tool by job** (create, then set its schedule with a second tool) keeps each schema small and each call simpler for the model. The reverse fails too: a questions parameter added to a plan tool confused the model, which was asked for a plan and a set of questions about the plan at once (what if the answers conflict with the plan? call the tool twice?). Questions got a tool of their own.

## A stable prefix, changing context appended

The base prompt stays byte-identical for the whole session, so the provider's prompt cache keeps hitting; anything that changes goes in as a message.

- **Session-wide sections may be conditional** (present or empty for the whole session), decided once at the start.
- **Anything that changes mid-session is an appended message,** never an edit of the prompt: the date rolling over, a mode switch, the current order state, a policy change. Put the project instructions, the date and the environment in the first user-role message; later turns append only what changed and supersede earlier snapshots, never rewrite them.
- **Pin the prefix with a test:** render it for two different sessions and assert the bytes match. A section that truly must change every turn is declared as such, with the reason next to it.
- The measured cost of getting this wrong: one per-turn policy line inside the prompt can drop the cached share from most of the request to almost nothing. Done right, 90-99% of input is cached. A prefix shorter than the provider's minimum cacheable length is never cached at all.
- **What else clears the cache:** "Changing the tool definitions clears the whole cache, and a change to the system prompt clears it from that point on." So do a pause longer than the cache lifetime, switching models (the new model starts from an empty cache), connecting or disconnecting an MCP server, compaction, and on some platforms changing reasoning effort. Set these when the session starts and leave them alone while it works.
- **A cache write costs more than a read:** 1.25 times the input price for a five-minute cache and twice for a one-hour cache, on one provider's pricing, and each hit resets the lifetime at no charge. At 120K tokens of context one five-minute write costs as much as 25 reads, so a pause past the lifetime turns the next cheap read into a write.
- **Every turn resends everything before it:** a task that grows from 20K to 120K tokens over 40 turns sends about 2.8M input tokens, though the conversation never passed 120K; in 25 turns it sends about 1.75M. "A turn costs more than the tokens it adds, because it resends everything before it. So the cheapest turn is the one you don't need." Stale context (old stack traces, finished files, fixed test output) is paid for again on every turn.
- **The order:** tools first, then the static instructions, then rarely changing stable data (the customer, the settings) as a second system message, then the history, and the turn's reminders, memories and record state as one note just before the newest message. Stamp each user message with its own time (weekday, date, time, time zone).
- **The tools in a fixed order,** set explicitly where the SDK allows it, so adding a tool or a discovered one doesn't reshuffle the cached start.
- **A cache key per conversation** (`<app>-chat:<conversationId>`), so one conversation's turns land on the same cache.

## Untrusted text in tagged sections

When sections are tagged (`<voice>`, `<scope>`, `<customer>`), escape or quote what customers, posts, files and tools wrote, so a tag inside their text can't close a section and open a new one.

## Reminders code adds

A situational rule arrives only in its situation, as a short message code appends to the turn ("her way in needs a call: keep the order open, no payment link yet"). Code detects the situation from facts (a delivery report arrived, the order is missing a field), so the reminder can't be forgotten and the base prompt stays short. Reminders that keep firing on every turn belong in the prompt instead. A recurring reminder of a plan can also hold a newer model back: reminders of its todo list "made Claude think that it had to stick to the list instead of modifying it when it realized it needed to change course". Some providers offer a reminder that expires by itself at the next user message; it does the same job without your code removing it.

A rule about what to do with a tool's result goes in as a **step note** right after that result, not in the base prompt. Moving every rule to its reminder, step note or tool description can halve a base prompt (19,000 characters to under 10,000).

## Skills

- **The list is a message, with a budget:** a small share of the context window (one or two percent) and a cap per description (a few hundred characters). The model reads the descriptions and loads the full text itself. Don't route skill choice through a classifier unless you have measured it in shadow mode first.
- **Code decides what is visible:** a skill tied to certain files appears once such a file is touched; a skill the model must never choose is hidden; integrations the user hasn't connected stay out of the list.
- **A description is a classifier:** say when it applies, with the signal that marks it ("only after she says it is a gift"). Say when not to use it. Never put an example that looks like the common case into a rare skill's description: one count-and-street example made plain orders load the gift flow one time in three. Tell the agent not to load a skill "to check whether it applies". Put the words users say in it, as triggers, not a summary.
- **Keep a routing eval:** each typical opening message mapped to the skill it must load, or none; rerun it after any description, prompt or gate change. A new skill gets two or three cases that must load it, and the existing cases show it doesn't take messages that belong elsewhere. Write descriptions as general rules; one tuned to the eval's exact messages scores well and routes real messages badly. In production, log each skill load, so a skill that triggers less often than expected shows up.
- **Routing lives in two places only:** the skill's line in the list and its description. The body is read after the choice is made, so a "when to use this" section inside it is dead weight.
- **A skill with several flows is a short router:** the main text says which file covers which case and the agent opens only that one. Keep each file one link away from the main text, short (around 100 lines is a good ceiling), with a contents list at the top of anything longer. A table from symptom to file does the routing. Depth is a choice with two views: one link deep keeps every file in reach, while Claude Code's model went, over a year, to "nested search across several layers of files to find the exact context it needed".
- **Leave out what the agent can fetch:** a skill holds what the agent couldn't work out from the live data, the tools and the docs; code samples and copied facts go stale, so point to the source instead. Leave out what the model already does by default too: a skill earns its place with "opinions, knowledge, or best practices that are particular to you, your team, or product" (a frontend design skill that steers away from the Inter font and purple gradients).
- **A gotchas section and one kind of job per skill:** "The highest-signal content in any skill is the Gotchas section", grown from the failure points the agent actually hits; a skill that straddles several categories confuses the agent. Writing a skill in full is the `skill-authoring` skill.
- **Match the freedom to the risk:** plain guidance where several ways are fine, exact steps or a script where one wrong move breaks something.
- **A playbook says when to skip its own steps:** a search-everywhere playbook loaded for "only on Marketplace" searched every source anyway, and a research playbook loaded for one narrow question ran its whole sequence. Name the narrow requests it answers directly.
- **Write a playbook as a goal, the sources and when it's done,** not a numbered recipe; keep the tool names only where the model needed them to act at all.

## The base prompt

What remains: voice, language, scope, what the agent never does, and the flows nearly every conversation runs. Write each rule once, short, as what to do, with the reason when it isn't obvious: a model that knows why applies the rule to the neighbouring case. Align two rules that contradict rather than tuning both, and never let instructions be cut silently by a size limit: fail loudly or test the size. Contradictions also arrive across layers of one assembled context: the system prompt says "leave documentation as appropriate", a skill says "DO NOT add comments", the user says "just make it work like the old one". They showed up in transcripts of real requests, as the system prompt, skills and user requests clashed.

- **State a priority order for when requirements compete,** so a clash has an answer written down. Vercel's design.md for its report pages opens with one ("When requirements compete, protect them in this order:", supplied facts and task constraints first, refinement of details last) and scopes its questions: "Ask one grouped set of questions only when proceeding could change commercial meaning, security or legal claims, privacy, formulas, units, populations, periods, customer identity, recommendations, approvals, deadlines, owners, or calls to action. Otherwise omit the unknown, label it honestly, and proceed."
- **Keep the instructions' own vocabulary out of the output:** "Never let this skill's own authoring vocabulary, such as composition, hierarchy, focal relationship, or mediation, leak into page copy."

- **Ask for what you need, not its reasoning:** a request to reproduce the model's internal reasoning in the reply can be declined. Ask instead: "Explain why you chose this approach in three sentences." If the user should see updates at predictable points, such as a line before the first tool call and a short recap at the end, say so in the system prompt.
- **A chat agent with long conversations** sometimes re-examines an earlier answer while thinking about a short follow-up, which slows the reply. Where answers stay settled, the instruction:
  ```
  Once you have answered something, treat that answer as done. Focus on what I'm asking now, and don't go back over an earlier answer unless I ask about it or point out a problem with it.
  ```
  Leave it out for long analysis, where a later step can show a mistake in an earlier one.
- **Coding-agent completion instructions** are in [coding-agent-harness INSTRUCTIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/agent-workflows/coding-agent-harness/INSTRUCTIONS.md#coding-agent-completion). Product-agent prompt design stays here. [existing agent-harness, PROMPT.md, The base prompt]

## Changing the prompt

For the evidence behind a proposed reduction, exact-original recovery and recall overhead, use [CONTEXT-COSTS.md](CONTEXT-COSTS.md). Its comparison contract keeps a smaller prompt separate from a measured quality or cost improvement. [JuliusBrussee/caveman, caveman-learn/SKILL.md and caveman-optimize/SKILL.md]

1. **Start from an observed failure:** real replies that went wrong, named as a failure (wrong format, an ignored rule, an invented fact). What could go wrong is not a reason to add a rule.
2. **Find where the prompt causes it:** a missing, vague or contradicting instruction.
3. **Fix the class, not the example:** write the rule at the level of the mistake, in your own words, never the failing message itself. If the general rule doesn't work, say so; narrowing it until it fits one case is overfitting.
4. **Keep what works:** before changing a sentence, name the behaviour it protects, and rerun the cases that depend on it.
5. **One cause per attempt,** each saved as its own version, so a result can be traced and rolled back. No added emphasis or capitals as a fix.

**Cutting a prompt breaks things quietly.** What went wrong when one was cut, and the guard for each:

- **A section dropped whole:** the cut replaced a section from its first mention, which sat inside another section, and took the end of that one and two more with it. A test names every section the prompt must contain.
- **Named tools folded into a group name** ("the analysis tools"): the agent stopped calling them. Keep one line naming each tool the prompt routes to.
- **A short hint read as the whole recipe:** "answer from the knowledge tool" made the agent skip the follow-ups every answer offers. A hint says what still applies.
- **A detail cut from the prompt** must already live in its tool's description; check each one before the cut lands.
- **Gate a cut with the full suite,** and compare on the cases both runs share.

When a call waits for the user's approval, it ends the turn: the prompt says to write the whole answer first and put that call last.

**Write for the model that will read it.** Instructions accumulate for the weaknesses of older models and then hold back newer ones: step-by-step recipes where the model now plans well, "always run the tests" where it already does, and hard "never without asking" language that makes a careful model stop early. When the model changes, reread every instruction: keep boundaries that protect something real, give explicit permission for work you know is safe ("these tests use throwaway data: run them and fix what fails without asking"), and state what done means, so the model neither stops at a first draft nor runs past the goal. Check the model's own prompting guide: newer reasoning models want goals over micromanaged steps and less shouted emphasis. A prompt that serves several model families is tested on each; support a small set of models with a fairly similar capability profile.

- **The measured size of the change:** Claude Code's system prompt lost over 80% for its newer models with no measurable loss on its coding evaluations. One trade it made, a hard rule for judgement. Before: "In code: default to writing no comments. Never write multi-paragraph docstrings or multi-line comment blocks - one short line max. Don't create planning, decision, or analysis documents unless the user asks for them - work from conversation context, not intermediate files." After: "Write code that reads like the surrounding code: match its comment density, naming, and idiom."
- **Remove old workarounds before tuning:** refusal steering, tool-call retry shims, "do not be lazy"; remove them and rerun the evals before tuning anything else. Instructions written for an older model can make a newer one write more and repeat tool calls: on one benchmark a prompt audit after a model migration cut cost a further 9% by removing "a mandatory six-step procedure, a scratchpad rule, a verify-twice rule, and instructions that contradicted each other".
- **Delete "think carefully" lines:** "think carefully", "think step by step" and similar. A reasoning model already thinks before it replies and decides how much; in one chat product removing such a line made replies start sooner, with no clear drop in quality. For a quick answer say "Answer directly." To get less thinking, lower the effort: asking in the system prompt to think less doesn't reliably reduce it.
- **Name the stops you want:** on a long task a model sometimes stops to report instead of going on, with "a summary that names the next step without taking it, an offer to continue, or a list of choices that don't block the work", and it follows instructions that name these stops:
  ```
  When a step doesn't need my input, keep going. Put status notes in the same message as your next action.
  Stop and ask only when you can't continue without me, or before anything destructive: deleting data, force-pushing, or changing anything outside this repository.
  ```
  A rule to keep going means fewer stops, so keep your own check before anything risky or hard to undo.
- **Tools and settings age with the model too:** shape tools to the model's own abilities, learned by reading its outputs; "the tools that your models once needed might now be constraining them". Effort levels don't mean the same amount of thinking on every model, so a level chosen for the old model doesn't carry over.
