# Structured data

Rules for JSON-LD that search engines and other consumers can use: which Google features still exist, the properties each one needs, one identity graph across pages, review rules, safe serializing and validation. The base is the MIT `schema` skill of coreyhaines31/marketingskills (where it disagrees with Google's docs, Google's form is written and the source's line is named), squirrelscan's entity-map guide (MIT), FreeScan's structured-data checks and aeo.js's JSON-LD notes, all checked against Google Search Central on 2026-10-18. Where the source says to read `.agents/product-marketing.md` first, this repo's file is [`.agents/product-context.md`](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md). Copyable examples: [STRUCTURED-DATA-EXAMPLES.md](STRUCTURED-DATA-EXAMPLES.md). Share cards and Open Graph: [LINK-PREVIEWS.md](LINK-PREVIEWS.md).

**Contents:** [Check feature support first](#check-feature-support-first) · [Format and placement](#format-and-placement) · [Properties by feature](#properties-by-feature) · [One identity across pages](#one-identity-across-pages) · [Reviews and ratings](#reviews-and-ratings) · [Serializing](#serializing) · [Validating](#validating) · [Where landing-page-ui differs](#where-landing-page-ui-differs) · [Prove it](#prove-it)

## Check feature support first

- **schema.org validity is not Google eligibility.** Before writing markup for a search appearance, check Google's [search gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery); on 2026-10-18 it lists 25 features and no FAQ, HowTo or sitelinks search box. [coreyhaines31/marketingskills, schema]
- **Retired Google features** ([Search documentation updates](https://developers.google.com/search/updates)):

| Feature | What Google says | Date |
|---|---|---|
| FAQ rich result | "This feature will no longer appear in Google Search starting May 7, 2026" (notice posted May 8); documentation removed June 15, 2026: "The FAQ rich result feature is no longer shown in Google Search results" | 2026-05-07 |
| HowTo rich result | documentation removed, "no longer shown in search results, on both desktop and mobile devices"; FAQ was then limited to "well-known, authoritative government and health websites" | 2023-09-14 |
| Sitelinks search box (`WebSite` + `SearchAction`) | "The sitelinks search box feature is no longer available in Google Search results" | 2024-11-29 |
| Course info, estimated salary, learning video, special announcement, vehicle listing | "no longer shown in Google Search results" | 2025-09-09 |
| Practice problem | documentation removed | 2026-01-06 |
| Dataset | "only used by Dataset Search", not Google Search | 2025-11-05 |

- **Retired types stay valid vocabulary.** `FAQPage` and `HowTo` are current schema.org types and can still describe matching visible content for another consumer. Explain that, ask which consumer needs the markup, and never recommend it to win a retired Google appearance. Missing Rich Results Test detection or Search Console reports for a retired type is not a broken implementation, and it is no reason to remove unrelated supported markup. [coreyhaines31/marketingskills, schema]
- **Keep `WebSite` markup when the search box is gone:** it still carries the site name ([site names](https://developers.google.com/search/docs/appearance/site-names)). `SearchAction` cannot bring the box back. [coreyhaines31/marketingskills, schema]
- **AI features need no special markup.** Google: "There's also no special schema.org structured data that you need to add" for AI Overviews or AI Mode, and it recommends "Making sure your structured data matches the visible text" ([AI features](https://developers.google.com/search/docs/appearance/ai-features)). aeo.js's hints that AI Overviews "heavily rely on structured data" and that FAQPage or HowTo "boost AI citation rate" contradict this. AI search work lives in [ai-search-visibility](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ai-search-visibility/SKILL.md).
- **Not every page needs structured data,** and valid markup does not guarantee a rich result. [freescan]

## Format and placement

- **JSON-LD.** Google: "In general, Google recommends using JSON-LD ... if your site's setup allows it"; Microdata and RDFa also work. The script can sit in `<head>` or `<body>` ([intro](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)). [coreyhaines31/marketingskills, schema]
- **Markup matches the page.** Mark up only content the page shows, and update it when the content changes. [coreyhaines31/marketingskills, schema]
- **JavaScript-built markup counts once rendered:** Google processes "structured data that's available in the DOM when it renders the page" ([JavaScript](https://developers.google.com/search/docs/appearance/structured-data/generate-structured-data-with-javascript)). For Product, put it in the initial HTML, because "dynamically-generated markup can make Shopping crawls less frequent and less reliable" ([product snippet](https://developers.google.com/search/docs/appearance/structured-data/product-snippet)). Rendering and crawl checks are in [TECHNICAL-AUDIT.md](TECHNICAL-AUDIT.md).
- **One script and one `@graph` is a source organization convention**, not a JSON-LD validity requirement. When processing all JSON-LD script elements in an HTML document, the standard merges them into one dataset. The old line did not distinguish the convention from the standard. [coreyhaines31/marketingskills, schema; W3C embedding JSON-LD](https://www.w3.org/TR/json-ld11/#embedding-json-ld-in-html-documents)
- **Credit only the top-level type that matches the page's role.** "Nested Question, Answer, Offer, and SearchAction objects do not represent additional page-level coverage." [freescan]
- **By stack** [coreyhaines31/marketingskills, schema]: static sites write JSON-LD in the template, with partials for repeated blocks; React and Next.js render it from a component, server-side; WordPress uses a plugin (Yoast, Rank Math, Schema Pro), theme changes or custom fields. Two sources of markup on one site split the identity (next sections).

## Properties by feature

Google's required and recommended properties, from each feature's page. Google: required properties are needed "to be eligible", recommended ones make display "more likely", and it prefers "fewer but complete and accurate recommended properties" ([intro](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)).

| Feature (type) | Required | Recommended and rules |
|---|---|---|
| [Organization](https://developers.google.com/search/docs/appearance/structured-data/organization) | "There are no required properties" | `name`, `url`, `logo`, `sameAs`, `contactPoint`, `address`, `description`, `email`, `telephone`, `alternateName`. Logo "must be 112x112px, at minimum", crawlable, and looks right on white. Put it on the home page or one page about the organization: "You don't need to include it on every page of your site." |
| [Site name](https://developers.google.com/search/docs/appearance/site-names) (`WebSite`) | `name`, `url` | `url` is "the canonical home page of the domain or subdomain"; the markup "must be on the home page"; subdirectories are not supported. `alternateName` in order of preference. Nest it in the existing `WebSite` node rather than a second block; the same markup on duplicate home pages (www and non-www, http and https). |
| [Article](https://developers.google.com/search/docs/appearance/structured-data/article) (`Article`, `BlogPosting`) | "There are no required properties" | `author` (`author.name`, `author.url`), `dateModified`, `datePublished`, `headline`, `image`. Author is `Person` or `Organization`, never `Thing`; one `author` entry per author; `author.name` holds only the name. Dates in ISO 8601 with a timezone, "otherwise, we will default to the timezone used by Googlebot". Images crawlable, several high-resolution ones in 16x9, 4x3 and 1x1, at least 50K pixels (width x height). Visible dates and refresh rules: [CONTENT-REFRESH.md](CONTENT-REFRESH.md). |
| [Product snippet](https://developers.google.com/search/docs/appearance/structured-data/product-snippet) (`Product`, for review and aggregator sites) | `name` plus one of `review`, `aggregateRating` or `offers`; in Offer, `price` or `priceSpecification.price` | `availability`, `priceCurrency`, `priceValidUntil` (a past date can stop the snippet). The Rich Results Test "may report a warning if you provide `offers` without" a review or rating. |
| [Merchant listing](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing) (`Product`, where shoppers buy) | `name`, `image`, `offers`; Offer price "greater than zero" and `priceCurrency` | `availability`. Google: "Use merchant listing markup if customers can purchase from you." |
| [Software app](https://developers.google.com/search/docs/appearance/structured-data/software-app) (`SoftwareApplication`) | `name`, `offers.price` (`0` when free), and "You must include one of the following properties": `aggregateRating` or `review` | `priceCurrency` when the price is above 0; `applicationCategory` "must be a supported app type" (22 listed, such as `BusinessApplication`); `operatingSystem`. Only `VideoGame` as the type gets no rich result. |
| [Breadcrumb](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb) (`BreadcrumbList`) | `itemListElement` with "at least two `ListItems`"; `item` (URL) on each except the last; `name` | "Position 1 signifies the beginning of the trail." Several trails per page are allowed. "We recommend providing breadcrumbs that represent a typical user path to a page, instead of mirroring the URL structure." Breadcrumb rich results "only appear on desktop" (Search updates, 2025-01-22). Navigation design: [site-architecture](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/site-architecture/SKILL.md). |
| [Local business](https://developers.google.com/search/docs/appearance/structured-data/local-business) (`LocalBusiness`) | `name`, `address` | Use "the most specific LocalBusiness sub-type possible"; `geo` "precision must be at least 5 decimal places"; `priceRange` "must be shorter than 100 characters"; `opens` and `closes` in hh:mm:ss. Local search beyond markup: [LOCAL.md](LOCAL.md). |
| [Event](https://developers.google.com/search/docs/appearance/structured-data/event) (`Event`) | `location`, `location.address`, `name`, `startDate` | "Virtual experiences that have no real-world component aren't supported", "Events must take place in a physical location", "Events must be bookable to the general public" (Search updates, 2025-06-05). An online-only webinar stays valid schema.org (`eventAttendanceMode`) but gets no Google event appearance. |
| [Review snippet](https://developers.google.com/search/docs/appearance/structured-data/review-snippet) (`Review`, `AggregateRating`) | AggregateRating: "At least one of `ratingCount` or `reviewCount`" | Rules in [Reviews and ratings](#reviews-and-ratings). |

What the source's table said instead, each corrected above from Google's page [coreyhaines31/marketingskills, schema]:
- Organization "Required: name, url"; Article "Required: headline, image, datePublished, author": Google lists no required properties for either.
- Product "Required: name, image, offers (price + availability)": that mixes the product snippet and the merchant listing; `availability` is recommended in both.
- SoftwareApplication "Required: name, offers": Google also requires a rating or review.
- Event "Use For: Events, webinars" with a `VirtualLocation` example: online-only events are not supported.
- BreadcrumbList "Required: itemListElement (array with position, name, item)": the last crumb needs no `item`.
- A SaaS pricing page: the source's `pricing` skill names "Product/Offer schema"; Google documents software as `SoftwareApplication`, with `Offer` as the inner type. [coreyhaines31/marketingskills, pricing]

## One identity across pages

- **Use a stable expanded identity across pages.** Absolute site-wide `@id` values are the source's useful convention for avoiding different page bases. JSON-LD also accepts relative IRI references and resolves them against the document base or `@base`; relative syntax is not inherently invalid. The source and old rule said an ID had to be absolute. [squirrelscan; W3C node identifiers](https://www.w3.org/TR/json-ld11/#node-identifiers), [base IRI](https://www.w3.org/TR/json-ld11/#base-iri)
- **Resolve before comparing.** A fragment `#organization` on two different page bases can identify two different nodes. Use the intended stable expanded identifier everywhere; the source's claim that only an absolute spelling works was too broad. In Astro, configure the intended site origin when generating absolute site-wide IDs. [squirrelscan; W3C base IRI](https://www.w3.org/TR/json-ld11/#base-iri)
- **Where the Organization lives: two views.** squirrelscan's `entity-dangling` finding says to "Declare the target in the `@graph` of every page that references it" [squirrelscan]. Google says to place Organization markup on the home page or a single page about the organization, and "You don't need to include it on every page of your site"; its page does not mention `@id` ([organization](https://developers.google.com/search/docs/appearance/structured-data/organization)). squirrelscan's line that sixty unlinked `Organization` blocks are "sixty organizations to a search engine" is its interpretation, not in Google's docs.
- **squirrelscan's entity findings** (rule pages `https://docs.squirrelscan.com/rules/schema/{finding}`) [squirrelscan]:

| Finding | What it means | The change |
|---|---|---|
| `entity-identity` | The same organization, person or website on many pages with no `@id` | Add one absolute `@id`, identical on every page |
| `entity-split-identity` | One entity under two different `@id`s, usually two plugins | Pick one; make the other a `sameAs` or remove it |
| `entity-conflicts` | The same entity with two logos, names or phone numbers | Converge on one value, then reference instead of repeating |
| `entity-dangling` | A reference to an `@id` nothing declares | Declare the target in the `@graph` of every page that references it |
| `entity-id-format` | Scanner convention flags an `@id` that is not an absolute URL | Use the chosen absolute site-wide convention; relative JSON-LD references remain valid as qualified above |
| `entity-type-drift` | One `@id` with different `@type` sets on different pages | Emit the same type array everywhere |
| `entity-authors` | A byline with no `Person`, or a `Person` with no identifiers | Declare the author with `@id`, `url` and `sameAs` |
| `entity-publisher-mismatch` | Pages that name different publishers | One publisher, referenced by `@id` |
| `entity-website-missing` | No `WebSite` node, or no `isPartOf` links to it | Declare it once, reference it from every page |
| `entity-organization-missing` | A business with no organization entity | Declare it once with `sameAs` |
| `entity-sameas-missing` | An organization with no `sameAs` profiles | List every profile you control |
| `entity-local-business-per-page` | The whole business block on every page | Declare once, reference elsewhere |
| `entity-orphan` | An `@id` nothing points at, on one page | Reference it, or drop the `@id` |

- **Split identity means a second source of markup.** Turn schema output off in one generator rather than reconciling both, and search the theme for `application/ld+json` before blaming the plugin. Yoast keeps organization details under Settings, Site representation; Rank Math's Local SEO markup belongs on the home, about and contact pages only. With WordLift beside Yoast, "Adding the other id as a `sameAs` does not resolve the finding", because both organizations are still declared. [squirrelscan]
- **Verifying an id fix** with `squirrel entities --diff` (read the `gainedId` rows; change the identifier before renaming): [site-audit SQUIRRELSCAN.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/site-audit/SQUIRRELSCAN.md#the-entity-map). [squirrelscan]

## Reviews and ratings

From Google's [review snippet](https://developers.google.com/search/docs/appearance/structured-data/review-snippet) page and the [Search updates](https://developers.google.com/search/updates):
- **Self-serving reviews get no stars:** when "the entity that's being reviewed controls the reviews about itself", a `LocalBusiness` or `Organization` is ineligible.
- **"Don't include fake or undisclosed incentivized reviews"** (added 2026-07-24).
- **The reviews are on the page:** "readily available to users from the marked-up page", and about "a specific item, not about a category or a list of items".
- **Say once what is reviewed:** don't nest several ways of naming the reviewed item (2025-11-12).
- **AggregateRating needs a count:** `ratingCount` or `reviewCount`.
- **LocalBusiness ratings** only "for sites that capture reviews about other local businesses" ([local business](https://developers.google.com/search/docs/appearance/structured-data/local-business)).
- Testimonials in the visible copy: [anti-slop-copy PAGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/PAGES.md) ("only real ones, with a name, role and company the person agreed to show").

## Serializing

- **Use a real JSON encoder,** never string templates: FreeScan's failing sample has a trailing comma and no `@context`. [freescan]
- **Escape `<` when JSON-LD goes into HTML.** `JSON.stringify` alone does not stop a value containing `</script>` from closing the element. The [Next.js guide](https://nextjs.org/docs/app/guides/json-ld) replaces "the character, `<`, with its unicode equivalent, `\u003c`": `JSON.stringify(jsonLd).replace(/</g, '\\u003c')`. Parsing the JSON gives back the original text, so don't delete characters or HTML-entity-escape the JSON. aeo.js also escapes `>`, `&`, U+2028 and U+2029. The general rule for JSON inside a script element lives in [secure-coding CATALOG.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/secure-coding/CATALOG.md#html-output-stored-xss). [coreyhaines31/marketingskills, schema] [aeo.js]
- **Render a native `<script>` in `layout.js` or `page.js`;** the Next.js guide says a native `<script>` tag is the right choice over `next/script`. The source's example used `<Head>`. [coreyhaines31/marketingskills, schema]
- **Dates in ISO 8601,** because a `Date` in a template literal renders "Thu May 14 2026 ...". [aeo.js] Google wants a timezone on Article dates (table above).
- **Typing, as an option:** the Next.js guide names `schema-dts` (`WithContext<Product>`) for typed JSON-LD, and `serialize-javascript` as another serializer. Both are new dependencies, so they need the owner's approval.

## Validating

- **Tools:** [Rich Results Test](https://search.google.com/test/rich-results) (Google's supported features only; for JavaScript-built markup use the URL input, not the code input), [Schema.org Validator](https://validator.schema.org/), Bing's URL inspection ([aeo.js]), and Search Console's rich result reports "to monitor ... pages, which might break after deployment" ([JavaScript](https://developers.google.com/search/docs/appearance/structured-data/generate-structured-data-with-javascript)). [coreyhaines31/marketingskills, schema]
- **Common errors:** missing required properties; invalid values (ISO 8601 dates, fully qualified URLs, exact enumerations); markup that doesn't match the visible content. [coreyhaines31/marketingskills, schema]
- **Valid is not shown.** Required properties make a page eligible; markup that breaks the guidelines "might be ineligible"; Google decides when to display ([intro](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)). Debug in order: whether the feature still exists, then syntax, required properties and guidelines; warnings (recommended fields) are not errors.
- **Testing checklist,** verbatim [coreyhaines31/marketingskills, schema]:
  - Requested Google appearance is currently supported, or a separate semantic consumer is identified
  - Validates in Schema.org Validator; supported Google features also pass Rich Results Test
  - Required-field errors resolved; recommended-field warnings reviewed
  - Matches page content
  - All required properties included
- **Before writing, ask** [coreyhaines31/marketingskills, schema]: what type of page is this; which rich result is wanted (then check it still exists); what data is available; what schema the page already has; what the stack is.

## Where landing-page-ui differs

The owner's marketing site keeps its own head design in [landing-page-ui DISCOVERY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/DISCOVERY.md); the owner's file stays as it is.
- **Agrees with Google since the owner's 2026-10-18 fixes:** FAQ markup is kept "so the markup matches the visible text" and the file records that "Google no longer shows FAQ rich results"; "the `WebSite` `url` is the bare origin in both languages"; and "every JSON-LD script's text goes through one serializer that replaces `<` with its unicode escape `\u003c` after `JSON.stringify`".
- **Organization placement, two views.** landing-page-ui links every page "by `@id` to one `Organization` and one `WebSite` declared on the home page", which matches Google's home-page placement; squirrelscan's `entity-dangling` would flag it.
- **Author.** landing-page-ui makes "the organization as author" of a `BlogPosting`; Google allows `Organization` authors and recommends `author.url`.

## Prove it

- **Feature exists:** for every rich result the task names, the gallery lists it today; a request for FAQ, HowTo or a sitelinks search box is answered with the retirement and its date before any code.
- **Validators pass:** each changed page passes the Schema.org Validator, and each supported Google feature passes the Rich Results Test by URL with no required-property errors.
- **Matches the page:** every marked-up question, price, rating and date is visible on the rendered page with the same value.
- **One identity:** across a crawl of the site, each `Organization` and `WebSite` reference expands to the same intended stable identifier, with one `@type` set per id.
- **Escaping holds:** a test value containing `</script><script>alert(1)</script>` comes out of the page's JSON-LD as `\u003c/script>` and `JSON.parse` returns the original string.
- **Dates:** every `datePublished` and `dateModified` parses as ISO 8601 with a timezone, and no example or live `priceValidUntil` is in the past.
- **Events:** every `Event` with Google markup has a physical `location.address`.
