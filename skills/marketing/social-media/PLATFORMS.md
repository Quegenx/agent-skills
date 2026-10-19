# Platform playbooks

What works on each platform, from coreyhaines31/marketingskills `social` (`references/platforms.md`, MIT). These are the source's practitioner opinions: posting frequencies, best times, audience ages and claims like "Reels get 2x reach" come from no platform documentation. "One thing holds on every platform below: storytelling and connecting with your audience are always key." Limits are in [PLATFORM-LIMITS.md](PLATFORM-LIMITS.md); X ranking mechanics in [X-RANKING.md](X-RANKING.md).

**Contents:** [LinkedIn](#linkedin) · [X](#x) · [Instagram](#instagram) · [TikTok](#tiktok) · [Facebook](#facebook) · [Telegram](#telegram) · [Prove it](#prove-it)

## LinkedIn

`[coreyhaines31/marketingskills, social]`

- **Best for:** B2B, thought leadership, professional networking, recruiting. **Posting:** 3 to 5 times a week. **Best times:** Tuesday to Thursday, 7 to 8am, 12pm, 5 to 6pm.
- **Works:** personal stories with business lessons; contrarian takes on industry topics; behind the scenes of building a company; data and original insights; carousels (document posts); polls that spark discussion.
- **Doesn't:** overly promotional content; generic motivational quotes; links in the main post ("kills reach"); corporate speak without personality.
- **Format:** the first line is everything (the hook before "see more"); line breaks for readability, without breaking every sentence ([POSTS.md](POSTS.md#no-ai-tells)); "1,200-1,500 characters performs well"; links in comments, not the post body; tag people sparingly and genuinely.
- **Algorithm (source's reading):** first-hour engagement matters most; comments beat reactions beat clicks; dwell time signals quality; no external links in the post body; document posts get strong reach; polls drive engagement but don't build authority.

## X

`[coreyhaines31/marketingskills, social]`

- **Best for:** tech, media, real-time commentary, community. **Posting:** 3 to 10 times a day including replies. **Best times:** vary by audience; test and measure.
- **Works:** hot takes and opinions; threads that teach; behind-the-scenes moments; engaging with others' content; memes and humor if on-brand; real-time commentary.
- **Doesn't:** pure self-promotion; threads without a strong hook; ignoring replies and mentions; scheduling everything with no real-time presence.
- **Format:** a specific claim in the first 8 words; the topic in the first 10; specific tools, companies and numbers instead of vague nouns; threads open with the hook and promise, then deliver; quote posts with added insight are the source's preference. Video-duration gates and their dated coefficients are defined in [X-RANKING.md](X-RANKING.md#published-defaults); the old recap promised eight-second video credit, which the canonical code reading corrects.
- **Publishing preferences:** write something useful to forward, maintain a clear bio and pinned post, space original posts about 60 minutes apart and be present for the first 30 minutes; avoid engagement bait. These are [source heuristics](X-RANKING.md#source-publishing-heuristics), not guaranteed scoring effects. The old recap said profile clicks count; the [dated default and correction](X-RANKING.md#published-defaults) explain why that is not a universal ranking claim.

## Instagram

`[coreyhaines31/marketingskills, social]`

- **Best for:** visual brands, lifestyle, ecommerce. **Posting:** 1 to 2 feed posts and 3 to 10 Stories a day. **Best times:** 11am to 1pm, 7 to 9pm.
- **Works:** high-quality visuals; behind-the-scenes Stories; Reels; carousels with value; user-generated content; interactive Stories (polls, questions).
- **Doesn't:** low-quality images; too much text in images; ignoring Stories and Reels; only promotional content.
- **Format:** the source claims "Reels get 2x reach of static posts" (unverified); the first frame of a Reel must hook; carousels of educational slides (through the API at most 10 items, [PLATFORM-LIMITS.md](PLATFORM-LIMITS.md#instagram)); use the Story features.
- **Algorithm (source's reading):** Reels prioritized over static posts; saves and shares beat likes; Stories keep you at the top of the feed; consistency matters more than perfection.

## TikTok

`[coreyhaines31/marketingskills, social]`

- **Best for:** brand awareness, younger audiences, viral potential. **Posting:** 1 to 4 times a day. **Best times:** 7 to 9am, 12 to 3pm, 7 to 11pm.
- **Works:** native, unpolished content; trending sounds and formats; education in an entertaining wrapper; POV and day-in-the-life content ([creator-marketing UGC-FORMATS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/creator-marketing/UGC-FORMATS.md#day-in-the-life)); replying to comments with videos; duets and stitches.
- **Doesn't:** overly produced content; ignoring trends; hard selling; repurposed horizontal video.
- **Format:** hook in the first 1 to 2 seconds; under 30 seconds to start; vertical only (9:16); trending sounds; post consistently. Organic video structure is in [SHORT-VIDEO.md](SHORT-VIDEO.md).

## Facebook

`[coreyhaines31/marketingskills, social]`

- **Best for:** communities, local businesses, groups. **Posting:** 1 to 2 times a day. **Best times:** 1 to 4pm weekdays.
- **Works:** Facebook Groups; native video; live video; local content and events; discussion-prompting questions.
- **Doesn't:** links to external sites ("reach killer"); pure promotional content; ignoring comments; cross-posting from other platforms without adaptation.

## Telegram

`[coreyhaines31/marketingskills, social]` with benchmarks from TGScope's studies of public channels; TGScope contributed this section to the source ("the contributor runs TGScope"), so treat the numbers as one vendor's data (https://tgscope.io/rnd/telegram-channel-reach, https://tgscope.io/rnd/posting-frequency-reach-decay).

- **Best for:** broadcast channels (news, niche expertise, deals, crypto, education, entertainment) and markets where Telegram is a primary platform.
- **How reach works:** there is no ranking feed. Every post goes to every subscriber's chat list in order; nothing is boosted or buried. Discovery happens outside the channel: links and paid posts in other channels, forwards, Telegram search, "similar channels" suggestions, Telegram Ads.
- **The metric** is the view counter under each post (reactions and comments are optional per channel), so track views ÷ subscribers against channels of the same size, topic and language (the baseline tables are in [creator-marketing TELEGRAM-CHANNELS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/creator-marketing/TELEGRAM-CHANNELS.md#vetting-a-channel)).
- **Views keep arriving for days:** about 15% in the first hour, 50% in 24 hours, 67% in 72 hours. Judge a post after a week.
- **Posting hour barely matters:** in Russian- and Ukrainian-language channels, posts published between 9:00 and 21:00 ended within 1% of each other after a week.
- **Frequency costs reach:** median 16.6% for channels posting less than every other day, 10.7% at 0.5 to 1 posts a day, 6.9% at 1 to 2, 5.1% at 2 to 4, about 4.5% above 4. Most channels post 1 to 2 times a day.
- **Ads cost reach:** ad-heavy channels reach a smaller share of subscribers per post than ad-free ones ([creator-marketing TELEGRAM-CHANNELS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/creator-marketing/TELEGRAM-CHANNELS.md#vetting-a-channel), check 4).
- **Works:** one clear topic and a predictable format; fewer, stronger posts; cross-promotion and paid posts in channels of similar size and topic (the main growth lever without a recommendation feed); a pinned post that tells new subscribers what the channel is.
- **Doesn't:** several ads a day; judging a post in its first hours; treating subscriber count as audience.
- **Format:** the first line is the headline, shown in the chat-list preview. Compare topics on their own baselines ([creator-marketing TELEGRAM-CHANNELS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/creator-marketing/TELEGRAM-CHANNELS.md#vetting-a-channel), check 2).
- Buying posts in other channels (vetting, ad networks, pricing per view) is in [creator-marketing TELEGRAM-CHANNELS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/creator-marketing/TELEGRAM-CHANNELS.md).

## Prove it

The plan for each platform states its posting cadence and formats and marks them as the source's opinion; LinkedIn and Facebook posts keep external links out of the body; TikTok and Reels are vertical cuts, not recut horizontal video; Telegram posts are judged on views ÷ subscribers after a week against the channel's own size baseline; and no number from this file is presented as a platform's own statement.
