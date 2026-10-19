# Incident operations with Grafana IRM

Use for integrations, routes, escalation chains, schedules and incident operations. Alert evaluation and notification policies stay in [ALERTING.md](ALERTING.md). [existing skills/monitoring/grafana/ALERTING-AND-ONCALL.md]

## IRM and OnCall

[existing ALERTING-AND-ONCALL.md]

Docs: https://grafana.com/docs/grafana-cloud/alerting-and-irm/ (IRM), https://grafana.com/docs/oncall/latest/ (OnCall), API https://grafana.com/docs/oncall/latest/oncall-api-reference/, Jinja2 helpers https://grafana.com/docs/oncall/latest/configure/jinja2-template-functions/

- **OnCall OSS is in maintenance mode, archived March 2026.** Cloud users use IRM; the concepts are identical.
- **Prerequisites:** a Cloud stack with IRM/OnCall, an API token, and Slack workspace admin for ChatOps. **The OnCall API header is `Authorization: <token>` with no `Bearer`** (the Grafana HTTP API uses `Bearer`).
- **Flow:** alert > integration > routing template > escalation chain > notifications > acknowledge or resolve.

| Concept | Meaning |
|---|---|
| Integration | Webhook URL accepting alerts; one per source |
| Route | Jinja2 condition to an escalation chain; first True wins |
| Escalation chain | Wait, notify schedule, notify team, webhook, auto-resolve steps |
| Schedule | Calendar-based rotation (web, iCal or Terraform) |
| Alert Group | Related alerts collapsed by a Grouping ID template |
| Notification Policy | Per-user channels: Slack, mobile push, SMS, phone, email |

- **Sources:** Grafana Alerting (native), Prometheus Alertmanager (webhook URL), Datadog (webhook), PagerDuty (event integration), Jira (issue-triggered), custom generic webhook. ChatOps and integrations: Slack, Teams, Telegram, GitHub, Jira, StatusPage.

### Grafana Alerting to IRM

- **Wire it:** create an IRM integration "Grafana Alerting webhook", add a webhook contact point (e.g. named `irm-routing`) pointing at `https://<region>.grafana.net/api/plugins/grafana-irm-app/resources/integrations/<integration-id>/webhook` with `httpMethod: POST`, and add a policy matcher (e.g. `severity = page`) routing to it. The alert should appear in IRM within about 30s.
- **Same-instance shortcut:** IRM > Integrations > New Integration > Grafana Alerting > **Quick Connect** creates the contact point; then link it to a notification policy.
- **Test** with the rule UI's "Test" button or a fake alert via `POST /api/v1/alerts`.

### Alertmanager to OnCall

```yaml
# alertmanager.yml
receivers:
  - name: grafana-oncall
    webhook_configs:
      - url: https://<your-stack>.grafana.net/integrations/v1/alertmanager/<id>/
        send_resolved: true
        max_alerts: 100        # prevent oversized payloads

route:
  receiver:        grafana-oncall
  group_by:        [alertname, cluster]
  group_wait:      30s
  group_interval:  5m
  repeat_interval: 4h
```

- **End-to-end test:** `amtool alert add foo severity=critical team=platform --alertmanager.url http://localhost:9093`; the alert group should appear in IRM > Alert Groups within about 5s. Confirm the correct route fired, the correct schedule or user was notified, and the Slack message appeared in the configured channel.

### Formatted webhook (any source)

Fields: `alert_uid`, `title`, `state` (`alerting` or `ok`), `message`, `image_url`, `link_to_upstream_details`.

```bash
# Send
curl -X POST https://<stack>.grafana.net/integrations/v1/formatted_webhook/<id>/ \
  -H "Content-Type: application/json" \
  -d '{
    "alert_uid": "incident-123",
    "title": "Database CPU High",
    "state": "alerting",
    "message": "db-prod-01 CPU at 95% for 10 minutes",
    "link_to_upstream_details": "https://grafana.example.com/d/abc123"
  }'

# Resolve
curl -X POST https://<stack>.grafana.net/integrations/v1/formatted_webhook/<id>/ \
  -H "Content-Type: application/json" \
  -d '{"alert_uid": "incident-123", "state": "ok"}'
```

### Routing and grouping templates

