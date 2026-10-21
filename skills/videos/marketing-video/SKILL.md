---
name: marketing-video
description: "Produces marketing video with tools rather than code: choosing between a code-built film, AI-generated footage, an AI avatar presenter and repurposing long recordings into clips; Veo's real limits, video prompts and camera vocabulary, HeyGen and Synthesia with consent, the Descript to Opus Clip to CapCut workflow, captions and platform aspect ratios. Use when planning a product demo, explainer, social clip or update video, generating B-roll with a video model, making avatar or personalized videos, or cutting a webinar or podcast into short clips."
---

# Marketing video

Marketing video is four approaches, each good at one job: a film built in code, footage a video model generates, a talking head an avatar delivers, and long recordings cut into short clips. Pick the approach from the video's goal and the assets you have before picking a tool. Anything built in code (a launch film, a product walkthrough, a templated series) is the [make-video](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/make-video/SKILL.md) skill; a scripted recording of your own app is [asset-prep APP-RECORDING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/asset-prep/APP-RECORDING.md). This skill covers the rest. Source: [coreyhaines31/marketingskills, video] v2.2.1 (MIT, (c) 2025 Corey Haines), with its stale specs corrected against ai.google.dev, heygen.com/pricing and developers.openai.com. Camera presets are paraphrased from the supplied [n, camera-movments.md], with terminology checked against Adobe, Nikon and Snorricam.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Video models: Veo's official limits, the removed Sora API, the source's model picks, the prompt formula, style vocabulary, prompt mistakes, workflow and cost | [AI-GENERATION.md](AI-GENERATION.md) |
| Camera vocabulary and footage presets: movement, speed, framing, ending, lens/physical travel, viewpoint, focus and time effects | [CAMERA-PROMPTS.md](CAMERA-PROMPTS.md) |
| AI avatars: HeyGen's current plans and MCP server, custom avatars and consent, Synthesia, when an avatar is the wrong tool, personalized outreach videos | [AVATARS.md](AVATARS.md) |
| Cutting long recordings into clips: the Descript, Opus Clip, CapCut workflow, captions, platform aspect ratios | [REPURPOSING.md](REPURPOSING.md) |

## Before starting

[coreyhaines31/marketingskills, video] Read `.agents/product-context.md` first when it exists ([anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md) defines it; the source calls the file `.agents/product-marketing.md`) and ask only for what it doesn't cover:

- **Goal:** the type (product demo, explainer, testimonial, social clip, ad, tutorial), the platform (YouTube, TikTok, Reels, Shorts, website, ads, sales deck) and the length.
- **Production:** a human presenter or not (AI avatar, voiceover, screen recording); existing footage or assets (screenshots, logos, product UI); whether generated footage is needed (scenes, B-roll); one-off or a template for repeated use.
- **Technical:** the stack, API keys for video tools (in an environment variable, never pasted into chat), and the budget (some tools charge per minute of video).

## Choosing the approach

[coreyhaines31/marketingskills, video]

| Approach | Best for | Tools | When |
|---|---|---|---|
| Programmatic | Templated, data-driven, batch video | Code-built films: [make-video](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/make-video/SKILL.md) (seek-engine by default, Remotion or HyperFrames when the brief needs them) | Product updates, personalized videos, recurring content |
| AI generation | Original footage from text or image prompts | Veo, Runway, Kling, Seedance | B-roll, hero shots, visuals you can't film |
| AI avatars | A talking-head presenter without filming | HeyGen, Synthesia | Explainers, tutorials, multilingual content |
| Editing and repurposing | Cutting long-form into short clips | Descript, Opus Clip, CapCut | Podcast or webinar to social clips |

The source recommends HyperFrames as the default engine for agents ("Plain HTML/CSS means any coding agent can write a composition"). This repo's make-video keeps its own default instead: "one HTML file with `window.seek(t)` ... Reach for a framework only when the brief needs what it adds". The [make-video licence section](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/make-video/ENGINES.md#remotion-licence) owns Remotion eligibility and its operating-party headcount correction; the source's "Company license for commercial use" and this file's old employees-only shorthand were incomplete.

**AI generation or stock** [coreyhaines31/marketingskills, video]:

