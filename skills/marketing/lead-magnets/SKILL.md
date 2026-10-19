---
name: lead-magnets
description: "Plans lead magnets and free tools that capture email addresses and bring qualified leads: picking the format for the buyer stage, gating and the form, the landing page, delivery that respects double opt-in and GDPR consent, the thank-you page, each format's build rules (ebook, checklist, cheat sheet, template, swipe file, mini-course, quiz, webinar), promotion, lead quality and measurement, and free tools as engineering as marketing (calculators, generators, graders, testers, the scorecard, MVP scope, pitfalls). Use when deciding what to give away for an email, planning gated content or a content upgrade, fixing a lead magnet that converts poorly or brings bad leads, or deciding whether to build a free tool."
---

# Lead magnets

A lead magnet is something useful given in exchange for an email address: a download, a course, a quiz result, a webinar seat, or a free tool. It works when it solves one specific problem for the buyer stage it targets, can be used in minutes, and leads naturally to the product. This skill holds Corey Haines's `lead-magnets` (v2.1.0) and `free-tools` (v2.0.2) skills from [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) (MIT), checked against GDPR Art. 7, the EDPB consent guidelines and this repo's email rules. Every number the source gives (conversion rates, cost per lead, "5-10% per field") comes without a cited study, so it appears here only labelled as the source's.

The source reads its context from `.agents/product-marketing.md`; this repo's file is `.agents/product-context.md`, defined in [anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md). Read it before asking questions, and ask only for what it doesn't cover.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Starting: the questions to ask, the five principles, the format table with effort, matching a format to the buyer stage, the output to hand back | [PLANNING.md](PLANNING.md) |
| Gating and capture: the four gating options, which fields to ask for, framing the exchange, the landing page, delivery methods against double opt-in, the GDPR tying rule, the thank-you page | [GATING-AND-DELIVERY.md](GATING-AND-DELIVERY.md) |
| Building one format: ebook, checklist, cheat sheet, spreadsheet, Notion and document templates, swipe file, email and video mini-course, quiz, live and evergreen webinar | [FORMATS.md](FORMATS.md) |
| Promotion and numbers: content upgrades, popups, social, paid, partners, the metrics, lead quality signals (clicks over opens), A/B ideas, the source's benchmark tables | [PROMOTION-AND-MEASUREMENT.md](PROMOTION-AND-MEASUREMENT.md) |
| A free tool as the magnet: principles, the six tool types, ideation and validation, gating, SEO, build or buy, MVP scope, the scorecard, pitfalls | [FREE-TOOLS.md](FREE-TOOLS.md) |
| Free tool detail: per-type examples and tips, concepts by industry, the sourced case library and the evidence rule for any number | [FREE-TOOL-TYPES-AND-CASES.md](FREE-TOOL-TYPES-AND-CASES.md) |

A course, webinar series, podcast or newsletter archive you own can also ship as an installable agent skill; rights, extraction, the lesson and reference layers and release are in [skill-authoring CONTENT-TO-SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/agent-workflows/skill-authoring/CONTENT-TO-SKILL.md).

## The rules

1. **One specific problem, one buyer stage.** "'How to write cold emails that get replies' > 'Marketing guide'"; awareness needs education, consideration needs comparison and evaluation, decision needs implementation help [coreyhaines31/marketingskills, lead-magnets].
2. **Consumable in under 30 minutes, ideally under 10,** in one format that works on mobile with no special software [coreyhaines31/marketingskills, lead-magnets].
3. **Ask for the minimum.** Email only converts best; add a field only when follow-up actually uses it, and collect the rest later through progressive profiling [coreyhaines31/marketingskills, lead-magnets].
4. **The file is delivered to anyone; the marketing list is opt-in.** In the EU a download or quiz result may not be conditional on consent to marketing that delivering it doesn't need (GDPR Art. 7(4), recital 43); take a separate unchecked box, and add the address to the list only after the double opt-in click ([GATING-AND-DELIVERY.md](GATING-AND-DELIVERY.md#consent-and-double-opt-in)).
5. **Tell people what they'll get by email,** with type and frequency, not only "No spam. Unsubscribe anytime." ([email-practices LISTS-AND-CAPTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/LISTS-AND-CAPTURE.md#consent-checkboxes-and-forms)).
6. **Proof must be real.** A download count or testimonial is a real number from your own records ([anti-slop-copy](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md)).
7. **Judge quality by what leads do,** clicks, return visits and progress to trial, demo or purchase, tracked per magnet; opens are not a reliable signal ([PROMOTION-AND-MEASUREMENT.md](PROMOTION-AND-MEASUREMENT.md#lead-quality)).
8. **Build a free tool only when the numbers can work:** "Lead value × expected leads > build cost + maintenance", and budget the upkeep of anything that takes user input or fetches URLs [coreyhaines31/marketingskills, free-tools].
9. **Never quote another company's rate as your forecast.** Use your own baseline or labelled low, base and high assumptions [coreyhaines31/marketingskills, free-tools].

## Prove it

The plan returns all five output sections (recommendation, outline, gating and capture, distribution, measurement); the form asks only for fields the follow-up uses; the consent box is separate and unchecked and the download works without ticking it; addresses reach the marketing list only after confirmation, tagged with the magnet that brought them; every number in the plan is either the user's own or labelled with its source; a free tool idea carries a scorecard and an MVP scope; and every file's own Prove it checks pass for the parts you touched.
