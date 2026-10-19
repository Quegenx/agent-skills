# Repurposing long recordings: clips and graphic packaging

One podcast, webinar or demo becomes many short clips for TikTok, Reels, Shorts and LinkedIn, or stays complete with transcript-based graphic cards. The clip workflow is from [coreyhaines31/marketingskills, video] (MIT); the complete-program alternative below is from [heygen-com/hyperframes, talking-head-recut]. Cutting supplied speech inside a code-built film (word-boundary cuts, padding, fades, eye-line across cuts) is asset-prep's "Transforming supplied footage" in [asset-prep SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/asset-prep/SKILL.md); what to post and when is [social-media](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/social-media/SKILL.md).

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

To match a particular editing style (cut rhythm, caption treatment, punch-ins) on these clips, decode the reference first with [video-brief](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/SKILL.md)'s "A short-form edit to match", then hand the beat sheet and signature moves to the editor as the brief.

## Keep the complete program with summary cards

When the request is to package the complete recording, keep the supplied video playing in full and add timed graphic cards grounded in its transcript. Preserve the program's footage, audio and order unless the user asks for an edit. Titles, callouts, quotes and side panels should follow what is being said; choose their content and timing from the recording rather than a fixed card count or template. [heygen-com/hyperframes, talking-head-recut/SKILL.md:12-25](https://github.com/heygen-com/hyperframes/blob/main/skills/talking-head-recut/SKILL.md#L12-L25).

A summary card selects or paraphrases a point; verbatim captions show the spoken words. Keep that distinction clear, retain the speaker's meaning and identify a quotation accurately. Summary cards do not replace the captions required below. For cards built in code, use [make-video](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/make-video/SKILL.md)'s brief and review gates, with the source recording as the main program.

Source correction: talking-head-recut/SKILL.md:102 hardcodes Whisper `small.en`; it is English-only. For non-English speech, select a multilingual checkpoint such as `small`, as distinguished in [Whisper's official model table](https://github.com/openai/whisper/blob/main/README.md#available-models-and-languages).

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
- **Each ratio is its own composition** when the video is built in code: seek-engine's [seek-engine SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/SKILL.md) says the ratios "are different compositions of one story, never crops of one render".

## Prove it

Every clip carries captions that match its audio; `ffprobe` on each file shows the resolution in its platform's row; no frame has padding or black bars; each clip's source timestamp in the long recording is logged so it can be re-cut.

For a complete-program version, compare the output with the source for footage, audio, order and duration; log any requested edits. Check each summary card against the relevant transcript passage and inspect its timing over the playing footage. Captions still match the spoken words.
