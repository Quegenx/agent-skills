---
name: anti-slop-copy
description: "Writes and reviews website, marketing and product copy, including interface text. Use when writing landing pages, headlines, CTAs, emails or UI strings."
---

# Anti-slop copy

Copy that a buyer believes: specific, built from facts, in the customer's words, with one clear next step. Load `anti-slop` for the shared rules and `anti-slop-writing` for the prose patterns (in Hebrew, its [anti-slop-writing HEBREW.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/HEBREW.md)). Drafting, review, voice and the context file add rules from [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) (MIT, Corey Haines; its copywriting and copy-editing modes credit Profound and Wispr Flow, MIT), tagged where they appear.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Page structures, sections, headline shapes, page types | [PAGES.md](PAGES.md) |
| Drafting or rewriting: diagnosis, decompose and lock, the three-question gate, declined claims | [DRAFTING.md](DRAFTING.md) |
| Editing or reviewing existing copy: edit modes, the seven sweeps, the expert panel | [REVIEW.md](REVIEW.md) |
| The brand voice profile and tone by context | [VOICE.md](VOICE.md) |
| The product context file every copy task reads | [CONTEXT.md](CONTEXT.md) |
| Interface text: buttons, errors, empty states, confirmations | [MICROCOPY.md](MICROCOPY.md) |
| Turning merged code into a changelog and announcement drafts | [product-launch SHIPPED-CHANGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/product-launch/SHIPPED-CHANGES.md) |
| Ad copy formulas, search headlines, social hooks, CTAs by stage and test order | [ad-creative COPY-FORMULAS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ad-creative/COPY-FORMULAS.md) |

## 1. Facts before words

