---
name: site-architecture
description: "Plans or restructures a website's information architecture: the intake questions, page hierarchy and depth, the page tree, URL map and Mermaid sitemap deliverables, URL patterns, breadcrumbs, header, footer, sidebar and mobile navigation, hub-and-spoke internal linking and the link audit, choosing a platform, adding a section by subpath, subdomain or reverse proxy, and migrating without losing search traffic, with each source rule checked against Google Search Central. Use when planning what pages a site needs, organizing navigation or URLs, drawing a visual sitemap, adding a blog or landing pages to an existing site, picking a website builder, or planning a site migration."
---

# Site architecture

Architecture is what pages exist, how they nest, what their URLs are, and how they link: settle it before the platform, because the platform has to carry the plan, not the other way round [coreyhaines31/marketingskills, site-architecture]. This skill is coreyhaines31/marketingskills' `site-architecture` v2.1.0 (MIT, "Copyright (c) 2025 Corey Haines"), copied where quoted, with each rule checked against Google Search Central and the WAI-ARIA Authoring Practices; where they differ, the official form is written and the source's line is named.

XML sitemaps, crawl errors and technical SEO are in [seo SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/SKILL.md) (the source routes them out the same way); pages built at scale from data are in [seo PAGES-AT-SCALE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/PAGES-AT-SCALE.md); breadcrumb and other structured data in [seo STRUCTURED-DATA.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/STRUCTURED-DATA.md); comparison pages in [comparison-pages SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/comparison-pages/SKILL.md); what content to plan in [content-strategy SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/content-strategy/SKILL.md); auditing a live site in [site-audit SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/site-audit/SKILL.md). The house pattern for the owner's own marketing sites (header, footer, language prefixes, routes) is [landing-page-ui SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SKILL.md); where this generic skill disagrees, both are stated and the house pattern wins on those sites.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| URL principles (case, hyphens, slashes), patterns by page type, common URL mistakes, breadcrumbs and what Google says about them, internal link types, hub and spoke, the link audit checklist | [URLS-AND-LINKS.md](URLS-AND-LINKS.md) |
| Header, mega menu and split navigation, footers, docs and blog sidebars, breadcrumb markup, mobile menus and bottom tabs, navigation anti-patterns, crawlable links | [NAVIGATION.md](NAVIGATION.md) |
| Choosing a platform (six questions, the options), adding a section (same platform, reverse-proxied subpath, subdomain, separate domain), the reverse-proxy checklist, migrating without losing traffic | [PLATFORMS-AND-MIGRATION.md](PLATFORMS-AND-MIGRATION.md) |
| The ASCII page tree, Mermaid sitemaps (basic, nav zones, URL labels, hub and spoke, linking flow, before and after) and the colour key | [SITEMAP-DIAGRAMS.md](SITEMAP-DIAGRAMS.md) |
| Starting page trees, URL maps and navigation for SaaS, content, e-commerce, docs, hybrid and small-business sites | [SITE-TYPES.md](SITE-TYPES.md) |

## Before planning

Read the project's product context first: `.agents/product-context.md` ([anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md); the source names this file `.agents/product-marketing.md`). Ask only for what it does not cover. Gather [coreyhaines31/marketingskills, site-architecture]:

1. **Business context:** what the company does, the primary audiences, the top 3 goals for the site (conversions, SEO traffic, education, support).
2. **Current state:** new site or restructure; if restructuring, what's broken (high bounce, poor SEO, users can't find things); existing URLs that must be preserved; the platform, and whether a change is on the table ([PLATFORMS-AND-MIGRATION.md](PLATFORMS-AND-MIGRATION.md)).
3. **Site type:** SaaS marketing, content or blog, e-commerce, documentation, hybrid (SaaS plus content), small business or local ([SITE-TYPES.md](SITE-TYPES.md)).
4. **Content inventory:** how many pages exist or are planned, the most important ones (by traffic, conversions or business value), planned sections.

The task questions, verbatim:

1. Is this a new site or are you restructuring an existing one?
2. What type of site is it? (SaaS, content, e-commerce, docs, hybrid, small business)
3. How many pages exist or are planned?
4. What are the 5 most important pages on the site?
5. Are there existing URLs that need to be preserved or redirected?
6. Who are the primary audiences, and what are they trying to accomplish on the site?

## Hierarchy

| Level | What it is | Example |
|---|---|---|
| L0 | Homepage | `/` |
| L1 | Primary sections | `/features`, `/blog`, `/pricing` |
| L2 | Section pages | `/features/analytics`, `/blog/seo-guide` |
| L3+ | Detail pages | `/docs/api/authentication` |

| Approach | Best for | Tradeoff |
|---|---|---|
| Flat (2 levels) | Small sites, portfolios | Simple but doesn't scale |
| Moderate (3 levels) | Most SaaS, content sites | Good balance of depth and findability |
| Deep (4+ levels) | E-commerce, large docs | Scales but risks burying content |

