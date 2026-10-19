# TikTok Ads

TikTok app ads run under the App Promotion objective. The optimization event (Purchase or Subscribe, never install-only for subscription apps) must reach TikTok Events Manager through a mobile measurement partner (MMP), Spark Ads (organic posts run as ads) are the default format for app install tests, and on iOS 14.5+ campaigns need a dedicated campaign slot and enough daily installs for SKAdNetwork to release conversion data. Bullets tagged [appeeky] come from third-party UA skills built on the Appeeky MCP and REST API (a paid service that needs an Appeeky API key); bullets tagged [coreyhaines31/marketingskills, <skill>] come from that MIT-licensed practitioner repo and [lightreel] from lightreel.ai's observational blog (paraphrased; one-week samples, not controlled tests); untagged facts come from TikTok's own help center. Where the two disagree, both are stated. Meta is in [META-ADS.md](META-ADS.md), creative tooling and competitor teardowns in [AD-CREATIVES.md](AD-CREATIVES.md), cross-channel spend in [BUDGET-AND-ROAS.md](BUDGET-AND-ROAS.md), MMPs and SKAdNetwork in [ANALYTICS-AND-ATTRIBUTION.md](ANALYTICS-AND-ATTRIBUTION.md), Apple's ads in [APPLE-ADS.md](APPLE-ADS.md).

