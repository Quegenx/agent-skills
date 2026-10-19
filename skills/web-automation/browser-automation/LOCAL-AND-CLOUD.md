# Local, attached or cloud browser

## Choosing

| Situation | Browser |
|---|---|
| Clean, reproducible local test | Isolated local browser |
| Reuse your local login | Attach to your already-running Chrome |
| Simple public sites: docs, wikis, public APIs, localhost | Local |
| Authorized site that needs an existing account session | Attach to the permitted signed-in session |
| Third-party site blocks access | Stop and report the limit |

- **Do not solve CAPTCHAs or evade bot detection.** A blocked third-party page is a stop signal. Report the access limit and use only the material the user is authorized to access. [coreyhaines31/marketingskills, prospecting; owner safety policy]
- **Ask before using a paid browser service.** Keep its purpose and access within the authorized scope. [owner safety policy]
- **Keep a debug browser isolated** with its own `--user-data-dir`, and set the viewport before capture so screenshots are a consistent size.

## Selecting an attached page

[cursor/plugins, control-ui/SKILL.md]

- Reuse the installed browser harness before adding another. When a debug port has several pages, select the requested app by a positive stable marker, with an exclusion marker when needed; tab order alone is not identity.
- If no page matches, report the available titles and URLs instead of choosing the first tab. Keep selectors, ports and script paths tied to the current repository, and leave sessions you did not create running.
- Playwright documents its Chromium CDP attach path as lower fidelity than a Playwright-protocol connection. Check the installed version and browser support before relying on advanced behavior; an attached browser is not a promise of equivalent capabilities. [Playwright BrowserType.connectOverCDP](https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp)
- Chrome 136+ does not honor the command-line remote-debugging switches on the default Chrome data directory; use a separate user data directory for that route. The consent-based existing-profile route is described in [SIGNED-IN-SESSIONS.md](SIGNED-IN-SESSIONS.md#enabling-remote-debugging). The source's normal-profile fallback is stale for that contract. [Chrome remote debugging change](https://developer.chrome.com/blog/remote-debugging-port); [bgauryy/octocode, octocode-chrome-devtools/scripts/open-browser.mjs]

## Local versus Browserbase (vendor)

| | Local | Browserbase |
|---|---|---|
| Speed | Source describes it as faster; no measured guarantee | Source describes it as slightly slower; no measured guarantee |
| Needs | Chrome installed | API key |
| Cookies and auth across runs | Attached mode reuses the selected profile; isolated mode starts clean | Persist through contexts |
| Parallel tasks | Separate named daemon sessions are supported | Limited by the project's configured concurrency |

The old comparison said local authentication never persisted and local work was always serial, while cloud allowed "20+". Those are not universal limits: mode and session ownership matter. Read project concurrency rather than copying that number. [browserbase/skills, browser]; [Browserbase project-concurrency example](https://docs.browserbase.com/integrations/vercel/quickstart)

## Modes in the `browse` CLI (vendor)

- **`--local`:** a clean isolated browser; the default when `BROWSERBASE_API_KEY` is unset.
- **`--auto-connect`:** attach to an already-running debuggable Chrome, reusing your cookies and login.
- **`--cdp <port|url>`:** a specific CDP target.
- **`--remote`:** Browserbase; the default when `BROWSERBASE_API_KEY` is set. `BROWSERBASE_PROJECT_ID` is an optional passthrough.
- **Mode flags apply only when a session starts.** An active session does not switch between local and remote: run `browse stop` before `browse open <url> --remote` if a daemon may be running. After `stop`, the next start falls back to detecting the env var.
- **`--session <name>` names the local daemon, not a cloud session.** Use a named session when the default daemon may be active in another mode.

## Cloud session lifecycle (Browserbase)

- **Without keep-alive, a session ends when its CDP connection closes.** Create it with `--keep-alive` when it must survive disconnects, and attach the real automation to its `connectUrl` before or together with any observer. The old line omitted the keep-alive condition. [Browserbase keep alive](https://docs.browserbase.com/platform/browser/long-sessions/keep-alive)
- **Keep-alive sessions persist across disconnects until released or their session timeout, and consume resources.** Release them when done: `browse cloud sessions update "$SESSION_ID" --status REQUEST_RELEASE`. The old wording omitted the timeout. [Browserbase keep alive](https://docs.browserbase.com/platform/browser/long-sessions/keep-alive)
- **Release only sessions you own.** Never end a production worker's session you attached to for debugging.
- **List running sessions client-side;** there is no `--status` flag: `browse cloud sessions list | jq -r '.[] | select(.status == "RUNNING") | .id'`.
- **A session hitting `--timeout` ends mid-run.** Raise the timeout when creating it (the tracing wrapper reads `BB_SESSION_TIMEOUT`, default 600 s, for example `1800`).
- **Connect within about 5 minutes** of creating a session for a framework run, or it terminates.
- **Configure the authorized session lifecycle at creation,** including its region, keep-alive and context. Session reuse does not expand the identity or site access granted to the run. [coreyhaines31/marketingskills, prospecting; owner safety policy]
- **Live view versus trace:** `browse cloud sessions debug` gives a URL for interactive DevTools on a live run; a recorded trace is the durable, searchable postmortem. Use both.

### Login once, reuse

```bash
SESSION_JSON="$(browse cloud sessions create --context-id ctx_abc123 --persist --keep-alive)"
SESSION_ID="$(echo "$SESSION_JSON" | jq -r .id)"
CONNECT_URL="$(echo "$SESSION_JSON" | jq -r .connectUrl)"
browse open https://app.example.com/login --cdp "$CONNECT_URL"
# ...
browse stop
browse cloud sessions update "$SESSION_ID" --status REQUEST_RELEASE   # state saved to context
```

`--persist` saves cookies and storage back to the context on release and requires `--context-id`; omit it on later sessions when you don't want their changes saved. `--keep-alive` keeps the cloud session alive while the local daemon attaches and detaches. Filling a context from your local browser's cookies is [SIGNED-IN-SESSIONS.md](SIGNED-IN-SESSIONS.md).

### Raw CDP to a cloud page

Connect `wss://connect.browserbase.com?apiKey=...&sessionId=...`, call `Target.getTargets`, find `type === 'page'`, `Target.attachToTarget {targetId, flatten: true}`, then send commands with the returned `sessionId`: `Page.navigate`, wait 3 s, `Page.captureScreenshot {format: 'png'}` and base64-decode it to a file.

## Prove it

`browse status` (or the equivalent) shows the resolved mode and target before the run; a multi-page attach identifies the app with an observed marker, and a block is reported without evasion; after the run the cloud session list shows no keep-alive session of yours still `RUNNING`. [cursor/plugins, control-ui/SKILL.md; coreyhaines31/marketingskills, prospecting]
