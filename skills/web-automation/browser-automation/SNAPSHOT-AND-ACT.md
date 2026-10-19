# The snapshot and act loop

## The loop

Open, snapshot, act on a ref, snapshot to confirm, repeat, stop.

- **Read the page as an accessibility-tree snapshot by default.** It is fast, structured and gives element refs. Screenshots are slow and spend vision tokens: take one only for layout, images or debugging.
- **Re-snapshot after every action and every navigation.** Refs invalidate whenever the DOM changes; use refs only from the latest snapshot.
- **Never invent a ref.** If you haven't seen `[X-Y]` in the snapshot output, it doesn't exist. Snapshot first, then click.
- **Prefer `fill` over `type` for inputs:** fill clears the existing text first.
- **When an action fails, snapshot and try a different approach.** Do not repeat the same failing action.
- **Read pages for analysis as markdown** (`get markdown`) rather than text or HTML: it keeps links, headings and structure without the HTML noise.
- **End with the answer as a JSON code block.**

## When something goes wrong

| Symptom | Do |
|---|---|
| Element not found | Snapshot |
| Page seems empty | `wait timeout 1000`, then snapshot; if you know the target element, wait for its selector |
| Dropdown didn't open | Wait briefly, snapshot |
| Slider won't move with a click | Click the thumb, then press ArrowRight or ArrowLeft |
| XPath click fails to advance the page | Click by ref from a fresh snapshot |
| Button missing | It may render only after a prior choice; snapshot after making it |

Site lessons that recur:

- **The real entry URL may differ from the one you were given.** Navigate directly to the actual form URL.
- **Map or geocoder-driven fields:** don't type into the derived field. Type into the search box, wait 2000 ms, snapshot, click the suggestion, press Enter, wait 3000 ms, press Tab.
- **Stable CSS ids** can be filled directly (`fill "#id"`); they are selectors, not snapshot refs. The source also suggested reusing some refs across sessions. Keep this file's existing latest-snapshot rule for every ref. [browserbase/skills, browser; existing snapshot-and-act contract]
- **The turn budget is a failure mode.** A form can succeed while the agent runs out of turns before reading the confirmation: extra verification snapshots, retries by another method, screenshots and `get value` checks all spend turns. Prescribe a turn-by-turn budget and make the last turn a JSON output with no tool call.

## Waiting

- **Wait on a condition, not a guess:** a load state, a selector, or (in scripts) the response you need.
- **`networkidle` has two readings.** The `browse` CLI recommends `open --wait networkidle` for single-page apps that fetch after load. Stagehand's guidance says avoid it in deterministic runs: it never fires on sites with continuous background traffic (Google, analytics, long-poll or websocket) and throws after a 15 s timeout; use `domcontentloaded` or `load`, then wait for the element that matters.

## Tools

### `browse` CLI (Browserbase, npm package `browse`)

Install or check: `which browse || npm install -g browse`. Refs look like `@0-5` or `[0-5]`.

- **A daemon owns the browser.** It auto-starts on the first command (such as `browse open`), persists across commands and stops with `browse stop`. After `browse open ... --cdp "$CONNECT_URL"`, later commands don't repeat `--cdp`: the daemon remembers the target.
- **Modes** (local, attach, CDP, remote) are in [LOCAL-AND-CLOUD.md](LOCAL-AND-CLOUD.md).

| Group | Commands |
|---|---|
| Navigation | `open <url>` (`--wait load\|domcontentloaded\|networkidle`, default `load`), `reload`, `back`, `forward` |
| State | `snapshot` (`--compact` = tree only, no ref maps), `screenshot` (prints base64 JSON; `--path`, `--full-page`), `get url\|title\|text\|html\|markdown\|value\|box\|visible\|checked [selector]`, `refs` (cached ref map of the last snapshot) |
| Interaction | `click <ref>`, `click_xy <x> <y>`, `hover <x> <y>`, `type <text>` (`--delay 100` ms per key), `fill <selector> <value>` (`--press-enter`), `select <selector> <values...>`, `upload <selector\|ref> <files...>` (remote uses base64 injection), `press <key>` (Enter, Tab, Escape, Cmd+A, Ctrl+C) |
| Mouse | `mouse scroll <x> <y> <dx> <dy>` (positive dy scrolls down), `mouse drag <x1> <y1> <x2> <y2>` (default 10 steps; `--steps 20`, `--delay 50`, `--button right`, `--return-xpath`), `highlight <selector>` (default 2 s; `-d 5000`) |
| Checks and waits | `is visible\|checked <selector>` (returns `{visible: bool}`), `wait load`, `wait selector ".results"`, `wait timeout 3000` |
| Session | `start`, `stop` (`--force`), `status` (resolved mode and target), `tab new [url]`, `tab list`, `tab switch <index\|targetId>`, `tab close [index]` (refuses to close the last tab) |
| Other | `eval "<js>"`, `viewport 1920 1080`, `network on\|off\|path\|clear` (requests and responses saved as JSON files in a temp dir), `--session <name>` or `BROWSE_SESSION` for several concurrent browsers |

- **`get text` and `get html` require a selector;** use `"body"` for the whole page. `get markdown` defaults to body.
- **Wait syntax:** `browse wait load` and `browse wait timeout 2000` work; `browse wait ms 2000` and `browse wait 2000` error.
- **`browse cdp <port|ws url>`** streams CDP events as NDJSON, bypassing the daemon, until Ctrl+C. Default domains Network, Console, Runtime, Log, Page; `--domain X` is repeatable; `--pretty` is automatic on a TTY; a bare port auto-discovers through `/json/version`. Example: `browse cdp 9222 | jq 'select(.method == "Network.requestWillBeSent") | .params.request.url'`. Recording a run with it is [RUN-TRACING.md](RUN-TRACING.md).

| Error | Fix |
|---|---|
| "No active page" | `browse open <url>`; else `browse stop` and check `browse status`; for a zombie daemon `pkill -f "browse.*daemon"` |
| "Chrome not found" | Install Chrome, or use `--auto-connect` or `--remote` |
| "Daemon not running" | `snapshot` and `click` need an active session: run `browse open` |
| Ref not found | The page changed: re-snapshot |
| Timeouts | `browse wait load` before interacting, or wait longer |
| Browserbase fails | Verify the API key |

### `agent-browser` CLI

A native Rust CLI that speaks CDP directly (no Playwright or Puppeteer), with accessibility-tree snapshots and compact `@eN` refs; it also claims sessions, an auth vault, state persistence and video recording. Install with `npm i -g agent-browser && agent-browser install`.

- **Load its instructions from the CLI before any command:** `agent-browser skills get core` (`--full` for the full reference); `skills list` shows the others (electron, slack, dogfood, derive-client for recording a HAR and deriving a standalone API client, vercel-sandbox, protected-vercel-deployments, agentcore). Content served by the installed CLI always matches its version, which a static copy can't.
- **Its dashboard runs on port 4848** (or proxied at `https://dashboard.agent-browser.localhost`); stay on the dashboard origin, session ports need not be exposed.
- **The two CLIs use different refs:** `agent-browser` refs are `@eN`, `browse` refs are `@0-5`.

## Prove it

The run's trace shows each action followed by a fresh snapshot, no ref used that the latest snapshot didn't contain, no identical action repeated after a failure, and a final turn that is the JSON answer within the turn budget.
