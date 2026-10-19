---
name: cro
description: "Raises conversions on marketing pages and the forms on them: the seven-dimension page audit in order of impact, Quick Wins and High-Impact output, page frameworks for home, landing, pricing, feature and blog pages, lead, contact, demo and quote forms, popups, slide-ins and banners within Google's interstitial guidance and WCAG, signup flows with NIST password rules, and an experiment catalogue by page with the limits each test must respect. Use when a page or form isn't converting, auditing a landing, pricing or feature page, designing a lead form, popup or signup flow, or listing conversion tests to run."
---

# Conversion rate optimization (CRO)

Conversion work on a marketing page starts from what the page is for and where its visitors came from, then checks the page in order of impact: the value proposition first, friction last. The sources are three MIT skills from coreyhaines31/marketingskills (Copyright (c) 2025 Corey Haines): `cro` v2.0.3 with its `form.md` and `experiments.md` references, `popups` v2.0.0 and `signup` v2.0.1, checked against Google Search Central, W3C WCAG 2.2 and the ARIA APG, web.dev, NIST SP 800-63B-4 and the FTC. Where a source line is wrong against those docs, the file says what the source said and gives the official form. Copy rules live in [anti-slop-copy](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md), accessibility mechanics in [web-accessibility](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/SKILL.md), test design and statistics in [ab-testing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SKILL.md) and [posthog](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/SKILL.md). The owner's own sites and apps follow [landing-page-ui](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SKILL.md) and [app-ui](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/SKILL.md); where this skill differs, see [Where other skills differ](#where-other-skills-differ).

**Context file:** read `.agents/product-context.md` first, as defined in [anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md), and ask only for what it doesn't cover. The source names that file `.agents/product-marketing.md` (also `.claude/product-marketing.md`, and the legacy `product-marketing-context.md`).

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| The page audit in order of impact, the output sections, home, landing, pricing, feature and blog frameworks, the questions to ask | this file |
| Lead capture, contact, demo, quote and survey forms: field costs, order, layout, multi-step, errors, the submit button, trust lines, form metrics, enrichment | [FORMS.md](FORMS.md) |
| Popups, exit intent, slide-ins, sticky bars and announcement banners: triggers, types, sizing, close and decline, copy, frequency, Google's interstitial rules, FTC urgency limits, dialog accessibility, metrics | [POPUPS.md](POPUPS.md) |
| Signup and registration: required fields, password rules (NIST), social sign-in, single versus multi-step, verification, waiting screens, patterns by business, metrics | [SIGNUP.md](SIGNUP.md) |
| Test ideas by page (home, pricing, demo, blog, landing, feature, site-wide) and for forms, popups and signup, with the caveats each needs | [EXPERIMENTS.md](EXPERIMENTS.md) |

## The rules

