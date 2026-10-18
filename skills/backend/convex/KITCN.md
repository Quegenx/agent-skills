# kitcn procedures and generated calls

For applications that select kitcn, this guidance comes from [udecode/kitcn, SKILL.md, references/setup/server.md] and the [current procedure docs](https://kitcn.dev/docs/server/procedures). Read [setup](KITCN-SETUP.md) when generated imports or providers are missing; use the existing [Convex function contract](FUNCTIONS-AND-DATA.md) outside this adapter. The source's ORM/cRPC preference does not replace an application's selected data layer.

## Feature decisions

[udecode/kitcn, SKILL.md, sections 1 to 4]

Resolve the endpoint's public, optional-auth, authenticated or private boundary; data invariants; list/detail/relation/search shape; offset/cursor/infinite pagination; inline/trigger/scheduled effects; client/RSC/server-only consumption; and unauthorized, forbidden, missing, conflicting and rate-limited outcomes. The source's feature order is schema/indexes/relations, invariant maintenance, procedures, client hooks and selected HTTP/scheduling integration. Acceptance evidence belongs in Prove it, not automatic test execution.

| Feature surface | Source application location |
|---|---|
| Schema and feature procedures | `convex/functions/schema.ts`, `convex/functions/<feature>.ts` |
| Shared procedure families | `convex/lib/crpc.ts` |
| Authenticated action builders | `convex/lib/crpc-action.ts` |
| Client cRPC context | `src/lib/convex/crpc.tsx` |
| HTTP and recurring work | `convex/functions/http.ts`, `convex/routers/`, `convex/functions/crons.ts` |

These are the source layout; resolve configured directories through [setup](KITCN-SETUP.md), rather than hardcoding them into another application.

## Inputs, outputs and context

[udecode/kitcn, SKILL.md, sections 2, 6 and 7; https://kitcn.dev/docs/server/procedures; https://kitcn.dev/docs/server/context]

- The input root is `z.object(...)`; stacked `.input(...)` calls merge object shapes. Primitive root inputs are unsupported.
- `.output(...)` parses the handler's value as returned. A transformed schema expects its input type at that boundary. An absent nullable lookup must return explicit `null`, not `undefined`.
- Omit `.output(...)` for a no-value mutation. Do not declare `z.void()` or a top-level `.optional()` output: Convex converts an undefined return to null, while the published optional-output validator cannot represent that top-level optionality. Optional fields inside an object remain valid.
- The low-level `returns:` option of `zCustomQuery`, `zCustomMutation` and `zCustomAction` differs: it replaces undefined with null before parsing. Do not transfer that behavior to cRPC `.output(...)`.
- Declare `.paginated({ limit, item })` before `.query()`. Its cursor input/output and live-page bounds are owned by [the React pagination section](KITCN-REACT.md#infinite-queries).
- Generated `initCRPC` supplies the application's data model and ORM context. Manual setup uses `initCRPC` from `kitcn/server`, `.dataModel()` and optional `.context()`; avoid a second handwritten ORM context alongside the generated one.
- `orm.with(ctx)` preserves query-reader versus mutation-writer capabilities. A write-capable handler must have a mutation context, not an `OrmReader`.
- Shared `c.middleware()` chains preserve mutation writer types. Middleware that writes must be mutation-only, using `c.middleware<MutationCtx>(...)`.
- Date wire serialization uses the built-in `$date` representation. A configured transformer is additive and can have separate input/output directions; it does not disable the built-in Date handling.

## Metadata and authorization

[udecode/kitcn, SKILL.md, section 6; https://kitcn.dev/docs/server/metadata; https://kitcn.dev/docs/server/middlewares]

- `.meta(...)` shallow-merges metadata and supports `defaultMeta`. Generated client-visible metadata must contain no secrets. Distinguish the generated raw leaf from the React proxy's `.meta` accessor when inspecting the actual generated API.
- Middleware receives server-only `procedure` information. With the application's generated server helper, ordinary exported query/mutation/action declarations infer `module:function` from path and export name; `.name(...)` handles overrides or unusual export shapes.
- Metadata labels such as `auth: 'required'` and `role: 'admin'` describe policy and client behavior. Runtime middleware must enforce that policy. Client auth loading/skipping is described in [KITCN-REACT.md](KITCN-REACT.md); it is not a server access check.
- Build the public, optional-auth, authenticated and private families once. Session lookup, action-only auth imports and the corrected authenticated builder are owned by [KITCN-AUTH.md](KITCN-AUTH.md). Object/parent permissions remain in [AUTH.md](AUTH.md#public-functions-and-referenced-parents).

The source's mislabeled authMutation is covered by [the authenticated-builder correction](KITCN-AUTH.md#jwt-session-and-public-boundary-enforcement). [udecode/kitcn, SKILL.md, section 6; references/setup/auth.md]

## Generated call boundaries

[udecode/kitcn, SKILL.md, sections 2 and 7; https://kitcn.dev/docs/server/server-side-calls; https://kitcn.dev/docs/server/procedures#in-process-procedure-composition]

| Operation | Generated helper and boundary |
|---|---|
| Deliberately raw query/mutation composition | `create<Module>Handler(ctx)` from `generated/<module>.runtime`; query/mutation contexts only |
| Wrapped query/mutation composition | `create<Module>Caller(ctx)` preserves the procedure wrapper in query/mutation contexts |
| Calls from actions or HTTP routes | Generated Caller dispatches query/mutation calls through Convex, with separate transactions |
| Action procedures | `caller.actions.*` dispatches through `ctx.runAction` |
| Scheduled procedures | `caller.schedule.*`; details in [KITCN-SCHEDULING.md](KITCN-SCHEDULING.md) |
| Context narrowing | `requireActionCtx(ctx)` for an actual action callback; `requireSchedulerCtx(ctx)` for a scheduling-capable mutation/action context |

The raw Handler bypasses **input validation, middleware and output validation**. A caller relying on a callee's auth, role or rate-limit middleware must preserve the wrapped boundary. The source described Handler as the universal default with only redundant validation/middleware removed; the [official contract](https://kitcn.dev/docs/server/procedures#in-process-procedure-composition) explicitly includes those bypasses. Do not turn its unmeasured "zero overhead" phrase into a guarantee.

Within the selected kitcn module API, the source prefers generated runtime helpers over direct `ctx.runQuery`, `ctx.runMutation` and `ctx.runAction`. This is a scoped composition convention; [native generated Convex references](FUNCTIONS-AND-DATA.md#function-boundaries) remain valid for raw functions outside that API. Both Caller and Handler eagerly load their module; split large procedure modules when that dependency closure matters. [udecode/kitcn, SKILL.md, sections 2 and 7]

## Errors

[udecode/kitcn, SKILL.md, section 7; https://kitcn.dev/docs/server/error-handling]

Throw `CRPCError` from `kitcn/server` for expected failures. Its code and custom `data` become client-visible payload; keep that data deliberate and small. The client envelope and owner UI behavior are owned by [KITCN-REACT.md](KITCN-REACT.md#error-envelopes-and-owner-ui).

| Code | Source meaning | HTTP status |
|---|---|---:|
| `BAD_REQUEST` | Invalid input or business precondition | 400 |
| `UNAUTHORIZED` | No authenticated session | 401 |
| `FORBIDDEN` | Authenticated caller lacks permission | 403 |
| `NOT_FOUND` | Missing or inaccessible resource | 404 |
| `CONFLICT` | Duplicate or conflicting write | 409 |
| `UNPROCESSABLE_CONTENT` | Unprocessable content | 422 |
| `TOO_MANY_REQUESTS` | Rate limit | 429 |
| `INTERNAL_SERVER_ERROR` | Unexpected failure or failed output validation | 500 |

The HTTP status mapping is also specified in [udecode/kitcn, references/features/http.md, Error codes; https://kitcn.dev/docs/server/http].

A failed `.output(...)` parse produces `INTERNAL_SERVER_ERROR`, message `Output validation failed` and sanitized structural issues in `error.data.ZodError`. Custom issue messages and output-bearing fields stay server-side. Do not treat an output validation failure as a client input error. [udecode/kitcn, SKILL.md, section 7; https://kitcn.dev/docs/server/error-handling]

## Prove it

[udecode/kitcn, SKILL.md, sections 7, 11 and 12; references/features/testing.md]

Trace a successful query/mutation, unauthenticated rejection, authenticated non-owner rejection where relevant, missing resource, conflict, rate limit and selected trigger/scheduler effects. Verify the actual wrapper used on every inter-procedure call. A not-found case must reach the intended lookup with a real ID or a semantic lookup key; a fabricated ID can fail validation first. The source's ownership template never authenticates the non-owner, and its inserts omit the returning contract, so those templates are not executable proof. Use [the existing Convex testing guidance](TESTING.md) for harness scope and scheduler completion. Record unperformed runtime checks; do not run tests or builds without the user's request. [https://docs.convex.dev/testing/convex-test; https://kitcn.dev/docs/orm/mutations; user standing rules]
