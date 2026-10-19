# Google Search, Shopping and Performance Max

Intent-first operating rules for Google Ads: where to spend first, how to structure the account, when to loosen match types, how to keep smart bidding pointed at revenue instead of junk form-fills, and the output spec for responsive search ads. From [coreyhaines31/marketingskills, ads, google-search-playbook.md and rsa-output-spec.md] (MIT; the playbook credits Ivan Falco's ads-skills, and its benchmarks are practitioner starting points). Google's own rules are quoted with their URLs and win where they differ. App campaigns: [app-growth GOOGLE-APP-CAMPAIGNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/GOOGLE-APP-CAMPAIGNS.md).

**Contents:** [The intent ladder](#the-intent-ladder) · [Brand bidding and the pause test](#brand-bidding-and-the-pause-test) · [Capture before you create](#capture-before-you-create) · [Account structure](#account-structure) · [Keywords and match types](#keywords-and-match-types) · [Negative keywords](#negative-keywords) · [The weekly search-terms pass](#the-weekly-search-terms-pass) · [Bidding by conversion volume](#bidding-by-conversion-volume) · [Offline conversions](#offline-conversions) · [Quality Score and landing pages](#quality-score-and-landing-pages) · [Performance Max](#performance-max) · [Benchmarks and the weekly scorecard](#benchmarks-and-the-weekly-scorecard) · [RSA limits](#rsa-limits) · [RSA output spec](#rsa-output-spec) · [Prove it](#prove-it)

## The intent ladder

Spend opens rung by rung; each unlocks only after the one below proves it converts to pipeline:

1. **Brand:** "they want you" (brand name, brand + pricing or login). Cheapest clicks, highest conversion. Always on.
2. **High-intent non-brand:** ready to buy ("cold email software", "best CRM for agencies"). The profit center; most budget lives here.
3. **Competitor:** evaluating alternatives ("[competitor] alternative", "vs"). Higher CPC, lower CVR; run selectively with dedicated comparison pages ([comparison-pages](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/comparison-pages/SKILL.md)).
4. **Problem-aware:** has the problem, isn't shopping ("how to scale outbound"). Longer payback; only after rungs 1 and 2 work.
5. **Demand gen and awareness:** broad, Display, YouTube. Last, with spare budget.

"Don't skip rungs." Broad spend before high-intent proof is how B2B accounts burn budgets with nothing in the CRM.

## Brand bidding and the pause test

Bid on brand by default, or competitors will. The exception: if you're the only bidder and organic owns the whole results page, test pausing brand and watch **total brand conversions (paid + organic)**, not just paid. If the total holds, you were paying for clicks you'd have had; if it drops, turn it back on. Cap the brand budget and never share it.

## Capture before you create

Search harvests existing demand; it cannot create it. If the category has near-zero search volume, say so and put the budget upstream (LinkedIn, Meta, YouTube) instead of forcing keywords nobody types.

## Account structure

Minimum split, each with an **independent budget**: Brand (never shared); Non-brand high-intent (themed ad groups by solution); Competitor (its own budget and messaging); Remarketing (separate from Search). In a shared budget the cheapest, highest-converting campaign (always brand) starves the ones you need data from.

- **Themed ad groups, not SKAGs:** 5 to 15 closely related keywords with one intent and one promise; split when two keywords need different pages. 2 to 3 RSAs per group.
- **Consolidate:** a campaign that can't reach ~15 to 30 conversions a month can't feed smart bidding; merge it.
- **Settings on every new Search campaign:** Search Partners and Display Network off until proven. Location: the source sets **"Presence"** because "the default 'presence or interest' serves people merely interested"; Google confirms the default advanced location option is presence or interest (https://support.google.com/google-ads/answer/1722038, https://support.google.com/google-ads/answer/2453995). Language: Google's specialized page announces removal of the Search language setting from September 2026, with Search matching the ad language; PMax Search follows this while selected languages still affect its non-Search channels, and Shopping is unaffected (https://support.google.com/google-ads/answer/1722078?hl=en). The source and this file formerly used an interface/browser-language-only explanation; the generic settings page still has that older wording (https://support.google.com/google-ads/answer/1704395).
- **Consolidate query routing:** the source recommends one home per query, using negatives to control routing. Its explanation that duplicate keywords "bid against your own account" was wrong: Google selects one eligible keyword for the same domain, and those keywords do not compete against each other in the auction (https://support.google.com/google-ads/answer/2756257?hl=en). Consolidation remains the source's operating preference. [coreyhaines31/marketingskills, ads/references/google-search-playbook.md]

## Keywords and match types

Source keywords from how buyers describe the problem (sales calls, your search terms report, competitor ad copy), not how you describe the product; 50 searches a month with clear intent beat 5,000 with mixed intent. Tag every keyword by intent rung.

1. Start high-intent terms on **Phrase + Exact** (Exact still matches close variants; Phrase is the B2B workhorse), on manual CPC or Maximize Conversions while volume is low.
2. Mine the search terms report weekly (below).
3. Add **Broad only after** 30+ conversions a month in the campaign, smart bidding live, and a tight negative list. The source: "Broad without all three is a donation to Google." The thresholds are practitioner.

## Negative keywords

**Mechanics:** a negative broad needs ALL its words present, in any order (negative broad "free trial" does not block "free" alone); negative phrase blocks the words in order; negative exact blocks only that query. Apple Ads negatives work the same way ([app-growth](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/SKILL.md#the-rules)). Most accidental over- and under-blocking traces to this.

**Starter lists at build time** [coreyhaines31/marketingskills, ads]:

- Universal junk: free, cheap, jobs, salary, hiring, career, intern, student, course, tutorial, training, certification, pdf, template, reddit, wiki, login (except in brand campaigns)
- Research intent: "what is", "how to", "examples", "meaning", "definition"
- Category collisions: terms your category shares with an unrelated one (selling sales engagement, negative "employee engagement")
- Your brand as a negative in non-brand campaigns

**A tension inside the source.** Its guardrail says "Never produce a candidate negatives list from imagination", and its RSA spec demands at least 8 negatives with every RSA set. The source doesn't reconcile the three. The likely reading: starter lists and the RSA sidecar are for building a new campaign; on a live account, negatives come only from the search terms report, after the overblocking review ([AUDIT-GUARDRAILS.md](AUDIT-GUARDRAILS.md#recommendation-safety)). Don't over-negative either: every negative narrows reach; cut the clearly wrong, not the merely uncertain.

## The weekly search-terms pass

Once a week per campaign, three passes:

1. **Waste:** terms with spend (3+ clicks) and zero conversions; negative the irrelevant ones, after checking break-even CVR ([READING-AD-DATA.md](READING-AD-DATA.md#small-numbers)).
2. **Winners:** converting terms that aren't keywords yet; add them as Exact or Phrase in the right group.
3. **Drift:** broad or phrase matches pulling adjacent but wrong meanings; tighten the match type or negative the drift.

## Bidding by conversion volume

| Conversions a month (campaign) | Strategy |
|---|---|
| 0 to 15 | Manual CPC or Maximize Conversions (no target) |
| 15 to 30 | Maximize Conversions |
| 30+ stable | Target CPA, at or slightly above the trailing 30-day actual |
| Real revenue values flowing back | Target ROAS |

[coreyhaines31/marketingskills, ads]. The source says smart bidding needs ~30 conversions in 30 days to learn; Google's own requirement for Target ROAS on Search and Shopping is "At least 15 conversions in the past 30 days" (https://support.google.com/google-ads/answer/6268637). The same page: "Starting in June 2026 ... 'Maximise conversions with a Target CPA' is changing to 'Target CPA'."

- Set tCPA near actuals: an aggressively low target chokes delivery.
- Move targets in **±10 to 15% steps and wait 1 to 2 weeks**; every change restarts learning, so don't panic-edit inside the window (practitioner).
- A campaign can spend up to **2× its daily budget** in a day; Google balances it monthly, so a single-day overspend is normal.
- A budget-capped campaign that converts often lowers its CPA when the budget rises, because constrained smart bidding underperforms.

## Offline conversions

The single highest-impact move in a B2B Google account: import CRM outcomes (SQL, opportunity, closed-won) through GCLID + offline conversion import or a native CRM integration, with real deal values. Until then smart bidding optimizes to form-fills. B2B clicks close in 60 to 180 days, so in-platform counts never tell the truth alone; reconcile against the CRM monthly, and "the CRM wins" ([B2B-ACQUISITION.md](B2B-ACQUISITION.md#the-optimize-to-quality-trap)).

## Quality Score and landing pages

Quality Score (1 to 10, per keyword) diagnoses expected CTR, ad relevance and landing page experience; it is not an auction input or an aggregate KPI to optimize. The source and this file formerly said a low score means paying more for the same position, conflating the diagnostic with auction-time quality (https://support.google.com/google-ads/answer/6167118?hl=en). The source's page practices remain hypotheses: the headline echoes the ad's promise and query; one job and CTA per page; speed; proof above the fold. Form length is an intent gate: short forms buy volume at lower quality, longer qualified forms buy fewer and better; match it to the conversion you feed back. [coreyhaines31/marketingskills, ads/references/google-search-playbook.md]

## Performance Max

Value ranking: brand Search > high-intent non-brand Search > remarketing > PMax > broad demand gen. PMax earns budget only after the cheaper, clearer wins are maxed; never as the first campaign, on weak tracking or on a tiny budget.

- **Brand:** the source says "account-level brand exclusions". Google offers brand exclusions at both levels: "To exclude branded traffic from serving in individual Performance Max campaigns, use brand exclusions", and under its account-level features, "To exclude branded traffic from serving in individual Performance Max campaigns at the account-level, use brand exclusions"; either way you "first build a brand list, then apply it to campaigns in your account" (https://support.google.com/google-ads/answer/13607727). Negative keywords are a separate feature: "Negative keywords automatically apply to all Search and Shopping inventory, including in your Performance Max campaigns", and "Performance Max negative keywords are applicable to Search and Shopping inventory only" (https://support.google.com/google-ads/answer/15726455).
- Audience signals from first-party data; negatives from day one; offline conversions imported before scaling; check the CRM quality of PMax leads by campaign (pipeline at half the Search rate means cheap-looking and expensive in reality). Google auto-generates a video if you don't supply one, and the source calls it bad.
- **Overlap with Search:** in a February 2025 study of 503 accounts it manages, Optmyzr (a PPC tool vendor, so vendor-supplied) found 91% had exact keyword overlap between Search and PMax, touching 56% of 5,768 Search campaigns. That measures how common overlap is, not what it costs; size yours by comparing PMax search-terms insights with your Search keywords.

## Benchmarks and the weekly scorecard

The source's B2B SaaS Search ranges, wide on purpose, practitioner: brand CTR 8 to 20%, CVR 15 to 40%; non-brand high-intent CTR 2 to 6%, CVR 3 to 10%, CPC $8 to 40+, CPL $80 to 400+; competitor terms cost more and convert less. Anchor to your own first 30 days ([AUDIT-GUARDRAILS.md](AUDIT-GUARDRAILS.md#benchmark-discipline)).

Weekly scorecard, exactly eight numbers: spend · leads · CPL · lead→SQL rate (from the CRM) · SQLs · cost per SQL · Search impression share · top wasted search terms. **Search Lost IS (budget)** vs **Lost IS (rank)** says whether money or Ad Rank caps you: different problems, different fixes.

## RSA limits

Google's limits (up to 15 headlines of 30 characters, 4 descriptions of 90, two 15-character paths, double-width characters counting 2, 3 enabled RSAs per ad group) are defined, with their URLs, in [ad-creative PLATFORM-SPECS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ad-creative/PLATFORM-SPECS.md#google-ads), along with writing the headlines, pinning and the headline mix.

## RSA output spec

When asked for RSAs, the source makes this output mandatory; its "exactly 15" headlines and "exactly 4" descriptions are its own house rule, not Google's minimum.

- **Per RSA:** 15 headlines, each ≤ 30 characters including spaces, printed as `1. ... (NN chars)`; 4 descriptions ≤ 90; up to 2 paths ≤ 15; an https final URL; pinned positions stated (default unpinned). More than 3 RSAs are grouped by ad group.
- **Sidecars, in this order so the long part truncates last:** 1. ad group structure (theme, keywords with match types, which RSAs map to it); 2. negative keywords, at least 8, campaign-level vs ad-group level (a new build only; see [Negative keywords](#negative-keywords)); 3. at least 4 sitelinks (title ≤ 25, two descriptions ≤ 35, URL); 4. at least 4 callouts ≤ 25; structured snippets if relevant; 5. the RSAs.

```
Ad group structure:
- AG1 [theme]: keywords (match types) → RSA1, RSA2
- AG2 [theme]: ...

Negative keywords:
  Campaign-level:
    - <kw>
  Ad-group level:
    - AG1: <kw>, <kw>

Sitelinks (≥4):
  - <title (≤25)> | <desc1 (≤35)> | <desc2 (≤35)> | URL

Callouts (≥4, each ≤25 chars):
  - <callout>

RSA1 - [ad group name]
  Final URL: https://...
  Path1: ...   Path2: ...
  Headlines (15, each ≤30 chars):
    1. <headline> (NN chars)
  Descriptions (4, each ≤90 chars):
    1. <description> (NN chars)
  Pinning: H1=none; H2=none; ...
```

Self-check before sending: 15 headlines and 4 descriptions per RSA; every count printed and within limit (double-width characters count 2); negatives labeled and at least 8; ad group structure labeled. Rewrite rather than ship a partial RSA. The source also carries a banned-terms list for Brazilian medical practices regulated by the CFM (superlatives such as "melhor" and "#1", outcome promises such as "garantido" and "cura", comparisons with other doctors).

## Prove it

A new Search build has Brand, Non-brand, Competitor and Remarketing on separate budgets, Presence location, Partners and Display off, Phrase + Exact only until the three Broad gates pass, and a bid strategy that matches its monthly conversions; an RSA set prints every character count within Google's limits and has at most 3 enabled RSAs per ad group; a PMax plan applies a brand list as brand exclusions before launch [coreyhaines31/marketingskills, ads, google-search-playbook.md, evals #5].
