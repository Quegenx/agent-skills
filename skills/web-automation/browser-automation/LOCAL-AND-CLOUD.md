# Local, attached or cloud browser

## Choosing

| Situation | Browser |
|---|---|
| Clean, reproducible local test | Isolated local browser |
| Reuse your local login | Attach to your already-running Chrome |
| Simple public sites: docs, wikis, public APIs, localhost | Local |
| Protected sites: login walls, CAPTCHAs, anti-scraping | Remote, stealth |
| Local fails with bot detection or access denied | Switch to remote |

- **Escalate on signals, not by default:** CAPTCHAs (reCAPTCHA, hCaptcha, Turnstile), "Checking your browser..." interstitials, HTTP 403 or 429, empty pages on sites that should have content, or the user asks. Don't switch for simple sites.
- **On a third-party site, a block is a stop signal, not an escalation trigger:** the table above applies to the user's own or authorized sites; the rule and its sources are [SKILL.md](SKILL.md#the-rules) rule 3.
- **Ask the user before escalating to a paid service.** Tell them what blocked you (for example Cloudflare) and ask whether to set it up.
- **Keep a debug browser isolated** with its own `--user-data-dir`, and set the viewport before capture so screenshots are a consistent size.

## Local versus Browserbase (vendor)

| | Local | Browserbase |
|---|---|---|
| Speed | Faster | Slightly slower |
| Needs | Chrome installed | API key |
| Verified browser (Identity) | No | Yes |
| CAPTCHA solving | No | Automatic reCAPTCHA and hCaptcha |
| Proxies | No | Residential, 201 countries, geo-targeting |
| Cookies and auth across runs | No | Persist through contexts |
| Parallel tasks | One at a time | Up to 20+ |

## Modes in the `browse` CLI (vendor)

- **`--local`:** a clean isolated browser; the default when `BROWSERBASE_API_KEY` is unset.
- **`--auto-connect`:** attach to an already-running debuggable Chrome, reusing your cookies and login.
- **`--cdp <port|url>`:** a specific CDP target.
- **`--remote`:** Browserbase; the default when `BROWSERBASE_API_KEY` is set. `BROWSERBASE_PROJECT_ID` is an optional passthrough.
- **Mode flags apply only when a session starts.** An active session does not switch between local and remote: run `browse stop` before `browse open <url> --remote` if a daemon may be running. After `stop`, the next start falls back to detecting the env var.
- **`--session <name>` names the local daemon, not a cloud session.** Use a named session when the default daemon may be active in another mode.
- **Stealth session:** `browse cloud sessions create --keep-alive --verified --proxies`; drop `--verified` or `--proxies` for low-anti-bot sites.

## Cloud session lifecycle (Browserbase)

- **A session ends as soon as its last CDP client disconnects.** Create it with `--keep-alive` and attach the real automation to its `connectUrl` before or together with any observer, or the session dies when a short-lived client closes.
- **Keep-alive sessions persist until explicitly closed and consume resources.** Release them: `browse cloud sessions update "$SESSION_ID" --status REQUEST_RELEASE`.
- **Release only sessions you own.** Never end a production worker's session you attached to for debugging.
- **List running sessions client-side;** there is no `--status` flag: `browse cloud sessions list | jq -r '.[] | select(.status == "RUNNING") | .id'`.
- **A session hitting `--timeout` ends mid-run.** Raise the timeout when creating it (the tracing wrapper reads `BB_SESSION_TIMEOUT`, default 600 s, for example `1800`).
- **Connect within about 5 minutes** of creating a session for a framework run, or it terminates.
- **Configure proxies, stealth and region on the session,** not on the framework that drives it. Session create parameters through Stagehand's `browserbaseSessionCreateParams`: `projectId`, `region` (us-east-1, us-west-2, eu-central-1, ap-southeast-1), `proxies`, `keepAlive`, `browserSettings.{blockAds, solveCaptchas (default on), advancedStealth (Scale plan), context}`; downloads through `bb.sessions.downloads.list(id)`.
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

`browse status` (or the equivalent) shows the resolved mode and target before the run; an escalation is backed by the observed signal (the 403, the CAPTCHA page) and the user's yes; after the run the cloud session list shows no keep-alive session of yours still `RUNNING`.
