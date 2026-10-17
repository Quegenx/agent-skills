# Scheduled agents

An agent that runs on a schedule, gathers context in the background and tells someone what they need to know is hard to get right: it can lose access to a source without anyone noticing, or fail to follow the reader's preferences. The example throughout is a daily brief that reads chat channels and pull requests and posts one dated message; it can be extended to other sources. Waking the agent only when there is work is in the `jev-decisions` skill; cron, workers and durable steps in the `background-jobs` skill.

## The parts

- **Sources:** a named list of places to read, kept in the reader's preferences.
- **One destination** it may write to.
- **The agent:** model, tools and numbered run steps.
- **A schedule:** cron, with a time zone.
- **Memory:** the reader's preferences and the agent's own state.
- **Guardrails:** read-only access wherever the agent only reads, a spending cap per run, caps on turns and time, and a heartbeat someone watches.

## Reading the sources

- **Read from a bookmark, not a fixed window.** "The last 24 hours" leaves a gap after a late run and repeats items after an early one. At the end of each run, write the timestamp of the newest item read from each source to one file, `bookmarks.json`, one entry per source (`"slack": "2026-09-14T13:02:11Z"`); the next run starts there, so its window stretches or shrinks to cover everything since the last run. In Claude Managed Agents the bookmarks live in the `state` memory store: a folder of text files mounted into every run's sandbox under `/mnt/memory/` and kept between runs, which the agent reads and writes with its ordinary file tools, as its instructions say.
- **A failed read is not a quiet day.** When an MCP server is down or its token expired, the run still starts, just without that server's tools; the session logs an error, but the agent sees nothing from that source and reports "nothing new". When a source fails: keep its bookmark where it is, write from the other sources, and end with one line naming what couldn't be read ("pull requests unavailable this run").

## Deciding and checking

- **Keep the output short,** with the bar written as a run step:

```text
4. Decide. An item earns a line when the reader would act on it today, or it changes a decision they are about to make. When unsure, leave it out. Most days that is a few items, sometimes none. A count ("12 open reviews") is not an item; link the ones that are blocked. An item already in the ledger and still open is carried as one marked line ("still waiting, day 3"), not re-reported; a closed item is dropped without comment. Do not bring back a topic the preferences file has retired.
```

- **Re-check anything still open right before posting:** items change between the read and the post.

```text
5. Verify. The world moved while you read. For every item you will report, re-check its live source just before posting: resolved since you read it, drop it; still open but changed, fix the line; cannot confirm, drop it and list it in the run record's cuts. One stale "still waiting on you" costs more trust than ten missing items, so never hedge an item's status: assert it or drop it. Every link is copied from the source's own link field (a pull request's html_url, a Slack permalink), never assembled by hand.
```

- **Compute dates in the reader's time zone.** A common bug is the agent calling this morning "yesterday" because it computes dates in the server's zone. Set the schedule's time zone, and tell the agent in the run's first message which zone to use for every date.

## Posting once

If the records don't match what was posted, a post recorded but never landed moves the bookmarks past items that are never reported, and a post sent again "to be sure" reaches readers twice.

- **Look before posting:** search the destination's recent messages for today's title; don't post if the edition is already there.
- **A post counts as sent only on the destination's confirmation** (for Slack, `"ok": true` and a message ts).
- **Update the ledger and bookmarks only after that confirmation.** If the result is unclear, mark the run "maybe posted" and change nothing else, so nothing is lost.
- **A run record per run** (`runs/<date>.md`): "posting" before the post, then "posted" with the message id, or "maybe posted".

## Memory between runs

Each run starts fresh, with no memory of the last one. Without memory, feedback doesn't stick; with stale memory, the agent reports an item as still waiting after it was resolved, or drops one still open because it was "already reported".

- **Two stores.** **Preferences** belong to the reader and are read-only to the agent: which channels and repos to read, what to leave out, the length cap, the destination, when to stop. **State** belongs to the agent, read-write: the bookmarks, a ledger of what it reported, one record per run, changes it proposes to the preferences (it proposes, never edits) and notes on how each source behaves ("returns only the newest 50 items").
- **Re-read the preferences at the start of every run.** A copy baked into the prompt keeps applying rules the reader already changed. If the file can't be read, stop and say so instead of running on defaults.
- **Keep a ledger** of every item reported, so the output doesn't repeat itself: when it was reported, where from, an id that doesn't change (a message timestamp, a pull request number) and its last known status, then report the change:

