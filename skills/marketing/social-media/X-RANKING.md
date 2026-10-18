# X ranking

Feed-ranking interpretation from [coreyhaines31/marketingskills, social/references/x-algorithm.md], corrected against xAI's current published [README](https://github.com/xai-org/x-algorithm/blob/main/README.md), [parameters](https://github.com/xai-org/x-algorithm/blob/main/home-mixer/params/param.rs), [Phoenix scorer](https://github.com/xai-org/x-algorithm/blob/main/home-mixer/scorers/phoenix_scores_ranking_scorer.rs) and [value scoring](https://github.com/xai-org/x-algorithm/blob/main/xai-value-model/scoring.rs), read on 2026-10-18. These are published implementation/defaults, not a guarantee of every live experiment's configuration.

## Structure and predicted outcomes

[coreyhaines31/marketingskills, social/references/x-algorithm.md; xAI sources linked above]

- Followed-account and retrieved out-of-network candidates pass eligibility filters and scoring. A post can be absent before ranking because of seen/served, age, muted-keyword or author filters.
- The ranker predicts engagement outcomes, then weights those predictions. A published coefficient is not a multiplier on a post's observed engagement count or a promise of reach.
- Separate quote and quoted-click terms do not mean quoting earns twice the distribution. The source and this file formerly called that mechanism "Quote posts score twice"; retain the distinct predictions without that causal claim.
- Author-diversity scoring considers repeated authors in the ordered candidate pool. It does not prove that a second post within one hour receives a fixed penalty; the source's hourly spacing is a publishing heuristic.

## Signal families

[coreyhaines31/marketingskills, social/references/x-algorithm.md; xAI scorer and value-model sources linked above] Distinct modeled outcomes do not imply equal, positive or stable live coefficients:

| Family | Distinction |
|---|---|
| Favorite, reply, repost | Separate predicted engagement outcomes |
| Quote and quoted-click | Quote engagement and clicking through to the quoted post are different terms |
| Click and profile click | Opening post detail differs from clicking the author's profile |
| Share, share via DM, share via copy link | The source identifies separate public/private sharing outcomes |
| Video quality view | A duration-gated outcome; inspect both the threshold and its coefficient |
| Dwell | The source distinguishes thresholded and continuous reading-time terms |
| Photo expand | Opening the larger image |
| Follow author | Following from the post is a distinct modeled outcome |
| Not interested, mute, block, report | Negative-action predictions, distinct from a viewer already taking those actions |

## Published defaults

[xAI parameters](https://github.com/xai-org/x-algorithm/blob/main/home-mixer/params/param.rs), current file inspected 2026-10-18; the README dates publication of key weights to 2026-08-13.

| Parameter | Published default |
|---|---:|
| FavoriteWeight | 0.66 |
| ReplyWeight | 5 |
| PhotoExpandWeight | 0.05 |
| ProfileClickWeight | 0 |
| VqvWeight | 0 |
| QuoteWeight | 5 |
| QuotedClickWeight | 0.05 |
| MinVideoDurationMs | 10000 |

The source and this file formerly said weights were unpublished, likes were the weakest lever, profile clicks necessarily added score and the video threshold was about eight seconds. Those claims do not follow from these defaults: some listed coefficients are lower than favorite, some are zero, and the duration default is ten seconds. A duration gate does not by itself guarantee a positive contribution when the relevant coefficient is zero. Recheck the actual revision/configuration before quoting values.

## Source publishing heuristics

[coreyhaines31/marketingskills, social/references/x-algorithm.md]

- Open with a specific claim in the first eight words and name the topic in the first ten. These word counts are the source's writing preferences, not code-enforced routing thresholds.
- Space original posts about sixty minutes apart and be available for replies for the first thirty minutes. Neither number is established by the inspected diversity/ranking code.
- Make the post useful enough to forward and give a quote post added insight. Distinct modeled behaviors do not prove a universal DM-versus-like or quote-versus-repost advantage.
- Use concrete nouns, captions and a clear bio/pinned post where useful. Do not promise that profile clicks improve distribution under a zero default weight or that muted viewing is universal.
- Avoid engagement bait and misleading claims; the general copy rules remain in [POSTS.md](POSTS.md#no-ai-tells). A source's publishing advice is not permission for coordinated engagement or automated unsolicited contact.

## Prove it

[xAI sources linked above; coreyhaines31/marketingskills, social/references/x-algorithm.md]

Every ranking claim identifies whether it is observed implementation, a dated default or a source heuristic. Predicted probabilities and observed engagement counts remain distinct; no fixed reach multiplier, hourly penalty or universal video-credit promise is inferred from separate terms or configuration values.
