# Launch and marketing

Getting an app in front of people outside paid ads: the shared marketing context file every growth task reads first, the launch calendar, press and PR, creator and UGC programs, referral programs, and getting back into the store after a rejection. Every playbook here is third-party [eronred]: its benchmarks, prices and percentages are the author's claims with no further citation, so treat them as starting points to measure against. What decides most outcomes is timing and sequencing: listing work and the press kit start eight weeks out, embargoes and betas are set before submission, and creator, referral and review asks come after a user has felt the app's value. Store listing work is [../aso/SKILL.md](../aso/SKILL.md); paid channels are [APPLE-ADS.md](APPLE-ADS.md), [GOOGLE-APP-CAMPAIGNS.md](GOOGLE-APP-CAMPAIGNS.md), [META-ADS.md](META-ADS.md), [TIKTOK-ADS.md](TIKTOK-ADS.md), [AD-CREATIVES.md](AD-CREATIVES.md) and [BUDGET-AND-ROAS.md](BUDGET-AND-ROAS.md).

**Contents:** [The marketing context file](#the-marketing-context-file-eronred) · [Launch plan](#launch-plan-eronred) · [Launch channels](#launch-channels-eronred) · [Press and PR](#press-and-pr-eronred) · [Creator and UGC marketing](#creator-and-ugc-marketing-eronred) · [Referral programs](#referral-programs-eronred) · [Rejection recovery](#rejection-recovery-eronred) · [Prove it](#prove-it)

## The marketing context file [eronred]

- **Read `app-marketing-context.md` before any growth task.** Look in the project root or `.claude/`. If it exists, read it and offer to update it; if not, walk the user through the sections and save it as `app-marketing-context.md` in the project root. Every other growth playbook starts by checking for it (rejection recovery starts instead by asking for the verbatim rejection message).
- **Sections, in order:**

| # | Section | Fields |
|---|---|---|
| 1 | App Overview | App Name, App ID (Apple, numeric), App ID (Google Play, package name), Category, Secondary Category, Platform (iOS / Android / Both), Price Model (Free / Freemium / Paid / Subscription), Launch Date, Current Version |
| 2 | Value Proposition | Problem, Target Audience, Unique Differentiator, Elevator Pitch (one sentence) |
| 3 | Competitors | Table of the top 3-5: App, App ID, Strengths, Weaknesses |
| 4 | Current ASO State | Title, Subtitle, Keyword Field, Rating (stars and count), Primary Keywords; offer to pull metadata if the App ID is known |
| 5 | Goals | Top 3, each written "Target: [metric] by [date]" |
| 6 | Resources | Budget, Team (solo / small / marketing), Tools (analytics / Apple Ads / MMP), Constraints |
| 7 | Markets | Primary, Secondary, Languages |

- **Close with a summary:** key strengths, obvious gaps, and the next steps to run (for example an ASO audit and keyword research in [../aso/SKILL.md](../aso/SKILL.md)).

## Launch plan [eronred]

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

- **Analytics, crash reporting and the rating prompt** are in [ANALYTICS-AND-ATTRIBUTION.md](ANALYTICS-AND-ATTRIBUTION.md) and [RETENTION-AND-MONETIZATION.md](RETENTION-AND-MONETIZATION.md). Featuring, screenshots and store tests are in [../aso/SKILL.md](../aso/SKILL.md).

## Launch channels [eronred]

| Free channel | Fit |
|---|---|
| Product Hunt | Productivity, developer and design tools |
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
| Influencers | Micro-influencers (10K-100K) often give the best ROI | [Creator and UGC marketing](#creator-and-ugc-marketing-eronred) |

## Press and PR [eronred]

- **Why it pays:** App Store Connect's Web Referral source tracks installs from press links; coverage earns backlinks and "As seen on" social proof, supports Apple editorial, and amplifies organically.
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
e.g., "Habitica clone reached #1 Health with zero ad spend"

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

- **Pitch rules:** 5 sentences max; personalize the first line, no mass blast; link the press kit, don't attach files; send Tuesday to Thursday, 8-10am in the recipient's timezone; follow up once after 5 business days, then move on. Find journalists through recent reviews in the category, bylines, Twitter/X bios and Hunter.io (first@publication.com).
- **Embargo:** contact 1-2 weeks before; offer an exclusive under embargo publishing on launch day; one journalist per tier (don't offer the same exclusive to two competing outlets); give TestFlight or Play beta access. Exclusives dramatically increase pickup from Tier 1 publications.
- **Product Hunt:** coming-soon page 2 weeks before; find a hunter 1 week before; assets 3 days before (gallery, tagline, description, first comment); launch Tuesday to Thursday and ship at 12:01am PST; a follow-up post one week after launch sharing results as a Show HN or maker story.

| PR timeline | Action |
|---|---|
| T-14 | Press kit and release ready |
| T-10 | Tier 1 embargo pitches |
| T-7 | Follow-ups and Tier 2 |
| T-0 | Launch, Product Hunt, Tier 3 |
| T+3 | Thank reporters, share articles |

## Creator and UGC marketing [eronred]

- **Ask first:** the "show, don't tell" hook; budget tier; platform (TikTok, IG Reels, YouTube Shorts); audience; goal weighting (organic reach vs a library of ad creatives).

| Budget tier | Program |
|---|---|
| $0 seeding | Gift free Pro to 50-200 micro-creators (1k-50k followers); about 5-15% post unprompted |
| $500-5k | 10-30 micro-creators at $50-500 per post, unscripted |
| $5k-50k | 5-10 mid-tier creators ($1k-10k each) with usage rights, run as Spark Ads or Partnership Ads |
| $50k+ | Top creators plus an always-on UGC network (Insense, Billo, Fiverr), 20+ ads per month |

- **Write a brief of guardrails, not a script:** the app and a one-line description; one hook angle; features as visual moments. DO: own voice, app on screen for at least 50% of the video, mention the value prop once, disclose the paid partnership. DON'T: jargon, a script, competitors. Deliverables: 1 vertical video of 15-60s, the raw file for paid use, a posting window, a caption with your @handle and branded hashtag. Usage rights: 6 months of paid usage on Meta, TikTok and Google, plus allowlist or Spark Ads access. Pay on posting, plus a usage extension.
- **Hook angles:** POV, Day in the life, Before/after, "Things I wish I knew", Reaction, Tutorial/how-to, Trend-jacking. Cycle 2-3 angles per creator wave.
- **Sourcing:** manual DMs; influencer platforms (Aspire, Grin, Upfluence, $500-5k/mo); UGC marketplaces (Insense, Billo, Trend, Fiverr); Whop, Gigasset, Passes; TikTok Creator Marketplace (minimum spend); agencies (20-40% margin). For a first program: 70% manual DMs, 30% UGC marketplace.
- **Turn UGC into paid ads:** brief with rights, organic post, cut 3-5 ad variants per video, run them on Meta Advantage+ App Campaigns and TikTok Spark Ads, scale the winners. Claimed lift over studio creative: 1.5-3x CTR, 20-60% lower CPI. Spark Ads authorization codes and Meta setup are in [TIKTOK-ADS.md](TIKTOK-ADS.md) and [META-ADS.md](META-ADS.md); variant cutting is in [AD-CREATIVES.md](AD-CREATIVES.md).
- **Disclose:** in the US the FTC requires a clear "#ad" or "Paid partnership"; the EU and UK are the same. Spark and Partnership Ads add "Paid partnership" automatically when whitelisted. Apps cannot incentivize ratings or reviews through creators (Apple's and Google's rules on review manipulation are in [RETENTION-AND-MONETIZATION.md](RETENTION-AND-MONETIZATION.md#rating-prompts)).
- **Measure:** cost per post, organic views, CPI from the promo code or link, branded search lift, CPI when the content runs as paid (the real ROI for most programs), and save/share rate (the best leading indicator). Attribute with a unique promo code or link per creator, branded search spike analysis, a post-purchase survey, and MMP impression tracking for Spark Ads.
- **Anti-patterns:** over-scripting; no usage rights; mega-influencers ($50k+) before testing micro; ignoring Spark Ads; a one-time program (it needs a monthly cadence); no tracking link; skipping the brief.

## Referral programs [eronred]

- **Expect** a mature program to bring 5-20% of net-new installs. Ask for paid CAC (it sets the upper bound on the reward) and ARPU / LTV; if LTV is unclear, measure it first, since rewards can't be sized without knowing payback.
- **Check fit first.** Strong: network effects, high LTV, show-off content, daily use, existing word of mouth. Weak: solo utilities, low-ARPU free apps, embarrassing apps, one-and-done use, no organic sharing; for those, put the effort into creators (above) or retention ([RETENTION-AND-MONETIZATION.md](RETENTION-AND-MONETIZATION.md)).
- **Reward patterns:** double-sided (most consumer apps), inviter-only, invitee-only, tiered or milestone ("Invite 5 friends, get a year free"), currency or credits, status or cosmetic (about $0), cash payouts (high fraud risk).
- **Size the reward:** `Max referral reward (per side) ≤ (LTV × target margin) - other CAC`. Never make rewards larger than CAC.

| App type | Default reward |
|---|---|
| Subscription | 1 month free for both sides (about $5-15) |
| Marketplace | $5-25 invitee, $5-15 inviter |
| Game | 50-500 currency or 1 cosmetic |
| Fintech | $5-25 cash, only after a qualifying action |

- **K-factor** = invites sent per user x invite conversion rate. Under 0.15 is nice-to-have; 0.15-0.5 meaningful; 0.5-1.0 a strong amplifier; over 1.0 true viral (extremely rare). A realistic target is 0.2-0.4; above 0.5 only with very strong network effects.
- **Mechanics:** show the CTA after a value moment and repeat it at milestones; a one-tap system share sheet with a personalized link; a deferred deep link that lands on "Welcome, friend of <Name>!" with the reward applied; credit both sides automatically; a status dashboard; a milestone progress bar; A/B test the share copy; channels iMessage, WhatsApp, copy link, X, IG Story, email; offer both a code and a link; keep an audit log of reward delivery.
- **Track** `invite_sent`, `invite_clicked`, `invite_installed`, `invite_qualified`, `reward_issued`. Primary metric: K-factor, weekly. Secondary: % of installs from referral, referred-user retention vs paid, fraud rate.

| Fraud | Defense |
|---|---|
| Self-referral | Device fingerprint plus IDFV / Android ID plus IP block (see the Apple conflict below) |
| Reward farming | Reward only after a qualifying action (purchase, X-day retention) |
| Bots | ATT, email or phone verification |
| Stacking | Cap (for example 50 referrals or $X) |
| Link spam | Score by acceptance, throttle |
| Family Sharing | Detect and block; Apple provides a signal in receipts |

- **Conflict on fingerprinting:** the playbook suggests device fingerprinting against self-referral; Apple's user privacy page says no fingerprinting (apps may be rejected, including for SDKs that do it), and IDFV may be used across apps from the same content provider for analytics but not combined to track. Confirm in Apple's current privacy guidance before shipping fingerprint checks on iOS; the ATT rules are in [ANALYTICS-AND-ATTRIBUTION.md](ANALYTICS-AND-ATTRIBUTION.md#app-tracking-transparency-att).
- **Cash programs:** plan for a 5-15% fraud loss baseline and build a kill switch.
- **Launch checklist:** deep links tested cross-platform; reward issuance tested end to end; the five events instrumented; fraud caps configured; a support runbook for disputes.
- **Tooling:** deep links through Branch, AppsFlyer OneLink, Adjust or Singular; built-in referral products Branch Referrals, Tapfiliate, Friendbuy; build your own on the MMP's deep links plus your backend once referral platform fees pass $1k/mo.
- **Anti-patterns:** no deferred deep linking; rewards above CAC; rewarding before the invitee is proven real; a single static share message; no CTA repetition (one prompt at install gets about 2% adoption; 3+ contextual prompts get 15-25%); measuring only invites sent.

## Rejection recovery [eronred]

- **Goal:** resubmit within 24-72 hours. Ask for the full rejection message verbatim with guideline numbers, the platform, first submission or update (first submissions are scrutinized harder), App ID and category, what changed, and how time-sensitive it is. Classify before fixing.

| Apple guideline | Bucket | Typical fix |
|---|---|---|
| 2.1 | Performance and completeness | Test on a physical device, fix crashes, add missing demo content |
| 2.3.x | Accurate metadata | Match screenshots to the actual app, remove unsupported devices, fix the description |
| 2.5.x | Software requirements | Approved APIs only, fix private API use, fix HealthKit/SiriKit misuse |
| 3.1.1 | In-app purchase | IAP for digital goods, no external payment links |
| 3.1.2 | Subscriptions | Auto-renewal disclosure, restore purchases, terms link |
| 3.2.2 | Unacceptable business model | Multi-level marketing, scams, etc. |
| 4.0 | Design | Spam, copycat UI, broken layouts |
| 4.2 | Minimum functionality | Web wrappers, "thin" apps, brochureware |
| 4.3 | Spam | Duplicate of your own or another app; the most common rejection |
| 4.5.x | Apple sites and services | Wrong logo use, push notification misuse |
| 5.1.1 | Privacy and data collection | Privacy policy URL, data collection disclosure, ATT prompt copy |
| 5.1.2 | Data use and sharing | Match the privacy nutrition labels to actual collection |
| 5.1.5 | Location services | Justify "Always" location, ATT-style strings |
| 5.1.7 | Health and medical | Disclaimers, no diagnostic claims without FDA |
| 5.2.x | Intellectual property | Trademark/IP holder permission required |
| 5.3.x | Gaming, gambling, lotteries | License requirements |
| 5.6.1 | Developer code of conduct | Spam, fake reviews, manipulation |

- **2.1:** read the tested device and iOS version, reproduce on that exact configuration (or the closest available), give a demo account and a walkthrough video in Resolution Center if reproduction is environmental; for a crash, ship a fixed binary and note the exact line in the response.
- **2.3.10:** replace screenshots that show UI the app doesn't have, remove "iPad" mentions if iPad isn't supported, remove third-party trademarks.
- **3.1.1:** remove external payment links and "Buy on web", use StoreKit. Since 2024, US users can have the External Purchase Link Entitlement; it is opt-in and requires an entitlement request. Web-payment rules are in [RETENTION-AND-MONETIZATION.md](RETENTION-AND-MONETIZATION.md#web-to-app-funnels-eronred).
- **4.3:** the hardest. Identify the apps you were compared with; differentiate substantially (unique features, unique branding, a distinct value prop in the metadata); if it's your own portfolio, consolidate or kill old apps. On a first submission, expect it to be permanent unless you fundamentally change the app.
- **5.1.1:** a live, app-specific privacy policy; App Store Connect App Privacy lists every SDK's data collection; a specific ATT purpose string (not "improve the app"); `NSUsageDescription` strings that explain why.
- **5.1.5:** "Always" location needs a demonstrable background need; most apps should use "When In Use". Update Info.plist and the prompt copy.

| Google Play policy | Bucket | Typical fix |
|---|---|---|
| Restricted Content | Sexual content, hate, violence | Content moderation, age gate |
| Privacy, Deception, Device Abuse | Disclosure, permissions | Privacy policy, accurate Data Safety form |
| Intellectual Property | Trademark, copyright | Get rights or remove |
| Monetization and Ads | Disruptive ads, IAP bypass | Use Play Billing |
| Store Listing and Promotion | Misleading metadata | Match the listing to the app |
| Spam and Minimum Functionality | Repetitive content, low quality | Add unique value |
| Families | Apps for kids | COPPA / GDPR-K compliance, ad SDK whitelist |
| Permissions | High-risk permissions | Remove or justify (Special Permissions Declaration form) |
| Health misinformation | Medical claims | Add disclaimers, provide credentials |
| Foreground services | Background work | Justify in the Play Console form |

- **Automated Play suspensions** (no human review): use the Play Console appeal form with a written justification.
- **Reply in Resolution Center with this template:**

```
Hello App Review Team,

Thank you for the feedback regarding guideline <X.Y.Z>.

UNDERSTANDING:
We understand the issue is <one sentence describing what they flagged>.

CHANGES MADE:
1. <specific change>
2. <specific change>
3. <specific change>

DEMO INFO (if applicable):
  Username: demo@example.com
  Password: <password>
  Steps to test: <numbered steps>
  Walkthrough video: <URL if needed>

We have submitted build <X.Y.Z (build N)> with these changes. Please let us know if any further information is needed.

Thank you,
<Name>
```

- **Reply rules:** a good response gets re-reviewed in 24h. Never argue the guideline; never resubmit the same binary with only a metadata change unless metadata was the issue; always reference the new build number; give demo credentials even if some flows don't need them.

| Situation | Route |
|---|---|
| Guideline misapplied | App Review Board appeal: polite, factual, brief |
| Reviewer mis-tested (for example the wrong device) | Resolution Center reply with reproduction info; no formal appeal needed |
| 4.3 spam, first time | Fix and resubmit with substantial differentiation; don't appeal |
| A sub-policy you genuinely meet | Appeal with evidence (screenshots, code references) |
| 5.6.1 account threats or suspension | Appeal immediately, give context, don't ignore it |

- **App Review Board** responds in 5-10 business days. Don't appeal trivial issues: fixing and resubmitting is faster.
- **Expedited review:** App Store Connect > Contact Us > App Review > Expedited Request. Valid for a critical bug fix affecting users, a time-sensitive event (a launch tied to a date, a partner integration) or a security fix. Don't request it for marketing reasons: Apple denies it and may flag the account.
- **Resubmission checklist:** tested on Apple's device; demo account verified; build number incremented; privacy nutrition labels match; response posted; expedited request only if justified. Expect re-review in 24-48h on Apple, variable on Google.
- **Prevent the next one:** test on the oldest supported iOS and Android; human-written `NSUsageDescription` strings; a live privacy policy that matches collection; no third-party logos in screenshots; no "BETA", "BUG FIXES" or generic descriptions; a seeded demo account; Sign in with Apple offered alongside any third-party social login. Store-side release steps live in [../app-store-connect/SKILL.md](../app-store-connect/SKILL.md) and [../google-play/SKILL.md](../google-play/SKILL.md).

## Prove it

- **Context file:** `app-marketing-context.md` exists in the project root with all seven sections filled, goals written as "Target: [metric] by [date]".
- **Launch checklist:** every row from 8 weeks to month 1 has a date counted back from the launch date, the review submission leaves a 2-3 day buffer, and the embargo lift is scheduled for launch day.
- **Press:** the press kit has a 1024x1024px PNG icon, 5-10 screenshots and a press contact; each pitch is 5 sentences or fewer, personalized, links (not attaches) the kit, and has exactly one follow-up after 5 business days.
- **Creators:** every brief states usage rights, the paid-partnership disclosure and a unique tracking code or link per creator.
- **Referrals:** a test invite installs through a deferred deep link, lands on the welcome screen with the reward applied, and fires `invite_sent` through `reward_issued`; the reward per side is at or below `(LTV × target margin) - other CAC`; rewards wait for a qualifying action.
- **Rejection reply:** the Resolution Center response names the guideline, lists the concrete changes, gives demo credentials and references the new, incremented build number.