```text
2026-09-09 slack:C0123456789 1788963600.000100 refund thread: customer waiting on a decision
2026-09-11 github 481 review blocked, day 2 (still waiting)
2026-09-11 slack:C0234567891 1789117333.000300 enterprise escalation: owner named, in progress
```

## Guardrails

- **Unattended means nobody approves.** MCP tools ask for approval by default and nobody is there to give it, so the MCP toolset is set to always allow and its token is read-only. The built-in bash tool runs without approval by default; the post goes out through it with the same bot token the agent reads with, to a host on the environment's allowlist. Tools the run doesn't need (web search, web fetch) are switched off in the agent's configuration.
- **Limit what a planted instruction could do.** The agent reads text other people wrote, which can act as instructions. With read-only source tokens, a read-only preferences store and a network allowlist, a planted instruction can still change what the output says, including through the notes the agent keeps between runs, but it can't write to the sources or edit the reader's rules. A token that also posts is the exception: give that bot access only where it must read or post.
- **The sandbox never holds the secret.** Credentials live in a vault outside the sandbox where the agent's code runs: MCP calls go through a proxy outside it that matches the credential by server URL, and a shell call sees only a placeholder (`$SLACK_BOT_TOKEN`) that is swapped for the real token as the request leaves, for allowed hosts only. In Claude Managed Agents:

```typescript
const vaultId = process.env.VAULT_ID!; // the vault's ID, from claude-lock.json

await client.beta.vaults.credentials.create(vaultId, {
  display_name: "SLACK_BOT_TOKEN",
  auth: {
    type: "environment_variable",
    secret_name: "SLACK_BOT_TOKEN",
    secret_value: process.env.SLACK_BOT_TOKEN!,
    networking: { type: "limited", allowed_hosts: ["slack.com"] },
    injection_location: { header: true },
  },
});
```

- **Set the spending cap from real runs.** Start at three to five times the cost of a normal run, then tighten as real numbers come in. Every run gets the full amount; a run that hits the cap pauses instead of failing, so a cap set too low looks like an output that went quiet.

## Example: a scheduled deployment

In Claude Managed Agents the agent is a versioned configuration (model, system prompt, tools); a deployment runs it, naming the agent, the environment and each run's first message, and holding the schedule, the vault, the memory stores and the budget. Each fire starts a fresh session. The agent, environment, memory stores, vault and deployment are files; `ant apply` creates them in the Claude API workspace and records their IDs in `claude-lock.json`, so the run happens on Anthropic's infrastructure with nothing left running locally.

```markdown
---
name: Daily brief
agent: ./agent.md
environment_id: ./environment.yaml
schedule:
  type: cron
  expression: "32 7 * * 1-5"
  timezone: America/New_York
vault_ids: [vlt_...]   # the vault you create under Sources
resources:
  - path: ./memory_store_preferences.yaml
    access: read_only
    instructions: The reader's preferences. Re-read them every run. Never write here.
  - path: ./memory_store_state.yaml
    access: read_write
    instructions: Your state. Bookmarks, ledger, notes, proposals, and run records.

---

Write today's brief.
The reader's time zone is America/New_York. Work out every date in that zone.

Follow your run steps in order. Today's edition is titled "Daily brief, <weekday> <month> <day>".
```

```yaml
budget:
  type: limit
  max_list_cost:
    amount: "500" # a string, in cents: "500" is $5.00
    currency: USD
```

A run that reaches the budget pauses with a `budget_reached` stop reason. Start a run by hand to test without waiting for the schedule (`ant beta:deployments run --deployment-id <id>`). The preferences store is created empty: seed the preferences file before the first run (the reference implementation's `scripts/seed-preferences.sh`). The reference implementation is `anthropics/claude-quickstarts/managed-agents/daily-brief`.

## Prove it

- [ ] Each source is read from a bookmark, not a fixed time window
- [ ] A failed read is reported as unreadable, never as a quiet day, and its bookmark stays put
- [ ] Every item is re-checked right before posting; links come from the source's own link field
- [ ] A post counts as sent only when the destination confirms it, then bookmarks and ledger update; an unclear result is "maybe posted" and changes nothing else
- [ ] Preferences are re-read every run, from a store the agent can't edit; an unreadable file stops the run
- [ ] Dates are worked out in the reader's time zone, set on the schedule and stated in the first message
- [ ] Read-only access wherever the agent only reads, credentials outside the sandbox, a network allowlist
- [ ] A spending cap set from real runs, caps on turns and time, and a heartbeat someone watches
