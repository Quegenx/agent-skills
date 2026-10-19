# Ad Creatives

One creative teaches nothing, so every test is a batch of 3 to 5 variants that each isolate a different angle or visual format, run in one ad set, and get judged on CPA, because CTR alone does not win. This file covers the creative loop for Meta (generate from the store listing, write the copy, build a variant batch, edit winners, push the images and ads to Meta) and competitor ad teardowns. Everything here comes from third-party UA skills [appeeky] built on the Appeeky App Ad Creatives API and its MCP tools (a paid service: an Appeeky API key, and the Pro plan for image generation), except where a Meta, TikTok or FTC rule is named or a line is tagged [coreyhaines31/marketingskills, ad-creative] (MIT, Copyright (c) 2025 Corey Haines). Campaign settings are in [META-ADS.md](META-ADS.md) and [TIKTOK-ADS.md](TIKTOK-ADS.md) (TikTok video formats and Spark Ads live there); spend and payback in [BUDGET-AND-ROAS.md](BUDGET-AND-ROAS.md); tracking in [ANALYTICS-AND-ATTRIBUTION.md](ANALYTICS-AND-ATTRIBUTION.md); Apple's ads and custom product pages in [APPLE-ADS.md](APPLE-ADS.md). Ad copy craft, hooks, static templates and text limits for other platforms (Google Search, LinkedIn, X) are in [ad-creative](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ad-creative/SKILL.md); creator and UGC programs in [creator-marketing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/creator-marketing/SKILL.md).

