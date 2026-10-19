# Reading Google Ads data

Load this before analyzing, auditing or reporting on a Google Ads account, or before deciding to pause, keep or scale anything in one. [AUDIT-GUARDRAILS.md](AUDIT-GUARDRAILS.md) covers how to grade what you find; this file covers how the data misleads you first. Google Ads reports are partial by design and plausible by accident: default views omit data without saying so, names suggest contents they don't have, and small accounts produce numbers that look like findings. From [coreyhaines31/marketingskills, ads, reading-google-ads-data.md] (MIT). The API field and enum names below come from the source; only the `change_event` 30-day range and its Editor exclusion were checked against Google's page (https://developers.google.com/google-ads/api/docs/change-event), so confirm the rest in the current API reference before relying on them in code.

## What the data hides

### Search terms are a sample, not the total

Google withholds queries searched by too few people. The source: "On low-volume accounts, 50 to 65% of clicks routinely have no disclosed search term" (a practitioner figure; Google itself says only that low-volume terms are withheld for privacy). The visible terms are a non-random sample skewed toward common searches.

- Any claim about what a campaign is buying carries the ratio: *of the 13 clicks Google discloses, out of 33 total.*
- Pull the report **unfiltered first.** Filtering `clicks > 0` also drops every impression-only term, and with a low `LIMIT` it hides most of the picture.
- **Nothing recovers the withheld queries.** The query is never passed to the site, so GA4, PostHog or a CRM joined on gclid shows what each session did, never what was typed.

```
disclosed clicks = SUM(clicks in the search terms report)
total clicks     = campaign clicks for the same window
withheld         = total - disclosed
```

### Names describe intentions, not contents

An ad group called "Competitor - Commercial" can hold only informational keywords. Read the keyword list and the search terms; treat every name as a label someone typed once.

### "Conversions" is several things in one column

`metrics.conversions` counts actions marked primary, plus any secondary action a campaign's custom goal pulls in; `metrics.all_conversions` adds the rest. Check campaign goals as well as action settings: one campaign's conversions can mix a page-view proxy, a trial signup and a booked demo.

- Segment by conversion action before calling anything a lead or a demo.
- Check each action's attribution model and click window.
- Data-driven attribution runs on low volume too, but with few conversions its credit assignments are soft; don't read much into one campaign's share.

### One ad group can send traffic to several pages

Ads carry their own final URLs, and stale pages linger in rotation after a new page ships. Check which destinations serve and how traffic splits before concluding anything about a landing page.

### Dates are click dates

Conversions are attributed back to the click, so one recorded today can appear dated a week earlier. When a client says "we got a conversion today" and your pull says the 11th, both are right: say "clicked on the 11th."

### Identical campaign names are usually experiment arms

Expired experiment arms inherit the base name and can stay ENABLED while serving nothing. Check `campaign.experiment_type` and `campaign.serving_status` before believing a duplicate exists.

### Change history is short: 30 days with detail, 90 without

`change_event` (field-level before and after) covers 30 days; `change_status` covers 90 days but only says which resource changed. Past that the API has nothing, so a shift four months ago may have no recoverable explanation: say so instead of guessing one.

### Other people are changing the account

Client staff, automated rules, scripts and agents all leave changes. In `change_event`, `client_type` names the client: `GOOGLE_ADS_WEB_CLIENT` (the UI), `GOOGLE_ADS_API`, `GOOGLE_ADS_SCRIPTS`, `GOOGLE_ADS_AUTOMATED_RULE`, `GOOGLE_ADS_BULK_UPLOAD`, `GOOGLE_ADS_RECOMMENDATIONS`, `INTERNAL_TOOL` (Google-side tooling), and others in the enum. Report the client, not a guess at who or why. The source says Google Ads Editor changes "aren't returned at all"; Google's wording is narrower: "Fetching Google Ads Editor changes using the change_event report is not supported", and it points to change status for them (https://developers.google.com/google-ads/api/docs/change-event). A missing edit in `change_event` doesn't mean nobody made one. A repeating weekday-and-time pattern under one user is a scheduled job.

## The window is not the picture

A 30-day pull on a campaign running since spring is a slice of a longer series.

- **Establish how long it has run** before quoting efficiency; quote recent and lifetime when they diverge.
- **Don't pool across configuration changes.** If bids, keywords, budget, ads or targeting changed mid-window, the period is several experiments averaged.
- **Bid-only changes** invalidate cost and volume comparisons but leave intent and audience questions readable.
- **Bid strategies in learning are unreadable:** `primary_status = LEARNING` means don't judge or optimize on it. Fixing a verified break (tracking down, wrong URL) still comes first.

## Small numbers

Most false findings in small accounts are sample-size errors. Skepticism runs both ways: one conversion on one click proves no more than zero on five disproves.

Zero conversions in N clicks only rules out conversion rates at or above (95% confidence):

| Clicks | Rules out CVR ≥ | What you can say |
|---|---|---|
| 5 | 45% | Nothing. Zero is the expected outcome |
| 10 | 26% | Still nothing useful |
| 30 | 10% | Can begin doubting a strong CVR |
| 50 | 6% | Meaningful for high-intent search |
| 100 | 3% | Underperforming if break-even CVR is above 3% |

The table rounds the exact one-sided 95% zero-event binomial upper bound, `1 - 0.05^(1/N)`, under independent Bernoulli trials; at N=5 this is about 45.07%. This file formerly called it the rule of three: `3/N` is an approximation and gives 60% at N=5, not the table's 45% ([NIST exact binomial limits](https://www.itl.nist.gov/div898/software/dataplot/refman2/auxillar/exacbino.htm); [Jovanovic and Levy, rule of three](https://doi.org/10.1080/00031305.1997.10473947)). Before calling spend wasted, work out what it would have to convert at:

```
break-even CVR = CPC ÷ target CPA
```

If break-even CVR is below the plausible range for that traffic, the term isn't failing, it's unmeasured. Then estimate how long a readable sample takes at current click volume. "Let it run" is honest only with a date you'll actually know by; at five clicks a month, sometimes you never will.

## Documents describe a day; accounts move

Audits, status docs and proposals were true when written; every performance number in them is stale until re-pulled. The claims most often repeated confidently ("zero conversions", "wasted spend", "wrong intent") are the ones that change. Carry the date: *as of the audit on the 2nd*.

## Stating findings

- **Verified:** pulled live this session, unfiltered, reconciled against a total.
- **Inferred:** reasoned from verified data; could be wrong.
- **Stale:** from a document, an earlier session or the client, with its date.

Keep stale claims out of client-facing sentences unless labeled. **The test before anything reaches a client: can they disprove this in a minute with their own account access?** Volunteer the limits first (the disclosed-clicks ratio, the sample size, the config changes); they'd find them anyway, and it makes the rest credible.

If a claim touches a landing page, open it. Calendar embeds and chat widgets load through JavaScript and won't show in a static fetch, so their absence there isn't evidence; render the page ([browser-automation](https://github.com/Quegenx/agent-skills/blob/main/skills/web-automation/browser-automation/SKILL.md)). When a client challenges a finding and is right, concede the substance plainly and move on; stacked retractions cost more than the original error.

## Conclusions that sound right

| Sounds like | Usually |
|---|---|
| "This campaign has zero conversions" | True on the day the doc was written |
| "The search terms are junk" | You're seeing ~40% of the clicks |
| "That ad group is wrong-intent" | It's *named* that; the keywords say otherwise |
| "$X wasted on those terms" | Below any readable sample size |
| "It converted, so the term works" | One conversion on one click is noise |
| "Performance declined in August" | Bids changed three times that month |
| "Traffic lands on the new page" | Two ads serve; one points at the old page |
| "It got a demo" | It got a conversion; check which action |
| "There are duplicate campaigns" | Expired experiment arms with the base name |
| "Nobody touched it last quarter" | Change history only covers 30 days |

## Prove it

Every claim in a report carries Verified, Inferred or Stale; every search-terms claim carries disclosed and total clicks; every "wasted" claim shows break-even CVR against the zero-in-N table; a "let it run" carries a date; and a client draft about 13 disclosed clicks out of 33 states that ratio and doesn't call the campaign mostly junk [coreyhaines31/marketingskills, ads, evals #12, #13].
