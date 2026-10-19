# kitcn authentication and organizations

This optional branch comes from [udecode/kitcn, references/features/auth.md, references/features/auth-admin.md, references/features/auth-organizations.md, references/features/auth-polar.md, references/setup/auth.md] and current kitcn, Better Auth and Polar documentation. Use the application's selected identity provider. The canonical caller, ownership, parent-membership and output boundaries remain in [AUTH.md](AUTH.md); kitcn bootstrap and client transport are in [KITCN-SETUP.md](KITCN-SETUP.md) and [KITCN-REACT.md](KITCN-REACT.md).

## Auth contract and entrypoints

[udecode/kitcn, references/features/auth.md, references/setup/auth.md; https://kitcn.dev/docs/auth/server; https://kitcn.dev/docs/auth]

The local kitcn approach stores auth tables in the application's schema rather than an isolated auth component. `<functionsDir>/auth.ts` default-exports `defineAuth(() => options)` from its generated auth module. Keep runtime auth exports in `<functionsDir>/generated/auth`; do not manually create a parallel auth client/API/static-auth export in the definition file. `functionsDir` comes from `convex.json.functions`.

| Entrypoint | Role |
|---|---|
| `getSession(ctx)` from `kitcn/auth` | Query/mutation session-row access, including shared cRPC authentication middleware. |
| Generated `getAuth(ctx)` | Modules that actually call `auth.api.*`: authenticated actions, HTTP routes, organization/admin operations. |
| `getAuthUserIdentity(ctx)` | Identity with user ID, session ID and subject. |
| `getAuthUserId(ctx)` | User ID or null. |
| `getHeaders(ctx)` | Auth forwarding headers, including Authorization and forwarded request information. |

Generated `getAuth` selects a direct database adapter in query/mutation contexts with `ctx.db` and an HTTP adapter using `ctx.run*` in action/HTTP contexts. The direct path avoids a wrapper call; separate action-side query/mutation calls still have [separate transactions](FUNCTIONS-AND-DATA.md#function-boundaries). Keep `getAuth` out of the shared query/mutation builder module: importing it brings the Better Auth definition and plugins into that module's static dependency closure. Use the lightweight session helper there and the separate `convex/lib/crpc-action.ts` module for authenticated actions. Do not claim measured or zero overhead from this routing rule.

Changing auth plugins or fields requires refreshing auth-owned schema blocks through `kitcn add auth --schema`. Core tables are user, session, account, verification and jwks. The raw Convex auth preset has its own `authSchema.ts` path and does not support this schema-only refresh flag; see [setup ownership](KITCN-SETUP.md).

## JWT, session and public-boundary enforcement

[udecode/kitcn, references/features/auth.md, references/setup/auth.md; https://kitcn.dev/docs/auth; https://docs.convex.dev/auth/functions-auth]

JWT validation verifies signature/expiry; a live session lookup separately checks the stored session and expiry. A valid JWT does not establish current session validity or resource permission. Deleting the session affects paths that actually consult that record. The source's claim that every request automatically performs this second check is too broad for its shown HTTP builders: `ctx.auth.getUserIdentity()` alone does not demonstrate that lookup, and `authMiddleware(getAuth)` only handles auth routes before passing other paths onward. [https://github.com/udecode/kitcn/blob/main/packages/kitcn/src/auth/middleware.ts]

| Builder requirement | Implementation boundary |
|---|---|
| Public | No implied authentication from a name or metadata. |
| Optional auth | Resolve session/user and pass nullable user/userId deliberately. |
| Required auth | Reject an absent session/user server-side before passing non-null user/userId. |
| Required role/permission | Run the actual middleware/check; client gating and `.meta({ role })` alone do not enforce it. |
| Protected action | Resolve through `auth.api.getSession` in its action-specific builder; actions have no direct `ctx.db`. |

The source core's `authMutation` used optional metadata and never called its required-auth guard. The [complete authenticated setup](https://kitcn.dev/docs/auth/server) and the canonical public boundary require server enforcement; do not copy that mislabeled builder. Generated [Handler composition bypasses middleware](KITCN.md), so a caller cannot assume a callee re-runs these checks.

kitcn documents a 15-minute JWT default and a 60-second client refresh leeway; the displayed session configuration explicitly chooses 30 days and a 15-day update age. Treat those session numbers as configuration, not Better Auth's universal default. Static JWKS avoids dynamic key retrieval; the source's instant-validation and 100-to-400-millisecond claims are unmeasured and are not guarantees.

`convex({ authConfig, jwks?, jwt?, options? })` configures the plugin. `jwt.expirationSeconds` controls expiry; `jwt.definePayload` can choose claims. The documented default excludes user `id`/`image` and includes session ID/issued-at information; `sessionId` and `iat` are added even with a custom payload. A custom auth base path must match the HTTP registration base path. Never treat client-visible claims or profile fields as automatic object permission. [https://kitcn.dev/docs/auth/server#customizing-jwt-tokens; https://kitcn.dev/docs/auth/server#custom-base-path]

## Auth lifecycle hooks

[udecode/kitcn, references/features/auth.md; https://kitcn.dev/docs/auth/server; https://kitcn.dev/docs/orm/schema/triggers]

Place auth hooks in `defineAuth(() => ({ triggers }))`. Their table shape is nested create/update/delete/change, with data/document first and the trigger context second. Auth API lifecycle hooks and schema ORM hooks have different coverage; the latter's [write-path behavior](KITCN-ORM.md#writes-rls-and-hooks) is not a reason to assume every unwrapped raw writer is covered.

| Callback | Contract |
|---|---|
| `create.before(data, triggerCtx)` | Continue unchanged, return `{ data }` for a shallow merge, or return false to cancel. |
| `create.after(doc, triggerCtx)` | Post-create work in the CRUD transaction. |
| `update.before(update, triggerCtx)` | Before-update payload handling. |
| `update.after(newDoc, triggerCtx)` | Post-update work; use `change` when old/new comparison is needed. |
| `delete.before(doc, triggerCtx)` / `.after(doc, triggerCtx)` | Delete lifecycle work. |
| `change(change, triggerCtx)` | Operation, ID, old document and new document across insert/update/delete. |

The source uses these hooks for linked profiles, avatar synchronization, active-organization restoration and scheduled welcome work. Keep work bounded, avoid recursive chains, and [schedule external work](KITCN-SCHEDULING.md) from an appropriate mutation/action-capable context. If a hook can execute in mutation-driven auth, use `requireSchedulerCtx` for scheduling; narrowing it to ActionCtx does not make external I/O valid in a mutation.

## Client authentication, recovery and identity

[udecode/kitcn, references/features/auth.md; https://kitcn.dev/docs/auth/client]

`createAuthMutations(authClient)` supplies the sign-in, social sign-in, sign-up and sign-out mutation-option hooks. Plugin-specific methods need the matching Better Auth client plugin; `signInMethod` selects an added sign-in method. Email/password requires that server capability to be enabled. `useSignOutMutationOptions` unsubscribes auth queries before sign-out and remains pending until the token clears; keep [client/provider setup](KITCN-REACT.md) in its canonical topic.

| Surface | Meaning |
|---|---|
| `useAuth()` | `hasSession`, `isAuthenticated`, `isLoading`. Session presence can be optimistic; confirmed authentication is a separate state. |
| `useMaybeAuth`, `MaybeAuthenticated`, `MaybeUnauthenticated` | Token/session-presence UI gates. |
| `useIsAuth`, `Authenticated`, `Unauthenticated` | Confirmed auth gates, subject to the documented optimistic window. |
| `useAuthGuard()` | Returns true when blocked; can guard an event callback. It does not replace server authorization. |
| `useConvexAuthRecovery()` | `recover`, `status`, `error` for transient Convex auth loss while the outer provider remains authenticated. |

Recovery replaces the provider-owned auth binding and resolves after Convex confirms authentication. Concurrent recoveries share one promise; default timeout is 10 seconds with a `timeoutMs` override. Failures use `ConvexAuthRecoveryError` codes `AUTH_PROVIDER_LOADING`, `AUTH_PROVIDER_UNAUTHENTICATED`, `AUTH_RECOVERY_CANCELLED`, `AUTH_RECOVERY_FAILED`, `AUTH_RECOVERY_TIMEOUT`. Do not recover an intentional sign-out.

`optimisticAuth` opens query gates only for a held unexpired JWT until the client's first auth result; expired, opaque or refused tokens do not open them. Use one setting for every provider sharing a client. A client already authenticated by the Start loader has no such optimistic window.

`onTokenIdentityChange` enables the document identity guard. It compares JWT `sub`/`sessionId`, refuses a changed identity before publishing/forwarding, closes guarded clients and invokes the callback; the documented response is a document reload. A trip is browser-page-wide: mounted providers publish unauthenticated/no token; later providers start tripped, and guarded providers mounting/showing/enabling on a tripped page close and notify once. Sign-in mutations fail with `TOKEN_IDENTITY_CHANGED` until reload.

For multiple provider mounts, `tokenIdentityBaseline` is `sub|sessionId` or a getter for that identity. Admissions check the page identity, provider baseline and mounted getter answers, including SSR/fresh/cached/sign-in/HTTP/Start-loader tokens. Held tokens reconcile when a provider joins. Once established, page identity lasts until reload, even after that provider unmounts. An opaque session token is exchanged for a JWT rather than sent to Convex. Two kitcn versions/revisions on one page, including development HMR across revisions, are unsupported until reload. `onTokenIdentityAdmitted` observes admitted tokens; baselines are checked again after its callback. These identity options require `onTokenIdentityChange`.

The guard covers kitcn-supplied tokens, not an Authorization header supplied by the application through `httpOptions.headers`. SSR initial-token and hydration mechanics remain in [KITCN-REACT.md](KITCN-REACT.md). [https://kitcn.dev/docs/auth/client#optimistic-auth-and-document-identity]

## Admin operations

[udecode/kitcn, references/features/auth-admin.md; https://kitcn.dev/docs/auth/plugins/admin; https://www.better-auth.com/docs/plugins/admin]

Add the server admin plugin and `adminClient` only when selected. The plugin schema includes user role, banned status, ban reason and ban expiry. Source examples use `role === 'admin'`; its separate `isAdmin` field is an application convention, not a substitute for consistent role enforcement. Custom access control uses `createAccessControl`, statements, `ac.newRole` and matching server/client role definitions.

| Standard operation | Client surface |
|---|---|
| Create/list/update/remove users | `authClient.admin.createUser`, `listUsers`, `updateUser`, `removeUser`. |
| Role/password management | `setRole`, `setUserPassword`. |
| Ban/unban | `banUser`, `unbanUser`; ban duration/reason are explicit options. |
| Session administration | `listUserSessions`, `revokeUserSession`, `revokeUserSessions`. |
| Permission checks | `hasPermission` makes a server check; `checkRolePermission` is a client role check. |

Use the plugin's standard authorized operations; custom Convex admin functions must actually run the required role/permission middleware. The source `getAllUsers` lacked its admin metadata gate while returning email, role and ban information. Its capped/estimated dashboard counts are replaced by the [exact indexed metric contract](KITCN-AGGREGATES.md#finite-groups), not a copied estimate.

The source's ADMIN environment allowlist and role assignment are optional application policy, not an installed-plugin authorization guarantee. Keep role creation, caller identity and protected output tied to the application's [actual authorization checks](AUTH.md#public-functions-and-referenced-parents).

## Organizations, invitations and teams

[udecode/kitcn, references/features/auth-organizations.md; https://kitcn.dev/docs/auth/plugins/organizations; https://www.better-auth.com/docs/plugins/organization]

Select `organization(...)` server-side and `organizationClient(...)` client-side, with matching access-control roles and optional teams. Organization, member and invitation tables, optional team/teamMember tables, and active organization/team session fields form the integration. Refresh auth-owned schema after plugin/field changes. The source client exported organization hooks without adding its organization client plugin; those hooks require that plugin.

| Product policy | Source configuration surface |
|---|---|
| Organization creation | `allowUserToCreateOrganization`, `organizationLimit`, `creatorRole`. |
| Membership/invitations | `membershipLimit`, `invitationExpiresIn`, `sendInvitationEmail`. |
| Teams | `teams.enabled`, `maximumTeams`, matching client teams configuration. |
| Shared roles | `createAccessControl`, statements and server/client roles. |
| Custom fields | Current Better Auth `schema.<model>.additionalFields`; keep matching ORM columns. |
| Existing field-name mapping | `schema.<model>.fields` maps existing names; it is not the source's custom-field validator declaration. |
| Lifecycle callbacks | Current `organizationHooks`. |
| Dynamic roles | Current `dynamicAccessControl.enabled` and its documented access-control setup. |

The source used `schema.<model>.fields` with Convex validators for new fields, `organizationCreation`/`membershipManagement`/`invitationManagement`/`teamManagement` hook containers, and a custom `ac.resolveRole`. The [current Better Auth organization contract](https://www.better-auth.com/docs/plugins/organization) owns those forms; do not copy the old recipe or invent a compatibility adapter.

Use Better Auth's operations for organization creation/deletion, invitations, membership and teams; simple authorized single-table reads/updates can use the ORM. A Better Auth operation that invokes Stripe, Polar or direct email SDK work belongs in an `authAction`, not a mutation. Invitation email can schedule follow-up work through `requireSchedulerCtx` when triggered from mutation-backed auth. The source's permission helper assumed `ctx.auth.api`/headers that its supplied builders did not inject; use the actual generated `getAuth` contract and application context rather than copying that incomplete helper. [https://kitcn.dev/docs/auth/server; https://kitcn.dev/docs/auth/plugins/organizations]

| Flow | Surface and boundary |
|---|---|
| Organization switch/create/list | `useActiveOrganization`, `useListOrganizations`, `organization.setActive`, `.create`, `.list`; state is not permission. |
| Full organization | `getFullOrganization` returns organization, members and invitations under its authorized API. |
| Invitations | `createInvitation`, `acceptInvitation`, `rejectInvitation`, `cancelInvitation`; check target organization/recipient and lifecycle state. |
| Members | `getActiveMember`, `addMember`, `updateMemberRole`, `removeMember`, `leave`; establish the target organization and caller permission. |
| Teams | `listTeams`, `createTeam`, `setActiveTeam`, `addTeamMember`, `removeTeamMember`, `listTeamMembers`; select teams explicitly. |
| UI permission | `organization.hasPermission`; showing a control never replaces the server check. |

The source seat-limit workflow counts members plus pending invitations using declared aggregate indexes before creating an invitation, and handles existing pending invites for the same recipient. Keep the [readiness and exact-count contract](KITCN-AGGREGATES.md#repair-and-operational-checks); do not substitute a bounded prefix's length. Its personal-organization and last-owner protections are application policy, not universal plugin defaults. Invitation expiry declared as `integer()` does not turn into `Date` on read; the source's `z.date()` output disagreed with that declaration. Use the [actual temporal column contract](KITCN-ORM.md#tables-columns-and-stored-values).

The source's public session list, admin list and subscription cancellation examples do not establish the required caller/ownership boundary. Keep session tokens private and deliberate projections under the canonical [output and parent checks](AUTH.md#public-functions-and-referenced-parents); source sample code is not a grant to expose auth records.

## Polar version and authority boundaries

[udecode/kitcn, references/features/auth-polar.md; https://polar.sh/docs/integrate/sdk/adapters/better-auth]

The source uses an older `new Polar(...)`, camelCase SDK payloads and a Buffer polyfill. The current official adapter documentation uses SDK 1.0.0, `createPolarCore` from `@polar-sh/sdk/2026-10`, environment/operation imports, snake_case payloads and `polarClient` from `@polar-sh/better-auth/client`. Its stated runtime requirements include Better Auth 1.7 and Node 22. A Buffer assignment does not establish compatibility with the application's Convex runtime. Hold the complete integration until actual versions, exports and runtime support are established; these differences do not prove every older release rejected the old forms.

| Boundary | Current official form and source correction |
|---|---|
| Organization subscriptions | `customer.subscriptions.list` with `reference_id` and `active`, then the paginated `items` and `product_id`; the source called `orders.list` with `referenceId` and `.some` on the result. |
| Tenant authorization | The plugin does not verify membership for `reference_id`. Authorize the organization before granting access; casting metadata to an ID does not do that. |
| Usage | Current `usage.ingest` replaces the source's `usage.ingestion`. Browser metadata is non-authoritative signal; billable usage comes from the authenticated server operation that performed the work. |
| Webhooks | Validate the provider signature and use its current typed event contract; retain billing state through authorized server handlers. |
| User-facing SDK work | Cancellation/resume are actions. Their database reads and writes use the application's generated procedure boundaries. |

The source subscription-create handler threw conflict on a duplicate event and the customer-create action swallowed failures. Current provider callback failures can fail the webhook request and lead to retries; do not promote those examples into a complete delivery/recovery contract. General idempotency and uncertain external effects remain in [external side effects](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/background-jobs/EXTERNAL-SIDE-EFFECTS.md) and [third-party integrations](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/third-party-integrations/CALLS-AND-SYNC.md#webhooks-from-providers), rather than a new inferred Polar implementation.

## Prove it

[udecode/kitcn, references/features/auth.md, references/features/auth-admin.md, references/features/auth-organizations.md, references/features/auth-polar.md; https://kitcn.dev/docs/auth/server; https://kitcn.dev/docs/auth/client; https://www.better-auth.com/docs/plugins/organization; https://polar.sh/docs/integrate/sdk/adapters/better-auth]

- Trace the selected provider, generated auth contract, actual session check and public authorization boundary; do not infer enforcement from metadata, client gates or a valid JWT.
- Verify hooks, auth schema types, required client plugins and external-I/O function kind against installed versions.
- Demonstrate owner/other-user/anonymous paths and intentional output projection; distinguish optional auth from required auth and admin access.
- Check sign-out cleanup, recovery conditions, optimistic gates and page-identity refusal without extending the guard to application-supplied headers.
- Verify organization permission, invitation/seat-count readiness and actual expiry types.
- Keep Polar version/runtime uncertainty explicit, authorize every organization reference and identify authoritative usage and verified webhook state. Record unperformed runtime checks under [TESTING.md](TESTING.md).