**Contents:** [Before generating](#before-generating) · [Generate a Meta creative](#generate-a-meta-creative) · [Meta static specs and copy](#meta-static-specs-and-copy) · [Creative variants](#creative-variants) · [Editing creatives](#editing-creatives) · [Push creatives to Meta](#push-creatives-to-meta) · [Competitor ad teardowns](#competitor-ad-teardowns) · [Prove it](#prove-it)

## Before generating

- **Measurement first.** "Generating before MMP: Can't optimize to revenue." Finish the MMP setup ([ANALYTICS-AND-ATTRIBUTION.md](ANALYTICS-AND-ATTRIBUTION.md)) before spending credits. [appeeky]
- **Read the app's context:** target CPA, LTV, geo, monthly budget, winning angles, plus positioning and value props from the app's marketing context. [appeeky]
- **Tell the user the credit cost** before any paid generation. [appeeky]
- **Why statics first.** "Meta static ads remain the fastest path from listing → live test. Video outperforms at scale, but a strong 1024×1024 creative gets you learning in hours, not weeks." [appeeky]

## Generate a Meta creative

- **Output:** a square Meta feed ad, a 1024×1024 PNG, plus paste-ready copy, from a real App Store or Google Play listing. Input: a store URL, or `platform` + `app_id`.
- **Modes:** `analyze` (copy and positioning only), `generate` (image), `edit` (iterate on a previous ad).

| Input | Default | Notes |
|---|---|---|
| App URL or `platform` + `app_id` | none | Required |
| Country | `us` | Store listing locale |
| Style | `ugc` | |
| Image preset | `person_holding_phone` | |
| Angle | Auto from listing | e.g. "problem-solution for busy founders" |
| Audience | From context doc | Overrides listing inference |
| Quality | `medium` | `low` / `medium` / `high` |

| Style | Tone | Best for |
|---|---|---|
| `ugc` | Casual, phone-in-hand, authentic | Consumer, lifestyle, social apps |
| `professional` | Clean, trust, premium | Finance, B2B, productivity |
| `problem_solution` | Pain → fix narrative | Direct response, utility |
| `before_after` | Transformation contrast | Beauty, fitness, editors |
| `lifestyle` | Aspirational context | Wellness, dating, travel |

| Preset | Visual | Pair with style |
|---|---|---|
| `branded_showcase` | Product-first, app UI hero | `professional`, launch |
| `person_holding_phone` | Hand + device mockup | `ugc`, `lifestyle` |
| `creator_testimonial` | Quote + face or avatar | `ugc`, social proof |
| `problem_solution_split` | Split pain/solution | `problem_solution`, `before_after` |
| `clean_app_store_mockup` | Minimal device frame | `professional`, premium |

| Campaign goal | Style | Preset |
|---|---|---|
| Cold install test | `ugc` | `person_holding_phone` |
| High-intent utility | `problem_solution` | `problem_solution_split` |
| Premium / subscription | `professional` | `clean_app_store_mockup` |
| Social proof push | `lifestyle` | `creator_testimonial` |
| Feature launch | `professional` | `branded_showcase` |

Override the matrix when the app's context documents winning formats.

### Workflow

1. **Analyze first (1 API credit).** Present `result.keyPoints` and have the user confirm or edit them before generating the image.

```
generate_app_ad_creative
  app_url: "https://apps.apple.com/us/app/id123456789"
  mode: "analyze"
  generate_image: false
```

```bash
POST /v1/app-ad-creatives/generate
Content-Type: application/json

{
  "appUrl": "https://apps.apple.com/us/app/id123456789",
  "mode": "analyze",
  "generateImage": false
}
```

2. **Generate.**

```
generate_app_ad_creative
  app_url: "https://apps.apple.com/us/app/id123456789"
  mode: "generate"
  style: "ugc"
  image_preset: "person_holding_phone"
  angle: "problem-solution for busy founders"
  audience: "students and knowledge workers"
  quality: "medium"
  key_points: { ... }   # optional: from confirmed analyze step
```

```bash
POST /v1/app-ad-creatives/generate

{
  "appUrl": "https://apps.apple.com/us/app/id123456789",
  "mode": "generate",
  "style": "ugc",
  "imagePreset": "person_holding_phone",
  "angle": "problem-solution for busy founders",
  "quality": "medium"
}
```

3. **Poll the job.** The call returns HTTP 202 with a `jobId`. Poll with MCP `get_app_ad_creative_job job_id: "<job-id>"` or REST `GET /v1/app-ad-creatives/jobs/:jobId` every 3 to 5 seconds: `queued` / `processing` → keep polling; `completed` → read `result`; `failed` → read `error`, then retry or adjust inputs.

- **Response fields:** `result.keyPoints`; `result.ad.imageUrl` (1024×1024 PNG); `result.ad.copy` with `primaryText`, `headline`, `description`, `callToAction`; `result.ad.creativeHeadline` / `creativeSubhead` (the on-image text).
- **Naming:** MCP is snake_case, REST is camelCase: `app_url`/`appUrl`, `generate_image`/`generateImage`, `image_preset`/`imagePreset`, `edit_instruction`/`editInstruction`, `previous_ad`/`previousAd`, `extra_screenshot_urls`/`extraScreenshotUrls`, `key_points`/`keyPoints`.

| Mode | API credits | Creative credits |
|---|---|---|
| `analyze` / copy-only | 1 | 0 |
| `generate` image `low` | 1 | 1 |
| `generate` image `medium` | 1 | 2 |
| `generate` image `high` | 1 | 5 |
| `edit` | 1 | 1 to 5 by quality |
| BYOK (header `X-OpenAI-Key`) | 1 | 0 |

| Error | Cause | Fix |
|---|---|---|
| `PRO_FEATURE` | Plan lacks image generation | Upgrade or use `analyze` only |
| `APP_NOT_FOUND` | Bad URL or wrong country | Verify the store URL and `country` |
| `OPENAI_NOT_CONFIGURED` | Server-side AI not set | BYOK header or contact support |
| Job timeout | Heavy queue | Retry; lower `quality` |
| Generic copy | Weak listing | Enrich the store description; pass `angle` + `audience` |
| Policy risk | Health or finance claims | Soften claims; add disclaimers in copy |

- **Mistakes:** skipping analyze (a misaligned angle wastes credits: always confirm `keyPoints` and pass them as `key_points`); the same preset for every test (no learning signal: rotate style × preset); the app name as headline (low CTR on cold traffic: lead with the benefit); ignoring character limits (a truncated hook kills CTR); one creative per ad set (minimum 3 to 5 variants).

## Meta static specs and copy

| Element | Spec | Notes |
|---|---|---|
| Image size | 1024×1024 (Appeeky API output) | Meta's Feed image recommendation is ratio 4:5 at 1440 x 1800 pixels, minimum width 600 pixels, maximum file size 30 MB (https://www.facebook.com/business/ads-guide/update/image); crop or regenerate for it |
| Primary text | Meta Feed: "50-150 characters" | The hook must land in the first line |
| Headline | Meta Feed: "27 characters" | Appears below the image |
| Description | Not in Meta's Feed text recommendations | [appeeky] 30 chars (optional), often hidden on mobile |
| CTA | `INSTALL_MOBILE_APP` | Set in Ads Manager or the API |
| Text on image | Meta's best practices: "a large enough type size and a contrasting hue", "Don't obstruct the visuals", "Don't communicate too many messages", "Stay within the safe zone" | Meta's text-overlay page states no percentage limit (https://www.facebook.com/business/help/980593475366490) |

These rows said "Up to 125 chars visible before 'See more'", "40 chars recommended", "30 chars (optional)" and "Text on image ≤ 20% of area (guideline): Heavy text can limit delivery" [appeeky]; Meta's current specs above replace them.

- **Reels and Stories (9:16).** Meta's Facebook Reels spec: 9:16 at 1440 x 2560 pixels, "Primary Text: 40 characters", "Headline Text: 55 characters", and "Consider leaving roughly 14% of the top, 35% of the bottom, and 6% on each side of your asset free from text, logos, or other key creative elements" (https://www.facebook.com/business/ads-guide/update/video/facebook-facebook-reels). Instagram Reels: "Primary text: 44 characters" (https://www.facebook.com/business/ads-guide/update/video/instagram-reels/traffic). For Reels ads with disclaimers, "leave the bottom 40% of your ad free from text, logos and other key creative elements"; for Instagram Feed in 1:1 or 4:5, keep the bottom and side edges free; Ads Manager's **Safe zone guardrail** toggle shows the area (https://www.facebook.com/business/help/980593475366490).

- **Primary text structure:** "Line 1: Hook (pain or curiosity), must work standalone / Line 2-3: Proof or mechanism / Line 4: Soft CTA + social proof if available".
- **Hook patterns:** problem callout "Still juggling 4 apps to stay organized?"; outcome promise "Plan your week in 5 minutes."; social proof "Join 2M+ users who..."; question "What if your notes actually stuck?".
- **Headline rules:** lead with the benefit, not the app name; never repeat the primary-text hook verbatim [appeeky]. Length: Meta's Feed recommendation is 27 characters (above); [appeeky] said ≤ 40.
- **CTA by monetization:** free install → Install Now; freemium → Install Now or Learn More; subscription → Install Now (trial in the copy).
- **Quality check:** hook visible in the first line; on-image text readable at thumbnail size; "No unsubstantiated claims (Apple/Google policy)"; rating and review claims match the live listing.
- **Testimonials and faces are real or labelled.** The FTC Rule on Consumer Reviews and Testimonials (16 CFR Part 465, in effect October 21, 2024) prohibits testimonials "by someone who does not exist, such as AI-generated fake reviews, or who did not have actual experience"; it has "no blanket prohibition on the use of AI-generated avatars", but under the Endorsement Guides an endorsement shown with "the image or likeness of a person other than the actual endorser is deceptive if it misrepresents a material attribute" (16 CFR 255.1(g); https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers). So a `creator_testimonial` image quotes a real user who agreed to it, and a staged scene is labelled a dramatization. Full disclosure rules: [creator-marketing DISCLOSURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/creator-marketing/DISCLOSURE.md).
- **Pre-launch checklist:** Meta app ID linked in Events Manager; iOS AEM and SKAN expectations set with the user; the user approved the copy before upload.
- **Static benchmarks:** install rate (click → install) weak < 8%, OK 8 to 15%, strong > 15%; frequency before fatigue OK at 2.5 to 3.5, refresh at 3+; "CTR alone does not win".
- **Video for Meta:** vertical 9:16, 15 to 30 s; 3 to 5 primary text hooks [appeeky]; Meta recommends 1440 x 2560 for Reels (above). Meta's Advantage+ app campaigns accept up to 50 images, videos, playables or Instant Experiences per upload and up to 5 texts and headlines ([META-ADS.md](META-ADS.md#advantage-app-campaigns)).

## Creative variants

- **Batch of 3 to 5** distinct statics from one listing; each variant isolates a different angle and/or visual format (style + preset). "One creative teaches you nothing."

| Monthly Meta budget | Variants | Daily budget | Test length |
|---|---|---|---|
| < $1.5K | 3 | $30 to 50 | 5 to 7 days |
| $1.5K to 10K | 5 | $50 to 100 | 4 to 5 days |
| $10K+ | 5 to 8 | $100+ | 3 to 4 days |

Each ad needs ~2× target CPA in spend before it can be killed, so smaller budgets get fewer variants. [coreyhaines31/marketingskills, ad-creative] sets a looser floor, "Allow 1,000+ impressions before judging"; both are practitioner numbers.

| Variant | Style / preset | Angle |
|---|---|---|
| A Problem | `problem_solution` / `problem_solution_split` | Pain → fix |
| B UGC | `ugc` / `person_holding_phone` | Relatable moment |
| C Premium | `professional` / `clean_app_store_mockup` | Trust + quality |
| D Transform | `before_after` / `problem_solution_split` | Transformation |
| E Social proof | `lifestyle` / `creator_testimonial` | Quote + outcome |

- **Minimal 3-variant batch:** A `ugc`/`person_holding_phone` (core pain); B `problem_solution`/`problem_solution_split` (mechanism); C `professional`/`branded_showcase` (premium or feature-led).
- **Angle stems:** pain agitation "For [persona] tired of [pain]…"; outcome "Get [result] in [timeframe]"; mechanism "The [category] app that [unique how]"; social proof "[N] users / [rating] stars" (only if true on the listing); contrarian "Stop [common bad habit]"; seasonal "[Event] is coming: [benefit]".
- **Run the batch.** Analyze once and reuse the confirmed `keyPoints` as `key_points` on every variant job; launch one job per variant in parallel and poll each. "If one job fails, retry that variant only: do not restart the full batch."
- **Test in ONE ad set** for a fair auction: "Do not split variants across ad sets in the first test". Ad set budget with equal delivery (CBO optional after a winner); optimization Purchase or Subscribe; Advantage+ placements ON; Broad audience.
- **Credits:** 3 variants at medium = 6 creative credits; 5 at medium = 10; 5 at high = 25; plus 1 API credit for analyze.
- **Naming:** `[App] - [Geo] - Var[A-E] - [AngleSlug] - [YYYYMMDD]`, e.g. `FocusApp - US - VarB - UGC - 20250629`.

| In-test signal | Decision |
|---|---|
| Spend > 2× target CPA, 0 conversions | Pause |
| CPA < target after 15+ conversions | Winner candidate |
| CTR < 0.5% after 5K impressions | Likely hook failure |
| One ad > 70% of spend | Still wait for CPA |
| Frequency > 3 on the winner | Prepare an edit |

"Strong CTR with weak qualified conversion is a reason to examine the promise and landing-page continuity, not proof of a winning headline" [coreyhaines31/marketingskills, ad-creative]; for an app the landing page is the store listing and onboarding.

| Batch benchmark | Weak | Healthy |
|---|---|---|
| Best ad CTR | All < 0.8% | Winner > 1.2% |
| CPA spread | All within 10% | Winner 20%+ better |
| Spend distribution | One ad 90%+ | Top ad 40 to 60% |
| Time to decision | > 7 days | 4 to 5 days at $50/day |

- **Differentiation check:** no two variants share a hook line; at least 2 different presets.
- **Mistakes:** the same angle in different colors (a false A/B); stopping at 24 hours; 8+ variants on $30/day; scaling the whole batch.

## Editing creatives

- **Edit or regenerate.** Edit for a bigger headline, background or contrast, a minor layout change, or localized on-image text. Generate anew for a new hook or angle, a different preset, a structural format change, or a failed concept.
- **`previous_ad`** comes from `get_app_ad_creative_job` → `result.ad`, with camelCase fields `style`, `imagePreset`, `creativeHeadline`, `creativeSubhead`, `imageUrl`. Quality drops without `imageUrl`.
- **Instruction template:** "Change [element] to [target state]. Keep [what must not change]." Good: "Make the on-image headline 30% larger, bold white text on navy background. Keep phone mockup position unchanged." Bad: "Make it better", "More professional", "Copy competitor X".

```
generate_app_ad_creative
  app_url: "https://apps.apple.com/us/app/id123456789"
  mode: "edit"
  edit_instruction: "Make headline bigger, navy background, more contrast on CTA text"
  previous_ad: {
    "style": "ugc",
    "imagePreset": "person_holding_phone",
    "creativeHeadline": "Plan your week in 5 min",
    "creativeSubhead": "The focus app that sticks",
    "imageUrl": "https://..."
  }
  quality: "medium"
```

- **Edits that fail:** "Make it viral"; changing the aspect ratio ("API outputs 1024×1024: Crop in design tool"); adding video motion (the API is static); copying a competitor's exact layout (IP and policy risk); fixing a fundamentally weak hook.
- **Iterating a winner (A′):** hook (headline text only), visual (background or contrast), proof (rating or user count), localize (an EU geo test). "Rule: One change per edit job."
- **Copy-only refresh:** `mode: "analyze"`, `generate_image: false`, with a new `angle`.
- **After an edit,** re-upload the image to Meta with `meta_ads_upload_ad_image_from_url`, create a new ad with the new image hash, and pause the old ad (never delete it: that loses learning history).
- **Expected impact:** a contrast edit +10 to 25% CTR if the original was low contrast; a hook-only edit +15 to 40% CTR if the new hook is stronger. "After 3 edits, re-generate new angle."
- **Budget:** a typical session of 2 to 3 edits at medium = 4 to 6 creative credits.
- **Edit winners only:** pause losers at 2× CPA instead of editing them.

## Push creatives to Meta

- **Before pushing:** `meta_ads_credentials_status` (if not connected, `meta_ads_oauth_start`); set a default ad account with `meta_ads_list_ad_accounts` → `meta_ads_set_default_ad_account`; a Page via `meta_ads_list_pages`; the app in Events Manager; the MMP live.
- **Pick the path by monetization.** Subscription or IAP → the manual path with `OFFSITE_CONVERSIONS` + `custom_event_type` ("Do not use the one-shot default"). Games or ad-supported → the one-shot path is fine, with `optimization_goal: "APP_INSTALLS"` passed explicitly. "The one-shot tool does not accept `custom_event_type` on `promoted_object`."
- **One-shot path:** generate → `meta_ads_upload_ad_image_from_url` (returns `image_hash`/`imageHash`) → `meta_ads_list_advertisable_applications` + `meta_ads_list_pages` → `meta_ads_create_app_install_draft` (campaign + ad set + creative + ad) → user review.
- **Manual path** (one shared ad set for several variants): generate → upload the image → `meta_ads_create_campaign` → `meta_ads_create_adset` (`destination_type` APP) → `meta_ads_create_creative` (`format` app_install, `name` required) → `meta_ads_create_ad` → review. Campaign and ad set calls are in [META-ADS.md](META-ADS.md#campaign-setup).

```
meta_ads_upload_ad_image_from_url
  ad_account_id: "act_1234567890"
  image_url: "https://cdn.appeeky.com/..."
```

Upload errors: invalid URL (the CDN URL must be public); account mismatch; token expired (re-run OAuth).

```
meta_ads_create_creative
  ad_account_id: "act_1234567890"
  format: "app_install"
  name: "FocusApp - VarA - Problem"
  page_id: "<facebook-page-id>"
  link_url: "https://apps.apple.com/us/app/id123456789"
  message: "<primaryText from Appeeky>"
  headline: "<headline from Appeeky>"
  description: "<description from Appeeky>"
  image_hash: "<from step 2>"
  call_to_action_type: "INSTALL_MOBILE_APP"
```

- **`name` is required.** The default `format` is `"link"`: set `"app_install"` for store-install ads.
- **Field mapping:** `copy.primaryText` → `message`; `copy.headline` → `headline`; `copy.description` → `description`; `copy.callToAction` → `call_to_action_type`; `imageUrl` → upload → `image_hash`.

```
meta_ads_create_ad
  ad_account_id: "act_1234567890"
  adset_id: "<adset-id>"
  creative_id: "<creative-id>"
  name: "FocusApp - VarA - Problem - 20250629"
  status: "PAUSED"
```

- **Activate only after the user confirms,** in the order ad → ad set → campaign. On iOS 14+, AEM and SKAN report late: trust the MMP and "Do not pause winners at 24h on iOS alone".
- **Credits:** writes cost 2 API credits each; a 5-variant batch (5 uploads, 1 campaign, 1 ad set, 5 creatives, 5 ads) contains 17 writes, so the source's stated two-credit-per-write assumption gives 34 API credits. The source said "~(2 × 12) = ~24 API credits"; this corrects that arithmetic, not Appeeky's current billing or whether each upload is billable. [appeeky]
- **REST.** Base `https://api.appeeky.com/v1/connect/meta-ads/`. MCP tools hit un-nested paths with `ad_account_id`; nested aliases exist. `meta_ads_create_campaign` → `POST /campaigns` or `POST /ad-accounts/:adAccountId/campaigns`; `meta_ads_create_adset` → `POST /adsets`; `meta_ads_create_creative` → `POST /creatives`; `meta_ads_upload_ad_image_from_url` → `POST /adimages/from-url`; `meta_ads_create_app_install_draft` → `POST /app-install-drafts`.

| Error | Fix |
|---|---|
| No Page | Connect a Page in Business Settings |
| Invalid app link | Full App Store or Play URL |
| `application_id` invalid | Add the app in Events Manager |
| Creative rejected (content or policy) | Edit the creative |
| Budget too low | Raise `daily_budget_minor` |

- **Mistakes:** a separate ad set per variant on day 1; the wrong `object_store_url`; skipping the image re-upload after an edit; no naming convention.

## Competitor ad teardowns

- **What the Meta Ad Library shows:** active formats, hooks and angles, long-running ads (a profit proxy), platform mix, CTA and copy structure. **What it doesn't:** exact spend or ROAS, internal winners, full-funnel conversion rate, targeting details (limited). "Long-running active ads (30+ days) are the strongest signal".
- **Tools:** `meta_app_ad_intelligence` (by competitor App Store or Play ID), `meta_ads_search` (keyword or brand), `meta_ads_page_ads` (Facebook Page ID). Access needs the Appeeky API key; `X-Meta-Ad-Library-Token` is optional.

- **Queries:** use the user's actual permitted competitor scope rather than the source's fixed real-brand example/app IDs. `meta_app_ad_intelligence` takes `app_id`, `platform: "apple"`, `country: "us"`, `status: "ACTIVE"`, `media_type: "ALL"`, `limit: 25`; the Play variant uses `platform: "google"`, `lang: "en"`, and `query` can override the search. `meta_ads_search` takes `query`, `countries: "US"`, `status: "ACTIVE"`, `media_type: "ALL"`, `limit: 25`; `meta_ads_page_ads` takes `page_id`, countries, status and limit. Paginate with `after`. [appeeky]
- **REST routes:** `GET /v1/apps/:id/ad-intelligence`, `GET /v1/ads/meta/search`, `GET /v1/ads/meta/pages/:pageId/ads`, with the source's platform/country/status/query and pagination inputs, `Authorization: Bearer <appeeky-key>` and optional `X-Meta-Ad-Library-Token`. [appeeky]
- **Analyze the top 10 to 15 ads:** hook, format, angle, visual, CTA, runtime (`ad_delivery_start_time` to today), platforms, seasonality; cluster them into 3 to 5 patterns.

| Hook type | Signal words |
|---|---|
| Problem | "Tired of", "Still", "Can't" |
| Outcome | "Get", "Finally", "In X days" |
| Social proof | "Join", "million", "#1" |
| Curiosity | "This", "Why", "Secret" |
| Identity | "For [persona]" |
| Offer | "Free", "Trial", "% off" |

| Ad age | Reading |
|---|---|
| < 7 days | Testing |
| 7 to 30 days | Promising |
| 30 to 90 days | Likely working |
| 90+ days | Core evergreen |

- **Weigh a concept by its evidence** [coreyhaines31/marketingskills, ad-creative]: 1 "Your own account: a converting ad with the same angle/segment"; 2 "Your customers verbatim: recurring review/call language"; 3 "Competitor creative running 60+ days (presumed working)", "adapt the angle, never the ad"; 4 organic engagement in the niche; 5 a cross-niche pattern; 6 "Team hunch, no external signal", "low-fi test or drop". A competitor teardown is tier 3, below your own account and your customers' words.

- **TikTok:** "No TikTok Ad Library API in Appeeky yet": use TikTok Creative Center → Top Ads by industry, and search `#[competitor]`. For TikTok creative research, save 10 competitor ads ([TIKTOK-ADS.md](TIKTOK-ADS.md#creative-strategy)).
- **Ethics:** take inspiration from format and structure, never copy exact copy or visuals; paraphrase hooks; internal use only; label competitor ads with their source.
- **Mistakes:** verbatim hooks; looking at inactive ads only (filter `ACTIVE`); one competitor only (compare 2 to 3); ignoring ad age.

## Prove it

- Every generation was preceded by an `analyze` call whose `keyPoints` the user confirmed, and the user was told the credit cost first.
- The batch has 3 to 5 variants (sized to budget), no two share a hook line, at least 2 presets differ, and all run in one ad set.
- Headlines lead with a benefit and fit Meta's placement recommendation (27 characters Feed, 55 Reels), the hook sits in the first line of primary text (Meta Feed recommends 50 to 150 characters, Reels 40 to 44), no text, logo or CTA sits in the 9:16 safe-zone margins, and every rating or user-count claim matches the live listing.
- Each Meta creative was created with `format: "app_install"`, a `name`, an `image_hash` from `meta_ads_upload_ad_image_from_url`, and `call_to_action_type: "INSTALL_MOBILE_APP"`; every ad was created `PAUSED`.
- Subscription and IAP apps went through the manual path with `custom_event_type` set, never `meta_ads_create_app_install_draft`.
- After an edit, the new image was re-uploaded, a new ad created, and the old ad paused, not deleted.
- Competitor teardowns used `status: "ACTIVE"` ads from 2 to 3 competitors, weighted by ad age, and paraphrased every hook.
