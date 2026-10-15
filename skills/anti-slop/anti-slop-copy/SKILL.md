---
name: anti-slop-copy
description: "Writes and reviews website, marketing and product copy, including interface text. Use when writing landing pages, headlines, CTAs, emails or UI strings."
---

# Anti-slop copy

Copy that a buyer believes: specific, built from facts, in the customer's words, with one clear next step. Load `anti-slop` for the shared rules and `anti-slop-writing` for the prose patterns (in Hebrew, its [HEBREW.md](../anti-slop-writing/HEBREW.md)). Page structures and headline tests are in [PAGES.md](PAGES.md), interface text in [MICROCOPY.md](MICROCOPY.md), and the product context file in [CONTEXT.md](CONTEXT.md).

## 1. Facts before words

Copy is only as specific as what you know. Before writing:
1. Look for a product context file (`.agents/product-context.md`, or an older marketing context file). If none exists, offer to draft one from the repo and the live site ([CONTEXT.md](CONTEXT.md)); a page written without it is generic by construction.
2. For this page, know: the one action the visitor should take; who arrives and from where (an ad, search, an email); what they already know; the problem in their own words; what is different about this product; and the real proof (numbers, named customers, quotes, case studies).
3. Read the existing site copy and keep its terms: if the product says "workspace", the page doesn't say "hub".
4. Anything missing is a `[NEED: ...]` in the draft and a question to the user. Never fill it with an invented number, quote, logo or claim.

## 2. Principles

- **Clear beats clever.** If the reader has to decode a line, it failed.
- **Specific beats vague.** "Cut weekly reporting from 4 hours to 15 minutes" (if true), never "save time".
- **The customer's words over the company's.** Mine reviews, support tickets, sales calls and interviews for the exact phrases people use.
- **Outcomes over features**, then the feature as the proof of the outcome.
- **One idea per section**, in the order the reader's doubts arise.
- **The reader as the subject.** "Your team ships experiments without filing a ticket", not "the platform empowers teams".
- **Honest over sensational.** Invented stats and testimonials cost trust and can carry legal risk.
- **Keep the brand's register.** A formal enterprise voice making specific claims is fine; don't flatten it into clipped startup copy.

## 3. Tests every headline and claim must pass

- **Swap test:** would it work unchanged on a competitor's site? Rewrite it, or flag `[NEED: differentiator]`.
- **"Now you can..." test:** prefix the line with "Now you can". If the result is a concrete, true new ability, it works; if it's vague ("Now you can streamline your workflow"), rewrite.
- **Specificity test:** every claim has a number, a name, a mechanism or a concrete action.
- **Proof test:** every number, logo, quote and badge (SOC 2, "trusted by") is real and sourced, or it isn't on the page.

## 4. CTAs

A CTA says the action and what the person gets: "Start my free trial", "See pricing for 10 seats", "Create your first invoice", "Book a 20-minute demo". Not "Get started", "Learn more", "Submit", "Explore", "Discover", "Try now" as a default. A secondary CTA serves a different intent (see it working, talk to sales), not the same action twice. State a real absence once, beside the button: "Free for 14 days. No card required."

## 5. Copy slop specific to pages

On top of the prose patterns in `anti-slop-writing`:
- **Marketing stock phrases (Ban):** "Say goodbye to X", "Unlock the power of", "X, reimagined", "Take X to the next level", "Transform the way you work", "The X you deserve", "The future of X is here", "Built for teams who move fast", "Everything you need to", "all-in-one", "effortless", "in just a few clicks", "Join thousands of happy customers", "loved by teams everywhere".
- **Template sections:** an FAQ of generic questions ("Is my data secure?") nobody asked about this product; a "How it works" forced into three steps; a "Trusted by" bar of logos you can't name; testimonials without a real person. Cut what you can't make real.
- **Section openers that pretend empathy:** "We've all been there", "You know the feeling", "If you're like most..." Name the specific situation instead.
- **Label headings:** "Features", "Why us", "How it works" as the whole heading. Write headings that make a claim.
- **Exclamation marks and hype punctuation** in body copy.

## 6. Output

For page copy, deliver:
1. The copy in page order (headline, subhead, CTA, each section's heading and body, secondary CTAs), with `[NEED: ...]` markers where facts are missing.
2. For the headline and the main CTA, two or three real alternatives, each with a one-line rationale (which reader, which doubt it answers).
3. Short annotations only for non-obvious choices.
4. If it's a web page: the page title (about 55 to 60 characters, topic first) and meta description (what the page gives, under about 155 characters).
5. Run the check in [CHECK](../anti-slop-writing/CHECK.md) and the proof test above before handing it over. List the open `[NEED]` items at the end.

For a review of existing copy, report findings as `section: "quoted line" -> problem -> fix`, most damaging first (invented proof, then unclear value, then generic lines, then style).
