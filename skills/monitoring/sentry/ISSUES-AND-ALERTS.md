# Issues and Alerts

How events become issues, who owns them, how urgent they are, and when someone gets told. The chain is Monitor → Issue → Alert: a monitor decides when a signal becomes an issue, the issue is triaged (status, priority, assignee, history), and an alert decides what to do when issues match its triggers and filters. Monitors and alerts are independent and many-to-many ("Metric Monitor" is the older "metric alert"). Grouping decides most outcomes upstream: every event has a fingerprint, and the same fingerprint means the same issue, so bad grouping produces noisy alerts, wrong owners and useless counts. The same `key:value` search grammar drives the Issues stream, alert and monitor conditions and the MCP tools; it is at the end of this file.

**Contents:** [Grouping](#grouping) · [Fingerprint rules](#fingerprint-rules) · [Stack trace rules](#stack-trace-rules) · [SDK fingerprinting](#sdk-fingerprinting) · [Ownership rules and code owners](#ownership-rules-and-code-owners) · [Issue priority](#issue-priority) · [Monitors](#monitors) · [Alerts](#alerts) · [Creating alerts through the API](#creating-alerts-through-the-api) · [Search query language](#search-query-language) · [Prove it](#prove-it)

## Grouping

- **Fingerprint order:** fingerprint, stack trace, exception, message. Errors are fingerprinted by `stacktrace`, `exception`, `message`; transactions by `spans`. New grouping algorithm versions apply only to new events; new projects get the latest. See "Event Grouping Information" on Issue Details, and the fingerprint under Issue > JSON > `fingerprint` (shows `"{{ default }}"` for the default).
- **Built-in fingerprinting rules** group chunk load errors and hydration errors ("Sentry Defined Fingerprint"); custom rules take precedence.
- **Stack trace grouping uses only in-app frames** when the SDK reports them, using module name, normalized filename and normalized context line. "Minimized JavaScript source code will destroy the grouping in detrimental ways. To avoid this, ensure that Sentry can access your Source Maps" ([RELEASES-AND-SOURCEMAPS.md](RELEASES-AND-SOURCEMAPS.md)). Decorators that add frames change grouping.
- **Exception grouping** (type plus value) "is a lot less reliable because of changing error messages".
- **AI-enhanced grouping:** a transformer embedding of the message plus in-app frames is compared against the project's embeddings. It only groups new issues, never splits; it is not applied to fully custom fingerprints, but `{{ default }}` portions use it. Unmerge to stop future grouping.
- **Customization, least to most complex:** merge issues, fingerprint rules, stack trace rules, SDK fingerprinting (not supported in WebAssembly). None affect existing issues. Transaction and performance grouping is not customizable.
- **Merging** doesn't infer rules: future events go to the merged set by the original criteria. "Escalating issues currently does not work for merged/unmerged issues".

## Fingerprint rules

Error issues only; set in Project Settings > Issue Grouping. The first matching rule wins; all matchers on a line must match, and frame matchers must match the same frame. Syntax `matcher:expression -> list of values`.

```bash
error.type:DatabaseUnavailable -> system-down
error.type:ConnectionError -> system-down

error.value:"connection error: *" -> connection-error, {{ transaction }}
```

| Matcher | Notes |
|---|---|
| `error.type` / `type` | Case-sensitive |
| `error.value` / `value` | Case-insensitive |
| `level` | |
| `logger` | Case-sensitive |
| `message` | Case-insensitive, also checks the exception value |
| `stack.abs_path` / `path` | `*` doesn't match `/`, `**` does; matches abs_path and filename |
| `stack.function` / `function`, `stack.module` / `module`, `stack.package` / `package` | |
| `tags.tag_name` | |
| `app` | `yes` / `no` |
| `family` | `javascript`, `native`, `other` |

- **Escape** `[ ] { } *` with a backslash. Negate with `!`.
- **Variables:** `{{ default }}`, `{{ error.type }}`, `{{ error.value }}` ("can produce really bad groups when error values are frequently changing"), `{{ level }}`, `{{ logger }}`, `{{ message }}`, `{{ stack.abs_path }}`, `{{ stack.filename }}`, `{{ stack.function }}`, `{{ stack.module }}`, `{{ stack.package }}`, `{{ tags.tag_name }}`, `{{ transaction }}`.
- **Custom title:** `logger:my.package.* level:error -> error-logger, {{ logger }} title="Error from Logger {{ logger }}"`.
- **Subdivide an existing group:** `stack.function:"query_database" -> {{ default }}, {{ transaction }}`.

## Stack trace rules

Formerly grouping enhancements; per project under Issue Grouping. Applied top to bottom across all frames. Also applied to profiles, with matchers `stack.abs_path`, `stack.module`, `stack.function`, `stack.package` and actions `+app` / `-app`. Syntax `matcher-name:expression ... action1 action2`.

- **Flags:** `+` / `-`, `^` (frames above, toward the crash), `v` (frames below), applied to `app` and `group`. Variable `max-frames` (default `0` = all).
- **Categories:** `system`, `std`, `ui`, `driver`, `telemetry`. Sibling matching: `[ category:telemetry ] | app:yes -group`.
- **Mark in-app frames server-side for JavaScript;** to mark others not-in-app, first set `app:no +app`.

```bash
# mark all code in node modules not to be in app
stack.abs_path:**/node_modules/**         -app

# remove all generated javascript code from all grouping
stack.abs_path:**/generated/**.js         -group
```

## SDK fingerprinting

The fingerprint is an array of strings of unrestricted length.

```javascript
function makeRequest(method, path, options) {
  return fetch(method, path, options).catch(function (err) {
    Sentry.withScope(function (scope) {
      // group errors together based on their request and response
      scope.setFingerprint([method, path, String(err.statusCode)]);
      Sentry.captureException(err);
    });
  });
}
```

- **Greater granularity:** in `beforeSend`, `event.fingerprint = ["{{ default }}", String(exception.functionName), String(exception.errorCode)]` for a custom `MyRPCError`.
- **More aggressive grouping:** omit `{{ default }}`, e.g. `event.fingerprint = ["database-connection-error"]` for `DatabaseConnectionError`.

## Ownership rules and code owners

Error issues only. Two mechanisms: **ownership rules** (per project; match file paths, URLs, modules, event tags) and **code owners** (import CODEOWNERS; Business or Enterprise plan; requires code mappings from stack trace linking). Ownership rules take precedence over code owners. Once an issue is assigned (manually or automatically), future auto-assignment is off for it. Monitor-set assignees are overridden by ownership rules.

- **Syntax `type:pattern owners`.** Types: `path` (`src/javascript/*.[tj]sx`), `module` (`com.example.app`), `url` (`https://www.example.io/v/[0-9]/checkout`), `tags.TAG_NAME` (`tags.browser:Chrome 81.0.?`). Patterns are glob: "This is not regex." Owners are user emails or `#team` names, space-separated:

```text
# Single owner
path:src/backend/*                  example@company.com

# Multiple owners
path:src/auth/*                     example1@company.com example2@company.com

# Team owner
path:src/api/*                      #backend-team
```

- **Teams must have access to the project** (unless Open Membership); rules fail to save if a referenced team or user lacks access.
- **CODEOWNERS:** GitHub syntax is supported, including exclusion rules; GitLab-only syntax (sections, `!` negations) is not. Map external teams and users under Settings > Integrations > Configuration > Team Mappings / User Mappings; rules with unmapped teams or users are silently ignored. Max size 3MB; synced periodically. Azure DevOps, Bitbucket and Bitbucket Server: use Sentry user emails.
- **Evaluation:** an event matches if ANY in-app frame matches; frame order does not matter. Code owners are evaluated top to bottom, then ownership rules top to bottom; the **last matching rule** wins; with multiple owners, the first (leftmost) is assigned.
- **Auto-assignment options:** "Auto-assign to suspect commits" (falls back to ownership rules and code owners), "Auto-assign to issue owner", "Turn off auto-assignment". It can be skipped under rate limits when a project creates too many new issues and is retried on the next event; review grouping if you hit this. Suspect commits are in [RELEASES-AND-SOURCEMAPS.md](RELEASES-AND-SOURCEMAPS.md#commits-and-suspect-commits).
- **Troubleshooting:** use glob, not regex (`*`, not `.*`); `path` patterns must match stack-trace paths; `url` rules need the full URL including `https://`; tags use the format `tags.browser:Chrome*`; unassign to let auto-assignment run again.

## Issue priority

- **Levels:** High (`ERROR`, `FATAL`), Medium (`WARNING`), Low (`DEBUG`, `INFO`); non-error issues are prioritized by actionability.
- **Enhanced priority** (Business or Trial; Python and JavaScript projects) also uses the message, handled or unhandled, and historical actions.
- **Escalation bumps priority automatically,** de-escalation restores it; a manual change disables auto-adjustment. Filter with `issue.priority:medium`.

## Monitors

- **Default monitors per new project:** Issue Stream Monitor and Error Monitor.
- **Custom types:** Metric Monitor (thresholds on errors, spans, logs, releases, Application Metrics), Cron Monitor, Uptime Monitor, Mobile Builds Monitor (app-size thresholds).
- **Settings:** name, project and environment, attributes, priority, auto-resolve, assignee (ownership rules can override), connected Alerts. Create from the Application Metrics Explorer ("Save As" > "Monitor for") or Errors ("Create Monitor"). By default all members can create and edit Monitors.
- **Thresholds:** fixed or percentage change when you know good from bad (crash rate exceeds 1%; transaction volume drops to zero; an issue affects more than 100 enterprise users in a day; key transaction response time exceeds 500 ms). Dynamic (anomaly detection) for seasonal fluctuations and unpredictable growth.
- **Agent coverage:** alert creation is automatable through the workflow engine API (below); uptime monitors end to end through the MCP (`create_uptime_monitor`; "Uptime has no SDK code", so confirm the production URL first); other monitors and dashboards are read-only through the MCP (`find_alert_rules`, `get_alert_rule`, `find_monitors`, `get_monitor_details`, dashboards). The sources disagree: the shared `concepts/monitors.md` reference says that for other monitors and dashboards "there is no create or update path" through the MCP, while the MCP server's catalog lists `create_metric_monitor`, `update_metric_monitor`, `create_alert_rule` and `update_alert_rule`, and its `project-management` skill (off by default) grants creating and modifying monitors and alert rules; see [DEBUGGING-ISSUES.md](DEBUGGING-ISSUES.md#sentry-mcp-server).
- **When to reach for what:** "Tell me in Slack when a new issue shows up" is an Alert (the default error monitor already makes the issues); "alert when error rate / latency / a metric crosses a line" is a Metric Monitor, then an alert; "my nightly job didn't run" is a Cron Monitor; "is my endpoint up?" is an Uptime Monitor.

## Alerts

- **"The main goal is to create Alerts that are valuable and not too noisy."** Use filters to narrow to critical issues; select only the triggers that matter (a Jira ticket for every new issue, Slack only for a given severity); consider triage routing (per-project or per-service channels vs one team channel). Alert on downtime, severe traffic spikes or drops, and error counts over thresholds.
- **Permissions:** alerts are org-level. Owners, Managers, Admins and Team Admins can always create them; Members and Team Contributors can when "Let Members Create and Edit Monitors and Alerts" is on (the default). All-projects alerts are restricted to Owners and Managers.
- **Structure:** sources → triggers → filters → actions. "If an issue exists but no alert fired, a filter is usually why."
- **Source:** all issues in selected projects; specific monitors; or all issues in all projects (includes future projects). The environment filter applies to the `environment` tag (default All Environments).
- **When (triggers, ANY logic, each once):** a new issue is created; an issue escalates; a resolved issue regresses (not by manual unresolve); an issue is resolved; an event or issue activity is captured; Seer reaches a stage (Root cause analysis completed, Planning completed, Coding completed, Pull request created).
- **If (filters, `all` / `any` / `none`):**
  - Frequency and event attribute filters only work with "A new issue is created" and "An event or issue activity is captured".
  - Issue filters: age, assignment, frequency, category (`error`, `feedback`, `outage`, `metric`, `db_query`, `http_client`, `frontend`, `mobile`), type, priority (>= high / medium / low), de-escalation.
  - Frequency filters: "more than" in 5m / 15m / 1h / 1d / 1w / 30d, or "relatively higher than" vs 5m / 15m / 1h / 1d / 1w / 30d ago; Number of events, Number of users affected, Percentage of sessions affected (intervals 5m, 10m, 30m, 1h); sub-filters `[Attribute or Tag] [is / is not] [value]` combined with `and`.
  - Event filters: event attribute (`message`, `platform`, `environment`, `type`, `error.handled`, `error.unhandled`, `error.main_thread`, `exception.type`, `exception.value`, `user.*`, `http.method`, `http.url`, `http.status_code`, `sdk.name`, `stacktrace.*`, `app.in_foreground`, `os.distribution_name`, `os.distribution_version`, ...), tagged event, event level, latest release, release age. Match types: contains, equals, starts with, ends with, their negations, is set, is not set, is one of, is not one of.
- **Then (actions):** notify on the preferred channel (Suggested Assignees = assignees, ownership owners, suspect commit authors; fallback Recently Active Members (default), All Project Members, or No One); Slack (a channel or user ID avoids rate limiting; tags such as `environment,my_tag`; notes); Discord (channel ID or URL, not the name); MS Teams; PagerDuty (severity); Opsgenie (priority); an integration or webhook; tickets in Jira / Jira Server, GitHub / GitHub Enterprise, Azure DevOps. Each block has "Send Test Notification".
- **Multiple If/Then blocks** in one alert: e.g. Jira and Slack for every new issue, page on-call only when high priority.
- **Throttling** (formerly action interval): every trigger (default), 5m, 10m, 30m, 60m, 3h, 12h, 24h, 1 week, 30 days.
- **Caps:** orgs have alert count caps; consolidate narrow alerts into one with multiple If/Then blocks. Time-window count alerts (e.g. "seen more than 100 times in one hour") have a lower per-project ceiling.

## Creating alerts through the API

The workflow engine API is in beta, part of New Monitors and Alerts, and its alerts may not be viewable in the legacy Alerts UI.

- **Prerequisites:** `curl`; an org auth token with `alerts:write` (`org:admin` or `org:write` also accepted). The sources disagree on handling it: the create-alert workflow asks the user for the token and passes it in the `curl` header, while the shared auth-token reference says to keep a token's value out of chat and command arguments ([RELEASES-AND-SOURCEMAPS.md](RELEASES-AND-SOURCEMAPS.md#auth-token)).
- **Inputs:** org slug, token (`sntryu_...`), region (default `us` → `us.sentry.io`; `de` → `de.sentry.io`), alert name, trigger events, optional conditions, action type, action target.
- **Base:** `API="https://{region}.sentry.io/api/0/organizations/{org}"` with header `Authorization: Bearer {token}`. Lookups resolve names to IDs:

```bash
API="https://{region}.sentry.io/api/0/organizations/{org}"
AUTH="Authorization: Bearer {token}"

# Find user ID by email
curl -s "$API/members/" -H "$AUTH" | python3 -c "
import json,sys
for m in json.load(sys.stdin):
  if m.get('email')=='USER_EMAIL' or m.get('user',{}).get('email')=='USER_EMAIL':
    print(m['user']['id']); break"

# List teams
curl -s "$API/teams/" -H "$AUTH" | python3 -c "
import json,sys
for t in json.load(sys.stdin):
  print(t['id'], t['slug'])"

# List integrations (for Slack/PagerDuty)
curl -s "$API/integrations/" -H "$AUTH" | python3 -c "
import json,sys
for i in json.load(sys.stdin):
  print(i['id'], i['provider']['key'], i['name'])"
```

- **Triggers** (always `logicType: "any-short"`): `first_seen_event` (new issue), `regression_event` (resolved issue recurs), `reappeared_event` (archived issue reappears), `issue_resolved_trigger`.
- **Filters** (`logicType` `"all"`, `"any-short"`, `"none"`), each with a polymorphic `comparison`:

| Filter `type` | `comparison` |
|---|---|
| `issue_priority_greater_or_equal` | `75` (Low 25, Medium 50, High 75) |
| `issue_priority_deescalating` | `true` (priority dropped below peak) |
| `event_frequency_count` | `{"value": 100, "interval": "1hr"}` |
| `event_unique_user_frequency_count` | `{"value": 50, "interval": "1hr"}` |
| `tagged_event` | `{"key": "level", "match": "eq", "value": "error"}` |
| `assigned_to` | `{"targetType": "Member", "targetIdentifier": 123}` |
| `level` | `{"level": 40, "match": "gte"}` (fatal 50, error 40, warning 30) |
| `age_comparison` | `{"time": "hour", "value": 24, "comparisonType": "older"}` |
| `issue_category` | `{"value": 1}` (1 Error, 6 Feedback, 10 Outage: uptime and cron) |
| `issue_occurrences` | `{"value": 100}` |

- **Intervals:** `"1min"`, `"5min"`, `"15min"`, `"1hr"`, `"1d"`, `"1w"`, `"30d"`. Tag match: `"co"`, `"nc"`, `"eq"`, `"ne"`, `"sw"`, `"ew"`, `"is"`, `"ns"`. `conditionResult: false` inverts a condition.
- **Actions:** `email` (`config.targetType` `"user"` / `"team"` / `"issue_owners"`, `config.targetIdentifier`); `slack` (`integrationId`, `config.targetDisplay: "#channel-name"`); `pagerduty` (`integrationId`, `config.targetDisplay` service name, `data.priority: "critical"`); `discord` (`integrationId`, `data.tags` tag list); `msteams` (`integrationId`, `config.targetDisplay` channel); `opsgenie` (`integrationId`, `data.priority` `"P1"` to `"P5"`); `jira` (`integrationId`, `data` project/issue config); `github` (`integrationId`, `data` repo/issue config).

```json
{
  "name": "<Alert Name>",
  "enabled": true,
  "environment": null,
  "config": { "frequency": 30 },
  "triggers": {
    "logicType": "any-short",
    "conditions": [
      { "type": "first_seen_event", "comparison": true, "conditionResult": true }
    ],
    "actions": []
  },
  "actionFilters": [{
    "logicType": "all",
    "conditions": [
      { "type": "issue_priority_greater_or_equal", "comparison": 75, "conditionResult": true },
      { "type": "event_frequency_count", "comparison": {"value": 50, "interval": "1hr"}, "conditionResult": true }
    ],
    "actions": [{
      "type": "email",
      "integrationId": null,
      "data": {},
      "config": {
        "targetType": "user",
        "targetIdentifier": "<user_id>",
        "targetDisplay": null
      },
      "status": "active"
    }]
  }]
}
```

- **`frequency`** is minutes between repeated notifications; allowed `0`, `5`, `10`, `30`, `60`, `180`, `720`, `1440`. `triggers.actions` is always `[]`; actions live in `actionFilters[].actions`.
- **Create:**

```bash
curl -s -w "\n%{http_code}" -X POST \
  "https://{region}.sentry.io/api/0/organizations/{org}/workflows/" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{payload}'
```

  Expect `201`; the response contains the workflow `id`. UI link: `https://{org_slug}.sentry.io/monitors/alerts/{workflow_id}/`, or without the `workflow-engine-ui` flag `https://{org_slug}.sentry.io/alerts/rules/`.
- **Manage:** `GET $API/workflows/`, `GET $API/workflows/{id}/`, `PUT $API/workflows/{id}/`, `DELETE $API/workflows/{id}/` (expect `204`).

| Error | Meaning |
|---|---|
| 401 | Token needs `alerts:write` |
| 403 | Token must belong to the org |
| 404 | Check org slug and region (`us` vs `de`) |
| 400 | Payload structure |
| User ID not found | The email must match an org member |

## Search query language

One `key:value` grammar for the Issues stream, Explore, Dashboards, alert and monitor conditions, and the MCP tools. A token is `key:value` or raw text (a CONTAINS match on title and message). Example with four tokens: `is:unresolved user.username:"Jane Doe" server:web-8 example error`.

- **Syntax:** quote values with spaces; tokens are implicitly `AND`ed; `!` negates (`!user.email:test@example.com`, `!message:"*Timeout"`); comparison operators go after `:` (`transaction.duration:>5s`, `count_dead_clicks:<=10`, `event.timestamp:>2023-09-28T00:00:00-07:00` in Issues, `timestamp` elsewhere); value lists `release:[12.0, 13.0]` mean OR, allow wildcards inside, and do not work with `is:`; `*` wildcard (`browser:"Safari 11*"`); `has:` / `!has:`; `is:` is issue state; explicit tags `tags[project_id]:value`.
- **`OR`, `AND` and `()`** work only in Discover, Dashboards and Monitors, not basic Issues search. `AND` binds tighter than `OR`. `OR` may not mix aggregate and non-aggregate conditions (`user.username:jane OR count():>100` is invalid). Examples: `browser:Chrome OR browser:Opera`; `release:13.0 AND (transaction.duration:>2s OR http.status_code:500)`.
- **Aggregate conditions:** `count():>100`, `count_unique(user):>=20`, `p95(transaction.duration):>500ms`, `failure_rate():>0.05`, `epm():>12`, `count_if(transaction.duration,greater,1000):>5`.
- **Relative age:** `age:-24h` (last 24h), `age:+12h` (older than 12h), `age:+12h age:-24h` (between); suffixes `m/h/d/w`. "The MCP doesn't know `age:` and rewrites it to `firstSeen:`, flipping `+` to `-`, which silently reverses 'older than'. Use `firstSeen:` / `lastSeen:` directly there."
- **Keys validate only against the queried dataset.** Any custom tag your SDK sets is also searchable as a key (`tags[name]:value` if it collides with a reserved one); `has:user` matches a field or tag regardless of value.

| Dataset | Keys |
|---|---|
| Issues | `is:` (`unresolved`, `resolved`, `archived`, `assigned`, `unassigned`, `for_review`, `linked`, `unlinked`), `assigned`, `assigned_or_suggested`, `bookmarks` (email, `me`, `none`, `my_teams`, `#team-name`); `issue` (`SENTRY-ABC`), `issue.category` (`error`, `performance`, `frontend`, `outage`), `issue.type` (`performance_n_plus_one_db_queries`), `issue.priority`, `title`, `message`, `culprit`, `location`; `timesSeen` (= `count()`), `age`, `firstSeen`, `lastSeen`, `event.timestamp`; `release`, `firstRelease` (supports `latest`), `release.version`, `release.build`, `release.package`, `release.stage` (`adopted` / `low` / `replaced`), `dist`; `error.handled`, `error.unhandled`, `error.type`, `error.value`, `error.mechanism`, `error.main_thread`, `level`, `event.type`; `stack.filename|function|module|package|abs_path`; `http.method|status_code|url|referer`, `user.id|email|username|ip`, `device.*`, `os.*`, `geo.city|country_code|region`, `platform.name`, `sdk.name`, `sdk.version`; `project`, `project.id`, `transaction`, `trace`, `flags["my_flag"]:true`, `has` |
| Events (Discover) | Everything event-level in Issues, plus aggregates `count()`, `count_unique(field)`, `count_if(column,operator,value)`, `count_miserable(field,threshold)`, `count_web_vitals(vital,threshold)`, `avg`, `min` / `max` / `sum`, `percentile(field,level)`, `pXY`, `apdex(threshold)`, `failure_count()`, `failure_rate()`, `user_misery(number)`, `last_seen()`, `epm()`, `eps()`. Performance: `transaction.duration|op|status`, `measurements.lcp|fcp|fid|cls|ttfb`, `measurements.app_start_cold|app_start_warm`, `measurements.frames_*`, `measurements.stall_*`, `spans.db|http|browser|resource|ui`; `trace`, `trace.span`, `trace.parent_span`; `timestamp.to_hour`, `timestamp.to_day`; `environment`, `device.class`, `stack.lineno|colno|in_app`, `user.display` |
| Spans | `span.op` / `op`, `span.description` / `description`, `span.duration` / `duration`, `self_time`, `module`, `group`, `action`, `domain`, `system`, `status`, `status_code`, `trace.status`, `transaction`, `transaction.op`, `transaction.method`, `cache.hit`, `file_extension`, `resource.render_blocking_status`, `http.response_content_length` / `.decoded_response_content_length` / `.response_transfer_size`, `messaging.destination.name`, `messaging.message.id`, `release`, `environment`, `browser.name`, `os.name`, `device.class`, `platform`, `sdk.name`, `sdk.version`, `user.id|email|username` |
| Logs | `message`, `severity` ("`level` is the errors/issues key"), `timestamp`, `trace`, structured attributes as keys, plus `release`, `environment`, `project` |
| Replay | `count_errors`, `count_dead_clicks`, `count_rage_clicks`, `count_urls`, `count_segments`, `count_traces`, `activity`, `duration`; `click.tag|id|class|role|label|textContent|title|testid|component_name|selector|alt`, `dead.selector`, `rage.selector`; `id`, `replay_type`, `url`, `screen`, `trace`, `error_ids`, `is_archived`, `seen_by_me`, `level`, `dist`, `release`, `platform`, `browser.name|version`, `os.name|version`, `device.*`, `user.id|email|username|ip`, `user.geo.city|country_code|region|subdivision`, `sdk.name`, `sdk.version`, `project_id` |
| User Feedback | `is`, `assigned`, `id`, `level`, `message`, `url`, `transaction`, `timestamp`, `environment`, `browser.name`, `os.name`, `device.brand|family|model_id|name`, `dist`, `user.id|email|ip|username`, `sdk.name`, `sdk.version` |
| Releases | `release`, `release.version|build|package|stage`; newest with `release:latest` |

- **Through the MCP:** "The MCP has no transaction-events dataset (`errors`, `logs`, `spans`, `metrics`, `profiles`, `replays`): query transactions as `spans` with `is_transaction:true`." `search_events` and `search_issues` accept natural language or grammar, but "there is no raw query path: both run your input through an LLM that rewrites fields"; results aren't reproducible and invalid rewrites surface as confusing API errors. `search_events` always prints `## Executed Search`; `search_issues` prints nothing unless `includeExplanation: true`. `period` intersects with time filters in the query; `search_issues` defaults to 30 days. `firstRelease:` works on `search_issues` only and is silently rewritten to `release:` on `search_events`.
- **Pitfalls:** a wrong-dataset key fails loudly in the UI and API but silently through the MCP (substituted, or zero results with no error): "An empty result set isn't evidence of no data"; check `## Executed Search`. Using `:` instead of a comparison operator on numeric fields. Expecting `OR` / `AND` in basic Issues search.

## Prove it

- Issue > JSON > `fingerprint` shows the value your fingerprint or SDK rule set, and two events you expect together land in one issue (or apart, if you split them). Remember rules never change existing issues.
- A new error in a path covered by an ownership rule is auto-assigned to the last matching rule's first owner; a rule referencing a team without project access fails to save rather than passing silently.
- Each alert block's "Send Test Notification" reaches the intended channel; an API-created alert returned `201` with an `id` and appears at its UI link.
- If an issue exists but the alert didn't fire, walk the filters first, and confirm frequency or event-attribute filters sit only under "A new issue is created" or "An event or issue activity is captured".
- A search that returns nothing through the MCP is re-run with `includeExplanation: true` (or checked in the UI) before you conclude there is no data.