**Contents:** [App Promotion objective](#app-promotion-objective) · [Prerequisites and gates](#prerequisites-and-gates) · [Campaign setup](#campaign-setup) · [Bidding, budget and learning](#bidding-budget-and-learning) · [iOS 14.5+ dedicated campaigns](#ios-145-dedicated-campaigns) · [Creative strategy](#creative-strategy) · [Spark Ads](#spark-ads) · [Audits](#audits) · [Appeeky MCP tools](#appeeky-mcp-tools) · [Prove it](#prove-it)

## App Promotion objective

- **App install and app conversion campaigns are consolidated** under App Promotion, which supports App Install and App Retargeting.
- **App Install** sends people to the Google Play or App Store download page. Optimization goals: Click, Install, In-app event (AEO), Value.
- **App Retargeting** targets people who already installed the app. Goals: In-app event (AEO), Value. Publish via App Promotion > App retargeting with a Customer File or App Activity custom audience. For Sales or catalog retargeting, don't turn on the iOS dedicated campaign toggle.
- **Setup path:** Ads Manager > Create ad > App Promotion > installs or retarget > select app > audience > budget and optimization goal > create ads. Set up event tracking for the app first.
- **Supported AEO in-app events:** Achieve Level, Add Payment Info, Add to Wishlist, Checkout, Complete Tutorial, Create Group, Create Role, Generate Lead, In-App Ad Click, In-App Ad Impression, Add To Cart, Join Group, Launch App, Loan Apply/Approval/Disbursal, Login, Purchase, Rate, Registration, Search, Spend Credit, Start Trial, Subscribe, Unlock Achievement, View Content.

## Prerequisites and gates

All [appeeky].

- **Start from the app's ads context:** target CPA, LTV, geo, monthly budget and cap, winning angles.
- **MMP connected to TikTok Events Manager:** Adjust, AppsFlyer, Branch or Singular.
- **Hard gates:** MMP live with events verified; Purchase or Subscribe event in Events Manager; target CPA < LTV; 6+ creatives; Spark codes obtained. "Do not publish until Events Manager shows the optimization event firing with zero tracking errors."
- **Before the first test:** start iOS-only if budget is under $3K per month; store rating 4.0+ and screenshots that match the ad's promise; 6 Spark-ready videos.

| Tracking error | Fix |
|---|---|
| Event not found | Re-sync MMP → TikTok in Events Manager |
| Event volume too low | Wait, or send via MMP debug |
| App ID mismatch | Verify bundle ID / package name |

## Campaign setup

All [appeeky] unless marked otherwise.

- **Structure:** 1 campaign → 1 ad group → 6+ ads, with custom (manual) creative selection, NOT automatic. Smart+ on; $50/day; US only; TikTok placement only ("Pangle/Lemon8 dilute native creative performance").
- **Starting benchmarks:** $50 test budget, then +20% per day until CPA is 15%+ above target; geo US, then CA, UK, AU after 7+ stable days; never install-only optimization for subscription apps; refresh the batch every 3 to 7 days; 48 hour review window.

### Campaign

- **UI:** Advertising objective App promotion (Conversion category); campaign type App install; Smart+ On; name `[AppName] - App Install - US Test`; CBO on if prompted; daily budget $50 USD; App Profile Page on or off.

```
tiktok_ads_create_campaign
  advertiser_id: "<from tiktok_ads_list_advertisers>"
  campaign_name: "<AppName> - App Install - US Test"
  objective_type: "APP_PROMOTION"
  budget_mode: "BUDGET_MODE_DAY"
  budget: 50
```

- **Pause:** `tiktok_ads_update_campaign_status campaign_id operation_status: "DISABLE"`. **Publish:** `operation_status: "ENABLE"`.

### Ad group

- **UI:** name `US - Purchase Opt - TikTok Only`; optimization location App; optimization event Purchase or Subscribe (NOT install); destination Apple App Store or Google Play; Custom Product Page off; location US only; Manual placement with TikTok on (including search), Lemon8 off, Pangle off; audience automatic; age 18 to 24 … 55+; gender all; schedule continuous; billing oCPM.
- **Placement conflict.** [appeeky]: "Automatic placement saves 10-15% CPM by including Pangle inventory, but Pangle users behave differently from TikTok feed users", so it turns Pangle off. TikTok's AEO setup guide uses automatic placement, which includes TikTok and TikTok Ad Network (formerly Pangle), and suggests Automatic Targeting. Confirm in the current docs.

```
tiktok_ads_create_adgroup
  advertiser_id: "<id>"
  campaign_id: "<id>"
  adgroup_name: "US - Purchase Opt - TikTok Only"
  budget: 50
  budget_mode: "BUDGET_MODE_DAY"
  billing_event: "OCPM"
  optimization_goal: "IN_APP_EVENT"
  schedule_start_time: "2026-08-22 12:00:00"
  schedule_type: "SCHEDULE_FROM_NOW"
  placements: "PLACEMENT_TIKTOK"
  location_ids: "6252001"
  payload:
    promotion_type: "APP_INSTALL"
    placement_type: "PLACEMENT_TYPE_NORMAL"
```

- **`schedule_start_time` is required** (TikTok local datetime). `placements` and `location_ids` are comma-separated strings, not arrays. Verify the US `location_ids` with a TikTok API geo lookup: IDs can change. Extra TikTok fields go in `payload`.

### Ads

- **UI:** creative selection Custom/manual; format Spark Ads; at least 6 variants A/A′/B/B′/C/C′; identity from the posting account; CTA Install now or Go to App Store; 1 to 2 selling points optional. The `tiktok_ads_create_ad` call is in [Spark Ads](#spark-ads).

### Setup rubric and launch

- **Rubric:** 10 items scored 0 to 2, minimum 16/20 to publish: MMP verified, Purchase/Subscribe, 6+ Spark custom, TikTok-only, US, $50/day, 0 tracking errors, Smart+, 1/1 structure, permitted spam moderation (never fabricated engagement or suppression of genuine criticism).
- **After launch:** check once at 24 and 48 hours; audit at 48 hours; plan the refresh for days 5 to 7; monitor with `tiktok_ads_performance advertiser_id level: "ad" days: 2`.

## Bidding, budget and learning

- **Budget conflict.** TikTok's AEO guide: daily budget ≥ 20× historic CPA for upper and mid-funnel events, ≥ 10× historic CPA for lower-funnel events. [appeeky] starts at a flat $50/day across 6 ads. Confirm in the current docs.
- **Bid strategies (TikTok):** Target Cost per Result (bid from the historical event CPA) or Maximum Results.
- **Learning phase (TikTok).** Events become available for AEO after one conversion, but "let an AEO campaign run for some days before making significant changes to the bid, budget, or creatives".
- **Budget math at $50/day × 6 ads** [appeeky]: 24 h ~$50 (~$8 per ad, observe only); 48 h ~$100 (~$17 per ad, first audit); 7 days ~$350 (~$58 per ad). The setup skill's design table also says "~$100 per ad over 48h", which contradicts its own budget math; the audit skill uses ~$17 per ad over 48 hours.
- **Economics** [appeeky]: a learning tax of the first $300 to 500; net margin 30 to 50% after store fees and ad spend; ~1% destination CTR is healthy.

## iOS 14.5+ dedicated campaigns

- **Quota.** "You can only have 15 dedicated campaign IDs for each iOS app", with 5 ad groups per campaign. Slot statuses: Available campaigns / Campaign in use / Available after reset. Paused or deleted campaigns need 72 hours to be released; a campaign that runs out of budget or expires stays in use. One TikTok best-practice page instead says standalone TikTok Ad Network app install campaigns "will count towards the 11 campaign limit"; confirm in the current docs.
- **Requirements.** An MMP that supports SKAdNetwork and a verified app. Dedicated campaigns support App promotion (App install) or Product sales (Catalog). Split test is available for up to 2 dedicated campaigns, counting toward the quota.
- **Without a dedicated campaign** you can only target up to iOS 14.4. The Traffic objective delivers to iOS 14.5+ without one, but with incomplete conversion data.
- **Volume floor.** iOS 14.5+ AEO campaigns should return "at least 90 daily app installs" or SKAdNetwork may withhold conversion data, reported as Null Conversions. [appeeky]: SKAN conversions are often 0 early on iOS, which is normal; trust the MMP's CPA.
- **Real-time conversion reporting** (updated August 2026): real-time conversions for iOS 14.5+ campaigns, supporting Target Cost per Result and Target ROAS, and "Unlimited iOS campaign quota when you opt-out of SKAN reporting". Opt out by deselecting the SKAN attribution toggle; the app then shows no SKAN data in Ads Manager or MMP reports.
- **Use the existing Ads Manager account** for dedicated campaigns: historical data helps.

## Creative strategy

All [appeeky].

- **Principles:** copy what works, differentiate the twist; show the app on screen 50%+ of the runtime; native beats polished; one hook per video; 3 formats × 2 variations = 6 ads; 9:16 vertical, 15 to 30 s; "Captions always on: 80%+ watch muted".
- **The 6-ad matrix:** A/A′ (format 1), B/B′ (format 2), C/C′ (format 3, a wildcard or competitor-inspired). "A and A′ differ only in the first 2 seconds (hook text/voiceover). Same format, same demo, same length." The two hooks should be different reasons to keep watching (for one product: context switching, ticket-writing time, flow state), not synonyms [lightreel].
- **App screen time conflict.** The 50%+ screen rule is [appeeky]. [lightreel] observed the opposite on Instagram: "The app screen is moving later. Several successful app Reels hold the interface until the viewer understands the emotional or practical problem", and "Show the experience, not the interface"; its clipping post reports that operators saw "stronger conversion when the app was explicitly introduced early". Lightreel's posts are one-week observational samples; test both.
- **More from [lightreel]:** brief order, matched before/after frames and app-video structure are in [creator-marketing UGC-HOOKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/creator-marketing/UGC-HOOKS.md) and [creator-marketing UGC-FORMATS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/creator-marketing/UGC-FORMATS.md#app-videos).
- **Length conflict.** 15 to 30 s is [appeeky]'s paid test length; [lightreel] found 40 to 75 s talking-head videos "most repeatable" in organic feeds. Different contexts.
- **The strongest app shape** [lightreel]: human use case → fast screen proof → product name. Make the CTA match activation (invite a friend, create an event, log a meal, build a profile); end cards that remove friction ("Free barcode scanning", "No ads", "No account"); put trust assets (App Store "App of the Day", reviews, real data) where viewers need reassurance. Organic hook libraries and formats: [creator-marketing UGC-HOOKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/creator-marketing/UGC-HOOKS.md) and [creator-marketing UGC-FORMATS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/creator-marketing/UGC-FORMATS.md).

### TikTok's In-Feed specs

From TikTok's Auction In-Feed spec (https://ads.tiktok.com/help/article?aid=10002742) unless marked (the same limits beside the other platforms' are in [ad-creative PLATFORM-SPECS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ad-creative/PLATFORM-SPECS.md#tiktok)):

- **Video:** 9:16 at least 540 x 960, 16:9 at least 960 x 540, 1:1 at least 640 x 640; up to 10 minutes; up to 500 MB; bitrate "More than or equal to 516 kbps".
- **Ad captions** (non-Spark) are "Displayed in white with a uniform font that can't be customized" and do "not support any clickable links, symbols (@), or hashtags". Keep them within 100 characters (50 in Chinese, Japanese or Korean) "to avoid being covered by See more"; emojis and "{ }" are not supported. A Spark ad's caption comes from the organic post (TikTok's Reservation In-Feed spec; the 100/50 limit, emoji and "{ }" rules are from that page, not aid=10002742).
- **Account name:** one line, "a maximum of 10 characters (Chinese, Japanese, and Korean) or 20 characters in other languages"; for app ads the app name is "automatically extracted from the App Store or Google Play". Profile photo 98 x 98 px, under 50 KB, key element inside the central 66 x 66 px.
- **Safe zone:** no fixed margins. "The safe zone size is determined by the dimension (vertical, horizontal, or square), ad caption length, and any additional formats used"; download TikTok's safe zone files (standard, with anchor, and Arabic RTL versions) and lay the overlay on every export.
- **AI-generated content:** "Completely AI-generated or significantly AI-modified ads require disclosure"; non-Spark ads have the toggle "This ad contains AI-generated content", and Spark ads follow the Community Guidelines AI labelling (TikTok's add-disclaimers-to-ads page and its misleading-and-false-content ad policy).

### Formats

| Format | Fits | Shape |
|---|---|---|
| 1 Story + Visual Transformation | Beauty, fitness, productivity, habit, wellness | 0 to 2 s hook text; 2 to 8 s relatable problem; 8 to 20 s app demo or transformation; 20 to 25 s result + soft CTA; end on app name + "available on App Store". Hooks: "this is your sign to [desired outcome]", "POV: you finally [solved problem]" |
| 2 Before vs After split | Photo editors, makeup, fitness, finance, style | Before 3 to 5 s, after 3 to 5 s, fast cuts |
| 3 Tutorial | Utility, learning, niche | "Stop scrolling if you [persona trait]", ≤ 3 steps of screen recording, optional face cam, end card |
| 4 Reaction / Discovery | Games, entertainment, social | |
| 5 Text-on-screen + B-roll | $0 to 50 budget | Trending sound from TikTok Creative Center, 12 to 20 s |

Format 1 targets: app screen time ≥ 50% of runtime; hook readable in < 2 s without sound; destination CTR 0.8 to 1.5% healthy (the benchmark table below says ~1%).

| Category | Formats | Avoid |
|---|---|---|
| Beauty | Story, Before/after | Corporate voiceover |
| Fitness | Before/after, Tutorial | |
| Productivity | Story, Tutorial | |
| Finance | Tutorial, Text-on-screen | Fear-mongering |
| Dating / social | Reaction, Story | |
| Games | Reaction, Before/after | |
| Health | Story, Tutorial | Medical claims without disclaimers |
| Photo / video editing | Before/after, Tutorial | Fake UI mockups |

### Hooks

- **Rules:** second person; a specific outcome; a curiosity gap; hashtags only on the organic Spark post, not in Ads Manager fields; no jargon ("AI-powered solution" is bad); no false claims.
- **Rubric:** 5 criteria × 0 to 2 (specificity, curiosity, authenticity, app relevance, distinctness); minimum 8/10 to produce.
- **Stock openers read as generated.** [coreyhaines31/marketingskills, ad-creative] lists generic "POV:", "Stop scrolling" and "Here's what nobody tells you" as ad tells, allowing POV only when "hyper-specific"; [lightreel] uses "POV" only "when followed by a concrete situation". Formats 1 and 3 above ([appeeky]) use "POV: you finally [solved problem]" and "Stop scrolling if you [persona trait]": fill the slot with a situation only this persona has.

### Production

| Budget | Approach | Time |
|---|---|---|
| $0 to 50 | AI video + screen recording | 1 to 2 days |
| $50 to 300 | US college creator, $50 to 100 per video | 3 to 5 days |
| $300+ | Micro-influencers | 1 to 2 weeks |

- **AI video:** real app screenshots, never fake UI; face + phone-in-hand beats faceless; no watermarks; burned-in captions.
- **Screen recording:** clean status bar (Do Not Disturb); the "aha" within the first 8 seconds; zoom on key UI; native resolution.
- **Creator brief:** the exact 2 second hook script; a specific demo flow; length (20 s); a do and don't list; Spark posting instructions. [coreyhaines31/marketingskills, influencer-marketing] says the opposite on the script, "Don't hand creators a script": brief one person, one situation, one promise and one proof ("One problem, one person, one way"). Both are vendor practice; [lightreel]'s brief order is recognizable situation → specific friction → product used on screen → visible output → benefit in the customer's language → direct CTA.
- **Research:** save 10 competitor ads (hook type, length, face, share of app screen); trending sounds in TikTok Creative Center; optionally the Meta Ad Library ([AD-CREATIVES.md](AD-CREATIVES.md#competitor-ad-teardowns)). Pull app assets for briefs with Appeeky `get_app` (screenshots and category) and `get_app_screenshots` (demo reference), each with `app_id`, `platform: "apple"`, `country: "us"`.

| Creative benchmark | Weak | Healthy | Strong |
|---|---|---|---|
| Destination CTR | < 0.5% | ~1% | > 1.5% |
| CPA vs target | > 2× | At target | < 0.7× |
| App screen time | < 30% | 50%+ | 70%+ |

"A 0.7% CTR ad with $12 CPA beats a 1.5% CTR ad with $35 CPA."

- **Mistakes:** a polished TV-style ad; no app until the end ("Demo by second 8"); the same hook 6 times; fake UI (policy rejection: TikTok bans "Invalid buttons, induced gestures, or text ... that portray unsupported functionality", for example "Swipe up to learn more.", per its ad format and functionality policy, so fake iMessage, AirDrop or notification reveals with tappable-looking buttons are out); 60 s+ on the first test; a trending sound with no relevance.

## Spark Ads

- **What they are.** A native format that runs organic TikTok posts (your own, or creators' with authorization) as ads; engagement accrues to the organic post. Supported with Auction buying for Reach, Traffic, Video Views, Community interaction, App promotion, Conversions, Lead generation and Sales; with Reach & Frequency for Reach, Traffic and Video Views.
- **Default for app install tests** [appeeky]: uploaded ads get CTR "0.3-0.7% for app install" versus Spark "0.8-1.5% for same creative". Fall back to an upload when Spark authorization expired, when automating via API without a linked identity, or when brand policy prohibits organic posting.

### Authorization codes

- **Creator side (TikTok).** In the TikTok app: post > Ad settings > accept terms > Ad authorization toggle > generate a video code with a duration of 7, 30, 60 or 365 days > share the code. Content Suite authorization requests default to 365 days.
- **Advertiser side (TikTok).** Enter the code under Tools > Creative library > Spark ads posts; batch-authorize up to 20 codes at a time. A code can be deleted only after every ad using it is deleted. Duets and Stitches need codes from both creators.
- **Duration conflict.** [appeeky] sets 60 days as the "maximum practical" period and regenerates codes at day 50; TikTok offers up to 365 days. [appeeky] also turns on allow ad comments and allow ad sharing.
- **Identity** [appeeky]: Ads Manager → Assets → Identities → Add identity → TikTok account. Without a linked identity, codes still work by paste.

### Accounts and posting

All [appeeky].

- **Account types:** brand (trustworthy, lower reach); persona (native, needs consistent niche content); creator (maximum authenticity). Do not manufacture account history to disguise automation or bypass platform systems; the source's account-aging recipe is excluded ([integrity and authenticity](https://www.tiktok.com/community-guidelines/en/integrity-authenticity)). "One account can host all 6 Spark ads".
- **A persona or program account still discloses.** A paid creator posting on a brand-run persona account is an endorsement with a material connection, so each post carries its own disclosure; a bio line is a profile page, which the FTC lists among missed placements (https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers; 16 CFR 255.5). Meta adds: "Creators cannot accept anything of value to post content that does not feature themselves or that they were not involved in creating" (https://www.facebook.com/business/help/221149188908254). On TikTok the "Paid partnership" label appears when the creator turns on Disclose commercial content > Branded content; no TikTok doc found says Spark authorization adds it. Do not script or fake account activity to look less automated: TikTok "strictly prohibit[s] automation tools, scripts, or other tricks designed to bypass our systems" (https://www.tiktok.com/community-guidelines/en/integrity-authenticity). Full rules: [creator-marketing DISCLOSURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/creator-marketing/DISCLOSURE.md).
- **Posting rules:** post all 6 within 24 to 48 hours; use TikTok library sounds; "Don't edit after posting: Edits can invalidate Spark codes"; keep posts public ("Private posts can't Spark"); no link in bio needed.
- **Ad text and CTA:** Install now (not "Learn more"); keep the organic caption hook as the ad text; 1 to 2 selling points.

### Create the ad

```
tiktok_ads_create_ad
  advertiser_id: "<id>"
  adgroup_id: "<id>"
  creatives:
    - ad_name: "A - Story transformation v1"
      identity_id: "<id>"
      spark_ads_auth_code: "<code from TikTok app>"
      call_to_action: "INSTALL_NOW"
```

- **By post ID instead:** `tiktok_item_id: "<post id from organic video>"` with `identity_id` from `tiktok_ads_list_identities`. **Upload fallback:** `tiktok_ads_upload_video_from_url` → `video_id`.
- **`creatives` is required:** pass raw TikTok `/ad/create` objects. Do not pass `ad_name` / `identity_id` as top-level MCP args. [appeeky]

### Comments and lifecycle

All [appeeky].

- **Comments:** publish truthful FAQ comments and reply to real questions. Use platform-permitted spam moderation, not word filters to suppress genuine criticism. Do not seed alternate-account comments or manufacture engagement; the old source suggested doing so "sparingly", contrary to the authenticity boundary above. [appeeky; https://www.tiktok.com/community-guidelines/en/integrity-authenticity]
- **Lifecycle:** day 0 note the code expiry; 48 hour audit; days 5 to 7 plan the refresh; day 50 regenerate codes before the 60-day expiry. Audit whenever a code expires within 10 days.

| Problem | Cause | Fix |
|---|---|---|
| Invalid code | Expired or typo | Regenerate |
| Post not found | Identity not linked | |
| Creative rejected | Claims, music rights | Use TikTok library audio |
| Low delivery | Budget or policy | |
| Code works once then fails | Code already used on another ad | One code per ad instance |

- **Spark rubric:** 8 items × 0 to 2, minimum 14/16 to publish.

## Audits

All [appeeky].

- **Primary metrics:** Conversions and Cost per Conversion; CTR and clicks are secondary.
- **Triggers:** first audit at 48 hours; spend > 2× target CPA with 0 conversions → pause now; a daily CPA check (mornings only) while scaling; creative age 7+ days → fatigue; CPA 15%+ above target after a scale → pause scaling; a Spark code expiring within 10 days.
- **Data:** `tiktok_ads_credentials_status`, `tiktok_ads_list_advertisers`, `tiktok_ads_list_campaigns`, `tiktok_ads_list_adgroups`, `tiktok_ads_list_ads`, and `tiktok_ads_performance advertiser_id level: "ad" days: 3` ("no tiktok_ads_report MCP tool: use this"), which returns spend, impressions, clicks, installs, CPA, CPC, CTR. Cross-check revenue with RevenueCat `rc_overview` ([revenuecat SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/SKILL.md)).

| Benchmark | Weak | Healthy | Strong |
|---|---|---|---|
| CPA vs target | > 2× | At target | < 0.7× |
| Conversions per ad at 48 h | 0 | 2 to 5 | 10+ |
| Spend per ad at 48 h | < $5 (under-delivered) | $15 to 20 | $20+ |
| Destination CTR | < 0.5% | ~1% | > 1.5% |

- **Scale:** +20% per day until CPA is 15%+ above target; one variable at a time; duplicate after 50+ conversions; refresh every 3 to 7 days; expand geo after US is stable 7+ days.

```
tiktok_ads_update_campaign
  campaign_id: "<id>"
  payload:
    budget: <current * 1.20>
    budget_mode: "BUDGET_MODE_DAY"
```

- **Kill:** spend > 2× target CPA with 0 conversions → pause now; 48 hours and $100 batch spend with batch CPA > 1.5× → pause the batch, make new creatives; CPA 2× after 30+ conversions → pause; policy rejection; CTR down 50%+ from peak; Spark code expired. Pause with `tiktok_ads_update_ad_status ad_id operation_status: "DISABLE"`.

| Impressions | CTR | Clicks | Conversions | Diagnosis | Fix |
|---|---|---|---|---|---|
| Low | Low | Low | Low | Creative doesn't resonate | New formats entirely ([Creative strategy](#creative-strategy)) |
| High | Low | Low | Low | Weak hook / CTA | Strengthen first 2s hook and on-screen text |
| High | High | High | Low | Low intent / curiosity clicks | Show app use case earlier; less viral bait |
| High | High | High | High but CPA bad | Onboarding/paywall issue | **Not an ads problem**: onboarding and paywall work |
| High | High | Low | Low | Store listing issue | Check rating, screenshots |
| Low | High | Low | Low | Budget/delivery constraint | Confirm $50/day, policy status, placement settings |
| High | Medium | Medium | Low SKAN only | iOS attribution lag | Trust MMP CPA; SKAN column lags, normal |

If all 6 ads map to "doesn't resonate", the batch failed.

- **Per-ad rubric:** 5 dimensions × 0 to 3 (CPA vs target, conversion volume, CTR, spend efficiency, fatigue risk), total 0 to 15: 12 to 15 scale +20%/day; 8 to 11 watch; 4 to 7 pause and analyze; 0 to 3 kill.
- **Playbook.** Day 0 launch 6 ads at $50/day; day 1 observe; day 2 full audit; days 3 to 4 hold; days 5 to 7 identify winners. Week 2: +20%/day, hook variants of the winning format only, permitted spam moderation, hold US. Week 3+: a new batch every 7 days; add CA, UK, AU.
- **Economics:** gross margin (LTV - CPA) / LTV of 30 to 50%+; learning tax $300 to 500; payback CPA / (LTV / expected lifetime months) under 3 months for subscriptions; ROAS > 100% at scale. "If CPA looks good but revenue doesn't follow → problem is downstream." See [BUDGET-AND-ROAS.md](BUDGET-AND-ROAS.md), which also gives [coreyhaines31/marketingskills, ads]'s gross-margin payback and cohort recovery beside this revenue-only formula ([Numbers that disagree](BUDGET-AND-ROAS.md#numbers-that-disagree)).
- **Refresh cadence differs by source:** 3 to 7 days in the setup and audit skills, every 7 days in the audit's week-3 playbook; Meta creatives refresh every 2 to 3 weeks ([META-ADS.md](META-ADS.md)).

## Appeeky MCP tools

`tiktok_ads_credentials_status`, `tiktok_ads_list_advertisers`, `tiktok_ads_list_campaigns`, `tiktok_ads_list_adgroups`, `tiktok_ads_list_ads`, `tiktok_ads_list_identities`, `tiktok_ads_performance`, `tiktok_ads_create_campaign`, `tiktok_ads_create_adgroup`, `tiktok_ads_create_ad`, `tiktok_ads_upload_video_from_url`, `tiktok_ads_update_campaign`, `tiktok_ads_update_campaign_status`, `tiktok_ads_update_ad_status`; app data `get_app`, `get_app_screenshots`.

## Prove it

- TikTok Events Manager shows the optimization event (Purchase or Subscribe) firing from the MMP with zero tracking errors before anything is published.
- The ad group optimizes for `IN_APP_EVENT` on Purchase or Subscribe, not Install, and has a `schedule_start_time`.
- `placements` and `location_ids` are comma-separated strings, and the US location ID was checked with a geo lookup.
- Each of the 6+ ads uses its own Spark code (one code per ad instance), the posts are public and unedited since posting, and every code expires more than 10 days out.
- On iOS 14.5+ the campaign uses a dedicated campaign slot (within the per-app quota) or has SKAN reporting deliberately opted out, and AEO campaigns return at least 90 daily app installs (below that SKAdNetwork may withhold conversion data as Null Conversions).
- No kill or budget change happened before the 48 hour audit except spend > 2× target CPA with zero conversions.
- Every non-Spark ad caption fits 100 characters (50 CJK) with no link, @, hashtag, emoji or "{ }", each export was checked against TikTok's safe zone file, AI-generated ads carry the AI-generated content toggle, and every creator or persona post carries its own disclosure.
