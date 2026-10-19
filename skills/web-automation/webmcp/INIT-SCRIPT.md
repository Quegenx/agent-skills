# A standalone init script from a live URL

When the output is a `webmcp.init.js` for a site you only have a URL for, nothing in the site's source changes: you explore the page, write a manifest, compile it into an injection script, and validate it in a browser. You do the exploring and iterating yourself; nothing delegates it to a nested agent.

## Source workspace prerequisite

The compiler, scaffold, validator, example generator and package manifest are upstream resources, not files bundled with this Markdown skill. Obtain and read the exact pinned [webmcp-gen source workspace](https://github.com/browserbase/skills/tree/main/skills/webmcp-gen) before using its commands or relying on its output. The contracts below describe that source; current-browser adaptation and the existing consequence/output gates are still required. [browserbase/skills, webmcp-gen]

## The loop

1. **Name the job** `<domain>/<task>` with exactly one slash, such as `example.com/page-context`. Each segment matches `/^[A-Za-z0-9][A-Za-z0-9._-]*$/`, which also blocks path traversal.
2. **Explore the page.** Prefer the accessibility snapshot, page text and DOM inspection over screenshots unless visual layout matters. With the `browse` CLI (`npm install -g browse`): `browse open https://example.com --local`, `browse snapshot`, `browse get title`, `browse get url`, `browse get text body`, `browse get html body`, and `browse stop` when done.
3. **Write the manifest.** The manifest is the source of truth; the script is generated from it.
4. **Compile** it to `webmcp.init.js`.
5. **Validate** it in a browser (below). On failure, read the report, patch the manifest, recompile, revalidate.

A working layout per job: `artifacts/<domain>/<task>/{manifest.json, webmcp.init.js, stagehand-example.ts, eval.json, eval-report.md}`, with `artifacts/` gitignored.

## The manifest

```json
{
  "domain": "example.com",
  "task": "page-context",
  "url": "https://example.com",
  "generatedAt": "2026-06-04T00:00:00.000Z",
  "tools": [
    {
      "name": "example_com_page_context",
      "description": "Returns page context.",
      "inputSchema": { "type": "object", "properties": {}, "required": [] },
      "implementation": {
        "kind": "dom",
        "source": "return { success: true, title: document.title, url: location.href };"
      },
      "fixtureInput": {}
    }
  ]
}
```

- **Pinned compiler requirements:** `domain`, `task`, `url` and at least one tool. Each tool: a name matching `/^[a-zA-Z0-9_-]{1,80}$/`, a non-empty description, `inputSchema` and `implementation` as objects, `implementation.kind` one of `same_origin_fetch`, `dom` or `hybrid`, and non-empty `source`.
- **Default tool name** is `${domain}_${task}` with non-alphanumerics collapsed to `_`, trimmed, and cut to 80 characters.
- **The scaffolded tool** (`additionalProperties: true`, echoes `input.echo` with the page title, URL and first `h1`) exists to validate injection; replace it with the real tool. The source manifest above is also an injection example, not a final closed-schema contract. Final tools follow [TOOL-CONTRACT.md](TOOL-CONTRACT.md#design-the-contract), reject unknown keys at runtime and report real application state. The 80-character/no-dot naming rule is this compiler's constraint, not a universal browser limit. [browserbase/skills, webmcp-gen; existing WebMCP rules]

## Writing `implementation.source`

- **Statements, not a function.** The source is inserted inside `async (input) => { ... }`; return a JSON-serializable object.
- **Page code only.** Use `document`, `location`, `navigator` and same-origin `fetch`. No Playwright, Puppeteer, Stagehand, XPath helpers or agent or browser commands; the compiler warns on `page.goto/locator/click/fill/evaluate/waitFor/waitForSelector(`, `browser.newPage(`, `context.newPage(` and `await page`.
- **Valid CSS selectors only** in `querySelector` and `querySelectorAll`. To find by text: `Array.from(document.querySelectorAll(...)).find((el) => (el.textContent || "").includes("..."))`.
- **No secrets and no dynamic code:** no API keys, bearer tokens, cookies, localStorage secrets or user credentials; no `eval` or `new Function` (the compiler rejects both). Avoid destructive actions unless explicitly asked.
- **Defensive:** check for missing elements and return `{ success: false, error: "..." }`.

## What the compiled script does

- **Top frame only:** an IIFE that returns early if `window.self !== window.top`.
- **Legacy timeout boundary:** the source races each execution against a 30 s timer that rejects with "WebMCP tool timed out", clears it in `finally` and passes `input || {}`. This bounds waiting; it does not cancel the implementation or roll back an effect. Use the [current execution-cancellation contract](TOOL-CONTRACT.md#the-browser-api) when adapting it. The old line described only timeout/error capture, leaving that limitation unstated. [Source compiler](https://github.com/browserbase/skills/blob/main/skills/webmcp-gen/scripts/compile.mjs)
- **Legacy error payload conflicts with this repo:** the source catches errors into a returned `success: false` payload containing name, message and stack. That fulfilled response JSON is visible under the [browser error contract](TOOL-CONTRACT.md#the-browser-api); do not return the stack or other forbidden implementation details. The existing [safe-output rule](SKILL.md#the-rules) wins over this generator form. [Source compiler](https://github.com/browserbase/skills/blob/main/skills/webmcp-gen/scripts/compile.mjs)
- **Registration:** each name is unregistered in try/catch, then registered; if `navigator.modelContext` is missing it returns `{ success: false, error: "navigator.modelContext is not available." }`. The result is kept on a window global for inspection.
- **Two caveats.** The supplied pinned script uses navigator.modelContext only and name-based unregisterTool; that is not the current Chrome contract. Adapt its generated registration to the [current document.modelContext and lifecycle rules](TOOL-CONTRACT.md#the-browser-api), then validate against the actual target browser. The old comparison repeated the source's no-cleanup claim. Because this wrapper returns errors as success: false, its validator also treats output.success === false as a failure. [browserbase/skills, webmcp-gen]; [Chrome imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)

## Validating the script (Stagehand 3.6 alpha)

**Apply the shared consequence gate first.** The unmodified source validator invokes every manifest tool with its fixture or an empty object and has no consequence gate. Do not use it unchanged for a manifest containing consequential tools. Keep discovery mandatory, invoke only authorized read-only/reversible fixtures, and use the [existing authorized-sandbox gate](VALIDATION.md#the-consequential-gate) for consequential execution. The older all-tools invocation criterion does not override this boundary. [Source validator](https://github.com/browserbase/skills/blob/main/skills/webmcp-gen/scripts/validate.mjs), [existing WebMCP, SKILL.md rule7]

This route used a pinned `@browserbasehq/stagehand` 3.6.0 alpha with Chrome's WebMCP testing flags. It needs Node `^20.19.0` or `>=22.12.0` (the engine the pinned Stagehand declares; Node 18 is not enough), plus `tsx` and `typescript` to run a TypeScript example.

```js
new Stagehand({ env: "LOCAL", verbose: 1, localBrowserLaunchOptions: { args: ["--enable-features=WebMCPTesting,DevToolsWebMCPSupport"] } })
```

- `await stagehand.init()`, take `stagehand.context.pages()[0] ?? newPage()`, `addInitScript({ path })`, `goto(url, { waitUntil: "load" })`.
- Discover with `page.listWebMCPTools({ timeoutMs: 5000 })`; invoke with `page.invokeWebMCPTool(name, fixtureInput ?? {}, { frameId: tool.frameId })`, then `await invocation.result` (a property, not a call, in this version; Stagehand v4 uses `invocation.result()`, VALIDATION.md).
- **Legacy validator criterion:** its source requires no errors, at least one tool, every manifest tool found/invoked with `status === "Completed"`, no `errorText` and no `success: false` output. That historical criterion applies only after the shared consequence gate selects an authorized execution scope; discovery-only consequential tools cannot be judged by its unmodified all-invoked check. A missing `webmcp.init.js` remains a compile prerequisite failure. [Source validator](https://github.com/browserbase/skills/blob/main/skills/webmcp-gen/scripts/validate.mjs)
- **Write the result down:** an `eval.json` and an `eval-report.md` with status, URL, per tool found/invoked/status/error, and errors; exit 1 if not passed.
- **To use the script elsewhere,** load it in any Stagehand project with `page.addInitScript({ path: "webmcp.init.js" })` (`npx create-browser-app` starts one).

## Prove it

Every expected tool is discovered; only authorized read-only/reversible fixtures are invoked with `Completed` and no structured failure. Consequential tools remain discovery-only without the explicit sandbox boundary, and the report names what was not invoked. The final schema is closed at discovery/runtime, results contain no forbidden fields, and the legacy timeout is not reported as cancellation. Then use [PROBING.md](PROBING.md): injection alone does not prove the claimed application effect. [existing WebMCP rules and VALIDATION.md; browserbase/skills, webmcp-gen]
