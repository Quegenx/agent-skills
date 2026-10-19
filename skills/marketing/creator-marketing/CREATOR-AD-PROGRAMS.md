# Performance-paid creator ad programs

Creators make videos for your paid accounts and are paid on how those ads perform. It differs from the volume UGC program in [UGC-PROGRAMS.md](UGC-PROGRAMS.md): there, creators post organically from brand-affiliated accounts; here every video is a paid-ad candidate and the creator's audience size doesn't matter. Text is from coreyhaines31/marketingskills `influencer-marketing` (`references/paid-ads-creator-program.md`, MIT); payment models and contract terms are from lightreel.ai's program guide, tagged `[lightreel]`. Campaign setup, Meta's grouping of similar ads, and creative testing are in [paid-ads SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/SKILL.md) and [ad-creative SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ad-creative/SKILL.md).

## The source case

`[coreyhaines31/marketingskills, influencer-marketing]` Wispr Flow's head of content and head of performance marketing described their program publicly in October 2026. They launch 500 to 700 creator ads a month and grew their Meta account from about 100 ads to over 3,500 in nine months, and from 5 to 50 active creators in four months; some of their best creators have about a thousand followers. "Figures below are theirs; treat them as one program's settings, not benchmarks."

## How the model works

`[coreyhaines31/marketingskills, influencer-marketing]`

1. A creator joins your program and makes videos to a brief.
2. You launch the videos as ads (Meta, TikTok, AppLovin and so on).
3. The creator earns a share of results: **a percentage of ad spend** behind their videos (SaaS and long sales cycles) or **a percentage of revenue** (ecommerce, where purchases attribute cleanly).

The brand pays nothing up front for creative that never spends, and usage rights and whitelisting are settled once, in the program terms, instead of per creator. Creators are motivated to make many videos and to make them different, because their videos compete for spend. Wispr Flow runs this on Tribe; the model doesn't depend on the platform. What you need is per-video spend or revenue reporting the creator can trust.

## Setting the rate

`[coreyhaines31/marketingskills, influencer-marketing]` Wispr Flow pays **7% of ad spend**. Set yours from your CAC: the commission is a cost on top of media, so at 7% "a $100 CAC from spend becomes $107". Too high and it eats your margin as you scale; too low and good creators leave. At 7%, a creator needs about $14,300 a month of spend behind their videos to earn $1,000 (1,000 ÷ 0.07 = 14,286). Early on almost nobody gets there, which is why the floor below exists.

## The guaranteed minimum

`[coreyhaines31/marketingskills, influencer-marketing]` Wispr calls it a "smart retainer": a monthly minimum a creator earns if they hit a video quota. If commissions fall short, you top them up to it; once commissions pass it, the creator keeps commissions only.

| Month | Quota met? | Commissions | Minimum | You pay |
|---|---|---|---|---|
| 1 | Yes, 25 videos | $500 | $1,000 | $500 top-up + $500 commissions = $1,000 |
| 2 | Yes | $3,000 | $1,000 | $3,000 commissions, no top-up |
| Any | No | $400 | $1,000 | $400 commissions only |

The minimum lets you recruit good creators before you have history, reviews or payouts on a platform, and tells the creator you're betting on them. The goal is that a creator outgrows it.

## Recruiting small

`[coreyhaines31/marketingskills, influencer-marketing]` The common failure is recruiting hundreds of creators who don't care about the product: you get thousands of near-identical talking-head videos, and Meta clusters ads it judges too similar and limits their delivery. Volume without variety buys nothing.

- **Start with 4 to 5 creators chosen to fill gaps** in your ad library: a format you haven't tried, a buyer you haven't reached, a region or language you don't speak to yet.
- **Recruit off-platform at first.** A new brand on a creator marketplace has no reviews or payout history, so good creators skip it; Wispr Flow says it accepted only 5 to 7 creators from about 7,000 marketplace applications.
- **Instagram keyword search** ("UGC", "UGC creator", "tech", "SaaS"), then the matching creators' following lists, followers and commenters. The source sends "100-200 personal DMs over a few days"; send them by hand and within Instagram's messaging limits and Community Guidelines.
- **Recruit fans first.** A creator who already uses the product doesn't need it explained. Audience size is not a quality signal for ad creative.
- **Pay referral bonuses for peers:** Wispr Flow pays $100 when a creator brings in someone at or above their level.

