# Paid UA budget and ROAS

Planning paid user acquisition across channels: the unit economics every channel is judged against, where the first dollars go, how budget moves between channels, and whether the ads make money. The mechanism that decides most outcomes is the chain from tracking to LTV: a channel can only optimize toward a purchase it can see (so the MMP and event mapping come before social spend), and spend is only profitable against an LTV and target CPA you wrote down first. Everything here is third-party practice from [appeeky] (UA skills built on the vendor Appeeky MCP server, whose tool names appear below), [eronred] (ASO skills) and [coreyhaines31/marketingskills] (MIT; its `ads`, `marketing-plan`, `marketing-loops` and `attribution` skills), except the Google Play fee schedule, which is Google's; the platforms' own rules are in the channel files. Channels: [APPLE-ADS.md](APPLE-ADS.md), [GOOGLE-APP-CAMPAIGNS.md](GOOGLE-APP-CAMPAIGNS.md), [META-ADS.md](META-ADS.md), [TIKTOK-ADS.md](TIKTOK-ADS.md); SKAdNetwork, AdAttributionKit and ATT are [ANALYTICS-AND-ATTRIBUTION.md](ANALYTICS-AND-ATTRIBUTION.md); RevenueCat itself is [revenuecat SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/SKILL.md).

**Contents:** [Routing ads questions](#routing-ads-questions) · [The ads context document](#the-ads-context-document) · [Channels and planning](#channels-and-planning) · [Cross-channel budget](#cross-channel-budget) · [MMP setup](#mmp-setup) · [Subscription snapshot](#subscription-snapshot) · [Campaign profitability](#campaign-profitability) · [Cross-channel performance](#cross-channel-performance) · [Numbers that disagree](#numbers-that-disagree) · [Prove it](#prove-it)

## Routing ads questions

[appeeky]'s router dispatches; it does not answer: "your job is dispatch, not delivery." Read the message, match intent first and exact phrase second (top match wins), announce `→ Loading: <skill-name>`, and ask **one** clarifying question if it's ambiguous. Never load more than 3 skills at once; if more are needed, ask the user to narrow down. Skip routing when the user names a skill.

| The question | Go to |
|---|---|
| "set up context", "ads brief", first paid project | [The ads context document](#the-ads-context-document) |
| "MMP", "AppsFlyer", "Adjust", "Singular", "Branch", "SKAN setup", "purchase events", "before I spend on ads" | [MMP setup](#mmp-setup) |
| "MRR", "RevenueCat", "subscription snapshot", "how is revenue" | [Subscription snapshot](#subscription-snapshot) |
| "am I profitable", "LTV vs CPA", "ad margin", "break even CPI" | [Campaign profitability](#campaign-profitability) |
| "all channels", "TikTok vs Meta", "compare ad platforms", "paid dashboard" | [Cross-channel performance](#cross-channel-performance) |
| "budget split", "how much per channel", "allocate ad budget" | [Cross-channel budget](#cross-channel-budget) |
| "ASA ROAS", "keyword profitability", "weekly ASA", "scale ASA" | [APPLE-ADS-OPTIMIZATION.md](APPLE-ADS-OPTIMIZATION.md) |
| "ASA negatives", "search terms waste" | [APPLE-ADS.md](APPLE-ADS.md#negative-keywords) |
| "Google UAC", "Google app campaigns", "Android Google ads" | [GOOGLE-APP-CAMPAIGNS.md](GOOGLE-APP-CAMPAIGNS.md) |
| Meta setup, audit, budget | [META-ADS.md](META-ADS.md) |
| Ad creative, variants, competitor teardowns | [AD-CREATIVES.md](AD-CREATIVES.md) |
| Clicks but no subscriptions: onboarding, paywall | [RETENTION-AND-MONETIZATION.md](RETENTION-AND-MONETIZATION.md) |
| TikTok setup, creative, Spark Ads, audit | [TIKTOK-ADS.md](TIKTOK-ADS.md) |
| ASO, keywords, metadata | [aso SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/SKILL.md) |
| Deep SKAN, ATT or MMP debugging | [ANALYTICS-AND-ATTRIBUTION.md](ANALYTICS-AND-ATTRIBUTION.md) |

- **Sequences [appeeky]:** full paid growth plan: context → cross-channel budget → channel setup. First time running ads: context → MMP setup → budget → one channel setup. TikTok from scratch: MMP setup → context → TikTok setup → creative strategy → Spark Ads (this one puts MMP before context). "Are my TikTok ads working?": TikTok audit → profitability. Ads get clicks but no subs: TikTok or Meta audit → onboarding → paywall. Scale what's working: profitability → cross-channel performance → channel audit or optimizer. Apple Ads plus TikTok: budget → Apple Ads ROAS + TikTok audit. "I spent $500 and nothing worked": profitability → channel audit → MMP setup (verify tracking).
- **Clarifying questions:** "not converting" → "Low **clicks** (creative problem) or clicks but no **purchases** (onboarding/paywall)?"; a subscription app asking about ads → "Have you completed **MMP setup** so TikTok/Meta can optimize for Purchase/Subscribe?" [appeeky]
- **Route around these [appeeky]:** a profitability question when tracking isn't verified goes to MMP setup ("Profitability assumes tracking works"); a weekly Apple Ads ops question that is really about profit goes to ROAS analysis; Meta campaign setup without an MMP goes to MMP setup ("Never launch without MMP").

## The ads context document

- **`app-ads-context.md`** is the document "all paid growth skills reference before pulling data or recommending spend". Save it to the project root or `.cursor/`. Before routing anywhere else, check it exists; if not, suggest it once per session. Point general product facts to `.agents/product-context.md`, recognizing a legacy mobile filename through [anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md#finding-it), and keep this operational ads brief distinct. Probe the Appeeky MCP connection before asking for credentials. "Don't skip unit economics: every paid skill depends on CPA/LTV targets." [appeeky]
- **App identity:** name, Apple App ID, Google Play package, category, store URL, price model, primary conversion event ("Install (install-only only if ad-supported)"), platform priority; fill gaps with `get_app`.
- **Economics:** blended LTV; LTV by geo; **target CPA ("CPA < 0.5× LTV to scale aggressively")** (a paid-scaling gate, LTV/CPA ≥ 2; the plan-level health check "LTV/CAC ... Health benchmark: > 3" [coreyhaines31/marketingskills, marketing-plan] divides by fully loaded blended CAC, a different denominator); target CPI (install-only or ad-supported campaigns only, "not the scale target for subs apps"); payback period target; current MRR; store fee assumption 15% or 30%.
- **LTV when unknown:** RevenueCat snapshot `revenue_28d / new_customers`; trial model `trial_rate × paid_conversion × ARPU × avg_lifetime_months`; conservative default ARPU × expected retention months.
- **Budget and channels:** the source's test budget is $30 to 50/day ASA and $50/day social for **7 days**, with the first kill window at 48 hours. [appeeky] No verified MMP is a blocker before social spend.
- **Integrations:** TikTok (Advertiser ID), Meta (default ad account `act_xxx`), Apple Ads (Org ID), RevenueCat (Project ID), MMP, Google Ads (App campaigns only). Check with `tiktok_ads_credentials_status`, `meta_ads_credentials_status`, `asa_credentials_status`, `rc_overview` (needs `rc_key` and `rc_project`).
- **Creative refresh cadence:** every 3 to 7 days.
- **Goals:** "Kill criteria: spend > 2× target CPA with 0 conversions = pause channel"; "Scale criteria: ROAS > 1.5× for 7 consecutive days = increase budget 20%". Two other sources set kill criteria at different scopes. A marketing plan's channel-level rule is "If a paid channel has CAC > 2× target after 30 days at meaningful spend, pause" [coreyhaines31/marketingskills, marketing-plan]: blended CAC over a month, where [appeeky]'s is a per-channel test with a 48 hour first window. And [coreyhaines31/marketingskills, ads] treats any fixed kill rule as an input, not a verdict: check sample size, conversion lag and learning state first ([paid-ads AUDIT-GUARDRAILS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/AUDIT-GUARDRAILS.md#recommendation-safety)). Plan-level kill criteria live in [marketing-plan](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-plan/SKILL.md).
- **The generic product context** (positioning, audience, proof, goals) is `.agents/product-context.md` ([anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md)); keep the paid unit economics here and point to it rather than copying.
- **Bootstrap:**

```
rc_overview
  rc_key: "<sk_xxx>"
  rc_project: "<proj_xxx>"
  currency: USD
```

  Use the returned `mrr`, `active_subscriptions`, `active_trials`, `revenue` and `new_customers`; flag `active_trials` >> `active_subscriptions` as a conversion health problem.
- **Update it when:** a channel is added (integrations, history); the CPA target changes (economics, goals); budget rises; the MMP is verified; 90 days pass (refresh goals). Output: the saved file, what's filled and missing, blockers (no MMP, no RevenueCat, no ad accounts), the recommended first step. [appeeky]
- **Tell new advertisers [appeeky]:** the first $300 to 500 per channel is testing, expect negative ROI; 30 to 50% net margin after store fees and ad spend is good for subscriptions; the MMP must be live before scaling TikTok or Meta app install campaigns; iOS apps with search intent should start Apple Ads before social; social ads fatigue in 2 to 3 weeks.

## Channels and planning

- **Start with:** monthly budget, target CPI or ROAS, LTV, audience, countries, category. [eronred]
- **iOS first for subscriptions** [ApparenceKit](https://apparencekit.dev/blog/facebook-flutter-sdk-meta-ads-events/): iOS users spend 2 to 3 times more than Android users on in-app purchases and subscriptions, and in most markets the top revenue apps make 60-70% of their income from iOS even where Android has more downloads.

| Channel | Avg CPI | Intent | Complexity / notes [eronred] |
|---|---|---|---|
| Apple Ads | $1 to 3 | Very high | Low |
| Google App campaigns | $0.5 to 2 | Medium | Medium |
| Meta | $1 to 4 | Low to medium | High |
| TikTok | $0.5 to 3 | Low | Medium |
| Snapchat | $0.5 to 2 | Low | Gen Z, AR |
| Twitter/X | $2 to 5 | Low | News, tech, finance |
| Reddit | $1 to 3 | Medium | Niche |

- **[eronred]'s budget ladder:** < $1K Apple Ads (Basic) only; $1K to $5K Apple Ads (Advanced) + 1 social; $5K to $20K Apple Ads + Meta + Google App campaigns; $20K to $100K + TikTok + testing; $100K+ all + programmatic + influencer.
- **Targets [eronred]:** CTR > 5% Apple Ads, > 1% social; CVR > 30% Apple Ads, > 10% social; CPI < LTV / 3; CPA < LTV; ROAS > 1.0 break even, > 2.0 good; D7 ROAS predicts long-term.
- **Cadence [eronred]:** daily spend pacing; weekly CPI, CPA and bids; bi-weekly creative refresh ("ad fatigue after 2-3 weeks"); monthly channel mix; quarterly strategy and new channels. [coreyhaines31/marketingskills, marketing-loops] checks creative fatigue and CPA drift every 2 to 3 days ("Meta/Google feedback loops are days, not hours"); that is how often to look, not how often to refresh.
- **The weekly ads check** [coreyhaines31/marketingskills, ads and marketing-loops]: go in a fixed order, spend → traffic → conversions → creative fatigue → landing page (for an app, the store listing) → tracking, and end each account with exactly one call: HOLD (with a reason), FIX (the problem and the fix), TEST (hypothesis, metric, stopping rule) or INVESTIGATE (beats everything; use it when tracking disagrees with RevenueCat or the MMP beyond the usual gap). The check itself changes no budget, bid, status or live ad. Full version: [paid-ads AUDIT-GUARDRAILS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/AUDIT-GUARDRAILS.md#the-weekly-operating-check); run on a schedule: [marketing-loops PAID-LOOPS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-loops/PAID-LOOPS.md#the-weekly-ads-check-loop).

| App type | Channels [appeeky] |
|---|---|
| High-intent utility | Apple Ads |
| Visual consumer | TikTok |
| Broad demographic | Meta |
| Subscription beauty or lifestyle | TikTok + Meta |
| Productivity or B2B | Apple Ads + Meta |
| Gaming | TikTok + Google App campaigns |
| Niche community | Meta (interest) + Reddit |

## Cross-channel budget

- **Ask:** total monthly budget, category and geo, connected channels, data maturity (new, testing 7 to 14 days, proven 30+ days), iOS or Android priority. [appeeky]
- **Principles [appeeky]:** Apple Ads first on iOS; a floor per channel (social and Google $50/day, Apple Ads $30/day), and below the floor don't run it; hold a 10% test reserve; no channel above 50% until its CPA is proven over 50+ conversions; the first $500 per channel is testing. "$1,000/month split 60/20/20 is ~$20 ASA + ~$7 TikTok + ~$7 Meta: none of those learn."

| Monthly budget | Default split with no data [appeeky] |
|---|---|
| ≤ $1,500 | One channel only: iOS search → 100% Apple Ads (~$30 to 50/day); visual or consumer → 100% TikTok or Meta at $50/day |
| $3,000 | Two channels max; iOS: 40% Apple Ads + 50% one social + 10% reserve ("Not Meta *and* TikTok") |
| $10,000 | Three channels if each gets ≥ $50/day: 30/30/30/10 |
| $30,000+ | 25% Apple Ads / 30% TikTok / 30% Meta / 10% Google App campaigns / 5% reserve; Google only after social is proven |

- **Shift by app type,** only when the budget covers 2+ channels at their floors: Android-primary → Google or Meta, skip Apple Ads; visual or consumer → TikTok; B2B or productivity → Apple Ads; gaming → TikTok, Google only at $10K+. [appeeky]
- **Launch order [appeeky]:**

| Step | Channel | Gate | Min daily |
|---|---|---|---|
| 1 | Apple Ads | App live | $30 |
| 2 | Meta or TikTok | MMP verified | $50 |
| 3 | Second social | 7 days of data | $50 |
| 4 | Google App campaigns | Android live, Firebase linked | $30 |

  "Do not launch social channels before `mmp-setup` is verified."
- **After 14+ days, weight by performance:** `Weight(channel) = (1 / CPA_channel) / sum(1 / CPA_all_channels)` and `Weight(channel) = ROAS_channel / sum(ROAS_all_channels)`, blended 50/50. Keep the caps (50% max per channel until 50+ conversions), the floors (else pause) and a 5 to 10% reserve. [appeeky]
- **Months [appeeky]:** month 1, one channel for weeks 1 and 2, a second only if the leftover meets its floor; month 2, move 20% from worst to best every 2 weeks and test 1 new creative per week per social channel; month 3+, scale the best 20% a week until CPA rises 15%, reserve 5%.
- **At plan level** [coreyhaines31/marketingskills, marketing-plan]: "Always add 10 to 20% as 'experimental budget'" on top of the formula, and split spend 70% current channels / 20% next / 10% experimental (40/30/30 in the first phase, 80/15/5 later).
- **Test reserve:** 10% (5% at $30K+); a test runs at least $50/day for 2 days; kill at 2× target CPA with 0 conversions after $100; promote next month if CPA < target. [appeeky]
- **Daily budget:** `(Monthly allocation × 12) / 365` or `Monthly allocation / 30`. [appeeky]
- **Reallocate:** CPA < 0.8× the others over 14 days → shift 20%; CPA > 2× target over 7 days → pause; ROAS > 1.5× for 7 days → scale 20%. **Kill:** spend > 2× target CPA with 0 conversions; ROAS < 0.5× for 14 days. Revisit on day 7, 14 and 30. [appeeky] These moves read platform-reported ROAS; branded Apple Ads and retargeting are "always credited" channels, so run a holdout or on-off test and scale them on incremental CPA or ROAS (spend ÷ incremental conversions) instead [coreyhaines31/marketingskills, attribution] ([marketing-attribution MEASUREMENT-PARADIGMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-attribution/MEASUREMENT-PARADIGMS.md#reading-a-test)).
- **Mistakes [appeeky]:** even splits; 4 channels at $10/day; $1K across three channels; scaling social before the MMP; ignoring Apple Ads for iOS search apps; no reserve; reallocating on < 7 days of data.

## MMP setup

Run it before any paid social spend: "Do not proceed to campaign setup until MMP + event mapping is verified." App install campaigns optimize toward down-funnel events (Purchase, Subscribe, Start Trial); without an MMP TikTok and Meta can't learn who converts, CPA stays high, and "The first $500 to 1000 is often wasted on untargeted installs". "Without MMP, social channels can only optimize to installs: CPA for subscriptions will be 3 to 5× too high." [appeeky] [ApparenceKit](https://apparencekit.dev/blog/facebook-flutter-sdk-meta-ads-events/) disagrees when Meta is the primary ad channel: the Facebook SDK with AEM plus the Conversions API, no MMP ([META-ADS.md](META-ADS.md#prerequisites)).

- **Ask:** platform; MMP (AppsFlyer, Adjust, Singular, Branch, Kochava or none); monetization; primary optimization event; ad channels; whether RevenueCat is in use (confirm the MMP to RevenueCat path). [appeeky]

| MMP | Notes [appeeky] | SKAN |
|---|---|---|
| AppsFlyer | Most common, strong docs | Conversion Studio |
| Adjust | Gaming, granular cohorts | Dashboard CV mapping |
| Singular | Cross-platform ROI | Predicted LTV model |
| Branch | Deep linking plus attribution | Basic SKAN support |

  All support TikTok and Meta; "installing one matters more than which one".
- **Phase 1, SDK (day 1):** create the account and add the apps; install the latest SDK; initialize with the dev key on launch; set the customer user ID after login ("match RevenueCat `appUserID` if used"); see a test install in the dashboard; on iOS, **fire the ATT prompt after a value moment, not on first launch**. [appeeky]
- **Phase 2, event mapping [appeeky]:**

| In-app event | When | TikTok event | Meta event |
|---|---|---|---|
| Purchase | Successful IAP | Complete Payment | Purchase |
| Subscribe | Subscription start | Subscribe | Subscribe |
| Start trial | Trial begins | Start Trial | StartTrial |
| Registration | Account created | Complete Registration | CompleteRegistration |

  Revenue events carry revenue and currency; fire them in sandbox or TestFlight before production ads; enable the RevenueCat to MMP integration if you use RevenueCat; "Only **one** source fires purchase events (avoid SDK + RC duplicates)".
- **Which event to optimize [appeeky]:** free trial to paid: Start Trial (secondary Subscribe); direct subscribe: Subscribe; freemium IAP: Purchase (secondary Complete registration); ads-only: Complete registration (secondary in-app ad impression, not through the MMP). "Optimize toward the event that **predicts LTV**, not the easiest event to fire."
- **Phase 3, SKAN (iOS only):** a SKAN 4 conversion value schema (coarse plus fine); values mapped to revenue tiers (for example $0 / trial / paid); MMP SKAN postback handling; **AdAttributionKit enabled (iOS 17.4+)**; a 24 to 72 hour delay, so don't judge iOS campaigns hourly. Schemas in depth: [ANALYTICS-AND-ATTRIBUTION.md](ANALYTICS-AND-ATTRIBUTION.md). [appeeky]
- **Phase 4, platform connections [appeeky]:**
  - **TikTok:** MMP linked in TikTok Ads Manager > Assets > Events; App ID (iOS bundle, Android package) verified; optimize for Purchase or Subscribe; the test event tool can take hours. In the ad group's Tracking, connect TikTok Events to the verified app, In-App Event optimization Purchase or Subscription, destination App Store or Google Play; "SKAN column in reports will show 0 early: normal on iOS". More in [TIKTOK-ADS.md](TIKTOK-ADS.md).
  - **Meta:** app in Business Manager; MMP partner integration; Aggregated Event Measurement for iOS; Purchase and Subscribe among the top 8 priority events; Conversions API if you have server-side events. Optimize for app events (not installs) once you have 50+ events a week; expect a 1 to 3 day lag with AEM on iOS 14+; pass purchase value from the MMP; attribution "7-day click, 1-day view default; match your payback period". More in [META-ADS.md](META-ADS.md).
  - **Apple Ads:** uses Apple's attribution, but the MMP is still needed for Meta and TikTok ROAS joins; enable RevenueCat's Apple Ads attribution attributes; integrate **AdServices (not legacy iAd)** for install credit.
  - **Google App campaigns:** Firebase linked to Google Ads; in-app conversion events imported; the Play Install Referrer API integrated ("Android source of truth").
- **Phase 5, verify before $50/day, on a real device:** delete the app, install from TestFlight or the Play internal track, complete the primary conversion, then confirm it in the MMP (within minutes), TikTok Events Manager (1 to 24 hours), Meta Events Manager (1 to 24 hours) and RevenueCat. **Gate: if the test event isn't in the MMP within 1 hour, don't launch ads.** [appeeky]

| Symptom | Cause | Fix [appeeky] |
|---|---|---|
| Installs but 0 conversions in ads | Events not mapped | Fire the purchase event with revenue |
| MMP shows events, TikTok doesn't | Partner not linked | Re-link in TikTok Events Manager |
| All SKAN conversions = 0 | Too early or low volume | Wait 3 to 7 days; check the MMP's SKAN dashboard |
| Duplicate events | SDK and RevenueCat both firing | One source of truth |
| Meta events delayed 48h+ | AEM plus low volume | Raise budget or broaden targeting temporarily |
| Android installs unattributed | Install Referrer missing | Integrate the Play Install Referrer API |

- **Expectations:** judge iOS at 7 days, not 24 hours; the MMP dashboard is the source of truth for event verification. [appeeky]

## Subscription snapshot

- **When:** before launching or scaling (the LTV baseline), weekly or monthly health, after a pricing or paywall change, and for "can I afford $X CPA?". [appeeky]
- **Credentials:** `rc_key` (RevenueCat secret API key) and `rc_project`; if stored in Appeeky Connect, call without them. Without RevenueCat, estimate from App Store Connect data at lower confidence. [appeeky]

```
rc_chart
  chart_name: "revenue"    # or mrr | churn
  start_date: "2026-07-25"
  end_date: "2026-08-22"
  rc_key: "<sk_xxx>"
  rc_project: "<proj_xxx>"
```

  Plus `rc_overview` (above), `rc_mrr`, `rc_active_subscriptions` and `rc_attribution_summary`, each with `rc_key` and `rc_project`. Metric IDs: `mrr`, `active_subscriptions`, `active_trials`, `revenue` (28 days), `new_customers` (28 days). `rc_attribution_summary` returns `mediaSource`, `campaign` and `keyword` (Apple Ads keyword revenue). [appeeky]
- **Diagnostics [appeeky]:** trial conversion `active_subscriptions / (active_subscriptions + active_trials)` (red flag: trials >> subs for 30+ days, a paywall or onboarding problem); revenue per customer `revenue / new_customers` (watch for a month-over-month decline); MRR growth via `rc_chart`; high churn in `rc_churn` as a refund signal. "If red flags appear, tell the user to fix conversion before scaling ads."

| Target | Formula [appeeky] |
|---|---|
| Blended LTV | `revenue_28d / new_customers` |
| Max affordable CPA | `LTV × 0.5` |
| Aggressive CPA (retention proven) | `LTV × 0.7` |
| Break-even CPA | `LTV × (1 - store_fee%)` |
| Daily revenue per sub | `MRR / active_subscriptions / 30` |
| Payback days | `Target CPA / (MRR / active_subscriptions / 30)` |

- **Caveats:** `revenue_28d / new_customers` is rough, true LTV needs cohort analysis; apps under 90 days old have unreliable LTV; MRR growth with flat spend means organic strength; flat MRR with rising spend means a unit economics problem. [appeeky] [coreyhaines31/marketingskills, marketing-plan] adds four plateau alerts: "Week-over-week additions flattening", "Rising CAC on a formerly cheap channel", "Engagement/activation softening at the top of the funnel", "Effort up, output flat"; "When two or more fire on the same curve, that's the trigger to accelerate the 20% 'next' bucket."

## Campaign profitability

- **Windows:** last 7 days for CPA, last 14 days for ROAS. [appeeky]
- **Data:** TikTok `tiktok_ads_performance` (advertiser, 7 days: spend, impressions, clicks, installs, CPA, CPC, CTR); Meta `meta_ads_insights` ("Map `actions` array to installs and purchase events. Extract `spend`, `cpc`, `cpm`."); Apple Ads `asa_profitability` (campaign, 14 days, `min_spend: 10`), "the only channel with native revenue join via Appeeky"; `rc_overview`; `rc_attribution_summary`. [appeeky]
- **Formulas [appeeky]:**
  - Gross margin = (Revenue − Ad spend − Store fees) / Revenue
  - ROAS = Attributed revenue / Ad spend
  - Net profit per user = LTV − CPA − (store fee % × LTV)
  - Break-even CPA = LTV × (1 − store fee %)
  - Scale CPA = LTV × (1 − store fee %) × 0.5
  - Payback days = CPA / (MRR / active_subscriptions / 30)
  - Blended CPA = Total spend / Total conversions (ad spend only). [coreyhaines31/marketingskills, marketing-plan]'s blended CAC is fully loaded instead: marketing salaries, ad spend, martech, content production, agency and contractor retainers, SDR/BDR salaries and CRM, automation and analytics tools, divided by new customers ("A company that 'doesn't run ads' still has a CAC"). Keep both, under their own names.
- **Apple Ads rate definitions** [appeeky]: CPT = spend / taps; CVR = installs / taps; TTR = taps / impressions. Other-channel tables use their stated click/tap denominator.
- **Simplified source profit** [appeeky] is revenue minus spend before store fees; it is distinct from the fee-adjusted per-user and margin formulas above. Do not treat that tool label as profit after all costs.
- **Store fees [appeeky]:** Apple Small Business 15% (under $1M a year), Apple standard 30% (above $1M); default to 15%.
- **Google Play fees** (https://support.google.com/googleplay/android-developer/answer/112622): for users in the EEA, UK and US from June 30, 2026 (Australia and Japan from September 30, 2026), auto-renewing subscriptions (new and existing installs) and, for developers in the 15% service fee tier, the first $1M of annual earnings pay "10% + 5% billing fee"; other transactions pay 20% + 5% on installs made on or after that date and 25% + 5% (or 20% for external web links) on earlier installs. Elsewhere, until the new fees roll out: 15% on the first $1M, 30% above it, and 15% on auto-renewing subscriptions regardless of revenue. The billing fee applies to purchases through Google Play Billing. This line said "Google Play 15% on the first $1M" [appeeky]: still the total for subscriptions and the first $1M, but the standard rate for other new-install transactions in those markets is now 25% in total.

| Revenue source | Confidence [appeeky] |
|---|---|
| Apple Ads via `asa_profitability` | High |
| Meta and TikTok via `rc_attribution_summary` (`mediaSource`) | Medium: "directional: MMP dashboard is more accurate for optimization decisions" |
| Blended `rc_overview` revenue / total spend | Low (includes organic) |

- **Triangulate, never add up** [coreyhaines31/marketingskills, attribution]: one source of truth for the count, never sum platform-claimed installs or conversions across Meta, TikTok and Apple Ads (de-dupe against the store or RevenueCat count), trust directional agreement over an absolute match, and budget for the gap ("platforms claim N; we can verify M"). Reported ROAS is attributed, not incremental: incremental CPA = spend ÷ incremental conversions from a holdout, and branded Apple Ads and retargeting, which platforms credit by default, need a holdout before you scale them on reported ROAS ([marketing-attribution MEASUREMENT-PARADIGMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-attribution/MEASUREMENT-PARADIGMS.md#incrementality)).

The following pairings are the original [appeeky] source claims, not valid derived margins. In particular, its 0.7 to 1.0× ROAS row cannot yield a positive revenue-minus-ad-spend margin for the same cohort/window, before store fees. Preserve its proposed action bands as practitioner claims, but calculate actual comparable revenue and costs from the formulas above; neither ROAS > 1 nor these paired ranges proves profitability.

| ROAS (source) | Margin (source claim) | Decision [appeeky] |
|---|---|---|
| > 1.5× | > 40% | Scale (+20% a week) |
| 1.0 to 1.5× | 20 to 40% | Hold and optimize |
| 0.7 to 1.0× | 0 to 20% | Optimize: pause the worst ad sets, fix onboarding |
| < 0.7× | Negative | Pause: kill or cut 50% |

- **Channel caveats [appeeky]:** TikTok iOS data is delayed 24 to 72 hours, judge at 7 days; Meta models iOS with AEM, 10 to 20% off the MMP; Apple Ads has the most reliable ROAS; Google App campaigns are read manually.
- **Expectations [appeeky]:** 30 to 50% net is good; the first $500 per channel is often unprofitable; compare CPA to same-geo LTV; paid installs often lift organic; use 90-day LTV for mature apps.
- **Ready to scale [appeeky]:** ROAS > 1.0× for 7+ consecutive days; CPA < 0.5× LTV; 50+ conversions; a creative refresh pipeline (social); MMP events verified (social); payback within target.

## Cross-channel performance

- **Range:** last 7 days (operational) or 14 (strategic); mark disconnected channels "not connected". [appeeky]

```
tiktok_ads_performance
  level: advertiser
  days: 7
```

  (`level: campaign` to drill down)

```
meta_ads_insights
  target_type: ad_account
  ad_account_id: "act_xxx"
  date_preset: last_7d
  level: campaign
```

```
asa_profitability
  rc_key: "<sk_xxx>"
  level: campaign
  days: 7
  min_spend: 5
```

  plus `rc_overview` and `rc_attribution_summary`. [appeeky]
- **One table:** Channel, Spend, Impressions, Clicks, Installs, Conv, CPI, CPA, Revenue, ROAS, Trend; Google App campaigns' trend is manual; mark estimated revenue with `~`. Derived: CPI = Spend / Installs; CPA = Spend / Conversions; ROAS = Revenue / Spend; CTR = Clicks / Impressions; CVR = Installs / Clicks; share of spend. [appeeky]

| Trend | Meaning | Action [appeeky] |
|---|---|---|
| Spend up, CPA up | Saturation or fatigue | Refresh creative |
| Spend up, CPA stable | Healthy | |
| Spend down, CPA up | | Check pacing |
| Installs up, conversions flat | Low-quality traffic | |
| Apple Ads CPI low, social CPA high | "Normal: ASA is highest intent" | Don't compare CPI directly |

- **Reallocate** when a channel's CPA is < 0.8× the others with 50+ conversions: shift 20% from worst to best. "**Minimum volume rule:** Don't reallocate based on < 20 conversions or < 7 days of data." [appeeky]
- **Drill-downs:** TikTok creative fatigue is CTR declining 3+ days; Meta's event optimization status (install or purchase); Apple Ads bleeder campaigns at ROAS < 1.0. [appeeky]

## Numbers that disagree

None of these come from a platform's docs; confirm against your own data. [coreyhaines31/marketingskills] (MIT, Copyright (c) 2025 Corey Haines) lines quote its `ads`, `marketing-plan` (adapted from Corey Haines' *Founding Marketing*), `marketing-loops` and `attribution` skills.

- **Learning spend per channel:** "$300 to 500" (context, MMP setup) versus "$500" (budget, profitability) versus "$500 to 1000" wasted without an MMP. [appeeky]
- **Reallocation minimum:** "< 20 conversions or < 7 days" versus 50+ conversions for the 0.8× shift and the 50% cap. [appeeky]
- **Affordable CPA:** max affordable `LTV × 0.5` (snapshot) versus scale CPA `LTV × (1 − store fee %) × 0.5` (profitability); [eronred] says CPA < LTV and CPI < LTV / 3. [appeeky, eronred]
- **Apple fee threshold wording:** "< $1M annual" / "> $1M annual" versus "After $1M revenue". [appeeky]
- **Smallest budgets:** [appeeky] puts ≤ $1,500 into one channel; [eronred] puts < $1K into Apple Ads (Basic) only and $1K to $5K into Apple Ads plus one social.
- **Google floor:** $50/day as a channel floor versus $30 in the launch sequence. [appeeky]
- **Payback:** [appeeky]'s `CPA / (MRR / active_subscriptions / 30)` and TikTok's `CPA / (LTV / expected lifetime months)` are revenue-only. [coreyhaines31/marketingskills, ads] uses "gross-margin payback = CAC / (monthly ARPU × gross margin)" and calls "A 3 to 12 month target ... a planning reference". At $300 CAC a $99/month plan is 3.0 months revenue-only but "300 / (99 × 0.20) = 15.2 months" at 20% gross margin. For a cohort, "Cumulative recovery through month n = sum(ARPU_t × gross_margin_t × retained_fraction_t)": two cohorts both at 70% retention in month 12 recover a $300 CAC in month 6 (lost early) and month 4 (lost late), so "Annual retention alone" can't give the payback date; "If the observed cohort has not recovered CAC, report that rather than inventing a payback date". More in [paid-ads PAYBACK.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/PAYBACK.md).
- **Kill criteria:** per-channel test (2× CPA, 0 conversions, 48 hours) [appeeky] versus plan-level CAC > 2× target after 30 days [coreyhaines31/marketingskills, marketing-plan] (see [Goals](#the-ads-context-document)).

## Prove it

- **The context exists:** `app-ads-context.md` has LTV, target CPA (≤ 0.5× LTV to scale), store fee and the primary conversion event filled before any spend recommendation.
- **Tracking gate passed:** on a real device a fresh install's primary conversion reached the MMP within 1 hour, and the TikTok and Meta event managers and RevenueCat within their windows, before any social channel spends $50/day.
- **One purchase source:** each purchase appears once in the MMP (not from both the SDK and RevenueCat).
- **Every channel clears its floor:** no channel runs below $50/day social and Google, $30/day Apple Ads, and none exceeds 50% of budget before 50+ conversions.
- **Reallocations have data:** each budget move cites at least 7 days and the conversion count it was based on.
- **Profitability uses the right source:** Apple Ads ROAS from the revenue join, Meta and TikTok marked directional, blended ROAS labelled as including organic.
- **Fees match the market:** Android margins use Google Play's schedule for the user's region and install date (10% + 5% for subscriptions and the first $1M in the EEA, UK and US from June 30, 2026), not a flat 15%.
- **No summed platform claims:** cross-channel totals come from the store, RevenueCat or the MMP, and branded or retargeting spend was scaled only after a holdout.
- **Conversion health first:** trial conversion from the snapshot shows no trial pile-up before a budget increase.
