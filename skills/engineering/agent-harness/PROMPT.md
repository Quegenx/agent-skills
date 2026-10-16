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
- The measured cost of getting this wrong: one per-turn policy line inside the prompt can drop the cached share from most of the request to almost nothing.

## Reminders code adds

A situational rule arrives only in its situation, as a short message code appends to the turn ("her way in needs a call: keep the order open, no payment link yet"). Code detects the situation from facts (a delivery report arrived, the order is missing a field), so the reminder can't be forgotten and the base prompt stays short. Reminders that keep firing on every turn belong in the prompt instead.

## Skills

- **The list is a message, with a budget:** a small share of the context window (one or two percent) and a cap per description (a few hundred characters). The model reads the descriptions and loads the full text itself. Don't route skill choice through a classifier unless you have measured it in shadow mode first.
- **Code decides what is visible:** a skill tied to certain files appears once such a file is touched; a skill the model must never choose is hidden; integrations the user hasn't connected stay out of the list.
- **A description is a classifier:** say when it applies, with the signal that marks it ("only after she says it is a gift"). Say when not to use it. Never put an example that looks like the common case into a rare skill's description: one count-and-street example made plain orders load the gift flow one time in three. Tell the agent not to load a skill "to check whether it applies".
- **Keep a routing eval:** each typical opening message mapped to the skill it must load, or none; rerun it after any description, prompt or gate change.

## The base prompt

What remains: voice, language, scope, what the agent never does, and the flows nearly every conversation runs. Write each rule once, short, as what to do. Align two rules that contradict rather than tuning both, and never let instructions be cut silently by a size limit: fail loudly or test the size.
