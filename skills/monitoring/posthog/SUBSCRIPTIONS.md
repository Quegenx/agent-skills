# Subscriptions

Subscriptions deliver insight snapshots, dashboard snapshots or AI prompt reports to email, Slack or Microsoft Teams on a fixed schedule. There is no generic webhook destination. Most outcomes come down to the kind (`insight`, `dashboard` or `ai_prompt`), the create-time gates and scopes, and whether an update or `send_test_now` sends a delivery the user never approved.

**Contents:** [Pick the product](#pick-the-product) · [Kinds](#kinds) · [Create a prompt subscription](#create-a-prompt-subscription) · [Scopes and limits](#scopes-and-limits) · [Schedule](#schedule) · [AI credits](#ai-credits) · [Deliveries that send right away](#deliveries-that-send-right-away) · [Manage](#manage) · [Destinations](#destinations) · [Failures and ownership](#failures-and-ownership) · [Tools](#tools) · [Prove it](#prove-it)

## Pick the product

A subscription is fixed delivery; a product alert is a condition or threshold; a reminder is a private prompt to inspect later; a Signals scout lets an agent decide what to report. Subscriptions don't evaluate thresholds, recovery, consecutive breaches or quiet hours, and snapshot subscriptions attempt every occurrence even when nothing changed.

## Kinds

Set exactly one of `insight`, `dashboard` or `prompt`; combining them is rejected. There is no `resource_type` argument to send: it is derived from the populated field, read-only and immutable, so a PATCH can't flip an insight or dashboard subscription into a prompt one (or back). Pick the kind at create time, and create a new subscription for a different kind. All three deliver to email, Slack and Teams.

| `resource_type` | Source | AI | Options |
|---|---|---|---|
| `insight` | One saved insight (numeric id; `insight-get` resolves a short id or URL), in the current project, viewable by the caller | Optional summary | No tile selection; no `dashboard_export_insights` or `ai_prompt_config` |
| `dashboard` | Numeric `dashboard` id (read tiles with `dashboard-get`) plus `dashboard_export_insights`, 1 to 10 tile insight ids | Optional summary | Tile selection, Slack image layout |
| `ai_prompt` | Nonempty `prompt`, up to 4000 characters, with no `insight` or `dashboard`; an LLM plans and runs HogQL over the project's data and writes a fresh markdown report each tick | Billable model calls | Analysis window, display options |

- **Prefer a dashboard or insight subscription with `summary_enabled: true`** over a prompt. The prompt kind is the heaviest, and the LLM composes its own HogQL, so its numbers can drift from what a saved insight or dashboard shows. Reach for a prompt only when the user specifically asks for a free-text, AI-written report, or no existing insight or dashboard covers the ask and the value is the analysis itself. A request to "set up a scout/bot to post this daily" from an existing dashboard is usually a dashboard subscription with a summary. Respect a user who's sure; when it's ambiguous, suggest the snapshot and confirm.
- **Dashboard tiles:** ask the user which tiles (don't pick the first ones). Each must be in the project, not deleted, on the dashboard, and viewable by the user. Stored ids don't auto-replace after dashboard edits; update `dashboard_export_insights`. Before a dashboard owner removes, replaces or deletes tiles, list its subscriptions. Deleted tiles are excluded, and an empty effective selection can produce a delivery with no useful snapshot. Hard-deleting the source insight or dashboard deletes the subscription and its delivery history; use pause or soft deletion to preserve history.
- **AI summary on a snapshot:** ask for approval before enabling it. `summary_enabled: true`, `summary_prompt_guide` (optional) up to 500 characters; not for prompt reports. A summary can contain an incorrect number; the snapshot is the source of truth.
- **AI prompt planner:** the first successful delivery freezes the query plan; changing the prompt clears it; enabling chart images clears a plan frozen without images.
- **`ai_prompt_config.window.mode`:** `since_last_sent` (data since the last successful scheduled delivery), `last_n_days` (`start_days_ago` 1 to 365), `days_ago_range` (`end_days_ago` 0 to 365, less than `start_days_ago`). Manual and test deliveries don't move the `since_last_sent` anchor.
- **Prompt display options in `delivery_config`** (each defaults to `true`): `include_images` (generated chart images), `include_feedback` (report feedback links), `include_manage_link` (a subscription management link), `include_posthog_hint` (PostHog guidance; Slack only, not email or Teams).

## Create a prompt subscription

```yaml
prompt: "..."                         # ≤4000 chars; setting this (with no insight/dashboard) makes it a prompt sub → resource_type "ai_prompt"
target_type: "email" | "slack" | "teams"  # the only delivery channels the API accepts
target_value: "..."                   # comma-separated emails, "<channel_id>|<channel_name>", or a Microsoft Teams webhook URL
frequency: "daily" | "weekly" | "monthly" | "yearly"
interval: 1                            # 1 = every tick; 2 = every other tick; etc.
start_date: "2026-09-15T09:30:00Z"   # anchors the recurrence + time-of-day; hour and half-hour slots are supported; need not be in the future
title: "..."                          # display name in the subscriptions list
send_test_now: false                   # set true only after the user approves an immediate delivery
```

Optional arguments:

```yaml
byweekday: ['monday', 'wednesday'] # weekly only, days the rrule fires
bysetpos: 1 # most useful with monthly; requires byweekday, e.g. byweekday:['monday']+bysetpos:-1 = last Monday
count: 10 # limit scheduled recurrence occurrences; manual and immediate deliveries do not count
until_date: '2026-12-31T00:00:00Z' # stop on/before this date
integration_id: 42 # Slack only, required; from integrations-list (see "Slack target")
```

```yaml
prompt: 'Top events week over week, with the biggest drops and any new failure modes called out.'
target_type: email
target_value: founders@acme.example
frequency: weekly
interval: 1
byweekday: ['monday']
start_date: '2026-09-14T08:00:00Z'
title: 'Weekly product pulse'
send_test_now: false
```

```yaml
prompt: "Yesterday's sign-ups, where they came from, and any errors they hit during onboarding."
target_type: slack
target_value: 'C0123456789|growth-updates' # <channel_id>|<channel_name>; only the channel id is used, the name is cosmetic
integration_id: 42
frequency: daily
interval: 1
start_date: '2026-09-15T09:00:00Z'
title: 'Daily onboarding watch'
send_test_now: false
```

- **`byweekday`, sources disagree:** the AI subscription guide says weekly only; the operations reference says daily or weekly.
- **Create-time gates (400 if any fail):** PostHog Cloud, or development mode (`DEBUG=true`; self-hosted production is ineligible, since the LLM runs on a PostHog-managed key); the org has "AI data processing approved" (`Org settings → Data → AI data processing`; the user must opt in to AI features for the organization first); `subscription:write` and `query:read`; viewer access to the query resource. **The third gate, sources disagree:** the AI subscription guide says prompt subscriptions must be enabled for the organization through a PostHog-managed rollout flag with no self-serve toggle; the operations reference says AI subscriptions must be enabled for the current user. If a gate is missing, stop and tell the user which one to fix; re-calling won't help. For the rollout flag, the user reaches out to PostHog.
- **After it lands,** confirm `resource_type: "ai_prompt"`, `enabled: true`, a future `next_delivery_date`, and that `prompt` matches. The first scheduled tick runs the planner, HogQL and synthesis pipeline and delivers the rendered markdown.

## Scopes and limits

- **Scopes:** read needs `subscription:read`; write needs `subscription:write`. AI prompt writes (create, edit or re-enable, test-deliver, delete) also need `query:read`; a token with only `subscription:write` gets 403. Insight and dashboard subscriptions need viewer access to their saved resources.
- **Free plan:** five non-deleted subscriptions per project, across all types. A paid plan can set a different numeric limit or none. A paused subscription still uses a slot; deleting one frees it. If the limit blocks creation, delete an unused subscription or change the plan.

## Schedule

- **`interval` is at least 1.** Use `bysetpos` with `byweekday` for a monthly position.
- **Deliveries run on half-hour cycles at `:00` and `:30`;** other minutes move to the next cycle.
- **`start_date` can be in the past.** It anchors the recurrence, and past occurrences count toward `count`. Create-time, manual and target-change deliveries don't count toward `count`.
- **The next delivery must be more than about 15 minutes ahead:** the first delivery fires at the first `start_date` occurrence at least that buffer in the future, so a `start_date` only seconds ahead rolls to the next occurrence.
- **`next_delivery_date` is server-computed and read-only;** always check it after create or a schedule update.

## AI credits

- **Prompt reports make billable model calls;** the planner may use several (select events, create queries, repair queries, write the report). Credits don't block creation; they are checked before generation. When exhausted, the report is skipped, the subscription stays enabled, the next delivery moves past the credit reset, and the creator may be notified once per period. Investigate `ai_credits_used_in_period` with `understanding-billing-usage`.
- **Snapshot AI summaries also use credits.** They need org approval, credits and an active-summary slot (org-wide, plan-dependent). A paused subscription with `summary_enabled: true` still uses a slot; disable its summary or delete the subscription to free it. Out of credits, the summary is skipped and the snapshot still sent.

## Deliveries that send right away

- **`send_test_now` defaults to `true` on creation.** Set it to `false` unless the user approves an immediate delivery.
- **Updates that can send immediately:** a recipient or destination change, a source insight, dashboard, tile or prompt change, a prompt display option change, a Slack image layout change, and resume. The MCP update tool cannot set `send_test_now`, so ask first; if not approved, don't update. Schedule-only and title-only updates don't send.
- **Test delivery:** ask for approval unless the user already requested a test; it sends a real message through the same pipeline as a scheduled delivery and creates a delivery record. List the current delivery IDs first. `202` means queued; `409` means disabled or another test is active. Team limit: 10 test deliveries a minute. It doesn't change the schedule. Poll for a new manual delivery ID, wait between polls, and stop after two minutes; if it hasn't reached a final state, report the last state and suggest another check later.
- **Delivery history:** cursor pagination, 50 rows a page, newest first. Trigger types: scheduled, manual, target change. States: `starting`, `completed`, `failed`, `skipped`; filter the list by `status` when investigating a failure. Each record carries scheduled, created, updated and finished times, the safe destination snapshot, per-recipient status, exported asset IDs, and AI summary or report fields. The list omits large report content and sensitive error payloads; the retrieve tool returns one AI prompt report and its prompt snapshot. MCP hides per-recipient results, errors and query diagnostics, and AI report history hides query-derived content from callers without query access. Don't infer a failure cause from status alone.
- **A completed delivery can contain partial recipient failures.** Don't claim each recipient succeeded.
- **Four-stage proof:** accepted, queued, terminal, and the user confirms receipt. Don't claim success after stage 1 or 2.

## Manage

- **Creation is not idempotent;** a blind retry can create a duplicate and send a duplicate immediate delivery. List first (`search` matches the title, prompt text, insight or dashboard name), before creating and before retrying after a timeout, and compare the resource, destination, target, schedule and enabled state. List filters: `resource_type`, `target_type`, `insight`/`insights`, `dashboard`, `dashboard_tiles`, `created_by`.
- **Teams duplicates:** results show only the webhook host, and one host serves many channels, so don't use it to identify a duplicate. Show the title, schedule, creator and creation date of possible matches and let the user pick; create a new subscription when no field identifies the channel.
- **Don't infer recipients, channels, times or time zones.** Ask.
- **Confirm the saved result:** `resource_type`, `target_type` and the safe target label, `enabled: true`, `next_delivery_date` matching the schedule and time zone, and the AI and delivery options as chosen.
- **Change:** `subscriptions-retrieve` first; list delivery IDs before an update that can send; `enabled: false` pauses, `true` resumes. Send the complete new target, and send `target_type` and `target_value` together. To replace a Teams URL, send the full new one; when changing away from Teams, send the new destination in the same update. After a sending update, poll for the new `target_change` delivery, read it until a final state, then retrieve the subscription and check its final `enabled`. A subscription whose `count` or `until_date` is exhausted has no next delivery and can't resume until the end condition is extended or removed. Pause when the user might resume later.
- **Delete:** confirm the subscription ID and safe destination label, and ask unless the user already requested deletion. `subscriptions-delete` is a one-way soft delete through MCP that stops future deliveries and frees a plan slot; create a new one if needed again.
- **Report back:** resource type, destination type, schedule, next delivery date, enabled, AI credit use. Don't repeat email addresses unless the user needs them for confirmation, and never repeat a Teams webhook URL.

## Destinations

- **Email:** comma-separated addresses. The unsubscribe token expires after 30 days. One recipient unsubscribing removes their address from `target_value`; when the last one unsubscribes, the subscription is soft-deleted. Delivery succeeds if at least one recipient succeeds; the MCP tools don't return per-recipient results, so ask the user to confirm receipt when every address matters.
- **Slack:** `integrations-list` (`kind: slack`), then `integrations-channels-retrieve`, then set `integration_id` and `target_value` as `<channel_id>|<channel_name>`. The integration must belong to the current project; the channel ID is what delivery uses. Pinning to one integration keeps reconnections elsewhere from re-routing deliveries. For dashboards, `delivery_config.post_all_insights_in_main_message` defaults to `false` (first image in the main message, the rest in a thread); `true` sends all images in the main message and needs the Slack `files:write` permission. It doesn't apply to email or Teams.
- **Teams:** the user adds the Workflows app to the channel and selects the workflow that posts to a channel after a webhook request. Set `target_type: teams`, `target_value` to the full HTTPS webhook URL, and omit `integration_id`. The URL must be `https`. A URL from the wrong workflow saves but fails; if `subscriptions-create` rejects `target_value`, it isn't a Teams webhook, so ask the user to create it again and paste the whole URL. The URL is a credential: anyone with it can post in the channel, so pass it only as `target_value` and never repeat it in a response, confirmation, error, log or summary. The API returns only its host and rejects that masked value on update, so omit `target_value` to keep it; the host can't identify duplicates.
- **Setup failures:** Slack not connected: Project settings > Integrations. Slack can't post: check channel access and the integration state. Can't upload files: reconnect with `files:write`. Teams rejects delivery: the user creates a new URL with the correct workflow. A request for a generic webhook: offer email, Slack or Teams.
- **Acceptance doesn't prove delivery.** After setting up or replacing a destination, send an approved test and check its delivery record. Fix a destination before resuming a subscription it auto-disabled.

## Failures and ownership

- **Transient failures** (network, email service, Slack rate limit, an SMTP blip) retry within the run (Temporal), don't disable the subscription, and re-fire on the next tick, so a persistently failing channel keeps retrying every tick until fixed.
- **Permanent failures auto-disable it:** Slack disconnected, channel or file permissions revoked, Teams no longer accepting the webhook, an invalid prompt or original creator, revoked AI data-processing consent. A multi-recipient email fails only when every recipient fails. Rendered markdown is cached within a run, so Temporal retries don't re-run the LLM pipeline; each tick generates a fresh report. The creator is notified in-app and by email.
- **Re-enabling an auto-disabled prompt subscription** needs a valid `prompt` (stored or in the PATCH; bare `{"enabled": true}` works when the stored prompt is still valid) and the original creator still active; otherwise re-create it under an active user. Fix any permanent cause before resuming. A PATCH adding `prompt` to an insight subscription is rejected.
- **Ownership:** the creator gets failure notifications only while an active member. AI prompt subscriptions require the original creator; insight and dashboard subscriptions continue without one, but nobody gets failure notices. Review ownership when an owner leaves the organization.

## Tools

`posthog:subscriptions-list`, `posthog:subscriptions-retrieve`, `posthog:subscriptions-create`, `posthog:subscriptions-partial-update`, `posthog:subscriptions-test-delivery-create`, `posthog:subscriptions-deliveries-list`, `posthog:subscriptions-deliveries-retrieve`, `posthog:subscriptions-delete`, `posthog:integrations-list`, `posthog:integrations-channels-retrieve`, `posthog:dashboard-get`, `posthog:insight-get`.

## Prove it

- **No surprise sends:** `send_test_now` was `false` on create unless the user approved, and every update that can send was approved first.
- **No duplicate:** `subscriptions-list` with `search` showed no match before create, and again before any retry after a timeout.
- **It is scheduled:** after create or a schedule update, `next_delivery_date` is in the future, `enabled: true`, and `resource_type` is the one intended (`ai_prompt` for a prompt, with `prompt` matching).
- **It delivered:** a delivery in `subscriptions-deliveries-list` reached a terminal state (`completed`), and the user confirmed receipt. Accepted or queued is not proof.
- **The token works:** AI prompt writes ran with both `subscription:write` and `query:read`.
- **Slack and Teams are wired:** the Slack `integration_id` belongs to the current project and `target_value` is `<channel_id>|<channel_name>`; a Teams URL came from the workflow that posts after a webhook request and was never echoed back.
