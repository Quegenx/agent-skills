# The tool contract and registering it in the app

## The browser API

- **Get the context with both accessors:** `const modelContext = navigator.modelContext || document.modelContext;`. Current Chrome exposes `document.modelContext` as a native `ModelContext` while `navigator.modelContext` is `undefined`, so the fallback is load-bearing, not defensive. The surface is browser-provided, so the app ships no polyfill.
- **A tool definition** has `name`, `description`, `inputSchema` (a JSON Schema object), `annotations` (`readOnlyHint`, `untrustedContentHint`) and `execute: async (input) => result`.
- **Registration and cleanup are still moving.** One reading: `registerTool` returns a promise and is idempotent by name, re-registering replaces the previous definition, and there is no unregister handle, so remounts and hot reload need no teardown. Another (the generated init script, run under Chrome's WebMCP testing flags): `navigator.modelContext.unregisterTool(name)` in try/catch before each `registerTool`. WebMCP browser APIs are still evolving: check the browser and project versions before choosing cleanup behavior, register once at the application root, use supported abort or unregister behavior when present, guard development hot reload against duplicate names, and do not guess an unregistration signature.
- **Error text does not reach the caller.** The WebMCP layer replaces a handler's message with a generic invocation-failed string, so tests assert accepted vs rejected, never the message.
- **Annotation names differ between registration and discovery.** You register `readOnlyHint` and `untrustedContentHint`; Stagehand v4 reports discovered annotations as `readOnly`, `untrustedContent` and, for declarative forms, `autosubmit`. Keep that distinction in tests.

## Design the contract

- **Name:** a stable verb-noun. **Description:** the user-visible effect, prerequisites and important exclusions.
- **Schema from the app's validator.** Derive the JSON Schema from the existing validator or domain type; do not invent a second, looser contract.
- **Closed at both ends.** `additionalProperties: false` on object schemas, and configure the runtime validator to reject unknown keys rather than strip or accept them. A closed discovery schema backed by a permissive runtime parser is not a closed contract.
- **Validate again in the handler.** Agent-provided input is untrusted; keep discovery and runtime acceptance aligned.
- **Results:** compact, JSON-serializable domain results. Never DOM nodes, credentials, cookies, tokens or whole HTML documents.
- **Never echo the request back as the result.** Read the outcome from the application's own state. React and most reactive stores do not reflect a change on the next line, so poll until it settles, then report what is actually true.

## Risk classes

| Risk | Tool design | Annotation and confirmation |
|---|---|---|
| Read-only | No state mutation | `readOnlyHint: true`; add `untrustedContentHint: true` when output includes page or user-controlled text |
| Reversible mutation | Drafts, preferences, cart edits | `readOnlyHint: false`; preserve auth and idempotency; test only with disposable state |
| Consequential or irreversible | Purchase, send, publish, delete, permission changes | Split preview/prepare from commit where possible; no declarative `toolautosubmit`; keep the final action behind the app's real confirmation control |

Annotations are hints to the browser or agent, not security enforcement. The application enforces permissions, validation, confirmation, idempotency and replay protection.

## Imperative or declarative

| Use | When |
|---|---|
| Imperative (`registerTool`) | The app already has a typed client or service function, and the tool should return a structured result without UI navigation |
| Declarative (form attributes) | A visible form is the source of truth and user review is part of the flow |

Current experimental Chromium builds recognize `toolname` and `tooldescription` on `<form>` and `toolparamdescription` on inputs; `toolautosubmit` makes it submit automatically. Never add automatic submission to payment, message sending, publishing, deletion, permission changes or any other consequential form.

```html
<form toolname="search_catalog" tooldescription="Search the public product catalog.">
  <input
    name="query"
    required
    toolparamdescription="Words in the product name or description"
  />
  <button type="submit">Search</button>
</form>
```

## Register in the app

- **Client-only, after the app is ready.** Register imperative tools from a client-only root or provider. Keep definitions next to the existing client boundary, or in a small client-only module imported by the root provider.
- **Call the same boundary as the UI.** Do not duplicate server business logic in the executor. Do not weaken CSRF, same-origin, auth or confirmation checks to make a smoke test pass. Never embed secrets in browser code.

```ts
const modelContext = navigator.modelContext || document.modelContext;

if (modelContext?.registerTool) {
  await modelContext.registerTool({
    name: "search_catalog",
    description: "Search products visible to the current user without changing application state.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", minLength: 1 },
        limit: { type: "integer", minimum: 1, maximum: 20 },
      },
      required: ["query"],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      untrustedContentHint: true,
    },
    execute: async (input) => {
      const parsed = SearchCatalogInput.parse(input);
      const response = await searchCatalog(parsed);
      return {
        results: response.items.map(({ id, name, price }) => ({ id, name, price })),
      };
    },
  });
}
```

`SearchCatalogInput` here is the app's existing validator; make sure it rejects unknown keys.

## Security checklist

- Every input is untrusted; use the same schema as the UI and server path.
- Preserve session, same-origin, CSRF, authorization, rate-limit and audit enforcement.
- Use idempotency keys for replay-sensitive mutations when the product already supports them.
- Prefer prepare/preview plus explicit commit for consequential workflows.
- Return minimal data; mark page or user-controlled output as untrusted content.
- Never expose tokens, cookies, headers, stack traces, hidden form fields, internal IDs that bypass normal lookup, or unrestricted URLs.
- Keep tool availability aligned with the current authenticated state and page capability.

## Prove it

For each tool: its schema came from the app's validator and the runtime parser rejects an unknown key; its execute calls the same function the UI calls; its result is read from app state; its annotations match its risk class; a consequential tool has no `toolautosubmit` and still passes through the app's confirmation. Then validate (VALIDATION.md) and probe (PROBING.md).
