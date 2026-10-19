# Functions and Project Events

Runtime contracts from [gokapso/agent-skills, automate-whatsapp/references/function-contracts.md; functions-reference.md; functions-payloads.md; triggers.md], with current [Functions overview](https://docs.kapso.ai/docs/functions/overview), [Build locally](https://docs.kapso.ai/docs/workflows/build-locally) and [Project Events](https://docs.kapso.ai/docs/flows/project-events).

## Handler and deployment

- Source Functions begin with `async function handler(request, env)` and omit export/module.exports. Keep env secrets and KV bindings in their documented runtime boundary rather than exposing them in output. [gokapso/agent-skills, automate-whatsapp/references/functions-reference.md]
- request is a Fetch Request; parse JSON with request.json() and return a Response. env.KV exposes get, put and delete; named secrets are env bindings configured in Function settings. Return new vars rather than mutating execution_context in place. [gokapso/agent-skills, automate-whatsapp/references/functions-reference.md]
- Direct Platform API attributes are wrapped under function. Deploy before use and read the resulting endpoint_url; private invocation requires X-API-Key. public_endpoint enables anonymous invocation for supported Cloudflare Functions only, so it changes the trust boundary. [gokapso/agent-skills, automate-whatsapp/references/functions-reference.md]
- Publicness and passthrough are deployment choices, not interchangeable invocation modes. Read the current Function configuration and caller contract before making a private Function public or changing response forwarding. [gokapso/agent-skills, automate-whatsapp/references/functions-reference.md]
- invoke_response_mode passthrough forwards the successful response body directly; wrapped is the legacy contract. Migrate a caller only when it can consume the selected response shape. [gokapso/agent-skills, automate-whatsapp/references/functions-reference.md]
- The overview says the CLI does not manage Functions, but the more specific [Build locally](https://docs.kapso.ai/docs/workflows/build-locally) documents Function pull/build/push. Follow the installed CLI's actual support and the build-local contract; do not repeat the overview's blanket restriction.

## Request shapes

[gokapso/agent-skills, automate-whatsapp/references/function-contracts.md; functions-payloads.md]

| Invocation | Contract distinction |
|---|---|
| Direct invocation | The caller's actual request body, not an assumed workflow envelope |
| Function or Decide node | execution_context with vars/system/context/metadata, available_edges and flow_events |
| Agent function tool | input plus execution_context, flow_events, flow_info and whatsapp_context |
| WhatsApp Flow endpoint | source/flow/data_exchange wrapper in [FLOWS.md](FLOWS.md) |

- Function nodes return vars to merge; Decide nodes can return a next_edge matching an outgoing label. The Function-node page suggests branching via next_edge while the runtime overview reserves it for Decide and says Function continues via next. Keep these contracts separate. [gokapso/agent-skills, automate-whatsapp/references/functions-reference.md]
- An agent tool's input is not execution_context.vars; read the selected mode's envelope instead of searching every payload for a convenient field. [gokapso/agent-skills, automate-whatsapp/references/functions-payloads.md]

## Define, emit and observe

[Kapso Project Events](https://docs.kapso.ai/docs/flows/project-events); [Emit event node](https://docs.kapso.ai/docs/flows/step-types/emit-event-node)

- An Event definition is not an emitted occurrence. Configure its flat scalar property schema, then choose the actual emission path: Emit event node, Function response or agent tool.
- A Function response emits project_events alongside vars, with each event's name and properties; the response's ordinary vars still merge into context. [gokapso/agent-skills, automate-whatsapp/references/functions-reference.md]
- Event names accept any nonempty name; lowercase dotted snake case is recommended for consistency. The source called that naming convention mandatory.
- Match project-event triggers by event name and their optional property filter. Event-triggered observer workflows cannot emit Project Events themselves.
- Current documented quotas are ten emitted events per execution, three per name and five in one Function response. Workflow test mode validates and logs events without persisting them. These are service contracts to recheck before relying on a changed deployment, not generic event-bus limits.
- General durable publication, idempotency and queue retries remain in [messaging](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/messaging/SKILL.md) and [background-jobs](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/background-jobs/SKILL.md); a response array alone is not an exactly-once guarantee.

## Prove it

[gokapso/agent-skills, automate-whatsapp/references/functions-payloads.md; Kapso Project Events documentation linked above]

The handler matches its invocation envelope; public/passthrough changes are deliberate; Function vars and Decide routing are not confused. The Event definition, emitted occurrence and matching observer are separately visible; quota and test-mode behavior are stated, and no observer recursively emits an event.
