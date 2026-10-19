# Logs, timelines and health

Logs-first diagnosis from [gokapso/agent-skills, observe-whatsapp/SKILL.md; references/message-debugging-reference.md; references/triage-reference.md; references/health-reference.md]. The general causal method is [debugging](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/debugging/SKILL.md).

## Start with correlation

[gokapso/agent-skills, observe-whatsapp/SKILL.md; references/message-debugging-reference.md; references/triage-reference.md]

- Search the authorized project before drilling into individual resources. The source CLI shape is `kapso logs search --query "<wamid-flow-id-request-id-or-endpoint>" --period 7d --source all --limit 20 --output json`; choose its actual 24h/7d scope and supported source/filter contract for the question.
- Preserve WAMID, execution/Flow/request IDs, timestamps and cursor/page state. Follow continuation before claiming the searched period contains no relevant event.
- A problems-only query omits successful steps needed to explain a timeline. For one message, inspect the exact complete timeline rather than treating filtered results as the entire history.
- The supplied GET log-search helper drops boolean true, including problems_only. Its POST path differs. Prefer the maintained documented CLI/API operation; do not import the broken helper or infer a clean system from its missing results.

## Health is evidence with a timestamp

[gokapso/agent-skills, observe-whatsapp/references/health-reference.md]

- Confirm status and timestamp first. error means the health check failed to run, not that every underlying check failed. healthy/degraded/unhealthy are provider state values, not an alternate severity system.
- Read phone_number_access, optional token_validity, messaging_health, webhook_verified, webhook_subscription and a test_message check only if the test was requested. A missing optional check is unknown, not passed.
- AVAILABLE/LIMITED/BLOCKED describe messaging health. Inspect entity-level errors/additional_info to distinguish phone number, WABA, business portfolio, app and template causes; do not substitute the headline for the failing check.
- A configured receiver/subscription is not proof inbound delivery worked. Any test send needs the user's scope and applicable messaging policy; never generate a test to an unapproved recipient merely to turn health green.
- retry_after indicates cached access-error backoff: the timestamp remains when the actual check ran. Do not poll before the returned time or mistake the repeated payload for a fresh Meta query. Use the reported reconnection/support path for access failures.

## Escalate with bounded evidence

[gokapso/agent-skills, observe-whatsapp/references/health-reference.md; references/triage-reference.md]

Carry the actual timestamp/status, failing checks and error strings, entity type/ID and limitations, number/config identity and relevant correlation IDs. Redact credentials and message/transcript bodies. Report an unperformed check explicitly; do not promise review timing or billing behavior from the source's conversational suggestions.

## Prove it

[gokapso/agent-skills, observe-whatsapp/SKILL.md]

The diagnosis cites the actual message/execution timeline or failing health field; filtered results and incomplete pages are labelled; stale cached health is distinguished from fresh observation. No unsupported cause, unapproved test message or repeated call is used to manufacture success.
