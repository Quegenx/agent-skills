# Background jobs against paid AI APIs

Transcription, long generation, batch extraction: work that takes seconds to hours, costs money per call, and runs in a background job. A web request never waits for it: the request saves the job and returns right away, a worker does the work, and the UI reads the saved status (the async request pattern; see the `background-jobs` skill).

The dangerous moment is when you sent the request and didn't get the answer back (timeout, crash, deploy). The provider may already be processing it. Retrying blindly can submit and pay twice; giving up loses work you already paid for.

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

## A job is a state machine

```
queued -> submitting -> submitted(provider_job_id) -> processing -> completed
                     \-> uncertain (sent, no reply)  -> reconciled -> submitted | failed
                                                     failed (with reason)
```

- **Record intent before the call:** save the job row with your own id and state `submitting` (a "submission started" marker) before sending anything.
- **Send an idempotency key** (your job id) if the provider supports one, so a repeat submission returns the original job instead of a new charge.
- **Store the provider's job id** the moment it comes back, in its own write.
- **On restart, decide from what was saved:**

  | Saved | Do |
  |---|---|
  | a provider job id | resume polling that job |
  | only the "submitting" marker | stop: mark `uncertain` and reconcile before anything else |
  | neither | submit |

- **A lost response is `uncertain`, not `failed`.** The marker doesn't recover the job id; it stops a second charge while you don't know what happened. Reconcile by looking the job up at the provider (by your reference or idempotency key, or by listing recent jobs) or, for a small personal tool, by a person checking the provider dashboard. Resubmit only when the provider confirms nothing was created or the call is idempotent.
- **Polling is safe to repeat; submission is not.** Turn off automatic HTTP retries (client defaults, resilience middleware) on the submit call; keep them on reads.
- **Results arrive by webhook or polling:** accept webhooks (verify the signature, handle duplicates and out-of-order delivery by checking the current state), and keep a slow polling fallback for jobs stuck in `processing`.
- **Every transition is a conditional update** (`update ... where id = $1 and state = 'submitting'`), so two workers can't both submit.
- **Retries are bounded,** with backoff and jitter, and a terminal `failed` state with the reason shown to the person.

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
- Log the provider, model, request size and actual billed amount per job, so the real cost is known, not guessed.

## Testing it

Simulate each failure on purpose: a timeout after sending, a crash between sending and storing the provider id, a duplicate webhook, a webhook before the submit response, the provider returning an error status with `200 OK`, a deploy mid-job. In each case confirm there is exactly one provider job and one charge, and the person sees an accurate state.