Copy is only as specific as what you know. Before writing:
1. Look for a product context file (`.agents/product-context.md`, or an older marketing context file). If none exists, offer to draft one from the repo and the live site ([CONTEXT.md](CONTEXT.md)); a page written without it is generic by construction. marketingskills names this file `.agents/product-marketing.md`; [CONTEXT.md](CONTEXT.md#finding-it) lists every name to look for. Read its Learnings first: angles and claims already tested there aren't proposed again as new [coreyhaines31/marketingskills, copywriting].
2. For this page, know: the one action the visitor should take; who arrives and from where (an ad, search, an email); what they already know; the problem in their own words; what is different about this product; and the real proof (numbers, named customers, quotes, case studies).
3. Read the existing site copy and keep its terms: if the product says "workspace", the page doesn't say "hub". Use "the exact product name the brief gives, in every field", with no nicknames "unless a short form is explicitly approved" [coreyhaines31/marketingskills, ad-creative].
4. Anything missing is a `[NEED: ...]` in the draft and a question to the user. Never fill it with an invented number, quote, logo or claim. A claim you decline names the evidence that would unlock it ([DRAFTING.md](DRAFTING.md#decline-a-claim-with-its-unlock)).

## 2. Principles

- **Clear beats clever.** If the reader has to decode a line, it failed.
- **Specific beats vague.** "Cut weekly reporting from 4 hours to 15 minutes" (if true), never "save time".
- **The customer's words over the company's.** Mine reviews, support tickets, sales calls and interviews for the exact phrases people use ([customer-research](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/customer-research/SKILL.md) is how).
- **Outcomes over features**, then the feature as the proof of the outcome.
- **One idea per section**, in the order the reader's doubts arise.
- **The reader as the subject.** "Your team ships experiments without filing a ticket", not "the platform empowers teams".
- **Honest over sensational.** Invented stats and testimonials cost trust and can carry legal risk. The FTC's Consumer Reviews and Testimonials Rule (16 CFR Part 465) "went into effect on October 21, 2024" and "authorizes courts to impose civil penalties for knowing violations" ([FTC Q&A](https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers)).
- **Keep the brand's register.** A formal enterprise voice making specific claims is fine; don't flatten it into clipped startup copy.
- **Write for the newcomer.** "Your product seems obvious to you but confusing to newcomers. Test copy with people unfamiliar with your space" [coreyhaines31/marketingskills, marketing-psychology].

## 3. Tests every headline and claim must pass

- **Swap test:** would it work unchanged on a competitor's site? Rewrite it, or flag `[NEED: differentiator]`.
- **"Now you can..." test:** prefix the line with "Now you can". If the result is a concrete, true new ability, it works; if it's vague ("Now you can streamline your workflow"), rewrite.
- **Specificity test:** every claim has a number, a name, a mechanism or a concrete action.
- **Proof test:** every number, logo, quote and badge (SOC 2, "trusted by") is real and sourced, or it isn't on the page.
- **The three-question gate** (picture it, prove it, could a competitor say it) scores every line: [DRAFTING.md](DRAFTING.md#the-three-question-gate).
- **Language evidence isn't claim evidence.** "Separate **language evidence** ('the export takes forever') from **claim evidence** (a measured reduction across a defined pilot). A complaint supports the pain angle; it does not substantiate a numerical performance promise." Keep a pilot's "sample size and period in adjacent readable copy", never in a footnote; "rounded numbers are not evidence of fakery" [coreyhaines31/marketingskills, ad-creative].
- **Urgency only when it's real.** Scarcity and deadlines: "Only use when genuine" [coreyhaines31/marketingskills, marketing-psychology]. A fake countdown, false low stock or a deadline that resets is a dark pattern the FTC names; the rules are in [offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md#scarcity-urgency-and-dark-patterns), with prices, "free", "worth $X" and guarantees.
- **Lead with the larger number** for a reward or discount [coreyhaines31/marketingskills, referrals]: "Rule of thumb: under ~$100, lead with the dollar amount; over ~$100, test the percentage." The claim must match the real offer ([referral-programs VIRAL-LOOPS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/referral-programs/VIRAL-LOOPS.md)).

## 4. CTAs

A CTA says the action and what the person gets: "Start my free trial", "See pricing for 10 seats", "Create your first invoice", "Book a 20-minute demo". Not "Get started", "Learn more", "Submit", "Explore", "Discover", "Try now" as a default. A secondary CTA serves a different intent (see it working, talk to sales), not the same action twice. State a real absence once, beside the button: "Free for 14 days. No card required."

- **The formula:** "[Action Verb] + [What They Get] + [Qualifier if needed]", as in "Get the Complete Checklist" or "See Pricing for My Team" [coreyhaines31/marketingskills, copywriting]. The source writes CTAs in Title Case; this repo uses sentence case ([MICROCOPY.md](MICROCOPY.md#rules)).
- **Placement:** "Make the CTA obvious, early, and repeated" [coreyhaines31/marketingskills, copy-editing]. Check: "Is it visible without scrolling?", "Is there a logical primary vs. secondary CTA structure?", "Are CTAs repeated at key decision points?" [coreyhaines31/marketingskills, cro]. Trust signals go "Near CTAs and after benefit claims".
- **"Sign up":** marketingskills lists "Sign Up" among weak CTAs. landing-page-ui does it differently: its hero has "the two app buttons (sign up solid, log in soft)" ([landing-page-ui SECTIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SECTIONS.md)); in the owner's sites that is the design.
- **In a 1:1 email the ask is a reply, not a button.** Two views: [coreyhaines31/marketingskills, cold-email] says "Interest-based CTAs ('Worth exploring?' / 'Would this be useful?') beat meeting requests"; this section's rule is for page buttons. Cold email copy is in [cold-outreach COPY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/COPY.md); email sequences, and the structure, button text and length of each email, in [email-marketing SEQUENCES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/email-marketing/SEQUENCES.md#writing-each-email).

## 5. Copy slop specific to pages

On top of the prose patterns in `anti-slop-writing`:
- **Marketing stock phrases (Ban):** each one, and what to write instead [coreyhaines31/marketingskills, copywriting] (the replacements show the shape only; the facts must be real):

| Phrase | Instead |
|---|---|
| "Say goodbye to X" | Show the new workflow: "Reconciliation runs nightly. You review the exceptions." |
| "Unlock the power of X" | Name the outcome and the number |
| "X, reimagined" | Say what's actually different: "Billing that retries on payday" |
| "Take X to the next level" | Name the level: the metric and the target |
| "Transform the way you work" | A before and after with numbers |
| "The X you deserve" | The specific gap you close |
| "The future of X is here" | What ships today |
| "Built for teams who move fast" | The real customer and trigger: "For subscription teams past $1M ARR fighting failed payments" |
| "Everything you need to", "all-in-one" | The 2 to 3 things buyers actually check for |
| "effortless", "in just a few clicks" | The real step count or time: "3 steps, about 4 minutes" |
| "Join thousands of happy customers", "loved by teams everywhere" | The real count, logos, or a named quote |

- **Template sections:** an FAQ of generic questions ("Is my data secure?") nobody asked about this product; a "How it works" forced into three steps; a "Trusted by" bar of logos you can't name; testimonials without a real person. Cut what you can't make real.
- **Section openers that pretend empathy:** "We've all been there", "You know the feeling", "If you're like most..." Name the specific situation instead.
- **Label headings:** "Features", "Why us", "How it works" as the whole heading. Write headings that make a claim.
- **Exclamation marks and hype punctuation** in body copy.
- **Automation hype:** "set it and forget it," "fully autonomous marketing," "AI does everything," "10x on autopilot," "growth hacking machine" [coreyhaines31/marketingskills, marketing-loops].
- **Ads:** use the [ad-specific writing tells](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ad-creative/SKILL.md#writing-the-copy), including the source disagreement about TikTok hooks. [coreyhaines31/marketingskills, ad-creative]
- **Selling an SEO product:** "SEO-tool marketing that promises rankings, traffic, or 'guaranteed results', or that invents scores without showing the method behind them." and "Fear-based upsells that turn observations into emergencies. A `noindex` is an observation until intent says otherwise." [iannuttall/seo].

## 6. Output

For page copy, deliver:
1. The copy in page order (headline, subhead, CTA, each section's heading and body, secondary CTAs), with `[NEED: ...]` markers where facts are missing.
2. For the headline and the main CTA, two or three real alternatives, each with a one-line rationale (which reader, which doubt it answers).
3. Short annotations only for non-obvious choices.
4. If it's a web page: the page title (descriptive and concise, topic first) and meta description (a short, unique summary of what the page gives). Google sets no length for either: "there's no limit on how long a `<title>` element can be", and the title link "is truncated in Google Search results as needed, typically to fit the device width" ([title links](https://developers.google.com/search/docs/appearance/title-link)); "There's no limit on how long a meta description can be" ([snippets](https://developers.google.com/search/docs/appearance/snippet)). Google asks for every page to have a title, no "unnecessarily long or verbose text" and no "repeated or boilerplate text", and a description per page that is a "short, relevant summary", not a keyword list. Front-load what matters so a cut doesn't lose it. This line said "about 55 to 60 characters" and "under about 155 characters" before; those are truncation heuristics, not Google rules.
5. Run the check in [CHECK](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/CHECK.md) and the proof test above before handing it over. List the open `[NEED]` items at the end.

A point edit returns only the changed lines, each with a one-line reason ([DRAFTING.md](DRAFTING.md#output-for-a-point-edit)).

For a review of existing copy, report findings as `section: "quoted line" -> problem -> fix`, most damaging first (invented proof, then unclear value, then generic lines, then style). The passes that find them are in [REVIEW.md](REVIEW.md).

## Prove it

- Every number, name, logo, quote and badge in the copy traces to the context file or the user; the rest are `[NEED: ...]`.
- Every headline and section heading passes the swap test.
- No phrase from the §5 ban table, and every CTA names the action and what the person gets.
- The page title and meta description are unique to the page, with no character count presented as a Google rule.
- Urgency, scarcity, "free" and guarantee lines each match a real deadline, limit or term.
