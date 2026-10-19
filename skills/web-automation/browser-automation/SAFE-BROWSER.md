# A constrained browser tool with a domain allowlist

When an agent must stay on one site (to contain prompt injection and link-following, or a scraper with a domain policy), give it exactly one browser capability. This demo owns one page's CDP session and checks requests intercepted on that session. The runtime boundary is the app you build around the agent, not the instructions you give it. [browserbase/skills, safe-browser]

The old line said it intercepted every request. A page CDP session does not by itself cover every other target or worker: target attachment and child-session handling have their own scope. Report the actual attached targets and intercepted requests; do not describe this demo as complete network isolation. [CDP Target.setAutoAttach](https://chromedevtools.github.io/devtools-protocol/tot/Target/#method-setAutoAttach)

```
runtime agent -> only tool: safe_browser -> local Chromium
  -> CDP Fetch.enable({ urlPattern: "*" }) -> allowlist decision
     -> Fetch.continueRequest (allowed) | Fetch.failRequest (blocked)
```

**Source-workspace prerequisite:** this file documents the upstream [safe-browser demo](https://github.com/browserbase/skills/tree/main/skills/safe-browser); its executable harness is not shipped with this Markdown skill. The proof below requires that source implementation, not just these excerpts. [browserbase/skills, safe-browser]

## Tool design

- **Expose constrained actions, not raw CDP:** `goto` (an absolute URL through `Page.navigate`), `extract_front_page`, `extract_comments`, `current_url`, `audit_log`.
- **No `{ method, params }` passthrough.** The agent must not be able to call `Fetch.disable`, create targets, attach new sessions, or run shell commands or other browser clients.
- **Purpose-built structured extractors beat a broad accessibility snapshot:** easier to verify and harder to misuse.
- **Treat page content as untrusted.** The agent may read the scraped text; every browser action still goes through the tool.
- **For a new site,** change the allowlist and replace the extractors with structured ones for that site.
- **Bad input returns a blocked verdict, not an exception:** an unknown action or a missing URL comes back as `verdict: "blocked"`.
- **Default to a local Chromium;** use a cloud browser only when explicitly asked.

## The firewall

```js
cdp = await page.context().newCDPSession(page);
cdp.on("Fetch.requestPaused", async (params) => {
  const url = params.request?.url ?? "";
  try {
    if (isInternalUrl(url)) { await cdp.send("Fetch.continueRequest", { requestId: params.requestId }); ...; return; }
    const host = normalizeHost(url);
    if (allowlist.has(host)) { await cdp.send("Fetch.continueRequest", { requestId: params.requestId }); ...; return; }
    await cdp.send("Fetch.failRequest", { requestId: params.requestId, errorReason: "BlockedByClient" });
  } catch (error) {
    // fail closed: log as blocked, then try failRequest again (request may already be resolved)
  }
});
await cdp.send("Fetch.enable", { patterns: [{ urlPattern: "*" }] });
```

- **Register the `Fetch.requestPaused` handler before `Fetch.enable`.** The wildcard matches requests within the attached session's interception scope; it does not establish coverage of unrelated targets. [CDP Fetch.enable](https://chromedevtools.github.io/devtools-protocol/tot/Fetch/#method-enable)
- **Normalize the host and match exactly:** `new URL(url).hostname.toLowerCase().replace(/^www\./, "")` checked against a `Set` such as `new Set(["news.ycombinator.com"])`. No subdomain wildcard.
- **Always continue internal URLs:** prefixes `about:`, `chrome:`, `devtools:`, `data:`.
- **Fail closed.** Any handler error is recorded as blocked and `Fetch.failRequest` is attempted.
- **Audit every decision:** `{time, requestId, url, resourceType, cdpEvent, host, verdict, reason, cdpDecision, networkContinued}`. Keep a separate tool log (every tool call and result) and a CDP command log (every command the harness sent).

## Navigation that stays on the domain

- **Send `Page.navigate`, then wait for the audit entry for that exact URL:** poll every 50 ms, time out at 6000 ms with "Timed out waiting for CDP Fetch interception of <url>".
- **If allowed,** `waitForLoadState("domcontentloaded", {timeout: 10000})` (errors swallowed) and record `lastAllowedUrl = page.url()`.
- **If blocked, navigate back to `lastAllowedUrl`** and log it with `reason: "restore_after_block"`, so the browser stays on the domain.
- **Return the whole decision:** `{action, url, host, verdict, reason, cdpMethod, cdpDecision, networkContinued, currentUrl, restoredTo}`.
- **Extractors resolve relative links** against the site's base URL and tag each with its `host` and whether it is external, so the agent can see which links would leave the domain.
- Viewport 1280x900; headless unless `SAFE_BROWSER_HEADLESS=false`.

## Locking the agent down (Claude Agent SDK)

- **Tool schema in zod:** `action: z.enum([...])`, `url: z.string().optional()`, `limit: z.number().int().positive().max(30).optional()`. Annotations `readOnlyHint: false, destructiveHint: false, openWorldHint: true`; the tool and its server `createSdkMcpServer({name: "safe_browser_policy", version: "0.1.0", tools: [safeBrowserTool], alwaysLoad: true})` both `alwaysLoad: true`.
- **`query()` options:**
  - `tools: []` (no built-in tools)
  - `allowedTools: ["mcp__safe_browser_policy__safe_browser"]`
  - `permissionMode: "dontAsk"`
  - `canUseTool` allows `safe_browser`, `mcp__safe_browser_policy__safe_browser` or a name ending in `__safe_browser`, and returns `{behavior: "deny", message: "Only safe_browser is available in this constrained demo. Denied: <tool>"}` for everything else.
  - `maxTurns: 8`, `maxBudgetUsd: 0.75`, `persistSession: false`.
- **System prompt:** exactly one browser capability; use only safe_browser; "Do not claim a navigation succeeded unless safe_browser says verdict allowed"; attempt the off-domain URL through safe_browser so the policy can prove it blocks.
- **Give the task a fallback control:** if there is no external link to try, attempt `https://example.com/`.
- **Requires `ANTHROPIC_API_KEY`;** fail at start if it is missing. The env file loader does not override a variable that is already set.

## Prove it

Always run the demo and show concrete output. Prove the boundary from the harness's own logs, not from the agent's claim. A passing run shows: the agent used the safe browser tool; it loaded the allowed site; it extracted at least one item; it visited an internal link; it attempted an off-domain URL; CDP emitted `Fetch.requestPaused` for it; the firewall answered `Fetch.failRequest`; the current URL stayed on the allowed host; and the artifacts were written (result, audit log, tool log, CDP command log, a full-page screenshot), with the browser closed in `finally`. The template asserts the allowed navigation, the extraction, the blocked off-domain request and the final host in code, then prints a PASS line with the counts, the blocked URL, the decision and the final URL.
