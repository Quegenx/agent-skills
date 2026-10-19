# External side effects in background jobs

The dangerous moment is when you sent the request and didn't get the answer back (timeout, crash, deploy). The provider may already be processing it. Retrying blindly can submit and pay twice; giving up loses work you already paid for.

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

## Prove it

Simulate each failure on purpose: a timeout after sending, a crash between sending and storing the provider id, a duplicate webhook, a webhook before the submit response, the provider returning an error status with `200 OK`, a deploy mid-job. In each case confirm there is exactly one provider job and one charge, and the person sees an accurate state.
