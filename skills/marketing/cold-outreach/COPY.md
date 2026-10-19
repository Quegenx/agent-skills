# Cold email copy

The goal is an email that reads as if a sharp, thoughtful person wrote it to one reader, not a sales machine filling a template [coreyhaines31/marketingskills, cold-email]. Generic AI-writing tells and how to edit them out are in [anti-slop-writing TELLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/TELLS.md); page and product copy is in [anti-slop-copy SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md). What the email must legally contain is in [SENDING.md](SENDING.md#the-email-itself).

**Contents:** [Writing principles](#writing-principles) · [Voice per audience](#voice-per-audience) · [Structures](#structures) · [Frameworks](#frameworks) · [Personalization](#personalization) · [Personalizing with AI](#personalizing-with-ai) · [Subject lines](#subject-lines) · [What to avoid](#what-to-avoid) · [Quality check](#quality-check) · [Prove it](#prove-it)

## Writing principles

[coreyhaines31/marketingskills, cold-email]

- **Write like a peer, not a vendor.** Use contractions. Read it aloud; if it sounds like marketing copy, rewrite it.
- **Every sentence earns its place.** "If a sentence doesn't move the reader toward replying, cut it. The best cold emails feel like they could have been shorter, not longer."
- **Personalization connects to the problem.** "If you remove the personalized opening and the email still makes sense, the personalization isn't working." The observation should lead naturally into why you're writing.
- **Lead with their world.** "You/your" dominates over "I/we". Don't open with who you are or what your company does.
- **One ask, low friction.** Interest-based CTAs ("Worth exploring?", "Would this be useful?") beat meeting requests. One CTA per email, answerable with a one-line reply. No 30-minute call in the first touch.
- **Two views on CTAs.** anti-slop-copy's rule for page buttons: "A CTA says the action and what the person gets" and not "Learn more" or "Get started" ([anti-slop-copy SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md)). This source's rule is for a reply ask in one-to-one email, where the action is always "reply"; keep each rule to its medium.

## Voice per audience

[coreyhaines31/marketingskills, cold-email] The target voice: "A smart colleague who noticed something relevant and is sharing it. Conversational but not sloppy. Confident but not pushy."

- **C-suite:** ultra-brief, peer-level, understated.
- **Mid-level:** more specific value, slightly more detail.
- **Technical:** precise, no fluff, respect their intelligence.

It should not read like a template with fields swapped in, a pitch deck compressed into a paragraph, a LinkedIn DM from a stranger, or an AI-generated email ("I hope this email finds you well", "I came across your profile", "leverage", "synergy", "best-in-class").

## Structures

[coreyhaines31/marketingskills, cold-email] There is no single right structure; choose one that fits, or write freeform when the email flows without one.

- **Observation → Problem → Proof → Ask.** You noticed X, which usually means Y; we helped Z with that; interested?
- **Question → Value → Ask.** Struggling with X? We do Y. Company Z saw a result. Worth a look?
- **Trigger → Insight → Ask.** X happened; that usually creates Y; we've helped similar companies. Curious? (Use the trigger to pick the angle, not as the opener: see [prospecting SIGNALS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/SIGNALS.md#from-signal-to-play).)
- **Story → Bridge → Ask.** A similar company had a problem and solved it this way. Relevant to you?

## Frameworks

[coreyhaines31/marketingskills, cold-email] references/frameworks.md: "Frameworks beat templates: they teach thinking patterns, not copy-paste shortcuts." The source's examples name real companies (Datadog, HubSpot, Pfizer) with invented results; they are not copied, and any proof in your email is a real result of yours.

| Framework | Structure | Best for |
|---|---|---|
| PAS (default) | Identify pain → amplify consequences → solution + soft CTA | Problem-aware but not solution-aware prospects; "the workhorse framework" |
| BAB | Current painful situation → ideal future → your product as the bridge | Transformation offers with a clear before and after |
| QVC | Targeted pain question → brief value → direct next step | C-suite prospects who prefer brevity |
| AIDA | Hook or stat → their specific challenge → social proof or outcome → clear CTA | Data-driven prospects, high-ticket pitches with strong stats |
| PPP | Genuine compliment → how things could be better → gentle push | Senior prospects; "Requires genuine trigger" |
| Star-Story-Solution | Introduce a customer → their challenge → the results | Strong customer success stories |
| SCQ | Situation → complication → a question that speaks to the need | Consultative selling |
| ACCA | Contrarian hook → the benefit simply → proof → strong CTA | Analytical buyers (engineers, CFOs, ops leaders) |
| 3C's (Alex Berman) | Compliment → case study → CTA | Agency and services outreach |
| Mouse Trap (Lavender, Will Allred) | Observation + a binary value-prop question, 1 to 2 sentences | Maximum brevity |
| Justin Michael Method | Trigger or pain → solution hint → binary CTA, 1 to 3 sentences, no intro | High-velocity SDR teams; "Deliberately polarizing" |
| Vanilla Ice Cream (Lavender) | Observation → problem or insight → credibility → solution → call to conversation | A universal base framework |
| PASTOR (Ray Edwards) | Problem → amplify → story → testimony → offer → response | Longer emails or multi-email sequences, one element per touch |

Two of the source's examples carry no claims and show the shape:

> Your team doubled this year. That usually means onboarding is eating into selling time. How are you handling ramp for new hires? (SCQ)

> Looks like you're hiring reps. Would it be helpful to get a more granular look at how they're ramping on email? (Mouse Trap)

Justin Michael's method also says: spend at most a minute on personalization, use industry or persona signals, and for top-tier prospects "quote their own words from interviews".

## Personalization

[coreyhaines31/marketingskills, cold-email] references/personalization.md, crediting Clay: "if your personalization has nothing to do with the problem you solve, it's just an attention hack". The source cites Lavender for "50-250% more replies" from personalization (vendor data).

**Four levels**

1. **Basic (merge tags):** first name, company, title. "Table stakes, no longer differentiating."
2. **Industry or segment:** industry pain points, trends, regulatory challenges; scales through micro-segmentation.
3. **Role:** challenges specific to their role and seniority.
4. **Individual:** a specific, timely observation about that person, connected to the problem you solve. "Noticed you're hiring 3 SDRs. Sounds like you're scaling outbound fast. Most teams hit follow-up fatigue during onboarding."

**Research signals**

| Signal | Where to find it | How to use it |
|---|---|---|
| Recent funding | Crunchbase, LinkedIn, press | Scaling teams fast usually creates a specific challenge |
| Job postings | LinkedIn Jobs, careers page | "Noticed you're hiring 3 SDRs" |
| Tech stack | BuiltWith, Wappalyzer, HG Insights | Teams at their stage hit a ceiling with a tool they use |
| LinkedIn activity | Posts, comments, job changes | A specific point from their post |
| Company news | News search, press releases | An acquisition usually creates an integration challenge |
| Podcasts and talks | Search, YouTube, podcasts | A specific point from the talk |
| Website changes | Manual review | "Your new pricing page caught my eye" |

Freshness windows for each signal, and why "Congrats on the raise" is a weak opener, are in [prospecting SIGNALS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/SIGNALS.md#freshness-windows).

**The 3-minute system** (from "30 Minutes to President's Club", as the source credits it):

1. Build a research stack of the top 10 buying signals: 5 company triggers, 5 person triggers, ranked by relevance.
2. Build a 3x3 template: personalization attached to a problem; the problem you solve; a one-sentence solution plus a low-friction CTA.
3. Write 5 trigger templates: a pre-written personalization paragraph per trigger, with a segue into the problem. The rest of the email stays constant.

**The four -graphic principles (Becc Holland):** demographic (age, profession, background), technographic (stack, tools), firmographic (size, funding, industry, stage), psychographic (values, passions, beliefs; the source calls it the "highest-impact dimension"). The prospecting rules forbid targeting sensitive traits even when public ([prospecting LIST-COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/LIST-COMPLIANCE.md#sensitive-traits)).

**Openers that work:** a trigger event tied to the challenge it creates; an observation from their own post with a specific detail; an industry insight framed as a question ("Curious if that matches your experience at [Company]").

**What feels fake:** similar AI phrasing; attention hacks disconnected from the problem ("Cool that you went to UCLA!" then a pitch); personalizing "to creepiness"; "I saw your LinkedIn profile and wanted to reach out".

**The "So what?" test:** after writing any opening line, read it as the prospect: "So what? Why would I care?" If the answer is nothing, rewrite.

## Personalizing with AI

[coreyhaines31/marketingskills, cold-email] Agents make individual research cheap "and they make invented personalization just as cheap". Buyers spot praise for the mission, congratulations on a year-old round, "I noticed you're in SaaS".

- **Relevance beats personalization:** a specific trigger, the pain it implies and a concrete offer beat a clever personal line on a generic pitch.
- **Facts first, then the angle,** in two separate steps, with a source URL for every fact.
- **Allow "no hook found"** and fall back to the segment message.
- **Review before sending** for Tier 1 and a sample of Tier 2.

The full research rules and the brief template are in [prospecting ACCOUNT-RESEARCH.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/ACCOUNT-RESEARCH.md).

## Subject lines

[coreyhaines31/marketingskills, cold-email] references/subject-lines.md. The subject line's only job is to get the email opened: short, boring, internal-looking. The figures are vendor data as the source attributes them.

- **2 to 4 words.** Lavender: 2-word subjects get "60% more opens" than 5-word. Belkins (5.5M emails): 2 to 4 words "46% open rates vs 34% for 10 words". Mobile truncates at 30 to 35 characters.
- **Look like a colleague wrote it** ("reply rates", "hiring ops", "Q2 forecast", "second page"); Gong reports that doubles open rates. The subject must still describe the content truthfully: CAN-SPAM bans deceptive subject lines ([SENDING.md](SENDING.md#the-email-itself)).
- **Lowercase.** Gong (85M+ emails): all-lowercase has the highest open rates.
- **Context, not their name.** First name in the subject "→ 12% fewer replies"; use their pain point, competitor or trigger instead.
- **Questions only when specific.** Belkins and Lavender disagree; the source's resolution: specific pain questions work, generic ones ("Quick question?", "Have 15 minutes?") fail. Default to statements.
- **Avoid:** salesy words ("increase", "boost", "ROI"), urgency ("ASAP", "urgent"), excessive punctuation, numbers and percentages, emojis, pitching the product and an empty subject. The source also advised avoiding words to influence spam filters; do not use word substitution for filter evasion. [coreyhaines31/marketingskills, cold-email; owner safety rule 9]
- **C-suite:** ultra-concise, human, understated ("thank you", "an update", "a question", or a specific project or trigger).

The repo's "50 characters or less" for marketing subject lines in [email-marketing SEQUENCES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/email-marketing/SEQUENCES.md#campaign-copy-conventions) is for opted-in newsletters; this is a different medium.

## What to avoid

[coreyhaines31/marketingskills, cold-email]

- Opening with "I hope this email finds you well" or "My name is X and I work at Y".
- Jargon: "synergy", "leverage", "circle back", "best-in-class", "leading provider".
- Feature dumps; one proof point beats ten features.
- AI tells prospects spot in the first line: contrast reveals ("It's not about X, it's about Y") and "no X, no Y, no Z" lists; a claim followed by a comma and more restating clauses; self-answered questions and colon reveals (a real question you want answered is fine); stock phrases ("Here's the thing", "I'll be honest", "Quick question" as an opener, "Say goodbye to", "Unlock", "Take it to the next level"); em dashes. These match [anti-slop-writing TELLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/TELLS.md), whose em-dash rule is none in short copy; a cold email is short copy.
- HTML, images or multiple links.
- Fake "Re:" or "Fwd:" subject lines (a Gmail guideline, not only style: [SKILL.md](SKILL.md#the-rules) rule 6).
- Identical templates with only `{{FirstName}}` swapped.
- "Just checking in" follow-ups ([SEQUENCES.md](SEQUENCES.md#phrases-that-kill-replies)).

## Quality check

[coreyhaines31/marketingskills, cold-email] Does it sound like a human wrote it (read it aloud)? Would you reply to it? Does every sentence serve the reader? Is the personalization connected to the problem? Is there one clear, low-friction ask?

## Prove it

Delete the opening line and the email no longer makes sense; "you/your" outnumbers "I/we"; there is one ask answerable in a line; the first email is under about 80 words with no link; the subject is 2 to 4 lowercase words that truthfully describe the content, with no first name and no fake "Re:"; no em dash and none of the tells above; every claim of a result is one you can source; and an agent-written opener came from a fact with a source URL, or says "no hook found".