- **Routes return True or False; first match wins:** `{{ payload.labels.severity == "critical" }}`, `{{ payload.labels.team == "platform" }}`, `{{ "database" in payload.labels.get("component", "") }}`, catch-all `{{ true }}`.
- **Grouping ID:** `{{ payload.labels.alertname }}-{{ payload.labels.instance }}`.
- **Helpers:** `b64decode`, `regex_match`, `datetimeformat_as_timezone(payload.startsAt, "UTC")`, `tojson_pretty`.
- **Preview before going live:** Integration > Route > "Preview" with a sample payload (use a real Alertmanager test webhook) should show `Routing result: True` and the expected escalation chain. False means the Jinja expression is wrong; fix it and preview again.

### Escalation chains

- **Step types:** Wait, Notify users from schedule, Notify team, Notify users, Trigger outgoing webhook, Auto-resolve after N minutes, Round-robin; Slack adds "Notify by Slack mentions".
- **Example:** notify Primary (Important) > wait 5 min > notify Primary (Default) > wait 10 min > notify team Platform > webhook.
- **Keep chains at 4 levels or fewer with a definitive final step;** combine Slack and mobile push. Check with "Send demo alert" and watch the timeline.
- **API:** base `https://<stack>.grafana.net/api/v1/`: `integrations/`, `escalation_chains/` (POST `{"name":"Platform Critical","team_id":"<id>"}`), `schedules/`, `alert_groups/?page=1&perpage=25`.

### Schedules

- **From iCal:** `POST https://<stack>.grafana.net/api/v1/schedules/` with `ical_url_primary`, `ical_url_overrides`, `slack.channel_id`, `slack.user_group_id`.
- **Who is on call:** `GET /api/v1/schedules/<schedule_id>/next_shifts/`, then `.results[0]`.

```hcl
resource "grafana_oncall_schedule" "platform" {
  name = "Platform On-Call"
  type = "calendar"
  shifts = [
    grafana_oncall_on_call_shift.weekday.id,
    grafana_oncall_on_call_shift.weekend.id,
  ]
}

resource "grafana_oncall_on_call_shift" "weekday" {
  name           = "Weekday"
  type           = "rolling_users"
  start          = "2024-01-01T09:00:00"
  duration       = 3600 * 8
  frequency      = "weekly"
  users_per_slot = 1
  rolling_users  = [["user-id-1"], ["user-id-2"], ["user-id-3"]]
}
```

### Slack, incidents, roles, limits

- **Slack:** install at OnCall Settings > Chat Ops > Slack; users connect in Profile; set a default channel. Message actions: Acknowledge, Resolve, Silence, Add responders, Add note. Slash commands: `/escalate`, `/oncall`.
- **Incidents:** declare from an alert group ("Declare Incident") or Slack `/incident declare`; source severity P1 to P4, mapped here to P0 to P3 respectively; add responders; status Investigating > Identified > Monitoring > Resolved; the timeline is tracked automatically and the postmortem is drafted from it (how to write it: [observability INCIDENT-RESPONSE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/INCIDENT-RESPONSE.md#the-postmortem)).
- **RBAC roles:** `oncall-admin`, `oncall-editor`, `oncall-viewer`, `oncall-notifications-receiver`. Assign integrations and schedules to teams.
- **Rate limits:** 300 alerts per integration per 5 min; 500 alerts per org per 5 min; 300 API requests per key per 5 min.
- **Always `send_resolved: true` and `max_alerts: 100`** on Alertmanager webhooks.

## Debugging

[existing ALERTING-AND-ONCALL.md]

| Symptom | Check |
|---|---|
| Fires in Grafana, never reaches IRM | Policy doesn't match the labels, wrong webhook URL, or policy doesn't route to `irm-routing`; check Grafana logs for HTTP errors on the webhook POST |
| Reaches IRM, nobody notified | Escalation chain misconfigured: no users in rotation, quiet hours |
| Duplicate IRM incidents | `group_by` is missing the labels that make alerts unique |

## Prove it

[existing ALERTING-AND-ONCALL.md]

- For IRM: the test alert appears (about 30s via Grafana Alerting, about 5s for Alertmanager to OnCall), the route Preview shows `Routing result: True`, and "Send demo alert" reaches a person through the escalation chain.
