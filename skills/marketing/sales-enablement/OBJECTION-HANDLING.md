# Objection handling

Objection docs for training and live calls, plus how to answer one objection from a live deal. From coreyhaines31/marketingskills, skill `sales-enablement` (SKILL.md and references/objection-library.md, MIT). The source's library is for common B2B SaaS objections. Every proof point named below is a slot: fill it with a real case study, document or certification the company has, or leave it out and say so.

**Contents:** [Categories](#categories) · [Response framework](#response-framework) · [Live deal objection](#live-deal-objection) · [Quick-reference table](#quick-reference-table) · [Price](#price-objections) · [Timing](#timing-objections) · [Competition](#competition-objections) · [Authority](#authority-objections) · [Status quo](#status-quo-objections) · [Technical](#technical-objections) · [Prove it](#prove-it)

## Categories

[coreyhaines31/marketingskills, sales-enablement]

| Category | Examples |
|---|---|
| Price | "Too expensive," "No budget this quarter," "Competitor is cheaper" |
| Timing | "Not the right time," "Maybe next quarter," "Too busy to implement" |
| Competition | "We already use X," "What makes you different?" |
| Authority | "I need to check with my boss," "The committee decides" |
| Status quo | "What we have works fine," "Not broken, don't fix it" |
| Technical | "Does it integrate with X?," "Security concerns," "Can it scale?" |

## Response framework

[coreyhaines31/marketingskills, sales-enablement] For each objection, document:

1. **Objection statement:** exactly how reps hear it.
2. **Why they say it:** the real concern behind the words.
3. **Response approach:** how to acknowledge and redirect.
4. **Proof point:** specific evidence that addresses the concern.
5. **Follow-up question:** keep the conversation moving forward.

Two formats: a **quick-reference table** for live calls (objection, one-line response, proof point) that fits on one screen, and a **detailed doc** for prep and training (full context, talk tracks, role-play scenarios). The objection doc's deliverable is a table: objection, response, proof point, follow-up.

The product context file already has a slot for "the top objections and the true answers" ([anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md)); start from it.

## Live deal objection

[coreyhaines31/marketingskills, sales-enablement] When a rep brings one objection from a live deal ("the CFO just said Acme is half the price, I have a call in an hour"), answer that deal. Don't hand back a generic doc.

1. **Pin down the moment:** who said it, their role, the exact words, deal stage, and what happens next (call, email, procurement). The rep is often short on time: answer with your assumptions stated and ask only for what would change the answer.
2. **Name the likely concern behind it** and say what in the deal points to it. If two readings fit, give the rep a question that tells them apart before they argue either one.
3. **Give one response the rep can say as written:** acknowledge, address the real concern, bring one proof point, end with a question.
4. **Use only proof the rep can stand behind.** Pull from the objection library, case studies, and battle cards ([BATTLE-CARDS.md](BATTLE-CARDS.md)). If nothing fits, say so and suggest the claim to verify. Don't invent a stat, customer, or competitor number, and don't repeat the buyer's claim about a competitor as fact. "'Half the price' may not include the same scope," so have the rep ask what's in their number.
5. **Say when not to fight.** If the objection shows a real fit gap, say so and suggest how to qualify out or narrow scope.

Afterward, suggest the rep log the objection and how it went. Live objections are the raw material for the library and for win-loss analysis ([WIN-LOSS-ANALYSIS.md](WIN-LOSS-ANALYSIS.md)).

Deliverable: the likely concern, one response the rep can say as written, proof, follow-up question.

## Quick-reference table

[coreyhaines31/marketingskills, sales-enablement] For live calls. Find the objection, scan the response, reference the proof.

| Objection | Response (1-line) | Proof point |
|---|---|---|
| "Too expensive" | "Compared to what? Let's look at what the problem costs you today." | ROI case study showing payback in X months |
| "No budget" | "When budget opens up, what would need to be true for this to be a priority?" | Customer who started with a pilot to prove value |
| "Competitor is cheaper" | Use the price talk track only after checking the competitor's price and comparable scope; otherwise ask what's in their number ([live deal rule](#live-deal-objection)). | Verified price/scope comparison + actual customer who switched |
| "Not the right time" | "What changes next quarter that makes it better timing?" | Cost-of-delay calculation |
| "Maybe next quarter" | "Happy to reconnect. What would a pilot look like before then?" | Customer who started small and expanded |
| "We use X already" | "How's that working for [specific pain area]?" | Customer who switched from X |
| "What makes you different?" | "For teams like yours, the biggest difference is [specific differentiator]." | Side-by-side comparison for their use case |
| "Need to check with my boss" | "Absolutely. What would help you make the case? I can send materials." | Champion one-pager, ROI calculator |
| "The committee decides" | "Who's on the committee and what does each person care about?" | Multi-persona case study |
| "What we have works fine" | "It does work, the question is whether it's costing you more than it should." | Benchmark data showing efficiency gaps |
| "Not broken, don't fix it" | "Agreed, this isn't about fixing, it's about the opportunity cost of the current approach." | Customer who didn't know what they were missing |
| "Does it integrate with X?" | "Yes / Let me check and get you specifics by end of day." | Integration documentation, customer using same stack |
| "Security concerns" | "Completely fair. Here's our security overview, happy to loop in our team." | SOC 2 report, security whitepaper |
| "Can it scale?" | "We serve companies from [small] to [large]. Here's an example at your scale." | Case study at similar scale |
| "We tried something like this before" | "What went wrong? Understanding that helps me show how we're different." | Customer with same failed experience who succeeded with you |

## Price objections

[coreyhaines31/marketingskills, sales-enablement]

### "It's too expensive"

- **Why they say it:** may be a genuine budget constraint, sticker shock, or a negotiation tactic. Often means they don't yet see enough value to justify the cost.
- **Approach:** (1) don't defend the price immediately; ask "Compared to what?" (2) reframe from cost to investment: what does the problem cost them today? (3) walk through the ROI calculation together; (4) if budget is real, explore smaller starting points.
- **Talk track:** "I hear that. Let me ask, what's the cost of the problem we discussed? You mentioned your team spends [X hours] on [task] every week. At your team's loaded cost, that's roughly [$ amount] per year. Our solution runs [$ price], so the question is whether eliminating that problem is worth the investment."
- **Proof point:** ROI calculator or case study showing payback period.
- **Follow-up:** "If the ROI was clear, is this something you'd prioritize this quarter?"

### "We don't have budget for this"

- **Why they say it:** budget may genuinely be allocated. Or they haven't identified budget because priority isn't established.
- **Approach:** (1) validate: budget constraints are real; (2) understand timing: when does the budget cycle reset? (3) explore alternatives: pilot, smaller scope, different budget line; (4) help them build the business case to create budget.
- **Talk track:** "Totally understand. Two questions: When does your next budget cycle open? And, if we could show clear ROI with a limited pilot, is that something you could fund from a different line item? Sometimes teams fund this from the efficiency savings it creates."
- **Proof point:** customer who started with a small pilot and expanded after proving ROI.
- **Follow-up:** "Would it help if I put together an ROI brief you could share with your finance team?"

### "Competitor X is cheaper"

- **Why they say it:** they're comparing prices, possibly without comparing capabilities. May be using competitor price as leverage.
- **Approach:** first verify the claimed price difference and comparable scope under the [live deal rule](#live-deal-objection). Only then (1) acknowledge the verified difference; (2) shift to total cost of ownership and value delivered; (3) highlight evidenced differences at that price point; (4) share real proof from customers who evaluated both.
- **Talk track, only for a verified price difference and scope comparison:** "You're right, [Competitor] is less expensive. Here's what I've seen from teams who evaluated both: [Competitor] works well for [their strength]. Where it falls short is [specific gap]. Customers like [name] actually switched to us after starting with [Competitor] because [specific reason]. The question is whether [specific capability] is worth the difference for your team."
- **Source conflict:** the quick response said "They are" and this talk track conceded a lower price before checking it; the same source's live-deal rule says not to repeat the buyer's competitor claim as fact. Keep that verification rule and use only evidenced competitor and customer statements. [coreyhaines31/marketingskills, sales-enablement]
- **Proof point:** customer who switched from the competitor, with specific reasons.
- **Follow-up:** "What's most important to your team, the lowest price or the best fit for [their specific need]?"

The "[specific gap]" is a sourced, dated battle-card fact, not a guess ([BATTLE-CARDS.md](BATTLE-CARDS.md)).

## Timing objections

[coreyhaines31/marketingskills, sales-enablement]

### "Not the right time"

- **Why they say it:** competing priorities, organizational change, genuine capacity constraint, or lack of urgency.
- **Approach:** (1) understand what's competing for their attention; (2) quantify the cost of waiting; (3) explore low-commitment next steps that keep momentum; (4) set a concrete follow-up date.
- **Talk track:** "I get it, timing matters. Can I ask what's taking priority right now? The reason I bring up timing is that every month of [problem], based on our earlier conversation, costs your team roughly [$ amount]. A 3-month delay is [$ amount]. What if we mapped out a start date that works with your calendar so you're not losing that value?"
- **Proof point:** cost-of-delay calculation based on their specific numbers.
- **Follow-up:** "What would need to change for this to move up in priority?"

### "Maybe next quarter"

- **Why they say it:** genuine scheduling, or a polite way of saying "not interested enough right now."
- **Approach:** (1) accept the timeline gracefully; (2) propose a small action now that maintains momentum; (3) get a specific date for follow-up; (4) send value in the meantime (content, benchmarks, insights).
- **Talk track:** "Next quarter works. To make sure we hit the ground running, would it make sense to do [small next step] now? That way when Q[X] starts, you're not starting from scratch. I'll also send over [relevant content] in the meantime. Can we lock in [specific date] to reconnect?"
- **Proof point:** customer who started the evaluation process early and was live by their target date.
- **Follow-up:** "Is there anything I can send between now and then that would be helpful?"

## Competition objections

[coreyhaines31/marketingskills, sales-enablement]

### "We already use X"

- **Why they say it:** they have an existing solution and switching has real costs. May be satisfied, or may have frustrations they haven't voiced.
- **Approach:** (1) don't trash the competitor; ask how it's working; (2) probe for specific pain points with their current solution; (3) position as complementary if possible, replacement if not; (4) offer a side-by-side comparison or trial.
- **Talk track:** "How's that working for you? Specifically, when it comes to [area where you're stronger], is that meeting your needs? The reason I ask is that most teams who come to us from [Competitor] tell us [specific pain point] was the tipping point. Not saying that's you, but worth exploring."
- **Proof point:** customer who switched from that specific competitor.
- **Follow-up:** "If you could change one thing about your current setup, what would it be?"

### "What makes you different?"

- **Why they say it:** they're evaluating options and want a clear differentiator. Sometimes a genuine question, sometimes a test.
- **Approach:** (1) don't list features; give the one thing that matters most for their situation; (2) tie the differentiator to their specific pain; (3) back it up with proof; (4) offer to show, not just tell.
- **Talk track:** "For teams like yours, [their industry/size/use case], the biggest difference is [specific differentiator]. That matters because [connection to their pain]. For example, [Customer] was evaluating us alongside [Competitor] and chose us because [specific reason]. Want me to walk you through how that works?"
- **Proof point:** case study of a customer who chose you over alternatives.
- **Follow-up:** "What's the most important criteria for your decision?"

## Authority objections

[coreyhaines31/marketingskills, sales-enablement]

### "I need to check with my boss"

- **Why they say it:** they may not be the decision maker, or they need internal buy-in to proceed. Could also be a stall tactic.
- **Approach:** (1) support them, don't pressure them; (2) arm them with materials to sell internally; (3) offer to join a meeting with their boss; (4) understand what their boss cares about.
- **Talk track:** "Absolutely, what would help you make the case? I can put together a one-pager that covers the ROI and addresses the concerns your boss is likely to have. Also happy to jump on a quick call with them if that would be helpful. What does your boss typically prioritize: cost savings, risk reduction, or efficiency?"
- **Proof point:** champion enablement one-pager ([ONE-PAGERS.md](ONE-PAGERS.md#champion-enablement-one-pager)), ROI calculator.
- **Follow-up:** "What questions do you think your boss will ask?"

### "A committee decides this"

- **Why they say it:** enterprise buying involves multiple stakeholders. Genuine process, not a brush-off.
- **Approach:** (1) map the buying committee: who's involved and what each person cares about; (2) provide persona-specific materials; (3) offer to present to the committee; (4) help your champion navigate the internal process.
- **Talk track:** "That makes sense. Can you walk me through who's on the committee and what each person cares about? I can tailor materials for each stakeholder so you're not doing all the heavy lifting. I've also got a deck designed for executive presentations if that would be useful."
- **Proof point:** multi-stakeholder case study showing how different personas were addressed.
- **Follow-up:** "Who on the committee is most likely to push back, and what would their concern be?"

## Status quo objections

[coreyhaines31/marketingskills, sales-enablement]

### "What we have works fine"

- **Why they say it:** inertia is real. The current solution may be adequate, and change has real costs.
- **Approach:** (1) agree; don't argue with their experience; (2) shift from "broken vs. fixed" to "good vs. great"; (3) introduce the concept of opportunity cost; (4) show what peers are achieving.
- **Talk track:** "It probably does work, and I wouldn't suggest changing something that's truly meeting your needs. The question I'd ask is: is 'works fine' the bar? Teams using [your product] are seeing [specific outcome]. If you're leaving [X% improvement] on the table, is that worth exploring?"
- **Proof point:** benchmark data showing what's possible vs. status quo.
- **Follow-up:** "If there were one area where your current approach could be better, what would it be?"

## Technical objections

[coreyhaines31/marketingskills, sales-enablement]

### "Does it integrate with X?"

- **Why they say it:** integration is a real requirement. They need to know your product fits their stack.
- **Approach:** (1) answer directly: yes, no, or "let me check"; (2) if yes, provide specifics (native, API, Zapier, etc.); (3) if no, explain alternatives or workarounds; (4) "Never bluff, they'll find out during evaluation."
- **Talk track (if yes):** "Yes, we integrate with [X] natively. It takes about [time] to set up. [Customer] runs the same stack and here's how they have it configured."
- **Talk track (if no):** "We don't have a native integration with [X] today. Here's what customers typically do: [alternative]. We also have an open API that [description]. Would it help to get our technical team on a call to explore options?"
- **Proof point:** customer using the same tech stack, integration documentation.
- **Follow-up:** "What other tools are in your stack that we'd need to work with?"

### "We have security concerns"

- **Why they say it:** legitimate concern, especially in regulated industries or enterprise. Non-negotiable for many buyers.
- **Approach:** (1) take it seriously: "never dismiss security concerns"; (2) provide documentation proactively (SOC 2, security whitepaper); (3) offer to loop in your security team; (4) ask about their specific requirements.
- **Talk track:** "That's exactly the right question to ask. Here's our security overview, we're [SOC 2 Type II / ISO 27001 / etc.] certified, and I can share our full security documentation. We also have a security team that's happy to do a review call with your infosec team. What are your specific requirements?"
- **Proof point:** security certifications, compliance documentation, customers in regulated industries.
- **Follow-up:** "Do you have a security questionnaire you'd like us to fill out?"

The certification slot names only a certification the company holds today; if it holds none, the line goes and the rep offers the documentation that exists.

## Prove it

Every library entry has all five parts (statement, why, approach, proof, follow-up); the quick-reference table fits one screen; every proof point names a real asset or is marked missing; a live-deal answer states its assumptions, gives one sayable response ending in a question, does not restate the buyer's competitor claim as fact, and says when to qualify out; no talk track claims an integration or certification the company doesn't have.
