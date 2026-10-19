# The tool contract and registering it in the app

Source-derived tool design from browserbase/skills add-webmcp, checked against the WebMCP draft and Chrome imperative API. The pinned generator has a separate [source contract](INIT-SCRIPT.md); it does not define the current browser API. [browserbase/skills, add-webmcp; existing WebMCP rules]

## The browser API

- **Get the context with both accessors:** `const modelContext = navigator.modelContext || document.modelContext;`. Current Chrome exposes `document.modelContext` as a native `ModelContext` while `navigator.modelContext` is `undefined`, so the fallback is load-bearing, not defensive. The surface is browser-provided, so the app ships no polyfill.
- **A tool definition** has `name`, `description`, `inputSchema` (a JSON Schema object), `annotations` (`readOnlyHint`, `untrustedContentHint`) and `execute: async (input) => result`.
- **Current registration is not idempotent replacement.** The current specification rejects a duplicate registered name with InvalidStateError; use the supported lifecycle cleanup rather than assuming hot reload silently replaces a tool. The old source view said re-registration replaced by name and needed no teardown. [WebMCP ModelContext](https://webmachinelearning.github.io/webmcp/#dom-modelcontext-registertool)
- **Current Chrome lifecycle, checked 18 October 2026:** use document.modelContext and await registerTool; its options can take an AbortSignal to unregister. From Chrome 153, unregistering does not cancel in-flight executions. Handler execution cancellation is a separate signal. Preserve older pinned examples as version-specific observations, not current API guarantees. [Chrome imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- **Current invocation:** executeTool accepts the discovered tool object and a serializable argument object. JSON-stringified input is deprecated from Chrome 155; the source's string-only rule was an older implementation observation. [Chrome imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- **Cross-origin discovery has two gates.** The host delegates the tools Permissions Policy and explicitly exposes tools to a secure origin; the caller also requests that origin with fromOrigins. Same-origin discovery does not prove cross-origin authority. [Chrome imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- **Platform rejection and returned failure data differ.** In the current draft, a rejected executor maps to `OperationError`; the caller receives a corresponding `DOMException` name without the provider exception, message or stack. An author-defined failure returned in response JSON remains visible. The old line promised a literal generic invocation-failed string for every failure; that is not the draft contract. Keep pinned driver observations version-scoped. [WebMCP tool execution errors and callback algorithm](https://webmachinelearning.github.io/webmcp/#supporting-concepts)
- **Browser annotations and driver aliases differ.** Chrome documents `readOnlyHint`, `untrustedContentHint` and `consequentialHint`, each defaulting to false, plus `debugging` from Chrome 156 for developer tools. The pinned Stagehand v4 source reports `readOnly`, `untrustedContent` and declarative `autosubmit`; verify the installed driver before assuming it exposes newer browser hints. The old overview listed only the first two browser hints. [Chrome imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- **Discovery is asynchronous:** await `document.modelContext.getTools()` before selecting a tool. [Chrome imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- **Execution cancellation is separate from registration cleanup.** The caller may pass an execution `AbortSignal`; the handler receives its corresponding signal in the second options argument and can forward it to asynchronous work. Aborting the registration signal unregisters the tool, rather than cancelling an in-flight execution. [Chrome imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)

## Design the contract

- **Name:** a stable verb-noun. **Description:** the user-visible effect, prerequisites and important exclusions.
- **Schema from the app's validator.** Derive the JSON Schema from the existing validator or domain type; do not invent a second, looser contract.
- **Closed at both ends.** `additionalProperties: false` on object schemas, and configure the runtime validator to reject unknown keys rather than strip or accept them. A closed discovery schema backed by a permissive runtime parser is not a closed contract.
- **Validate again in the handler.** Agent-provided input is untrusted; keep discovery and runtime acceptance aligned.
- **Results:** compact, JSON-serializable domain results. Never DOM nodes, credentials, cookies, tokens or whole HTML documents.
- **Never echo the request back as the result.** Read the outcome from the application's own state. React and most reactive stores do not reflect a change on the next line, so poll until it settles, then report what is actually true.

## Risk classes

[browserbase/skills, add-webmcp; existing repository consequence rules], [Chrome imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)

| Risk | Tool design | Annotation and confirmation |
|---|---|---|
| Read-only | No state mutation | `readOnlyHint: true`; add `untrustedContentHint: true` when output includes page or user-controlled text |
| Reversible mutation | Drafts, preferences, cart edits | `readOnlyHint: false`; preserve auth and idempotency; test only with disposable state |
| Consequential or irreversible | Purchase, send, publish, delete, permission changes | On supporting browsers, `consequentialHint: true`; split preview/prepare from commit where possible; no declarative `toolautosubmit`; keep the final action behind the app's real confirmation control |

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
