# Background jobs against paid AI APIs

Transcription, long generation, batch extraction: work that takes seconds to hours, costs money per call, and runs in a background job. A web request never waits for it: the request saves the job and returns right away, a worker does the work, and the UI reads the saved status (the async request pattern; see the `background-jobs` skill).

For submission intent, provider IDs, uncertain outcomes, reconciliation and safe retries, read [external side effects](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/background-jobs/EXTERNAL-SIDE-EFFECTS.md#a-job-is-a-state-machine).

## The provider flow

Most of these APIs share one shape. For speech to text: **upload** the audio, **submit** a job with the uploaded file's URL, **poll** (or receive a webhook) until it finishes, then **download** the result (text, or subtitles as SRT or VTT).

```ts
const BASE = "https://api.assemblyai.com/v2/";     // a regional base URL (e.g. EU) if data residency matters
const headers = { authorization: process.env.ASSEMBLYAI_API_KEY! };   // raw key, no "Bearer"

const { upload_url } = await (await fetch(BASE + "upload", {
  method: "POST", headers, body: audioBytes,
})).json();

const job = await (await fetch(BASE + "transcript", {
  method: "POST",
  headers: { ...headers, "content-type": "application/json" },
  body: JSON.stringify({ audio_url: upload_url, language_code: "en" }),
})).json();
// store job.id now, in its own write, before anything else

let status = job;
while (status.status === "queued" || status.status === "processing") {
  await new Promise((r) => setTimeout(r, 15_000));
  status = await (await fetch(BASE + `transcript/${job.id}`, { headers })).json();
}
if (status.status !== "completed") throw new Error(`TRANSCRIPTION_FAILED: ${status.error}`);
const srt = await (await fetch(BASE + `transcript/${job.id}/srt`, { headers })).text();
```

- **`200 OK` on a status check means the check worked, not the job.** Read the job's own `status` field, and treat anything other than the success value as a failure with its `error`.
- Check `response.ok` on every call; the sketch above leaves it out for length.
- Each run submits a paid job. Develop against a short clip.

## Model calls over a batch

When one call scores or labels many items (posts, rows, messages):

- **Require an answer for every input id.** A response that skips some must not mark the skipped ones as done; retry them or leave them for the next run.
- **Reject values outside the declared range** per item, and keep the rest of the batch.
- **When the cheap screening step fails, keep the items** for the full step instead of dropping them.
- **Finding repeats** (the same request posted in several places): narrow the pairs first in code (the same author, a recent window, the last few texts), match identical text after normalizing spacing and punctuation in code, and ask a model only whether the remaining pairs are the same request in other words. In one sample, one author wrote 667 cross-group pairs, 381 of them word for word.
- **Choose the failure direction by cost:** when the model call fails, keep the item if a missed one costs more than an extra one (an extra alert beats a lost lead).

## Cost and limits

- Estimate cost before submitting (duration, tokens, pages) and enforce a per-user and global budget; show the budget in the UI.
- Do the yearly arithmetic from the provider's unit price and your real volume (hours of audio, pages, tokens), and write down what it excludes: retries, re-processing, translation, add-ons, hosting, tax. Prices change; date the number.
- Respect provider rate limits; queue instead of hammering.
- Work that can wait can go through the provider's batch API: Anthropic's Message Batches API is half price on input and output tokens ([batch processing docs](https://platform.claude.com/docs/en/build-with-claude/batch-processing)).
- Log the provider, model, request size and actual billed amount per job, so the real cost is known, not guessed.

## Prove it

Use the failure cases in [external side effects](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/background-jobs/EXTERNAL-SIDE-EFFECTS.md#prove-it) to check the provider flow.
