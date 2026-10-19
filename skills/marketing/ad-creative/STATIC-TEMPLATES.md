# Static ad templates

Layout frameworks for image ads, each with slots for brand copy: the structure is proven, the inputs make it yours. Use them for statics at volume (Meta, Instagram, LinkedIn, display), and cycle through all of them rather than clustering on two or three favorites: template diversity is angle diversity, and the winner is usually not the one you'd have picked. From [coreyhaines31/marketingskills, ad-creative, static-ad-templates.md] (MIT); the tiers are distilled from Dara Denney's ranking (see [FORMAT-TIERS.md](FORMAT-TIERS.md)) and are practitioner. The source's DTC and SaaS sample lines are invented illustrations with invented numbers, so they're left out; every slot here is filled from your corpus.

**Contents:** [Reading the tiers](#reading-the-tiers) · [Generation rules](#generation-rules) · [The templates](#the-templates) · [Per-concept output](#per-concept-output) · [Batch distribution](#batch-distribution) · [Prove it](#prove-it)

## Reading the tiers

Template tiers and the scaler-versus-supporting-cast distinction are defined in [FORMAT-TIERS.md](FORMAT-TIERS.md#the-one-question). Use that role when choosing the [batch distribution](#batch-distribution); a supporting-cast format is not a failed cold scaler. [coreyhaines31/marketingskills, ad-creative]

## Generation rules

1. **Ground first:** read the corpus (winning ads, reviews, ad comments, voice) before generating ([SKILL.md](SKILL.md#grounded-inputs)).
2. **Cycle templates, weighted by tier** (below).
3. **Fill slots from source material:** every variation pulls its copy from a real review, winning-ad pattern or comment, and cites it. Customer language verbatim, not paraphrased into marketing-speak.
4. **Write the visual description** in enough detail that a designer or image tool can produce it without guessing.
5. Every variation has template name, headline, body, visual description and source grounding. Real names, real stats, real quotes only: fabricated social proof is a compliance and trust violation (16 CFR Part 465, https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials).
6. Match the brand voice doc, not generic direct-response voice.

## The templates

| # | Template | Tier and role | Structure | Copy slot | Source it from |
|---|---|---|---|---|---|
| 1 | **Headline Statement** | B, supporting cast; only cranks with excellent messaging, pairs with Callout | One dominant text line (60%+ of visual weight), product image, small logo | One claim specific enough to stop the scroll | The strongest winning-ad hook or most repeated benefit in reviews |
| 2 | **Us vs Them** | B, supporting cast; often in a brand's top 8 | Two columns, old way grayed on the left, yours in full color on the right, 4 to 6 rows with checks and crosses | Each row a real differentiator, not filler | Reviews that mention switching; comments comparing you to a competitor |
| 3 | **Stat Callout** | C, situational; for luxury and retail or awareness and traffic objectives, weak on DTC ROI | A giant stat (~60% of the visual), one line of context, product or logo anchor | A real, defensible number; measurement beats superlative | Case studies, product analytics, survey data; never invent it |
| 4 | **Review Card** | E, decayed; only for a genuinely specific, surprising verbatim review | A native-looking review card (match where your buyers read reviews), name, stars, date | A real review, verbatim | `inputs/reviews/`, with permission where the platform requires it |
| 5 | **Testimonial Stack** | E, decayed; only if all three quotes are specific and each covers a different objection | Three rows of photo, name, one-line quote, each scannable in 2 seconds | Three quotes covering different objections or benefits | Reviews, picked for coverage |
| 6 | **Before / After** | B, supporting cast for problem-aware viewers | Two panels with an arrow or divider, minimal labels | Each state labeled in the customer's words | Transformation language in reviews ("I used to X, now I Y"). Before/after claims are regulated in health, finance and beauty: check platform policy |
| 7 | **Problem / Solution** | B, supporting cast; kin to objection handling | Tension above, relief below | The pain in the customer's exact words, then the product's one-line answer | The most common pain phrasing in reviews |
| 8 | **Founder Message** | S, cold scaler; the source's most reliable first winner; the letter variant is strong during sales | A note-style layout, founder name or photo, no glamour product shot | "I built this because..." in one honest, unpolished paragraph | The actual founding story; the template collapses if fabricated |
| 9 | **Feature Spotlight** | B, supporting cast; a callout treatment | Product in the center, 4 to 6 callout boxes around it, 3 to 6 words each | The components buyers actually ask about | Features or ingredients that recur in reviews and comments |
| 10 | **Press Mention** | F, avoid; outlets pursue unlicensed logo use | Logo row, one quote, product anchor | A real quote from real coverage | Actual coverage only; check each outlet's logo terms. Default: don't build these |
| 11 | **Lifestyle Hero** | B, supporting cast; organic-native look | One photograph does the work, a short line and logo at most | 5 to 8 words, identity-flavored | Winning ads' visual patterns; identity language in reviews |
| 12 | **Numbered List** | E, decayed; use an Educational Infographic instead | Numbered rows, an icon and short line each, product anchor | Each reason a distinct angle (pain, outcome, proof, differentiator, price) | The most common switching reasons across reviews |
| 13 | **FAQ Card** | B, supporting cast; objection handling in static form, works fast | The question prominent, a concise answer, product anchor | The objection as customers phrase it | `inputs/comments/`, the objections posted under your ads |
| 14 | **Competitor Callout** | B, supporting cast for comparison shoppers | Their name vs yours on one clear axis | A difference you can prove with facts | Competitor mentions in reviews and comments. Comparative claims must be truthful and substantiated; some platforms restrict naming competitors |
| 15 | **Origin Story** | S, cold scaler; the one long-copy static that reliably opens new reach | Portrait or team photo, 2 to 3 short paragraphs, product secondary | The specific moment or frustration that started it | The real story |
| 16 | **Grid Static** | A, cold scaler; first static to try with more than one product | 4 to 9 product tiles on a neutral ground, consistent light and crop, small logo, optional bundle price | A collection name or "build your bundle" line | Which SKUs and bundles reviews and comments cluster around |
| 17 | **Callout** | B, supporting cast; durable and cheap to iterate | Product in the center, leader lines to 3 to 5 labels of 2 to 5 words | Attributes buyers ask about, not spec-sheet filler | Features recurring in reviews and comments |
| 18 | **Mood Board** | B, supporting cast for apparel, home and lifestyle | 3 to 6 tiles of product, texture and scene in one palette | A short identity line at most | Winning ads' visual language; aesthetic words in reviews. Rarely fits SaaS; use Lifestyle Hero |
| 19 | **Educational Infographic** | B, supporting cast; reads as content, under-used | A diagram, cycle or labeled cross-section, brand minimal until the anchor | One genuine, checkable teaching point | Mechanism questions in comments and documented product facts; educational framing raises the bar on truth |
| 20 | **Challenging Your Beliefs** | B, supporting cast; needs known persona beliefs | The belief up top, the correcting fact below, product as proof | The belief in the customer's words, then the fact. State the fact; don't stage a "You don't need X. You need Y." reveal | Objections and misconceptions in comments and reviews |
| 21 | **Tweet / Reddit Screenshot** | B, supporting cast, strongest as a first frame | A pixel-accurate post card with avatar, handle, timestamp, counts | A real post, verbatim | Real mentions, your own organic posts, `inputs/comments/`, with permission where required. Never fabricate a social screenshot |
| 22 | **Ugly / Handwriting / Post-it** | B, a sales-period specialist; not an always-on default | One scrappy element (post-it, marker note, screenshot) over product or plain ground | A blunt, human line: the offer or the reason | The offer itself, phrased the way a customer reminds a friend. FTC rules on sale and scarcity claims: [offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md) |

## Per-concept output

```markdown
## Concept [N]: [Template Name] ([tier])

**Headline**: [the headline copy]
**Body**: [supporting copy, if the template uses it]
**Visual**: [layout description specific enough to design or generate from]
**Image prompt**: [prompt for the image tool, if generating]
**Grounded in**: [which review / winning ad / comment this traces to, quoted or named]
```

A batch gets an `INDEX.md` listing every concept with template, tier and grounding source, so a reviewer scans 50 in two minutes; a review page for someone else's approval is in [REVIEW-PAGE.md](REVIEW-PAGE.md). Text-led headlines follow [HEADLINES.md](HEADLINES.md#the-headline-as-the-visual); image generation for marketing is in [marketing-images](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-images/SKILL.md).

## Batch distribution

For a standard 50-concept batch, spread across the set but let tier and goal set the weights. Cold reach: over-index on S and A (Founder Message, Origin Story, Grid Static). Warm and retargeting: lean on the B supporting cast (Callout, FAQ Card, Before/After, Competitor Callout). Skip D to F (Press Mention, testimonial statics, Numbered List) without a specific reason. Once data shows templates winning for this brand, shift to 60% proven / 40% full coverage, never zero coverage: "the template that's tired next month is the one you're scaling today."

## Prove it

For a stalled DTC account with several SKUs wanting cold reach: the batch leads with Founder Message, Origin Story and Grid Static (Grid Static named for the SKUs), explains the scaler vs supporting-cast lens, flags Press Mention, testimonial statics and Numbered List as decayed, and every concept has a cited source with no fabricated social proof [coreyhaines31/marketingskills, ad-creative, evals #13].
