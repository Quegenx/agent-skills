# Motion video ads (faceless, fully generated)

A 15 to 45 second faceless ad or explainer from nothing but a concept: a styled poster still per beat (image model), brought to life with subtle motion (image-to-video model), narrated (TTS), with word-timed captions. From [coreyhaines31/marketingskills, ad-creative, motion-video-ads.md and generative-tools.md] (MIT), which credits the format to Borja (@borjafat) and Bomx's open `super-video-maker` recipe. The source's cost and time figures (roughly $3 to 6 and ~15 minutes per video) and its tool prices are vendor-dependent and volatile; check current pricing. The still carries the idea, one literal, slightly surreal visual per beat, and the motion only makes it breathe: "this is animated poster design, not filmmaking." Vertical specs: [SHORT-FORM-VIDEO.md](SHORT-FORM-VIDEO.md); generated marketing video in general: [marketing-video](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/marketing-video/SKILL.md).

**Contents:** [When to use](#when-to-use) · [Pipeline](#pipeline) · [Characterful styles](#characterful-styles) · [Brand-token styles](#brand-token-styles) · [Motion prompt](#motion-prompt) · [Gotchas](#gotchas) · [Tools](#tools) · [Compliance](#compliance) · [Prove it](#prove-it)

## When to use

- Concept and explainer ads: one idea made concrete ("your CRM is a junk drawer").
- Top-of-funnel social video (9:16 Reels, Shorts, TikTok; 4:5 and 1:1 feed).
- Brand-response work where a distinctive owned style beats stock UGC.
- Not for demo or proof ads (screen recordings win), testimonial or UGC formats, or anything that needs a real product shot as evidence.

## Pipeline

1. **Script** 3 to 6 beats, 20 to 45 s of voiceover, one idea per beat; calm and specific beats hype; end on one CTA line.
2. **Poster stills,** one per beat, from one style formula below. Generate beat 1, approve it, then pass it as a reference image for every later beat so the set reads as a series. Fix garbled label text by regenerating with a shorter phrase.
3. **Animate** each approved still (5 to 8 s per beat). Motion belongs to the objects in the frame; the composition never changes.
4. **Voiceover and captions:** one continuous TTS take, transcribed with word timestamps (whisper), beats cut at sentence boundaries, 2 to 3-word caption groups burned in.
5. **Assemble:** concatenate beats trimmed to their voiceover spans (hold the last frame to pad), loudness-normalize to `I=-16:TP=-1.5:LRA=11`, export per placement.

The source's -16 LUFS target is for social ads; the repo's code-made films master to -14 LUFS ([sound-pass](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/sound-pass/SKILL.md)). Different products, different targets; don't merge them.

**Keep one style per campaign** so the account builds a recognizable look.

## Characterful styles

Fill-in prompt formulas; each animates well.

- **A. Screen-print collage:** "Flat screen-print collage poster, single saturated `<COLOR>` background, subtle newsprint grain. Centerpiece: a black-and-white halftone cutout of `<SUBJECT DOING THE LITERAL CONCEPT>`, treated as a paper sticker with a thin white die-cut outline, slightly torn edges, and a soft drop shadow. Visible halftone dot texture, vintage editorial photo feel, grayscale subject. Accent cutouts: 2-4 flat shapes (cream circle sun, black zigzag, scattered dots). A torn-paper label near the bottom with the words "`<LABEL>`" in bold condensed uppercase newspaper type. Matte printed risograph aesthetic, limited palette. No gradients, no glow, no 3D, no photorealism, no extra text."
- **B. Flat vector explainer:** "Flat vector explainer illustration in the style of a premium animated science channel: a friendly simplified `<SUBJECT>`, bold flat shapes with clean rounded edges, solid `<BRAND COLOR>` background, limited palette of `<2-3 ACCENTS>`, flat geometric accents, soft long shadows, completely flat 2D design. A clean rectangular banner near the bottom reads "`<LABEL>`" in bold geometric sans-serif uppercase. No outlines, no 3D, no photorealism, no texture, no extra text."
- **C. Papercraft diorama:** "Layered papercraft diorama: `<SUBJECT>`, every element hand-cut from colored construction paper with visible paper thickness and real drop shadows between layers, `<COLOR>` paper background with cut-paper accents, tactile handmade craft feel with slightly imperfect scissor cuts. A cut-paper banner near the bottom reads "`<LABEL>`" in chunky cut-out paper letters. Soft studio lighting on the paper layers. No digital gradients, no photorealistic humans, no extra text."
- **D. Pop-art comic:** "Vintage pop-art comic panel: `<SUBJECT>`, bold black ink outlines, Ben-Day halftone dots shading, flat process colors (`<PALETTE>`), comic starburst accents, thick panel border, aged newsprint paper texture. A comic caption box near the bottom reads "`<LABEL>`" in bold comic lettering. 1960s printed comic aesthetic, slight ink misregistration. No 3D, no photorealism, no gradients, no extra text."
- **E. Claymation:** "Stop-motion claymation scene: a charming handmade plasticine `<SUBJECT>`, visible fingerprints and clay texture, `<COLOR>` clay backdrop and floor, chunky clay props, warm soft studio lighting like a stop-motion film set, shallow depth of field. A small clay sign near the bottom reads "`<LABEL>`" in hand-molded clay letters. Handcrafted miniature feel. No 2D illustration, no photorealistic humans, no extra text."

## Brand-token styles

These are defined by slots, so any brand's tokens drop in and the output reads as that brand's own design system. Resolve the slots from the brand guidelines or `.agents/product-context.md` first:

- `FIELD`: the neutral ground (brand white, off-white or dark)
- `INK`: the drawing and type color
- `ACCENT`: ONE brand color or gradient, used sparingly (a rule, a beam, a square)
- `TYPE FEEL`: the typographic voice ("clean modern grotesque sans", "mono captions")
- per-brand constraints ("gradients only on borders, never fills")

Keep the accent to one element per frame; scarcity is what makes these read as designed. Tokens themselves: [color-system](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/color-system/SKILL.md).

- **F. Monoline editorial:** "Minimal editorial monoline illustration poster: `<SUBJECT>`, drawn entirely in elegant thin single-weight `<INK>` lines on a clean `<FIELD>` background, the style of a premium tech company blog illustration. Sparse composition with generous whitespace, a few small monoline accent details, and ONE restrained `<ACCENT>` element: `<a thin accent underline sweep / a small accent arc>`. A small caption near the bottom reads "`<LABEL>`" in `<TYPE FEEL>`, `<INK>`, letterspaced uppercase, with a thin `<ACCENT>` underline. Precise, technical, refined. No fills except the single accent, no gradients, no 3D, no photorealism, no texture, no extra text."
- **G. Swiss typographic:** "Swiss International Typographic Style poster: the words "`<LABEL>`" set enormous in a bold `<TYPE FEEL>`, `<INK>` on a `<FIELD>` background, filling the upper two thirds with tight leading and cropped edges. A small black-and-white photographic cutout of `<SUBJECT>` sits on a thin baseline grid in the lower third, aligned to an asymmetric grid with one thin `<ACCENT>` rule line and a small `<ACCENT>` square as the only color. Visible faint grid lines, precise margins, mathematical composition. Flat, printed, matte. No gradients, no 3D, no decoration, no extra text beyond the label and one small letterspaced caption line."
- **H. Wireglow (dark keynote):** "Dark minimal tech-keynote poster: `<SUBJECT>` rendered as an elegant thin light-gray wireframe line drawing on a near-black `<FIELD>` background with subtle film grain. From `<the focal object>` emanates a soft narrow beam of glowing `<ACCENT>` gradient light, the only color, feathered and atmospheric. Faint thin concentric geometric guide circles. A caption near the bottom reads "`<LABEL>`" in `<TYPE FEEL>`, light gray, letterspaced uppercase, with a hairline gradient rule beneath it. Restrained, premium, technical. No photorealism, no 3D render look, no busy elements, no extra text."
- **I. Duotone screenprint:** "Bold duotone screenprint photo poster: a dramatic photograph of `<SUBJECT>`, reproduced as a two-color screenprint, `<INK>` for the shadows and `<ACCENT>` for the highlights, on an off-white `<FIELD>` paper background with visible coarse halftone grain and slight ink misregistration. Strong diagonal composition, the figure large and cropped. A wide solid `<INK>` bar near the bottom carries the words "`<LABEL>`" reversed out in bold condensed `<TYPE FEEL>` uppercase, with a small `<ACCENT>` square bullet. Editorial poster energy, matte printed feel. No gradients beyond the duotone, no 3D, no extra text."

Motion for this tier: F and G animate as drawing (lines extend, the accent sweep draws itself, type settles a few pixels); H as a beam pulse and slow wireframe rotation; I as grain shimmer and a slow push.

## Motion prompt

"Subtle living-`<style>` motion of the existing elements only. `<ONE literal motion tied to the concept: the pile inflates / the arrow creeps higher / the megaphone trembles with each shout>`. `<Secondary ambient motion: accents drift, gentle push-in>`. Every element that is visible now is the only thing that ever appears; the composition stays exactly as it is. Everything stays `<style descriptor: a flat printed collage / flat 2D vector / cut paper / printed comic / handmade clay>`. No camera whip, no scene change, no morphing, no added text."

## Gotchas

- **Video models add photoreal "maker hands"** reaching into frame, especially on pressing or handling motions, and negative prompts make it worse ("no hands" draws attention to hands). Never mention hands; describe motion as belonging to the objects, and include "the composition stays exactly as it is."
- **QC each clip's final 2 seconds:** intruding objects and style drift appear there. Trim before them or regenerate.
- **One dominant motion per beat;** two read as chaos at feed speed.
- **TTS and whisper disagree on sound-alikes** ("laws" → "loss"): read the transcript against the script before burning captions; prefer phoneme-unambiguous CTA wording.
- **Keep captions clear of the label band** (captions ~60% height, label ~80%); never let two caption groups overlap; shrink long groups to fit.
- **Ads:** put the brand or label in the poster itself (it survives sound-off autoplay), front-load the concept in beat 1 (the poster is the 3-second hook), and export 9:16, 4:5 and 1:1 by regenerating stills per aspect rather than cropping.

## Tools

The pipeline is model-agnostic. The source's options, as of its writing: stills from Gemini's image models (it names Nano Banana Pro for label typography), GPT-Image, Flux or Ideogram; motion from Veo image-to-video (it notes 1080p needs 8 s clips), Seedance, Kling or Runway; voice from Gemini TTS, ElevenLabs or OpenAI TTS; captions from whisper word timings burned in, or an editor's auto-captions. Templated, data-driven variations at scale are the code-rendered route (the source names Remotion; check its license terms for your team size on remotion.dev). Layering a separate voiceover on silent video: `ffmpeg -i video.mp4 -i voiceover.mp3 -c:v copy -c:a aac output.mp4`. Midjourney has no official public API, and the source warns that unofficial APIs "risk bans": don't build a pipeline on them. Model names, limits and prices change fast; confirm each in the vendor's current docs.

## Compliance

Fully synthetic characters avoid likeness and UGC disclosure issues, but AI-media disclosure still applies:

- **Meta** labels "ad content that has been created or edited using some of Meta's generative AI tools or with third-party generative AI tools", detects third-party tools through "industry-standard detection methods, such as C2PA", offers self-disclosure in "the European Region, California, New York, India and Taiwan", and requires disclosure for social issue, election or political ads with photorealistic AI media (https://www.facebook.com/business/help/1010479435004531).
- **TikTok:** "Completely AI-generated or significantly AI-modified ads require disclosure"; non-Spark ads use the toggle "This ad contains AI-generated content", and Spark Ads follow the Community Guidelines AIGC labelling (TikTok's "Add disclaimers to ads" help and its misleading and false content ad policy).
- Don't fabricate statistics or testimonials in the voiceover; ground every claim ([SKILL.md](SKILL.md#grounded-inputs)).

## Prove it

A motion ad has 3 to 6 beats with one dominant motion each, stills from one style formula with beat 1 as the reference, captions that never collide with the label band, the final 2 seconds of every clip checked, loudness at the stated target, per-aspect stills regenerated rather than cropped, and the AI disclosure set where the platform requires it.
