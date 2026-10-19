# Validating discovery and invocation

Validation proves the tools are discoverable and that their executors ran. It does not prove a tool did what it claimed: a passing config is not evidence of a sound contract. That is PROBING.md, run after this is green.

## The test ladder

1. Review the scan leads and the inventory by hand (INVENTORY.md).
2. Run the target's unit and integration tests for the wrapped services and validators.
3. Run the target's typecheck and production build.
4. Start the actual app and verify tool discovery with Stagehand.
5. Invoke read-only and safely reversible fixtures; verify state or structured output.
6. Discover consequential tools, but do not invoke them unless an authorized sandbox and an explicit test boundary exist.
7. Re-run after a production build or on a deployed preview, to catch client-only registration and bundling mistakes.

## The expectation file

List every expected tool in a small `webmcp.e2e.json`. Discovery is mandatory; invocation is opt-in per case and uses synthetic or disposable data.

```json
{
  "timeoutMs": 5000,
  "expectedDom": [{ "selector": "#last-tool", "text": "search_catalog" }],
  "tools": [
    {
      "name": "search_catalog",
      "risk": "read-only",
      "expectedAnnotations": { "readOnly": true, "untrustedContent": true },
      "input": { "query": "notebook", "limit": 3 },
      "expectedOutputSubset": { "results": [] }
    },
    { "name": "submit_order", "risk": "consequential" }
  ]
}
```

- **Rules:** `tools` is non-empty with unique, non-empty names; `risk` is `read-only`, `reversible` or `consequential`; `timeoutMs` is a non-negative finite number (default 5,000); a case with no `input` is discovery-only; `expectedStatus` defaults to `Completed`.
- **`expectedAnnotations` use discovery names** (`readOnly`, `untrustedContent`), not the registration names.
- **`expectedDom`** checks exact `textContent` of each selector after all invocations, proving the page observed the calls. For a support app: invoke a read-only search with synthetic input and a reversible draft save with "Synthetic draft for Stagehand validation.", leave the send discovery-only, then check that the send counter still reads `"0"` and the draft state reads `"Yes"`.
- **Subset matching:** objects need every expected key; arrays need at least the expected length and match index by index; leaves compare with `Object.is`.

## The validator (Stagehand v4)

This is the source validator's contract, not a bundled runnable script. The installed skill contains Markdown only; obtain and inspect the exact [add-webmcp source workspace](https://github.com/browserbase/skills/tree/main/skills/add-webmcp) and installed Stagehand version before relying on the helper. Keep the older alpha route in [INIT-SCRIPT.md](INIT-SCRIPT.md) version-scoped. [browserbase/skills, add-webmcp and webmcp-gen]

Use Stagehand v4's real discovery and invocation path:

- `Stagehand.create({ browser })`, take the first page or `newPage()`, optionally `page.addInitScript({ path })`, `page.goto(url, { waitUntil: "load" })`.
- Discover with `page.tools({ timeout })`; per tool `tool.invoke({ input })`, then `invocation.result({ timeout })`; then the `expectedDom` checks through `page.locator(selector).textContent()`. Close Stagehand and the browser in `finally`.
- **Per discovered tool check:** a non-empty `description`; `inputSchema` is a plain object; annotations and output match the expected subsets.
- **Print only the configured expected subset,** never arbitrary live output. Exit 1 on any failure; on success, say how many of the expected tools passed.

Environment: Stagehand 4.0.2 with Node `>=22.18.0`, and either local Chrome or Chromium, or Browserbase.

| Option | Use |
|---|---|
| Local browser | Headed by default; headless for CI or unattended runs |
| Browserbase | Only for a publicly reachable deployed preview; needs `BROWSERBASE_API_KEY` |
| Custom Chrome path | Chrome outside default locations |
| No Chrome sandbox | Only in an isolated CI container that cannot launch Chrome's sandbox; not on an ordinary workstation |

Headed, headless, sandbox and executable-path choices apply only to the local browser; pick exactly one of local or Browserbase.

## The consequential gate

Apply this gate to both source-app tools and the [injected-script route](INIT-SCRIPT.md#validating-the-script-stagehand-36-alpha). Before launching any browser, refuse every case whose `risk` is `consequential` **and** has an `input`, unless an explicit allow-consequential override is passed for an authorized sandbox. The refusal names the tools and says to remove the input for discovery-only validation. Test the gate itself: a config with an invoked `submit_order` exits 1, names it, and launches no browser.

## Proof the app ships its own tools

An injected init script is useful for testing the validator, but it is not proof that the target app ships its tools. Final application proof runs **without** an init script, against the built app.

## Zero tools discovered

Check the host before suspecting the code. Dev servers commonly bind `localhost` only, so `http://127.0.0.1:PORT` finds nothing while `http://localhost:PORT` works, and the failure looks identical to tools never registering. Validate local apps at `http://localhost:PORT`.

## What this check does not cover

It is a bounded happy-path subset check. For high confidence, add target-specific tests for invalid and extra inputs, repeated and idempotent calls, navigation and hot-module re-evaluation, persistence across reload, ambiguous names or conflicts, and the exact output shape, so leaked internal fields cannot hide outside an expected subset.

## Lighthouse's WebMCP audits

Lighthouse has an agentic-browsing category whose WebMCP integration group lists three audits: "Registered WebMCP tools", "Forms missing declarative WebMCP" and "WebMCP schema validity"; the same category holds llms.txt discoverability, "Accessibility for agents" and layout stability [https://developer.chrome.com/docs/lighthouse/agentic-browsing/llms-txt, updated 2026-05-05]. The page names these audits without saying what each checks, so treat a Lighthouse run as an extra signal beside the Stagehand ladder above, not a replacement for it. The rest of the category is in [ai-search-visibility AGENT-READINESS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ai-search-visibility/AGENT-READINESS.md#lighthouses-agentic-browsing-audits); the audit ids and which Lighthouse release ships them are in [web-performance LIGHTHOUSE-CI.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/LIGHTHOUSE-CI.md#the-agentic-browsing-category).

## Prove it

Tests, typecheck and build pass; with no init script, against the production build, Stagehand discovers every tool in `webmcp.e2e.json`, invokes the read-only and reversible ones with `Completed` and the expected output subset, and the `expectedDom` checks show the page observed the calls while consequential counters stayed at zero.
