# Writing posts

Hooks, post templates, the AI tells specific to social, and comment quality. Text is from coreyhaines31/marketingskills `social` (SKILL.md, `references/post-templates.md`, `references/listening.md`; MIT). The full AI-tells list for any text is [anti-slop-writing TELLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/TELLS.md); carousel slides are in [CAROUSELS.md](CAROUSELS.md); video hooks are in [SHORT-VIDEO.md](SHORT-VIDEO.md#hook-library).

## Hook formulas

`[coreyhaines31/marketingskills, social]` The first line determines whether anyone reads the rest. A formula is a starting shape: fill it with a specific fact, number or story.

- **Curiosity:** "I was wrong about [common belief]." · "[Outcome] usually comes down to [specific, surprising cause]." · "[Impressive result] in [surprisingly short time]." · "Nobody talks about [insider knowledge]."
- **Story:** "Last week, [unexpected thing] happened." · "I almost [big mistake/failure]." · "3 years ago, I [past state]. Today, [current state]." · "[Person] told me something I'll never forget."
- **Value:** "How to [desirable outcome] (without [common pain]):" · "[Number] [things] that [outcome]:" · "The simplest way to [outcome]:" · "Stop [common mistake]. Do this instead:"
- **Contrarian:** "Unpopular opinion: [bold statement]" · "[Common advice] cost us [specific result]." · "I stopped [common practice] and [positive result]." · "Everyone says [X]. In our [N] [accounts/clients/tests], [Y]."
- **Social proof:** "We [achieved result] in [timeframe]. Here's the full story:" · "[Number] people asked me about [topic]. Here's my answer:" · "[Authority figure] taught me [lesson]."

On X, the source recommends a specific claim in the first 8 words and the topic in the first 10 as writing heuristics ([X-RANKING.md](X-RANKING.md#source-publishing-heuristics)).

## Post templates

`[coreyhaines31/marketingskills, social]` Shapes to fill, not to paste. The closing lines marked † ("Which resonates most with you?", "Am I wrong?", the engagement ask) sit close to the engagement bait the source bans below: end on the point, or on a real question you want answered.

### LinkedIn: the story post
```
[Hook: Unexpected outcome or lesson]
[Set the scene: When/where this happened]
[The challenge you faced]
[What you tried / what happened]
[The turning point]
[The result]
[The lesson for readers]
[Question to prompt engagement] †
```

### LinkedIn: the contrarian take
```
[Unpopular opinion stated boldly]
[What you saw that changed your mind, with a number]
[Reason 1]
[Reason 2]
[Reason 3]
[What you recommend instead]
[Invite discussion: "Am I wrong?"] †
```

### LinkedIn: the list post
```
[X things I learned about [topic] after [credibility builder]:
1. [Point]: [Brief explanation]
2. [Point]: [Brief explanation]
3. [Point]: [Brief explanation]
[Wrap-up insight]
Which resonates most with you? †
```

### LinkedIn: the how-to
```
How to [achieve outcome] in [timeframe]:
Step 1: [Action]
↳ [Why this matters]
Step 2: [Action]
↳ [Key detail]
Step 3: [Action]
↳ [Common mistake to avoid]
[Result you can expect]
[CTA or question]
```

### X: the tutorial thread
```
Post 1: [Hook + promise of value]
"Here's exactly how to [outcome] (step-by-step):"
Posts 2-7: [One step per post with details]
Final post: [Summary + CTA]
"If this was helpful, follow me for more on [topic]"
```

### X: the story thread
```
Post 1: [Intriguing hook]
"[Time] ago, [unexpected thing happened]. Here's the full story:"
Posts 2-6: [Story beats, building tension]
Post 7: [Resolution and lesson]
Final post: [Takeaway + engagement ask] †
```

### X: the breakdown thread
```
Post 1: [Company/person] just [did thing].
[One-line takeaway: what they did and the result, with a number]
Posts 2-6: [Analysis points]
Post 7: [Your key takeaway]
"[Related insight + follow CTA]"
```

### Instagram: the carousel hook
```
[Slide 1: Bold statement or question]
[Slides 2-9: One point per slide, visual + text]
[Slide 10: Summary + CTA]
Caption: [Expand on the topic, add context, include CTA]
```
The generic shape; the five full frameworks are in [CAROUSELS.md](CAROUSELS.md). Through Instagram's API a carousel holds at most 10 items ([PLATFORM-LIMITS.md](PLATFORM-LIMITS.md#instagram)).

### Instagram: the Reel script
```
Hook (0-2 sec): [Pattern interrupt or bold claim]
Setup (2-5 sec): [Context for the tip]
Value (5-25 sec): [The actual advice/content]
CTA (25-30 sec): [Follow, comment, share, link]
```

## No AI tells

[coreyhaines31/marketingskills, social] "Readers scroll past posts that read as generated, and on LinkedIn they say so in the comments." Apply the canonical [structure rules](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/TELLS.md#1-structure-the-worst-offenders), [stock phrases](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/TELLS.md#2-openers-transitions-and-closers-ban), [punctuation and emoji rules](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/TELLS.md#5-formatting), and [social-post rules and per-post caps](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/TELLS.md#7-social-posts-and-email).

X's separate negative-action predictions do not establish a fixed penalty for each engagement-bait phrase ([X-RANKING.md](X-RANKING.md#signal-families)). [coreyhaines31/marketingskills, social; xAI sources in X-RANKING.md]

## Comments

`[coreyhaines31/marketingskills, social]`

- **Quality comments:** add new insight, not "Great post!"; share a related experience; ask a thoughtful follow-up question; disagree respectfully with nuance.
- **Tier 1, relationship builder** (target accounts, ICP, high intent): a specific insight or counter-example, your own experience with specifics, a follow-up that invites a reply; 2 to 4 sentences, no link.
- **Tier 2, visibility play** (high-reach post, adjacent topic): one sharp insight in one sentence, for example "Agreed, and the part most miss is [X]" (the source writes it with an em dash, which its own rules ban); 1 to 2 sentences.
- **Tier 3, light touch** (relationship maintenance): a specific reaction, quoting a specific line and reacting to it; 1 sentence.
- **Never:** "Great post!", emoji-only, "+1", "This is gold 🔥".

Don't waste a tier 1 draft on a tier 3 opportunity. Which posts to comment on is [LISTENING.md](LISTENING.md#scoring-rubric).

## Prove it

A punchy launch post leads with a specific fact, number or customer situation and has no contrast reveal, negation list, colon reveal, em dash, broetry or bait closer; every template used ends on the point or a real question; a thread's first post carries the hook and each later post stands alone; a carousel built from the Instagram template has at most 10 items when posted through the API; and every comment draft has a tier and says something the post didn't.
