# Repurposing long recordings into clips

One podcast, webinar or demo becomes many short clips for TikTok, Reels, Shorts and LinkedIn. From [coreyhaines31/marketingskills, video] (MIT). Cutting supplied speech inside a code-built film (word-boundary cuts, padding, fades, eye-line across cuts) is asset-prep's "Transforming supplied footage" in [../../videos/asset-prep/SKILL.md](../../videos/asset-prep/SKILL.md); what to post and when is [social-media](../social-media/SKILL.md).

## The workflow

[coreyhaines31/marketingskills, video]

```
Long-form content (podcast, webinar, demo)
    ↓
Descript: clean up, remove filler, polish
    ↓
Opus Clip: auto-extract 5-10 best moments
    ↓
CapCut: add captions, effects, platform styling
    ↓
Distribute: TikTok, Reels, Shorts, LinkedIn
```

| Tool | What it does | Best for |
|---|---|---|
| Descript | Transcript-based editing: edit the video by editing the text | Cleaning up interviews, podcasts, webinars |
| Opus Clip | Auto-clips long videos and scores their virality potential | Long-form to short-form at scale |
| CapCut | Visual effects, captions, platform-native styling | TikTok and Reels polish |
| Captions.ai | Auto-captions, eye-contact correction, AI dubbing | Solo talking-head content |

To match a particular editing style (cut rhythm, caption treatment, punch-ins) on these clips, decode the reference first with [video-brief](../../videos/video-brief/SKILL.md)'s "A short-form edit to match", then hand the beat sheet and signature moves to the editor as the brief.

## Captions

Caption every clip; the WCAG ground and the source's unsourced figure are in [SKILL.md](SKILL.md#common-mistakes) (mistake 4).

## Aspect ratios

[coreyhaines31/marketingskills, video]; the YouTube rows checked against https://support.google.com/youtube/answer/6375112.

| Platform | Ratio | Resolution |
|---|---|---|
| YouTube | 16:9 | 1920x1080 or 3840x2160 |
| TikTok, Reels, Shorts | 9:16 | 1080x1920 |
| Instagram feed | 1:1 or 4:5 | 1080x1080 or 1080x1350 |
| Website hero | 16:9 | 1920x1080 |
| LinkedIn | 16:9 or 1:1 | 1920x1080 |

- **No baked-in bars.** YouTube: "For best results, avoid adding padding or black bars directly to your video" (https://support.google.com/youtube/answer/6375112).
- **Each ratio is its own composition** when the video is built in code: seek-engine's [SKILL.md](../../videos/seek-engine/SKILL.md) says the ratios "are different compositions of one story, never crops of one render".

## Prove it

Every clip carries captions that match its audio; `ffprobe` on each file shows the resolution in its platform's row; no frame has padding or black bars; each clip's source timestamp in the long recording is logged so it can be re-cut.
