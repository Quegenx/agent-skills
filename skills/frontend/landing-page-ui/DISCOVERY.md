# Being found and measured

## The head of every page

One function builds it from the page's path, title and description:

- **Canonical** in the current language, **alternates** for each language plus `x-default`.
- **Title** with the brand appended unless it already contains it; **description**; **robots** `index, follow, max-image-preview:large` (or `noindex, follow` for pages that should not rank).
- **Open Graph and the large card:** title, description, URL, type (`website` or `article`), site name, locale and alternate locale, a share image per language (or the article's cover) with its alt text.
- **Structured data:** the page as `WebPage` (or `BlogPosting` with its publish date and the organization as author) linked by `@id` to one `Organization` and one `WebSite` declared on the home page, in the page's language.
- **FAQ structured data** built from the same question list the page renders, so search results never promise an answer the page doesn't show.

## Origins and discovery files

The public origin comes from validated build settings (a malformed URL fails the build instead of shipping broken links). Committed discovery files (sitemap, robots, an `llms.txt`) always name the production origin, whatever a local build runs with.

## Caching content pages

Pages built from published content (the blog) send `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=86400`: the browser always revalidates, the CDN serves for five minutes and keeps serving a stale copy for a day while it refreshes.

## Consent and analytics

- The analytics tag loads only when the site has one configured, in consent mode: storage denied by default, granted from the first page view only if the visitor already accepted (read from storage in the head script), and updated the moment they choose in the banner.
- One event helper that does nothing on the server or without the tag. Events carry no personal data: which button sent someone to the app and from which page, which navigation links that lead to conversion pages were used and from where, form sent or failed, article opened (once per article per visit).
