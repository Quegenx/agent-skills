# Signed-in sessions and cookies

A cloud browser starts signed out. To run as you, export the cookies from a local browser where you are signed in and load them into a persistent context that later cloud sessions start from. The cookies are your credentials.

## Security

- **Cookies are credentials.** Moving them moves an authenticated session to another machine: only do it with your own account.
- **One context per user or identity.** Don't mix personal and work cookies.
- **Never run several sessions on the same context at once.**
- **The sync logs only counts, never the cookies,** and sends them only over `wss://` to the target session.

## Export from the local browser

- **`context.cookies()` over CDP returns every domain in the browser,** not just the active tab: it uses `Storage.getCookies`. Injection uses `Storage.setCookies`.
- **At least one tab must be open.**
- **Find the DevTools endpoint.** If `CDP_URL` matches `^wss?://.+/devtools/browser/`, use it as is. Otherwise convert `ws` to `http` (`wss` to `https`), strip a trailing `/`, GET `<base>/json/version` and use `webSocketDebuggerUrl`; fail if the response isn't OK or the field is missing. Without `CDP_URL`, read the `DevToolsActivePort` file (line 1 the port, line 2 the path) and build `ws://${CDP_HOST || '127.0.0.1'}:${port}${path}`; a file with fewer than two lines is an error.
- **`DevToolsActivePort` lives in the profile root or its `Default/` folder** (check `CDP_PORT_FILE` first):

| OS | Profile roots |
|---|---|
| macOS, under `~/Library/Application Support/` | `Google/Chrome`, `Google/Chrome Beta`, `Google/Chrome for Testing`, `Chromium`, `BraveSoftware/Brave-Browser`, `Microsoft Edge` |
| Linux, under `~/.config/` | `google-chrome`, `google-chrome-beta`, `chromium`, `vivaldi`, `vivaldi-snapshot`, `BraveSoftware/Brave-Browser`, `microsoft-edge` |
| Windows, under `%LOCALAPPDATA%` (or `~/AppData/Local`), then `User Data/` | `Google/Chrome`, `BraveSoftware/Brave-Browser`, `Microsoft/Edge` |

### Enabling remote debugging

- **Chrome 146 and later (recommended):** `chrome://flags/#allow-remote-debugging`, set Enabled, restart. This works with your real profile, so your real cookies are available. Warn when the detected Chrome major version is below 146.
- **Any version:** launch with `--remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug` and set `CDP_URL=ws://127.0.0.1:9222` (Windows: `--user-data-dir=%TEMP%\chrome-debug`, `set CDP_URL=...`). Chrome won't open the debugging port on an existing profile, so this is a fresh profile and **your real cookies are not in it.**

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
- **`Secure` cookies need HTTPS, except on localhost** (MDN Set-Cookie): a `Secure; SameSite=None` session on a plain-HTTP LAN IP or custom dev domain never sticks. The MDN quotes and the fix are in [APP-RECORDING.md](../../videos/asset-prep/APP-RECORDING.md#local-app-gotchas).
- **Zero cookies after filtering:** warn and exit 0.

## Load into a persistent context (Browserbase)

Flow: local Chrome through Stagehand (`new Stagehand({env: 'LOCAL', localBrowserLaunchOptions: {cdpUrl}, verbose: 0, disablePino: true})`), `context.cookies()`, close; context id from `--context`, else `BROWSERBASE_CONTEXT_ID`, else `bb.contexts.create({})`; a cloud Stagehand `{env: 'BROWSERBASE', apiKey, disableAPI: true, browserbaseSessionCreateParams: {browserSettings, proxies?}}` with `browserSettings.context = {id, persist: true}`; `context.addCookies(toCookieParams(cookies))`; close the session. The context persists and the temporary session is gone.

| Flag or env | Effect |
|---|---|
| `--domains a.com,b.com` | Filter to those domains and their subdomains |
| `--context ctx_...` | Refresh the cookies in an existing context |
| `--verified` | `browserSettings.verified = true`, the Verified browser; for sites that fingerprint, such as Google |
| `--proxy "City,ST,Country"` | `proxies: [{type: 'browserbase', geolocation: {city, state, country}}]`; city and state required, country defaults to `US`. Matches your local IP's location so auth cookies aren't rejected |
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
| "No DevToolsActivePort found" | Enable the flag, or launch with a port and set `CDP_URL` |
| "No open page targets found" | Open a tab |
| "WebSocket error" | Chrome may be hung: force quit and reopen |
| Cookies expired in the context | Re-run with `--context <id>` |
| Site rejects the auth | Add `--verified` and/or a `--proxy` near you |

## Prove it

A cloud session created from the context opens the signed-in page without a login prompt; the sync's output shows a non-zero cookie count for exactly the domains you asked for; no other session was running on that context at the time.
