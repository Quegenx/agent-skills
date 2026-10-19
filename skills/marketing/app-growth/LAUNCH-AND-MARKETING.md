# Launch and marketing

Getting an app in front of people outside paid ads: the shared marketing context file every growth task reads first, the launch calendar, press and PR, creator and UGC programs, referral programs, and getting back into the store after a rejection. Every playbook here is third-party [eronred]: its benchmarks, prices and percentages are the author's claims with no further citation, so treat them as starting points to measure against. What decides most outcomes is timing and sequencing: listing work and the press kit start eight weeks out, embargoes and betas are set before submission, and creator, referral and review asks come after a user has felt the app's value. Store listing work is [aso SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/SKILL.md); paid channels are [APPLE-ADS.md](APPLE-ADS.md), [GOOGLE-APP-CAMPAIGNS.md](GOOGLE-APP-CAMPAIGNS.md), [META-ADS.md](META-ADS.md), [TIKTOK-ADS.md](TIKTOK-ADS.md), [AD-CREATIVES.md](AD-CREATIVES.md) and [BUDGET-AND-ROAS.md](BUDGET-AND-ROAS.md).

**Contents:** [The marketing context file](#the-marketing-context-file) · [Launch plan](#launch-plan) · [Launch channels](#launch-channels) · [Press and PR](#press-and-pr) · [Creator and UGC marketing](#creator-and-ugc-marketing) · [Referral programs](#referral-programs) · [Rejection recovery](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/REVIEW-OPERATIONS.md#rejection-recovery) · [Prove it](#prove-it)

## The marketing context file

Read `.agents/product-context.md`; its [optional mobile app context](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md#mobile-app-context) preserves the seven [eronred] field groups, store IDs, metadata baseline, launch/version, resources and markets. Recognize a legacy `app-marketing-context.md` through that owner and offer migration instead of creating a second file. Close the context intake with strengths, gaps and next ASO/keyword steps. [eronred, app-marketing-context]

## Launch plan

Source: [eronred].

- **Ask first:** new app or major update; launch date; budget (organic only or paid); existing audience (email list, social, existing users); target countries (simultaneous or phased).
- **Output:** a checklist dated back from the launch date, prioritized tasks per phase, a channel strategy, a budget allocation, and success metrics for week 1, month 1 and month 3.

| When | Tasks |
|---|---|
| 8 weeks before | Keyword research; metadata (title, subtitle, keyword field); competitor analysis; screenshots; app preview video of 15-30 seconds; description with strong first 3 lines; distinctive icon. Pre-launch: App Store pre-order page, enable pre-order notifications, share the pre-order link. Press kit (screenshots, icon, description, founder story); identify 20-30 journalists, bloggers and YouTubers; draft personalized pitches; identify communities (Reddit, Discord, forums, Twitter/X). |
| 4 weeks before | TestFlight beta with 50-200 users; collect feedback and fix critical issues; ask beta testers to be ready to review on launch day; FAQ and support docs; launch blog post; 10+ social posts for launch week; demo video; Product Hunt draft; set up analytics; in-app rating prompt shown after a positive experience; crash reporting; test in-app purchases and subscriptions. |
| 1 week before | Submit for review with a 2-3 day buffer; schedule the press embargo lift for launch day; prepare launch day social posts; brief beta testers on review timing; set up App Store Connect phased release (or immediate release); prepare the Apple Ads campaign. |
| Launch day, morning | Release (or confirm the phased release started); press emails with the embargo lift; social (personal and app accounts); Product Hunt; communities (Reddit, Discord, forums); email list. |
| Launch day, during | Watch App Store Connect downloads; respond to every review; engage mentions; watch crash reports; share milestones ("We hit #X in [category]!"). |
| Launch day, evening | Thank early adopters; share day-one stats if impressive; plan tomorrow. |
| Week 1 | Daily social; respond to all reviews; check keyword rankings (is the app indexed?); adjust Apple Ads bids based on performance; follow up with press who didn't respond; submit to App Store editorial for featuring; analyze first-week metrics. |
| Month 1 | Full ASO audit with real data; adjust metadata based on actual keyword performance; A/B test screenshots; plan the first major update based on user feedback; evaluate paid ROI; set up ongoing keyword tracking. |

- **Before the 8-week plan** [ApparenceKit](https://apparencekit.dev/blog/aso-flutter-app-store-optimization/): "Research keywords before writing a single line of code. The name of your app, the category you choose, and the problems you solve should all be informed by what people actually search for." [ApparenceKit](https://apparencekit.dev/blog/how-to-monetize-mobile-app/): "Before building for months, spend $50-100 on Meta or TikTok ads pointing to your App Store page. If you can get your first 100 installs cheaply, your idea has legs. If not, pivot."
- **ASO alone is not enough at launch** [ApparenceKit](https://apparencekit.dev/blog/aso-flutter-app-store-optimization/) (undated claims): more apps compete, organic downloads are harder, and "Apple now also push more ads when you search (Being #2 now grants lower visibility than before)"; "You need to combine ASO with another channel to get the initial traction", such as Meta ads to start climbing the rankings.
- **Web and SaaS launches** (the ORB channel model, the Simple, Lovable, Complete readiness gate, five release phases, update tiers) are in [product-launch LAUNCH-PLAN.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/product-launch/LAUNCH-PLAN.md); organic launch posts for your own accounts are in [social-media SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/social-media/SKILL.md). Reading the existing audience as a funnel ("Use borrowed and rented reach to funnel strangers into owned channels") is in [content-strategy DISTRIBUTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/content-strategy/DISTRIBUTION.md#orb-as-a-funnel).
- **Analytics, crash reporting and the rating prompt** are in [ANALYTICS-AND-ATTRIBUTION.md](ANALYTICS-AND-ATTRIBUTION.md) and [RETENTION-AND-MONETIZATION.md](RETENTION-AND-MONETIZATION.md). Featuring, screenshots and store tests are in [aso SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/SKILL.md).

## Launch channels

Source: [eronred].

| Free channel | Fit |
|---|---|
| Product Hunt | The playbook names productivity, developer and design tools; Product Hunt's own fit test is wider (any new or substantively updated, usable product; "Closed beta launches are usually not a good fit"), see [product-launch PRODUCT-HUNT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/product-launch/PRODUCT-HUNT.md#is-it-a-fit) |
| Hacker News (Show HN) | Technical or innovative apps |
| Reddit | 3-5 subreddits; contribute before promoting |
| Twitter/X | Build-in-public thread |
| LinkedIn | B2B and productivity |
| YouTube | Demo, "how I built this" |
| App review sites | AppAdvice, MacStories, 9to5Mac |

| Paid channel | Fit | Read |
|---|---|---|
| Apple Ads | Highest intent; start here | [APPLE-ADS.md](APPLE-ADS.md) |
| Meta | Consumer apps | [META-ADS.md](META-ADS.md) |
| TikTok | Younger demographics | [TIKTOK-ADS.md](TIKTOK-ADS.md) |
| Google Ads App campaigns | Broad reach | [GOOGLE-APP-CAMPAIGNS.md](GOOGLE-APP-CAMPAIGNS.md) |
| Influencers | Micro-influencers (10K-100K) often give the best ROI | [Creator and UGC marketing](#creator-and-ugc-marketing) |

## Press and PR

Source: [eronred].

- **Beyond the app launch:** story angles, six pitch templates, media-list scoring, newsjacking and the press page are in [public-relations SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/public-relations/SKILL.md). Its [public-relations PITCHING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/public-relations/PITCHING.md) differs from this playbook on length (150 words vs 5 sentences), subject lines (under 50 characters vs an 8-word angle) and follow-up (day 3 and day 7, each with something new, vs one after 5 business days); both are third-party.
- **Why it pays:** App Store Connect's Web Referral source tracks installs from press links; coverage earns backlinks and "As seen on" social proof, supports Apple editorial, and amplifies organically. Google counts "links with optimized anchor text in ... press releases distributed on other sites" as link spam (https://developers.google.com/search/docs/essentials/spam-policies); link attributes and lawful link prospecting are in [seo LINKS-AND-OUTREACH.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/LINKS-AND-OUTREACH.md#what-google-calls-link-spam).
- **Target tiers:**

| Tier | Outlets |
|---|---|
| 1 (high impact, harder to get) | TechCrunch (prefers exclusives), The Verge (curated, high quality bar), Wired (long-form, needs a unique angle), Fast Company (strong business angle), 9to5Mac, MacStories (very accessible for indie devs) |
| 2 (accessible, meaningful reach) | AppAdvice, TouchArcade (games), AppShopper, niche newsletters, YouTube (AppFind, MKBHD), podcasts |
| 3 (start here) | Reddit (r/iphone, r/androidapps, r/productivity), Product Hunt, Hacker News Show HN, Indie Hackers |

- **Pick a story angle:** Numbers, Problem solved, Unique data, Category creation, David vs Goliath, Timely, Human story. Test it: one sentence that makes someone say "interesting".
- **Build the press kit** at `presskit/`, `yoursite.com/press` or a shared Notion/Drive folder: name, one-liner and category; 3 high-res founder photos; icon as a 1024x1024px PNG; 5-10 screenshots; preview video (optional); 3-sentence bio; key stats; prior coverage; App Store link and website; press contact email.
- **Press release structure:** FOR IMMEDIATE RELEASE; headline; subheadline; [City, Date] hook; P1 the news; P2 why it matters; P3 founder quote; P4 features or data (3 max); P5 availability, pricing and platforms; `###`; About; Media Contact.
- **Cold pitch email:**

```
Subject: [App Name]: [your angle in 8 words]

Hi [First name],

[1 sentence: why you're reaching out to them specifically]
e.g., "I read your piece on [recent article]: [App Name] is related."

[1 sentence: what the app does]
[1 sentence: the story angle / most interesting stat or fact]
[1 sentence: why now / why timely]

Happy to send a promo code, press kit, or get on a quick call.

[Your name]
[App Store link]
[Press kit link]
```

- **Pitch rules:** 5 sentences max; personalize the first line, no mass blast; link the press kit, don't attach files; send Tuesday to Thursday, 8-10am in the recipient's timezone; follow up once after 5 business days, then move on. Find journalists through recent reviews in the category, bylines, Twitter/X bios and Hunter.io (first@publication.com). Send only to an address the journalist or outlet published or a verification tool confirmed, never a guessed one, and honor "no PR pitches" in a bio ([public-relations PITCHING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/public-relations/PITCHING.md#finding-contacts)); consent and anti-spam rules for outreach are in [email-practices SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/SKILL.md).
- **Embargo:** contact 1-2 weeks before; offer an exclusive under embargo publishing on launch day; one journalist per tier (don't offer the same exclusive to two competing outlets); give TestFlight or Play beta access. Exclusives dramatically increase pickup from Tier 1 publications.
- **Product Hunt:** the one definition in this repo is [product-launch PRODUCT-HUNT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/product-launch/PRODUCT-HUNT.md), from Product Hunt's own launch guide. Post from your own personal account: "Hunting is just posting", no hunter is needed, and paying anyone to hunt or send traffic can get the product removed ([before-launch](https://www.producthunt.com/launch/before-launch), [how Product Hunt works](https://www.producthunt.com/launch/how-product-hunt-works)). Schedule the launch up to 1 month ahead and share the scheduled page; there is "no golden-ticket answer" on the day (weekend launches get 15% more Visit clicks); 12:01am PST is the rule of thumb, or the press embargo time ([preparing-for-launch](https://www.producthunt.com/launch/preparing-for-launch)). Ask for feedback, never upvotes. This line used to say [eronred] "coming-soon page 2 weeks before; find a hunter 1 week before; ... launch Tuesday to Thursday and ship at 12:01am PST". Still from the playbook: assets 3 days before (gallery, tagline, description, first comment) and a follow-up post one week after launch sharing results as a Show HN or maker story.

| PR timeline | Action |
|---|---|
| T-14 | Press kit and release ready |
| T-10 | Tier 1 embargo pitches |
| T-7 | Follow-ups and Tier 2 |
| T-0 | Launch, Product Hunt, Tier 3 |
| T+3 | Thank reporters, share articles |

## Creator and UGC marketing

Source: [eronred].

- **Wider programs** (the creator spectrum, vetting, deal models, ambassadors, a run-of-show checklist, UGC hooks and volume programs) are in [creator-marketing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/creator-marketing/SKILL.md); its follower bands and prices differ from the ones below, and all of them are author claims.
- **Ask first:** the "show, don't tell" hook; budget tier; platform (TikTok, IG Reels, YouTube Shorts); audience; goal weighting (organic reach vs a library of ad creatives).

| Budget tier | Program |
|---|---|
| $0 seeding | Gift free Pro to 50-200 micro-creators (1k-50k followers); about 5-15% post unprompted |
| $500-5k | 10-30 micro-creators at $50-500 per post, unscripted |
| $5k-50k | 5-10 mid-tier creators ($1k-10k each) with usage rights, run as Spark Ads or Partnership Ads |
| $50k+ | Top creators plus an always-on UGC network (Insense, Billo, Fiverr), 20+ ads per month |

- **Write a brief of guardrails, not a script:** the app and a one-line description; one hook angle; features as visual moments. DO: own voice, app on screen for at least 50% of the video, mention the value prop once, disclose the paid partnership. DON'T: jargon, a script, competitors. Deliverables: 1 vertical video of 15-60s, the raw file for paid use, a posting window, a caption with your @handle and branded hashtag. Usage rights: 6 months of paid usage on Meta, TikTok and Google, plus allowlist or Spark Ads access. Pay on posting, plus a usage extension. Inside that window, an advertiser must have "good reason to believe that the endorser continues to subscribe to the views presented" (16 CFR 255.1(b), https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-255), so re-confirm with the creator before running old content after the app changes.
- **Hook angles:** POV, Day in the life, Before/after, "Things I wish I knew", Reaction, Tutorial/how-to, Trend-jacking. Cycle 2-3 angles per creator wave.
- **Sourcing:** manual DMs; influencer platforms (Aspire, Grin, Upfluence, $500-5k/mo); UGC marketplaces (Insense, Billo, Trend, Fiverr); Whop, Gigasset, Passes; TikTok Creator Marketplace (minimum spend); agencies (20-40% margin). For a first program: 70% manual DMs, 30% UGC marketplace.
- **Turn UGC into paid ads:** brief with rights, organic post, cut 3-5 ad variants per video, run them on Meta Advantage+ App Campaigns and TikTok Spark Ads, scale the winners. Claimed lift over studio creative: 1.5-3x CTR, 20-60% lower CPI. Spark Ads authorization codes and Meta setup are in [TIKTOK-ADS.md](TIKTOK-ADS.md) and [META-ADS.md](META-ADS.md); variant cutting is in [AD-CREATIVES.md](AD-CREATIVES.md).
- **Disclose** ([FTC Disclosures 101](https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers), [FTC Endorsement Guides FAQ](https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking)): the creator's own words in the post, and in a video "in the video and not just in the description"; a spoken claim needs a spoken disclosure (16 CFR 255.0(f)). Starting a post with "Ad:", "Paid ad" or "#ad" "would likely be effective"; "sp", "spon", "collab" and a stand-alone "thanks" or "ambassador" are too vague. A platform label is not enough on its own: "the ultimate responsibility for clearly and conspicuously disclosing a material connection rests with the influencer and the brand - not the platform". Meta lets a brand boost creator content only when the creator turned on "Allow brand partner to boost" and tagged it with the paid partnership label (or shared an ad code); TikTok shows "Paid partnership" when the creator turns on Disclose commercial content > Branded content, and no TikTok page says Spark Ads authorization adds it. An agent posting through the APIs sets TikTok's `brand_content_toggle` and `is_aigc` or Instagram's `is_ai_generated`. Full rules: [creator-marketing DISCLOSURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/creator-marketing/DISCLOSURE.md). This line used to say [eronred] "in the US the FTC requires a clear "#ad" or "Paid partnership"; the EU and UK are the same. Spark and Partnership Ads add "Paid partnership" automatically when whitelisted"; the EU and UK claim is unchecked. Apps cannot incentivize ratings or reviews through creators (Apple's and Google's rules on review manipulation are in [RETENTION-AND-MONETIZATION.md](RETENTION-AND-MONETIZATION.md#rating-prompts)).
- **Measure:** cost per post, organic views, CPI from the promo code or link, branded search lift, CPI when the content runs as paid (the real ROI for most programs), and save/share rate (the best leading indicator). Attribute with a unique promo code or link per creator, branded search spike analysis, a post-purchase survey, and MMP impression tracking for Spark Ads. Ask the survey at the moment of conversion with a pick-list of known channels plus a free-text "other", and discount its share before turning it into credit ("22% recall of YouTube is evidence of awareness, not a claim that YouTube deserves 22% of conversions"); segment branded from non-branded search ([marketing-attribution SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-attribution/SKILL.md#the-blind-spots)) [coreyhaines31/marketingskills, attribution]. Tag creator links with `utm_medium=creator` (not `social` or `video`) and `utm_source` set to the platform, one link per placement ([google-analytics UTM.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/google-analytics/UTM.md#patterns-by-partner-type)).
- **Anti-patterns:** over-scripting; no usage rights; mega-influencers ($50k+) before testing micro; ignoring Spark Ads; a one-time program (it needs a monthly cadence); no tracking link; skipping the brief.

## Referral programs

Source: [eronred].

- **Expect** a mature program to bring 5-20% of net-new installs. Ask for paid CAC (it sets the upper bound on the reward) and ARPU / LTV; if LTV is unclear, measure it first, since rewards can't be sized without knowing payback.
- **Check fit first.** Strong: network effects, high LTV, show-off content, daily use, existing word of mouth. Weak: solo utilities, low-ARPU free apps, embarrassing apps, one-and-done use, no organic sharing; for those, put the effort into creators (above) or retention ([RETENTION-AND-MONETIZATION.md](RETENTION-AND-MONETIZATION.md)).
- **Reward structures:** use the [canonical structures and incentive types](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/referral-programs/PROGRAM-DESIGN.md#rewards). [eronred] defaults to double-sided rewards for most consumer apps and adds mobile applications: invitee-only, currency or credits, status/cosmetic rewards (about $0), cash payouts with high fraud risk, and a milestone such as "Invite 5 friends, get a year free".
- **Size the reward:** apply the [two tagged sizing views](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/referral-programs/PROGRAM-DESIGN.md#sizing-the-reward), naming the formula used and counting both sides under its stated scope. [eronred; coreyhaines31/marketingskills, referrals]

| App type | Default reward |
|---|---|
| Subscription | 1 month free for both sides (about $5-15) |
| Marketplace | $5-25 invitee, $5-15 inviter |
| Game | 50-500 currency or 1 cosmetic |
| Fintech | $5-25 cash, only after a qualifying action |

- **K-factor and the source's bands:** [referral-programs METRICS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/referral-programs/METRICS.md#k-factor) is the definition and preserves [eronred]'s mobile thresholds.
- **Mechanics:** show the CTA after a value moment and repeat it at milestones; a one-tap system share sheet with a personalized link; a deferred deep link that lands on "Welcome, friend of <Name>!" with the reward applied; credit both sides automatically; a status dashboard; a milestone progress bar; A/B test the share copy; channels iMessage, WhatsApp, copy link, X, IG Story, email; offer both a code and a link; keep an audit log of reward delivery.
- **Track** `invite_sent`, `invite_clicked`, `invite_installed`, `invite_qualified`, `reward_issued`. Primary metric: K-factor, weekly. Secondary: % of installs from referral, referred-user retention vs paid, fraud rate.

| Fraud | Defense |
|---|---|
| Self-referral | Do not fingerprint devices; apply the canonical fraud review/qualifying-action rules within Apple's privacy boundary below |
| Reward farming | Reward only after a qualifying action (purchase, X-day retention) |
| Bots | Email or phone verification (the playbook also listed ATT; see the Apple rules below) |
| Stacking | Cap (for example 50 referrals or $X) |
| Link spam | Score by acceptance, throttle |
| Family Sharing | Detect and block; Apple provides a signal in receipts |

- **Official correction on fingerprinting:** do not fingerprint or derive device data to uniquely identify a user/device, including through attribution SDKs. The source suggested it as a self-referral defense; fraud-prevention broker use cases do not create a fingerprinting exception. IDFV's allowed analytics scope and ATT policy remain at [ASC privacy](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/PRIVACY-AND-COMPLIANCE.md#app-tracking-transparency). [https://developer.apple.com/app-store/user-privacy-and-data-use/]
- **More fraud rules** [coreyhaines31/marketingskills, referrals]: watch for referral rings; claw back rewards on refunds and chargebacks; treat a shared IP or device as "a signal for review, not proof of abuse" ([referral-programs PROGRAM-DESIGN.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/referral-programs/PROGRAM-DESIGN.md#fraud)).
- **Apple rules for referrals** ([App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)):
  - 5.6.3: "Manipulating any element of the App Store customer experience such as charts, search, reviews, or referrals to your app erodes customer trust and is not permitted."
  - 5.1.2(i): an app may not require users to enable "tracking" (or push or location) to "receive monetary or other compensation, including but not limited to gift cards and codes", so never gate or verify a reward on the ATT answer. The playbook listed ATT as a bot defense.
  - 3.1.2(a): subscribers get "what they've paid for without performing additional tasks, such as posting on social media, uploading contacts"; a referral reward is an extra, never a condition of paid access.
  - 5.1.1(iii) and 5.1.2(iv), (v): prefer "the out-of-process picker or a share sheet rather than requesting full access" to Contacts; contact people from Contacts only "at the explicit initiative of that user on an individualized basis", with no Select All, and show "how the message will appear to the recipient before sending it"; build no contact database from them.
  - 3.1.1: apps "may not use their own mechanisms to unlock content or functionality, such as license keys". The guideline does not name referral rewards; reading it onto an in-house code that unlocks a subscription is interpretation, so grant a free period through a promotional offer or an offer code ([SUBSCRIPTION-OFFERS.md](SUBSCRIPTION-OFFERS.md)) and confirm with App Review if unsure.
  - 3.2.1(vii): a cash gift between users can skip IAP only if optional and "100% of the funds go to the receiver of the gift"; a gift "connected to or associated at any point in time with receiving digital content or services must use in-app purchase".
  - 4.5.4: referral reminders by push need explicit opt-in "via consent language displayed in your app's UI" and an in-app opt-out.
- **Disclose the reward in public shares:** the FTC FAQ names no refer-a-friend case; giving the share sheet's pre-written public message a disclosure the user can keep ("I get a free month if you join with my link") is interpretation ([referral-programs PROGRAM-DESIGN.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/referral-programs/PROGRAM-DESIGN.md#disclosing-the-reward)).
- **Review asks next to referral asks:** a referral prompt may be timed to a happy moment, but public review requests are not filtered by sentiment ("this practice could violate the FTC Act") and an incentive must not depend on the review being positive (16 CFR 465.4) ([FTC Reviews Rule Q&A](https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers)).
- **Cash programs:** plan for a 5-15% fraud loss baseline and build a kill switch.
- **Launch checklist:** deep links tested cross-platform; reward issuance tested end to end; the five events instrumented; fraud caps configured; a support runbook for disputes.
- **Tooling:** deep links through Branch, AppsFlyer OneLink, Adjust or Singular; built-in referral products Branch Referrals, Tapfiliate, Friendbuy; build your own on the MMP's deep links plus your backend once referral platform fees pass $1k/mo.
- **Anti-patterns:** no deferred deep linking; rewards above CAC; rewarding before the invitee is proven real; a single static share message; no CTA repetition (one prompt at install gets about 2% adoption; 3+ contextual prompts get 15-25%); measuring only invites sent.

## Rejection recovery

Review notes, rejection diagnosis, replies and appeals are in [App Review operations](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/REVIEW-OPERATIONS.md); Google policy recovery is in [Play policy](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/google-play/POLICY-AND-PREFLIGHT.md#rejection-recovery).

## Prove it

- **Context file:** `.agents/product-context.md` contains the applicable mobile fields, goals use "Target: [metric] by [date]", and a legacy mobile context was offered for migration, not duplicated. [eronred, app-marketing-context; anti-slop-copy CONTEXT.md]
- **Launch checklist:** every row from 8 weeks to month 1 has a date counted back from the launch date, the review submission leaves a 2-3 day buffer, and the embargo lift is scheduled for launch day.
- **Product Hunt:** posted from a personal account, no paid hunter, no upvote asks; the listing passes [product-launch PRODUCT-HUNT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/product-launch/PRODUCT-HUNT.md#prove-it).
- **Press:** the press kit has a 1024x1024px PNG icon, 5-10 screenshots and a press contact; each pitch is 5 sentences or fewer, personalized, links (not attaches) the kit, and has exactly one follow-up after 5 business days.
- **Creators:** every brief states usage rights, the creator's own disclosure in the post or video itself (not only the platform label) and a unique tracking code or `utm_medium=creator` link per creator and placement.
- **Referrals:** a test invite installs through a deferred deep link, lands on the welcome screen with the reward applied, and fires `invite_sent` through `reward_issued`; the reward passes the [canonical sizing view the plan names](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/referral-programs/PROGRAM-DESIGN.md#sizing-the-reward); rewards wait for a qualifying action; no reward, ATT answer or paid feature is tied to inviting; replaying a reward webhook or export does not pay or count a conversion twice.
- **Rejection reply:** the [store operations checks](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/REVIEW-OPERATIONS.md#prove-it) pass for a recovery task.
