# Headless CMS for marketing content

Choosing, modeling and running a CMS for marketing pages. From coreyhaines31/marketingskills `content-strategy` `headless-cms.md` (MIT), with preview facts checked against Sanity, Contentful and Strapi docs and the SEO lengths against Google. The platform opinions ("Generous", "Limited") are the source's, as of its v2.1.3; check current pricing on each vendor's site. landing-page-ui reads its blog from its own database instead of a CMS: "published articles per language, newest first, decoded by a schema at the boundary" ([landing-page-ui CONTENT-PAGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/CONTENT-PAGES.md)).

## Headless or traditional

`[coreyhaines31/marketingskills, content-strategy]` A headless CMS stores structured content and delivers it by API to any frontend.
- **Headless fits when:** several frontends use the same content (web, mobile, email); developers want full control of the frontend; content is reused across channels; you build with a modern framework (Next.js, Remix, Astro); marketing needs structured, reusable blocks.
- **Traditional fits when:** a small team has no dedicated developers; a simple blog or brochure site; WYSIWYG editing is a hard requirement; budget is tight and WordPress or Webflow does the job.

| Factor | Headless | Traditional |
|---|---|---|
| Multi-channel delivery | Yes | Limited |
| Developer control | Full | Constrained |
| Non-technical editing | Requires setup | Built-in |
| Time to launch | Longer | Faster |
| Content reuse | Native | Manual |
| Hosting flexibility | Any frontend | Platform-dependent |

## Content modeling

`[coreyhaines31/marketingskills, content-strategy]` Verbatim principles:
1. "Think in types, not pages." A Landing Page is a content type with fields.
2. "Separate content from presentation." Store the headline text, not the styled headline.
3. "Design for reuse." A testimonial on five pages is one Testimonial type, referenced.
4. "Keep models flat." Deep nesting is hard to query and maintain; "Prefer references over nesting."

| Type | Key fields | Notes |
|---|---|---|
| Landing Page | title, slug, hero, sections[], seo | Modular sections |
| Blog Post | title, slug, body, author, category, tags, publishedAt, seo | Rich text or Portable Text body |
| Case Study | title, customer, challenge, solution, results, metrics[], logo | Link to related products or features |
| Testimonial | quote, author, role, company, avatar, rating | Referenced from landing pages |
| FAQ | question, answer, category | Grouped by category for programmatic pages |
| Author | name, bio, avatar, social links | Referenced from blog posts |
| CTA Block | heading, body, buttonText, buttonUrl, variant | Reusable across pages |

The source models a person as the author; landing-page-ui makes the organization the author instead: "`BlogPosting` with its publish date, image and the organization as author" ([landing-page-ui DISCOVERY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/DISCOVERY.md)).

## SEO fields

`[coreyhaines31/marketingskills, content-strategy]` Every page-level type carries `metaTitle`, `metaDescription`, `ogImage`, `slug`, an optional `canonicalUrl` override, a `noIndex` boolean and an optional `structuredData` JSON-LD override.

