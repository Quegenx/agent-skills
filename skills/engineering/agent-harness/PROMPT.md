# The prompt

## Measure what is sent

Size the rendered request, not the files: the system prompt as the model receives it, every tool schema, the skill list and the first reminders. Unused prompt files sitting next to the live one, and templates that render far shorter or longer than they look, both mislead. Count prompt and tools together: tool schemas are often several times the prompt.

There is no universal right size. A small prompt with heavy tool schemas and a long prompt that carries a tool API both work. For a business agent, a reasonable outcome after cutting every situational rule out and backing every hard rule with code is 10,000-20,000 characters of base prompt, measured, not a target to hit.

Pin the rendered prompt and the tool list as snapshot files in the repo, so every change to what the model sees shows up as a diff in review.

## A stable prefix, changing context appended

The base prompt stays byte-identical for the whole session, so the provider's prompt cache keeps hitting; anything that changes goes in as a message.

- **Session-wide sections may be conditional** (present or empty for the whole session), decided once at the start.
- **Anything that changes mid-session is an appended message,** never an edit of the prompt: the date rolling over, a mode switch, the current order state, a policy change. Put the project instructions, the date and the environment in the first user-role message; later turns append only what changed and supersede earlier snapshots, never rewrite them.
- **Pin the prefix with a test:** render it for two different sessions and assert the bytes match. A section that truly must change every turn is declared as such, with the reason next to it.
- The measured cost of getting this wrong: one per-turn policy line inside the prompt can drop the cached share from most of the request to almost nothing. Done right, 90-99% of input is cached.
- **The order:** tools first, then the static instructions, then rarely changing stable data (the customer, the settings) as a second system message, then the history, and the turn's reminders, memories and record state as one note just before the newest message. Stamp each user message with its own time (weekday, date, time, time zone).
- **The tools in a fixed order,** set explicitly where the SDK allows it, so adding a tool or a discovered one doesn't reshuffle the cached start.
- **A cache key per conversation** (`<app>-chat:<conversationId>`), so one conversation's turns land on the same cache.

## Untrusted text in tagged sections

When sections are tagged (`<voice>`, `<scope>`, `<customer>`), escape or quote what customers, posts, files and tools wrote, so a tag inside their text can't close a section and open a new one.

## Reminders code adds

A situational rule arrives only in its situation, as a short message code appends to the turn ("her way in needs a call: keep the order open, no payment link yet"). Code detects the situation from facts (a delivery report arrived, the order is missing a field), so the reminder can't be forgotten and the base prompt stays short. Reminders that keep firing on every turn belong in the prompt instead. Some providers offer a reminder that expires by itself at the next user message; it does the same job without your code removing it.

A rule about what to do with a tool's result goes in as a **step note** right after that result, not in the base prompt. Moving every rule to its reminder, step note or tool description can halve a base prompt (19,000 characters to under 10,000).

## Skills

- **The list is a message, with a budget:** a small share of the context window (one or two percent) and a cap per description (a few hundred characters). The model reads the descriptions and loads the full text itself. Don't route skill choice through a classifier unless you have measured it in shadow mode first.
- **Code decides what is visible:** a skill tied to certain files appears once such a file is touched; a skill the model must never choose is hidden; integrations the user hasn't connected stay out of the list.
- **A description is a classifier:** say when it applies, with the signal that marks it ("only after she says it is a gift"). Say when not to use it. Never put an example that looks like the common case into a rare skill's description: one count-and-street example made plain orders load the gift flow one time in three. Tell the agent not to load a skill "to check whether it applies".
- **Keep a routing eval:** each typical opening message mapped to the skill it must load, or none; rerun it after any description, prompt or gate change. A new skill gets two or three cases that must load it, and the existing cases show it doesn't take messages that belong elsewhere. Write descriptions as general rules; one tuned to the eval's exact messages scores well and routes real messages badly.
- **Routing lives in two places only:** the skill's line in the list and its description. The body is read after the choice is made, so a "when to use this" section inside it is dead weight.
- **A skill with several flows is a short router:** the main text says which file covers which case and the agent opens only that one. Keep each file one link away from the main text, short (around 100 lines is a good ceiling), with a contents list at the top of anything longer.
- **Leave out what the agent can fetch:** a skill holds what the agent couldn't work out from the live data, the tools and the docs; code samples and copied facts go stale, so point to the source instead.
- **Match the freedom to the risk:** plain guidance where several ways are fine, exact steps or a script where one wrong move breaks something.

## The base prompt

What remains: voice, language, scope, what the agent never does, and the flows nearly every conversation runs. Write each rule once, short, as what to do, with the reason when it isn't obvious: a model that knows why applies the rule to the neighbouring case. Align two rules that contradict rather than tuning both, and never let instructions be cut silently by a size limit: fail loudly or test the size.

## Changing the prompt

1. **Start from an observed failure:** real replies that went wrong, named as a failure (wrong format, an ignored rule, an invented fact). What could go wrong is not a reason to add a rule.
2. **Find where the prompt causes it:** a missing, vague or contradicting instruction.
3. **Fix the class, not the example:** write the rule at the level of the mistake, in your own words, never the failing message itself. If the general rule doesn't work, say so; narrowing it until it fits one case is overfitting.
4. **Keep what works:** before changing a sentence, name the behaviour it protects, and rerun the cases that depend on it.
5. **One cause per attempt,** each saved as its own version, so a result can be traced and rolled back. No added emphasis or capitals as a fix.

**Write for the model that will read it.** Instructions accumulate for the weaknesses of older models and then hold back newer ones: step-by-step recipes where the model now plans well, "always run the tests" where it already does, and hard "never without asking" language that makes a careful model stop early. When the model changes, reread every instruction: keep boundaries that protect something real, give explicit permission for work you know is safe ("these tests use throwaway data: run them and fix what fails without asking"), and state what done means, so the model neither stops at a first draft nor runs past the goal. Check the model's own prompting guide: newer reasoning models want goals over micromanaged steps and less shouted emphasis. A prompt that serves several model families is tested on each.
