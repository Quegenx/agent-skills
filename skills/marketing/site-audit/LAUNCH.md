# Launch and SaaS audits

A launch audit covers the period when routing, caches, metadata and monitoring are likely to change together, and a SaaS audit adds a sign-in boundary the public audit stays outside. Both are restated from FreeScan's guides (freescan.app blog, "website launch audit checklist" and "how to audit a SaaS website", no licence; short quotes only). The host and DNS move itself is in [deployment SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/deployment/SKILL.md#moving-to-a-new-host-without-downtime); moving URLs without losing search traffic is in [site-architecture PLATFORMS-AND-MIGRATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/site-architecture/PLATFORMS-AND-MIGRATION.md#migrating-without-losing-traffic); the launch campaign is in [product-launch SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/product-launch/SKILL.md).

## Three passes

[freescan] Check a production-like build first, then the live switch, then scan again once caches and dependent systems have settled. Keep the previous deployment until the new release is "proven healthy".

| Area | What to verify |
|---|---|
| Routing | DNS, TLS, the hostname, redirects, the trailing-slash rule and fallbacks all behave as intended |
| Search controls | Production robots rules, meta robots, canonicals, sitemaps and structured data point at live URLs, since staging settings tend to survive a hurried switch |
| Critical journeys | Navigation, signup, contact, checkout, login and account recovery work on real devices: "A page view is not proof that the release works" |
| Observability | An owner can see errors, latency, uptime, conversion events and which deployment is live |
| Recovery | The prior release, its configuration, the data migration plan and whoever decides on rollback remain available |

### Preflight

- Preview and production usually differ (hostnames, secrets, caching, redirects, robots rules, email, billing, analytics): write the differences down and test each assumption that only holds in production during the switch [freescan].
- Ship the launch alone: copy cleanup and unrelated refactors make verification harder and enlarge what a rollback must reverse [freescan].

### Cutover

- Follow a written sequence with owners and stop conditions, and keep a cutover record: deployment id, configuration changes, DNS action, migration state, verification owner and rollback authority [freescan].
- Name owners, freeze other changes, lower the DNS TTL when it fits, keep the old release, and set measurable rollback triggers beforehand (availability, error rate, failed critical journeys, auth or payment impact, data integrity, serious search-routing defects) [freescan].
- Check from outside the admin session and the local cache, on representative networks and devices; request robots and the sitemap directly and read the final public response [freescan].

### After launch

- CDN propagation, DNS caches, background jobs, email delivery, third-party callbacks and search crawls lag the deploy, so keep watching availability and critical journeys after the first smoke test [freescan].
- Scan the canonical URLs again and store the result with the deployment record, as the launch measurement and the baseline for later regressions [freescan].

### What breaks search at launch

[freescan] Staging `noindex` rules, robots blocks, missing redirects, wrong canonicals, broken sitemaps, hostname changes, client-rendering failures and lost internal links. Test canonicals and `noindex` from outside the admin session on the production hostname; a reverse-proxied section can pass an origin's `noindex` straight to production ([site-architecture PLATFORMS-AND-MIGRATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/site-architecture/PLATFORMS-AND-MIGRATION.md#adding-pages-to-an-existing-site)).

Mistakes: removing the old release too early, checking only the home page (deep links, redirects, signup, assets, docs and crawler files each fail on their own), shipping staging directives [freescan]. Verification looks at the existing design and behaviour without changing it, and new SEO routes and metadata stay apart from a settled home page unless a separately reviewed change justifies touching it [freescan].

## Site launch QA checklist

[coreyhaines31/marketingskills, launch, references/site-launch-qa.md] (MIT) The pass-by-pass checklist for a new site, a redesign, a platform migration or a big new section: "most of these failures are invisible from the homepage". The source's Ploy rollback example is a partner listing and is left out.

**Before the switch**

