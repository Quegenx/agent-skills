# Writing a skill

Think of skills as lightweight guides that let Claude find information when needed. Claude already knows how to code and can read your codebase, so a skill earns its place with what Claude couldn't know or wouldn't do by default, says when it applies in a description built for the model, and spreads the detail across files Claude opens when it needs them. The Claude Code team found it was overconstraining Claude through its system prompt, CLAUDE.md files and skills, and could delete many constraints once needed to avoid worst cases and let the model use surrounding context and judgement instead.

## What goes in

- **Don't state the obvious.** A skill that restates what Claude would do by default adds context without adding value. A skill that is mainly knowledge should focus on information that pushes Claude out of its normal way of thinking: the [frontend design skill](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md) was built by iterating with customers on Claude's design taste, avoiding classic patterns like the Inter font and purple gradients.
- **Encode what is particular to you:** skills work best when they encode opinions, knowledge or best practices particular to you, your team or product.
- **Not a central repository of every practice:** a common myth is that CLAUDE.md and SKILL.md files must hold every practice you *might* run into, because Claude would not find it otherwise. Instead, have a tree of files that can be loaded at the right time.

## The Gotchas section

- **It is the highest-signal content in any skill.** Build it from the common failure points Claude runs into when using the skill, and update the skill over time to capture new ones: a skill's Gotchas section can grow from one line to four between day 1 and month 3.
- **Write each one as the fact Claude got wrong and the right reading:**
  - "The `subscriptions` table is append-only. The row you want is the one with the highest version, not the most recent `created_at`."
  - "This field is called `@request_id` in the API gateway and `trace_id` in the billing service. They're the same value."
  - "Staging returns 200 even when the Stripe webhook didn't actually process. Check `payment_events` for the real state."
- **Start with one:** most of the Claude Code team's best skills began as a few lines and a single gotcha.

## The description

- **It is a trigger, not a summary.** When Claude Code starts a session it builds a listing of every available skill with its description, and that listing is what Claude scans to decide "is there a skill for this request?". So the description field says when to trigger the skill.
- **Include the trigger words:** compare "A comprehensive tool for monitoring pull request status across the development lifecycle." with "Monitors a PR until it merges. Trigger on 'babysit', 'watch CI', 'make sure this lands'."
- **Tune it against a trigger-rate eval:** the trigger rate is directly coupled to the description, which makes it a good surface to hillclimb; see [MEASURING.md](MEASURING.md).
- **For skills inside your own product's agent,** the listing budget, visibility rules and routing evals are in [agent-harness PROMPT.md](../agent-harness/PROMPT.md#skills).

## The folder and progressive disclosure

- **A skill is a folder, so treat the whole file system as context engineering.** Tell Claude what files are in the skill, and it will read them at appropriate times.
- **SKILL.md is the hub:** for example, a queue-debugging skill whose SKILL.md holds a symptom-to-file table pointing at `stuck-jobs.md`, `dead-letters.md`, `retry-storms.md` and `consumer-lag.md`: if a job is pending, Claude reads `stuck-jobs.md`.
- **The simplest form is pointing to other markdown files:** split detailed function signatures and usage examples into `references/api.md`. If the end output is a markdown file, include a template for it in `assets/` to copy and use. Folders of references, scripts and examples all help.
- **Split long skills:** for long skills use progressive disclosure as much as possible: divide them into many files.
- **Nesting:** Claude reads skill files that reference other files recursively, and has grown to nested search across several layers of files to find the exact context it needs. The [agent-harness](../agent-harness/PROMPT.md#skills) skill keeps each file one link from the main text instead; both ways are in use.

## Goals over steps

- **Avoid railroading Claude.** Claude generally sticks to your instructions, and because skills are so reusable, overly specific instructions hurt. Give Claude the information it needs and the flexibility to adapt to the situation.
- **State the goal and the constraints, not every step:** instead of six numbered steps spelling out each git command, write "Cherry-pick the commit onto a clean branch. Resolve conflicts preserving intent. If it can't land cleanly, explain why."
- **Constrain hard only where it matters:** avoid making skills overconstrained, except in highly important areas.
- **Design the interface instead of piling on examples:** with the newest models, giving examples constrains them to a certain exploration space. Think about the design of your tools, scripts and files: what parameters Claude has and how they can be more expressive. A status enum of `pending`, `in_progress` and `completed` hints at how to use a task list; one rule (only one task `in_progress` at a time) defines the requested behaviour.
- **Watch for clashes across layers:** one request can carry conflicting messages from the system prompt ("leave documentation as appropriate"), a skill ("DO NOT add comments") and the user ("just make it work like the old one"). Claude can usually interpret the intent, but must think more carefully before deciding what to do.

## Steering away from what Claude remembers

- **When the content is there but Claude writes the old form, put a map near the top:** hillclimbing the claude-api skill found the content present while Claude wrote older API shapes from its trained priors; a table near the top of the skill guiding Claude from the forms it remembered to the current ones, and moving warnings above the examples they apply to, raised the pass rate from 77% to 80%.
- **Fix repeated misses at the source:** when an automated reviewer keeps flagging the same thing, fix it in the skill, with a lint rule, or in instruction files; when a review misses something, ask what the model didn't have in front of it and put the fix into a CLAUDE.md, a skill or a new check.

## Simplifying

- **Rightsize existing skills:** `claude doctor` (`/doctor` in Claude Code) carries these practices and helps rightsize skills and CLAUDE.md files.
- **Audit for instructions written for an older model:** they can make a newer model write more and repeat tool calls; `/claude-api prompt-audit` checks a Claude Code setup, such as its skills and CLAUDE.md file, for these prompting anti-patterns.

## Prove it

The description says when to trigger and names the user's own words; the Gotchas section exists and each entry names the wrong reading and the right one; SKILL.md lists every file with the case that sends Claude to it; no instruction restates default behaviour; numbered step lists appear only in high-risk spots.
