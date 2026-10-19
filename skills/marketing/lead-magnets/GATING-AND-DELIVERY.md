# Gating, capture and delivery

How much to gate, what to ask for, the page, how the file reaches the person, and where consent law and double opt-in change the source's advice. The form's mechanics (validation, checkbox wording, consent records) live in [email-practices LISTS-AND-CAPTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/LISTS-AND-CAPTURE.md); form and popup conversion work is in [cro](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cro/SKILL.md). Advertising something as "free" follows [offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md).

## Gating options

[coreyhaines31/marketingskills, lead-magnets]

| Approach | When to use | Trade-off |
|---|---|---|
| Full gate | High-value content, bottom-funnel | Max capture, lower reach |
| Partial gate | Preview plus full version | Balance of reach and capture |
| Ungated plus optional | Top-funnel education | Max reach, lower capture |
| Content upgrade | Blog post plus bonus | Contextual, high-intent |

A popular blog post stays ungated; the source's eval offers a post-specific bonus (a content upgrade) instead "(preserve SEO)" [coreyhaines31/marketingskills, lead-magnets evals]. Free tools have their own gating table in [FREE-TOOLS.md](FREE-TOOLS.md#lead-capture).

## What to ask for

[coreyhaines31/marketingskills, lead-magnets]

- **Email only:** highest conversion, lowest friction.
- **Email plus name:** enables personalization, slight friction increase.
- **Email plus company or role:** better lead qualification, more friction.
- **Multi-field:** only for high-value offers (webinars, demos).

"Rule of thumb: Ask for the minimum needed." The source adds that "Every extra field reduces conversion by 5-10%", a figure it gives without a study. For a form that asks for six fields, its eval expects the answer to ask which fields follow-up actually uses, remove the rest, and suggest progressive profiling: "capture email now, ask for more fields later via enrichment or follow-up forms" [coreyhaines31/marketingskills, lead-magnets evals].

## Framing the exchange

[coreyhaines31/marketingskills, lead-magnets]

- **Make the value obvious:** "Get the full 25-page guide free".
- **Show a preview:** table of contents, first page, sample results.
- **Add social proof:** the source's example is "Downloaded by 5,000+ marketers"; use only a count you can show from your own records ([anti-slop-copy](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md): "Invented stats and testimonials cost trust and can carry legal risk").
- **Reduce risk:** the source writes "No spam. Unsubscribe anytime." This repo asks for more: informed consent "discloses the email types, frequency, sender identity and how to unsubscribe", and "Sign up for emails" is the wrong example ([email-practices LISTS-AND-CAPTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/LISTS-AND-CAPTURE.md#consent-checkboxes-and-forms)). Keep the unsubscribe line and add what will be sent and how often.

## The landing page

The source's structure [coreyhaines31/marketingskills, lead-magnets]:

1. **Headline:** clear benefit, what they'll get and why it matters.
2. **Preview or mockup:** cover, screenshot, sample page.
3. **What's inside:** 3-5 bullet points of key takeaways.
4. **Social proof:** download count, testimonials, logos (real ones).
5. **Form:** minimal fields, clear CTA button.
6. **FAQ:** address hesitations ("Is it really free? What format?").

The FAQ answers questions prospects really ask; anti-slop-copy rejects "an FAQ of generic questions ("Is my data secure?") nobody asked about this product" ([anti-slop-copy](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md)). Page copy is in [anti-slop-copy](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md); the page's head and share card follow web-ui/landing-page-ui's DISCOVERY.md for a site built with it.

## Delivery methods

[coreyhaines31/marketingskills, lead-magnets]

| Method | Pros | Cons |
|---|---|---|
| Instant download | Immediate gratification | No email verification |
| Email delivery | Verifies email, starts relationship | Slight delay |
| Thank-you page plus email | "Best of both": instant access plus email copy | Slightly more complex |
| Drip delivery | Builds habit, multiple touchpoints | Only for courses or series |

## Consent and double opt-in

The source offers instant download ("No email verification") as an equal option and never mentions consent. Two rules sit on top of its table:

- **Double opt-in for the list:** this repo says "**Use double opt-in for all marketing email.**" and "add to the list only after confirmation" ([email-practices LISTS-AND-CAPTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/LISTS-AND-CAPTURE.md#double-opt-in)). Read the source's table as delivery advice only: the download can be instant, and the address joins the marketing list after the confirmation click. The email that carries the file can double as the confirmation email.
- **No tying in the EU:** GDPR Art. 7(4) and the EDPB's consent guidelines (recital 43) presume consent is not freely given when a service is made conditional on it; the quoted texts and links are in [email-practices COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/COMPLIANCE.md#the-laws). So the address may be used to deliver the file or the quiz result; joining the marketing list takes a separate, unchecked opt-in, and the download works without it. The source's "Full gate" and "Gate results behind email capture" (quiz) carry this caveat. The consent record fields are in [email-practices COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/COMPLIANCE.md#consent-records); store which magnet the address came from with it.

## The thank-you page

"Don't waste the thank you page." After they convert [coreyhaines31/marketingskills, lead-magnets]:

- Confirm delivery ("Check your inbox"); with double opt-in, say the confirmation email is on its way.
- Offer a next step (book a demo, start trial, join community).
- Share on social (pre-written tweet or post).
- Recommend related content.

## Prove it

Submitting the form with the marketing box unticked still delivers the file; the box is unchecked by default and names what will be sent and how often; the address appears on the marketing list only after the confirmation click; the consent record holds the magnet's ID; the form has only fields follow-up uses; the social-proof count matches your own records; and the thank-you page tells the person what happens next.
