# Serverless browser functions

Package a browser task as a function the service runs on demand: it receives a ready session and parameters and returns JSON. The commands below are Browserbase Functions (vendor).

## Practice

- **Connect to the provided session, never launch a browser:** `connectOverCDP`, not `launch`.
- **Set explicit timeouts** on every navigation and wait (for example `goto` 30000 ms, `waitForSelector` 10000 ms).
- **Wait for a selector, not a sleep.**
- **Return a structured failure instead of throwing:** catch and return `{success: false, error}`, so the caller always gets a shape it can read.
- **Return only JSON-serializable values.**
- **Login pattern:** fill `[name="email"]` and `[name="password"]`, click submit, `waitForURL('**/dashboard')`.

## Browserbase Functions

```
browse functions init <name>        # package.json, index.ts, .env
pnpm install
browse functions dev index.ts       # local server http://127.0.0.1:14113, auto-reload, console.log in the terminal
browse functions publish index.ts   # prints a Build ID and a Function ID: save the Function ID
```

Shape, with `defineFn` from `@browserbasehq/sdk-functions` and `chromium` from `playwright-core`:

```ts
defineFn("name", async ({ session, params }) => {
  const browser = await chromium.connectOverCDP(session.connectUrl);
  const page = browser.contexts()[0]!.pages()[0]!;
  // ...
  return /* JSON-serializable */;
});
```

- **Invoke locally:** `POST http://127.0.0.1:14113/v1/functions/<name>/invoke` with `{"params":{...}}`.
- **Invoke remotely:** `POST https://api.browserbase.com/v1/functions/<FUNCTION_ID>/invoke` with header `x-bb-api-key` returns `{id}`; poll `GET /v1/functions/invocations/<id>` every 5 s until `COMPLETED` (read `results`) or `FAILED` (read `error`).
- **Maximum execution is 15 minutes.**

| Problem | Fix |
|---|---|
| Dev server won't start | `pnpm add @browserbasehq/sdk-functions`, or `npx @browserbasehq/sdk-functions dev index.ts` |
| Missing API key | Check `.env` |

## Prove it

A local invoke against the dev server returns the expected JSON; after publishing, a remote invoke polled to `COMPLETED` returns the same shape in `results`; a deliberately bad input returns `{success: false, error}` rather than a `FAILED` invocation.
