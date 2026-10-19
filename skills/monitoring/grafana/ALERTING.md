# Grafana alert evaluation and notifications

Grafana Alerting evaluates rules (queries plus a condition, on an interval, with a pending period) and hands firing instances to a notification policy tree that groups them and routes them to contact points; [IRM and OnCall](IRM-AND-ONCALL.md) take it from there with escalation chains, schedules and incidents. Most outcomes are decided by labels: the labels a rule produces decide which policy matches, how instances group into one notification or a hundred, which silence applies and which IRM route fires. Alert on user-facing symptoms, give every alert an owner, and test routing before go-live. PromQL and recording rules are in [PROMQL.md](PROMQL.md) and [PROMETHEUS.md](PROMETHEUS.md); provisioning in general is in [PROVISIONING-AND-API.md](PROVISIONING-AND-API.md).

**Contents:** [Alert design](#alert-design) · [How rules work](#how-rules-work) · [Grafana-managed rules](#grafana-managed-rules) · [Data source-managed rules](#data-source-managed-rules) · [Example rule queries](#example-rule-queries) · [SLOs and burn-rate alerts](#slos-and-burn-rate-alerts) · [Contact points](#contact-points) · [Notification policies](#notification-policies) · [Templates](#templates) · [Silences, mute timings, inhibition](#silences-mute-timings-inhibition) · [Provisioning alerting](#provisioning-alerting) · [Server config and HA](#server-config-and-ha) · [Alerting RBAC](#alerting-rbac) · [Debugging](#debugging) · [Prove it](#prove-it)

## Alert design

- **Alert on symptoms, not causes.** Alerts should detect user-facing failures ("Users don't care that a pod restarted"): latency, errors and availability page better than infrastructure events. Alert from RED dashboards ([DASHBOARDS.md](DASHBOARDS.md#design)). The same holds whatever the stack, and "Alerting is never finished."
- **Route infrastructure signals low.** They matter as early warnings but are noisy as pages; send them to dashboards, alert lists or a non-paging Slack channel.
- **Escalate on confidence.** Raise priority, widen notification, page more responders or open an incident when an issue is sustained or reinforced by several signals (high latency plus a rising error rate).
- **One multi-dimensional rule, not one rule per host, service or endpoint.** Start with a single dimension such as `service` or `endpoint`; add `region` or `instance` only when it improves actionability.
- **Design for first responders.** Each alert says why it exists, what triggered it and how to investigate; link dashboards and runbooks in annotations. "If no action is possible, it shouldn't be an alert"; use a dashboard instead. Alerts behave like technical debt over time.
- **Every alert has an owner** (team) and a system scope (service or component). "Notification routing is as important as the alerts."
- **Set thresholds from an observed baseline, in peacetime.** "Debating that baseline while an incident is underway means you are already late." Alerts catch momentary problems, not slow decline; a week-over-week comparison panel finds that ([observability INCIDENT-RESPONSE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/INCIDENT-RESPONSE.md#three-kinds-of-time)).
- **Fight flapping** with a pending period and with aggregation over a window instead of raw values; prefer percentiles to averages for latency and errors; use `keep_firing_for` or recovery thresholds during recovery.

```promql
# Reacts to transient spikes. Avoid this.
cpu_usage > 90

# Smooth fluctuations.
avg_over_time(cpu_usage[5m]) > 90
```

```promql
quantile_over_time(0.95, http_duration_seconds[5m]) > 3
```

- **Graduate noisy symptom alerts into SLOs** and alert on error-budget burn rate; one SLO across teams replaces several latency alerts.
- **Keep alerts few and simple.** Aim for as few alerts as possible, link each to the relevant consoles, and allow slack for small blips; page on latency at only one point in a stack, as high up as possible; page on user-visible errors plus severe invisible failures (e.g. losing money); split alerts per request type when low-traffic types would drown. Batch jobs: page when a job hasn't succeeded recently enough, with a threshold of at least 2 full runs ("For a job that runs every 4 hours and takes an hour, 10 hours would be a reasonable threshold"). Offline processing: alert on how long data takes to get through. Capacity: being near capacity often needs human intervention. Alert names: CamelCase by community convention.
- **Monitor the monitoring.** Alert that Prometheus, Alertmanager and PushGateway are up; prefer one end-to-end blackbox test (PushGateway to Prometheus to Alertmanager to email) plus external blackbox monitoring.
- **Review continuously.** After incidents, check which alerts fired and how they shaped the response; remove alerts that lead to no action; "Use dashboards and observability tools for investigation, not alerts." The postmortem's first question is the detection gap, from the first trace on a graph to the alert firing: can that sign become an alert ([observability INCIDENT-RESPONSE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/INCIDENT-RESPONSE.md#the-postmortem))?

## How rules work

Reference: https://grafana.com/docs/grafana/latest/alerting.md

- **A rule is queries + condition + evaluation interval + pending period.** It is multi-dimensional: one instance per unique label combination (`cpu_usage{host=~".*"}` gives one instance per host).
- **Evaluation group:** the interval is shared. Grafana-managed rules normally evaluate concurrently; data source-managed rules and Grafana-managed rules imported from them evaluate sequentially. The old line said every group evaluated sequentially. [https://grafana.com/docs/grafana/latest/alerting/fundamentals/alert-rule-evaluation/evaluation-within-a-group/]
- **Pending period** (`for`): `0s` fires immediately, `5m` needs 5 continuous minutes. **Keep firing for** keeps it firing after recovery.
- **Folder is the RBAC boundary** for rules.

| Rule type | Stored and evaluated | Use |
|---|---|---|
| Grafana-managed (recommended) | Grafana DB | Any data source, multi-dimensional, expressions |
| Data source-managed | Prometheus, Mimir or Loki | Migrating from Prometheus alerting |

- **States:** Normal, Pending (waiting for `for`), Firing, NoData, Error, and one more that the sources name differently: "Resolved" (Grafana OSS reference) or "Recovering", "Was firing, condition no longer met" (alerting-irm skill). Confirm in the current docs.
- **Expressions:** Math (`$A > 80`, `($A + $B) / 2`), Reduce (Last, Mean, Sum, Max, Min), Resample, Classic conditions, Threshold.
- **No data handling:** Alerting, OK, No Data state, Keep last state. **Query error handling:** Alerting, OK, Error state, Keep last state.
- **A contact point set on the rule sends directly and bypasses the policy tree;** leave it empty to use the tree.
- **From a panel:** panel editor > Alert tab > "Create alert rule from this panel". Link the rule to a dashboard and panel to show the state badge.

## Grafana-managed rules

```yaml
# provisioning/alerting/rules.yaml
apiVersion: 1
groups:
  - orgId: 1
    name: MyAlertGroup
    folder: MyFolder
    interval: 1m
    rules:
      - uid: high-error-rate
        title: High Error Rate
        condition: C
        data:
          - refId: A
            datasourceUid: prometheus
            relativeTimeRange:
              from: 300   # 5 minutes
              to: 0
            model:
              expr: sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)
          - refId: B
            datasourceUid: __expr__
            model:
              type: reduce
              refId: B
              expression: A
              reducer: last
          - refId: C
            datasourceUid: __expr__
            model:
              type: math
              refId: C
              expression: $B > 0.05
        noDataState: NoData
        execErrState: Alerting
        for: 5m
        labels:
          severity: critical
          team: platform
        annotations:
          summary: "High error rate on {{ $labels.service }}"
          description: "Error rate is {{ $values.B }}%"
          runbook_url: "https://runbooks.example.com/high-error-rate"
```

- **Expressions use `datasourceUid: __expr__`;** `condition` names the refId that decides firing.
- **Annotation templates:** `Summary: CPU usage above 80% on {{ $labels.instance }}`, `Description: CPU usage is {{ $values.A.Value | humanize }}% on {{ $labels.instance }}`, plus a runbook URL.

## Data source-managed rules

Prometheus or Mimir ruler (alerts plus a recording rule):

```yaml
groups:
  - name: service-alerts
    interval: 1m
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)
          /
          sum(rate(http_requests_total[5m])) by (service)
          > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate: {{ $labels.service }}"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "P95 latency > 1s on {{ $labels.service }}"

      # Recording rule
      - record: job:http_requests:rate5m
        expr: sum(rate(http_requests_total[5m])) by (job)
```

Loki ruler (LogQL):

```yaml
groups:
  - name: log-alerts
    rules:
      - alert: HighErrorLogs
        expr: |
          sum(rate({app="myapp"} |= "error" [5m])) by (app)
          /
          sum(rate({app="myapp"}[5m])) by (app)
          > 0.05
        for: 10m
        labels:
          severity: page
        annotations:
          summary: "High error log rate for {{ $labels.app }}"

      - alert: CredentialsLeak
        expr: |
          sum by (cluster, job, pod) (
            count_over_time({namespace="prod"} |~ "https?://(\\w+):(\\w+)@" [5m]) > 0
          )
        for: 5m
        labels:
          severity: critical
```

## Example rule queries

| Alert | Query | Condition |
|---|---|---|
| CPU | `100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)` | A > 80, pending 5m, `severity=warning` |
| Memory | `(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100` | A > 90 |
| HTTP error rate | A `sum(rate(http_requests_total{status=~"5.."}[5m]))`, B `sum(rate(http_requests_total[5m]))`, C Math `$A / $B * 100` | C > 5 |
| Disk | `(1 - (node_filesystem_free_bytes{fstype!="tmpfs"} / node_filesystem_size_bytes{fstype!="tmpfs"})) * 100` | A > 85 |
| Service down | `up{job="my-service"}` | A < 1; No data: Alerting (absence fires) |
| Loki errors | `sum(rate({job="api"} \|= "ERROR" [5m]))` | A > 10 |

## SLOs and burn-rate alerts

- **Creating an SLO in the UI or API generates recording rules, dashboards and burn-rate alerts.** Example generated rules:

```yaml
groups:
  - name: slo_availability
    interval: 1m
    rules:
      - record: slo:availability:ratio_rate5m
        expr: |
          sum(rate(http_requests_total{status!~"5.."}[5m])) by (service)
          / sum(rate(http_requests_total[5m])) by (service)

      - record: slo:error_budget:remaining
        expr: |
          (slo:availability:ratio_rate30d - 0.999) / (1 - 0.999)
```

- **A single-window burn alert fires on transient noise:** `slo:burn_rate:ratio_rate1h > 14.4` (1h window, 2% of a 30-day budget: 14.4 / (30 × 24); the old line said 5%), `for: 2m`. Use multi-window, multi-burn-rate (Google SRE Workbook ch. 5, https://sre.google/workbook/alerting-on-slos/): the `and` filters a lone 5m spike (1h stays low) and a slow burn that already recovered (5m now low).

```yaml
- alert: SLOBurnRateFast
  expr: |
    slo:burn_rate:ratio_rate1h > 14.4
    and
    slo:burn_rate:ratio_rate5m > 14.4
  for: 2m
  labels:
    severity: critical
```

- **Validate:** `GET /api/v1/rules?type=record` includes the SLO rules; wait one evaluation (default interval 1m); `GET /api/v1/query?query=slo:burn_rate:ratio_rate1h` returns a number; force a failure in staging and confirm it fires within `for`.

## Contact points

Full settings per integration: https://grafana.com/docs/grafana/latest/alerting/configure-notifications/manage-contact-points/integrations/

| Integration | Needs |
|---|---|
| Email | SMTP in `grafana.ini` ([PROVISIONING-AND-API.md](PROVISIONING-AND-API.md#grafanaini)); `settings.addresses` semicolon-separated |
| Slack | Webhook URL, or API token + channel |
| PagerDuty | Integration key |
| OpsGenie | API key |
| VictorOps (Splunk) | API key |
| Microsoft Teams | Incoming webhook URL |
| Discord | Webhook URL |
| Telegram | Bot token + chat ID |
| Webhook | HTTP POST to a custom URL: `settings.url`, `httpMethod: POST` |
| Alertmanager | Forward to an external Alertmanager |
| Pushover | User key + API token |
| LINE | LINE Notify token |

- **Other `type` values:** `teams`, `telegram`, `discord`, `opsgenie`, `victorops`, `sns`, `googlechat`, `line`, `wecom`, `kafka`, `oncall`.
- **Email: enable Single email** in optional settings to send one email instead of one per alert; there is a per-second notification send limit.

```yaml
# provisioning/alerting/contact_points.yaml
apiVersion: 1
contactPoints:
  - orgId: 1
    name: pagerduty-critical
    receivers:
      - uid: pd-receiver
        type: pagerduty
        settings:
          integrationKey: YOUR_PAGERDUTY_KEY
          severity: critical

  - orgId: 1
    name: slack-alerts
    receivers:
      - uid: slack-receiver
        type: slack
        settings:
          url: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
          channel: '#alerts'
```

- **API:** `POST /api/v1/provisioning/contact-points` with `-d @contact-points.json`; list with `GET /api/v1/provisioning/contact-points | jq '.[].name'`.

Webhook payload:

```json
{
  "receiver": "webhook-receiver",
  "status": "firing",
  "alerts": [
    {
      "status": "firing",
      "labels": { "alertname": "HighCPU", "instance": "server1" },
      "annotations": { "summary": "CPU above 80%" },
      "startsAt": "2024-01-15T10:00:00Z",
      "generatorURL": "http://grafana/alerting/..."
    }
  ],
  "groupLabels": { "alertname": "HighCPU" },
  "externalURL": "http://grafana"
}
```

## Notification policies

- **Policies form a tree.** The root is the **Default notification policy**: it matches everything and handles unmatched instances. Use a parent policy for default routing within a scope and nested policies for specific or higher-priority cases. A "multiple policy" feature allows separate, independently managed trees.
- **Routing:** start at the top; on a match, evaluate children in displayed order, recursively. Only the deepest matching child handles the instance. Siblings are not checked after a match unless **Continue matching siblings** is on.
- **Inheritance:** a child inherits contact point, grouping and timing from its parent; each policy can override.
- **Label matchers** have a label, an operator (`=`, `!=`, `=~`, `!~`) and a value; several matchers are ANDed. With labels `{ foo=bar, baz=qux, id=12 }`: `foo=bar` matches, `foo!=bar` doesn't, `id=~[0-9]+` matches, `baz!~[0-9]+` matches. Match a missing label with `team` `=` `""`, `team` `!~` `.+`, or `team` `=~` `^$`.

### Grouping and timers

- **Grouping "can be the difference between receiving 1 phone call and 100 phone calls."** Alerts with the same values for every group-by label form one group. Group along operational boundaries (service or owner) and keep cascading downstream failures together. Example: 50 hosts fire HighCPU; group by `[alertname, datacenter]` and you get one notification per datacenter.
- **Default grouping** is by rule, using `alertname` and `grafana_folder` (rule names aren't unique across folders). An empty `Group by` on the Default policy puts all alerts in one group. Group by the special label `...` to disable grouping.

| Timer | Default | Meaning |
|---|---|---|
| Group wait | 30s | Wait before the first notification for a new group; alerts that resolve inside it send nothing |
| Group interval | 5m | Wait before notifying about changes to the group (new firing or resolved alert) |
| Repeat interval | 4h | Reminder while the group is unchanged |

- **Repeat interval must be at least, and a multiple of, group interval,** or it is coerced (group interval 5m, repeat 9m becomes 10m). Maximum 5 days, bounded by the default `notification_log_retention`.

```yaml
# provisioning/alerting/notification_policies.yaml
apiVersion: 1
policies:
  - orgId: 1
    receiver: default-receiver
    group_by: ['alertname', 'cluster', 'service']
    group_wait: 30s
    group_interval: 5m
    repeat_interval: 12h
    routes:
      # Critical alerts → PagerDuty
      - receiver: pagerduty-critical
        matchers:
          - severity = critical
        group_wait: 10s
        repeat_interval: 4h

      # Platform team → Slack, but page on critical
      - receiver: slack-alerts
        matchers:
          - team = platform
        routes:
          - receiver: pagerduty-critical
            matchers:
              - severity = critical

      # Everything else → email
      - receiver: email-alerts
        matchers:
          - severity =~ "warning|info"
```

The root's `repeat_interval: 12h` here is an example value; the documented default is 4h.

## Templates

- **Variables:** `{{ $labels }}`, `{{ $values }}`, `{{ $labels.instance }}`, `{{ $values.A.Value }}`, `{{ $status }}`, `{{ $startsAt }}`.

| Function | Output |
|---|---|
| `humanize` | "12.3k" |
| `humanize1024` | "12.3Ki" |
| `humanizeBytes` | "12.3 kB" |
| `humanizeDuration` | "3h 2m 1s" |
| `humanizePercentage` | "12.3%" |

```
{{ define "slack_message" }}
{{ if eq .Status "firing" }}:red_circle:{{ else }}:large_green_circle:{{ end }} *{{ .Labels.alertname }}*

*Status:* {{ .Status }}
*Severity:* {{ .Labels.severity }}

{{ range .Alerts }}
*Instance:* {{ .Labels.instance }}
*Value:* {{ .Values.A.Value | humanize }}
*Summary:* {{ .Annotations.summary }}
{{ end }}
{{ end }}
```

```
# Custom Slack template
{{ define "slack.custom.title" }}
  [{{ .Status | toUpper }}{{ if eq .Status "firing" }}:{{ .Alerts.Firing | len }}{{ end }}]
  {{ .CommonLabels.alertname }}
{{ end }}

{{ define "slack.custom.text" }}
{{ range .Alerts }}
*Alert:* {{ .Annotations.summary }}
*Severity:* {{ .Labels.severity }}
*Service:* {{ .Labels.service }}
*Details:* {{ .Annotations.description }}
{{ if .Annotations.runbook_url }}*Runbook:* {{ .Annotations.runbook_url }}{{ end }}
{{ end }}
{{ end }}
```

- **Silence links in templates:** `.Alert.SilenceURL`, or build one with `matcher` and `comment` query params: `https://mygrafana/alerting/silence/new?matcher=severity%3Dcritical&matcher=cluster!~europe-*&comment=Silence%20critical%20EU%20alert` (add `alertmanager` for an external Alertmanager).

## Silences, mute timings, inhibition

- **Silences stop notifications for a fixed window but don't interrupt evaluation** or hide instances in the UI. Use them for maintenance, known issues, deploys and active incidents, scoped carefully to avoid silencing unrelated alerts. A silence belongs to a specific Alertmanager; in Grafana Cloud the standalone Alertmanager UI is deprecated, so manage silences in the Grafana Alerting UI.
- **Create:** Alerts & IRM > Alerting > Silences > Create silence; start/end or Duration, label matchers (`=`, `!=`, `=~`), a comment; affected firing instances are previewed. "Silence" on a firing alert pre-fills matchers. For one rule, use the rule's **Silence notifications** action or the matcher `__alert_rule_uid__=<alert rule UID>`.
- **Ending:** **Unsilence** is the only way to end early; silences can't be deleted manually. No maximum duration. Expired silences are deleted after 5 days (not configurable), with cleanup every 15 minutes. Admin limits: `alertmanager_max_silences_count` (default 0 = no limit, expired ones counted) and `alertmanager_max_silence_size_bytes` (default 0).

```bash
curl -X POST https://grafana.example.com/api/alertmanager/grafana/api/v2/silences \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "matchers": [
      {"name": "alertname", "value": "HighErrorRate", "isRegex": false},
      {"name": "env", "value": "staging", "isRegex": false}
    ],
    "startsAt": "2024-01-01T00:00:00Z",
    "endsAt": "2024-01-01T02:00:00Z",
    "comment": "Maintenance window",
    "createdBy": "admin"
  }'

# Verify it was created
curl https://grafana.example.com/api/alertmanager/grafana/api/v2/silences \
  -H 'Authorization: Bearer <token>' | jq '.[] | select(.status.state == "active")'
```

- **Mute timings recur** (silences are one-time): e.g. `no-alerts-weekends` (Saturday, Sunday), `business-hours-only` (Monday to Friday 09:00 to 17:00). Create one, then attach it to notification policies.
- **Inhibition rules** suppress notifications for target alerts while a related source alert fires: https://grafana.com/docs/grafana/latest/alerting/configure-notifications/inhibition-rules/

## Provisioning alerting

- **Files:** `provisioning/alerting/` with `alert_rules.yaml`, `contact_points.yaml`, `notification_policies.yaml`, `templates.yaml`, `mute_timings.yaml`. File-provisioned resources aren't editable in the UI, and file provisioning is not available in Grafana Cloud.
- **Other paths:** Terraform, and the Alerting provisioning HTTP API (Grafana-managed alerts only; data source-managed alerts and recording rules go through the Mimir or Cortex tool). Imported resources can only be edited in the source that created them and are labeled **Provisioned**.
- **API endpoints:** `PUT /api/v1/provisioning/policies`, `POST /api/v1/provisioning/alert-rules`, `POST /api/v1/provisioning/contact-points`. Header `X-Disable-Provenance: true` keeps API-provisioned resources editable in the UI.
- **Formats differ:** most Alerting HTTP endpoint JSON isn't compatible with file provisioning; use the Export Alerting endpoints to get provisioning format.

## Server config and HA

- **Rule-result quota:** self-managed Grafana uses `alerting_rule_evaluation_results` in `[quota]` (default `-1`, unlimited); Cloud manages the limit. `max_annotations_to_keep` belongs to `[unified_alerting.state_history.annotations]` and limits retained annotations. The retired source INI called it a maximum alert-instance count. Its other source settings were `[unified_alerting] enabled=true`, `evaluation_timeout=30s` and `min_interval=10s`; these are separate settings, not the result quota. [https://grafana.com/docs/grafana/latest/alerting/set-up/performance-limitations/; https://grafana.com/docs/grafana/latest/administration/configuration/]

HA: instances share state so notifications aren't duplicated.

```ini
[unified_alerting]
ha_peers = grafana-1:9094,grafana-2:9094,grafana-3:9094
ha_advertise_address = ${POD_IP}:9094
ha_peer_timeout = 15s
ha_gossip_interval = 200ms
ha_push_pull_interval = 60s
```

## Alerting RBAC

| Action | Viewer | Editor | Admin |
|---|---|---|---|
| View rules | yes | yes | yes |
| Create or edit rules | | yes | yes |
| Delete rules | | | yes |
| Manage contact points | | | yes |
| Manage notification policies | | | yes |
| Create silences | | yes | yes |

For this workflow, read [IRM-AND-ONCALL.md](IRM-AND-ONCALL.md). [existing skills/monitoring/grafana/ALERTING-AND-ONCALL.md]

## Debugging

| Symptom | Cause |
|---|---|
| Alert goes to the wrong receiver | Policy matchers; check with the Alertmanager alerts endpoint below |
| Hundreds of notifications for one outage | Grouping too fine; group by service or owner |
| Repeat interval not what you set | Coerced to a multiple of group interval |
| No email | SMTP not configured; send a test from Alerting > Contact points |

```bash
curl https://grafana.example.com/api/alertmanager/grafana/api/v2/alerts \
  -H 'Authorization: Bearer <token>' | jq '.[] | {alertname: .labels.alertname, receiver: .receivers}'
```

## Prove it

- Force-fire a test alert and the Alertmanager alerts endpoint shows it on the intended receiver; every severity and team path in the policy tree has been exercised once.
- Every rule has a `team` (or owner) label, a summary, and a dashboard or runbook link in its annotations.
- `GET /api/v1/provisioning/contact-points | jq '.[].name'` lists every contact point the policies reference.
- A silence created through the API shows `status.state == "active"` and the previewed instances are only the intended ones.
- For SLOs: `slo:burn_rate:ratio_rate1h` returns a number and a staged failure fires within `for`.
