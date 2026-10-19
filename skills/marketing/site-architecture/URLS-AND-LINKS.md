# URLs, breadcrumbs and internal links

URLs and links are the structure search engines and people actually walk. This file is coreyhaines31/marketingskills' `site-architecture` (MIT) copied where quoted, with Google's URL structure, crawlable links and breadcrumb docs next to every rule they cover. Where the source and Google differ, the official form is written and the source's line is named. Moving URLs is in [PLATFORMS-AND-MIGRATION.md](PLATFORMS-AND-MIGRATION.md#migrating-without-losing-traffic).

## URL principles

[coreyhaines31/marketingskills, site-architecture]

1. **Readable by humans:** `/features/analytics`, not `/f/a123`. Google agrees: readable words over long IDs ([url-structure](https://developers.google.com/search/docs/crawling-indexing/url-structure)).
2. **Hyphens, not underscores:** `/blog/seo-guide`, not `/blog/seo_guide` (Google recommends hyphens too, same page).
3. **Reflect the hierarchy:** the path matches the site structure.
4. **One trailing-slash policy:** pick with or without and enforce it. No Google doc covers this; it is the source's view.
5. **One case.** "Google Search's URL handling is case sensitive"; if the server treats upper and lower case the same, "convert all text to the same case" ([url-structure](https://developers.google.com/search/docs/crawling-indexing/url-structure)). The source said "Lowercase always: `/About` should redirect to `/about`"; lowercase is a house convention, not a Google preference.
6. **Short but descriptive:** `/blog/landing-page-conversions` over `/blog/how-to-improve-landing-page-conversion-rates` (the source's opinion).
7. **Trim parameters that don't change the content** ([url-structure](https://developers.google.com/search/docs/crawling-indexing/url-structure)).

On the owner's sites, "The default language has no path prefix, the second lives under its code (`/en`)" ([landing-page-ui DISCOVERY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/DISCOVERY.md)); the patterns below say nothing about locale and must not override it. The canonical host (apex or `www`) is decided in [deployment SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/deployment/SKILL.md#moving-to-a-new-host-without-downtime).

## Patterns by page type

[coreyhaines31/marketingskills, site-architecture]

| Page type | Pattern | Example |
|---|---|---|
| Homepage | `/` | `example.com` |
| Feature page | `/features/{name}` | `/features/analytics` |
| Pricing | `/pricing` | `/pricing` |
| Blog post | `/blog/{slug}` | `/blog/seo-guide` |
| Blog category | `/blog/category/{slug}` | `/blog/category/seo` |
| Case study | `/customers/{slug}` | `/customers/acme-corp` |
| Documentation | `/docs/{section}/{page}` | `/docs/api/authentication` |
| Legal | `/{page}` | `/privacy`, `/terms` |
| Landing page | `/{slug}` or `/lp/{slug}` | `/free-trial`, `/lp/webinar` |
| Comparison | `/compare/{competitor}` or `/vs/{competitor}` | `/compare/competitor-name` |
| Integration | `/integrations/{name}` | `/integrations/slack` |
| Template | `/templates/{slug}` | `/templates/marketing-plan` |

The owner's reference site differs on purpose: features at the top level (`/ai-agent`, `/monitoring`), legal pages with full names (`/privacy-policy`, `/terms-of-service`), one `/competitors` page and `/help/{topic}` ([site-navigation-items.ts](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/reference/website/shared/navigation/site-navigation-items.ts), [site-footer-links.ts](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/reference/website/widgets/footer/site-footer-links.ts), [routes](https://github.com/Quegenx/agent-skills/tree/main/skills/web-ui/landing-page-ui/reference/routes)). On those sites the house routes win; on a new site, pick one pattern per page type and keep it.

## Common URL mistakes

[coreyhaines31/marketingskills, site-architecture]

- **Dates in blog URLs:** `/blog/2024/01/15/post-title` adds length and no value; use `/blog/post-title` (the source's opinion).
- **Over-nesting:** `/products/category/subcategory/item/detail` is too deep.
- **Changing URLs without redirects:** every old URL needs a permanent redirect to its new URL. The source said "Every old URL needs a 301" and gave no duration; Google's form (301 or 308, no chains, kept generally at least a year) is in [PLATFORMS-AND-MIGRATION.md](PLATFORMS-AND-MIGRATION.md#migrating-without-losing-traffic).
- **IDs in URLs:** `/product/12345` is not readable; use slugs.
- **Query parameters for content:** `/blog?id=123` should be `/blog/post-title`.
- **Inconsistent patterns:** don't mix `/features/analytics` and `/product/automation`; pick one parent.

## Breadcrumbs

Google: "We recommend providing breadcrumbs that represent a typical user path to a page, instead of mirroring the URL structure" ([breadcrumb](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb)). The source said "Breadcrumbs should mirror the URL hierarchy" and listed "Breadcrumbs that don't match URLs" as an anti-pattern; when the URL and the user's path agree, the trail looks the same either way:

| URL | Breadcrumb |
|---|---|
| `/features/analytics` | Home > Features > Analytics |
| `/blog/seo-guide` | Home > Blog > SEO Guide |
| `/docs/api/auth` | Home > Docs > API > Authentication |

- Every segment is a link except the current page; be consistent with the separator (`>` or `/`) [coreyhaines31/marketingskills, site-architecture].
- In structured data, a `BreadcrumbList` needs at least two `ListItem`s, and a `ListItem` for the top-level path or for the page itself is not required; "If `item` isn't included for the last item, Google uses the URL of the containing page" ([breadcrumb](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb)). The markup is in [NAVIGATION.md](NAVIGATION.md#breadcrumbs) and [seo STRUCTURED-DATA.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/STRUCTURED-DATA.md).

## Internal linking

[coreyhaines31/marketingskills, site-architecture]

| Type | Purpose | Example |
|---|---|---|
| Navigational | Move between sections | Header, footer, sidebar links |
| Contextual | Related content within text | "Learn more about analytics" linking `/features/analytics` |
| Hub-and-spoke | Connect cluster content to hub | Blog posts linking to pillar page |
| Cross-section | Connect related pages across sections | Feature page linking to related case study |

Rules:

1. **No orphan pages:** every page has at least one internal link pointing to it. Google: "Every page you care about should have a link from at least one other page" ([links-crawlable](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)).
2. **Descriptive anchor text:** "our analytics features", not "click here". Google asks for anchor text that is "descriptive, reasonably concise, and relevant", and offers a test: "Try reading only the anchor text (out of context) and check if it's specific enough to make sense by itself" ([links-crawlable](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)).
3. **No link quota.** "There's no magical ideal number of links a given page should contain. However, if you think it's too much, then it probably is" ([links-crawlable](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)). The source said "5-10 internal links per 1000 words of content (approximate guideline)".
4. **Link to important pages more often:** the homepage, key feature pages, pricing.
5. **Use breadcrumbs:** a link trail on every page.
6. **Related content sections:** "Related Posts" or "You might also like" at the bottom of a page.

### Hub and spoke

For content-heavy sites, organize around hub pages [coreyhaines31/marketingskills, site-architecture]:

```
Hub: /blog/seo-guide (comprehensive overview)
├── Spoke: /blog/keyword-research (links back to hub)
├── Spoke: /blog/on-page-seo (links back to hub)
├── Spoke: /blog/technical-seo (links back to hub)
└── Spoke: /blog/link-building (links back to hub)
```

Each spoke links back to the hub. The hub links to all spokes. Spokes link to each other where relevant. Scaled pages (integrations, comparisons) get a hub each (`/integrations`, `/compare`) and stay out of the main nav [coreyhaines31/marketingskills, site-architecture evals]. Topic clusters as a content plan: [content-strategy SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/content-strategy/SKILL.md).

### Link audit checklist

[coreyhaines31/marketingskills, site-architecture]

- [ ] Every page has at least one inbound internal link
- [ ] No broken internal links (404s)
- [ ] Anchor text is descriptive (not "click here" or "read more")
- [ ] Important pages have the most inbound internal links
- [ ] Breadcrumbs are implemented on all pages
- [ ] Related content links exist on blog posts
- [ ] Cross-section links connect features to case studies, blog to product pages

Running it across a whole site with a crawler: [site-audit SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/site-audit/SKILL.md) and [seo TECHNICAL-AUDIT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/TECHNICAL-AUDIT.md).

## Prove it

Every URL in the map uses hyphens, one case and the chosen trailing-slash policy, and each page type has one parent pattern; no plan cites lowercase or a link count as a Google rule; every moved URL has a 301 or 308 straight to its final URL with a keep-until date at least a year out; breadcrumb trails follow the path a user takes and the JSON-LD has at least two items; a crawl of the planned site finds no orphan and no 404 internal link; and every anchor text read alone says where it goes.
