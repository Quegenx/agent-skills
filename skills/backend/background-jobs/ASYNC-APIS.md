# Async APIs: accept now, finish later

When an operation takes longer than a request should stay open (imports, exports, reports, media processing such as thumbnails and optimization, AI generation), don't hold the connection. A slow upload or a big file times out, and the server is tied up doing one thing per request. Accept the work durably, return immediately, and let the client follow a status resource.

This is not the same as `async`/`await`: that lets one server handle many requests at once. An async API makes the whole operation asynchronous from the user's point of view.

## The flow

1. `POST /imports` validates the request, writes a job row (`queued`) and enqueues or schedules the work **in the same transaction**, then returns `202 Accepted` with `Location: /imports/{jobId}` and the job body. During the request do only the minimum: validate, store the input, record the job.
   - **Store the input before the job exists** (an upload in Supabase Storage or Convex file storage, keyed by the job id), so the worker reads it from durable storage, not from the request or a local disk another instance can't see. If the job row is never written, a cleanup removes inputs with no job.
2. `GET /imports/{jobId}` returns the current state:

```json
{
  "id": "imp_8f2c",
  "status": "running",
  "progress": { "processed": 1200, "total": 5000 },
  "createdAt": "2026-10-15T09:12:03Z",
  "updatedAt": "2026-10-15T09:13:40Z",
  "result": null,
  "error": null
}
```

3. On completion the status is `succeeded` with a `result` or links to it (`"links": { "original": "...", "thumbnail": "...", "preview": "..." }`); on failure `failed` with an `error` in the API's Problem Details shape and whether retrying makes sense. An unknown or foreign job id is 404.
4. Optionally notify, but keep the status endpoint as the source of truth. Polling every second is 60 requests a minute that mostly return the same answer, so pick by how long the job takes:
   - seconds to minutes, user watching: push over a realtime subscription or server-sent events (the `api-design` skill's STREAMING.md), or poll with a growing interval;
   - hours (a report, an overnight batch): email or an in-app notification, so the user can close the tab;
   - another system waiting: a signed webhook on completion.

## Rules

- **The id refers to a real, durable job.** Never return a tracking id for work held only in process memory; a deploy or crash between accept and finish would leave the client polling forever.
- **States are explicit and finite:** `queued`, `running`, `succeeded`, `failed`, and `canceled` if cancellation exists. Add `uncertain` when a step has an external side effect that may or may not have happened.
- **Progress is real or absent.** Report counts you actually know and the current stage by name ("generating thumbnails", "optimizing"); don't invent percentages.
- **Bound the backlog.** A queue that grows without limit turns a traffic spike into memory exhaustion or hours of delay. Cap queued jobs per user and overall, and answer 429 or 503 with `Retry-After` when full, instead of accepting work you can't do.
- **Checkpoint long jobs.** A job that fails halfway records what it finished (rows imported, files processed), so a retry resumes instead of starting over and repeating side effects.
- **Make the POST idempotent** (an idempotency key, or a natural key such as the uploaded file's hash) so a client retry doesn't start the job twice.
- **Authorize the status resource:** only the owner can read a job.
- **Keep results for a stated time,** then expire them, and say so in the response. Generated files (reports, exports) go to object storage, and the user gets a short-lived signed link from an authorized endpoint, never a public URL.
- **Making the job faster doesn't remove the wait.** A report five times quicker still blocks the user and still dies with the tab; move it off the request first, then optimize its queries.
- **Stuck jobs are found and handled:** a job `running` past its expected duration with no heartbeat is either retried (if safe) or marked failed with a reason.
- **Providers offer the same split.** OpenSEO sends scheduled rank checks through DataForSEO's task queue "instead of the live API, which costs about a third as much", at the price of posting the tasks, polling for results and handling "the ones that get stuck" [openseo.so, /openseo-vs-dataforseo].
- **Workers scale separately from the API.** Keeping the heavy work out of request handlers lets the API stay fast while the worker pool grows or shrinks with the backlog. A worker loop inside the API process is a fine first step; once it competes with the endpoints for CPU, memory and database connections, move it to its own deployment behind the queue. Choosing a queue or broker for that is in the `messaging` skill.

## Stack notes

- **Convex:** the mutation that creates the job document and calls `ctx.scheduler.runAfter(0, internal.imports.run, { jobId })` commits both or neither. The client subscribes to the job document with a reactive query instead of polling.
- **Supabase/Postgres:** insert the job row and `pgmq.send` (or the jobs table itself, see [WORKERS.md](WORKERS.md)) in one transaction; the client reads the row through a policy that limits it to the owner, or subscribes to it with Realtime.

## Sketch (Supabase / Postgres, a route handler and a worker)

```ts
// POST /images: accept, store the input, record the job, return 202
export async function POST(req: Request) {
  const file = (await req.formData()).get("file");
  if (!(file instanceof File) || !ALLOWED_TYPES.has(file.type)) return problem(400, "invalid_image");
  const jobId = crypto.randomUUID();
  await storage.upload(`images/${jobId}/original`, file);                 // durable input, keyed by the job
  await db.query(`insert into image_jobs (id, owner_id, status) values ($1, $2, 'queued')`, [jobId, user.id]);
  return Response.json({ id: jobId, status: "queued" },
    { status: 202, headers: { Location: `/images/${jobId}/status` } });
}

// GET /images/:id/status: owner only, links once done
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const job = await db.maybeOne(`select * from image_jobs where id = $1 and owner_id = $2`, [params.id, user.id]);
  if (!job) return problem(404, "not_found");
  return Response.json({
    id: job.id, status: job.status, stage: job.stage,
    links: job.status === "succeeded" ? { original: url(job, "original"), thumbnail: url(job, "w200"), preview: url(job, "w800") } : {},
  });
}

// Worker: claim, process, record each stage; one failure never stops the loop
for (const job of await claimJobs(10)) {                                  // the SKIP LOCKED claim from WORKERS.md
  try {
    await setStage(job.id, "generating thumbnails");
    await generateThumbnails(job);
    await setStage(job.id, "optimizing");
    await optimize(job);
    await finish(job.id, "succeeded");
  } catch (error) {
    log.error({ err: error, jobId: job.id }, "image job failed");
    await failOrRetry(job, error);                                        // backoff, or failed with a reason
  }
}
```

## Prove it

Design a catalog-import API that returns a job location. Accept a job, restart the process before the worker picks it up, and confirm the job still runs. Then check the status responses for queued, running, failed and succeeded, including a failure in the middle of the import.
