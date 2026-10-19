# Enrichment and verification

"No single provider finds everyone, and the ones that find the most also return more wrong data." [coreyhaines31/marketingskills, prospecting] references/sourcing-and-enrichment.md and enrichment-playbook.md; the playbook credits eliasstravik's MIT-licensed GTM engineering toolkit and calls itself "a workflow design, not a new API or a promise of coverage". Collapsing concurrent misses into one request is in [performance-and-caching CACHING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/CACHING.md#stampede-many-concurrent-misses); provider calls, retries and webhooks in [third-party-integrations CALLS-AND-SYNC.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/third-party-integrations/CALLS-AND-SYNC.md).

**Contents:** [Define success first](#define-success-first) · [The waterfall](#the-waterfall) · [Provider bake-off](#provider-bake-off) · [Lookup outcomes](#lookup-outcomes) · [Exact cache keys](#exact-cache-keys) · [Pilot and report](#pilot-and-report) · [Verification](#verification) · [Catch-all domains](#catch-all-domains) · [Suppression list](#suppression-list) · [Prove it](#prove-it)

## Define success first

[coreyhaines31/marketingskills, prospecting] For each missing field: the required input, the acceptable output, the freshness, and the maximum cost. "A nonempty response is insufficient: a guessed address, a wrong-company match, or an old job title may fail the acceptance rule." Example: a published business contact for an ICP-fit account, then deliverability verified separately; a provider returning a name alone has not done the task. "Do not expand to personal emails simply because work-email providers found nothing."

## The waterfall

[coreyhaines31/marketingskills, prospecting] Query providers one at a time and stop at the first confident result.

1. **Order providers by accuracy for your ICP, then coverage** (and cost and latency). The source reports 2025 to 2026 benchmarks putting the same tools anywhere from 25% to 87% find rates, with the highest finders sometimes at four times the false-positive rate: "There is no universal Hunter/Apollo/FullEnrich order." A manual public-source lookup is a valid step.
2. **Stop at the first result that passes verification.** "Paying three providers for the same contact is the most common waste."
3. **Set a cost cap per contact** and log which provider filled each field.
4. **Mobile numbers are for Tier 1 only:** the most expensive field, and many are personal phones. The phone rules are in [email-practices COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/COMPLIANCE.md).
5. **Keep the result in your own data,** not only the sending tool, so you can re-verify and answer data subject requests.

Per row:

1. Normalize the inputs and check existing verified CRM fields.
2. Read the exact cache entry for the first provider lookup.
3. If no reusable entry exists, look it up within the authorized budget.
4. Validate the returned identity and field; record source and retrieval time.
5. Stop when the acceptance rule is met; otherwise advance to the next provider.
6. If nothing is acceptable, keep the row unresolved with a reason. "Do not fill blanks with invented values."

An already verified contact doesn't spend credits on the same field again; dependent steps wait for the preceding result, and independent fields may run concurrently within provider limits.

## Provider bake-off

[coreyhaines31/marketingskills, prospecting] Before committing to a provider or an order:

1. Take 200 contacts you already know are correct (customers, recent conversations).
2. Strip the emails and phones, then run each candidate provider.
3. Score each: found, correct, wrong (a confident answer that was false), cost per correct contact.
4. "Order the waterfall by fewest wrong answers first, then by cost per correct contact."

Repeat each quarter; providers' data quality shifts.

## Lookup outcomes

[coreyhaines31/marketingskills, prospecting]

| Lookup outcome | Next action |
|---|---|
| Fresh, accepted result | Reuse it; stop this field's waterfall |
| Genuine no-match | Advance; optionally cache the no-match briefly |
| Wrong entity or invalid output | Record the rejection; advance if another source can resolve it |
| Authentication or permission error | Repair the connection; do not label the contact nonexistent |
| Rate limit, timeout, provider outage | Respect provider retry guidance and budget; defer or use an authorized independent source |
| Missing required input | Resolve identity first; another identical empty-input call will not help |

The rule underneath: "keep operational failures distinct from no-match records."

## Exact cache keys

[coreyhaines31/marketingskills, prospecting]

```text
workspace/account + provider + endpoint/version + normalized inputs + requested fields/options
```

- "Keep account scope separate even when two customers query the same domain."
- Normalize domains consistently (case, URL host, trailing dot); strip URL paths only for domain-based lookups. Keep distinctions the provider treats as meaningful: person vs company, subdomain, country, filters, email local-part rules.
- "A company-name fuzzy match is not an exact cache hit."
- Store status, accepted fields, entity identifiers, source, fetched time, expiry and validation outcome. Never put API keys in keys or result logs. Restrict access to contact data and honor deletion and retention rules.
- **Fresh accepted hit:** reuse without another charged call. **Expired hit:** refresh fields that need current evidence and label provisional stale data. **Miss:** fetch; "a cache endpoint's documented 404 may mean only that the cache has no entry, not that the provider found no company." **Negative hit:** "a separate, usually shorter expiry"; changed inputs invalidate it. **Error:** not a no-match.
- Merge accepted fields with provenance instead of overwriting verified CRM data with nulls or weaker matches; reuse one in-flight request for concurrent duplicates and "guard the final write so a late weaker result cannot replace a newer verified one". The repo's single-flight pattern is in [performance-and-caching CACHING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/CACHING.md#stampede-many-concurrent-misses).

## Pilot and report

[coreyhaines31/marketingskills, prospecting] Return a table with row identity, missing field, provider order, acceptance rule, cache decision, source and date, result, verification status, cost and unresolved reason. Track cost per accepted field and per verified contact, cache reuse, no-match rate, invalid-match rate and sampled accuracy, and "Report actual measured savings; a cache does not guarantee a particular reduction."

Pilot on representative rows before a broad run: a fresh hit, an expired hit, a true no-match, an ambiguous company, a provider failure and a duplicate input, compared with a single-provider control under the same acceptance rule and budget.

## Verification

[coreyhaines31/marketingskills, prospecting] "Verify every address before it reaches a sequence. This is the single cheapest protection for sender reputation."

**When:** when you enrich the contact; again within 7 days of sending for any list built earlier; CRM contacts every quarter; anything older than 30 to 60 days before using it. The source's vendor estimate of decay: "around 2% a month and 20-30% a year".

| Result | Action |
|---|---|
| Valid | Send |
| Invalid, disposable, or spam trap | Suppress permanently |
| Role address (info@, sales@) | Exclude from personal sequences. Fine only for local businesses that publish it as their main contact |
| Catch-all (accept-all) | The policy below |
| Unknown | Retry once later; don't send if it's still unknown |

This adds pre-send verification of lists you didn't collect yourself to the repo's signup-time validation (format, DNS, MX, disposable) in [email-practices LISTS-AND-CAPTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/LISTS-AND-CAPTURE.md#capturing-addresses). The bounce limit that pauses a campaign is in [cold-outreach SENDING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/SENDING.md#verify-before-you-send).

## Catch-all domains

[coreyhaines31/marketingskills, prospecting] Catch-all domains accept mail for any address, so a basic check can't tell whether the person exists; the source's vendor estimate is 15 to 28% of B2B domains.

1. **Resolve them** with a verifier that goes beyond the SMTP check; some verifiers only mark catch-alls "risky".
2. **Do not use reputation-isolation sending tricks or domain swapping.** The source and this file formerly described a separate-inbox sending recipe; the owner's do-not-only evasion rule takes precedence. Follow the lawful consent, verification and suppression rules in [cold-outreach SENDING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/SENDING.md#out-of-bounds). [repository owner safety policy]
3. **An unresolved address remains unresolved.** Account priority does not establish consent or a valid recipient; keep the existing no-unknown-send rule rather than the source's Tier 1 exception. [coreyhaines31/marketingskills, prospecting/references/sourcing-and-enrichment.md; repository owner safety policy]

## Suppression list

[coreyhaines31/marketingskills, prospecting] One list, synced to every tool that sends (email tool, LinkedIn tool, dialer, CRM) and checked before every send:

- unsubscribes and opt-outs from any channel;
- hard bounces and invalid addresses;
- current customers and open deals ("outbound to them is a sales-team problem");
- competitors and partners;
- people who replied "not interested", for the cooldown you choose;
- do-not-contact and data deletion requests.

"Key it on email, LinkedIn URL, and phone number so a person removed in one channel is removed in all of them." Suppression for opted-in mail is in [email-practices LISTS-AND-CAPTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/LISTS-AND-CAPTURE.md#suppression-list).

## Prove it

Each field has a written acceptance rule and cost cap before the first call; the waterfall order came from a bake-off on 200 known contacts within the last quarter; a simulated 401 leaves the row "unresolved: connection" rather than "no match"; two workspaces querying the same domain never share a cache entry; a late weaker result never overwrites a verified field; every address was verified within 7 days of its first send and no "unknown" result was sent; and a contact suppressed by phone is also suppressed for email and LinkedIn.
