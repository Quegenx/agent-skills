---
name: webmcp
description: "Exposes a web app's user-visible capabilities as WebMCP tools that agents can discover and call in the browser: from source code into the app as first-party tools, or from a live URL as a standalone init script. Task-level tools, closed schemas, risk classes and confirmations, validation with Stagehand, hand-probing against the live page, and the audit rubric. Use when adding WebMCP tools to an app, writing a webmcp.init.js for a site, validating or probing registered tools, or scoring a WebMCP integration."
---

# WebMCP

The job is to let an agent do in the page what a user can already do there, through tools registered with the browser's `modelContext`, without opening a new door. Two routes: from **source code**, where the tools live in the app itself, call the same client or service boundary as the UI and ship with it (no hosted proxy or third-party runtime); and from a **live URL**, where a manifest compiles into a `webmcp.init.js` injected into the page and no source changes. Three defects pass discovery and still fail the agent: a schema closed at discovery but backed by a permissive runtime parser, a handler that echoes its input instead of reading the app's state, and an annotation that misstates the tool's risk. With only a URL, take the init-script route and do not pretend to analyze source that was not provided.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Finding what to expose in a codebase: the boundary, tracing each capability, search signals, exclusions, the inventory table | [INVENTORY.md](INVENTORY.md) |
| The browser API, tool names, schemas, results, risk classes and annotations, imperative vs declarative, registering in the app | [TOOL-CONTRACT.md](TOOL-CONTRACT.md) |
| A standalone init script from a live URL: exploring the page, the manifest, authoring tool source, the emitted script, its validation | [INIT-SCRIPT.md](INIT-SCRIPT.md) |
| Proving tools are discovered and invoke: the test ladder, Stagehand, the expectation config, the consequential gate, zero-tools failures | [VALIDATION.md](VALIDATION.md) |
| Hand-probing tools against the live page: schema closure, required fields, error and annotation honesty, verifying the effect | [PROBING.md](PROBING.md) |
| The final report, and the quality rubric with its gates for audits and scored evaluations | [AUDIT.md](AUDIT.md) |

## The rules

[browserbase/skills, add-webmcp and webmcp-gen; existing repository contract and consequence rules]

1. **Tools are complete user tasks**, such as `search_catalog` or `save_draft`, not one tool per endpoint, and each traces to behavior the product already has. A route name or schema alone does not prove a capability is usable, authorized or safe.
2. **Expose only what the UI grants the current user.** No internal or admin-only operations, authentication bypasses, raw database access or secret-bearing operations.
3. **One contract.** Derive the JSON Schema from the app's existing validator, close it with `additionalProperties: false`, and make the execute-time parser reject unknown keys too. Agent-provided input is untrusted: validate again inside the handler.
4. **Call the boundary the UI calls.** Do not duplicate server business logic in the executor; existing validation, authorization and business rules stay authoritative.
5. **Report the app's state, never the request.** Read the outcome from the application, polling until reactive state settles; echoing turns a silent no-op into a passing test.
6. **Annotations are hints, not enforcement.** The app enforces permissions, validation, confirmation, idempotency and replay protection; never weaken CSRF, same-origin, auth or confirmation checks to pass a test.
7. **Consequential actions keep the app's real confirmation.** Split preview from commit where possible, never add `toolautosubmit`, and apply the [same consequence gate](VALIDATION.md#the-consequential-gate) to source-app and injected tools. Never invoke them in automated validation without an explicitly authorized sandbox.
8. **Never return or embed secrets:** no tokens, cookies, headers, stack traces, hidden form fields, DOM nodes or whole HTML documents in results, and no secrets in browser code. The [legacy generator's returned stack](INIT-SCRIPT.md#what-the-compiled-script-does) conflicts with this rule; the rule applies to fulfilled failure payloads too.
9. **Fix discrepancies where they are.** Do not loosen a schema, downgrade an annotation or delete a probe to make a check pass.

## Prove it

For a source-app implementation, report the authorized tests, typecheck and production build actually performed; Stagehand discovers every expected tool from the built app without an injected init script. For the live-URL route, use INIT-SCRIPT.md's injected-script validation instead. In the selected route, invoke at least one read-only or reversible tool with a verified structured result; consequential tools are discovered only. For hand-probing, check every effect in the app's own state through PROBING.md. For an audit, use AUDIT.md and report what was considered, excluded and not tested. [browserbase/skills, add-webmcp and webmcp-gen; VALIDATION.md, INIT-SCRIPT.md and AUDIT.md]
