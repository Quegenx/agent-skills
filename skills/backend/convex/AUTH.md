# Authentication and authorization

These Convex boundaries come from [get-convex/agent-skills, convex-auth, convex-authz, convex-reviewer, convex-create-component], with current official authentication forms. General authentication policy stays in [secure-coding](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/secure-coding/AUTH.md).

## Identity is not a users-table lookup

- **Honor the configured provider.** getUserIdentity reflects verified authentication; an externally supplied JWT identity does not require a subject-keyed local users table. A local row may hold application profile or authorization data. The source said getUserIdentity always returns null without that table, which is wrong. [https://docs.convex.dev/auth/functions-auth; https://docs.convex.dev/auth/database-auth]
- **If selecting Convex Auth, use its actual setup.** Its authTables, convexAuth setup, auth.config.ts, auth.addHttpRoutes and client provider are part of the integration. The source described adding @convex-dev/auth as a convex.config.ts component and omitted essential tables/routes; the published package is not that component interface. Do not assume an unspecified pinned Passkey build is the current published API. [https://labs.convex.dev/auth/setup; https://labs.convex.dev/auth/setup/manual; https://github.com/get-convex/convex-auth/blob/main/package.json]
- **Use the owner's sign-in UI.** Backend auth setup does not authorize replacing the production app-ui, landing-page-ui or agent-chat-ui designs. [user owner-design rule]

## Public functions and referenced parents

- **Check the authenticated caller before private reads or writes.** Use the application's existing identity and membership helpers, then check the target document and any referenced parent under the same authorization model. An authenticated user is not automatically an authorized owner. [get-convex/agent-skills, convex-authz]
- **Check every ID supplied by the caller.** A child creation must establish access to its parent; an update must not move a resource into an unauthorized parent or overwrite owner/tenant fields from the request. A returned document must not expose private fields merely because its ID is valid. [get-convex/agent-skills, convex-authz, convex-reviewer]
- **Treat the source's four audit shapes as leads.** Missing identity checks, unguarded document IDs, unchecked parent references and exposed private fields require a full caller/control trace before a finding. Regex hits alone cannot prove absence of a shared helper or an intentionally public contract. [get-convex/agent-skills, convex-authz]
- **Components do not authorize the application's user automatically.** Authenticate in an app wrapper, authorize access to app resources, and pass the component only the validated data it needs. Cross-boundary IDs do not grant permission. [get-convex/agent-skills, convex-create-component]

## Prove it

Trace anonymous, owner, different-user and different-parent paths through each changed public boundary, including output fields. Confirm the provider and auth routes match actual configuration, and distinguish a missing local profile from a missing authenticated identity. Runtime cases are acceptance evidence, subject to the user's permission to run tests. [get-convex/agent-skills, convex-authz, convex-verify]
