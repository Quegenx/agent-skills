# Generating footage with a video model

Use a video model for B-roll, hero visuals and scenes you can't practically film; never for product UI, recognizable real places or specific products ([SKILL.md](SKILL.md#choosing-the-approach)). The prompt material is from [coreyhaines31/marketingskills, video] `references/ai-video-prompting.md` (MIT); model limits are from each vendor's official page, checked 2026-10-18. Generated material inside a code-built film (blockouts as motion references, tracing it in code, the five-slot prompt for subject, motion, scene, space and camera) is asset-prep's "Generated base footage" in [asset-prep SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/asset-prep/SKILL.md).

## Veo: the official limits

From https://ai.google.dev/gemini-api/docs/veo (checked 2026-10-18). The source lists Veo 3 as "Up to 1080p (4K varies)" with a "Variable" maximum length and says to write "high resolution" or "1080p" in the prompt; the official page differs:

- **Length:** `durationSeconds` is "4", "6" or "8"; it must be "8" with extension, reference images, 1080p or 4k.
- **Resolution is a parameter, not prompt words:** Veo 3.1 and 3.1 Fast take "720p" (default), "1080p" (only supports 8s duration) and "4k" (only supports 8s duration); Veo 3.1 Lite has no 4k. Extension is "720p" only. Higher resolution means higher latency, and 4k costs more.
- **Aspect ratio:** "16:9" (default) or "9:16".
- **Audio:** natively generated with the video, "Always on".
- **Extension:** Veo 3.1 and 3.1 Fast (not Lite) extend a Veo-generated video "by 7 seconds and up to 20 times".
- **Reference images:** up to three, to guide the content.
- **Retention:** "Generated videos are stored on the server for 2 days": download within two days.
- **Watermark:** "Videos created by Veo are watermarked using SynthID".

## Sora is gone

OpenAI's Videos API and the models `sora-2`, `sora-2-pro`, `sora-2-2025-10-06`, `sora-2-2025-12-08` and `sora-2-pro-2025-10-06` were removed on 2026-09-24 (notice 2026-03-24), with no replacement listed (https://developers.openai.com/api/docs/deprecations). The source still lists Sora as a trigger; don't recommend it.

## The source's model picks

[coreyhaines31/marketingskills, video] lists these picks; its per-model resolutions, lengths and prices were not checked against the vendors' docs and are left out. Check the vendor's page before promising a spec.

| Need | The source's pick |
|---|---|
| Highest quality with audio | Veo |
| Batch, volume, cost | Kling, Seedance |
| Character consistency across shots | Hailuo (MiniMax) |
| Self-hosted, brand-controlled | Hunyuan Video or Wan 2 (open weights) |
| Storyboard to video | Runway, LTX Studio |
| Image to video from a still you have | Kling, Pika, Runway |

The source's per-model tips, also unverified: Runway "Keep prompts under 100 words for best results", has a motion brush for animating one area, and does image-to-video well from a reference frame; Kling's "Quality drops slightly at longer durations" and it works "Best with simpler scenes and fewer subjects"; Pika is "Best for short clips (5-15 seconds)" with "Less control over camera movement".

## The prompt

[coreyhaines31/marketingskills, video]

```
[Subject] + [Action] + [Camera movement] + [Visual style] + [Lighting/mood] + [Technical specs]
```

Set resolution, length and aspect ratio in the API parameters where the model has them (Veo does), not as prompt words. The source's examples, with their trailing "4K" and "1080p" dropped for that reason, and the one that asked for a "dashboard UI" on a laptop screen left out (rule 2 of [SKILL.md](SKILL.md#the-rules)):

```
A woman in a modern co-working space smiling while looking at her phone,
natural window light, candid documentary feel,
camera handheld with subtle movement, warm color grading
```

```
An overhead shot of a team around a conference table pointing at charts,
camera slowly pushes in, bright modern office,
clean corporate style, even lighting
```

```
A close-up shot of hands typing on a laptop keyboard,
shallow depth of field, warm office lighting,
camera slowly pulls back to reveal a modern workspace,
cinematic color grading
```

## Camera and style vocabulary

Camera vocabulary and source-scoped movement, speed, framing and ending presets live in [CAMERA-PROMPTS.md](CAMERA-PROMPTS.md). [coreyhaines31/marketingskills, video; n, camera-movments.md]

[coreyhaines31/marketingskills, video]

Style keywords by family: cinematic ("cinematic color grading", "anamorphic lens flare", "shallow depth of field", "film grain", "35mm film"); commercial ("clean commercial lighting", "bright and airy", "professional corporate aesthetic", "even, diffused lighting"); documentary ("handheld documentary style", "natural lighting", "candid, unposed", "observational camera"). The source's "social" family includes "bold text overlays", which rule 3 of [SKILL.md](SKILL.md#the-rules) sets in post instead.

## Prompt mistakes

[coreyhaines31/marketingskills, video]

| Mistake | Why it fails | Fix |
|---|---|---|
| "A person using our app" | Too vague, no visual detail | Describe the person, setting, lighting, camera |
| Including text or logos | Models can't render readable text | Add text in post |
| "Make it viral" | Not a visual instruction | Describe the visual style you want |
| Prompts of 200+ words | Models lose focus | Keep to 50-100 words, be specific |
| No camera direction | Random or static camera | Always specify the movement, or "static" |
| "Realistic" alone | Not specific enough | "Photorealistic, natural lighting, shot on RED camera" |

On length the repo has a second view: asset-prep's "Prompting a video model" says "some reward 200-400 structured words for a hero shot, others degrade past about 60-80" ([asset-prep SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/asset-prep/SKILL.md#generated-base-footage-optional)).

## Workflow and cost

[coreyhaines31/marketingskills, video]

1. **Reference first:** find a real video that looks like what you want, then break it down into subject, action, camera, style and mood ([video-brief](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/SKILL.md) has the reference method).
2. **Generate 3-4 variations** of the same concept with different angles or styles, then iterate on the best.
3. **Composite:** combine the generated footage with text and overlays set in code.

To spend less: iterate at low resolution and upscale only the final; draft on the cheapest model and switch for finals; start image-to-video from a reference frame, which "saves generation credits and gives better results"; cache and reuse B-roll across videos.

## Prove it

Each generated clip's length, resolution and aspect ratio are ones its model's official page allows (for Veo: 4, 6 or 8 s; 1080p and 4k only at 8 s); `ffprobe` on the downloaded file matches the request; no frame shows text, a logo or product UI the model drew; every clip was downloaded within the provider's retention window and logged with model, prompt and take.