- Content and links: every page in the plan exists with final copy ("no lorem ipsum, "TBD," or test prices"); crawl staging for broken internal links and missing images; legal pages (privacy, terms, cookie policy) are present and current; contact details, pricing and plan names match what sales and support say.
- Forms and conversions: submit every form with a test entry and confirm it reaches the inbox, CRM or tool it should; confirmation messages and redirects work, and spam protection doesn't block real submissions; conversion tracking fires on the confirmed submission, not the button click ([paid-ads CONVERSION-TRACKING-WEB.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/CONVERSION-TRACKING-WEB.md)); analytics is installed once, on every page, with internal traffic filtered; the consent banner works and tags respect it ([cookie-consent SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/cookie-consent/SKILL.md)).
- SEO: every page has a unique title, meta description and one H1; canonicals point to the production domain, not staging; staging is `noindex` or password-protected and production is **not** ("the most common launch-day SEO failure is shipping the staging `noindex`"); `robots.txt` allows the pages you want indexed and the XML sitemap lists production URLs; structured data validates (Rich Results Test for Google features, Schema Markup Validator for everything else); for a migration, the redirect map is loaded and tested on a sample of old URLs. Google's site-move rules (permanent 301 or 308 redirects straight to the final URL, old- and new-URL sitemaps, redirects kept "generally at least 1 year") are in [site-architecture PLATFORMS-AND-MIGRATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/site-architecture/PLATFORMS-AND-MIGRATION.md#migrating-without-losing-traffic).
- Performance and access: Core Web Vitals acceptable on the key templates, on mobile; pages work on mobile, in Safari and inside in-app browsers (LinkedIn, Instagram, Facebook); alt text, form labels and keyboard navigation work; Open Graph images and titles render when the URL is shared ([seo LINK-PREVIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/LINK-PREVIEWS.md)).
- Rollback: "You know how to roll back on this platform, and someone has done it once"; DNS TTL lowered a day ahead if the switch involves DNS changes.

**At the switch**

- Deploy redirects at the same moment as the new site.
- HTTPS works on every hostname (`www` and apex) and one redirects to the other.
- Load the top 10 pages by traffic and check content, title, canonical and a 200 status.
- Submit one real form and confirm it arrives everywhere it should.
- Submit the sitemap in Search Console and Bing Webmaster Tools.
- Re-check that production isn't `noindex`.

**The first two weeks**

- Search Console: watch coverage and 404s daily for the first week, then weekly; fix missing redirects as they show up.
- Compare traffic and conversions to the same period before, page by page, not just in total.
- Confirm conversions are arriving in each ad platform at the expected rate.
- Fix internal links that still point at redirected URLs.
- Collect the bugs the team and customers report, and decide what's urgent.

## SaaS audits

[freescan] Before testing, map the public path a new customer takes: landing page, pricing, signup, the hand-off to sign-in, where onboarding begins, docs, legal pages and status communication.

| Area | What to verify |
|---|---|
| Acquisition | The search listing, the landing promise, proof, pricing context and the primary action read as one journey |
| Trust | Company identity, security and privacy wording, legal links, support and status communication are accurate |
| Signup boundary | Forms, validation, password managers, email confirmation and the sign-in hand-off work, accessibly |
| Existing-user path | Marketing releases leave login and product entry unchanged |
| Operations | Docs, support, incident communication, monitoring and rollback have owners |

- **Stay outside the boundary.** A crawler sees the marketing page, public headers, metadata, controls and linked resources; it cannot show that permissions, tenant isolation, billing or internal workflows are right. Mark where identity, payment, private data or customer state begins, and give those parts their own owners, fixtures and test plans. "A marketing audit does not grant permission to inspect accounts, tenants, or private APIs" [freescan].
- **Test only authorized flows,** using synthetic identities, approved test accounts, sandbox payments and actions that destroy nothing; no real customer data and no real charges [freescan]. Signed-in journeys belong in [e2e-testing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/e2e-testing/SKILL.md).
- **Regression-test existing users,** not only new signups: login and account access can break when shared routing or layouts change, so release checks cover both conversion and existing-user login. Changes to auth, signup, billing, shared layouts, routing or global headers generally carry a larger blast radius than isolated content additions [freescan].
- **Make the promises agree.** Plan names, trial terms, data handling, cancellation, support routes and status visibility should match between landing pages and signup; FreeScan calls a contradiction both a conversion and a trust problem. Try the path with the keyboard, zoom, error states, password managers and a slow network [freescan].

Fix first: blocked signup, misleading plan information, insecure hand-offs, inaccessible forms and missing trust context [freescan].

## Prove it

The launch has a preflight, a cutover record (deployment id, config changes, DNS action, migration state, verification owner, rollback authority) and a post-settle rescan stored with the deployment; rollback triggers were written before the switch; production robots, canonicals, sitemaps and `noindex` were fetched from outside the admin session on the live hostname; deep links, signup and crawler files were checked, not only the home page; the old release stayed recoverable until journeys and monitoring proved the new one; a SaaS audit lists which routes needed explicit test authorization, used only synthetic accounts and sandbox payments, and regression-tested existing-user login.