1. **Identify the page before recommending anything:** page type (homepage, landing, pricing, feature, blog, about, other), the primary conversion goal (sign up, request demo, purchase, subscribe, download, contact sales) and the traffic context (organic, paid, email, social). [coreyhaines31/marketingskills, cro]
2. **Audit in order of impact,** value proposition first, then headline, CTA, visual hierarchy, trust, objections and friction ([The audit](#the-audit-in-order-of-impact)). A redesign that lost conversions gets the same checks as a diagnosis of what changed, with the high-risk changes reverted while the rest are tested [coreyhaines31/marketingskills, cro, eval 5].
3. **Route by the job, not by the word "conversion":** a signup or registration form goes to [SIGNUP.md](SIGNUP.md), a popup to [POPUPS.md](POPUPS.md), a lead or contact form to [FORMS.md](FORMS.md); post-signup activation goes to [onboarding-and-upgrades](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/onboarding-and-upgrades/SKILL.md), and a full copy rewrite to [anti-slop-copy](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md). [coreyhaines31/marketingskills, cro]
4. **Every proof element is real.** The repo's proof test applies: "every number, logo, quote and badge (SOC 2, "trusted by") is real and sourced, or it isn't on the page" ([anti-slop-copy](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md)). A testimonial that claims a specific result needs the generally expected result beside it; the FTC rule is quoted once in [anti-slop-copy PAGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/PAGES.md#writing-each-part). The source asks for "case study snippets with real numbers" and says nothing about typical results.
5. **Urgency only when it is true.** A deadline, timer or "limited time" line is real, and a timer never resets per visitor ([POPUPS.md](POPUPS.md#urgency-and-countdowns)); the FTC rules on pricing, free, guarantee and scarcity claims are defined once in [offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md).
6. **Numbers without a source are heuristics.** The sources' field-cost percentages, popup conversion benchmarks and "increases trust" lines cite nothing; write them as "[coreyhaines31/marketingskills] reports" or leave them out, never as measured facts.
7. **Recommend tests, then test them properly.** Ideas that should be measured rather than assumed go in Test Ideas ([EXPERIMENTS.md](EXPERIMENTS.md)); hypothesis, primary metric, sample size and stopping rules are [ab-testing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SKILL.md) and [posthog EXPERIMENT-METRICS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/EXPERIMENT-METRICS.md#sample-size-and-running-time). [coreyhaines31/marketingskills, cro]
8. **Severity is the repo's one scale.** The sources rate fixes High, Medium and Low; write them as P1, P2 and P3, and a finding that blocks the primary task is P0, as in [code-review REVIEWER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/REVIEWER.md#tags-and-output).
9. **Accessibility is a floor, not a test variant.** Targets, error cues, focus and dialogs follow [web-accessibility](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/SKILL.md); where a source's number is stricter or looser (44px as a minimum, a red border as the error cue), the file says so and gives the WCAG form.

## Before the audit

Ask, unless the context file already answers [coreyhaines31/marketingskills, cro]:

1. What's your current conversion rate and goal?
2. Where is traffic coming from?
3. What does your signup or purchase flow look like after this page?
4. Do you have user research, heatmaps, or session recordings? (PostHog's are in [posthog WEB-ANALYTICS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/WEB-ANALYTICS.md) and [posthog SESSION-REPLAY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/SESSION-REPLAY.md).)
5. What have you already tried?

## The audit, in order of impact

[coreyhaines31/marketingskills, cro] lists seven dimensions "in order of impact".

1. **Value proposition clarity (highest impact).** "Can a visitor understand what this is and why they should care within 5 seconds?" Is the primary benefit clear, specific and differentiated? Is it in the customer's language, not company jargon? Common failures: "Feature-focused instead of benefit-focused / Too vague or too clever (sacrificing clarity) / Trying to say everything instead of the most important thing". The hero's problem, picture and path are in [anti-slop-copy PAGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/PAGES.md#the-hero-problem-picture-path).
2. **Headline.** Does it carry the core value proposition, is it specific enough to mean something, and does it match the traffic source's messaging? Patterns: outcome-focused ("Get [desired outcome] without [pain point]") and specificity (numbers, timeframes, concrete details). The source also offers "Join 10,000+ teams who..."; see [Where other skills differ](#where-other-skills-differ).
3. **CTA placement, copy and hierarchy.** Is there one clear primary action? "Is it visible without scrolling?" Does the button copy communicate value, not just action (weak: "Submit", "Sign Up", "Learn More"; strong: "Start Free Trial", "Get My Report", "See Pricing")? "Is there a logical primary vs. secondary CTA structure?" "Are CTAs repeated at key decision points?" The repo's CTA rule is in [anti-slop-copy](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md).
4. **Visual hierarchy and scannability.** Can someone scanning get the main message? Are the most important elements visually prominent? Is there enough white space? Do images support or distract from the message?
5. **Trust signals and social proof.** Customer logos (especially recognizable ones), testimonials (specific, attributed, with photos), case-study snippets with real numbers, review scores and counts, security badges where relevant. "Placement: Near CTAs and after benefit claims." Rule 4 decides what may appear.
6. **Objection handling.** Price and value concerns, "Will this work for my situation?", implementation difficulty, "What if it doesn't work?", addressed "through: FAQ sections, guarantees, comparison content, process transparency". The sections that answer each doubt are in [anti-slop-copy PAGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/PAGES.md#sections-built-from-what-the-reader-doubts); guarantee claims follow [offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md).
7. **Friction points.** "Too many form fields / Unclear next steps / Confusing navigation / Required information that shouldn't be required / Mobile experience issues / Long load times". Forms are [FORMS.md](FORMS.md); load time is [web-performance](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/SKILL.md).

## Output

[coreyhaines31/marketingskills, cro] structures recommendations as:

- **Quick Wins (Implement Now):** easy changes with likely immediate impact.
- **High-Impact Changes (Prioritize):** bigger changes that need more effort.
- **Test Ideas:** hypotheses worth A/B testing rather than assuming.
- **Copy Alternatives:** for key elements (headlines, CTAs), 2 to 3 alternatives with rationale.

Each finding inside them carries a P0 to P3 severity (rule 8).

## Page frameworks

[coreyhaines31/marketingskills, cro]

| Page | What it needs |
|---|---|
| Homepage | Clear positioning for cold visitors; a quick path to the most common conversion; "Handle both 'ready to buy' and 'still researching'" |
| Landing page | Message match with the traffic source; a single CTA; the complete argument on one page. The source adds "remove navigation if possible"; see [Where other skills differ](#where-other-skills-differ) |
| Pricing page | Clear plan comparison; a recommended plan indication; address "which plan is right for me?" anxiety. Pricing models and plan design: [pricing-strategy](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/pricing-strategy/SKILL.md) |
| Feature page | Connect the feature to a benefit; use cases and examples; a clear path to try or buy. With organic traffic, match the search intent [coreyhaines31/marketingskills, cro, eval 7] |
| Blog post | "Contextual CTAs matching content topic / Inline CTAs at natural stopping points" |

The repo's per-page copy rules (message match, one source, one message, one CTA) are in [anti-slop-copy PAGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/PAGES.md).

## Where other skills differ

Each view is tagged; in the owner's products the owner's design applies.

- **Navigation on landing pages.** [coreyhaines31/marketingskills, cro]: "Single CTA (remove navigation if possible)", and its experiments test "Navigation removal" and "Footer removal". landing-page-ui keeps "header, footer and cookie banner on site pages only" on every site page, and each hero has "the two app buttons (sign up solid, log in soft)" ([landing-page-ui SYSTEM.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SYSTEM.md), [landing-page-ui SECTIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SECTIONS.md)).
- **"Get Started" as a test variant.** [coreyhaines31/marketingskills, cro] tests "Start Free Trial" vs. "Get Started" vs. "See Demo" while listing "Learn More" as weak. anti-slop-copy bans "Get started" as a default CTA ([anti-slop-copy](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md)); test variants say the action and what the person gets.
- **"Join 10,000+ teams who..." headlines.** [coreyhaines31/marketingskills, cro] offers it as a pattern; anti-slop-copy bans "Join thousands of happy customers" as a stock phrase and allows a count only when it is real and sourced. Use it only with a real, sourced number.
- **Recommended plan.** [coreyhaines31/marketingskills, cro] recommends "Recommended plan indication" and tests a "Most Popular" badge; anti-slop-copy/PAGES.md: "Recommend a plan only if it's a real recommendation for a stated reader. Not always three tiers with a highlighted middle." landing-page-ui highlights its recommended plan; both hold as long as the recommendation is real.
- **Validation timing.** [coreyhaines31/marketingskills, cro] validates "as they move to next field". landing-page-ui: "Validate on submit; after the first submit, validate as the user types" ([landing-page-ui CONTENT-PAGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/CONTENT-PAGES.md)); app-ui: "Validate on submit" ([app-ui CONTROLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CONTROLS.md)). Details in [FORMS.md](FORMS.md#errors-and-validation).
- **Cookie consent "Minimize friction".** [coreyhaines31/marketingskills, cro] lists it as a site-wide test; landing-page-ui denies analytics storage by default and shows Accept and Deny "equally prominent" ([landing-page-ui DISCOVERY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/DISCOVERY.md), [landing-page-ui SECTIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SECTIONS.md#cookie-banner)), so a test that tilts the choice toward Accept contradicts that design. The legal side is [cookie-consent](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/cookie-consent/SKILL.md), not a conversion test.

## Prove it

- The audit names the page type, the conversion goal and the traffic source before any recommendation, and checks the seven dimensions in order [coreyhaines31/marketingskills, cro, eval 1].
- Paid traffic: the audit checks message match between the ad and the page [eval 1]. Organic traffic to a feature page: the audit checks search-intent match [eval 7].
- The output has Quick Wins, High-Impact Changes and Test Ideas, plus 2 to 3 headline or CTA alternatives with rationale [eval 1].
- A pricing page where most buyers pick the cheapest plan gets the pricing framework: recommended-plan indication, "which plan is right for me" anxiety and the middle tier's differentiation [eval 2].
- A homepage audit serves multiple audiences with clear paths for different visitor intents, and asks for the current conversion rate and traffic sources [eval 3]. A blog audit recommends contextual and inline CTAs at natural stopping points [eval 4].
- A redesign that dropped conversions is diagnosed for lost trust signals, a weaker value proposition, CTA hierarchy changes, added friction and broken message match, with high-risk changes reverted [eval 5].
- A signup form is handed to [SIGNUP.md](SIGNUP.md), not given a full page audit [eval 6].
- Every testimonial with a result shows the typical result or is cut; every benchmark is tagged with its source; every finding has a P0 to P3 severity.
