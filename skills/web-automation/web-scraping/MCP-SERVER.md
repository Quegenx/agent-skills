# A scraping MCP server

From [D4Vinci/Scrapling, scrapling-official/references/mcp-server.md], checked against the [current server source](https://github.com/D4Vinci/Scrapling/blob/main/scrapling/core/ai/server.py) and [0.5 migration guide](https://github.com/D4Vinci/Scrapling/blob/main/docs/migrating-to-v0.5.md). This is a scraping server, distinct from [first-party WebMCP page tools](https://github.com/Quegenx/agent-skills/blob/main/skills/web-automation/webmcp/SKILL.md).

## Auth on Streamable HTTP

[D4Vinci/Scrapling, scrapling-official/references/mcp-server.md]

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

Current Scrapling 0.5 registers sixteen tools. The old source table listed thirteen, including removed bulk calls and obsolete browser names. Read the installed schemas before calling them. [https://github.com/D4Vinci/Scrapling/blob/main/scrapling/core/ai/server.py; https://github.com/D4Vinci/Scrapling/blob/main/docs/migrating-to-v0.5.md]

| Job | Tool |
|---|---|
| One HTTP request | `make_request` |
| One browser fetch, then close | `browser_fetch_once` |
| Open a related HTTP request session | `open_request_session` |
| HTTP request in that session | `session_make_request` |
| Open a browser session | `browser_open` |
| Navigate/fetch within that browser | `browser_fetch` |
| Read the loaded page without navigation | `browser_extract` |
| Interact with the loaded page | `browser_actions` |
| Evaluate authorized JavaScript on the loaded page | `browser_evaluate` |
| Screenshot the loaded page or element | `browser_screenshot` |
| Save or load login storage state | `browser_save_state`, `browser_load_state` |
| List or read retained network entries | `browser_network_requests`, `browser_network_request` |
| Inspect or close sessions | `list_sessions`, `close_session` |

### Defaults

- **Use the current schema's return type.** Session creation returns session_id and session_type only; inspect settings through list_sessions. The old open_session/session_fetch browser pair becomes browser_open/browser_fetch; old fetch/stealthy_fetch become browser_fetch_once; screenshot becomes browser_screenshot. Bulk tools are removed. browser_open no longer takes session_type. [https://github.com/D4Vinci/Scrapling/blob/main/docs/migrating-to-v0.5.md]
- **Narrow extraction deliberately.** HTML, Markdown and text extraction return all matching elements; snapshots require one matched element or the whole page. Snapshots carry roles, names, refs and boxes; main_content_only and pierce_shadow do not filter snapshots. Sanitized or visible output remains untrusted. [D4Vinci/Scrapling, scrapling-official/references/mcp-server.md; https://github.com/D4Vinci/Scrapling/blob/main/scrapling/core/ai/server.py]
- **Screenshots use the existing loaded page.** They do not accept a URL or implicitly reload it. Use the current schema for element/full-page and image options rather than the removed screenshot contract. [https://github.com/D4Vinci/Scrapling/blob/main/docs/migrating-to-v0.5.md]

### Sessions

- **Run calls in one browser session sequentially.** It has one current page; finish a call before starting the next. Use browser_extract after actions to inspect the result without navigation and use current refs for subsequent actions. General interaction policy remains in [browser-automation](https://github.com/Quegenx/agent-skills/blob/main/skills/web-automation/browser-automation/SKILL.md). [https://github.com/D4Vinci/Scrapling/blob/main/scrapling/core/ai/server.py]
- **Saved state is a credential.** browser_save_state writes on the MCP host and replaces an existing file; it stores cookies, localStorage and IndexedDB, not sessionStorage, open tabs or browser settings. browser_load_state replaces stored state; fetch/reload before relying on the newly loaded login. Keep the file private and outside shared evidence. [D4Vinci/Scrapling, scrapling-official/references/mcp-server.md]
- **Network reads inspect retained traffic without resending requests.** Read needed entries before close_session: closing removes MCP access and does not wait for pending captures. Missing/unfinished/evicted data is a coverage limitation. Python session-history lifetime and MCP accessibility are different contracts. [https://github.com/D4Vinci/Scrapling/blob/main/scrapling/core/ai/server.py; https://github.com/D4Vinci/Scrapling/blob/main/docs/migrating-to-v0.5.md]
- **Close sessions when finished.** Inspect list_sessions so abandoned browser and HTTP sessions are visible. [D4Vinci/Scrapling, scrapling-official/references/mcp-server.md]

## Prove it

Started with `--http` and no token, the server refuses to start. With the token in env: a request without `Authorization` gets 401, one with `Authorization: Bearer <token>` succeeds, and the token appears in neither shell history nor `ps` output. `list_sessions` is empty at the end of a run.
