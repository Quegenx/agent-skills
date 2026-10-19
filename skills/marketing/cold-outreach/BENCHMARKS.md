# Benchmarks

Every number here is vendor data as [coreyhaines31/marketingskills, cold-email] references/benchmarks.md reports it. The source's own warning: "Almost every public cold email benchmark comes from a vendor that sells sending, data, or agency services, and each measures differently (some count auto-replies as replies, some don't). Use these as ranges, and judge yourself against your own baseline." Where the source names no origin for a figure, it says so below; none of these were verified.

## Core metrics

| Metric | Average | Good | Excellent | Origin the source gives |
|---|---|---|---|---|
| Reply rate | about 3.4% | 5.5%+ (top quartile) | 10%+ (top decile) | Instantly, 2025 sends (published 2026) |
| Reply rate, signal-based small segments | | 2 to 3 times your static-list rate | | "Inferred from several 2025-26 vendor datasets; claims of 15-25% are unverified" |
| Share of replies from email 1 | about 58% | | | Instantly 2026 |
| Meetings booked | 0.5 to 1% of contacts | 1 to 2% | 2.5%+ | Reachoutly, Cleverly |
| Bounce rate | | under 2% | under 1% | See [SENDING.md](SENDING.md#verify-before-you-send) for the conflicting targets |
| Spam complaints | | under 0.1% | | Gmail: below 0.10%, never 0.30% (https://support.google.com/a/answer/81126) |

**Don't use open rate:** Apple Mail Privacy Protection opens tracked mail automatically, and Gmail says "Google doesn't track open rates" (https://support.google.com/a/answer/14229414). Measure replies, positive replies and meetings.

## Funnel

The source's model: 1,000 contacts → about 34 replies (3.4%) → about 10 to 15 positive (30 to 45% of replies) → about 5 to 8 meetings → 1 to 2 customers; "roughly 100-200 contacts per meeting" on a static list. For signal-based segments it gives 30 to 60 and labels that "an estimate from the ranges above, not a measured benchmark".

## Levers

The source ranks these by impact without naming the datasets: hook type ("Timeline hooks outperform problem hooks by 3.4x in meetings"); personalization depth; brevity (25 to 75 words, "83% more replies under 75 words"); targeting precision ("≤50 contacts per campaign = 2.76x higher reply rates"); follow-up strategy ("First follow-up adds 49% more replies"); reading level (3rd to 5th grade, "67% more replies"); send timing ("Thursday peaks at 6.87% reply rate").

## Trend

The source: reply rates fell from 7 to 8% (2020 to 2022) to roughly 3.5 to 5.8% (2024 to 2025 datasets), driven by inbox saturation, stricter anti-spam rules and the AI email flood; "the gap between average and excellent is widening".

## By seniority, industry and region

Origins not named in the source.

- **Seniority:** entry level 8% reply; C-level "23% more likely to respond than non-C-suite when they engage (6.4% vs 5.2%)"; CTOs and VPs of technology 7.68%; CEOs and founders 7.63%; heads of sales 6.60% ("most targeted role, highest saturation").
- **Industry:** highest nonprofits (16.5%+), legal (10%), EdTech (7.8%), chemical (7.3%), manufacturing (6.1%); lowest SaaS (3.5%), financial services (3.4%), IT services (3.5%).
- **Region:** North America 4.1%, Europe 3.1%, Asia-Pacific 2.8%.

| Factor | US | UK | Germany and DACH | Scandinavia |
|---|---|---|---|---|
| Tone | Direct, casual | Polite, professional | Precise, data-driven | Fact-based, egalitarian |
| Length | Shorter, blunt | Longer, insight-led | Detail-oriented | Concise but substantive |
| Social proof | Outcome numbers | Research-led credibility | Technical precision | Shared values |

Region decides more than tone: whether a cold email may be sent at all in the EU, the UK, Germany, Canada or Australia is in [email-practices COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/COMPLIANCE.md#cold-and-unsolicited-email). The source's only legal remark here was "GDPR affects European tone."

## The top mistakes

[coreyhaines31/marketingskills, cold-email] Ranked by the source: too long; too self-focused ("Count I/We sentences"); no clear value proposition; generic templates; feature dumping; false personalization ("Loved your post!" without specifics); asking too much too soon (a 30-minute call in the first email); pushy language; no CTA; "just checking in" follow-ups; the wrong tone for the audience; jargon; unsubstantiated claims ("300% more leads" without proof); too many contacts per company (the source: "1-2 people = 7.8% reply; 10+ = 3.8%"); fake urgency (fake "Re:" or "Fwd:", countdown timers).

## Named methods

[coreyhaines31/marketingskills, cold-email] The source's quick reference, kept as attribution of each method to its author:

| Expert | Core method | Best for |
|---|---|---|
| Alex Berman | 3C's: compliment → case study → CTA | High-ticket B2B services, agencies |
| Josh Braun | "Poke the Bear": neutral questions exposing invisible problems | Empathy-driven consultative selling |
| Kyle Coleman | Systematic research + AI personalization at scale | Bridging mass outreach and deep personalization |
| Becc Holland | Psychographic personalization, Premise Buckets | Combining personalization with relevance |
| Will Allred | Data-driven coaching, Mouse Trap, Vanilla Ice Cream | Universal frameworks |
| Justin Michael | 1 to 3 sentence hyper-brevity, quote their own words | High-velocity SDR teams |
| Sam Nelson | Agoge Sequence: a triple touch on day 1 (email + LinkedIn + call) | Multichannel, tiered personalization |

The frameworks themselves are in [COPY.md](COPY.md#frameworks). Two views in the same source: the Agoge triple touch puts three channels on day 1, while its cadence rules in [SEQUENCES.md](SEQUENCES.md#rules-that-hold-any-cadence-together) allow two channels on one day only for a voicemail and its recap.

## Prove it

Every benchmark you quote names its origin and year or says "origin not named"; you compare against your own baseline after a few hundred sends rather than against these; open rate appears nowhere in the report; and reply, positive-reply and meeting rates are reported per play and per channel.
