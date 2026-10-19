# Webhook scope and delivery

Contracts from [gokapso/agent-skills, integrate-whatsapp/references/webhooks-overview.md; references/webhooks-reference.md; references/webhooks-event-types.md; integrate-whatsapp-calling/references/calling-api.md], corrected against [Kapso webhook overview](https://docs.kapso.ai/docs/platform/webhooks/overview) and [advanced delivery](https://docs.kapso.ai/docs/platform/webhooks/advanced).

## Receiver scope

[gokapso/agent-skills, integrate-whatsapp/references/webhooks-overview.md; references/webhooks-reference.md; integrate-whatsapp-calling/references/calling-api.md]

- Project receivers carry connection lifecycle and workflow events. Message/conversation events belong to a phone-number receiver; a project subscription does not receive whatsapp.message.* or whatsapp.conversation.*.
- Kapso kind supplies event filtering and optional message buffering. Meta kind forwards Meta-shaped payloads, without Kapso filtering/buffering, and has one receiver per phone number. Inspect an existing receiver before replacing it.
- Calling uses the phone-number Meta receiver and the application's calls subscription; an active receiver alone does not prove Meta has subscribed the app. Read back URL/kind/active without printing secret_key.
- The source exposes payload versions v1/v2 and recommends v2. Choose the receiver's actual contract and read X-Webhook-Payload-Version; do not silently parse one version as another.

## Verify before effects

[gokapso/agent-skills, integrate-whatsapp/references/webhooks-reference.md; integrate-whatsapp-calling/references/calling-api.md]

- X-Webhook-Signature is hexadecimal HMAC-SHA256 over raw request bytes using the receiver secret_key. It is not the API key or Meta app secret. Preserve bytes before JSON parsing and use the existing [signature/security boundary](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/secure-coding/SKILL.md).
- Relevant headers include X-Webhook-Event, X-Webhook-Signature, X-Idempotency-Key and X-Webhook-Payload-Version. A batch can also declare X-Webhook-Batch and X-Batch-Size.
- Treat Meta's X-Idempotency-Key as opaque. Forwarding can scope the body, so do not hash the received body to reconstruct it. The supplied overview described it as a payload SHA256; the [official forwarding contract](https://docs.kapso.ai/docs/platform/webhooks/overview) explicitly rejects recomputation.
- Durability, duplicate/out-of-order processing and fast acknowledgement have one owner in [third-party-integrations CALLS-AND-SYNC.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/third-party-integrations/CALLS-AND-SYNC.md). A verified delivery key is not a customer authorization token.

## Batches, events and retries

[gokapso/agent-skills, integrate-whatsapp/references/webhooks-event-types.md; integrate-whatsapp-calling/SKILL.md]

- Iterate every Meta entry, change and relevant item. Preserve the root metadata.phone_number_id and project scope; do not assume a delivery contains one message or call. An item key can combine the opaque delivery key and positions; call-session locking and terminal-artifact handling remain distinct.
- Buffered message deliveries have a batch envelope rather than the singleton payload. Match the selected payload version and configured buffer contract before reading fields.
- Route connection/workflow events separately from phone messages, conversations, inactivity, identity updates and delivery-state history. Message-scoped Kapso extensions describe that message; a newer extension is not evidence of earlier state.
- Return the required acknowledgement within 10 seconds after safe admission. Default max_attempts is three including the first delivery, with two retries after 10 then 40 seconds. The source listed an extra 90-second default retry; [Kapso advanced delivery](https://docs.kapso.ai/docs/platform/webhooks/advanced) defines the corrected schedule.

## Prove it

[gokapso/agent-skills, integrate-whatsapp/references/webhooks-reference.md; integrate-whatsapp-calling/SKILL.md]

The receiver's scope/kind/version is explicit; signature verification precedes effects; all entries/items are considered; duplicates do not repeat an action; the phone identity cannot cross tenants. A retry or batch fixture is evidence only if actually inspected or exercised, and no unperformed live delivery test is claimed.
