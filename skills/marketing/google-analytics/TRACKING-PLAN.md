# Tracking plan

What to track and how to read it once it arrives: the principles, the rules for turning rows into reported numbers, the plan template, naming, the essential events and properties, the funnels and the validation checklist. Everything here is from the analytics skill of coreyhaines31/marketingskills (MIT) unless tagged otherwise; the full event list by area is in [EVENT-LIBRARY.md](EVENT-LIBRARY.md).

**Contents:** [Principles](#principles) · [Reading the numbers](#reading-the-numbers) · [The plan](#the-plan) · [Naming events](#naming-events) · [Essential events](#essential-events) · [Standard properties](#standard-properties) · [Funnels](#funnels) · [The plan document](#the-plan-document) · [Validation](#validation) · [Prove it](#prove-it)

## Principles

[coreyhaines31/marketingskills, analytics]
- **Track for decisions, not data.** Every event should inform a decision; avoid vanity metrics; quality over quantity of events.
- **Start with the questions.** What do you need to know, what actions will you take based on the data; work backwards to what you need to track.
- **Name things consistently.** Establish patterns before implementing and document everything.
- **Maintain data quality.** Validate the implementation, monitor for issues; clean data over more data.

## Reading the numbers

[coreyhaines31/marketingskills, analytics]
- **Compute, don't eyeball.** "Derive every total, rate, and delta from row-level data with a script or spreadsheet, never by scanning rows and summing mentally. One silently dropped row corrupts every figure downstream of it."
- **Cross-check.** "Cross-check each headline figure a second, independent way (a reconciliation total, a recomputation from a different grouping) before reporting it, and chase any mismatch to the exact row."
- **A segment's own numbers.** "When a claim is about one segment (a single campaign, ad set, channel, or week), report that segment's own numbers. Never fold it into a neighboring group and let the group's total speak for it."
- **Match observation windows.** "A rate or efficiency metric divides a numerator and denominator that cover the same closed observation window. Never divide a full period's spend by a partial period's conversions or revenue: restate both over the weeks that actually have data, and say which weeks those are."
- **Pending is not failed.** "Cohort rates use only cohorts whose observation window has ended. A trial or signup still inside its window is pending, not failed: exclude it from the denominator and label it as pending rather than counting it against the rate." PostHog's version of the same rule (right-censoring) is in [posthog METRICS-MODELING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/METRICS-MODELING.md).
- **Recommend against the stated goal.** Analysis ends in a recommendation argued "from the goal the brief states (the launch target, audience, revenue, or positioning objective), not only from what is operationally easiest. Name which stated goal each option serves and what it trades away."
- When GA4 and the database disagree, the source's eval lists the causes to check: consent mode, ad blockers, client-side versus server-side tracking, and session timeout differences. PostHog's guidance to prefer backend tracking when accuracy matters is in [posthog EVENTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/EVENTS.md#what-to-capture).

## The plan

[coreyhaines31/marketingskills, analytics]

```
Event Name | Category | Properties | Trigger | Notes
---------- | -------- | ---------- | ------- | -----
```

| Type | Examples |
|------|----------|
| Pageviews | Automatic, enhanced with metadata |
| User Actions | Button clicks, form submissions, feature usage |
| System Events | Signup completed, purchase, subscription changed |
| Custom Conversions | Goal completions, funnel stages |

In GA4, "Custom Conversions" are key events ([GA4.md](GA4.md#key-events)).

## Naming events

[coreyhaines31/marketingskills, analytics] Recommended format, object-action:

```
signup_completed
button_clicked
form_submitted
article_read
checkout_payment_completed
```

- Lowercase with underscores.
- Be specific: `cta_hero_clicked` vs. `button_clicked`.
- Include context in properties, not the event name.
- Avoid spaces and special characters.
- Document decisions.
- "Keep provider-defined names when using automatic or recommended events (e.g. GA4 `click`, `view_search_results`, `purchase`). Map internal business names explicitly; naming a custom event does not make the provider collect it automatically."

Conflict on format: this source uses past-tense object-action (`signup_completed`); the PostHog skill records PostHog's present-tense `category:object_action` and its `[object] [verb]` alternative ([posthog EVENTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/EVENTS.md#naming-events-and-properties)). Both say: pick one per project and reuse what the project already has. The owner's website uses the past-tense form (`app_entry_clicked`, [landing-page-ui DISCOVERY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/DISCOVERY.md#consent-and-analytics)).

## Essential events

[coreyhaines31/marketingskills, analytics] Marketing site:

| Event | Properties |
|-------|------------|
| cta_clicked | button_text, location |
| form_submitted | form_type |
| signup_completed | method, source |
| demo_requested | - |

Product or app:

| Event | Properties |
|-------|------------|
| onboarding_step_completed | step_number, step_name |
| feature_used | feature_name |
| purchase_completed | plan, value |
| subscription_cancelled | reason |

## Standard properties

[coreyhaines31/marketingskills, analytics]

| Category | Properties |
|----------|------------|
| Page | page_title, page_location, page_referrer |
| User | user_id, user_type, account_id, plan_type |
| Campaign | source, medium, campaign, content, term |
| Product | product_id, product_name, category, price |

Use consistent property names, include relevant context, don't duplicate automatic properties, and avoid PII in properties. Google's enhanced measurement page adds: "You're required to ensure that no personally identifiable information is collected" (https://support.google.com/analytics/answer/9216061). Two library events carry free text that can hold PII: `search_performed` (`query`) and `error_occurred` (`error_message`); check them against that rule before shipping.

## Funnels

[coreyhaines31/marketingskills, analytics]
- **Signup:** signup_started, signup_step_completed (email), signup_step_completed (password), signup_completed, onboarding_started.
- **Purchase:** pricing_viewed, plan_selected, checkout_started, payment_info_entered, purchase_completed.
- **Ecommerce:** product_viewed, product_added_to_cart, cart_viewed, checkout_started, shipping_info_entered, payment_info_entered, purchase_completed.

When GA4 is the destination, the ecommerce steps have Google recommended names (`view_item`, `add_to_cart`, `begin_checkout`, `add_payment_info`, `purchase`; [GA4.md](GA4.md#recommended-events)).

## The plan document

[coreyhaines31/marketingskills, analytics]

```markdown
# [Site/Product] Tracking Plan

## Overview
- Tools: GA4, GTM
- Last updated: [Date]

## Events

| Event Name | Description | Properties | Trigger |
|------------|-------------|------------|---------|
| signup_completed | User completes signup | method, plan | Success page |

## Custom Dimensions

| Name | Scope | Parameter |
|------|-------|-----------|
| user_type | User | user_type |

## Key events

| Key event | Event | Counting |
|------------|-------|----------|
| Signup | signup_completed | Once per session |
```

The source's last section is headed "Conversions"; GA4 calls them key events (https://support.google.com/analytics/answer/13128484).

## Validation

[coreyhaines31/marketingskills, analytics]

| Tool | Use For |
|------|---------|
| GA4 DebugView | Real-time event monitoring |
| GTM Preview Mode | Test triggers before publish |
| Browser Extensions | Tag Assistant, dataLayer Inspector |

- [ ] Events firing on correct triggers
- [ ] Property values populating correctly
- [ ] No duplicate events
- [ ] Works across browsers and mobile
- [ ] Key events recorded correctly
- [ ] No PII leaking

| Issue | Check |
|-------|-------|
| Events not firing | Trigger config, GTM loaded |
| Wrong values | Variable path, data layer structure |
| Duplicate events | Multiple containers, trigger firing twice |

## Prove it

Every plan row names its trigger and the decision it serves; the project uses one naming convention throughout; no event or property carries an email, name, phone number or free text a user typed without a check; each reported rate states the closed window both numerator and denominator cover and labels pending cohorts; every headline figure has a second, independent computation that matches.
