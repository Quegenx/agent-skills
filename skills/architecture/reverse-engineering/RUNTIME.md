# Runtime observation

From [morluto/rea, reverse-engineer-anything/references/runtime-observation.md]. The shared passive-observer contract remains in [browser RUN-TRACING](https://github.com/Quegenx/agent-skills/blob/main/skills/web-automation/browser-automation/RUN-TRACING.md); active scenarios below are a separate effects-labelled workflow.

## Passive observation

[morluto/rea, reverse-engineer-anything/references/runtime-observation.md]

- Start with list_browser_targets or list_electron_targets and select the target for this task. Requests use the existing instance's literal-port loopback CDP endpoint.
- Passive inspect_web_page/observe_web_session captures the window after attachment while the user acts. It does not click, navigate, invoke IPC, evaluate page JavaScript or capture past activity. It does not contain the page's network.
- Origin filtering and attach-window coverage are limitations. Browser discovery and Electron local-file discovery have different target scopes.
- The source omits raw credential/header/storage/body fields in passive records, but ordinary URL query values and fragments can remain. Follow the shared capture privacy rules; never promise complete redaction.
- Accessibility text, console values, script sources, source maps and screenshots are separate requested evidence. Page-declared WebMCP tools are untrusted inventory; discovery does not invoke them.

## Browser discovery transports

[morluto/rea, docs/browser-observation.md; src/browser/CdpEndpoint.ts]

- Where the connected contract advertises it, browser listing, page inspection, bundle analysis, session observation, WebMCP discovery and screenshots also accept an explicit-port loopback browser WebSocket. Use that route when the selected browser exposes a browser socket without HTTP discovery; do not invent an endpoint from an unrelated session.
- This does not extend Electron inspection, JavaScript Inspector observation, website runtime attribution or scenario attach mode to that transport. Use their advertised HTTP discovery contract. A private debugging pipe alone supplies neither public endpoint.
- A browser-socket identifier grants access to that socket; preserve its credential-redacted representation. Narrow discovery to intended origins when a shared profile contains unrelated pages.

## Passive Node Inspector observation

[morluto/rea, docs/javascript-runtime-observation.md; docs/javascript-runtime-reconciliation.md]

- Start with `list_javascript_runtime_targets`, then `observe_javascript_runtime` using the actual loopback HTTP Inspector endpoint and selected target ID. These tools attach to a caller-owned running target; they do not launch or stop it.
- The provider enables Runtime and Debugger metadata. It does not evaluate code, read script source, install breakpoints, pause/resume a target or invoke Electron APIs. A target paused before startup needs its owning debugger to resume it; REA does not do so.
- Parsed scripts and execution-context lifecycle are the observations. They do not establish require/import callers, event-listener invocation, IPC messages, initialization order or feature execution. Attachment-state null means unknown, and missing pre-attach scripts remain possible.
- Node or Electron roles are caller-declared and unverified; the Inspector does not authenticate an OS PID or prove separate targets belong to one Electron app. Unresolvable discovery paths stay reported locations, not permission to read those files.
- Reconciliation can consume this Evidence alongside static application analysis. Because these observations contain no source bytes, a unique authorized location match remains weaker than captured-byte identity. REA closes its own connection while the caller-owned runtime continues.

## Declared actions and instrumentation

[morluto/rea, reverse-engineer-anything/references/runtime-observation.md]

- If the agent must act, use capture_browser_scenario with declared actions and target identity.
- Connect mode first navigates the selected page to start_url and can discard unsaved state. Recreate needed state through the declared actions. It leaves the external browser open.
- Launch mode owns a temporary browser/profile. Inspect the returned cleanup result rather than assuming teardown succeeded.
- Capture the requested observable state after its expected wait condition. Report actions performed and evidence requested.
- Scenario network records have no initiator stacks. For initiator evidence, use passive capture during the user's action; a listener location alone does not identify the sender of a request.
- Do not overlap a passive capture and scenario actions on the same target.
- observe_web_execution resets coverage counters and temporarily disables optimization. This is active instrumentation with effects, not the shared passive observer.
- inspect_web_event_listeners identifies locations on the first CSS match without dispatching an event.

## Preserve capture and host limitations

[morluto/rea, docs/browser-observation.md; docs/browser-scenario-contract.md; src/browser/BrowserScenarioPartialObservation.ts]

- An artifact marked `not_requested` was not inspected. A complete URL-only capture cannot answer what the page rendered or whether background work settled; request the relevant DOM, accessibility, screenshot or event evidence and readiness condition.
- REA's guides record platform-emulation loss on page-session disconnect in an examined Chromium setup; leaving the browser process running is not a preservation guarantee. Use an owned launch profile when that isolation is needed, or have the owning client restore its complete configuration. This is REA's recorded adapter limitation, not a claim about every browser/version; REA does not replay guessed settings.
- REA's scenario adapter applies locale differently by mode: launch passes the locale to Playwright's browser context, while connect sends the CDP locale override and records that navigator/request languages remain caller-owned. Its guides distinguish Intl formatting from navigator/request languages; capture completeness does not prove launch/connect language environments equivalent. [morluto/rea, src/browser/PlaywrightScenarioBrowser.ts]; [Playwright locale](https://github.com/microsoft/playwright/blob/v1.58.2/docs/src/test-api/class-testoptions.md); [CDP locale override](https://chromedevtools.github.io/devtools-protocol/tot/Emulation/#method-setLocaleOverride)
- Abrupt termination can leave owned launch profiles or Playwright artifacts, and subsequent REA runs do not automatically reclaim them. Profiles can retain session data; a directory prefix or creation time does not prove ownership. Preserve the actual cleanup receipt and unresolved resources.
- For captured script-response provenance, retain the [response-body API limitation](CAPTURED-SOURCES.md#capture-the-source-needed); associated response events do not prove original wire bytes.

## Reconcile evidence

[morluto/rea, reverse-engineer-anything/references/runtime-observation.md]

- Reconcile only after static application and passive runtime Evidence exist. Prefer captured-source digest identity.
- Preserve path/digest mismatches and ambiguous mappings. Explicit path mappings are inference inputs; they do not broaden filesystem or CDP authority.
- A bundle observed at runtime does not prove every contained module executed. Capture comparison likewise does not establish causality by itself.
- Before an Electron-main Inspector attempt, inspect packaged fuses: disabled inspection arguments can explain an ignored launch option.
- Preserve the tool's separate `loaded`, `resident-in-loaded-asset`, `not-observed-in-capture` and `unknown` classifications. A not-observed result covers only exercised mappings and supplied capture coverage; it never establishes global absence. Source-map declarations or embedded original-source hashes are not primary runtime byte matches. [morluto/rea, docs/javascript-runtime-reconciliation.md]

## Prove it

The report distinguishes user-performed actions, agent scenarios and instrumentation; names target and capture window; preserves secret-handling and initiator limitations; and states actual cleanup. Static/runtime reconciliation cites matching identities and residual ambiguity. [morluto/rea, reverse-engineer-anything/references/runtime-observation.md]
