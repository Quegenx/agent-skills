# Link previews

What a shared link shows on Facebook, X, LinkedIn, Slack and in Google results, and how to get it right: the Open Graph tags every page needs, each platform's own tags, image sizes and caches, and a checklist. Facts come from each platform's docs (ogp.me, Meta for Developers, LinkedIn Help, Slack's robots page, Google Search Central), checked on 2026-10-18. The X Cards pages are gone from the live site (`developer.x.com/en/docs/x-for-websites/cards/...` redirects to `docs.x.com/overview`), so X facts come from the last archived copies (web.archive.org, 2025): treat them as the last published version. The checklist also draws on the howsitlookin.com preview checker (paraphrased, no licence) and FreeScan's Open Graph check. Structured data is in [STRUCTURED-DATA.md](STRUCTURED-DATA.md); social post and banner sizes in [marketing-images](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-images/SKILL.md).

**Contents:** [Open Graph core](#open-graph-core) · [Facebook](#facebook) · [X cards](#x-cards) · [LinkedIn](#linkedin) · [Slack](#slack) · [Google results](#google-results) · [Crawlers and caches](#crawlers-and-caches) · [The share image](#the-share-image) · [Checking a page](#checking-a-page) · [Prove it](#prove-it)

## Open Graph core

From [ogp.me](https://ogp.me/):
- **Four required properties:** "The four required properties for every page are: og:title, og:type, og:image, og:url".
- **`og:url` is the canonical page URL:** "The canonical URL of your object that will be used as its permanent ID in the graph". URL values are "All valid URLs that utilize the http:// or https:// protocols", so write them absolute.
- **Image sub-properties:** `og:image:url`, `og:image:secure_url`, `og:image:type`, `og:image:width`, `og:image:height`, `og:image:alt`. Width and height are optional structured properties. The source `image` skill of coreyhaines31/marketingskills listed width and height as "Required Meta Tags"; ogp.me does not. [coreyhaines31/marketingskills, image]
- **Alt text:** "If the page specifies an og:image it should specify og:image:alt", and alt is "A description of what is in the image (not a caption)". landing-page-ui follows it: "The image's alt describes what the image shows", the article's cover alt or one message for the default share image ([landing-page-ui DISCOVERY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/DISCOVERY.md)).
- **Keep OG and X fields consistent,** and `og:url` equal to the canonical. [freescan]

## Facebook

From [Meta's webmaster guide](https://developers.facebook.com/docs/sharing/webmasters) and [image guide](https://developers.facebook.com/docs/sharing/webmasters/images):
- **`og:url`** "should be the undecorated URL, without session variables, user identifying parameters, or counters".
- **`og:title`** "without any branding such as your site name". landing-page-ui follows it: "`og:title` is the page title without the appended brand"; `<title>` and the card's title keep the brand ([landing-page-ui DISCOVERY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/DISCOVERY.md)).
- **`og:description`:** "usually between 2 and 4 sentences".
- **Defaults:** `og:type` is `website`, `og:locale` is `en_US`.
- **`fb:app_id`:** "In order to use Facebook Insights you must add the app ID to your page."
- **Image size:** at least 200x200, at most 8 MB; "Use images that are at least 1200 x 630 pixels" for high resolution; 600x315 for the large-image layout, and smaller renders as a thumbnail beside the link; ratio "as close to 1.91:1"; `og:image:type` one of jpeg, gif or png.
- **Set `og:image:width` and `og:image:height`** so the first share renders without waiting for an asynchronous image download.
- **Without OG tags** the crawler "uses internal heuristics".

## X cards

From the archived X Cards markup, summary, summary_large_image, getting-started and troubleshooting pages:
- **`twitter:card` picks the layout.** "If an og:type, og:title and og:description exist in the markup but twitter:card is absent, then a summary card may be rendered." Set `summary_large_image` for a wide image.
- **Fallbacks to Open Graph:** `twitter:title` to `og:title` (max 70 characters), `twitter:description` to `og:description` (max 200), `twitter:image` to `og:image`, `twitter:image:alt` to `og:image:alt` ("Maximum 420 characters"). Repeating them is optional; `twitter:card` is not.
- **Images:** `summary_large_image` is 2:1, minimum 300x157, maximum 4096x4096, "less than 5MB", JPG, PNG, WEBP or GIF (first frame only), "SVG is not supported". The `summary` card is 1:1, "cropped to a square on all platforms".
- **Image choice:** "You should not use a generic image such as your website logo, author photo, or other image that spans multiple pages."
- **`twitter:site` and `twitter:creator` hold @usernames.** The markup table says "Either twitter:site or twitter:site:id is required" for the summary, large-image and player cards, while the summary and large-image pages list `twitter:site` as not required; the docs disagree with themselves.
- **Title truncation:** "iOS, Android: Truncated to two lines ... Web: Truncated to one line".

## LinkedIn

- **Tags:** `og:title`, `og:image`, `og:description` and `og:url` "must exist". Image at most 5 MB, at least 1200x627, ratio 1.91:1 ([LinkedIn Help a521928](https://www.linkedin.com/help/linkedin/answer/a521928)).
- **Narrow images shrink:** a post image "must be more than 200 pixels wide", or it shows as a thumbnail on the left ([LinkedIn Help a563309](https://www.linkedin.com/help/linkedin/answer/a563309)).

## Slack

From [api.slack.com/robots](https://api.slack.com/robots):
- **It reads** "oEmbed and Twitter Card / Open Graph tags".
- **It fetches** "as little of the page as it can" with HTTP Range headers, and also fetches a referenced image, video or audio file to check it.
- **It ignores robots.txt:** Slack is not a crawler and acts on a user's behalf.
- **Cache:** results are cached "globally across the service for around 30 minutes".

## Google results

From Google Search Central ([title links](https://developers.google.com/search/docs/appearance/title-link), [snippets](https://developers.google.com/search/docs/appearance/snippet), [special tags](https://developers.google.com/search/docs/crawling-indexing/special-tags), [favicon](https://developers.google.com/search/docs/appearance/favicon-in-search), [Search updates](https://developers.google.com/search/updates)):
- **Title link sources:** `<title>`, the main visual title, `<h1>`, `og:title`, other large prominent text, other page text, anchor text, inbound link text and `WebSite` structured data. Changes take "a few days to a few weeks" to show.
- **No length limits.** "there's no limit on how long a `<title>` element can be" and "There's no limit on how long a meta description can be"; both are truncated "typically to fit the device width". "Create unique descriptions for each page." howsitlookin's 50 to 60 character title and 150 to 160 character description targets, and FreeScan's 50 to 170 description band, are those tools' own thresholds, not Google rules; X's 70 and 200 limits apply to X cards only.
- **Snippet controls:** `nosnippet`, `max-snippet:[number]` and `data-nosnippet`.
- **Robots defaults:** `index, follow` "and don't need to be specified"; when rules conflict, the more restrictive one wins.
- **Meta keywords:** "The meta-keyword tag is not used by Google Search, and it has no effect on indexing and ranking at all." howsitlookin still suggests 5 to 10 of them; don't.
- **Favicon:** square, "at least 8x8px", recommended "larger than 48x48px"; rel `icon`, `shortcut icon`, `apple-touch-icon` or `apple-touch-icon-precomposed`; on the home page; one per hostname; crawlable by Googlebot-Image.
- **Thumbnails:** Google uses "both schema.org markup and the `og:image` `meta` tag" when it picks an image thumbnail (Search updates, 2026-03-02), so the share image and the structured-data `image` should agree.

## Crawlers and caches

| Platform | User agent | robots.txt | Cache | To refresh |
|---|---|---|---|---|
| Facebook | `facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)` | (not stated) | Images "cached based on the URL and won't be updated unless the URL changes" | Sharing Debugger, which "will show which meta tags the crawler scrapes as well as any errors or warnings" and "also triggers a scrape"; a Graph API force-scrape can pre-cache the image; a new image URL |
| X | `Twitterbot/1.0` | "Twitter's crawler respects Google's robots.txt specification"; a blocked page shows no card and a blocked image no image | "Content is cached by Twitter for 7 days after a link to a page with card markup has been published"; images by URL | Add a query parameter to the image URL |
| Slack | `Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)` | Ignored | "around 30 minutes" | (not stated) |

- **Facebook's crawler** "only accepts gzip and deflate encodings". [Meta]
- **X's crawler** "requires the use of TLS v1.1 or greater"; robots.txt "must be saved as plain text with ASCII character encoding"; allow it with `User-agent: Twitterbot` and an empty `Disallow:`. Twitterbot can be verified by IP ranges 199.16.156.0/22, 199.59.148.0/22 and 192.133.76.0/22. [X Cards, archived]
- **Firewalls and bot rules count too:** a crawler blocked by a WAF gets no preview whatever robots.txt says. Request the page with each crawler's user agent. Crawler access in general: [TECHNICAL-AUDIT.md](TECHNICAL-AUDIT.md). [freescan]
- **Platforms cache previews,** so refresh in each platform's debugger after a change. [freescan]

## The share image

- **One image that works everywhere:** 1200x630 meets Facebook's high-resolution size and LinkedIn's 1200x627 minimum at about 1.91:1; X's large card is 2:1. Stay under 5 MB (X and LinkedIn) and use PNG or JPEG (Facebook takes jpeg, gif or png; X never takes SVG).
- **Not a tiny logo** and not one generic image for every page. [freescan] [X Cards, archived]
- **A changed image gets a new URL,** because Facebook and X cache by image URL.
- **Images per page at scale:** generate them from a template with the page's data; programmatic pages are in [PAGES-AT-SCALE.md](PAGES-AT-SCALE.md). [coreyhaines31/marketingskills, image]
- **Generating them with `@vercel/og`** ([Vercel](https://vercel.com/docs/og-image-generation), updated 2026-06-16): it runs on the Node.js runtime and "uses Satori and Resvg to convert HTML and CSS into PNG"; Next.js App Router already includes it; it needs Node.js 22+; fonts only `ttf`, `otf` or `woff`; "Only flexbox (`display: flex`) and a subset of CSS properties", no `display: grid`; "Maximum bundle size of 500KB" including fonts and images; `pages/` on the Node.js runtime does not support `return new Response(...)`. The source `image` skill said it "generates images at the edge"; Vercel documents the Node.js runtime. [coreyhaines31/marketingskills, image]
- landing-page-ui's own choice is a static PNG per language, "such as `/images/og/og-image-{lang}.png`, or the article's cover" ([landing-page-ui DISCOVERY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/DISCOVERY.md)). Image compression and formats for the page itself: [web-performance BROWSER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/BROWSER.md#images-and-video).

## Checking a page

Each item traces to the platform sections above; the list is assembled from them.
1. The four required OG tags are present.
2. `og:url` and `og:image` are absolute http(s) URLs.
3. `og:url` equals the page's canonical URL.
4. `og:image:width` and `og:image:height` are set.
5. `og:image:alt` (or `twitter:image:alt`) is set.
6. `twitter:card` matches the image shape: `summary_large_image` for a 1.91:1 or 2:1 image.
7. `twitter:site` is an @handle.
8. The image is under 5 MB and not SVG.
9. robots.txt doesn't block Twitterbot or the image path, and no firewall rule blocks the crawlers.
10. A changed image has a new URL.

**Read each platform's tags in its own order.** howsitlookin's previews draw every platform from one merged record of title, description, image and icon, never read `twitter:card`, crop X at 16:9 instead of 2:1, and on the sampled pages filled the icon from a third-party favicon service, so its favicon check could not fail there; its own disclaimer says the previews "are approximations". Its "Posts with images get 2-3x more clicks" has no source and is not used here. [howsitlookin]

**Anti-patterns seen on a live head** [howsitlookin]: `og:url` pointing at the image path instead of the page; relative `og:image` and `twitter:image`; `twitter:card` `summary` with a 1200x630 image (cropped square); `twitter:site` without the @ and a `twitter:creator` that is not a username; a doubled slash in the URL; an empty `<meta name="keywords">`; no canonical and no image alt.

## Prove it

- **Tags present:** the server HTML of each public page (no JavaScript run) contains `og:title`, `og:type`, `og:image`, `og:url`, `og:image:alt` and `twitter:card`, with absolute URLs.
- **Canonical agrees:** `og:url` is byte-identical to `<link rel="canonical">` on every page.
- **Crawlers get it:** `curl -A 'facebookexternalhit/1.1' -H 'Accept-Encoding: gzip'` and `curl -A 'Twitterbot/1.0'` on the page return 200 with the same tags, and the image URL returns 200 with an image content type under 5 MB.
- **Image sized:** the share image is at least 1200x630 and its `og:image:width` and `og:image:height` match the file.
- **Debuggers clean:** Meta's Sharing Debugger shows the expected title, description and image with no warnings after a scrape.
- **Refresh works:** after replacing the image under a new URL, a fresh share on Facebook and X shows the new image.
