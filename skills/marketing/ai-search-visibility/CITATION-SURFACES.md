# Citation surfaces off your site

The places besides your own site that answer engines read about you: third-party profiles, LinkedIn, YouTube, podcasts, other languages and markets, shopping feeds, and each engine's index. Sources: [coreyhaines31/marketingskills, ai-seo] (MIT; its multilingual and commerce checklists adapted there from Profound's MIT skills, the YouTube anatomy credited there to Ross Simmonds / Foundation Inc.), and [coreyhaines31/marketingskills, public-relations] for podcasts. Most of it is practitioner experience or dated vendor data, labelled as such. Earning press is [public-relations SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/public-relations/SKILL.md); social publishing is [social-media SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/social-media/SKILL.md).

**Contents:** [Make every profile say the same thing](#make-every-profile-say-the-same-thing) · [Positioning moves slowly](#positioning-moves-slowly) · [LinkedIn](#linkedin) · [YouTube and podcasts](#youtube-and-podcasts) · [Other languages and markets](#other-languages-and-markets) · [AI shopping surfaces](#ai-shopping-surfaces) · [Each engine's index](#each-engines-index) · [Prove it](#prove-it)

## Make every profile say the same thing

[coreyhaines31/marketingskills, ai-seo, positioning-and-consensus] "Models look for consensus." Your review-site, analyst, company-database, LinkedIn and partner-directory profiles should describe you with the same segment, category and differentiators as your About page.
- Fill in free profiles fully (what you do, who it's for, which industries), even on platforms you don't pay for.
- Review text matters as much as profile text; models read what customers say there.
- If the engine's fan-out queries run `site:` searches on review or analyst sites for your category ([PROMPT-RESEARCH.md](PROMPT-RESEARCH.md#chatgpts-own-fan-out-queries)), those profiles come before another page on your own site.
- Directory and listing work is [directory submissions](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/DIRECTORY-SUBMISSIONS.md); its link-spam limits are in [link rules](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/LINKS-AND-OUTREACH.md#what-google-calls-link-spam).

**Managing the "cons" others write.** If a listed con reinforces a weakness models already repeat, ask the publisher to use a different con that is also true and less central. "Never ask for negatives to be removed or for false claims." To repair a repeated weakness, address it in public with specifics from a real person (the source's anecdote: founder posts, real-timeline guides and a concrete "4 to 8 weeks" on an implementation page shifted it over 1.5 to 2 years).

**Head terms where incumbents are already chosen** (practitioner playbooks, "opinion, not tested"): run both a solution page and a buyer's guide; publish and promote earned third-party proof; occupy several places on the results page (video, creator coverage, review profiles, press); and in a "best X for Y" guide, name the leader first and show where you go further.

## Positioning moves slowly

[coreyhaines31/marketingskills, ai-seo] (practitioner experience, mainly one podcast episode; labelled anecdote by the source) A brand known for one segment for years doesn't become known for another because its pages change; repositioning can lose old-segment answers before it earns new ones, and an acquired brand often stops appearing once its pages fold into the parent. Before a repositioning, rebrand or merger:
1. Record a baseline for the old segment's prompts and the target segment's prompts.
2. Warn stakeholders a dip may happen (practitioner reports, not controlled data).
3. Move off-site signals first (profiles, reviews, press, analyst listings, partner pages), then stage the on-site rewrite.
4. Keep pages that still win old-segment prompts until the new association shows up in tracking.

Segment pages: one per core industry you actually serve, with real specifics; near-duplicates that swap the industry name are what the scaled-content policy targets ([CONTENT-BLOCKS.md](CONTENT-BLOCKS.md#by-content-type)).

## LinkedIn

[coreyhaines31/marketingskills, ai-seo, linkedin-ai-citations] Every figure here is a dated 2026 vendor or platform snapshot; check your own prompts.
- **Which surface, which engine:** the source reports ChatGPT shifting from Pulse articles to feed posts, Perplexity citing company pages most, Copilot citing LinkedIn heavily, Google's AI features citing posts, articles and company pages, and Gemini "almost never" citing LinkedIn. So publish both posts and long-form articles, keep the company page complete, and skip collaborative articles (`/advice/`).
- **Who can crawl it** (LinkedIn's robots.txt, checked by the source 2026-10-02): Googlebot, Bingbot, OAI-SearchBot and Claude-SearchBot allowed; GPTBot, ChatGPT-User, ClaudeBot, Claude-User, PerplexityBot, Perplexity-User, Google-Extended and CCBot blocked. Check your own articles for crawler-only noindex with the loop in [AI-CRAWLERS.md](AI-CRAWLERS.md#check-your-own-pages-for-crawler-only-noindex).
- **What gets cited** (independent data per the source): engagement and follower counts barely predict citation; original posts that teach something; consistent posting; recent content. A vendor model (Scrunch, ChatGPT, directional) found technical detail, named entities and a niche topic helped and Unicode bold and "link in comments" hurt the post's own citations. LinkedIn's own guide (March 2026) suggests articles of 800 to 1,200 words and posts of 200 to 300.
- **Mechanics:** a post's first words become its URL slug, so front-load the target phrase; structure articles like blog content.
- **Risks:** "No canonical control": publish on your site first, then post an adapted version or a summary that links back. LinkedIn decides indexing. By default, US members' content can be used to train LinkedIn and Microsoft models.

## YouTube and podcasts

[coreyhaines31/marketingskills, ai-seo, youtube-ai-citations] recommends working the surrounding text layer. The source and this file formerly said models cannot watch video; Gemini's [video-understanding documentation](https://ai.google.dev/gemini-api/docs/video-understanding) explicitly supports visual and audio streams, including public YouTube URL inputs. That capability does not establish a particular search product's citation mechanics. Keep the source's practical text checklist:
1. **The transcript:** answer questions in complete, liftable sentences; outline the key answers before recording; say the product name, the category and the entities out loud.
2. **Accurate captions:** upload cleaned captions or correct the auto-generated ones (product names spelled right).
3. **A question-shaped title** that front-loads the question or task.
4. **Chapters** titled by the sub-questions people ask.
5. **A structured description:** short summary, bulleted breakdown, resource links.
6. **A pinned comment** with the core answer in numbered steps and the key links.
7. **Thumbnail and engagement** for the click; the text layer earns the citation.

Post product demos publicly with keyword-first titles instead of behind a form. Making the video itself is [marketing-video SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/marketing-video/SKILL.md).

Podcasts work the same way: episodes get transcribed and show notes published. "Coach the guest to say the important things in liftable form: the company name next to the category ('we build X, the Y for Z'), and numbers spoken aloud." [coreyhaines31/marketingskills, public-relations] That transcripts get cited is the source's claim, not a measurement; event talks get the same advice [coreyhaines31/marketingskills, events] ([event-marketing SPEAKING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/event-marketing/SPEAKING.md), [public-relations PODCAST-PREP.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/public-relations/PODCAST-PREP.md)).

## Other languages and markets

[coreyhaines31/marketingskills, ai-seo, multilingual-and-commerce] The source cites Profound data (vendor, April 2026) that citation mixes shift with query language.
1. Treat language and country as separate dimensions: Spanish in Mexico, Spanish in Spain and English in Mexico are three configurations.
2. Build prompts from native-language demand (local research, local search terms, native speakers); don't translate the English list word for word.
3. Run each prompt on each target engine and classify cited sources ([VISIBILITY-AUDIT.md](VISIBILITY-AUDIT.md#read-the-citation-mix)).
4. Find the local source market: which local publishers, directories, review sites, communities and authorities recur per engine.
5. Audit local facts: prices and currency, availability, policies, legal claims, support hours, local entities. "A wrong local price is a critical error."
6. Separate three gaps: a **translation gap** (the page exists, not in this language), an **information gap** (the fact doesn't exist locally), an **entity gap** (local profiles describe you inconsistently).
7. Recommend local channels only where the local citation mix supports them.
8. Assign native-language review and a freshness owner per localized page.
9. Report each language, country and engine separately before rolling up.

Hebrew-language specifics are in [anti-slop-writing HEBREW.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/HEBREW.md).

## AI shopping surfaces

[coreyhaines31/marketingskills, ai-seo] Worth the effort only for categories they actually show; the source cites Profound tests (vendor, March 2026) where product category triggered ChatGPT Shopping more than purchase wording, and OpenAI hasn't published the trigger rules.

| Offering | Typical fit |
|---|---|
| Shippable consumer product, consumables | Strong; audit in full |
| Large equipment or vehicles | Test narrowly |
| Software, digital products, services, travel, financial products | Usually weak; put the effort into ordinary AI recommendations |
| Local-only offerings | Local surfaces and Business Profile |

When the fit is real, audit: canonical title and description, brand and identifiers (GTIN, MPN); category, attributes, variants and compatibility; images; price, currency, sale status and availability, and how fast changes propagate; shipping, returns and merchant policies; real reviews and ratings. Compare the feed, product page, structured data, merchant records and marketplace listings for conflicts and fix wrong data first. Track inclusion, being the headline merchant, and appearing among all offers separately. "Never fabricate reviews, ratings, availability, or discounts." Verify current merchant and feed requirements in each platform's documentation.

## Each engine's index

You can only be cited from an index that has you. The source's per-engine claims are mostly unsourced; what is and isn't verified:
- **Google AI Overviews and AI Mode** run on core Search ([CONTENT-BLOCKS.md](CONTENT-BLOCKS.md#googles-limits)); the SEO rules are [seo SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/SKILL.md).
- **ChatGPT search** needs OAI-SearchBot access (OpenAI's own page, [AI-CRAWLERS.md](AI-CRAWLERS.md#openai)).
- **Bing and Copilot:** the source says Copilot relies on Bing's index and recommends Bing Webmaster Tools and IndexNow (a published protocol, indexnow.org). No Bing doc was checked here. Its "sub-2-second load" threshold has no source; the speed thresholds with a source are web.dev's Core Web Vitals (LCP 2.5 s, INP 200 ms, CLS 0.1 at the 75th percentile, https://web.dev/articles/vitals), in [performance-and-caching SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/SKILL.md).
- **Claude:** the source's "Claude uses Brave Search as its search backend" appears in no Anthropic doc fetched; treat it as a third-party claim. Anthropic's documented controls are its three bots.
- **Perplexity:** the source's ranking internals (its own index plus Google's, curated domain lists, a time-decay algorithm, FAQ schema and PDF preferences) name no source; Perplexity's docs describe only PerplexityBot and Perplexity-User.

## Prove it

Every third-party profile you control states the same category, segment and differentiators as the About page; each LinkedIn article you rely on passes the noindex loop and exists first on your own site; each video has corrected captions, chapters by sub-question and a text summary; each market is reported separately with its own native prompts and audited local facts; and no surface plan rests on one of the unverified engine claims above.
