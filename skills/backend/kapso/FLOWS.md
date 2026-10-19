# WhatsApp Flows and data endpoints

Native form lifecycle and endpoint contracts from [gokapso/agent-skills, integrate-whatsapp/SKILL.md; references/whatsapp-flows-spec.md; automate-whatsapp/references/functions-payloads.md], corrected against [Kapso Flow JSON](https://docs.kapso.ai/docs/whatsapp/flows/flow-json) and [data endpoints](https://docs.kapso.ai/docs/whatsapp/flows/data-endpoint). A WhatsApp Flow is distinct from a Kapso automation workflow in [WORKFLOWS.md](WORKFLOWS.md).

## Form lifecycle

- Choose static screens when no server exchange is needed; dynamic forms use a registered data endpoint and routing_model. Create the Flow, update its JSON, preview it, then publish/send only within the approved scope. Read current state and validation errors before assuming a draft or published resource can be changed the same way. [gokapso/agent-skills, integrate-whatsapp/references/whatsapp-flows-spec.md]
- Select a schema version supported by the actual target and its current documentation. The source insists on 7.3 while the fetched official Kapso example shows 7.0; neither is proof of the only current supported version. Version/deprecation guarantees are intentionally not copied. [Kapso Flow JSON](https://docs.kapso.ai/docs/whatsapp/flows/flow-json)
- Dynamic endpoints need encryption setup, endpoint deployment and Meta registration; these are separate readiness checks. Kapso injects endpoint_uri/data_channel_uri, so do not place them in authored Flow JSON. [gokapso/agent-skills, integrate-whatsapp/SKILL.md; references/whatsapp-flows-spec.md]

## Request and response

[gokapso/agent-skills, automate-whatsapp/references/functions-payloads.md; integrate-whatsapp/references/whatsapp-flows-spec.md]

- The forwarded request identifies source whatsapp_flow and the Flow's local/meta identities. data_exchange carries action INIT, data_exchange or BACK, current screen, submitted data and flow_token; the wrapper can include signature_valid and received_at.
- The handler receives request and env. Read the submitted values under data_exchange, rather than assuming a raw Meta endpoint envelope. Return version 3.0, screen and data; completion uses SUCCESS with extension_message_response.params.
- The supplied mini-handler omitted version and completion structure. Use the complete [official endpoint contract](https://docs.kapso.ai/docs/whatsapp/flows/data-endpoint), which also documents a 15-second timeout; do not turn the source's approximate timing into a different confirmed deadline.

## Authenticate and authorize

[gokapso/agent-skills, integrate-whatsapp/references/whatsapp-flows-spec.md; repository secure-coding and api-design rules]

- Verify the trusted forwarding boundary. signature_valid is meaningful only from the authenticated Kapso wrapper; caller-supplied JSON cannot establish signature validity.
- flow_token alone is not proof of customer identity. Bind the session/Flow to server-side ownership and authorize every requested resource or mutation, as in [api-design](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/api-design/SKILL.md).
- Source examples log request bodies, data and external responses. The existing integration rule excludes bodies/auth headers; keep bounded, redacted diagnostics and exact IDs/statuses instead. [third-party-integrations CALLS-AND-SYNC.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/third-party-integrations/CALLS-AND-SYNC.md)
- A protocol-scoped business-validation response is not permission to return success for forged signatures or unauthorized access. Preserve the existing fail-closed boundary. [secure-coding](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/secure-coding/SKILL.md)

## Prove it

[gokapso/agent-skills, integrate-whatsapp/references/whatsapp-flows-spec.md]

The selected schema, routing and endpoint match; preview, deployment, encryption and registration are separate evidence; request shape and response/completion fields agree. A forged wrapper flag or another customer's flow_token cannot authorize access, and diagnostics contain no raw answers or credentials.
