# Short-form vertical video

The craft layer under any 9:16 video for TikTok, Reels or Shorts (the constraints that decide whether a good idea survives the feed), then a tiered library of creator and founder formats. From [coreyhaines31/marketingskills, ad-creative, short-form-video-specs.md] (MIT), which distills Daniel Hangan's `reelclaw-templates` (the spec and first three formats), Dara Denney's tier list (format tiers) and Oren John's vlog playbooks (founder structures); all practitioner. The safe-zone numbers are replaced with the platforms' own. Part 1 applies to every vertical video in this skill, including [MOTION-VIDEO.md](MOTION-VIDEO.md) and [NATIVE-REVEAL-VIDEO.md](NATIVE-REVEAL-VIDEO.md). App-install video for TikTok is in [app-growth TIKTOK-ADS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/TIKTOK-ADS.md#production); rendering pipelines for marketing video are in [marketing-video](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/marketing-video/SKILL.md).

**Contents:** [Canvas](#canvas) · [Safe zones](#safe-zones) · [Captions](#captions) · [Audio](#audio) · [Determinism](#determinism) · [Creator formats](#creator-formats) · [Founder and vlog structures](#founder-and-vlog-structures) · [Prove it](#prove-it)

## Canvas

The source renders 1080 × 1920 (9:16), 30 fps, MP4, with footage of any size center-cropped to fill (`object-fit: cover`). Meta's Reels guide recommends 1440 × 2560 at 9:16 (https://www.facebook.com/business/ads-guide/update/video/facebook-facebook-reels); TikTok accepts 9:16 at 540 × 960 or more (https://ads.tiktok.com/help/article?aid=10002742). Other specs per placement: [PLATFORM-SPECS.md](PLATFORM-SPECS.md).

## Safe zones

Platform UI (the action rail, caption stack, music button, account row) sits on top of the video, and text or key visuals under it get covered. The source's "cross-platform safe band" (keep 220 px top, 500 px bottom and 180 px each side clear on 1080 × 1920, a 720 × 1200 band from y = 220 to y = 1420, called "the worst case of TikTok and IG Reels margins") is not the worst case:

Placement-specific margins and overlay requirements are canonical in [PLATFORM-SPECS.md](PLATFORM-SPECS.md#meta) for Meta and [its TikTok section](PLATFORM-SPECS.md#tiktok). Meta's top and bottom Reels margins exceed the source's old band. [Meta and TikTok official URLs in PLATFORM-SPECS.md]

For one master across placements, keep captions and load-bearing visuals inside Meta's Reels margins and check the frame against TikTok's overlay for your caption length before a big push.

## Captions

The classic TikTok look the source uses for burned-in captions: white fill, black outline, no background pill, so it reads organic rather than as an ad:

```css
color: #fff;
font-family: "TikTok Sans", sans-serif;  /* or a close variable sans; embed it, don't assume it's installed */
font-weight: 700;
paint-order: stroke fill;                  /* stroke behind fill keeps glyphs crisp */
-webkit-text-stroke: 8px #000;
text-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
```

- **Static captions:** no entrance or exit animation; a caption is fully visible on the first frame of its window, and its window matches its video segment exactly. The source says animated captions read as "made by a brand".
- **Auto-size to the safe area:** start at ~58 px and shrink in ~2 px steps until the text fits, floor ~26 px; never overflow, never clip mid-glyph. Long hooks just shrink. Re-measure after `document.fonts.ready` so sizing uses the real face.
- TikTok's own on-platform ad caption (non-Spark) is fixed "white with a uniform font that can't be customized"; that is the UI caption, not burned-in text, and its limits are in [PLATFORM-SPECS.md](PLATFORM-SPECS.md#tiktok).

## Audio

- **Mute clip audio by default;** one music track carries the sound. Per-clip audio is opt-in (keep a creator's voice, mute b-roll).
- **Fade music over the last ~0.8 s;** a hard cut to silence reads as broken.
- **Organic vs paid:** for organic TikTok and Reels, the source often posts without baked-in music and attaches the trending sound in-app (native sounds get rewarded and are attachable by others); for paid ads, and anywhere you can't attach a native sound, bake the music in.

## Determinism

Renders made by code must be reproducible: no clocks (`Date.now()`), no `Math.random()`, no network fetches at render time. Same inputs, same MP4.

## Creator formats

Each is a structure, not a script; all obey Part 1. Tiers rank one axis: does it scale a cold ad into net-new audiences, or convert people already mid-funnel ([FORMAT-TIERS.md](FORMAT-TIERS.md)). S scales cold and carries heavy education; A scales well; B is solid supporting cast; C is situational or operationally complex.

| # | Format | Tier | Shape | Mechanics |
|---|---|---|---|---|
| 1 | **Reaction + demo (hard cut)** | A | Creator reaction with a hook caption (~3 s) → hard cut to a product or app screen recording; ~9 to 12 s | The hook caption rides the reaction and does the selling; write it as the reaction's inner monologue, not a product claim. No transition: the cut is the mechanic. An optional second caption lands the result. Only as good as the reaction's authenticity |
| 2 | **"No yapping" split-screen tutorial** | B | Full-screen intro → 50/50 split (action on one half, live result on the other), ordered step captions at the seam | For how-tos where showing beats narrating; silence is the promise. No voiceover, music only; tight pacing |
| 3 | **Greenscreen reaction** | A | One video full screen with the creator cut out and composited on top, optionally shrinking into a corner | Reacting to a post, a trend, a screen recording or your product; reads as commentary. Both soundtracks can coexist |
| 4 | **Yapper** | A | One creator to camera telling a personal story that lands on the product, 20 to 60 s | Open on a strong take or story hook, not a claim; hook → story → product as the turn; low-fi setting; captions on. Casting is the bottleneck |
| 5 | **Amateur investigation** | A | The creator sets a question, investigates on camera, lands on the product as the finding | For products that win on comparison or scrutiny; the discovery arc holds attention. Real legwork is the credibility |
| 6 | **David & Goliath** | A | Name the Goliath (a bloated incumbent or broken norm), the brand's fight, why it wins | Needs a genuine antagonist; pairs with founder delivery |
| 7 | **Authority** | A | A credentialed expert on camera, the problem in their domain, why this answers it | The expert must be real and the claims true and substantiated; route health, medical and financial claims through legal review; never fabricate credentials or script words the expert doesn't hold. Endorsements by experts fall under the FTC Endorsement Guides (16 CFR Part 255): [creator-marketing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/creator-marketing/SKILL.md) |
| 8 | **VSL** | S | 60 s to several minutes: hook and problem → mechanism → solution and proof → offer and CTA | For sales that need education first. The craft is the script: open loops, mid-script turns that add a fact; captions throughout |
| 9 | **Green-screen commentary** | A | The creator over full-frame reference imagery (screenshots, charts, a competitor page) that changes with each beat | Teaching, not reacting; strong in apparel and educational angles |
| 10 | **Conversation** | B | Two people in a real exchange where the product comes up naturally | Hard to execute; scripted-sounding dialogue kills it. Best when the exchange answers a real objection |
| 11 | **Duet / reaction** | C | Another creator's clip with your reaction alongside or after | You need the original creator's rights to use their footage in a paid ad; without cleared rights, don't run it. for Spark Ads, app-growth notes that Duets and Stitches need authorization codes from both creators ([app-growth TIKTOK-ADS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/TIKTOK-ADS.md#authorization-codes)) |
| 12 | **ASMR** | C | Close-up sensory action, product-forward, no voiceover | Pet, beauty, food, tactile products; the audio is the point; needs a creator who shoots ASMR |
| 13 | **Street interview** | C | Questions to people on the street, candid answers, your angle | Honest capture is heavy (releases, dead takes, luck). The source says it's "often better staged/recreated"; if you stage it, it is a dramatization with actors, labeled as such and never passed off as real passers-by, and every claim stays real (16 CFR Part 465, https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials) |

## Founder and vlog structures

Four story arcs (Oren John) give a founder something to say; they sit inside a yapper, investigation or vlog. The source calls founder content a brand's typical first top performer.

- **Hero's journey:** run what's happening in the business through problem → backstory → attempt → failure → epiphany → breakthrough → cliffhanger; the reframe matters more than the events, and one strong story a week can beat daily posting. For this arc the source allows a model to draft the outline only (feed brand and persona context, ask for a 60 to 90 s outline), with the words written by the founder.
- **Math:** money as the lever, a cost breakdown or fixed-budget challenge. Unexpectedly cheap beats expensive; luxury doesn't scale as a hook.
- **Shiny object:** something visually novel you have access to (your factory, a machine, a craft process, a trade show), never money or luxury.
- **Niche guide with expertise:** narrate the world through your professional lens, filmed out in it; a learner POV works if you say which you are.

**Three-capture shooting:** film each moment close, medium and wide (0.5×); 2 to 3 second clips only; if the subject moves hold the phone still, if nothing moves add a slow push or slide; do the activity first, then spend ~5 minutes grabbing three angles of 10 to 12 things; one phone folder per trip, the best hook shot favorited, at least 5 shots of yourself.

**The 0.5 to 1 s cut:** every shot lasts 0.5 to 1 second, so a 45-second voiceover becomes ~45 shots. Record the voiceover first, lay clips under it, reorder, trim, in a phone editor such as CapCut or Instagram's Edits.

## Prove it

A UGC reaction concept for an app has the reaction + hard-cut demo structure with the hook caption as inner monologue; captions sit inside Meta's Reels margins (14% top, 35% bottom, 6% sides) and are checked against TikTok's overlay, not the 220/500/180 band; captions are static white with black stroke and auto-size; the music answer distinguishes organic (attach in-app) from paid (bake in) [coreyhaines31/marketingskills, ad-creative, evals #12]. A health brand's founder plan names a structure and the three-capture system, and flags legal review for any expert format [evals #15].
