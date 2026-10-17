# Error alert templates

The canonical message bodies for error tracking alerts, per trigger event and destination. Copy them verbatim: they match the in-product alert wizard, so agent-created and UI-created alerts produce identical notifications. The workflow (trigger choice, dedupe, integrations, naming, template variables) is in [ERROR-TRIAGE.md](ERROR-TRIAGE.md#alerts).

- **Fill three placeholders inside `inputs` at create time:** `slack_workspace.value`, the integer integration id from `posthog:integrations-list` (Slack only); `channel.value`, a Slack channel id like `C0123ABC` (preferred) or `#name`; `url.value`, the webhook destination URL (webhook only).
- **Leave every curly-braced segment as-is.** Each is a HogQL template expression evaluated at fire time against the live event.
- **Emoji:** the source starts each header and message with an emoji (a red circle for created, counterclockwise arrows for reopened, a chart increasing for spiking); the snippets below drop them.

## Issue created

### Slack (`template-slack`)

````json
{
  "type": "internal_destination",
  "template_id": "template-slack",
  "name": "Issue created · #<channel> (auto)",
  "enabled": true,
  "filters": {
    "events": [{ "id": "$error_tracking_issue_created", "type": "events" }]
  },
  "inputs": {
    "slack_workspace": { "value": <slack_integration_id_int> },
    "channel": { "value": "<channel_id>" },
    "text": { "value": "New issue created: {event.properties.name}" },
    "blocks": {
      "value": [
        { "type": "header", "text": { "type": "plain_text", "text": "{event.properties.name}" } },
        { "type": "section", "text": { "type": "plain_text", "text": "New issue created" } },
        { "type": "section", "text": { "type": "mrkdwn", "text": "```{substring(event.properties.description, 1, 150)}```" } },
        {
          "type": "context",
          "elements": [
            { "type": "plain_text", "text": "Status: {event.properties.status}" },
            { "type": "mrkdwn", "text": "Project: <{project.url}|{project.name}>" },
            { "type": "mrkdwn", "text": "Alert: <{source.url}|{source.name}>" }
          ]
        },
        { "type": "divider" },
        {
          "type": "actions",
          "elements": [
            {
              "type": "button",
              "text": { "type": "plain_text", "text": "View Issue" },
              "url": "{project.url}/error-tracking/fingerprint/{encodeURLComponent(event.properties.fingerprint)}?timestamp={event.properties.exception_timestamp}&utm_source=alert&utm_campaign=error_tracking_alert&utm_medium=slack"
            }
          ]
        }
      ]
    }
  }
}
````

### Webhook (`template-webhook`)

```json
{
  "type": "internal_destination",
  "template_id": "template-webhook",
  "name": "Issue created · <host> (auto)",
  "enabled": true,
  "filters": {
    "events": [{ "id": "$error_tracking_issue_created", "type": "events" }]
  },
  "inputs": {
    "url": { "value": "https://example.com/hooks/posthog-error-tracking" }
  }
}
```

### Discord (`template-discord`)

```json
"inputs": {
  "content": {
    "value": "**{event.properties.name} created:** {event.properties.description}\n\n[View in PostHog]({project.url}/error-tracking/fingerprint/{encodeURLComponent(event.properties.fingerprint)}?timestamp={event.properties.exception_timestamp}&utm_source=alert&utm_campaign=error_tracking_alert&utm_medium=discord)"
  }
}
```

### Microsoft Teams (`template-microsoft-teams`)

```json
"inputs": {
  "text": {
    "value": "**{event.properties.name} created:** {event.properties.description} (View in [PostHog]({project.url}/error-tracking/fingerprint/{encodeURLComponent(event.properties.fingerprint)}?timestamp={event.properties.exception_timestamp}&utm_source=alert&utm_campaign=error_tracking_alert&utm_medium=microsoft_teams))"
  }
}
```

### Linear, GitHub and GitLab

These file a tracking issue rather than post a message, with the same `inputs` shape for all three:

```json
"inputs": {
  "title": { "value": "{event.properties.name}" },
  "description": { "value": "{event.properties.description}" },
  "posthog_issue_id": { "value": "{event.distinct_id}" },
  "posthog_issue_url": { "value": "{project.url}/error-tracking/fingerprint/{encodeURLComponent(event.properties.fingerprint)}?timestamp={event.properties.exception_timestamp}&utm_source=alert&utm_campaign=error_tracking_alert&utm_medium=linear" }
}
```

- **Set `utm_medium`** to the destination (`linear`, `github`, `gitlab`). `posthog_issue_url` is the merge-stable deep link embedded in the external issue; when omitted, the destination builds a link from `posthog_issue_id`.

## Issue reopened

### Slack (`template-slack`)

The same as created, with the header emoji swapped and the section text "Issue reopened":

````json
"blocks": {
  "value": [
    { "type": "header", "text": { "type": "plain_text", "text": "{event.properties.name}" } },
    { "type": "section", "text": { "type": "plain_text", "text": "Issue reopened" } },
    { "type": "section", "text": { "type": "mrkdwn", "text": "```{substring(event.properties.description, 1, 150)}```" } },
    {
      "type": "context",
      "elements": [
        { "type": "plain_text", "text": "Status: {event.properties.status}" },
        { "type": "mrkdwn", "text": "Project: <{project.url}|{project.name}>" },
        { "type": "mrkdwn", "text": "Alert: <{source.url}|{source.name}>" }
      ]
    },
    { "type": "divider" },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "View Issue" },
          "url": "{project.url}/error-tracking/fingerprint/{encodeURLComponent(event.properties.fingerprint)}?timestamp={event.properties.exception_timestamp}&utm_source=alert&utm_campaign=error_tracking_alert&utm_medium=slack"
        }
      ]
    }
  ]
},
"text": { "value": "Issue reopened: {event.properties.name}" }
````

