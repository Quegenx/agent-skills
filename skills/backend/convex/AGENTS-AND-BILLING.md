# Agents and billing

Integration details come from [get-convex/agent-skills, convex-agent, convex-billing, convex-suggest] and current first-party component documentation. Agent architecture and payment semantics remain with their existing owners; this topic covers the Convex boundaries.

## Agents, threads and retrieval

- **Use the installed Agent component's threads, messages, tools and retrieval contracts.** Keep model/provider calls in actions, and route app data through authorized queries or mutations. An agent tool remains an authorization boundary even when the model selects a valid schema. [get-convex/agent-skills, convex-agent; https://docs.convex.dev/agents]
- **Use the current AI Gateway setup rather than an older overview sample.** The gateway supports embeddings. Project-linked authenticated local deployments are supported with convex 1.46+; anonymous and self-hosted backends are not. Agent/RAG integration requires convex 1.46+, rather than assuming the general token API's 1.45 floor suffices. The source said the gateway had no embeddings and every local backend required a provider-key fallback. [https://docs.convex.dev/ai-gateway/overview; https://docs.convex.dev/ai-gateway/setup]
- **Keep provider keys and environment values out of reports and logs.** Inspect configuration by name or presence; do not upload conversations or source transcripts as a maintenance step. The source's transcript-sharing workflow is outside ordinary application work. [get-convex/agent-skills, convex-env, convex-improve-convex-plugin; user authorization rules]
- **Reuse canonical agent and retrieval guidance.** Tool gates and untrusted content are in [agent-harness](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-harness/SKILL.md); RAG evidence and embeddings are in [ai-features](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/ai-features/SKILL.md). [get-convex/agent-skills, convex-agent]

## Stripe component

- **Read the installed @convex-dev/stripe setup.** Register the component, wire registerRoutes for its webhook endpoint and use the current StripeSubscriptions/client query interface from the first-party README. Configure the correct Stripe account, API key and webhook secret; do not infer success from a client redirect. [get-convex/agent-skills, convex-billing; https://github.com/get-convex/stripe]
- **Keep application identity in the wrapper.** Bind the authenticated app user to the intended Stripe customer and subscription, and expose only that user's billing state. Component registration does not supply app authorization. [get-convex/agent-skills, convex-billing, convex-authz]
- **Use one payment-authority definition.** Event verification, asynchronous payment completion, idempotent fulfillment and subscription lifecycle belong to [stripe WEBHOOKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/WEBHOOKS.md) and [stripe BILLING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/BILLING.md). Do not add a second handwritten payment state machine from a component scaffold. [get-convex/agent-skills, convex-billing; existing Stripe owners]

## Prove it

The installed component exports match the app configuration, route and generated references; agent tools preserve app authorization; gateway availability and embeddings are checked at the installed version; subscription queries are scoped to the authenticated customer; no secret, transcript or payment mutation was exposed by verification. [get-convex/agent-skills, convex-agent, convex-billing, convex-verify]
