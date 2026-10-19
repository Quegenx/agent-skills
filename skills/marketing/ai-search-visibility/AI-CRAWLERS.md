# AI crawlers and robots.txt

The publisher side of crawler control: which AI user agents exist, what each one is for, and how to write a robots.txt that keeps search discovery while deciding training separately. Every vendor fact below is quoted from that vendor's crawler page; the policy template is from [coreyhaines31/marketingskills, ai-seo] (MIT). The crawler side, obeying robots.txt when you crawl, is in [web-scraping CRAWLING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-automation/web-scraping/CRAWLING.md#robotstxt).

## Decide by purpose, not by one allowlist

Search discovery, user-triggered retrieval, model training and Google's product token are separate controls. "Do not infer that blocking a training crawler necessarily blocks citations." [coreyhaines31/marketingskills, ai-seo]

| Purpose | OpenAI | Anthropic | Google | Perplexity |
|---|---|---|---|---|
| Training | GPTBot | ClaudeBot | Google-Extended (token only; also grounding) | none ("not used to crawl content for AI foundation models") |
| Search index | OAI-SearchBot | Claude-SearchBot | Googlebot (Search, including AI Overviews) | PerplexityBot |
| User-triggered (robots.txt may not apply) | ChatGPT-User | Claude-User | Google-Agent and the other user-triggered fetchers | Perplexity-User |

The rule that falls out: to block training and keep search, disallow the training token and allow the search token (each vendor page below).

## OpenAI

