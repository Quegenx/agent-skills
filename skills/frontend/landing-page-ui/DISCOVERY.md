# Being found and measured

## The head of every page

One function builds it from the page's path, title and description:

- **Canonical** in the current language, **alternates** for each language plus `x-default`. The default language has no path prefix, the second lives under its code (`/en`), and `x-default` points at the default language.
- **Title** with the brand appended unless it already contains it; **description**; **robots** `index, follow, max-image-preview:large` (or `noindex, follow` for pages that should not rank).
- **Open Graph and the large card:** title, description, URL, type (`website` or `article`), site name, locale and alternate locale, a share image per language (a PNG such as `/images/og/og-image-{lang}.png`, or the article's cover) with the branded title as its alt text, and the card's own title, description, image and alt repeated.
- **Structured data:** the page as `WebPage` (or `BlogPosting` with its publish date, image and the organization as author) linked by `@id` to one `Organization` and one `WebSite` declared on the home page, in the page's language (`inLanguage` as a full tag, such as `en-US`). Ids are fragments: `{origin}/#organization`, `{origin}/#website`, `{canonical}/#webpage`, `{canonical}/#faq`. The home page also declares its own `WebPage` with `isPartOf` the website and `publisher` the organization. The organization's logo is a PNG.
- **FAQ structured data** built from the same question list the page renders, so search results never promise an answer the page doesn't show: a `FAQPage` with its `@id`, `url` and `inLanguage`. A page of topic sections flattens every section's items into one list.
- **Composing the scripts:** product and FAQ pages append their FAQ data to the default head scripts; the home page replaces them with its own complete set. A route whose data didn't load returns an empty head rather than a half-filled one.

## Origins and discovery files

The public origin comes from validated build settings (a malformed URL fails the build instead of shipping broken links). Drop empty strings before decoding, so a blank setting counts as unset rather than invalid, and validate the analytics id's shape (for example `^G(?:T)?-[A-Z0-9]+$`). Committed discovery files (sitemap, robots, an `llms.txt`) always name the production origin, whatever a local build runs with.

## Caching content pages

Pages built from published content (the blog index and every post) send `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=86400`: the browser always revalidates, the CDN serves for five minutes and keeps serving a stale copy for a day while it refreshes.

## Consent and analytics

- The analytics tag loads only when the site has one configured, in consent mode: its script loads `async` before the bootstrap; analytics storage is denied by default and granted from the first page view only if the visitor already accepted (read from storage in the head script), and updated the moment they choose in the banner. The ad consents (ad storage, ad user data, ad personalization) stay denied always.
- One event helper that does nothing on the server or without the tag. Events carry no personal data and have complete literal names: which button sent someone to the app and from which page (`app_entry_clicked` with the action and the path as its location), which navigation links that lead to conversion pages were used and from where (footer links are tracked only for a fixed set of conversion destinations, read from a `data-analytics-destination` attribute, reported with the footer as their location), form sent or failed, plan chosen, article opened (once per article per visit).
