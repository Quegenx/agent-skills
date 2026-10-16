---
name: agent-chat-ui
description: "Designs and builds the chat interface of an AI agent: showing its work while it runs, streaming text that reads smoothly, approval and question cards, results as the product's own components, follow-ups, the composer with files, voice and a queue, and the conversation list. Use when building or polishing an agent's chat UI."
---

# Agent chat UI

An agent's answer is not a message; it is work happening. The interface has three jobs: show what the agent is doing right now in one calm line, leave a readable record of what it did, and put every decision that is the user's (approve, revise, pick, add) in their hands with the exact consequence in view. Everything else is the polish that makes waiting feel short.

| The job | Read |
|---|---|
| The answer while it runs and after: the status line, work rows, the folded log, sources, plan, approval cards, questions, follow-ups, errors and retries | [WORK.md](WORK.md) |
| Text that streams smoothly, safe markdown, links and source chips, direction, scrolling and the space under the latest exchange | [STREAMING.md](STREAMING.md) |
| Tool results as the product's own components, live data, caps, the conversation list, title, menu, search and side panel | [RESULTS-AND-CONVERSATIONS.md](RESULTS-AND-CONVERSATIONS.md) |
| The composer: the empty state, cycling placeholder, suggestions, files, dictation with a live waveform, the queue of messages sent while the agent works | [COMPOSER.md](COMPOSER.md) |
| Every timing, curve and size in one table | [MOTION.md](MOTION.md) |
| The server side the UI depends on (stop hooks, approvals, follow-up call, data parts) | the `agent-harness` skill |
| General animation rules (durations, springs, reduced motion) | the `ui-animation` skill |
| The rest of the app's components (menus, dialogs, tables, states) | the `app-ui` skill |
| Marketing pages and their motion | the `landing-page-ui` skill |
| The production source of every piece above, to copy as is | [reference/REFERENCE.md](reference/REFERENCE.md) |

To build it exactly, copy from reference/ rather than writing it from the description.

## The rules

1. **One live line, not a log in motion.** While the agent works, a single status line under the answer names the current step; it stays mounted and morphs from step to step. Finished steps become quiet rows; when the answer ends they fold into one line ("worked for 12 seconds").
2. **Never show the model's raw thinking.** Reasoning summaries come in the wrong language, are often empty and quote the instructions. Show the step it is on instead.
3. **Every tool has a title and an icon** in a table typed against the tool list, so a new tool fails the type check until it has both and a known tool never shows its raw name. A name outside the table (one that only exists at runtime) shows as itself. Plumbing (the agent finding its own tools) shows nowhere.
4. **An approval card shows what will really happen,** built from the call's actual input and the records it names, never from the agent's prose about it. Confirm, revise and deny; no "always allow". A question with options is a card of the same kind, its options numbered rows inside it.
5. **Results are the product's own components,** read live: a task the agent created is the real task card, and changing its status in the chat changes the task.
6. **Pace the stream.** Tokens arrive in bursts; release characters at a steady, adaptive rate and fade them in, so the text flows instead of jumping.
7. **Treat everything the agent quotes as untrusted.** Links and images are hardened; an outside link opens only after its full address is shown.
8. **Nothing moves under the reader.** No blank frame before the answer, no scroll jump when the status line gives way to text, no layout shift from a late image.
9. **Respect reduced motion everywhere:** Motion components keep their fades and drop the movement (its `reducedMotion="user"` still runs opacity and blur); every CSS transition and animation is dropped, pure fades too, so those things appear at once; the text buffer, the shimmer and the waveform stop. Where code waits for an end event, use a near-instant 1ms instead of none so it still fires.
10. **Right-to-left is a first-class case:** logical properties, per-block direction from the first letter, `bdi` around anything a user or a site wrote, chevron and arrow icons mirrored. The shimmer band, the waveform and the image viewer's arrow keys keep one physical direction in both.

## Prove it

Send a message and watch: a dot appears at once, morphs into "thinking" and then each step, with no blank frame and no jump. Interrupt with a second message while it works; it waits as queued and goes when the answer ends. Ask for something that needs approval; the card names the exact target and text, Escape denies, and revise sends a note the agent acts on. Paste a long answer with a link to an outside site; it streams at an even pace, the link becomes a chip, and opening it asks first. Turn on reduced motion and repeat.
