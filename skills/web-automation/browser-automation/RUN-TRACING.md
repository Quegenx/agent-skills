# Recording and diagnosing a run

**Contents:** [Observer model](#a-second-cdp-client-that-never-acts) · [Capture](#capture) · [Bisecting](#bisecting-the-stream) · [Querying](#querying) · [Playbooks](#debug-playbooks) · [Troubleshooting](#troubleshooting) · [Prove it](#prove-it)

**Source-workspace prerequisite:** commands using `scripts/` below refer to the upstream [browser-trace scripts](https://github.com/browserbase/skills/tree/main/skills/browser-trace/scripts). This installed skill contains the documented contracts, not those helper modules. Check out and inspect the matching upstream workspace before using its commands; do not infer that a current repository has these scripts. Capture artifacts can contain credentials and private content; apply the existing [private-trace handling](TASK-LOOPS.md#the-inner-agent). [browserbase/skills, browser-trace; autobrowse]

## A second CDP client that never acts

- **Every Chrome DevTools target accepts multiple concurrent CDP clients.** The automation is one client; the observer is a second that enables only observation domains (Network, Console, Runtime, Log, Page).
- **The passive observer never sends `Input.dispatch*` or `Runtime.evaluate`.** This limits its actions; it does not prove that attachment, enabled domains or sampling have zero timing/performance impact. The source claimed it could not perturb the run. [browserbase/skills, browser-trace]
- **It works with any driver that speaks CDP:** `browse`, Stagehand, Playwright. Observing is a separate job from driving.
- **Pick domains deliberately.** Default `Network Console Runtime Log Page`. `DOM` is very noisy; add it only when needed. `Performance` gives navigation timing; `Security` gives mixed-content and certificate events.
- **Response bodies are not in the event stream** (each needs a synchronous `Network.getResponseBody`). With the `browse` CLI, run `browse network on` alongside `browse cdp`: it writes per-request folders with `request.json` and `response.json` including the body.

## Capture

Three pieces:

1. **Firehose:** `browse cdp <target> --domain X --domain Y ...` streams every CDP event as one JSON object per line to `cdp/raw.ndjson`, stderr to `cdp/stderr.log`.
2. **Sampler:** every interval (default 2 s) take a screenshot, the body HTML and the URL (`browse screenshot --cdp <target> --path <file>`, `browse get html body --cdp <target>`, `browse get url --cdp <target>`).
3. **Bisector:** walk `raw.ndjson` once and slice it into JSONL buckets per CDP method and per page.

Local Chrome:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-o11y about:blank &
node scripts/start-capture.mjs 9222 my-run
browse open https://example.com --cdp 9222
node scripts/stop-capture.mjs my-run
node scripts/bisect-cdp.mjs my-run
```

Browserbase:

```bash
export BROWSERBASE_API_KEY=...
node scripts/bb-capture.mjs --new my-run
SID=$(jq -r .browserbase.session_id .o11y/my-run/manifest.json)
CONNECT_URL="$(browse cloud sessions get "$SID" | jq -r .connectUrl)"
browse open https://example.com --cdp "$CONNECT_URL" --session my-run-browser
browse open https://news.ycombinator.com --session my-run-browser
node scripts/stop-capture.mjs my-run
node scripts/bisect-cdp.mjs my-run
node scripts/bb-finalize.mjs my-run --release
```

- **To debug a session already running** (a stuck worker), attach with `node scripts/bb-capture.mjs <session-id> mid-flight-debug`, open the debugger URL, record about 120 s, then stop, bisect and finalize **without** `--release`: it is not your session.
- **Use a wrapper, not manual steps.** It enforces keep-alive, fetches the `connectUrl`, captures the debugger URL and stamps the manifest; doing it by hand invites mistakes.
- **Attach the automation to the session before or with the tracer.** A Browserbase session without keep-alive ends on disconnect; keep-alive sessions persist until released or their timeout. The old line omitted that condition. [Browserbase keep alive](https://docs.browserbase.com/platform/browser/long-sessions/keep-alive)
- **Don't sample faster than about 1 s;** every sample runs CLI reads and a screenshot.
- **Always run stop, even after a crash,** so background processes don't linger and the manifest gets `stopped_at`.
- **Fail loudly on a bad target:** wait 1000 ms after spawning the firehose and check it is alive (`process.kill(pid, 0)`); if not, print `stderr.log`, kill the sampler and exit 1, so the user sees the real error instead of a silent zero-event capture.

### Background process patterns

```js
const rawFd = fs.openSync(path.join(RD, 'cdp', 'raw.ndjson'), 'w');
const errFd = fs.openSync(path.join(RD, 'cdp', 'stderr.log'), 'w');
const cdp = spawn('browse', ['cdp', target, ...domainArgs], {
  detached: true,
  stdio: ['ignore', rawFd, errFd],
});
cdp.unref();
fs.writeFileSync(path.join(RD, '.cdp.pid'), String(cdp.pid));
```

```js
try { process.kill(pid, 'SIGTERM'); } catch {}
for (let i = 0; i < 3 && isAlive(pid); i++) { await sleepMs(1000); }
if (isAlive(pid)) { try { process.kill(pid, 'SIGKILL'); } catch {} }
```

- **Detach the child and write stdout straight to a file,** with PID files (`.cdp.pid`, `.loop.pid`). Opening with `'w'` means a restart overwrites `raw.ndjson`.
- **Stop with SIGTERM, poll three times at 1 s, then SIGKILL,** and delete the PID file.
- **The sampler honours SIGTERM and SIGINT** through a stopping flag; every capture is best-effort (a failure skips that tick); delete 0-byte PNGs.
- **Write atomically:** write `<file>.partial`, then rename, so a SIGTERM mid-write never leaves a 0-byte HTML; sweep leftover `.partial` files in the loop and at stop.
- **Run commands without a shell** through a wrapper on `execFileSync` that returns `{ok, stdout, stderr, status}`, so a non-zero exit doesn't throw into the caller.
- **The JSONL reader skips unparseable lines.**
- **Name files with a compact UTC stamp** such as `20260427T175533Z`: lexical sort is time order, which joining events to screenshots relies on. The default run id has the same shape.

### Layout

```
.o11y/<run-id>/
  manifest.json      run_id, target, domains, interval_seconds, started_at, stopped_at (+ browserbase block)
  index.jsonl        one line per sample: {ts, screenshot, dom, url}
  cdp/raw.ndjson     full firehose
  cdp/stderr.log
  cdp/summary.json   {sessionId, duration, totalEvents, pages[]}
  cdp/network/{requests,responses,finished,failed,websocket}.jsonl
  cdp/console/{logs,exceptions}.jsonl
  cdp/runtime/all.jsonl   cdp/log/entries.jsonl
  cdp/page/{navigations,lifecycle,frames,dialogs,all}.jsonl
  cdp/dom/all.jsonl       (only if DOM domain enabled)
  cdp/target/{attached,detached}.jsonl
  cdp/pages/000/ {url.txt, summary.json, raw.jsonl, <non-empty buckets>}
  screenshots/<iso-ts>.png   dom/<iso-ts>.html
  snapshot-loop.log
  browserbase/{session.json, logs.json, downloads.zip}   (finalize only)
```

Settings: `O11Y_ROOT` (default `.o11y`), `O11Y_DOMAINS` (space-separated, default `Network Console Runtime Log Page`; add DOM with `O11Y_DOMAINS="$O11Y_DOMAINS DOM"`), sampler interval (default 2 s), `BB_SESSION_TIMEOUT` (default 600 s). The Browserbase manifest block holds `session_id, project_id, region, started_at, expires_at, keep_alive, debugger_url`. The Browserbase wrapper prints the signed `connectUrl` truncated to 60 characters. Discard a downloads zip of 22 bytes or less (an empty archive). Exit codes: 2 usage error, 1 runtime failure. The scripts need Node 18+, `browse` with `browse cdp`, optionally `jq`, and only the Node standard library.

## Bisecting the stream

| Bucket | CDP method | Contents |
|---|---|---|
| network/requests | `Network.requestWillBeSent` | url, method, headers, postData, requestId |
| network/responses | `Network.responseReceived` | status, headers, mimeType, remoteIPAddress, fromDiskCache |
| network/finished | `Network.loadingFinished` | byte count, timestamp |
| network/failed | `Network.loadingFailed` | errorText (such as `net::ERR_ABORTED`), `canceled` |
| network/websocket | `Network.webSocket*` | WebSocket lifecycle |
| console/logs | `Runtime.consoleAPICalled` | console calls with `args[]` |
| console/exceptions | `Runtime.exceptionThrown` | unhandled errors with stack |
| runtime/all | `Runtime.*` | contexts, bindings |
| log/entries | `Log.entryAdded` | CSP, deprecation, mixed content |
| page/navigations | `Page.frameNavigated` | top and iframe navigations |
| page/lifecycle | `Page.lifecycleEvent` | init, commit, DOMContentLoaded, load, firstPaint, firstContentfulPaint, firstMeaningfulPaint, networkAlmostIdle, networkIdle |
| page/dialogs | `Page.javascriptDialog*` | alert, confirm, prompt, beforeunload |
| page/frames | `Page.frame*` | attached, detached, started and stopped loading |
| page/all | `Page.*` | catch-all |
| dom/all | `DOM.*` | mutations |
| target/attached, detached | `Target.attachedToTarget`, `Target.detachedFromTarget` | |

- **Buckets overlap:** an event can land in both `console/logs` and `runtime/all`.
- **Write per-page buckets only when non-empty** so empty files don't pollute searches; always write session-wide buckets, even empty, for a predictable shape.
- **Bisecting is idempotent:** reruns overwrite the buckets and rebuild `cdp/pages/`.
- **A top-level navigation is a `Page.frameNavigated` whose `params.frame.parentId` is null or `''`.** Each one increments the page id (padded `000`, `001`). Events before the first navigation belong to page 0 (their requests really are part of loading that page); zero events still produce page 0. The page URL is the first top navigation in the slice, else `(initial)`.
- **Use each CDP event's declared clock and unit.** Network.requestWillBeSent supplies a paired monotonic `timestamp` and epoch-seconds `wallTime`; convert other compatible monotonic timestamps by their difference from that pair. Preserve unavailable alignment when no pair exists. The old recipe anchored the first observed event to the manifest start, which is not a measured clock pair. [CDP Network.requestWillBeSent](https://chromedevtools.github.io/devtools-protocol/tot/Network/#event-requestWillBeSent)
- **Per-page rollups:** counts per domain, with `Runtime.consoleAPICalled` remapped to a `Console` domain. Errors are `Network.loadingFailed`, `Runtime.exceptionThrown`, console `type=error` and `Log.entryAdded` level `error`; warnings are console `warning` or `warn` and log `warning`. Error and warning keys appear only when non-zero; a `network` block `{requests, failed, byType}` (type from `params.type ?? 'Other'`) only when there were requests or failures.

```json
{ "sessionId": "...", "duration": {"startMs":..., "endMs":..., "totalMs":...}, "totalEvents": 420,
  "pages": [{ "pageId":0, "url":"https://example.com/", "startMs":..., "endMs":..., "durationMs":5886,
    "eventCount":60, "domains": {"Network":{"count":18,"errors":1}, "Console":{"count":2}, ...},
    "network": {"requests":4, "failed":1, "byType":{"Document":2,"Script":1,"Other":1}} }] }
```

## Querying

`node scripts/query.mjs <run> list | summary | page <pid> [bucket|raw] | errors [pid|all] | hosts [pid|all] | host <hostname> [pid|all] | timeline`

- **`errors`** emits NDJSON tagged `{pid, kind}` with kinds `network.failed`, `runtime.exception`, `console.error`, `log.error`.
- **Match hosts exactly** with `new URL(url).host === host` (port included), so `hosts` output feeds `host` directly and an impostor like `example.com.evil.tld` doesn't pass a prefix or substring test.
- **Take order from the raw stream, not the buckets:** per-method buckets would print every navigation before the lifecycle markers.

jq recipes (run inside the run folder):

- Failed requests: `jq -c '.params' cdp/network/failed.jsonl`
- 4xx and 5xx: `jq -c 'select(.params.response.status >= 400) | {status: .params.response.status, url: .params.response.url}' cdp/network/responses.jsonl`
- Exceptions: `jq -c '.params.exceptionDetails | {text, line: .lineNumber, url, stack: .stackTrace.callFrames[0:3]}'`
- Console errors with their source: `.params.stackTrace.callFrames[0].url` and `lineNumber`, message from `.params.args[0].value // .description`.
- Top-frame navigations only: `select(.params.frame.parentId == null)`
- XHR and fetch only: `select(.params.type == "XHR" or .params.type == "Fetch")`
- Slow responses over 1000 ms: join `requests.jsonl` to `finished.jsonl` by `requestId`, `(finished.ts - start.ts) * 1000` (both monotonic seconds).
- Lifecycle timing per navigation: `group_by(.params.loaderId)`, subtract the `init` timestamp from DOMContentLoaded, load, firstContentfulPaint and networkIdle.
- **Pending-request candidates:** compare request IDs sent against IDs finished and failed, keeping each input file's records separate. A capture that starts late or ends early has incomplete lifecycle coverage. The old `jq -s` recipe incorrectly treated its first three NDJSON records as per-file arrays; slurping combines the individual input JSON values. Do not retain that broken recipe or infer a hang from one unmatched request alone. [jq slurp](https://jqlang.org/manual/#invoking-jq); [browserbase/skills, browser-trace]

- Third-party audit: top hosts with `awk -F/ '{print $3}' | sort | uniq -c | sort -rn`; everything not on your domain with `test("your-site\\.example") | not`.
- Join an event to the nearest screenshot: convert its time to `%Y%m%dT%H%M%SZ` and take the first sorted screenshot name at or after it (the last one before it for "right before").
- An element that came and went: `rg -l 'class="error-banner"' .o11y/<run>/dom/`. Live view: `tail -f raw.ndjson | jq -c '{m: .method, ...}'`. Size: `du -sh .o11y/<run>`.
- Browserbase proxy bytes (billed per byte) versus per-host attribution: `jq '.proxyBytes' browserbase/session.json` against `jq -s 'map(.params.encodedDataLength // 0) | add' cdp/network/finished.jsonl`.

## Capture the cause before the trigger

[bgauryy/octocode, octocode-chrome-devtools/references/script-patterns-observe.md, har-capture.md and cdp-agent.md]

- Attach the needed observation listeners before navigation or the user action that produces the evidence. Diagnose one stated intent, keep the same target/session while checking it, and verify the observed result before switching browsers.
- Query existing summaries, failures, slow requests and bounded pages of artifacts before launching another capture. Keep raw evidence locally and return counts, decisive excerpts and artifact paths rather than a full traffic dump.
- Treat HAR and captured bodies as private input until secrets are reviewed and redacted. The supplied ingestion helper can preserve short secret bodies and a raw original; its redacted-corpus claim is not a guarantee adopted here. [bgauryy/octocode, octocode-scraping/scripts/har-ingest.mjs]
- Performance collection must use `PerformanceObserver` for LCP and layout-shift entries. The supplied measure script used `getEntriesByType`, which cannot return those entry types. [MDN Performance.getEntriesByType](https://developer.mozilla.org/en-US/docs/Web/API/Performance/getEntriesByType); [bgauryy/octocode, octocode-chrome-devtools/scripts/cdp-checks/performance-measure-check.mjs]

## Debug playbooks

- **Form submit does nothing:** did the POST go out, did it return 4xx or 5xx, any console error or exception at the click, what does the latest DOM dump show? a missing POST is an observation, not proof that the click handler is broken: inspect the button, browser validation, actual request method and capture coverage before assigning a cause; 4xx means read the response; an exception's stack frame gives file and line.
- **Third-party leakage:** the hosts table, every URL off your domain, non-2xx responses with their mime type.
- **Page hangs:** the last completed navigation, pending requests, `cdp/page/dialogs.jsonl` for a blocking JS dialog, the last screenshot.
- **Exception only in production:** reproduce on the same remote browser configuration as production, filter exceptions by message, find the screenshot just before, list the requests in the 5 s before the throw.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `browse cdp exited immediately` | Target unreachable or cloud session ended | `curl http://localhost:9222/json/version`; `browse cloud sessions get <id>`; if `COMPLETED`, recreate with `--keep-alive` and attach the automation first |
| `error: unknown command 'cdp'` | Old `browse` | `npm install -g browse@latest` |
| Empty `raw.ndjson` | Nothing driving the page; an idle browser yields about 5 attach and discover lines | Confirm a client is actually driving |
| Screenshots identical | Page hasn't navigated; the sampler runs independently of the automation | Check `url` in `index.jsonl` |
| Session ends mid-run | Hit `--timeout` | `BB_SESSION_TIMEOUT=1800 node scripts/bb-capture.mjs --new ...` |
| Attach says not RUNNING | Session ended | List RUNNING sessions and retry |
| `logs.json` is `[]` | Cloud session logs are sparse and best-effort | Expected: the firehose is the source of truth |
| No session replay | Replay fetching is deprecated | Use `screenshots/` and `dom/` |
| `index.jsonl` url `""` | Transient URL read failure during navigation | Benign |
| Screenshot sizes differ | Viewport not set | `browse viewport 1920 1080 --cdp <target>` before capture |
| Buckets empty, raw grows | Domain not enabled | Set `O11Y_DOMAINS` |
| Sampler leaks after a crash | Stop not run | `pkill -f snapshot-loop.mjs`; PID files are stale |
| `lifecycle.jsonl` empty | Old `browse` build | Upgrade `browse` |

Run the capture script with `node`, as in `O11Y_DOMAINS=... node scripts/start-capture.mjs ...`; it is a Node module, not a bash script.

## Prove it

The manifest has both `started_at` and `stopped_at`; `cdp/summary.json` shows a non-zero event count with one page per top-level navigation; no capture process is still alive after stop; and the diagnosis cites the specific lines (a failed request, a pending requestId, an exception, a dialog) with their timestamps.