| Use case | AI generation | Stock footage |
|---|---|---|
| The exact scene you imagined | Yes | Rarely matches |
| Consistent style across clips | Yes | Hard to match |
| Recognizable real locations | No (hallucinations) | Yes |
| Specific products or brands | No (build it in code) | No |
| Quick B-roll | Either works | Faster |

Product UI is never generated: show the real product from real recordings or a film built from its real screens, as asset-prep requires ("The model may invent the camera; it may not invent the product"). Free stock libraries and how to judge a clip are in asset-prep's "Free stock footage".

## Workflows

[coreyhaines31/marketingskills, video]

- **Product demo:** script the key features and value props ([anti-slop-copy](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md)), screen-record the product flow, overlay titles, callouts and transitions in code, optionally add generated B-roll for establishing or lifestyle shots, add a voiceover ([voiceover](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/voiceover/SKILL.md)) or an avatar, export at each platform's specs. A flow re-recorded every release: [asset-prep APP-RECORDING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/asset-prep/APP-RECORDING.md).
- **Explainer:** script problem, solution, call to action; choose a presenter (an avatar, or voiceover over visuals); build the visuals (code-built scenes, screen recordings, generated scenes); add captions, always; export landscape for YouTube and the website, vertical for social.
- **Batch social clips:** one master template, fed with data (features, testimonials, stats), rendered as many variations, captioned per platform, then scheduled ([social-media](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/social-media/SKILL.md)).
- **Agent pipeline:** the agent writes the script from the product context, then a code-built film, an avatar video (HeyGen's MCP server) and generated B-roll (a video model's API) as needed, and the agent assembles the cut.
- **Paid video ads** go to [ad-creative](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ad-creative/SKILL.md) and, for apps, mobile/app-growth's [app-growth AD-CREATIVES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/AD-CREATIVES.md); an App Store or Play preview goes to [aso](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/SKILL.md).

## Common mistakes

[coreyhaines31/marketingskills, video]

1. **Starting with tools, not strategy:** decide what video you need before picking tools.
2. **Generated text in video:** models can't reliably render readable text; set every word in code or in post.
3. **Uncanny avatars:** when avatar quality matters, budget for a paid tier ([AVATARS.md](AVATARS.md)).
4. **No captions.** The source backs this with "85% of social video is watched without sound", a figure it gives no source for; it is not repeated here. The standing reason is WCAG 2.2 SC 1.2.2 (Level A): "Captions are provided for all prerecorded audio content in synchronized media" (https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded).
5. **Wrong aspect ratio:** 9:16 for social, 16:9 for YouTube and the website, 1:1 for feeds ([REPURPOSING.md](REPURPOSING.md#aspect-ratios)).
6. **Over-producing:** the source's view is that "authentic often outperforms polished, especially on TikTok".

## The rules

1. **Choose the approach before the tool,** from the goal, the platform and the assets you have. [coreyhaines31/marketingskills, video]
2. **Never generate the product.** No AI footage or avatar for product UI, real locations or specific products; record or build them from the real thing. [coreyhaines31/marketingskills, video]
3. **Words on screen are typeset, never generated:** prompts ask for no text or logos, and copy goes on in code or in post. [coreyhaines31/marketingskills, video]
4. **Every video with speech ships with captions** (WCAG 2.2 SC 1.2.2, Level A, https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded).
5. **Check a model's limits on its official page before promising a length or resolution:** Veo 3.1 at 1080p or 4k "only supports 8s duration" (https://ai.google.dev/gemini-api/docs/veo), and OpenAI removed the Sora video API on 2026-09-24 (https://developers.openai.com/api/docs/deprecations).
6. **An avatar or cloned voice is only of the user or someone who consented;** the source scopes custom avatars to "a 2-5 min video of yourself". [coreyhaines31/marketingskills, video]
7. **Personalized outreach videos are cold messages:** the send follows [email-practices COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/COMPLIANCE.md) and the platform's rules ([cold-outreach](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/SKILL.md)).
8. **List each paid generation with its estimated cost and wait for approval,** as asset-prep requires before expensive steps.

## Prove it

The brief names the approach and why; no frame shows generated UI, a generated product or generated text; every video with speech has captions; each delivered file's aspect ratio and size match the platform row in [REPURPOSING.md](REPURPOSING.md#aspect-ratios) (`ffprobe`); any model claim in the plan (length, resolution, availability) cites its official page with the date it was checked; every avatar's likeness and voice have a named consenting owner.
