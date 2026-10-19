# Native reveal videos

A family of 9:16 formats that recreate a familiar phone surface in real time and let the brand emerge inside it: a chat thread where a friend asks "what app is that?", a typed question to an AI assistant, a private note typed live, an incoming share where the accept tap is the reveal. From [coreyhaines31/marketingskills, ad-creative, imessage-video-ads.md] (MIT), which credits the format to Shiv Sakhuja and the gooseworks-ai team (gooseworks-ai/gooseworks-ads-skills), who report it performing strongly on Meta. These are dramatizations: read the gate first. Vertical canvas, safe zones and captions are in [SHORT-FORM-VIDEO.md](SHORT-FORM-VIDEO.md).

**Contents:** [The compliance gate](#the-compliance-gate) · [When it fits](#when-it-fits) · [Concept angles](#concept-angles) · [Anatomy and script](#anatomy-and-script) · [Production](#production) · [Craft rules](#craft-rules) · [Quality checklist](#quality-checklist) · [Iterating](#iterating) · [Other surfaces](#other-surfaces) · [Prove it](#prove-it)

## The compliance gate

Pass every line before writing a script:

1. **It is a dramatization, run as a labeled paid placement.** Never seed it organically as if it were a real leaked conversation, and never present it as a real customer's message: no real customer names, no "this is an actual text from a customer" framing [coreyhaines31/marketingskills, ad-creative]. The FTC's rule prohibits testimonials "by someone who does not exist ... or who did not have actual experience" with the product (16 CFR Part 465, https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials).
2. **Every claim inside is true of the product,** grounded in a real result, review or verifiable fact ([SKILL.md](SKILL.md#grounded-inputs)); the conversation is fictional, the facts can't be. If a claim needs a disclaimer on the landing page, it needs one in the ad.
3. **AI-answer reveals are the strictest.** The "answer" is your ad copy wearing an authority costume: every claim needs the same substantiation as one in your own voice, and the borrowed authority raises the bar. No health, medical or financial advice in a fabricated AI answer without legal review; never present it as a real, unprompted assistant output endorsing the product.
4. **Trade dress.** Apple's message UI, sounds and Notes, and OpenAI's interface are their owners' trade dress; the source notes that CC0 recordings of Apple's sounds don't license Apple's sound marks or UI. Regulated brands and cautious legal teams should review the mimicry as a whole; the fallback that keeps the mechanic is a generic skin (neutral bubbles, non-Apple sounds, a generic "AI assistant" or notes app).
5. **TikTok's format policy.** TikTok bans "Invalid buttons, induced gestures, or text ... that portray unsupported functionality" (its example: "Swipe up to learn more.") in its ad format and functionality policy, and app-growth's TikTok notes list "fake UI (policy rejection)" ([app-growth TIKTOK-ADS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/TIKTOK-ADS.md#production)). The source says the format "Works on TikTok and YouTube Shorts with the same master file"; tappable-looking Accept buttons, composers and links risk rejection there, so check each platform's policy before reusing the master.
6. **The source disagrees with itself.** Its format tier list puts "Notes-app / UX fake-native ads" in F-tier ("they do not convert") while this reference recommends the Notes reveal ([FORMAT-TIERS.md](FORMAT-TIERS.md#f-tier-dont-bother)); weigh both against your own account data.

## When it fits

- **Good:** reaction and discovery ads where the punchline is the recipient's curiosity; promo-code offers (a code in conversation feels less like an ad); products with a screenshot-able result (a number, a dashboard, a receipt, a before/after); UGC-style angles without UGC creators.
- **Poor:** considered B2B purchases where a casual exchange undercuts credibility; products with nothing visual or numeric to show; brands whose compliance review can't approve dramatized conversations.
- **Placement:** built for Meta Reels and Stories (9:16), with a 1:1 center-crop variant for feed.

## Concept angles

Pick the angle before writing a line; the most common failure ("the script is fine but the ad feels off") is an angle mismatch. The strongest hooks share one of three traits: a specific number, a small act of self-trust, or a physically novel product mechanic.

| Angle | The hook attachment | The reveal |
|---|---|---|
| **Result-as-screenshot** | A number that brags by itself: race time, app summary, dashboard stat | "X minutes a day. that's it." |
| **Setup flex** | A photo of the space: tiny apartment gym, desk setup | "this is the whole setup" |
| **Cancellation moment** | A confirmation receipt: gym cancellation, "subscription cancelled" | "$X/mo → $Y/mo. do the math" |
| **Feature-as-punchline** | A short clip of the product mechanic | The mechanic is the brand |
| **Friend-asks-friend (inverse)** | The peer opens with the wow | You reply with the brand |
| **Receipt-as-hook** | A mundane financial document: statement, store receipt | A small act of self-trust |

Every number in the attachment is a real one from the corpus.

## Anatomy and script

```
0:00  Hook attachment lands (the screenshot the chat is about)
      short reactions, 250-450 ms apart
0:06  The question: "what app is that??"
      typing indicator, then the brand-name reply
0:12  The pitch in texting voice, one or two bubbles
0:15  The code inside a bubble ("use FREEPACK, first pack's free"), link-underlined
0:17  A beat of silence, then the closer ("bet" / "ok downloading")
0:18  300 ms crossfade to a static brand end card: logo, code, tagline (~3 s)
```

- **8 to 14 bubbles.** Shorter reads thin; longer loses the viewer.
- **Real texting voice:** lowercase, fragments, at most one emoji a message, no marketing adjectives. Read it aloud as two friends; cut any bubble that sounds like ad copy.
- **The brand appears once, late,** only after someone asks; naming it in bubble two kills the reveal.
- **Rhythm, not a metronome:** one-word reactions 250 to 450 ms apart; 600 to 900 ms after sentence replies; ~600 ms of silence before the final reaction.
- **Typing indicators** before sentence-length peer replies, optional before short reactions; silent (below).
- **The promo code** goes inside a bubble with link-style underline, and again on the end card.

## Production

**Route 1, a code pipeline (full control).** Render the chat as HTML and CSS, drive it with a timeline script, record headlessly with Playwright, assemble audio and end card with ffmpeg:

1. **Script as data:** the thread as JSON (participants with name, initials and avatar color; ordered messages with `from`, `text`, attachment paths and typing flags; theme; header), reviewable and re-renderable without touching code.
2. **Render the UI:** a dark theme reads most native. Full-bleed chat, or the chat inside a phone frame over a relevant background photo; the source prefers the framed variant.
3. **Animate in ONE continuous recording:** every bubble exists in the DOM hidden with `display: none` (not `opacity: 0`, or the thread pre-allocates space and never grows); a driver walks the timeline revealing bubbles, driving the composer and auto-scrolling. Never record scene by scene and concatenate: each reload causes a visible flicker.
4. **Type the composer for every sent bubble:** typed text exactly equals sent text; ~12 to 15 characters a second with ±30% per-character jitter.
5. **Record at native resolution:** set both the Playwright `viewport` and `recordVideo.size` to 1080 × 1920; Playwright: "The video size defaults to the viewport size scaled down to fit 800x800" (https://playwright.dev/docs/videos).
6. **Layer audio with ffmpeg,** with sound cues computed from the same timeline that drove the recording, so they land on bubble pops.
7. **Stitch chat → 300 ms crossfade → static end card.** ffmpeg's `xfade` needs both inputs to match in resolution, pixel format and frame rate, so render the end card to an MP4 at the chat's specs first. Export the 9:16 master and a 1:1 center crop.

Recording a browser session: [browser-automation](https://github.com/Quegenx/agent-skills/blob/main/skills/web-automation/browser-automation/SKILL.md).

**Route 2, a templated renderer.** Once a script structure wins, rebuild it as a code-rendered composition (the source names Remotion) with the thread JSON as props, so new hooks, codes and personas are data changes. Right at "10 script variants a week", not for the first ad.

## Craft rules

- **The messaging app's own send and receive sounds sell it,** never generic notification sounds. The source points to CC0 recordings on BigSoundBank (send `bigsoundbank.com/UPLOAD/mp3/1313.mp3`, ~0.5 s; receive `bigsoundbank.com/UPLOAD/mp3/1111.mp3`, trimmed to ~1.4 s with a 400 ms fade), normalized loud (≈ -9 LUFS) to cut through the music. Read gate item 4 first; the generic skin uses non-Apple sounds.
- **No sound on the typing indicator;** play the receive sound only when the bubble replaces the dots. The source calls this the most common tell.
- **Music bed:** a quiet instrumental at ~30% volume, high-passed around 60 Hz to clear room for the effects, faded out ~1.5 s before the code reveal so the CTA lands in near silence.
- **Static end card,** no zoom or drift.
- **The real brand logo SVG** on the end card, never CSS text approximating it; from the brand's own press kit.
- **Hook screenshots mimic the real app's UI in HTML, not AI generation:** AI-generated app UIs come out garbled. Build a small page in the app's actual colors, type and layout and screenshot it; use image generation only for photographic hooks (a lifestyle shot, the framed variant's background).
- **Mix:** ffmpeg's `amix` divides volume by input count by default, so pass `normalize=0`, then limit just under full scale (`alimiter=limit=0.95`, ≈ -0.4 dB) so it's loud without clipping.

## Quality checklist

- [ ] Gate items 1 to 5 pass; every claim traces to a real review, result or fact
- [ ] Reads as real texting aloud; no marketing adjectives in bubbles
- [ ] The brand name appears only after the peer asks
- [ ] No sound on any typing indicator; receive sounds fire when bubbles land, on the pop
- [ ] Every sent bubble had a full composer drive; typed text equals sent text
- [ ] No flicker; the only cut is chat → end card (300 ms crossfade)
- [ ] The code is underlined in its bubble and repeated on the end card
- [ ] Static end card with the real logo SVG
- [ ] Native 1080 × 1920 master; the 1:1 is a crop, not a squeeze
- [ ] The last bubble gets ~600 to 800 ms before the crossfade
- [ ] Limited just under full scale; music never fights the effects

## Iterating

The thread is the variable, the pipeline fixed. Test in order: 1. the hook attachment (it's the thumbnail and first 2 seconds); 2. the angle (who the viewer identifies with); 3. the code phrasing; 4. the peer persona (name, avatar, texting style); 5. length (12 vs 8 bubbles). The same architecture extends to other surfaces (another chat app, a team chat, a search box) with a different UI shell.

## Other surfaces

Production, grounding and disclosure carry over unchanged; the persuasion mechanic changes. Choose by which surface already fills your audience's day.

| Surface | Mechanic | Reach for it when |
|---|---|---|
| **Chat thread** | A friend's recommendation | The product is discovered through results people share |
| **AI-assistant answer** | An authoritative answer to the viewer's own question | The problem is question-shaped, something people type to an assistant |
| **Notes** | A private confession made public, first person, no dialogue | The angle is transformation or realization |
| **Nearby share (AirDrop style)** | A spontaneous peer share with a built-in accept or decline | The product is something people pass to each other, and the accept tap can be the reveal |

**AI-answer reveal.** The viewer identifies with the asker: the typed question is the hook and is the customer's verbatim question, awkward phrasing included. The streamed answer names the problem's real mechanism, then the solution category; the brand lands in the recommendation or a typed follow-up. Stream the answer in word chunks (not character by character, which is typing, and not whole paragraphs), with a subtle tick and a clean stop; type the question like thumbs and stream the answer like a model, two rhythms. Keep it scannable: short paragraphs, a bolded phrase or short list. Gate items 3 and 4 apply in full.

**Notes reveal.** Confession, not conversation: someone types a private list with the keyboard visible. The title is the hook (it does what slide 1 does in a carousel). The product is one list item, named the way a person writes to themselves, and the least enthusiastic line in the note. Audio is keyboard taps only; type at thumb pace with jitter (one typo and correction reads human; several read staged); get the chrome right (larger title, the formatting bar, the app's accent color) or use the generic skin; fit the note to the frame or scroll once, late. The confession dramatizes a composite, true customer story from real reviews and interviews, with only documented numbers.

**Nearby-share reveal.** The hook is an incoming share card seen from the receiver's view ("[Sender] would like to share [preview]", gray Decline, blue Accept); the accept tap is the reveal. The preview thumbnail is the hook that earns the tap (the result, the product shot, the offer). Cast the sender like a real share ("Sarah's iPhone", "Mom"); a brand in the sender slot reads as an ad, so save it for the reveal. The transfer progress ring is the signature beat: card → a hesitation → the tap → the ring fills → the item lands → end card. Audio is the share swoosh and received tone, not chat tones (gate item 4). The card's translucency and the button pair are the cues; a flat sheet breaks it. Receiver POV reads as discovery; sender POV ("had to send this to the group") as advocacy. It dramatizes a share, never a claim that a real person sent your product. Accept-style buttons are exactly what gate item 5 covers.

## Prove it

A chat reveal for a sleep ring with code RESTED: an angle chosen first, 8 to 14 bubbles in texting voice, the brand only after the peer asks, RESTED in a bubble and on the end card, no fabricated claim or real-testimonial framing, silent typing indicators, a production route named [coreyhaines31/marketingskills, ad-creative, evals #7]. An AI-answer reveal for a menopause supplement flags health-claim substantiation and legal review before drafting, never presents the answer as real, and explains why AI-answer vs Notes fits [evals #8]. A sneaker-drop share reveal uses receiver POV, a human sender name, the thumbnail as hook, share sounds, and checks the platform's button policy [evals #11].