### Discord and Microsoft Teams

The same shape as created, with "created" swapped for "reopened" in the text body (and the reopened emoji).

## Issue spiking

### Slack (`template-slack`)

````json
"blocks": {
  "value": [
    { "type": "header", "text": { "type": "plain_text", "text": "Issue spiking" } },
    { "type": "section", "text": { "type": "mrkdwn", "text": "```{event.properties.name}: {substring(event.properties.description, 1, 1000)}```" } },
    {
      "type": "context",
      "elements": [
        {
          "type": "plain_text",
          "text": "Exceptions in last 5 minutes: {event.properties.current_bucket_value} ({event.properties.computed_baseline > 0 ? concat(round(event.properties.current_bucket_value / event.properties.computed_baseline), 'x over baseline') : 'no baseline yet'})"
        },
        { "type": "mrkdwn", "text": "Project: <{project.url}|{project.name}>" },
        { "type": "mrkdwn", "text": "Alert: <{source.url}|{source.name}>" }
      ]
    },
    { "type": "divider" },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "View Issue" },
          "url": "{project.url}/error-tracking/fingerprint/{encodeURLComponent(event.properties.fingerprint)}?timestamp={event.properties.exception_timestamp}&utm_source=alert&utm_campaign=error_tracking_alert&utm_medium=slack"
        }
      ]
    }
  ]
},
"text": { "value": "Issue spiking: {event.properties.name}" }
````

- **The `computed_baseline > 0 ? ... : 'no baseline yet'` guard** handles the project's first spike, before the detector has enough history for a baseline. Without it the message says `0x over baseline`.

### Discord (`template-discord`)

````json
"inputs": {
  "content": {
    "value": "**Issue spiking**\n\n```\n{event.properties.name}: {substring(event.properties.description, 1, 1000)}\n```\n**Exceptions in last 5 minutes:** {event.properties.current_bucket_value} ({event.properties.computed_baseline > 0 ? concat(round(event.properties.current_bucket_value / event.properties.computed_baseline), 'x over baseline') : 'no baseline yet'})\n**Project:** [{project.name}]({project.url})\n**Alert:** [{source.name}]({source.url})\n\n[View issue]({project.url}/error-tracking/fingerprint/{encodeURLComponent(event.properties.fingerprint)}?timestamp={event.properties.exception_timestamp}&utm_source=alert&utm_campaign=error_tracking_alert&utm_medium=discord)"
  }
}
````

### Microsoft Teams (`template-microsoft-teams`)

```json
"inputs": {
  "text": {
    "value": "**Issue spiking: {event.properties.name}:** {event.properties.description}\n**Exceptions in last 5 minutes:** {event.properties.current_bucket_value} ({event.properties.computed_baseline > 0 ? concat(round(event.properties.current_bucket_value / event.properties.computed_baseline), 'x over baseline') : 'no baseline yet'}) (View in [PostHog]({project.url}/error-tracking/fingerprint/{encodeURLComponent(event.properties.fingerprint)}?timestamp={event.properties.exception_timestamp}&utm_source=alert&utm_campaign=error_tracking_alert&utm_medium=microsoft_teams))"
  }
}
```