[https://developers.openai.com/api/docs/bots]
- "Each setting is independent of the others." "A webmaster can allow OAI-SearchBot in order to appear in search results while disallowing GPTBot."
- **OAI-SearchBot** "is used to surface websites in search results in ChatGPT's search features". Opted-out sites "will not be shown in ChatGPT search answers, though can still appear as navigational links."
- **GPTBot** crawls content "that may be used in training our generative AI foundation models".
- **ChatGPT-User**: "Because these actions are initiated by a user, robots.txt rules may not apply." It "is not used to determine whether content may appear in Search"; "Please use OAI-SearchBot in robots.txt for managing Search opt outs".
- **OAI-AdsBot** visits only landing pages submitted as ads.
- Changes take effect slowly: "it can take ~24 hours from a site's robots.txt update for our systems to adjust". The UA may carry a `robots.txt` marker when it fetches robots.txt. IP lists: openai.com/searchbot.json, /gptbot.json, /chatgpt-user.json, /adsbot.json.

## Anthropic

[https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler] (the source's privacy.anthropic.com link redirects here)
- **ClaudeBot** collects web content "that could potentially contribute to their training"; blocking it means "future materials should be excluded ... from our AI model training datasets".
- **Claude-User** fetches for a user's request; blocking it "may reduce your site's visibility for user-directed web search".
- **Claude-SearchBot** indexes for search; blocking it "may reduce your site's visibility and accuracy in user search results".
- Anthropic supports "the non-standard Crawl-delay extension" (example `User-agent: ClaudeBot` with `Crawl-delay: 1`). Opt out "for every subdomain".
- Blocking IP addresses "may not work correctly or persistently guarantee an opt-out". IP list: claude.com/crawling/bots.json. The bots respect robots.txt and do not bypass CAPTCHAs.

## Google

[https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers]
- **Google-Extended** is a "standalone product token". It "doesn't have a separate HTTP request user agent string ... the robots.txt user-agent token is used in a control capacity."
- It governs whether crawled content "may be used for training" Gemini models "and for grounding (providing content from the Google Search index to the model at prompt time...)" in Gemini Apps and Grounding with Google Search on Vertex AI. So blocking it can affect live Gemini-app answers, not only training.
- It "does not impact a site's inclusion in Google Search nor is it used as a ranking signal in Google Search".

[https://developers.google.com/crawling/docs/crawlers-fetchers/google-user-triggered-fetchers]
- "Because the fetch was requested by a user, these fetchers generally ignore robots.txt rules."
- The list: Google-CWS, FeedFetcher-Google, Google-GeminiNotebook (its former agent Google-NotebookLM was "supported until August 2026"), Google-Agent, GoogleMessages, Google-Pinpoint, GoogleProducer, Google-Read-Aloud, Google-Site-Verification.
- **Google-Agent** is "used by agents hosted on Google infrastructure to navigate the web and perform actions upon user request".

## Perplexity

[https://docs.perplexity.ai/guides/bots]
- **PerplexityBot** is "designed to surface and link websites in search results on Perplexity ... It is not used to crawl content for AI foundation models."
- **Perplexity-User** serves user requests and "generally ignores robots.txt rules".
- Changes take "up to 24 hours".
- For a WAF, allow when the UA contains `PerplexityBot` or `Perplexity-User` **and** the source IP is in the published lists (perplexity.com/perplexitybot.json, perplexity-user.json).

## A purpose-specific robots.txt

[coreyhaines31/marketingskills, ai-seo] "Do not copy one blanket allowlist. Choose controls by documented purpose, then check WAF and CDN rules as well as `robots.txt`." The disallows show one publisher choice, not a recommendation:

```text
# Automatic search discovery
User-agent: Bingbot
User-agent: Googlebot
User-agent: OAI-SearchBot
User-agent: PerplexityBot
User-agent: Claude-SearchBot
Allow: /

# Potential model training (publisher choice shown as disallow)
User-agent: GPTBot
User-agent: ClaudeBot
Disallow: /

# Gemini model training and grounding (publisher choice shown as disallow)
User-agent: Google-Extended
Disallow: /
```

User-triggered fetchers (`ChatGPT-User`, `Claude-User`, `Perplexity-User`) are separate from automatic discovery; robots.txt rules may not apply to them (vendor quotes above). Anthropic's page instead says its bots honour robots.txt and that Claude-User "allows site owners to control which sites can be accessed through these user-initiated requests".

## How Google parses the file

[https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec]
- The crawler picks "the group with the most specific user agent"; other groups are ignored for it.
- Within a group, "the most specific rule based on the length of the rule path" wins; on a true tie, "the least restrictive rule".
- `crawl-delay` isn't supported (Anthropic honours it; Google ignores it).
- Google supports `user-agent`, `allow`, `disallow` and `sitemap`; rules other than `allow`, `disallow` and `user-agent` "are ignored by the robots.txt parser", so a `Content-Signal` line does nothing for Google.
- The file limit is 500 KiB. Any 4xx except 429 counts as "no robots.txt". On 5xx Google stops crawling for 12 hours while retrying, then uses the last cached copy for up to 30 days (no cached copy: no restrictions); after 30 days it treats the file as missing if the site is otherwise available, and keeps crawling stopped if the site has availability problems.

**Content Signals** (`Content-Signal: ai-train=no, search=yes, ai-input=yes`) are emitted and scored by [aeo.js], which attributes them to Cloudflare (not verified). No fetched Google, OpenAI, Anthropic or Perplexity page mentions them, and Google's parser ignores unknown fields. [coreyhaines31/marketingskills, ai-seo] calls robots.txt content-usage statements "an emerging convention". Treat the line as optional, not as a control.

## Check the firewall, not only the file

- Crawler access is page access, robots directives **and** firewall or bot-management rules together; request the page with representative crawler user agents. A crawler-specific block can be "a deliberate licensing or traffic-control decision". [freescan]
- "Audit what your CDN/WAF actually does to each user agent: many sites block them by default without anyone deciding to." [coreyhaines31/marketingskills, ai-seo]
- When an audit crawler of your own is blocked, report it and ask the owner to allowlist its user agent; never bypass. [openseo.so] Bot-detection bypass, identity switching and CAPTCHA solving are out of scope here.

### Check your own pages for crawler-only noindex

[coreyhaines31/marketingskills, ai-seo] (written for LinkedIn articles; it works on any URL you own or publish). It reads the robots meta tag and the `X-Robots-Tag` header on the final response per crawler. It checks your own content's headers; it is not a way to impersonate crawlers past a block.

```bash
URL=https://example.com/your-article-slug
for UA in Googlebot bingbot OAI-SearchBot; do
  echo "== $UA"
  curl -sIL -A "$UA" "$URL" | grep -iE '^(HTTP/|x-robots-tag)'
  curl -sL -A "$UA" "$URL" | grep -ioE '<meta[^>]+name="(robots|googlebot|bingbot)"[^>]*>'
done
```

The source says "An absent tag isn't proof it's indexed; confirm with a `site:` search." A positive matching result is useful evidence, but an absent result does not prove noindex or absence from Google's index: site: results are not exhaustive. For a verified owned site, follow up with URL Inspection rather than treating search absence as a diagnosis. [Google site operator](https://developers.google.com/search/docs/monitor-debug/search-operators/all-search-site); [search-console](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/search-console/SKILL.md)

## Errors in the sources

- [open-seo, ai-visibility-audit] says "blocking `GPTBot` or `Google-Extended` affects model training, not live answers." Google's page says Google-Extended also controls grounding in Gemini Apps (above). Its crawler list also omits Claude-SearchBot, Claude-User and Perplexity-User.
- [aeo.js] labels GPTBot "AI training & ChatGPT" and hints "Allow GPTBot in robots.txt: blanket disallow blocks ChatGPT crawling". OpenAI's page: GPTBot is training only; OAI-SearchBot controls ChatGPT search.
- [aeo.js] lists `Gemini-Deep-Research`; neither Google crawler page names it. Google's documented agent fetcher is Google-Agent.
- [aeo.js]'s robots generator still writes `Claude-Web` and `anthropic-ai`, which Anthropic's page no longer lists, and omits Claude-User and Claude-SearchBot.
- [aeo.js]'s "major AI bots allowed" check (GPTBot, ClaudeBot, Google-Extended, PerplexityBot) is three training or control tokens and one search bot. Its parser also treats a `Disallow: /` in any group (even `User-agent: BadBot`) as a blanket AI block and resets groups on blank lines, which Google's spec does not do. Don't copy its checks as rules.

## Prove it

For each bot in the purpose table, a request with its user agent through the production CDN gets the response your policy intends (200 for the search bots you allow); robots.txt names every search and training token you decided on, in groups Google's most-specific-group rule resolves as intended; the noindex loop shows no crawler-only noindex on pages you want cited; and nothing in the policy claims that blocking a training bot keeps or removes citations.
