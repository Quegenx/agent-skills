# International SEO

Audit localized pages against their intended language and regional coverage. Source: [coreyhaines31/marketingskills, seo-audit/references/international-seo.md], corrected against Google Search Central below. This is a generic audit; preserve the owner's chosen routes, locale prefixes and head design in [landing-page-ui DISCOVERY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/DISCOVERY.md).

## Establish the variants

[Google multilingual and multiregional sites](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites)

- Inventory the actual equivalent pages, intended languages and regions, status, indexability and canonical targets. Compare equivalent content rather than connecting every locale homepage to every translated detail page.
- Prefer distinct URLs for language versions and provide a user-controlled language switch. Do not force visitors to another version solely from inferred language or IP. Subdirectories, subdomains and country-code domains have operational tradeoffs; an audit does not authorize a universal locale-prefix migration.
- Google determines language from visible content. Translate the main content, not only navigation and boilerplate; `lang` and `hreflang` do not replace a translated page.
- A locale-adaptive response can hide variants from crawling. Googlebot does not send `Accept-Language`; crawling is not exclusively from US IP addresses. The source's US-only statement was too broad. [Google locale-adaptive pages](https://developers.google.com/search/docs/specialty/international/locale-adaptive-pages)

## Check alternate relationships

[Google localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions)

- HTML head links, HTTP `Link` headers and XML sitemaps are equivalent supported methods. Choose the method easiest to maintain; implementing all three gives no Search benefit by itself. HTTP headers also support non-HTML documents.
- Each intended variant lists itself and its alternates with fully qualified URLs. Alternate domains are allowed. Check that each relationship has a return annotation; Google can ignore a pair without a return link while processing other valid bidirectional pairs. The source's whole-cluster failure language was too broad.
- Use an ISO 639-1 language, optionally followed by a supported ISO 15924 script or ISO 3166-1 Alpha-2 region as appropriate. A region alone is invalid; use `GB`, not `UK`, and do not use numeric regional codes such as `es-419` for Google's annotations.
- `x-default` is a recommended optional fallback for unmatched users, including a language selector. Absence alone does not make an otherwise valid set invalid. Preserve the owner's explicitly chosen fallback.

## Keep canonical intent consistent

[Google multilingual and multiregional sites](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites)

- Keep genuinely translated pages available as language variants. For similar or duplicate pages in the same language targeting different regions, choose a preferred canonical and use consistent `hreflang` annotations. A canonical remains a hint, not an independent-indexing guarantee.
- The source SKILL.md required every locale to self-canonicalize and prohibited cross-locale canonicalization categorically. Its international reference and Google's guidance allow a preferred canonical for same-language regional duplicates; apply the official distinction rather than that blanket rule. [coreyhaines31/marketingskills, seo-audit/SKILL.md and references/international-seo.md]
- Evaluate translated content for accuracy and usefulness. AI translation is not automatically spam; generating many pages without adding value may violate scaled-content rules. [Google AI-generated content guidance](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content)

## Inspect generated output

[Google localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions); [Next.js sitemap reference](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)

- In a sitemap, use the `xhtml` namespace and include the current URL and its alternates for each entry. Alternate child elements do not count toward the sitemap URL limit; general limits and splitting stay in [PAGES-AT-SCALE.md](PAGES-AT-SCALE.md#sitemaps).
- Next.js documentation supplies an explicit `alternates.languages` map. Include the current locale deliberately and inspect the actual generated XML; do not infer complete reciprocal annotations from configuration intent or framework choice.
- Report the checked URLs, annotation method, missing relationship, canonical decision, evidence date and exact proposed correction. Mark blocked, unavailable and unrendered variants as coverage gaps rather than inventing a complete locale count. [coreyhaines31/marketingskills, seo-audit/references/international-seo.md; existing technical audit evidence rules]

## Prove it

Each checked page has the intended language, canonical and equivalent variants; annotations use supported codes, full URLs and return links; optional `x-default` is not a universal error gate; same-language duplicates are distinguished from translations; generated sitemap output was inspected or explicitly remains unverified; and protected route/head choices were preserved. [official sources above; coreyhaines31/marketingskills, seo-audit/references/international-seo.md]