- **Title length:** Google: "While there's no limit on how long a `<title>` element can be, the title link is truncated in Google Search results as needed, typically to fit the device width." Make titles descriptive and concise, unique per page, with the brand once and no repeated keywords ([title links](https://developers.google.com/search/docs/appearance/title-link)). The source said `metaTitle` "50-60 characters"; treat any number as a truncation heuristic.
- **Description length:** Google: "There's no limit on how long a meta description can be, but the snippet is truncated in Google Search results as needed, typically to fit the device width." Unique per page ([snippets](https://developers.google.com/search/docs/appearance/snippet)). The source said "150-160 characters".
- **Social image:** Meta: "Use images that are at least 1200 x 630 pixels", minimum 200 x 200, aspect ratio 1.91:1 ([sharing images](https://developers.facebook.com/docs/sharing/webmasters/images/)). The source's "1200x630px" is that minimum, not an exact size. Link previews in full are [seo LINK-PREVIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/LINK-PREVIEWS.md).
- Structured data rules are in [seo STRUCTURED-DATA.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/STRUCTURED-DATA.md).

## Editorial workflow

`[coreyhaines31/marketingskills, content-strategy]` Draft (the author writes) > Review (an editor checks accuracy, voice, SEO) > Approve (a stakeholder signs off) > Schedule > Publish (live through the API). A preview route in the frontend (for example `/api/preview`) authenticates and renders drafts.

| Role | Create | Edit | Publish | Delete |
|---|---|---|---|---|
| Author | Yes | Own | No | Own drafts |
| Editor | Yes | All | Yes | Drafts |
| Admin | Yes | All | Yes | All |

Exact permission models vary: Sanity uses role-based access, Contentful space-level roles, Strapi granular RBAC.

## Preview APIs

- **Contentful:** replace "the hostname cdn.contentful.com with preview.contentful.com, and the production access token with a preview access token" ([Content Preview API](https://www.contentful.com/developers/docs/references/content-preview-api/)).
- **Strapi v5:** "`publicationState` is removed and replaced by `status`"; drafts with `GET /api/restaurants?status=draft` ([breaking change](https://docs.strapi.io/cms/migration/v4-to-v5/breaking-changes/publication-state-removed), [REST status](https://docs.strapi.io/cms/api/rest/status)).
- **Sanity:** visual editing is the Presentation Tool with the Live Content API ([Sanity docs](https://www.sanity.io/docs/visual-editing/introduction-to-visual-editing)). `@sanity/preview-kit`, which provides `useLiveQuery`, says "This toolkit is no longer actively developed" and points to `next-sanity`'s `defineLive` for Next.js server components and the React Loader for the pages router, Remix, React Router and TanStack Start ([preview-kit README](https://github.com/sanity-io/preview-kit)). The source said "Real-time preview with `useLiveQuery` or Presentation tool".

## Platforms

`[coreyhaines31/marketingskills, content-strategy]` The source's comparison, its opinions:

| Feature | Sanity | Contentful | Strapi |
|---|---|---|---|
| Hosting | Cloud (managed) | Cloud (managed) | Self-hosted or Cloud |
| Query language | GROQ | REST / GraphQL | REST / GraphQL |
| Free tier | Generous | Limited | Open source (free) |
| Real-time collaboration | Yes (built-in) | Limited | No |
| Best for | Developer flexibility | Enterprise multi-locale | Budget, self-hosted |
| Content modeling | Schema-as-code | Web UI | Web UI or code |
| Media handling | Built-in DAM | Built-in | Plugin-based |

- **Sanity:** schema in code, Portable Text, real-time collaboration; a steeper curve for non-developers, Studio customization needs React, lock-in on GROQ queries. Fits when developers and marketers work closely on complex models.
- **Contentful:** mature, strong multi-locale; pricing scales with content types and locales, two APIs (Delivery and Management), tight rate limits on lower plans. Fits enterprises with multi-market content.
- **Strapi:** open source and self-hostable, no per-seat pricing, REST by default and GraphQL by plugin; you run the infrastructure, and the v4 to v5 migration can be significant. Fits teams with DevOps capability.
- **Others the source names:** Hygraph (GraphQL-native, federation), Keystatic (Git-based), Payload (TypeScript-first, self-hosted), Builder.io (visual editor), Prismic (slice-based modeling).

## Implementation checklist

`[coreyhaines31/marketingskills, content-strategy]`
- [ ] Content types from page types and reusable blocks
- [ ] SEO fields on every page-level type
- [ ] Preview or draft mode in the frontend
- [ ] Roles and permissions for the team
- [ ] Sample content for each type before building the frontend
- [ ] Webhooks on content changes (rebuild triggers)
- [ ] Editor guidelines (field descriptions, character limits)
- [ ] Delivery performance tested (CDN, caching, ISR); landing-page-ui's blog sends `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=86400` ([landing-page-ui DISCOVERY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/DISCOVERY.md))
- [ ] A migration plan if moving from an existing CMS

## Prove it

A draft is reachable only through the authenticated preview route; publishing fires the rebuild webhook; every page type has the SEO fields; the Sanity preview uses `defineLive` or the React Loader, not `useLiveQuery`; Strapi queries use `status=draft`, not `publicationState`.
