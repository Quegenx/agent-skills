# Signed-in sessions and cookies

A cloud browser starts signed out. To run as you, export the cookies from a local browser where you are signed in and load them into a persistent context that later cloud sessions start from. The cookies are your credentials.

**Source-workspace prerequisite:** the sync helper, flags and flow below refer to upstream [cookie-sync](https://github.com/browserbase/skills/tree/main/skills/cookie-sync). This Markdown skill does not ship that executable helper. Check its version and supported connection route before transferring an authorized session. [browserbase/skills, cookie-sync]

## Security

- **Cookies are credentials.** Moving them moves an authenticated session to another machine: only do it with your own account.
- **One context per user or identity.** Don't mix personal and work cookies.
- **Never run several sessions on the same context at once.**
- **The sync logs only counts, never the cookies,** and sends them only over `wss://` to the target session.

## Export from the local browser

- **`context.cookies()` without URL filters returns all cookies in that BrowserContext,** not only the active tab's domain and not automatically every context in the browser. The source said every domain in the browser. The cookie-sync source uses `Storage.getCookies` and `Storage.setCookies` for reading and injection. [browserbase/skills, cookie-sync]; [Playwright BrowserContext.cookies](https://playwright.dev/docs/api/class-browsercontext#browser-context-cookies)
- **At least one tab must be open.**
- **Find the DevTools endpoint.** If `CDP_URL` matches `^wss?://.+/devtools/browser/`, use it as is. Otherwise convert `ws` to `http` (`wss` to `https`), strip a trailing `/`, GET `<base>/json/version` and use `webSocketDebuggerUrl`; fail if the response isn't OK or the field is missing. Without `CDP_URL`, read the `DevToolsActivePort` file (line 1 the port, line 2 the path) and build `ws://${CDP_HOST || '127.0.0.1'}:${port}${path}`; a file with fewer than two lines is an error.
- **`DevToolsActivePort` lives in the profile root or its `Default/` folder** (check `CDP_PORT_FILE` first):

| OS | Profile roots |
|---|---|
| macOS, under `~/Library/Application Support/` | `Google/Chrome`, `Google/Chrome Beta`, `Google/Chrome for Testing`, `Chromium`, `BraveSoftware/Brave-Browser`, `Microsoft Edge` |
| Linux, under `~/.config/` | `google-chrome`, `google-chrome-beta`, `chromium`, `vivaldi`, `vivaldi-snapshot`, `BraveSoftware/Brave-Browser`, `microsoft-edge` |
| Windows, under `%LOCALAPPDATA%` (or `~/AppData/Local`), then `User Data/` | `Google/Chrome`, `BraveSoftware/Brave-Browser`, `Microsoft/Edge` |

### Enabling remote debugging

- **Consent-based existing-profile connection, Chrome 144+:** enable remote debugging at `chrome://inspect/#remote-debugging`, use a client supporting Chrome's auto-connect flow, and accept Chrome's connection permission prompt. The source prescribed a Chrome 146 flag and a below-146 warning; Chrome documents the consent UI from 144 instead. This does not establish that the source cookie-sync helper's port-file discovery supports that flow. [Chrome existing-session debugging](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- **Command-line debug port:** the source launches with `--remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug` and sets `CDP_URL=ws://127.0.0.1:9222` (Windows: `--user-data-dir=%TEMP%\chrome-debug`, `set CDP_URL=...`). From Chrome 136, these command-line debugging switches require a non-default user-data directory. The old line prohibited every existing profile; the restriction concerns the default Chrome data directory. A newly created dedicated profile does not contain your normal profile's cookies. [browserbase/skills, cookie-sync]; [Chrome debugging-port restriction](https://developer.chrome.com/blog/remote-debugging-port)

## Convert and filter

```js
function filterCookies(cookies, domains) {
  if (domains.length === 0) return cookies;
  return cookies.filter(cookie => {
    const cookieDomain = cookie.domain.replace(/^\./, '').toLowerCase();
    return domains.some(d => cookieDomain === d || cookieDomain.endsWith('.' + d));
  });
}
function toCookieParams(cookies) {
  return cookies.map(c => {
    const param = { name: c.name, value: c.value, domain: c.domain, path: c.path,
                    httpOnly: c.httpOnly, secure: c.secure };
    if (c.expires > 0) param.expires = c.expires;
    if (c.sameSite === 'Strict' || c.sameSite === 'Lax') {
      param.sameSite = c.sameSite;
    } else if (c.sameSite === 'None' && c.secure) {
      param.sameSite = 'None';
    }
    return param;
  });
}
```

- **Match domains exactly or by dot suffix** after stripping the leading `.` and lowercasing: `google.com` matches `accounts.google.com` but not `evilgoogle.com`. Split the domain list on `,`, trim, lowercase.
- **Session cookies** (`expires <= 0`) go in without `expires`.
- **Keep `SameSite=None` only with `secure`;** browsers reject `None` without Secure, so omit it otherwise.
- **`Secure` cookies need HTTPS, except on localhost** (MDN Set-Cookie): a `Secure; SameSite=None` session on a plain-HTTP LAN IP or custom dev domain never sticks. The MDN quotes and the fix are in [asset-prep APP-RECORDING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/asset-prep/APP-RECORDING.md#local-app-gotchas).
- **Zero cookies after filtering:** warn and exit 0.

## Load into a persistent context (Browserbase)

Flow: local Chrome through Stagehand (`new Stagehand({env: 'LOCAL', localBrowserLaunchOptions: {cdpUrl}, verbose: 0, disablePino: true})`), `context.cookies()`, close; context id from `--context`, else `BROWSERBASE_CONTEXT_ID`, else `bb.contexts.create({})`; a cloud session uses `browserSettings.context = {id, persist: true}`; `context.addCookies(toCookieParams(cookies))`; close the session. The context persists and the temporary session is gone. [browserbase/skills, cookie-sync]

| Flag or env | Effect |
|---|---|
| `--domains a.com,b.com` | Filter to those domains and their subdomains |
| `--context ctx_...` | Refresh the cookies in an existing context |
| `BROWSERBASE_API_KEY` | Required |
| `BROWSERBASE_CONTEXT_ID` | Reuse a context (the cookies are injected into it) |
| `CDP_URL`, `CDP_PORT_FILE`, `CDP_HOST` | Debugging endpoint, custom `DevToolsActivePort` path, host (default `127.0.0.1`) |

- **Contexts keep cookies, localStorage and IndexedDB across sessions.** They don't expire on Browserbase's side; the cookies inside expire per the site's policy.
- **Save the context id after the first sync.**
- **Use it:** create a session with `--context-id <ctx-id> --persist --keep-alive`, open with `--cdp "$CONNECT_URL"`, and when done `browse stop && browse cloud sessions update "$SESSION_ID" --status REQUEST_RELEASE` (full snippet in [LOCAL-AND-CLOUD.md](LOCAL-AND-CLOUD.md)). `--persist` writes new cookies back on release, keeping the session fresh for next time.
- **Scheduled jobs:** sync once while the laptop is open; jobs create sessions from the context id with no local Chrome; re-run the sync with `--context <id>` when cookies expire.
- **In a migration,** replacing `user_data_dir` or `storage_state` with a persistent context (`browserSettings.context: {id, persist: true}`) is the biggest reliability win in most migrations.

## Troubleshooting

| Message | Fix |
|---|---|
| "No DevToolsActivePort found" | Use the documented command-line-port/custom-profile route and set `CDP_URL`; a consent-based connection requires a compatible client |
| "No open page targets found" | Open a tab |
| "WebSocket error" | Chrome may be hung: force quit and reopen |
| Cookies expired in the context | Re-run with `--context <id>` |
| Site rejects the auth | Stop, report the block and use an authorized sign-in or supported API. Do not use bot-detection bypass. [User policy; browserbase/skills, sync-cookies source conflict] |

## Prove it

A cloud session created from the context opens the signed-in page without a login prompt; the sync's output shows a non-zero cookie count for exactly the domains you asked for; no other session was running on that context at the time.
