# Payback: can this channel pay for itself

The gate before every channel decision. Advertising has to be deterministic: $1 in, more than $1 out, on a clock you can name, and payback period sets the clock. From [coreyhaines31/marketingskills, ads, payback-period.md] (MIT), which cites Corey Haines, *Founding Marketing*, ch. 7 ("Spend budget where customers spend their time"); its payback targets and churn finding are practitioner. App subscription economics (store fees, trials, MMP data) are in [app-growth BUDGET-AND-ROAS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/BUDGET-AND-ROAS.md); revenue metric definitions in [stripe](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/SKILL.md); plan and price structure in [pricing-strategy](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/pricing-strategy/SKILL.md).

## Why LTV:CAC misleads

The source calls LTV:CAC "a useless, often destructive metric" for four reasons:

1. **It assumes all customers churn.** LTV writes an eventual death into every account; your best customers compound.
2. **It assumes churn is evenly timed.** The source cites Baremetrics data that more churn happens in the first 3 months than in any other window (a practitioner citation, not checked). A blended LTV smears that spike flat.
3. **It hides per-plan variance.** A $9 plan and a $999 plan averaged into one number describe neither, and "3:1, we're fine" scales the wrong one.
4. **It ignores revenue delay.** Free trials, free plans and long sales cycles mean cash arrives weeks or months after CAC is spent.

A "healthy" 3:1 can sit on top of a channel that runs you out of cash, because the ratio never asks when the cash comes back.

## Gross-margin payback

- **Revenue-only ratio** = CAC ÷ monthly ARPU. It assumes 100% gross margin.
- **Gross-margin payback** = CAC ÷ (monthly ARPU × gross margin), margin as a fraction. The source points to ChartMogul's CAC payback definition (https://chartmogul.com/saas-metrics/cac-payback/).

The result is in months and assumes steady monthly gross profit with no churn or collection delay. The source treats a 3 to 12 month target as a planning reference only: choose yours from cash runway, margins and cohort recovery.

Same CAC, $300, very different payback (revenue-only, before serving costs and churn):

| Plan | Monthly ARPU | CAC ÷ ARPU | Verdict |
|---|---|---|---|
| Starter | $9 | 300 / 9 = **33.3 months** | Don't fund paid acquisition for it; longer once margin is in |
| Pro | $99 | 300 / 99 = **3.0 months** | Check margin first: 3.8 months at 80%, 15.2 at 20% |
| Enterprise | $999 | 300 / 999 = **0.3 months** | Scale, after confirming when cash is collected (annual invoices, net-60 terms) |

At 20% margin the $99 plan takes 300 / (99 × 0.20) = **15.2 months** before churn, despite its 3.0-month revenue-only ratio. Compute per plan or per cohort, against measured margin, retention and cash timing.

**Repo comparison.** app-growth's [appeeky] formulas are revenue-only: "Payback days | `Target CPA / (MRR / active_subscriptions / 30)`" ([app-growth BUDGET-AND-ROAS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/BUDGET-AND-ROAS.md#subscription-snapshot)) and TikTok's "payback CPA / (LTV / expected lifetime months) under 3 months" ([app-growth TIKTOK-ADS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/TIKTOK-ADS.md#audits)). Read them as the revenue-only ratio above; for a spend decision add gross margin (and, for apps, the store fee) and the cohort path below.

## Cohort recovery

`CAC / (ARPU × annual retention)` is not discounted payback: one year-end retention number can't show the monthly recovery path, and discounting needs an explicit discount rate. For a cohort, find the first month where cumulative gross profit per original customer covers CAC:

```
Cumulative recovery through month n = sum(ARPU_t × gross_margin_t × retained_fraction_t)
```

Use measured retained revenue per original customer when you have it, and don't multiply by retention again. Include collection delay for cash recovery. If the cohort hasn't recovered CAC yet, report that rather than inventing a date.

Example: CAC $300, ARPU $99, 80% margin, two cohorts both at 70% retained at month 12:

- **Early loss** (70% retained every month 1 to 12): $99 × 0.8 × 0.7 = $55.44 a month; recovery first crosses $300 in **month 6**.
- **Late loss** (100% through month 11, 70% at month 12): $79.20 a month for eleven months; crosses $300 in **month 4**.

The single-retention ratio gives both about 4.3 months and ignores margin; their recovery differs despite identical year-end retention.

## The channel gate

1. Compute CAC for the channel, all-in (spend ÷ customers, including creative and management).
2. Compute gross-margin payback and check the measured cohort recovery path, with collection timing.
3. Compare with runway and your chosen target. Don't scale on a revenue-only ratio or an annual retention multiplier.
4. Re-run monthly; CAC drifts up as you scale.

Breakeven CPL and CPC ([B2B-ACQUISITION.md](B2B-ACQUISITION.md#breakeven-cpl-and-cpc)) say the most you can pay per lead; payback says how long your cash is tied up. You need both. Blended CAC inputs come from [marketing-attribution](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-attribution/SKILL.md).

## Two adjacent opinions

The source's, tagged as opinion: out-of-home (billboards, transit, print) "without social amplification is a waste of money", because it has no click or pixel and pays back only when built to be photographed and shared; and ads that carry a story forward, each line earning the next, outperform restated pitches, tested one variable at a time ([ad-creative](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ad-creative/SKILL.md)).

## Prove it

Asked "LTV:CAC is 3.4:1 with a $9 and a $999 plan at $300 CAC, can we pour more into Meta?", the answer computes 33.3 and 0.3 months revenue-only per plan, asks for gross margin and per-cohort retained revenue, doesn't call an annual retention multiplier discounted payback, and checks collection timing and runway before any scale approval; at 20% margin the $99 plan comes out at 15.2 months [coreyhaines31/marketingskills, ads, evals #11, #14].
