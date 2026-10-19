# Agent readiness

Whether an agent can reach a page, find what is on the site and parse it, before any question of what the content says. Sources: [coreyhaines31/marketingskills, ai-seo] (MIT, its agent-readiness and okf references), Google's AI optimization guide, Lighthouse's agentic-browsing audits, Google's sitemap docs, and [aeo.js]'s server-rendered check. Crawler rules are in [AI-CRAWLERS.md](AI-CRAWLERS.md); llms.txt and Markdown copies in [LLMS-TXT.md](LLMS-TXT.md); letting agents act on the page is [webmcp SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-automation/webmcp/SKILL.md).

## How agents read a page

Google: browser agents may analyze "visual renderings (like screenshots), inspecting the DOM structure, and interpreting the accessibility tree." [https://developers.google.com/search/docs/fundamentals/ai-optimization-guide] So the same semantic HTML that serves assistive tech serves agents: `<main>`, `<nav>`, `<article>`, `<button>`, a real heading hierarchy, `alt` text, every interactive element labelled, ARIA only where native HTML falls short, and pricing, specs and contact on a public page. [coreyhaines31/marketingskills, ai-seo] The accessibility rules themselves are in [web-accessibility SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/SKILL.md).

## The three questions

[coreyhaines31/marketingskills, ai-seo]

**1. Access: can an agent get to the page and see real content?**
- Core content in the initial HTML response. "Most agents never execute JavaScript. If the content only exists after client-side rendering, it doesn't exist." The repo's analytics notes say the same: "Most crawlers and AI agents never run JS" ([posthog WEB-ANALYTICS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/WEB-ANALYTICS.md)).
- No bot challenge or firewall block on the intended discovery path (see [AI-CRAWLERS.md](AI-CRAWLERS.md#check-the-firewall-not-only-the-file)).
- Correct HTTP behavior: real status codes (no soft-404s), stable canonical URLs, recoverable errors. Soft 404s and SPA fallbacks return 200 with unrelated HTML; before crediting robots.txt, a sitemap or llms.txt, check the final URL, content type, title and body. [freescan]

**2. Discovery: do your files tell agents what is here?**
- robots.txt with an explicit, purpose-specific AI-crawler stance.
- A sitemap that loads and parses cleanly.
- llms.txt, optionally (see [LLMS-TXT.md](LLMS-TXT.md)).

**3. Parseability: once there, can the agent tell what the page is?**
- Valid, substantive JSON-LD that matches the visible text (the markup rules are in [seo STRUCTURED-DATA.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/STRUCTURED-DATA.md)). Google: "Structured data isn't required for generative AI search, and there's no special schema.org markup you need to add." [https://developers.google.com/search/docs/fundamentals/ai-optimization-guide]
- A Markdown representation of the page, by content negotiation or a `Link` header ([LLMS-TXT.md](LLMS-TXT.md#how-agents-find-them)).
- One H1, headings that answer sub-questions, extractable answer blocks ([CONTENT-BLOCKS.md](CONTENT-BLOCKS.md)).

## The server-rendered check

[aeo.js, remote-audit.ts] Fetch the raw HTML without running JavaScript and pass only when the homepage's extracted text has at least 60 words: "AI crawlers fetch raw HTML without executing JavaScript, so client-only content is invisible to them." The 60-word threshold is aeo.js's own.

## Sitemap dates

Google "ignores `<priority>` and `<changefreq>` values" and uses `<lastmod>` only "if it's consistently and verifiably" accurate; the value "should reflect ... the last significant update". The limits are 50 MB uncompressed or 50,000 URLs per sitemap. [https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap] So never stamp `lastmod` with the build date: [aeo.js]'s generator writes today's date for every URL on every build, plus `changefreq weekly` and `priority 0.8`, which Google ignores or distrusts. The sitemap rules as a whole are in [seo TECHNICAL-AUDIT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/TECHNICAL-AUDIT.md).

## Lighthouse's agentic-browsing audits

Lighthouse lists these audits under agentic browsing [https://developer.chrome.com/docs/lighthouse/agentic-browsing/llms-txt, updated 2026-05-05]:
- Scoring
- WebMCP integration: Registered WebMCP tools, Forms missing declarative WebMCP, WebMCP schema validity
- Discoverability: llms.txt
- Accessibility: Accessibility for agents
- Layout stability

The audit ids, and the caveat that the released Lighthouse shipping the category was not verified, are in [web-performance LIGHTHOUSE-CI.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/LIGHTHOUSE-CI.md#the-agentic-browsing-category). The page names the WebMCP audits without describing them; their use is in [webmcp VALIDATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-automation/webmcp/VALIDATION.md#lighthouses-webmcp-audits).

## Scoring tools (vendor)

[coreyhaines31/marketingskills, ai-seo] Both are vendor tools; "the *checks* are the value, not the pitch." "Run one before and after any agent-readiness work."
- **Is Agentic** (Vercel and Ora): `npx is-agentic yourdomain.com`. 100+ checks; Essential checks carry most of the score; Recommended checks activate only when you have that surface (API, MCP server, commerce); not-applicable checks are excluded, not failed.
- **Frase Agent Readiness Checker**: Access, Discovery, Parseability; its bands are "80+ = agents can reliably use the site, 60-79 = solid with gaps, <60 = real access problems".
- aeo.js's own rubric and CLI are in [CITABILITY.md](CITABILITY.md#aeojs-scoring-rubric).

## Acting, not only reading

[coreyhaines31/marketingskills, ai-seo] Make the highest-intent actions (signup, pricing, demo booking, contact) work without JavaScript-only flows, with labelled semantic form fields and a machine-readable confirmation. If you add WebMCP, keep it to the 2 to 4 highest-intent actions, reuse existing validation, spam protection and permissions, and "test that each tool rejects bad input, that submissions land where the normal form's do (CRM, inbox, conversion tracking), and that nothing bypasses consent or rate limits." The source labels WebMCP "emerging, not yet a ranking/citation signal". How to build and validate the tools is the [webmcp](https://github.com/Quegenx/agent-skills/blob/main/skills/web-automation/webmcp/SKILL.md) skill.

Google's guide on commerce agents: "Protocols like Universal Commerce Protocol (UCP) are emerging that will allow Search agents to do more"; Merchant Center feeds and Google Business Profiles "can help your products and services to be visible in both AI responses"; Business Agent is "a conversational experience on Google Search that helps customers chat with your brand." [https://developers.google.com/search/docs/fundamentals/ai-optimization-guide]

## A pricing file for agents

[coreyhaines31/marketingskills, ai-seo] A `/pricing.md` (or `/pricing.txt`) gives agents plans without rendering the page. It is not a standard, and Google says no such files are needed for Search. The template (placeholder figures):

```markdown
# Pricing - [Your Product Name]

## Free
- Price: $0/month
- Limits: [usage limit]/month, 1 user
- Features: [feature], [feature]

## Pro
- Price: $[annual price]/month (billed annually) | $[monthly price]/month (billed monthly)
- Limits: [usage limit]/month, [n] users
- Features: [feature], [feature], [feature]

## Enterprise
- Price: Custom - contact [sales email]
- Limits: [limits]
- Features: SSO, SLA, [feature]
```

Rules: consistent units (monthly vs annual, per-seat vs flat); specific limits, not only feature names; everything included per tier, not only the differences; "Keep it updated: stale pricing is worse than no file"; link it from the sitemap and the pricing page. The pricing page itself follows [developer-docs WRITING-AND-PUBLISHING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/developer-docs/WRITING-AND-PUBLISHING.md#headings-and-structure) ("Use tables for pricing").

## OKF bundles (emerging)

[coreyhaines31/marketingskills, ai-seo, okf] introduces Open Knowledge Format for data/catalog metadata; a marketing-site bundle is a repurposing. Current [official SPEC v0.2](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md), last modified 2026-08-21, supersedes v0.1. The source and this file formerly named v0.1 and recommended timestamp; v0.2 supersedes timestamp with generated.at, allowing legacy fallback when generated is absent. No search-discovery or SEO benefit is implied by conformance.
- Cross-linked Markdown files use YAML frontmatter: type is required, while title, description, resource and tags are optional; an index.md is optional. The source distributes a bundle as a repository, tarball or subdirectory. [official SPEC v0.2](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md); [coreyhaines31/marketingskills, ai-seo/references/okf.md]
- Serve it at `/okf/`, starting with `/okf/index.md`, and add a line to llms.txt pointing to it.
- "Nothing crawls the web for OKF bundles yet." Skip it for a site under 10 pages, a closed platform without custom paths, or when nobody maintains the other machine-readable files.

```markdown
---
type: Article
title: [Page title]
description: [One-sentence summary]
resource: https://example.com/[page]/
tags: [tag, tag]
---

# [Page title]

The body of the page, as clean markdown.
```

The stack, in the source's words: sitemap tells a crawler which URLs exist, robots.txt permits or blocks crawlers, llms.txt points at the pages you most want read, `/pricing.md` holds pricing, an OKF bundle hands over the content, schema markup is per page. "`llms.txt` is a signpost, OKF is the library."

## Prove it

`curl` of each key page (home, pricing, docs entry, signup) without JavaScript shows its main text, prices and calls to action; each returns its real status (a made-up URL returns 404, not 200); the sitemap parses, lists only canonical 200 URLs and carries `lastmod` dates that change only when the page did; JSON-LD validates and matches visible text; Lighthouse's agentic-browsing audits run without a server error; and a vendor readiness score, if used, is recorded before and after with the failed checks as the worklist.