## Grow in stages, then cap

`[coreyhaines31/marketingskills, influencer-marketing]` Grow 5, then 10, 20, 40. At 40 to 60 active creators, stop growing and only add people who fill a gap or raise the quality bar; faster growth breaks the coaching and community that keep good creators. Creators compare programs: one that paid $100,000 across 20 creators looks like more opportunity than one that paid $200,000 across 1,000.

## Run it like a sales team

`[coreyhaines31/marketingskills, influencer-marketing]` Programs that treat creators as interchangeable churn their best people.

- **Coaching:** creator coaches run calls and check in; the head of content shares a calendar link for strategy questions.
- **A weekly call with the media buyer:** what's working in the account, new buyers to target, experiments to try.
- **Bonuses and prizes** creators value: cash, camera gear, microphones.
- **In-person time** for top creators once the program is established.

## Briefing

`[coreyhaines31/marketingskills, influencer-marketing]` Don't hand creators a script. Give four things:

1. **The one person** they're talking to (a real estate agent, a developer, a student).
2. **The situation** that person is in.
3. **The promise:** the one product truth this video argues.
4. **One piece of proof** that ties it together.

"One problem, one person, one way." A 15-second ad that tries to carry five value propositions to five audiences carries none. Give each video an assignment, like "show the workflow that answers *why pay when dictation is built in and free?*" Mine those objections from reviews, Reddit, support tickets and your own ad comments. App-growth's TikTok creator brief hands creators "the exact 2 second hook script" `[appeeky]` ([app-growth TIKTOK-ADS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/TIKTOK-ADS.md#production)); the two views are compared in [PROGRAMS.md](PROGRAMS.md#the-creative-brief).

## Keep creators off the copy treadmill

`[coreyhaines31/marketingskills, influencer-marketing]` Creators who run out of ideas copy whatever tops the leaderboard. Meta groups the copies with the original, so they don't break out and the original's reach suffers too. Tell creators the people at the top got there by testing new formats, not by repeating one. `[lightreel]` saw the same in organic feeds: of many near-identical frustration-to-app videos, one take reaches and the rest are interchangeable; vary the wording, emotion or use case.

## Payment models and contract terms

`[lightreel]`:

| Model | What it buys |
|---|---|
| Flat fee | Labor and agreed rights; best for first tests |
| Retainer | Capacity, not results |
| Performance | A % of paid-media spend or of attributable GMV, with creator-specific tracking parameters; shifts risk to creators who don't control the offer, landing page, targeting or auction |
| Hybrid "smart retainer" | A guarantee that is a floor against performance earnings (above) |
| Affiliate | Commission on attributed sales ([referral-programs SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/referral-programs/SKILL.md)) |
| In-kind | Product; should not replace production fees and ad rights |
| Equity or token | Experimental: vesting, dilution, liquidity, tax |

For performance pay, the contract defines attribution, reporting access, payout timing, minimum media-testing obligations, how paused ads are treated, and what happens when the brand changes the offer or landing page. Price production, stills, raw footage and paid usage as separate rights. `[coreyhaines31/marketingskills, influencer-marketing]` adds: put usage rights, whitelisting, the commission basis, how spend is reported to creators, and the minimum and quota in writing before the first video.

## Compliance

`[coreyhaines31/marketingskills, influencer-marketing]` Creator ads are paid endorsements: they carry the platform's paid-partnership or "Sponsored" labeling and the creator's own disclosure ([DISCLOSURE.md](DISCLOSURE.md)). Creators must actually use the product for any claim of personal experience, and results claims need the same substantiation as any ad (16 CFR 255.1(c), Example 5). On Meta, boosting a creator's post needs the creator's "Allow brand partner to boost" toggle and the paid partnership label, or a partnership ad code ([DISCLOSURE.md](DISCLOSURE.md#platform-tools)).

## Prove it

The commission rate was set from CAC with the cost per acquisition after commission written down; the minimum, quota, commission basis, spend reporting and usage rights are in each creator's terms before the first video; the cohort started at 4 to 5 creators chosen for named gaps and is capped; each brief names one person, situation, promise and proof; creators see per-video spend or revenue; and every ad carries the platform label and the creator's disclosure.
