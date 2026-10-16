# A scraping MCP server

## Auth on Streamable HTTP

On stdio only the program that started the server can reach it; on Streamable HTTP anyone who can reach the port can call every tool, including fetching any URL from the machine running it.

- **Refuse to start on HTTP without a token.** Generate one with `openssl rand -hex 32`.
- **Pass the token by environment variable, not argument:** a CLI argument leaks into shell history and the process list.
- **Clients send `Authorization: Bearer <token>`;** a missing token gets 401.
- **No-auth is an explicit opt-in that logs a warning;** with the host bound to `0.0.0.0` it opens every tool to the network.
- **Add DNS-rebinding protection** with an allowed-host list.
- **Plain HTTP sends the token in cleartext;** put a TLS-terminating reverse proxy in front.
- **One shared key:** rotating it means a restart.
- **Close sessions when done.**

## Option: Scrapling MCP server (vendor)

- **Run:** `scrapling-mcp` (stdio), or `scrapling-mcp --http [--host 0.0.0.0 --port 8000]` (host defaults to `127.0.0.1`). Docker: `docker run -i --rm pyd4vinci/scrapling mcp`; with HTTP in Docker, bind `0.0.0.0` and set the token env. Register it as `ScraplingServer`. Browser path: `--executable-path` or env `SCRAPLING_EXECUTABLE_PATH`.
- **Auth:** `--http` refuses to start without `--auth-token "$(openssl rand -hex 32)"` or, preferred, env `SCRAPLING_MCP_AUTH_TOKEN`. `--no-auth` opts out with a warning; passing both `--auth-token` and `--no-auth` keeps the token. `--allowed-host 'host:port'` (repeatable) adds DNS-rebinding protection. On stdio, auth is ignored with a warning.

### Which tool

| Job | Tool |
|---|---|
| Static page | `make_request` (GET, POST, PUT, DELETE) |
| Many static pages | `bulk_get` |
| JavaScript page | `fetch` |
| Many JavaScript pages | `bulk_fetch` |
| Protected page | `stealthy_fetch` |
| Many protected pages | `bulk_stealthy_fetch` |
| Many pages from one site in a browser | `open_session` + `session_fetch` |
| Many plain HTTP requests to one site | `open_request_session` + `session_make_request` |
| Screenshot | `open_session` + `screenshot` |

Also `close_session` and `list_sessions`: 13 tools in all.

### Defaults

- **Return shape:** `ResponseModel {status, content: list[str], url}`; `screenshot` returns `ImageContent` plus `TextContent` (the post-redirect URL).
- **`make_request`:** `extraction_type="markdown"` (or `html`, `text`), `main_content_only=true` (sanitizes hidden content, UNTRUSTED-CONTENT.md; keep it on), `css_selector` (applied after `main_content_only`), `impersonate="chrome"`, `timeout=30` s, `retries=3`, `retry_delay=1`, `stealthy_headers=true`, `http3=false`, `follow_redirects="safe"`, `max_redirects=30`, `verify=true`.
- **Browser tools:** `timeout=30000` ms, `wait=0`, `wait_selector_state="attached"`, `network_idle=false` (500 ms when on), `disable_resources=false`, `google_search=true`, `real_chrome=false`, `cookies` in Playwright format. Ad blocking (about 3,500 domains) is always on.
- **`screenshot`:** `image_type` png or jpeg, `full_page=false`, `quality` 0 to 100 (raises with png).

### Sessions

- **`session_id` is optional** (a random 12-character hex); passing one already in use raises.
- **`open_session`** takes `session_type` `"dynamic"` or `"stealthy"` and the browser-level options. Per-request options (`timeout`, `wait`, `google_search`, `network_idle`, `disable_resources`, `wait_selector`, `wait_selector_state`, `extra_headers`, and the stealth session's challenge option) go on `session_fetch`.
- **Match the call to the session:** `session_fetch` raises on a request session; `session_make_request` raises on a browser session.
- **CDP sessions:** `cdp_url` takes `ws://`, `wss://` or `http://localhost:9222`; `headless`, `real_chrome` and `executable_path` are then ignored, while locale, user agent, proxy, cookies and timezone still apply (each session gets its own context).
- **Always close sessions when done.**

## Prove it

Started with `--http` and no token, the server refuses to start. With the token in env: a request without `Authorization` gets 401, one with `Authorization: Bearer <token>` succeeds, and the token appears in neither shell history nor `ps` output. `list_sessions` is empty at the end of a run.
