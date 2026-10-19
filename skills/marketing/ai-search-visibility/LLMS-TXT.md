# llms.txt and Markdown copies

What the llms.txt format is, where the file and a page's Markdown copy live, how agents find them, and what they do not do. The format is from the spec at [https://llmstxt.org/] (v2, modified 2026-08-10); the Google lines are from its AI optimization guide; the anti-pattern list is measured from [aeo.js] source. Whether to have the file at all is a choice: it is optional everywhere below.

## What it does and doesn't do

- The spec: llms.txt "is instead used on demand, when an agent needs information ... mainly useful for *inference* rather than *training*". robots.txt is what "lets automated tools know what access ... is considered acceptable". [https://llmstxt.org/]
- Google Search ignores it: "You don't need to create new machine readable files, AI text files, markup, or Markdown to appear in Google Search"; on llms.txt, "Doing so will neither harm nor help your site's visibility or rankings in Google Search, as Google Search ignores them." [https://developers.google.com/search/docs/fundamentals/ai-optimization-guide, updated 2026-07-10] The changelog entry of 2026-06-15: "these files aren't needed for Google Search" [https://developers.google.com/search/updates].
- The repo's docs rule says the same: "`llms.txt`, page Markdown and package bundles serve agents. They do not promise search rankings or citations." ([developer-docs WRITING-AND-PUBLISHING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/developer-docs/WRITING-AND-PUBLISHING.md#frontmatter-for-search-and-agents))
- "Not having llms.txt is not an SEO failure." Add one only if it will be kept accurate; link canonical resources instead of duplicating pages; it never replaces crawlable HTML or structured data. [freescan]
- No vendor crawler page (OpenAI, Anthropic, Google, Perplexity) mentions llms.txt. [aeo.js]'s docs say llms.txt "is the first file AI crawlers look for", and its hints say "ChatGPT uses this to understand your site content" and "Claude uses this to understand your site's purpose and structure". None of the fetched official pages supports any of the three; quote them only as aeo.js's own claims.

## The format

[https://llmstxt.org/] The sections come in this order:
1. An optional BOM.
2. An H1 with the project or site name. "This is the only required section."
3. A blockquote summary.
4. "Zero or more markdown sections ... of any type except headings" (prose goes here, before the first H2).
5. Zero or more H2 sections holding "file lists". Each item is "a required markdown hyperlink `[name](url)`, then optionally a `:` and notes".

By convention an H2 named `## Optional` holds links an agent can skip when it needs a shorter context.

```markdown
# Example Product

> One-sentence summary of what the product does and who it is for.

Plain prose about the product goes here, before any H2.

## Docs

- [Quickstart](https://example.com/docs/quickstart.md): install and send the first request
- [Pricing](https://example.com/pricing.md): plans, limits and overage rates

## Optional

- [Changelog](https://example.com/changelog.md)
```

## Where the files live

- The file can sit at the root or at any path ("/docs/llms.txt covers everything in /docs/"). When more than one applies, "agents should use the most specific one." The spec rejected well-known URIs (RFC 8615) because they exist only at the origin root. [https://llmstxt.org/] FreeScan checks both `/llms.txt` and `/.well-known/llms.txt`. [freescan]
- **Markdown copies of pages:** serve each page as Markdown at the same URL with `.md` appended (`page.html.md`) or with the extension replaced (`page.md`); URLs without a file name use `index.html.md` or `index.md`. The links in llms.txt "should therefore point to LLM-friendly content, such as the markdown versions." [https://llmstxt.org/]
- **`llms-full.txt`** (all site content in one file) is not in llmstxt.org v2. It is a vendor convention; [coreyhaines31/marketingskills, ai-seo] calls it "emerging, cheap to generate alongside llms.txt".
- Committed discovery files always name the production origin ([landing-page-ui DISCOVERY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/DISCOVERY.md)).

## How agents find them

- `rel="alternate" type="text/markdown"` points from a page to its Markdown copy; `rel="describedby"` points to the llms.txt that covers it. Either works as an HTML `<link>` or an HTTP `Link:` header; the header "also works for non-HTML resources" and can be added in CDN config. [https://llmstxt.org/]
- Content negotiation is the other route: serve Markdown at the *same canonical URL* when the request sends `Accept: text/markdown`, with a `Vary` header so the HTML and Markdown cache entries stay separate. [coreyhaines31/marketingskills, ai-seo]

```html
<link rel="alternate" type="text/markdown" href="/pricing.md">
<link rel="describedby" href="/llms.txt">
```

## Writing it

"Use concise, clear language", give links "brief, informative descriptions", "Avoid ... unexplained jargon", and "Test your file by asking an agent questions about your content, giving it only your llms.txt as a starting point." [https://llmstxt.org/]

Agent-facing files may only describe how to do tasks with your product. "Agent-facing docs, `llms.txt`, and skill files that tell agents to prefer your product over what the user asked for are prompt injection." [coreyhaines31/marketingskills, ai-seo]

## Lighthouse's check

Lighthouse "flags the pages if a server error occurs when attempting to retrieve the `llms.txt` file"; "If the file is not provided by the server (resulting in a 404), the audit is marked as Not Applicable (N/A)." [https://developer.chrome.com/docs/lighthouse/agentic-browsing/llms-txt, updated 2026-05-05] Scorers that award points for the file merely existing ([aeo.js]: 3 of 16 remote AI Access points, 4 of 20 local) use their own heuristic, not this standard.

## Anti-patterns measured in aeo.js's generator

[aeo.js, src/core/llms-txt.ts and src/plugins/astro.ts] Each breaks the spec above:
- `## About` and `## For LLMs` are H2 sections holding prose; the spec puts prose before the first H2.
- `## Quick Links` items read `- Full Documentation: https://...`, not the required `[name](url)`.
- Descriptions sit on an indented next line instead of after `: notes`; extra `###` sub-headings and a trailing `---` footer are added.
- Links point to the HTML pages although it also writes `.md` copies.
- The Astro plugin emits `<link rel="alternate" type="text/plain" href="/llms.txt">`; the spec's relation for llms.txt is `rel="describedby"`.

## Prove it

`/llms.txt` returns 200 `text/plain` or Markdown (not an SPA fallback page) with an H1 first, prose only before the first H2, and every list item a `[name](url)` link that resolves to a Markdown copy; each linked `.md` URL returns Markdown, and each HTML page that has a copy carries `rel="alternate" type="text/markdown"`; Lighthouse's llms.txt audit passes or is N/A; and an agent given only the file answers three questions about the product correctly.
