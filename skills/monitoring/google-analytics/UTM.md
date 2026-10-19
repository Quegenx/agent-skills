# UTM parameters

How campaign links are tagged so each visit lands in the right source, medium and channel: the five parameters, the naming rules, fixed patterns per partner type, where GA4 puts each medium, and traffic from AI assistants. Rules are from the analytics skill of coreyhaines31/marketingskills (MIT; the partner table is "adapted from Wispr Flow's link-creator skill (MIT), published in the skills.marketing library"); channel rules are from Google's default channel group page (https://support.google.com/analytics/answer/9756891). Paid-campaign tagging per ad network is [paid-ads SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/SKILL.md); measuring creator deals is [creator-marketing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/creator-marketing/SKILL.md).

## The five parameters

[coreyhaines31/marketingskills, analytics]

| Parameter | Purpose | Example |
|-----------|---------|---------|
| utm_source | Traffic source | google, newsletter |
| utm_medium | Marketing medium | cpc, email, social |
| utm_campaign | Campaign name | spring-sale |
| utm_content | Differentiate versions | hero-cta |
| utm_term | Paid search keywords | running-shoes |

## Naming rules

[coreyhaines31/marketingskills, analytics]
- **Lowercase everything.** "GA4 treats `LinkedIn` and `linkedin` as two sources, and the split never merges back." Google's default channel definitions "aren't case sensitive" (https://support.google.com/analytics/answer/9756891), so the channel still matches; the source and medium values stay split.
- **Hyphens between words.** No spaces, underscores, or `+`. Pick one separator for the whole company; this skill uses hyphens.
- **One spelling per source.** `linkedin`, never also `li` or `linkedin.com`. Keep the allowed values in a shared sheet and build links from it.
- **No personal data.** "Never put emails, names, phone numbers, or user IDs in a UTM. They land in analytics reports and in referrer logs, and Google's terms prohibit sending PII to GA4."
- **Specific but short:** `blog-footer-cta`, not `cta1`.
- **Test the final URL.** "Shorteners and redirects can drop or double parameters. Click the live link and check the landing URL before the campaign ships."

## Patterns by partner type

[coreyhaines31/marketingskills, analytics] Partner links break most often because each deal gets named on the spot. Fix the pattern per partner type once: `utm_medium` names the kind of deal, `utm_source` names who sent the traffic.

| Partner type | utm_source | utm_medium | utm_campaign | utm_content |
|---|---|---|---|---|
| Newsletter | `{partner}` (one per partner, across all their publications) | `newsletter` | `{partner}-{publication}-{yyyy}-{mm}` | `{placement}-{yyyy-mm-dd}` |
| Creator (YouTube, LinkedIn, TikTok) | `{platform}` | `creator` | `{creator}` | `{post-date}` or the video ID |
| Podcast | `{podcast}` | `podcast` | `{podcast}-{yyyy}-{mm}` | `{spot}-{yyyy-mm-dd}` (pre-roll, mid-roll) |
| Affiliate | `{partner}` | `affiliate` | `{partner}-affiliate` | placement, if they have several |
| Community | `{community}` | `community` | `{community}-{program}` | the channel or post, if known |

- **Use `creator` as the medium for paid creator deals,** not `social` (which mixes them with your organic posts) or `video` (which mixes them with paid video ads). The platform goes in `utm_source`.
- **One link per placement.** A newsletter that runs you on two dates gets two links, so each date's clicks stay separate. The monthly `utm_campaign` rolls them up.
- Podcast and video links often aren't clickable, so pair the UTM link with a promo code or vanity URL.

## Where a medium lands

GA4 assigns each session to a channel by fixed rules; the default channel group "can't be edited", and *Unassigned* "is the value Analytics uses when there are no other channel rules that match the event data" (https://support.google.com/analytics/answer/9756891). The manual-traffic rules that matter for the patterns above, quoted from that page:

| Channel | Rule |
|---|---|
| Email | Source = email\|e-mail\|e_mail\|e mail OR Medium = email\|e-mail\|e_mail\|e mail |
| Affiliates | Medium = affiliate |
| Audio | Medium exactly matches audio |
| SMS | Source exactly matches sms OR Medium exactly matches sms |
| Mobile Push Notifications | Medium ends with "push" OR Medium contains "mobile" or "notification" OR Source exactly matches "firebase" |
| Referral | Medium is one of ("referral", "app", or "link") |
| Organic Social | Source matches a regex list of social sites OR Medium is one of ("social", "social-network", "social-media", "sm", "social network", "social media") |
| Organic Video | Source matches a list of video sites OR Medium matches regex `^(.*video.*)$` |
| Paid Social | Source matches a regex list of social sites AND Medium matches regex `^(.*cp.*\|ppc\|retargeting\|paid.*)$` |
| Display | Medium is one of ("display", "banner", "expandable", "interstitial", "cpm") |
| AI Assistant | The medium exactly matches "ai-assistant"; set automatically "if the referrer matches a list of AI Assistants" |

The source says "GA4's default grouping sends mediums like `newsletter`, `creator`, `podcast`, and `community` to Unassigned (only `affiliate` and `email` map to a default channel)" and advises a custom channel group "with a rule per medium so partner traffic shows up as its own channels" [coreyhaines31/marketingskills, analytics]. Read against Google's rules: those four mediums match no medium rule, but several rules are OR rules on the source, so a creator link with `utm_source=youtube` or `linkedin` can land in Organic Video or Organic Social through Google's site lists rather than Unassigned; and the medium `audio` would land in Audio and `sms` in SMS. Google points to custom channel groups and the editable primary channel group for your own categories (https://support.google.com/analytics/answer/13051316).

## AI assistant traffic

[coreyhaines31/marketingskills, analytics] You can't tag links that ChatGPT, Claude, Perplexity, Gemini, or Copilot put in their answers. Some of those visits arrive with a referrer (`chatgpt.com`, `perplexity.ai`) or an assistant-added `utm_source`; many arrive as direct, or come later through a branded search.

- GA4's default channel group now has **AI Assistant**: "users arrive at your site from sources like ChatGPT, Gemini, Deepseek, Copilot, or Grok. It excludes Google's AI Overviews and AI Mode", which count as Organic Search (https://support.google.com/analytics/answer/9756891). The source said to "Add a GA4 channel group rule that matches known assistant referrers and sources into an 'AI assistants' channel"; with the default channel in place, a custom rule is only needed for an assistant missing from Google's list.
- "Treat that channel as the floor. Assistant-driven visits that show up as direct or branded search can be most of the effect, and they won't carry the referrer."
- Measuring the full effect of AI search is [ai-search-visibility SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ai-search-visibility/SKILL.md); reconciling it with other sources is [marketing-attribution SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-attribution/SKILL.md).

## Prove it

Every live campaign link comes from the shared sheet of allowed values, is lowercase with one separator, carries no personal data, and lands with all its parameters intact after every redirect; each medium in use appears under the intended value of the *Session default channel group* dimension (or in a custom channel group built for it); assistant traffic shows under AI Assistant and is reported as a floor.
