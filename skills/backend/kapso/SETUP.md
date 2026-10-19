# Setup and connection ownership

Kapso CLI, project/customer onboarding and inbox contracts from [gokapso/agent-skills, integrate-whatsapp/SKILL.md; references/platform-api-reference.md; references/setup-links.md; references/detecting-whatsapp-connection.md; references/whatsapp-cloud-api-js.md]. General OAuth and connection ownership remain in [third-party-integrations](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/third-party-integrations/SKILL.md).

## Choose the surface

[gokapso/agent-skills, integrate-whatsapp/SKILL.md; references/whatsapp-cloud-api-js.md]

- Prefer the installed authenticated CLI: `kapso login`, then `kapso status`; inspect its current help/version before depending on an operation. Local workflow sync is [WORKFLOWS.md](WORKFLOWS.md).
- Direct API calls use `X-API-Key`. The trusted API host is `https://api.kapso.ai`, or the user's explicitly configured trusted host. The Platform API starts at `/platform/v1`; messaging, templates and media use `/meta/whatsapp/{version}`. Choose a supported Graph version explicitly rather than copying the source's v24.0 as a permanent current version.
- The TypeScript package is `@kapso/whatsapp-cloud-api`, with `WhatsAppClient`, `kapsoApiKey` and the proxy base URL. REST fields use snake_case; SDK options use camelCase. Read the installed types for newer recipient options and wrappers.
- Keys and receiver secrets stay server-side and out of chat, logs and repository files. API responses can contain one-time credentials; inspection output must redact them. Do not import the source's raw secret-output files or package tree as application infrastructure.

## Customers and setup attempts

[gokapso/agent-skills, integrate-whatsapp/references/getting-started.md; references/setup-links.md; references/detecting-whatsapp-connection.md]

- Resolve the intended project with `kapso projects list` and `kapso projects use <project-id>`, then the customer. The direct flow creates a customer with `POST /platform/v1/customers` and a setup link with `POST /platform/v1/customers/:id/setup_links`.
- `kapso setup` and `kapso whatsapp numbers new` prefer dedicated connection plus provisioning. The raw API and CLI defaults are separate contracts; select dedicated/coexistence, provisioning, country/area code, language and redirects for the actual task. Current setup parameters are in [Kapso setup links](https://docs.kapso.ai/docs/platform/setup-links).
- Store the setup-link attempt against the authenticated customer before showing its hosted URL. Preserve its returned identity and expiration; an expired/replaced attempt and a reconnect are not interchangeable connection successes.
- Use the signed project event `whatsapp.phone_number.created` to detect connection. A success redirect is a UI hint: confirm through the project-scoped API, match the saved attempt and customer, then update ownership. The existing [callback ownership rule](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/third-party-integrations/CONNECTIONS.md) still applies.
- Discover connected numbers with `kapso whatsapp numbers list --output json`; resolve the actual display number with `kapso whatsapp numbers resolve --phone-number "<display-number>" --output json`. Use `phone_number_id` for sends and uploads, WABA `business_account_id` for template management.
- Parse a Fetch Response with `response.json()` before reading decoded properties. The source setup-link full example accessed an unparsed Response; [MDN Response.json](https://developer.mozilla.org/en-US/docs/Web/API/Response/json) defines the parsing step. No broken sample is retained here.

## Inbox embeds

[gokapso/agent-skills, integrate-whatsapp/SKILL.md; references/platform-api-reference.md]

- Create with `POST /platform/v1/inbox_embeds`, in an `inbox_embed` envelope. Public scope types are `project`, `customer` and `phone_number`; scope_id is blank for project, a customer UUID for customer, or the Meta phone ID for phone_number.
- Set allowed_origins for the actual embedding app. The source supports `en` and `es` for language; verify current deployment support before adding a locale. Theme API fields are configuration, not permission to replace the owner's app design.
- Creation returns token and embed_url once; store the needed embed URL securely. List/get/update omit these secrets. Use the same resource's GET/PATCH operations to inspect/change it; DELETE revokes it.

## Prove it

[gokapso/agent-skills, integrate-whatsapp/references/detecting-whatsapp-connection.md; references/platform-api-reference.md]

A redirect cannot connect a different signed-in customer; the signed event and API record match the saved attempt; each operation uses the correct ID and trusted host; an embed allows only the intended origins and its one-time token is absent from output. Installation, authenticated access and actual runtime operation are reported separately.
