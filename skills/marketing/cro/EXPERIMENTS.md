# Conversion experiments

A catalogue of A/B test ideas by page, from [coreyhaines31/marketingskills, cro] `references/experiments.md`, the experiment sections of its `form.md`, and the `popups` and `signup` skills (all MIT). Each row is a hypothesis to test, not a change to ship; the caveats under each table say which variants are limited by law, Google's guidance, accessibility or the repo's copy rules. Hypotheses, primary metrics, sample size and stopping are [ab-testing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SKILL.md) and [posthog EXPERIMENT-METRICS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/EXPERIMENT-METRICS.md#sample-size-and-running-time): the source delegates test design to its ab-testing skill too. The source also lists button-color tests ("Test contrast and visibility"); they carry no rule and are left out, and contrast is a floor ([color-system](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/color-system/SKILL.md)), not a variant.

**Contents:** [Limits on every test](#limits-on-every-test) · [Homepage](#homepage) · [Pricing page](#pricing-page) · [Demo request page](#demo-request-page) · [Blog and resources](#blog-and-resources) · [Landing page](#landing-page) · [Feature page](#feature-page) · [Site-wide](#site-wide) · [Forms](#forms) · [Popups](#popups) · [Signup](#signup) · [Prove it](#prove-it)

## Limits on every test

- **No variant may be false.** Urgency, scarcity, "Most Popular", counts, ratings and results testimonials are real in every arm ([SKILL.md](SKILL.md#the-rules), rules 4 and 5; [offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md)).
- **No variant fails accessibility.** Targets, error cues, focus and dialogs stay at WCAG AA in every arm ([web-accessibility](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/SKILL.md)).
- **No variant obscures the whole page.** "Don't obscure the entire page with interstitials" ([Google Search Central](https://developers.google.com/search/docs/appearance/avoid-intrusive-interstitials)); see [POPUPS.md](POPUPS.md#google-and-interstitials).
- **CTA variants say the action and what the person gets;** "Get started" as a default is banned in [anti-slop-copy](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md).
- **In the owner's sites,** navigation, footer, cookie banner and form validation follow landing-page-ui ([SKILL.md](SKILL.md#where-other-skills-differ)).

## Homepage

[coreyhaines31/marketingskills, cro]

| Area | Test | Hypothesis |
|---|---|---|
| Hero | Headline variations | Specific vs. abstract messaging |
| Hero | Subheadline clarity | Add or refine to support the headline |
| Hero | CTA above fold | Include or exclude a prominent CTA |
| Hero | Hero visual format | Screenshot vs. GIF vs. illustration vs. video |
| Hero | CTA button text | "Start Free Trial" vs. "See Demo" vs. another specific action (the source's "Get Started" fails the copy rule) |
| Hero | Interactive demo | Engage visitors immediately with the product |
| Trust | Logo placement | Hero vs. below the fold |
| Trust | Case study in hero | Show results immediately (with the typical result, FTC) |
| Trust | Trust badges | Security, compliance, awards (real ones) |
| Trust | Social proof in headline | "Join 10,000+ teams" messaging, only with a real, sourced count |
| Trust | Testimonial placement | Above the fold vs. a dedicated section |
| Trust | Video testimonials | More engaging than text quotes |
| Content | Feature presentation | Icons and descriptions vs. detailed sections |
| Content | Section ordering | Move high-value features up |
| Content | Secondary CTAs | Add or remove throughout the page |
| Content | Benefit vs. feature focus | Lead with outcomes |
| Content | Comparison section | Against competitors or the status quo ([comparison-pages](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/comparison-pages/SKILL.md)) |
| Navigation | Sticky navigation | Persistent nav with a CTA |
| Navigation | Nav menu order | High-priority items at the edges |
| Navigation | Nav CTA button | A prominent button in the nav |
| Navigation | Support widget | Live chat vs. AI chatbot |
| Navigation | Footer optimization | Clearer secondary conversions |
| Navigation | Exit intent popup | Capture abandoning visitors, within [POPUPS.md](POPUPS.md) |

## Pricing page

[coreyhaines31/marketingskills, cro]. Pricing models, tiers and price points themselves are [pricing-strategy](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/pricing-strategy/SKILL.md).

| Area | Test | Hypothesis |
|---|---|---|
| Presentation | Annual vs. monthly display | Highlight savings or simplify |
| Presentation | Price points | "$99 vs. $100 vs. $97 psychology" |
| Presentation | "Most Popular" badge | Highlight the target plan, only if it is the real most popular or a real recommendation |
| Presentation | Number of tiers | 3 vs. 4 vs. 2 visible options |
| Presentation | Price anchoring | Order plans to anchor expectations |
| Presentation | Custom enterprise tier | Show vs. "Contact Sales" |
| UX | Pricing calculator | For usage-based pricing clarity |
| UX | Guided pricing flow | Multi-step wizard vs. comparison table |
| UX | Feature comparison format | Table vs. expandable sections |
| UX | Monthly and annual toggle | With savings highlighted |
| UX | Plan recommendation quiz | Help visitors choose |
| UX | Checkout flow length | Steps required after plan selection |
| Objections | FAQ section | Address pricing objections |
| Objections | ROI calculator | Demonstrate value vs. cost |
| Objections | Money-back guarantee | Prominent placement (guarantee terms: [offer-design](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/SKILL.md)) |
| Objections | Per-user breakdowns | Clarity for team plans |
| Objections | Feature inclusion clarity | What's in each tier |
| Objections | Competitor comparison | Side-by-side value comparison |
| Trust | Value testimonials | Quotes about ROI specifically |
| Trust | Customer logos | Near the pricing section |
| Trust | Review scores | G2 and Capterra ratings, current and real |
| Trust | Case study snippet | Specific pricing or value results |

## Demo request page

[coreyhaines31/marketingskills, cro]

| Area | Test | Hypothesis |
|---|---|---|
| Form | Field count | Fewer fields, higher completion |
| Form | Multi-step vs. single | Progress bar encouragement |
| Form | Form placement | Above the fold vs. after content |
| Form | Phone field | Include vs. exclude |
| Form | Field enrichment | Hide fields you can auto-fill |
| Form | Form labels | The source tests "Inside field vs. above"; labels stay visible in every arm ([FORMS.md](FORMS.md#order-and-layout)) |
| Content | Benefits above form | Reinforce value before the ask |
| Content | Demo preview | Video or GIF showing the demo experience |
| Content | "What You'll Learn" | Set expectations clearly |
| Content | Testimonials near form | Reduce friction at the decision point |
| Content | FAQ below form | Address common objections |
| Content | Video vs. text | Format for explaining value |
| CTA and routing | CTA text | "Book Your Demo" vs. "Schedule 15-Min Call" |
| CTA and routing | On-demand option | Instant demo alongside the live option |
| CTA and routing | Personalized messaging | Based on visitor data or source |
| CTA and routing | Navigation removal | Reduce page distractions (not on the owner's sites) |
| CTA and routing | Calendar integration | Inline booking vs. external link |
| CTA and routing | Qualification routing | Self-serve for some, sales for others ([revops](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/revops/SKILL.md)) |

## Blog and resources

[coreyhaines31/marketingskills, cro]

| Area | Test | Hypothesis |
|---|---|---|
| Content CTAs | Floating CTAs | A sticky CTA on blog posts (it must not hide focused content, WCAG 2.4.11) |
| Content CTAs | CTA placement | Inline vs. end-of-post only |
| Content CTAs | Reading time display | Estimated reading time |
| Content CTAs | Related resources | End-of-article recommendations |
| Content CTAs | Gated vs. free | Content access strategy ([lead-magnets](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/lead-magnets/SKILL.md)) |
| Content CTAs | Content upgrades | Specific to the article topic |
| Resource section | Navigation and filtering | Easier to find relevant content |
| Resource section | Search functionality | Find specific resources |
| Resource section | Featured resources | Highlight the best content |
| Resource section | Layout format | Grid vs. list view |
| Resource section | Topic bundles | Resources grouped by theme |
| Resource section | Download tracking | Gate some, track engagement |

## Landing page

[coreyhaines31/marketingskills, cro]. Ad-side message and creative are [paid-ads](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/SKILL.md) and [ad-creative](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ad-creative/SKILL.md).

| Area | Test | Hypothesis |
|---|---|---|
| Message match | Headline matching | "Match ad copy exactly" |
| Message match | Visual matching | Match the ad creative |
| Message match | Offer alignment | The same offer the ad promised |
| Message match | Audience-specific pages | Different pages per segment |
| Conversion focus | Navigation removal | Single-focus page (not on the owner's sites) |
| Conversion focus | CTA repetition | Multiple CTAs throughout |
| Conversion focus | Form vs. button | Direct capture vs. click-through |
| Conversion focus | Urgency and scarcity | "If genuine, test messaging" |
| Conversion focus | Social proof density | Amount and placement |
| Conversion focus | Video inclusion | Explain the offer with video |
| Page length | Short vs. long | Quick conversion vs. complete argument |
| Page length | Above-fold only | Minimal scroll required |
| Page length | Section ordering | Most important content first |
| Page length | Footer removal | Eliminate navigation (not on the owner's sites) |

## Feature page

[coreyhaines31/marketingskills, cro]

| Area | Test | Hypothesis |
|---|---|---|
| Presentation | Demo or screenshot | Show the feature in action |
| Presentation | Use case examples | How customers use it |
| Presentation | Before and after | Impact visualization |
| Presentation | Video walkthrough | Feature tour |
| Presentation | Interactive demo | Try the feature without signup |
| Conversion path | Trial CTA | A feature-specific trial offer |
| Conversion path | Related features | Cross-link to other features |
| Conversion path | Comparison | Against competitors' version |
| Conversion path | Pricing mention | Connect to the relevant plan |
| Conversion path | Case study link | A feature-specific success story |

## Site-wide

[coreyhaines31/marketingskills, cro]

| Area | Test | Hypothesis |
|---|---|---|
| Site-wide | Chat widget | Impact on conversions |
| Site-wide | Page load speed | Performance vs. features ([web-performance](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/SKILL.md)) |
| Site-wide | Mobile experience | Responsive optimization |
| Site-wide | Accessibility | Impact on conversion; AA conformance is the floor in every arm, not the variant |
| Site-wide | Personalization | Dynamic content by segment |
| Navigation | Menu structure | Information architecture ([site-architecture](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/site-architecture/SKILL.md)) |
| Navigation | Search placement | Help visitors find content |
| Navigation | CTA in nav | An always-visible conversion path |
| Navigation | Breadcrumbs | Navigation clarity |

The source's "Cookie consent UX | Minimize friction" is left out of the table: a test that tilts the choice toward Accept contradicts the owner's banner, which denies analytics by default and shows Accept and Deny "equally prominent", and the legal limits are cookie-consent's ([SKILL.md](SKILL.md#where-other-skills-differ), [cookie-consent](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/cookie-consent/SKILL.md)).

## Forms

[coreyhaines31/marketingskills, cro] `form.md`

- **Layout and flow:** single-step vs. multi-step with a progress bar; 1-column vs. 2-column; embedded on the page vs. a separate page; vertical vs. horizontal field alignment; above the fold vs. after content.
- **Fields:** reduce to the minimum viable set; add or remove the phone field; add or remove the company field; the required versus optional balance; enrichment to auto-fill known data; hide fields for returning or known visitors.
- **Smart forms:** real-time validation for emails and phone numbers (in the owner's products validation runs on submit); progressive profiling (ask more over time); conditional fields; company auto-suggest.
- **Labels and microcopy:** label clarity and length; placeholder text; help text shown vs. hidden vs. on hover; error message tone (friendly vs. direct).
- **CTAs:** button text ("Submit" vs. "Get My Quote" vs. a specific action); placement relative to the fields.
- **Trust:** a privacy assurance near the form; trust badges next to submit; a testimonial near the form; the expected response time.
- **Demo forms:** with or without a required phone; a "preferred contact method" choice; "What's your biggest challenge?"; a calendar embed vs. form submission.
- **Lead capture forms:** email-only vs. email plus name; the value proposition above the form; gated vs. ungated content; post-submission enrichment questions.
- **Contact forms:** a department or topic routing dropdown; with or without a required message; alternative contact methods (chat, phone); expected response time messaging.
- **Mobile and UX:** larger touch targets (24px is the AA floor in every arm); keyboard types by field; a sticky submit button; "Auto-focus first field on page load"; container styling (card vs. minimal).

## Popups

[coreyhaines31/marketingskills, popups]

- **Banners:** top bar vs. a banner below the header; sticky vs. static; full-width vs. contained; with vs. without a countdown timer (only a real deadline that never resets, with a way to hide it: [POPUPS.md](POPUPS.md#urgency-and-countdowns)).
- **Formats:** center modal vs. a corner slide-in; bottom bar vs. a corner popup; top announcements vs. bottom slide-outs; sizes on desktop and mobile; left vs. right corner; visibility without blocking content. The source's "Full-screen overlay vs. smaller modal" is left out: Google says "Don't obscure the entire page with interstitials".
- **Triggers:** exit intent vs. a 30-second delay vs. 50% scroll; delay 10s vs. 30s vs. 60s; scroll 25% vs. 50% vs. 75%; a page-count trigger; predicted intent; specific page visits; returning vs. new visitors; referral source; click-triggered popups for lead magnets; button- vs. link-triggered modals; in-content vs. sidebar triggers.
- **Messaging:** attention-grabbing vs. informational headlines; "Limited-time offer" (only when it is) vs. "New feature alert"; urgency-focused vs. value-focused copy; headline length and specificity.
- **CTAs:** button text; primary plus secondary vs. a single CTA; decline text (friendly vs. neutral, never shaming).
- **Visuals:** with or without images; a product preview vs. generic imagery; social proof in the popup. The source's "Add countdown timers to create urgency" holds only for a real deadline.
- **Personalization:** content by visitor data, industry or pages visited; progressive profiling; new vs. returning messaging; by traffic source or engagement level; exclude converted visitors.
- **Frequency:** once per session vs. once per week; the cool-down after dismissal; dismiss behaviors; "Show escalating offers over multiple visits", only with real offers.

## Signup

[coreyhaines31/marketingskills, signup]

- **Layout:** single-step vs. multi-step; multi-step with vs. without a progress bar; 1- vs. 2-column; embedded vs. a separate page; horizontal vs. vertical field alignment.
- **Fields:** reduce to email and password; add or remove phone; one "Name" field vs. First and Last; add or remove company; the required versus optional balance.
- **Authentication:** add SSO (Google, Microsoft, GitHub, LinkedIn); SSO prominent vs. the email form prominent; which SSO options resonate; SSO-only vs. SSO plus email.
- **Visuals:** a plain background vs. product visuals; container styling (card vs. minimal); a mobile-optimized layout.
- **Headlines and CTAs:** the headline above the form; "Create Account" vs. "Start Free Trial" vs. another specific action (the source lists "Get Started"); trial length in the CTA; value proposition emphasis in the form header.
- **Microcopy:** minimal vs. descriptive labels; placeholder text; error message clarity and tone; password requirements upfront vs. on error (NIST: "Verifiers SHALL offer guidance to the subscriber to help the subscriber choose a strong password", [SIGNUP.md](SIGNUP.md#passwords)).
- **Trust:** social proof next to the form; security or compliance badges; "No credit card required" (when true); privacy assurance copy.
- **Trial:** credit card required vs. not; trial length (7 vs. 14 vs. 30 days); freemium vs. free trial; limited features vs. full access. Trial and plan design: [pricing-strategy](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/pricing-strategy/SKILL.md).
- **Friction:** email verification required vs. delayed vs. removed; phone verification for high-value accounts; "Terms acceptance checkbox vs. implicit acceptance" is a legal question to settle before testing. The source's "Test CAPTCHA impact on completion" is limited by WCAG 3.3.8 (AA) in every arm: no cognitive function test without an alternative ([web-accessibility FORMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/FORMS.md#multi-step-forms-and-sign-in)).
- **Post-submit:** clear next-step messaging; instant product access vs. email confirmation first; a personalized welcome from signup data; auto-login after signup vs. requiring login.

## Prove it

- Every proposed test has a hypothesis, a primary metric and a sample-size estimate from [ab-testing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SKILL.md) before it runs [coreyhaines31/marketingskills, cro, eval 7; signup, eval 5].
- Signup experiment lists cover form design, copy and messaging, and trial and commitment, ordered by likely impact [signup, eval 5].
- Every arm of every test is true, passes WCAG AA and leaves the page visible; no arm removes the owner's navigation, footer or cookie choice.
