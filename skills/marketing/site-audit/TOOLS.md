# Audit Kit, test links and FreeScan

Two smaller tools besides squirrelscan ([SQUIRRELSCAN.md](SQUIRRELSCAN.md)): Audit Kit, a free MIT CLI that writes a client-audit workspace ([Danilaa1/auditkit](https://github.com/Danilaa1/auditkit), audit-kit.dev, 0.1.8), and FreeScan, a hosted 40-check public-page audit with an MCP server (freescan.app, no licence: restated, short quotes). Running Lighthouse yourself, with budgets and CI, is in [web-performance LIGHTHOUSE-CI.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/LIGHTHOUSE-CI.md).

## Audit Kit

[audit-kit, README.md and src/cli.ts]

| Command | Does |
|---|---|
| `ak <url>` | The full audit (a shortcut for `inspect`) |
| `ak check [url]` | HTML and SEO basics |
| `ak security [url]` | Response headers and cookies |
| `ak lighthouse [url]` | A Lighthouse run |
| `ak new` | Create a workspace (asks the intake questions in [CHECKLIST.md](CHECKLIST.md#start-with-the-outcome)) |
| `ak inspect [latest\|workspace]` | Run every check and update the workspace |
| `ak report [latest\|workspace]` | Write `final-report.md` and `client-email.md` ([FIX-BRIEFS.md](FIX-BRIEFS.md)) |
| `ak list` | List workspaces |

Options: `--save [folder]` (also `--save=folder`, a workspace name, or `latest`), `--no-color` or `NO_COLOR`, `-h`, `-v`. Exit code 2 for usage errors, 1 for everything else.

**The workspace** is `audits/<YYYY-MM-DD>-<slug>/` beside the project (under `./audits` in the current directory, "instead of inside a global npm installation"), holding `brief.md`, `workspace.md`, `findings.md`, `final-report.md`, `client-email.md` and `raw/lighthouse.json`; "latest" is the last folder in sorted order, and generated audit folders are git-ignored.

**The fetch** is one GET that names itself (`user-agent: AuditKit`, `accept: text/html,application/xhtml+xml`, `redirect: follow`, a 30-second timeout) and reports the final URL after redirects.

**The Lighthouse run** launches headless Chrome through `chrome-launcher` (`--headless --disable-gpu`) and calls `lighthouse(url, { port, output: "json", onlyCategories: ["performance","accessibility","best-practices","seo"] })`, killing Chrome in `finally`. The browser is found from config `browserPath`, then `AUDITKIT_BROWSER_PATH`, then `CHROME_PATH`, then the macOS app paths for Helium, Chrome, Chromium, Brave and Edge.

**What is stale in it:**

- It depends on `lighthouse ^13.3.0` but reads 14 pre-13 audit ids for its opportunity list. Chrome's post on moving Lighthouse to insights says Lighthouse 13 replaces `render-blocking-resources` with `render-blocking-insight`; `uses-optimized-images`, `modern-image-formats` and `uses-responsive-images` with `image-delivery-insight`; `server-response-time`, `redirects` and `uses-text-compression` with `document-latency-insight`; and `third-party-summary` with `third-parties-insight` ([Chrome blog](https://developer.chrome.com/blog/moving-lighthouse-to-insights)). Those 8 ids read `undefined` and drop out silently, so its opportunity list is incomplete.
- Its score colours (85 and 65) and its "Core Web Vitals" labels (TBT in place of INP) differ from Lighthouse and web.dev ([CHECKLIST.md](CHECKLIST.md#performance-lab-and-field), [SCORING.md](SCORING.md#lighthouse-bands)).
- Its HTML checks read server HTML with regex and its header checks test presence only ([CHECKLIST.md](CHECKLIST.md#security-headers-by-value)).
- Its home page still says "Rust runs the checks and reports" and shows v0.1.6; the repo is TypeScript at 0.1.8 ("No Rust toolchain or build step is needed"). Its `robots.txt` names a sitemap on a different domain (`auditkit.dev`, another company's product) while `audit-kit.dev/sitemap.xml` returns 404.

## Test links

Audit Kit writes these into each workspace, with the site URL passed through `encodeURIComponent` [audit-kit, src/workspace.ts]:

- PageSpeed Insights: `https://pagespeed.web.dev/analysis?url=<url>`
- Rich Results Test: `https://search.google.com/test/rich-results?url=<url>`
- metatags.io (third party, a social preview): `https://metatags.io/?url=<url>`

What each structured-data result means is in [seo STRUCTURED-DATA.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/STRUCTURED-DATA.md); link previews per platform are in [seo LINK-PREVIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/LINK-PREVIEWS.md).

## FreeScan

[freescan, agents/guide.md and agents/skill.md] A remote MCP server over Streamable HTTP.

- **Connect:** public endpoint `https://www.freescan.app/mcp`, no auth; Pro at `/mcp/pro` with browser OAuth. `claude mcp add --transport http freescan https://www.freescan.app/mcp`.
- **Tools:** `capabilities`; `start_free_scan` (`url`, a UUID `requestId`, `publishPublicReport: true`); `get_free_scan` (`scanId`, `scanToken`); `get_public_report` (`reportId`, optional `checkId`, `category` of `seo_aeo`, `security`, `accessibility` or `design`, `format` of `summary`, `json`, `markdown` or `prompts`); `get_public_evidence_image`; and Pro tools for sites, runs, page scans, reports, the workspace and `update_pro_fix_status` with `expectedStatus`. Each also answers at `POST /api/agents/TOOL_NAME` (8 KB body, 120 requests a minute).
- **Saved reports:** read `/scan/ID/summary.json` first, then `report.md`, `report.json` or `fix-prompts.md`. A GET never starts a scan, and a 404 is neither a pass nor a fail.
- **A free scan publishes a public report.** Tell the user before starting one.
- **Limits:** 8 outstanding agent scans; 100 an hour and 500 a day across agent traffic; 6 requests per connection per 10 minutes; 5 an hour per connection and domain; 10 an hour per target.

The agent pattern FreeScan prescribes [freescan]: generate the idempotency UUID once and reuse it on uncertain retries; poll no faster than `pollAfterSeconds` (5 s); stop after 5 minutes and report the unresolved state rather than start another scan; honour `Retry-After` on 429 and 503, and "do not switch identities, paths, or connectors to bypass limits"; update status with `expectedStatus` so concurrent edits don't clobber each other; and private Pro results never fall back to a free scan or a public report.

## Prove it

Audit Kit's opportunity list was checked against the Lighthouse 13 insight ids before anyone read it as complete; its Lighthouse colours were not used in a report; every test link was built with the encoded URL; the user agreed to a public report before any FreeScan free scan; a scan request reused its UUID on retry, polled no faster than the server allowed, stopped at 5 minutes, and never changed identity to get past a limit.
