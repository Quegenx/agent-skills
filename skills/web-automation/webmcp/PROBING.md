# Hand-probing tools against the live page

Run this last, after validation is green, and by hand against the live page rather than encoded in `webmcp.e2e.json`: the point is to probe inputs the author did not anticipate. Use the discovered `tool.inputSchema` as the thing under test, not as the source of truth.

## The session

Use a persistent browser session so probes accumulate against real state. In the page:

- `document.modelContext.getTools()` returns the tool objects.
- `mc.executeTool(toolObject, JSON.stringify(args))` invokes one. It takes the tool **object** and the arguments as a **JSON string**; a plain object fails with "Failed to parse input arguments".
- Error messages are replaced by a generic invocation-failed string, so record only ACCEPTED or REJECTED.

With the `browse` CLI:

```bash
browse open http://localhost:3000 --session probe --local --headed
browse eval --session probe '(async()=>{const mc=document.modelContext;const t=(await mc.getTools()).find(x=>x.name==="my_tool");try{return "ACCEPTED "+JSON.stringify(await mc.executeTool(t,JSON.stringify({/* probe input */})));}catch(e){return "REJECTED";}})()'
browse screenshot --session probe --path /tmp/effect.png
```

- **`--local` is required:** `browse open` defaults to a cloud browser that cannot reach localhost.
- **One probe per command:** `browse eval` reliably accepts only single-line scripts.

## The probes

| Probe | Send | Defect if |
|---|---|---|
| Schema closure | An undeclared extra field | It is accepted: the closed contract is decorative |
| Required fields | The input with a `required` property left out | It does not fail. A `Completed` status carrying a null or partial result is worse than an error, because the agent believes it succeeded |
| Types and constraints | A string where a `number` is expected, a value outside `minimum`/`maximum`, a value outside an `enum` | It is silently coerced or echoed back: the handler never validated |
| Error honesty | An input that should fail | It reports `Completed` with a success-shaped body |
| Annotation honesty | Nothing: compare the discovered `annotations` with the assigned risk | A pure lookup advertises `readOnly: false`, or a mutating tool advertises `readOnly: true`, even though discovery passes |
| Clean rejection | Re-read app state after the malformed probes | A rejected call left anything behind |
| Consequential gating | Never invoke | The tool does not declare its risk, has a declarative `toolautosubmit`, or the app's own confirmation control no longer stands between agent and effect |

## Verify the effect, not the return value

Invoke, then inspect the app independently: DOM assertions for rendered state, a screenshot for a canvas or chart. A handler that returns `{saved: true}` without changing anything passes validation and fails here. With no readable DOM, have the tool read back from the app's real store.

## When a probe fails

Treat every discrepancy as a defect in the application or the tool contract, and fix it there. Do not loosen a schema, downgrade an annotation or delete a probe to make this step pass.

## Prove it

For every tool, a recorded ACCEPTED or REJECTED for each probe above that matches its contract, an independent check (DOM or screenshot or store read-back) of each accepted mutation's effect, app state unchanged after every rejected call, and consequential tools confirmed gated without being invoked. These results go in the report (AUDIT.md).
