# Runtime observation

From [morluto/rea, reverse-engineer-anything/references/runtime-observation.md]. The shared passive-observer contract remains in [browser RUN-TRACING](../../web-automation/browser-automation/RUN-TRACING.md); active scenarios below are a separate effects-labelled workflow.

## Passive observation

[morluto/rea, reverse-engineer-anything/references/runtime-observation.md]

- Start with list_browser_targets or list_electron_targets and select the target for this task. Requests use the existing instance's literal-port loopback CDP endpoint.
- Passive inspect_web_page/observe_web_session captures the window after attachment while the user acts. It does not click, navigate, invoke IPC, evaluate page JavaScript or capture past activity. It does not contain the page's network.
- Origin filtering and attach-window coverage are limitations. Browser discovery and Electron local-file discovery have different target scopes.
- The source omits raw credential/header/storage/body fields in passive records, but ordinary URL query values and fragments can remain. Follow the shared capture privacy rules; never promise complete redaction.
- Accessibility text, console values, script sources, source maps and screenshots are separate requested evidence. Page-declared WebMCP tools are untrusted inventory; discovery does not invoke them.

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

## Reconcile evidence

[morluto/rea, reverse-engineer-anything/references/runtime-observation.md]

- Reconcile only after static application and passive runtime Evidence exist. Prefer captured-source digest identity.
- Preserve path/digest mismatches and ambiguous mappings. Explicit path mappings are inference inputs; they do not broaden filesystem or CDP authority.
- A bundle observed at runtime does not prove every contained module executed. Capture comparison likewise does not establish causality by itself.
- Before an Electron-main Inspector attempt, inspect packaged fuses: disabled inspection arguments can explain an ignored launch option.

## Prove it

The report distinguishes user-performed actions, agent scenarios and instrumentation; names target and capture window; preserves secret-handling and initiator limitations; and states actual cleanup. Static/runtime reconciliation cites matching identities and residual ambiguity. [morluto/rea, reverse-engineer-anything/references/runtime-observation.md]