"Go as flat as possible while keeping navigation clean. If a nav dropdown has 20+ items, add a level of hierarchy." The source's 3-click rule ("Users should reach any important page within 3 clicks from the homepage. This isn't absolute") and its depth table are its own opinion, not a search requirement. Google's version: "Every page you care about should have a link from at least one other page" ([links-crawlable](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)).

## The deliverables

[coreyhaines31/marketingskills, site-architecture] A plan ships five things:

1. **Page hierarchy** as an ASCII tree with the URL at every node ([SITEMAP-DIAGRAMS.md](SITEMAP-DIAGRAMS.md#ascii-tree)).
2. **Visual sitemap** in Mermaid `graph TD`, with subgraphs for navigation zones where they help ([SITEMAP-DIAGRAMS.md](SITEMAP-DIAGRAMS.md)).
3. **URL map table:**

| Page | URL | Parent | Nav Location | Priority |
|---|---|---|---|---|
| Homepage | `/` | (none) | Header | High |
| Features | `/features` | Homepage | Header | High |
| Analytics | `/features/analytics` | Features | Header dropdown | Medium |
| Pricing | `/pricing` | Homepage | Header | High |
| Blog | `/blog` | Homepage | Header | Medium |

4. **Navigation spec:** header items in order with the CTA, footer sections and links, sidebar navigation if any, breadcrumb notes ([NAVIGATION.md](NAVIGATION.md)).
5. **Internal linking plan:** hub pages and their spokes, cross-section links, an orphan page audit when restructuring, recommended links per key page ([URLS-AND-LINKS.md](URLS-AND-LINKS.md#internal-linking)).

## The rules

1. **Architecture before platform.** Plan the pages, hierarchy, URLs and links first, then pick the platform that carries them; keep the current platform in the running, because "If the existing site works and the problem is content or structure, moving platforms usually costs more than it fixes" [coreyhaines31/marketingskills, site-architecture].
2. **Every page you care about has at least one internal link from a crawlable page,** and links are real `<a href>` elements ([links-crawlable](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)).
3. **Readable, hyphenated URLs, one case, one trailing-slash policy, one parent per page type** ([URLS-AND-LINKS.md](URLS-AND-LINKS.md#url-principles)). Google: "Google Search's URL handling is case sensitive" ([url-structure](https://developers.google.com/search/docs/crawling-indexing/url-structure)).
4. **Breadcrumbs follow a typical user path, not the URL.** Google: "We recommend providing breadcrumbs that represent a typical user path to a page, instead of mirroring the URL structure" ([breadcrumb](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb)). The source said "Breadcrumbs should mirror the URL hierarchy."
5. **No fixed link count.** Google: "There's no magical ideal number of links a given page should contain. However, if you think it's too much, then it probably is" ([links-crawlable](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)). The source said "5-10 internal links per 1000 words".
6. **Anchor text makes sense out of context:** "Try reading only the anchor text (out of context) and check if it's specific enough to make sense by itself" ([links-crawlable](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)); never "click here" ([anti-slop-copy MICROCOPY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/MICROCOPY.md)).
7. **Every changed URL gets a permanent redirect** (301 or 308) straight to its final destination, kept generally at least a year, never many URLs to the home page ([site move](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes); [PLATFORMS-AND-MIGRATION.md](PLATFORMS-AND-MIGRATION.md#migrating-without-losing-traffic)).
8. **Subdomain or subfolder is an operational choice.** Google: "From a business point of view, do whatever makes sense for your business" ([SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)); that Google prefers neither for ranking is the source's statement [coreyhaines31/marketingskills, site-architecture].
9. **Scaled pages hang off hubs, not the main nav.** Integration, comparison and location pages get a hub page each with hub-and-spoke links ([URLS-AND-LINKS.md](URLS-AND-LINKS.md#hub-and-spoke)) [coreyhaines31/marketingskills, site-architecture evals].

## Prove it

From the source's evals, as checks on a plan [coreyhaines31/marketingskills, site-architecture evals.json]: the plan read the product context file before asking questions; it gives the page tree, the URL map and the navigation spec, and a Mermaid sitemap when one is asked for (a design team can read it without the author); a restructure starts with a content inventory and a redirect for every page that moves; scaled pages (say 200 integrations and 50 comparisons) sit under hub pages, stay out of the header, and link hub to spoke and back, with crawl budget addressed (Google's crawl budget guide is for "Large sites (1 million+ unique pages) with content that changes moderately often (once a week)", "Medium or larger sites (10,000+ unique pages) with very rapidly changing content (daily)" and sites with a large share of URLs in "Discovered - currently not indexed", numbers it calls "a rough estimate", [crawl budget](https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget)); a request about XML sitemaps or crawl errors is routed to [seo SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/SKILL.md); a platform question gets the six questions and a shortlist of two or three including the current platform; a migration plan crawls and saves every URL and its metadata first, warns that imports may not carry routes, metadata or redirects, and ends with Search Console monitoring. Beyond the evals: no breadcrumb is justified by "mirroring the URL", no link count is presented as a rule, and every redirect in the map points at a final URL that returns 200.
