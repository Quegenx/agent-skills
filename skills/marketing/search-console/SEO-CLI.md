# The seo CLI and MCP server

A tool an agent can call to read a site's own Search Console, Bing Webmaster Tools, Google Analytics and Clicky data, plus keyword and competitor data from the person's own DataForSEO or Ahrefs key. This file describes iannuttall/seo (npm package `seo`, v0.7.1 at the time it was read; Apache-2.0, Copyright 2026 Ian Nuttall; its names and artwork fall under a separate TRADEMARKS.md) from its README.md, AGENTS.md, skills/seo/SKILL.md and CLI source. In its own words it "gives no advice. You read the facts, show the person what matters, and decide with them what to change." Other tools (OpenSEO's MCP, a direct API client) reach the same data; the API is [API.md](API.md).

## Install and connect

[iannuttall/seo, README.md]
- Node 22 or newer (`package.json` engines: `node >=22.19.0`). `npm i -g seo`, then `seo start`, which signs in with Google and offers the hosted or local MCP server plus the skill. Without an install, `npx -y seo`.
- Hosted MCP server:

  ```sh
  claude mcp add --transport http seoskill https://seoskill.dev/mcp
  codex mcp add seoskill --url https://seoskill.dev/mcp
  ```

- Local MCP server: `seo mcp install` (flags `--codex`, `--claude-code`, `--cursor`, `--claude-desktop`) or `seo mcp serve` (stdio). `seo skill install` adds the agent skill. The local server adds `seo_list_providers`, `seo_describe_provider` and `seo_run_provider`.
- **Sign-in for agents** [SKILL.md]: "Sign in once with `seo login`: show the person the link it prints, then run `seo login` again after they approve." A cloud agent can pass an account-page token as `SEO_TOKEN`. `--json` "never prompts".
- **Local only** [SKILL.md; AGENTS.md]: crawls, internal links and Bing run only in the CLI or the local MCP server. Bing blocks Cloudflare's network, so the hosted server has no Bing data: "no Bing data there is not "no Bing traffic"."

## The commands

[iannuttall/seo, SKILL.md]

| CLI | MCP tool | What it returns |
|---|---|---|
| `seo report` | `seo_report` | The main report: overview, then every section's count and top rows |
| `seo page --url <url>` | `seo_page` | One URL: live page facts, Google index status, its queries |
| `seo compare --date <date>` | `seo_compare` | Equal periods before and after a date, with Google updates |
| `seo index` | `seo_index` | Pages that lost most of their clicks, checked live and with URL Inspection |
| `seo research <action>` | `seo_research` | Keyword metrics, ranked keywords, SERP, competitors, backlinks |
| `seo data` | `seo_data` | Raw Search Console, Bing (source `bing`) or Clicky (source `clicky`) rows; the MCP tool also reads Google Analytics landing pages |
| `seo crawl` | `seo_crawl` | A site crawl with technical issues and the URLs they affect |
| `seo internal-links --url <url>` | `seo_internal_links` | Pages that could link to a target page |

`seo sites` (`seo_sites`) lists properties when you do not know the property. The README writes `seo crawl <url>` where the skill writes `seo crawl`; which form is right was not checked. Report sections and what they compute are in [OPPORTUNITY-SECTIONS.md](OPPORTUNITY-SECTIONS.md).

## Flags

[iannuttall/seo, SKILL.md; packages/cli/src/commands/core-commands.ts]
- Every command needs `--site` (or `--url`): `example.com`, a URL or `sc-domain:example.com`. "Nothing is saved between runs; keep your own notes." `--url` must be a full http(s) URL.
- `compare --date` is "YYYY-MM-DD: the first day after the change", with an optional `--pages` URL substring such as `/blog/`.
- `data`: `--source search_console|bing|clicky`, `--dimensions` (default `query`), `--page` and `--query` (both "contains" filters), `--start-date` and `--end-date`.
- `research`: `--provider dataforseo|ahrefs`, `--keywords` (comma-separated), `--target`, `--country` (two letters, default `us`).
- Common: `--account`, `--json`, `--refresh` (bypasses the local cache).
- **Progressive disclosure:** start with the summary (`--detail summary`, the default), then `--detail rows --offset N` for the next page, or `--detail full` for every field. "Each result ends with the command to run next."

## Research keys

[iannuttall/seo, SKILL.md; README.md] "Research costs the person's own provider credits." Keys go in at `https://seoskill.dev/account` (used by the hosted server and a CLI linked with `seo login`), or with `seo providers dataforseo connect` / `seo providers ahrefs connect` to keep a key on one machine. Spend limits are set in the provider account. "Domain Rating appears as a free column next to domains; credit it as "Domain Rating by Ahrefs"." Provider numbers are estimates, and "Search Console stays the record of what your own site actually got."

## Analytics and Clicky

[iannuttall/seo, README.md] `seo analytics google properties`, then `seo ai-referrals --property 123456789`; the property must be the numeric id (`api.ts` rejects anything else with "The Google Analytics property must be its numeric id."). Clicky: `seo data --source clicky --site example.com`. The installed skill lists neither `ai-referrals` nor `analytics google properties`. "A Clicky visit is not a Google Analytics session or user" [AGENTS.md]. Google Analytics itself is [google-analytics SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/google-analytics/SKILL.md).

## In CI with a service account

[iannuttall/seo, README.md]

```yaml
- name: Run the SEO report
  run: |
    npm i -g seo
    seo report --site sc-domain:example.com --json > seo-report.json
  env:
    SEO_GOOGLE_SERVICE_ACCOUNT_JSON: ${{ secrets.SEO_GOOGLE_SERVICE_ACCOUNT_JSON }}
```

"Give it the JSON key through your secret store and grant it access to the exact properties."

## Version notes

[iannuttall/seo] The README's "Upgrading from 0.2" says old names "stop working in 0.4.0"; the package is v0.7.1 and `renames.ts` prints "The old name stops working in 1.0.0." (AGENTS.md agrees), so the README line is stale. Old 0.2 report names such as `seo quick-wins` still print their new command.

## Prove it

`seo sites` lists the property before any other call; a `--json` run in CI finishes without a prompt and writes valid JSON; the report run starts at `--detail summary`; Bing is read only from the CLI or the local server and never summed with Google; research runs name their provider and are credited as estimates; and the service account sees only the properties it was granted.
