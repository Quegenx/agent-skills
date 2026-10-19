# Meta ads for web conversions

Meta campaigns that send people to a website or a lead form: what Meta documents about learning, a kill, keep and scale system anchored on one number, fatigue, lead forms, Advantage+, partnership ads and the creative-volume practice practitioners call the Andromeda playbook. From [coreyhaines31/marketingskills, ads, meta-decision-system.md and meta-andromeda-playbook.md] (MIT; the decision system credits Ivan Falco's ads-skills, destination testing Alexander Pauwelyn, and the creator-volume section Wispr Flow's head of performance marketing). Every threshold here is a practitioner starting point; Meta's own lines are quoted with URLs and win. App campaigns, the SDK and SKAN are in [app-growth META-ADS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/META-ADS.md).

**Contents:** [What Meta says about learning](#what-meta-says-about-learning) · [TCPL, the anchor](#tcpl-the-anchor) · [The ad-count ceiling](#the-ad-count-ceiling) · [Two campaigns: scaling and testing](#two-campaigns-scaling-and-testing) · [Destination testing](#destination-testing) · [Stage 1: delivery check](#stage-1-delivery-check) · [Stage 2: quality evaluation](#stage-2-quality-evaluation) · [Graduation](#graduation) · [Fatigue](#fatigue) · [Swap rules](#swap-rules) · [Creative production math](#creative-production-math) · [Scaling protocol](#scaling-protocol) · [Weekly cadence](#weekly-cadence) · [Lead forms](#lead-forms) · [Advantage+](#advantage) · [Partnership ads](#partnership-ads) · [Rolling reach](#rolling-reach) · [Andromeda practice](#andromeda-practice) · [Creator ads at volume](#creator-ads-at-volume) · [Benchmarks and seasonality](#benchmarks-and-seasonality) · [Prove it](#prove-it)

## What Meta says about learning

- **Exit:** learning "usually occurs after about 50 [results] in the week after the ad set's last significant edit"; for Shops ads, Meta notes "a minimum of 17 purchases through your website and 5 through Meta" (https://www.facebook.com/business/help/112167992830700). Budget for it: about target CPA × 50 ÷ 7 per day [coreyhaines31/marketingskills, ads].
- **Budget changes:** Meta says only to "avoid frequent budget changes (which can cause an ad set to re-enter the learning phase)" (same page). It publishes no percentage.
- **Significant edits** that re-enter learning include "Any change to ad creative", "Adding a new ad to your ad set", "Pausing your ad set for 7 days or longer (the ad set reenters the learning phase once you unpause the ad set)" and "Changing bid strategy" (https://www.facebook.com/business/help/316478108955072).

**Corrections to the source.** Its rotation rule said "never edit creative inside a performing ad... Launch new ads alongside existing ones, or spin up a new ad set with the same targeting. Pausing doesn't reset; editing does." Against Meta's list, adding an ad to the same ad set also resets learning, and a pause of 7 days or longer does too; only a new ad set leaves the old one's learning alone. Its scaling rule said "+20% every 5 days. Never +30% or more in one move, that resets learning"; the percentages are practitioner, not Meta's. app-growth's [appeeky] lines (+20% per day on winners, "Never increase > 20% per day on campaigns under $500/day") are practitioner too ([app-growth META-ADS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/META-ADS.md#budget-optimization)); the two sources disagree on cadence (every 5 days vs per day), and neither is Meta's rule.

## TCPL, the anchor

TCPL = **target cost per qualified lead** (qualified = meets your ICP bar, not just a form fill). Every rule below is a multiple of it; review it monthly.

1. **From deal math (best):** TCPL = target cost per demo × qualified-lead-to-demo rate ($2,000 × 0.28 = $560).
2. **From history:** trailing 30-day CPL (qualified) × 0.80; the source says a 20% improvement comes from cleanup alone (killing zero-QL ads, graduating winners). With both, use the tighter.
3. **New account:** target CAC × qualified-lead-to-customer rate, or a placeholder from your ACV tier; replace with method 2 after 30 days.

## The ad-count ceiling

More active ads than the budget can feed means every ad starves. **Ceiling = (daily budget × 14) ÷ (2 × TCPL):** over a 14-day window each ad needs at least 2× TCPL of spend to be judged. $1,000 a day at $500 TCPL → a ceiling of 14; run 6 to 10 (winners plus 2 to 3 test slots). At the ceiling, a new test needs a kill first.

## Two campaigns: scaling and testing

Two CBO campaigns over the **same audience**: Scaling (~80% of budget, graduated ads only) and Testing (~20%, new concepts and iterations, budget protected). Inside one CBO, proven ads starve new ones. The source on ABO: "equal forced distribution keeps spending on ads Meta has already deprioritized." app-growth's [appeeky] does the opposite, "keeps CBO off for testing (ABO gives control per test)" ([app-growth META-ADS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/META-ADS.md#advantage-app-campaigns)); both are practitioner.

**Image first:** launch new concepts as statics; produce the video, carousel or UGC version only after the image passes. Exception: concepts that are inherently video (testimonial, demo, UGC).

## Destination testing

When the page, not the creative, is the biggest unknown: one CBO per persona, one ad set per destination type (product page, listicle or advertorial, quiz, demo page), the **same creatives in every ad set**, so any spread between ad sets is the destination. Run it in the Testing campaign, judge each ad set against TCPL at the usual gates, then graduate the winning creative × destination pair. The source labels this "Practitioner-reported pattern (Alexander Pauwelyn, 2026), not a platform-documented mechanic", including its "~30%" new-reach gain. Owned review-style pages must disclose ownership ([GOOGLE-ADS-AUDIT.md](GOOGLE-ADS-AUDIT.md#landing-page)).

## Stage 1: delivery check

At day 7 for each test ad, CBO's spend allocation is itself a signal:

- **Fair share:** minimum expected spend = (campaign daily budget ÷ active ads) × 7 × 0.5. Below it → kill (Meta deprioritized it); zero spend → kill now.
- **Ongoing:** spent ≥ 1× TCPL lifetime AND under ~$10 a day over the last 7 days → kill. The lifetime gate stops you killing ads CBO hasn't explored yet.

Iterating a delivery-killed ad, change the hook, visual or format only: the audience never got far enough for copy or CTA to matter. These kills create new ads; read the significant-edits list above before adding them to a live ad set.

## Stage 2: quality evaluation

Weekly, rolling 14-day data; stop at the first triggered action:

1. **Data gate:** spend < 3× TCPL → wait. At true cost per QL equal to target, 3× TCPL should produce ~3 qualified leads; zero at that spend has about a 5% probability (e^-3, which holds), so judging at 3× gives ~95% confidence; 2× has a 13% false-negative rate, 5× overpays.
2. **Zero pixel leads** at ≥ 3× TCPL → swap and abandon the concept.
3. **Quality** (needs the CRM): pixel leads but zero qualified → swap, keep the format, change the angle. Qualified rate < 40% → swap and add ICP-filtering language (at 40%, true cost per QL is 2.5× the pixel CPL). 40 to 60% → monitor a week. ≥ 60% → proceed.
4. **Cost:** cost per QL ≤ TCPL → candidate winner; 1 to 1.5× → monitor; > 1.5× → swap.

## Graduation

Testing → Scaling only when all hold: ≥ 5 qualified leads · qualified rate ≥ 60% · cost per QL ≤ TCPL · running ≥ 14 days · ≥ 1 QL in the last 7 days.

## Fatigue

### A second diagnostic view

[Yuzzyuk/marketing-os, references/ads-diagnostics.md] reads CTR, CPM, CVR and frequency together. Treat its labels as hypotheses to investigate, not causal proof or new kill thresholds:

| Pattern | Source's diagnostic candidate |
|---|---|
| CTR falls, CPM/CVR stable, frequency rises | Concept fatigue |
| CTR falls, CPM/frequency rise, CVR stable | Audience exhaustion |
| CPM rises while CTR/CVR/frequency remain stable | Auction pressure |
| CVR falls with stable CTR/CPM/frequency | Post-click issue |
| CTR and CVR fall with stable CPM/frequency | Message-match issue |
| Poor from launch, low frequency | Unproven/bad concept rather than demonstrated fatigue |
| Volatile low-volume results | Insufficient evidence |

Check tracking and change history separately before assigning a cause; the source's severe CTR/CVR-drop row does not establish a broken pixel, and CTR loss alone is not tracking proof. Attribution windows, changed audience mix, seasonality and surviving-only ads can confound the comparison. [Yuzzyuk/marketing-os, references/ads-diagnostics.md]

The existing swap rule below recommends a fresh execution of the same concept. This source instead recommends a new concept for exhausted arguments, while also favoring a proven angle in an untested format. Keep both practitioner views: identify the actual failed layer and stage a test; neither recommendation overrides the existing account thresholds or authorizes live changes. [coreyhaines31/marketingskills, ads/references/meta-decision-system.md; Yuzzyuk/marketing-os, references/ads-diagnostics.md]

| Campaign type | Safe | Warning | Critical |
|---|---|---|---|
| Cold prospecting | 1.0 to 2.5 | 2.5 to 4.0 | > 4.0 |
| Retargeting | 2.0 to 4.0 | 4.0 to 6.0 | > 6.0 |
| ABM (small audiences) | 2.0 to 5.0 | 5.0 to 8.0 | > 8.0 |

These per-type bands sharpen app-growth's single frequency table ([app-growth META-ADS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/META-ADS.md#decide)); both are practitioner. Other signals, most urgent first: CTR down 20%+ from baseline over 7 days; CPM up 30%+ over 2 weeks (it moves before CTR); relevance rankings "below average"; CPA up with stable targeting.

- **Scaling-campaign ads** get a stricter bar: warning at frequency 3.0 to 3.5 or cost +20% → start 2 iterations now (about 14 days to be ready); swap at > 3.5, cost +40%, or > 1.5× TCPL for 2 weeks.
- **B2B lifespans:** statics 14 to 28 days; short video and carousels 21 to 35; UGC and testimonials 28 to 42. Small audiences build frequency fast; plan a refresh every 14 to 21 days.
- **Retire, don't iterate,** when CTR is 30%+ below peak or frequency crosses the critical band: the concept is exhausted, not the execution.

## Swap rules

Never pause without a replacement: keep 2 to 3 iterations staged, live within 7 days (immediately for critical fatigue). With an empty pipeline, move the budget to proven ads rather than leaving a zombie running. Change what killed it: delivery kill → hook or visual; quality kill → angle and ICP language; cost kill → offer and audience; fatigue → a fresh execution of the same concept.

## Creative production math

- **Test throughput** ≈ (monthly budget × 0.20) ÷ (3 × TCPL) a month; delivery kills free budget early, so actual runs ~1.5 to 2× that.
- **Win rates:** iterations on winners ~25%, new concepts ~10%, blended ~1 in 6; plan ~6 tests per winner wanted.
- **Minimum proven-ad inventory** ≈ monthly budget ÷ $5,000 (each proven B2B ad absorbs about $5K a month before fatiguing). You cannot scale budget ahead of creative supply.
- **Iteration priority** on a winner: hook (changes who stops) → visual treatment → format → body copy and CTA. Making those concepts: [ad-creative](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ad-creative/SKILL.md).

## Scaling protocol

Scale only when all hold: proven-ad count meets the next level's minimum; account frequency < 3.0; cost per QL ≤ TCPL for 2+ consecutive weeks; 3+ replacements staged.

- **Rate:** the source's +20% every 5 days (practitioner; see [the corrections above](#what-meta-says-about-learning)).
- **Rollback:** cost per QL > 1.5× TCPL after a step → cut budget 20 to 30%, stabilize 2 weeks, resume at +10% a week.
- **The wall** (account-wide frequency > 3.5, an account-level guardrail distinct from the per-ad bands): widen seed audiences (the source says lookalikes 1% → 2 to 3%), add new seed audiences, test broad, use cross-channel UTM audiences ([ABM.md](ABM.md#cross-channel-utm-remarketing)), reopen remarketing.

## Weekly cadence

Monday is decision day (rolling 14-day data, Stage 2 on every test ad, fatigue on every scaling ad); Wednesday launch day (new tests into freed slots, Stage 1 on day-7 ads); Friday scaling day (scale steps or rollbacks); monthly a creative library audit and TCPL review. The account-wide weekly call is in [AUDIT-GUARDRAILS.md](AUDIT-GUARDRAILS.md#the-weekly-operating-check).

## Lead forms

The main B2B Meta lead-quality problem: auto-filled forms produce leads who don't remember converting ("social amnesia"). Intentional friction buys awareness, and awareness buys quality:

- Use the **Higher Intent** form type (adds a review step), not More Volume.
- **Require work email:** it can't auto-fill from the profile; the source calls it the single biggest quality lever.
- 1 to 3 multiple-choice qualifiers (4+ spikes abandonment), easiest first.
- The confirmation message says what happens next.

Form or page: page converting ≥ 5% → use the page; under ~2% → the form; demos and trials → page; content and webinars → form. Lead form text limits: [ad-creative PLATFORM-SPECS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ad-creative/PLATFORM-SPECS.md#meta).

## Advantage+

"Manual is where you learn; Advantage+ is where you earn." Move a campaign to Advantage+ only with a proven offer, a validated audience and ~50 conversions a week on the optimization event; if 50 is out of reach, optimize a higher-volume event up-funnel and retarget converters. Advantage+ conflicts with strict ABM: it won't stay locked to a list ([ABM.md](ABM.md#abm-on-meta)).

The source says to watch Campaign Score "directionally (70+ healthy, <50 = fighting the algorithm)" and never trade lead quality for it. The bands are practitioner: Meta's campaign score and account opportunity score run 0 to 100, and Meta says a high score "does not reflect or guarantee your actual or future performance" (https://www.facebook.com/business/tools/opportunity-score).

## Partnership ads

Everything above optimizes conversion inside an audience Meta already reaches; partnership ads (branded content run from a creator's handle) are how the source reaches a net-new one. Its reasoning, practitioner and not in Meta's docs: Andromeda targets by persona, and a creator's following is a pre-assembled persona the ad inherits. It calls them the single highest-leverage lever on Meta and a scaling move, not a test; a weak one is usually the wrong creator, not the wrong hook.

1. **Pre-test before you promote:** let the creator's content run organically or in a cheap test, and promote only pieces that already earn saves, shares and watch-through.
2. **Pick for persona overlap, not follower count:** 15K followers who are exactly your buyer beat a 500K generalist.
3. **Deal basics:** branded-content partner access to run ads from the creator's handle, usage rights for a defined window (typically 3 to 6 months, renewable) plus paid-amplification rights, a flat content fee with per-deliverable pricing for extra cuts; avoid pure revenue share on cold creators.
4. **Commission low-fi statics per creator** (screenshot-style, "how they'd post it to their own story"): the video reaches cold viewers, the statics convert mid-funnel under the same face.

Disclosure, contracts, usage rights and Meta's partnership-ad setup are in [creator-marketing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/creator-marketing/SKILL.md); app-growth's creator plan is in [app-growth LAUNCH-AND-MARKETING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/LAUNCH-AND-MARKETING.md). Which creator formats to run: [ad-creative FORMAT-TIERS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ad-creative/FORMAT-TIERS.md).

## Rolling reach

Rolling **month-over-month reach** (unique people reached) is the account's net-new-audience gauge: CPL and ROAS can look fine while you recycle a shrinking pool. Track it monthly with the TCPL review; falling reach moves before frequency crosses 3.5 and before CPMs spike. Trigger: reach declining month over month → deploy partnership ads before the fatigue bands force it. A steady 40 ROAS with rising frequency and flat growth is a reach problem, not a conversion problem [coreyhaines31/marketingskills, ads, evals #9].

## Andromeda practice

The source says Meta "launched the Andromeda algorithm in 2025"; Meta's engineering blog announced it on 2024-12-02 (https://engineering.fb.com/2024/12/02/production-engineering/meta-andromeda-advantage-automation-next-gen-personalized-ads-retrieval-engine/). Everything in this section is practitioner [coreyhaines31/marketingskills, ads, meta-andromeda-playbook.md]; it sharpens app-growth's "Interest targeting shrinks over time on Meta: creative matters more" [appeeky] ([app-growth META-ADS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/META-ADS.md#audiences-and-placements)).

- **Creative volume is the constraint.** Statics often beat video because Meta can show more per session and they're far cheaper to make; the source reports advertisers whose native statics beat long-production VSLs. It sets aside an hour a week for fresh creative on the winning offer.
- **Creative is the targeting.** Target broadly (just the country) and let the creative find the buyer; long-form copy gives delivery more context. Test: duplicate your best interest-stacked ad, remove all targeting except country, run both 7 days, compare CPA.
- **Identity-trigger keywords.** Duplicate a winner with a niche word in the headline: "Here's how to get 462 leads per week on autopilot" → "462 **dental** leads". The word is an identity trigger for the viewer and a signal for delivery.
- **AI variants of a winner.** The source's prompt, verbatim: "I want you to read this ad and be the author. If I show the next ad I'm going to ask you to write to 100 people, not 1 in 100 would be able to tell you it's written by a different person. Now write this for [demographic/niche]." Apply to body copy, then headlines, then creative, and drop the variants into one CBO. Limit: variants this close count as one concept; use them to localize a winner, not as testing volume.
- **Zombie campaigns.** After a CBO, most variants get no spend; relaunch the ones you have high conviction about in a separate ad set. The source reports about 20% come back as winners.
- **Don't make ads look like ads.** Study what performs natively in the niche on TikTok, Instagram and YouTube and match it. The source builds a fresh research account that follows the niche's creators so the feed shows what wins; keep any such account within each platform's account rules. An organic video with millions of views can run as a paid ad.

## Creator ads at volume

Wispr Flow went from about 100 to over 3,500 ads in its Meta account in nine months (October 2026, per its head of performance marketing, as the source reports):

- **Meta groups ads it judges too similar** (practitioners put the line at roughly 60% similarity) and limits their delivery. A hundred creators making the same talking-head video are one concept, and copies of a winner pull reach from it.
- **Plan on three axes:** one **concept** (a single product truth), one **angle** (saves time at work, works with my tools), one **awareness level** (new to the category, or a power user). The matrix shows which feature, said which way, to whom, is winning.
- **Optimize for a quality event:** the action that predicts a retained user (Wispr Flow uses words dictated past a habit threshold); too rare to optimize on → optimize up-funnel and judge on it anyway. Apps make the same rule: [app-growth](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/SKILL.md#the-rules).
- **Test the funnel inside Instagram's in-app browser before spending:** swipe up from a real preview on a phone; the page loads, the promise matches the creator, every event lands in analytics. Desktop Safari doesn't count.
- **Read the funnel stage by stage:** strong hook and hold but no clicks → the ad didn't earn the swipe; clicks but no conversions → the page breaks the creator's promise; low-quality customers → targeting and structure, try cost caps.
- **About five days per ad before judging;** a Friday launch meets a different audience than a Monday one. A testing winner can die at a scaling budget an order of magnitude larger: graduate in steps.
- **Keep a lessons file that feeds the briefs** ([marketing-loops](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-loops/SKILL.md)).

## Benchmarks and seasonality

B2B SaaS on Meta, practitioner: CTR 1.0 to 1.5% (red flag < 0.8%, which matches app-growth's link CTR floor); CPM $10 to 20 (red flag > $25); form CPL $20 to 50 (red flag > $75); page CVR 8 to 12%. Q1 CPMs are the year's lowest; Q4 runs +60 to 80%, so the source banks B2B budget for January. Recalibrate on your own first 30 days.

## Prove it

A test plan shows TCPL and how it was set, the ad-count ceiling, Stage 1 and Stage 2 gates with the 3× TCPL data gate, and graduation criteria; no plan adds new ads to a learning ad set as a way to avoid a reset or calls a 20% budget step Meta's rule; asked about a plateau with rising frequency, the answer checks rolling reach and proposes partnership ads with pre-testing, persona fit, rights and companion statics [coreyhaines31/marketingskills, ads, evals #9].
