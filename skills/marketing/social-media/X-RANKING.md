# X ranking

How X's "For You" feed ranks posts and what to change in posting practice because of it. Text is from coreyhaines31/marketingskills `social` (`references/x-algorithm.md`, MIT), which reads xAI's open-sourced algorithm (https://github.com/xai-org/x-algorithm, the source's "May 2026 release", with the Phoenix ranker and the Grox content-understanding pipeline). This repo did not check the code itself; the source's own tags are kept.

**Sourcing note** `[coreyhaines31/marketingskills, social]`: the release publishes the ranking structure (which signals are scored and how they combine) but not the weight values (`params.rs` is withheld). Rules are tagged **[verified]** when the mechanism is visible in the code and **[reported]** when the number or magnitude comes from secondary analysis. "Structure changes slowly; reported numbers age fast."

## How ranking works

`[coreyhaines31/marketingskills, social]`

1. Candidate posts come from two sources: accounts the viewer follows (Thunder) and ML-retrieved posts from the global corpus (Phoenix retrieval). You always compete for out-of-network reach.
2. Filters remove ineligible posts before scoring: too old, already seen or served, muted keywords, blocked or muted authors.
3. The Phoenix transformer predicts a probability for each engagement type: about 15 separate predictions, not one quality score.
4. Final score = a weighted sum of those probabilities. Positive actions add; predicted negative actions (not interested, mute, block, report) subtract.
5. An author-diversity scorer decays the scores of repeated authors within a feed response, so your posts compete with each other.

The model has no hand-engineered quality features; it learns from engagement histories. You optimize for the behaviors it predicts: staying to read, sending to a friend, following the author, joining the conversation. "The rules tune distribution; the story earns the engagement."

## The signals

`[coreyhaines31/marketingskills, social]` [verified] Each is a separate weighted term in the scoring code:

| Signal | What to notice |
|---|---|
| Favorite (like) | The baseline, and the weakest lever given how many other signals exist |
| Reply | Conversation-starting posts earn a distinct signal |
| Repost | Public amplification |
| Quote and quoted-click | Two terms: engagement on a quote post and clicks through to the quoted post both score |
| Click | Opening the post detail |
| Profile click | Its own scored action |
| Share, share via DM, share via copy link | Three separate share signals; private sharing is modeled explicitly |
| Video quality view | Only above a minimum duration (`MIN_VIDEO_DURATION_MS`); short clips earn zero video credit |
| Dwell (two forms) | Time reading, scored as a threshold and as continuous time |
| Photo expand | Tapping to enlarge an image |
| Follow author | A post that converts a viewer into a follower earns its own signal |
| Not interested, mute, block, report | Negative weights; the model predicts these too |

## The 10 rules

`[coreyhaines31/marketingskills, social]`

1. **Open with a specific claim in the first 8 words.** [reported] Dwell is scored two ways [verified], and scroll-past kills it. The hook is the post.
2. **Wait ~60 minutes between original posts.** [reported number] The author-diversity scorer is verified: each additional post from the same author in a feed response gets a decayed score.
3. **Name your topic in the first 10 words.** [reported] Topic-based candidate sourcing is verified; the algorithm routes posts to topic followers only if it can tell the topic.
4. **Write for the DM forward, not the like.** [verified structure; relative weight reported] "would someone send this to a friend?" beats "would someone like this?"
5. **Quote posts score twice.** [verified structure] Quote engagement and quoted-click are separate terms; quoting with added insight beats a plain repost.
6. **Write for the follow.** [verified structure] Follow-author is a distinct signal.
7. **Make them curious enough to click your profile.** [verified structure] Profile clicks are scored, which is the argument for a strong bio and pinned post.
8. **Name specific things.** [verified mechanism] Specificity enables topic routing, and the muted-keyword filter removes posts before scoring: generic engagement-bait phrases are commonly muted; specific nouns rarely are.
9. **Video must clear the minimum duration, with captions.** [verified mechanism; ~8 s reported] Below the threshold video earns zero video credit; captions serve dwell (most viewing is muted).
10. **Be present for the first 30 minutes.** [reported] Each reply you answer is a fresh engagement event. "Post when you can stay, not when the scheduler fires."

## What kills reach

`[coreyhaines31/marketingskills, social]` [verified]

- **Muted keywords:** filtered before scoring. Spammy CTA phrases and rage-bait vocabulary are widely muted.
- **Predicted negative actions:** a post that pattern-matches content people block, mute or mark not interested is penalized before anyone acts. Engagement bait is a modeled negative ([POSTS.md](POSTS.md#no-ai-tells)).
- **Posting bursts:** author-diversity decay; your second post in an hour starts handicapped.
- **Already-seen content:** reposting the same content quickly hits the seen or served filters; space evergreen reruns.

## Caveats

`[coreyhaines31/marketingskills, social]`

- **Weights are unpublished.** "shares are worth N× likes" claims are inference. The safe conclusion is which behaviors are scored at all.
- **This ages fast.** Check https://github.com/xai-org/x-algorithm for changes before treating numbers as current.
- **X-specific.** Hooking early, specificity and reply presence travel to other platforms; 60-minute spacing, quote double-counting and video minimums do not.

## Prove it

An X plan spaces original posts about an hour apart rather than in a burst; every post names its topic and a specific claim in its opening words and names concrete things; none uses bait phrasing ("Like and retweet if…"); video posts clear about 8 seconds with captions; the poster is around for the first 30 minutes; and any number quoted from this file keeps its [verified] or [reported] tag. A draft like "We're so excited to announce something HUGE is coming... 🔥🔥" gets rewritten around the named feature, not lightly edited.
