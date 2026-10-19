# Newsletter sponsorships

Buying a placement in someone else's newsletter. For B2B and prosumer products it's often the cleanest creator channel: the writer has already earned the reader's attention, the audience is easy to describe, and every placement can carry its own tracked link. Text is from coreyhaines31/marketingskills `influencer-marketing` (`references/newsletter-sponsorships.md`, MIT), which says it was "Adapted from Wispr Flow's newsletter-copy and link-creator skills (MIT), published in the skills.marketing library in 2026". Deal terms, the brief and disclosure in [PROGRAMS.md](PROGRAMS.md) and [DISCLOSURE.md](DISCLOSURE.md) apply here too.

## Choosing and vetting newsletters

`[coreyhaines31/marketingskills, influencer-marketing]` Judge a newsletter by who reads it and what earlier sponsors got. List size matters least.

- **Read three recent issues.** Is the content close to your category? Do the other sponsors sell to your buyer? Do readers reply or comment?
- **Ask for the audience breakdown:** role, seniority, company size, geography. Writers who know their readers can answer quickly.
- **Ask for clicks per sponsor placement,** as a median across recent sends. Open rates are inflated by Apple Mail Privacy Protection, so treat opens as a ceiling (this repo's line: "Apple Mail Privacy Protection over-reports opens; prefer clicks", [onesignal EMAIL-AND-SMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/onesignal/EMAIL-AND-SMS.md)).
- **Ask how many sponsors renew.** Sponsors that book again are the best evidence the list converts. Ask for one to contact.
- **Turn the price into a cost per click:** price ÷ median clicks, compared with your best channel's cost per click. The placement has to beat what the same money would buy there.
- **Test before buying a bundle.** Run one placement, read the result, then negotiate a package.

Sponsorship marketplaces (for example Passionfroot, Paved, or beehiiv's ad network) make finding and booking newsletters faster; the vetting questions still apply.

## Read past results before you book again

`[coreyhaines31/marketingskills, influencer-marketing]` For any newsletter you've sponsored before, read what each earlier placement did before you write the next one. Build one row per earlier placement:

| Send date | Publication | Placement | Angle | Clicks | Signups | Revenue | Signup rate |
|---|---|---|---|---|---|---|---|

Then write a few lines under it:

- **Top placement by clicks or revenue.** What about its structure is worth repeating?
- **Top placement by signup rate.** Which hook brought the right readers?
- **Near-zero clicks.** "This usually means the placement didn't go out (the issue slipped, the link broke, the ad was cut)." Confirm with the newsletter before you blame the angle.
- **Angles run on this list in the last 30 days.** Don't repeat them; "lists with overlapping readers count as the same list."
- **The call for this placement:** the angle you're choosing and why. If you go against what the data shows, say why.

The angle has to be recorded with each placement: a click count with no angle attached tells you nothing about what to write next.

## Placement specs

`[coreyhaines31/marketingskills, influencer-marketing]` These are one program's specs (Wispr Flow's). Every newsletter sets its own limits, so confirm them with the writer before drafting.

| Placement | Length | Notes |
|---|---|---|
| Subject line | 45 characters or fewer | Rarely sold; usually only with a dedicated send |
| Preheader | 50 to 90 characters | The preview text next to the subject |
| Primary | 150 to 250 words | The main sponsor slot, and the most common |
| Secondary | 100 to 125 words | A shorter slot lower in the issue |

## Writing the placement

`[coreyhaines31/marketingskills, influencer-marketing]`

- **Write 2 to 3 variants per placement** so you and the writer have options and something to compare against later.
- **One angle and one call to action.** A primary slot has room for one argument and one link.
- **Match the list.** A developer newsletter gets the developer angle and proof, even if your homepage leads with something else.
- **Use only claims you can back.** Keep a list of approved claims and proof points, and draw from it.
- **Fit the newsletter's voice.** Many writers rewrite sponsor copy in their own voice, and those versions usually do better. Send talking points, the required lines (offer, link, disclosure), and permission to rework the rest.
- **Disclose.** The source asks for a "Sponsored" or "Presented by" label; the FTC names "sponsored" as clear ("So are terms like 'advertisement,' 'ad,' and 'sponsored.'", https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers) and does not name "Presented by", so use "Sponsored".

Copy itself is in [anti-slop-copy SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md).

## One file and one tracked link per placement

`[coreyhaines31/marketingskills, influencer-marketing]`

- **One file per send date and placement,** for example `sponsorships/{partner}/2026-04-17-{publication}-primary.md`. Never combine two send dates in one file. Each placement needs its own link, its own checks, and its own record of who approved it.
- **Record the angle in that file.** That's where the read-past-results step gets it later.
- **One tracked link per placement,** even for two sends in the same week. A short link makes the copy cleaner and lets you change the destination after the issue ships. Build the UTMs with one newsletter pattern ([google-analytics SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/google-analytics/SKILL.md)): the campaign rolls up the month, and the content value names the placement and date.
- **Add a promo code** when the newsletter allows it. It catches readers who type the URL instead of clicking.

## Reporting

`[coreyhaines31/marketingskills, influencer-marketing]`

- **Per placement:** clicks, signups, activated or paying users, revenue, cost per click, and cost per signup.
- **Check that the clicks are people.** B2B lists can pick up clicks from corporate email-security scanners that follow every link. "If clicks far outnumber analytics sessions from that link, discount them." (The same scanners consume single-use sign-in links: [supabase AUTH-SIGN-IN.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/supabase/AUTH-SIGN-IN.md).)
- **Add a "How did you hear about us?" question** to signup. Newsletter readers often search for you later instead of clicking, and that shows up as branded search or direct ([marketing-attribution SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-attribution/SKILL.md)).
- **Decide after 2 to 3 placements per newsletter:** renew, change the angle or slot, or drop it. One bad send is too little data to judge, unless it never went out.
- **Feed the results back.** Add each placement's angle and result to the table above, so the next brief starts from it.

## Prove it

Every booked newsletter has a cost per click computed from its median sponsor clicks and compared with your best channel; the past-results table has a row per earlier placement with its angle, and no angle repeats on the same or an overlapping list within 30 days; each send date and placement has its own file, its own tracked link and an approver; the placement carries a "Sponsored" label; clicks were checked against analytics sessions; and the renew or drop call came after 2 to 3 placements.
