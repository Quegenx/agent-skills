# First-party attribution: the stitch

How to instrument and stitch attribution yourself when you control the site or app: join anonymous browsing to the eventual conversion, including a conversion that completes on a domain you don't own (a booking tool, a hosted checkout). From [coreyhaines31/marketingskills, attribution] (references/first-party-tracking.md, MIT). The core method, closing the `identify()` gap so conversions join to anonymous history, is adapted from Tessa Kriesel's PostHog attribution approach, and several production refinements are hers, credited inline. PostHog and SavvyCal are the worked example; the pattern maps to any tool with identify and merge and any third-party domain with a metadata passthrough and a webhook. PostHog's own identity rules are [posthog IDENTITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/IDENTITY.md); webhook signatures and retries are [third-party-integrations SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/third-party-integrations/SKILL.md).

**Contents:** [The one idea](#the-one-idea) · [Step 0: audit before you build](#step-0-audit-before-you-build) · [Step 1: identify at each real conversion](#step-1-identify-at-each-real-conversion) · [Step 2: stitch a conversion on another domain](#step-2-stitch-a-conversion-on-another-domain) · [Step 3: the guardrails](#step-3-the-guardrails) · [Step 4: report](#step-4-report) · [The last mile into the CRM](#the-last-mile-into-the-crm) · [Other stacks](#other-stacks) · [Prove it](#prove-it)

## The one idea

[coreyhaines31/marketingskills, attribution]

```
anonymous visitor          identify() at conversion         breakdown
─────────────────          ────────────────────────         ─────────
distinct_id = anon_uuid    identify(email)                  conversion event
$initial_utm_source=...  → merges anon history        →     by $initial_utm_source
$initial_referrer=...      into person(email)               = "where do customers come from"
```

Everything below serves that join. If `identify()` never fires, every customer looks like they appeared from nowhere: that's the gap.

## Step 0: audit before you build

[coreyhaines31/marketingskills, attribution] The most expensive mistake is rebuilding attribution that already works. Check the live data first:

- Do person profiles carry `$initial_utm_source` / `$initial_referring_domain`?
- Does a conversion event (`Signed up`, `Converted to paid`) break down cleanly by channel, or is everything "Direct"?
- Is identity keyed by **email** or by an internal **UUID**? This changes every guard below.
- Does cross-subdomain stitching work (marketing site to app.yourdomain.com)?

Only instrument the conversions that are genuinely un-joined. In one real audit the self-serve funnel was already solved end to end; the only gap was a booking on a third-party domain.

## Step 1: identify at each real conversion

[coreyhaines31/marketingskills, attribution] At every conversion moment, call `identify()` with a stable ID and set person properties:

```js
// Normalize before use as a distinct_id - analytics tools match exact strings,
// so "Corey@x.com" and "corey@x.com" split into two people otherwise.
export function identifyUser(email) {
  const normalized = email.trim().toLowerCase();
  window.posthog?.identify(normalized, { email: normalized });
}
```

- With `person_profiles: 'identified_only'` this is the moment the person is created and first-touch properties are stamped. Fire it on form success, signup, first purchase: any moment you learn who the visitor is.
- **Two views on the ID.** The source's worked example identifies by email. The [PostHog skill's rule 4](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/SKILL.md#the-rules) says to use a stable auth ID, never an email, and two ID schemes (email vs database ID) are a named cause of refused merges ([posthog INGESTION-FIXES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/INGESTION-FIXES.md#cannot_merge_already_identified)). Use the app's one canonical scheme; if that is email, normalize it the same way everywhere, client and webhook.

## Step 2: stitch a conversion on another domain

[coreyhaines31/marketingskills, attribution] You can't run your analytics on a third-party domain, so carry the anonymous ID through the tool's **metadata passthrough**, then merge it back in the **webhook**.

### 2a. Capture-phase link decorator

One document-level listener rewrites every outbound booking link at click time: no per-CTA edits, and it covers plain clicks, keyboard activation and middle-click (`auxclick`).

```js
// Refresh anonymous metadata on each SavvyCal activation; clear stale IDs.
function decorate(e) {
  const anchor = e.target?.closest?.("a[href]");
  if (!(anchor instanceof HTMLAnchorElement)) return;

  let url;
  try { url = new URL(anchor.href); } catch { return; }
  const host = url.hostname;
  if (host !== "savvycal.com" && !host.endsWith(".savvycal.com")) return;

  const distinctId = getPostHogDistinctId();   // anonymous-only - see guard
  if (distinctId) {
    url.searchParams.set("metadata[ph_distinct_id]", distinctId);
  } else {
    // The same anchor may have been decorated before identify() or reset().
    url.searchParams.delete("metadata[ph_distinct_id]");
  }
  anchor.href = url.toString();
}
document.addEventListener("click", decorate, true);    // capture phase
document.addEventListener("auxclick", decorate, true);
```

- An early return when the guard rejects the current ID leaves previously added metadata on the anchor. Remove that one parameter instead, preserving the booking path, other parameters and fragment. Check both `click` and `auxclick` after an identity change.
- SavvyCal's passthrough, verbatim: "We'll parse any query string parameters named like this: `metadata[KEY]=VALUE`... Any metadata you set will be included in the event payload"; embeds take "an object of metadata" ([docs.savvycal.com/article/71](https://docs.savvycal.com/article/71-storing-custom-metadata-on-events)).
- **Inline embed** (a `/demo` page with an embedded calendar): pass the same ID in the embed's metadata config; poll briefly (about 2 s) for the ID on fresh visits, but never block the calendar from rendering.
- The web-to-app deep-link version of this (`ph_distinct_id` in a universal link) is in [posthog IDENTITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/IDENTITY.md#across-platforms-and-environments).

### 2b. Read the anonymous ID safely

The SDK stub queues calls before it loads, so `get_distinct_id()` returns undefined early; fall back to PostHog's own cookie:

```js
export function getPostHogDistinctId() {
  if (typeof window === "undefined") return null;

  // Prefer the loaded SDK.
  try {
    if (window.posthog?.__loaded) {
      const id = window.posthog.get_distinct_id();
      if (id) return isAnonymousDistinctId(id) ? id : null;
    }
  } catch {}

  // Fall back to PostHog's cookie before the SDK finishes loading.
  try {
    const prefix = `ph_${POSTHOG_API_KEY}_posthog=`;
    const cookie = document.cookie.split(/;\s*/).find(c => c.startsWith(prefix));
    if (!cookie) return null;
    const parsed = JSON.parse(decodeURIComponent(cookie.slice(prefix.length)));
    return typeof parsed.distinct_id === "string" && isAnonymousDistinctId(parsed.distinct_id)
      ? parsed.distinct_id : null;
  } catch { return null; }
}
```

### 2c. Merge in the webhook

The booking tool returns your metadata in its webhook. Fire an identity merge plus a conversion event to the ingestion endpoint:

- **Event names.** SavvyCal's webhook type is `event.created` (`event.requested` when the booking needs approval) ([savvycal.com/docs/api/webhooks/payloads](https://savvycal.com/docs/api/webhooks/payloads)); Stripe hosted Checkout fulfils on `checkout.session.completed` ([stripe CHECKOUT-NEXTJS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/CHECKOUT-NEXTJS.md)). The source said "`booking.created` (or `checkout.completed`)", neither of which is those providers' name.

```js
// Normalize the booking email the same way the app does (Step 1), or the
// booking person will split from the app-side identity for the same user.
const userId = email.trim().toLowerCase();

const events = [];
if (anonId) {
  events.push({
    event: "$identify",
    distinct_id: userId,                                  // the known person
    properties: { $anon_distinct_id: anonId, $set: { email: userId, name } },  // merge the journey
  });
}
events.push({
  event: "discovery_call_booked",
  distinct_id: userId,
  properties: { booking_id, journey_linked: Boolean(anonId) },  // track the fallback rate
});

// Run after the booking's business-critical work; analytics must not fail it.
try {
  const response = await fetch(`${POSTHOG_HOST}/batch/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: POSTHOG_API_KEY, batch: events }),
    signal: AbortSignal.timeout(3000),
  });
  // fetch resolves for HTTP errors too; a resolved promise isn't acceptance.
  if (!response.ok) {
    console.warn("Analytics ingestion rejected", { booking_id, status: response.status });
  }
} catch {
  // Timeouts and network errors stay non-fatal. Never log the payload or email.
  console.warn("Analytics ingestion unavailable", { booking_id });
}
```

- **A 200 is not proof of acceptance either:** PostHog's capture docs say some invalid events still return "200: OK", and the body must be under 20MB ([posthog.com/docs/api/capture](https://posthog.com/docs/api/capture)). Verify the merged person in PostHog. The same `$anon_distinct_id` merge from `posthog-node` is in [posthog SETUP-SERVER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/SETUP-SERVER.md).
- **Fallback:** when no ID survives (the link bypassed the decorator, such as a booking link inside a generated email or PDF), capture email-only with `journey_linked: false`. You still get the conversion, not the journey.
- **First-touch survival caveat (PostHog):** the `$anon_distinct_id` merge carries the anonymous person's *event* history, but with `person_profiles: 'identified_only'` the anonymous visitor may never have had a person profile, so `$initial_*` properties aren't guaranteed to land on the merged person. Two fixes: call `posthog.createPersonProfile()` client-side *before* the visitor leaves for the third-party domain, or capture the first-touch values client-side, pass them through the same metadata passthrough and re-assert them in the webhook with `$set_once` (which never overwrites an existing value). Verify on a real booking ([posthog-js#1524](https://github.com/PostHog/posthog-js/issues/1524)).

## Step 3: the guardrails

### The anonymity guard

[coreyhaines31/marketingskills, attribution] Only ever carry the *anonymous* ID. After `identify()` the current `distinct_id` becomes the user's email or UUID; leaking that into a third-party URL, or merging on it in the webhook, folds unrelated people together and leaks PII. Pick the guard that matches the identity model; the two are not interchangeable.

```js
// EMAIL-IDENTITY apps only. True only for ids safe to smuggle: reject
// email-shaped values (an identified email) and cap length.
export function isAnonymousDistinctId(id) {
  return id.length > 0 && id.length <= 100 && !id.includes("@");
}
```

If the app identifies by UUID, the `@` check is useless (an identified UUID passes it). Test that the current `distinct_id` still equals the `$device_id` (`identify()` changes `distinct_id` but leaves `device_id`), and fail closed when it is unreadable:

```js
// UUID-identity variant: only anonymous when distinct_id still == device_id.
function isAnonymous(posthog) {
  const did = posthog.get_distinct_id?.();
  const dev = posthog.get_property?.("$device_id");
  if (!did || !dev) return false;   // ambiguous → treat as identified, send nothing
  return did === dev;
}
```

The rule in one line: **when identity is ambiguous, send nothing.** A missing journey is a data gap; a wrong merge is corruption.

### First-touch data quality

[coreyhaines31/marketingskills, attribution] Redirects overwrite the true first touch, inflating "Direct" and "Referral". Exclude these from referrer and channel classification:

- **OAuth and checkout redirects:** `accounts.google.com`, `login.microsoftonline.com`, `login.live.com`, `checkout.stripe.com`
- **Self and subdomain referrals:** `yourdomain.com`, `app.yourdomain.com`, `auth.yourdomain.com`
- **Dev and internal traffic:** `localhost`, `127.0.0.1`, test accounts

The source calls this the "highest-trust-per-effort" fix and "usually a *settings* change in the analytics tool, not code"; whether a given tool exposes a referrer-exclusion setting was not checked. Filtering internal users in PostHog is in [posthog EVENTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/EVENTS.md#filtering-internal-users).

### Cross-subdomain stitching

[coreyhaines31/marketingskills, attribution] A marketing site and an app on a subdomain must share **one analytics project** and a **cross-subdomain cookie** (PostHog's `cross_subdomain_cookie` defaults to on; [posthog CONFIG-WEB.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/CONFIG-WEB.md)). Verify the journey survives the handoff, or every signup looks like it started at the app.

**Expect near-zero numbers until the stitch is verified in production** (production note from Tessa Kriesel): journeys break at the handoff and everything looks direct, then flip to real numbers the week the stitch ships. Through that window:

- **A campaign-window fallback:** attribute a signup with no linked journey to the campaign live during its signup window, but only when date, landing page and active UTMs uniquely narrow it to one source. With overlapping campaigns, evergreen ads, email sends, branded or direct demand, or a shared landing page, mark it `unknown` or low-confidence.
- **Backfill only the pre-stitch records missing a source,** never overwriting a higher-confidence source; tag the backfill and keep it visually separate from verified trends, so a cliff on launch day isn't read as a real shift.
- Mark fallback conversions with a lower-confidence `basis` ([the last mile](#the-last-mile-into-the-crm)).

### Harden the webhook

[coreyhaines31/marketingskills, attribution]

- **Verify the provider's signature.** SavvyCal signs with the header `x-savvycal-signature: sha256=...` ([savvycal.com/docs/api/webhooks/payloads](https://savvycal.com/docs/api/webhooks/payloads)).
- **Validate the carried ID** (a string, at most 100 characters, no `@`) before merging.
- **Run analytics after the business-critical work,** bounded by a timeout and non-fatal on failure; check the HTTP status and catch timeouts and network rejections, as in 2c. If delivery needs retry guarantees, enqueue analytics separately with idempotency rather than failing or replaying the booking ([background-jobs SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/background-jobs/SKILL.md)).
- **Dedupe the conversion on the booking ID** (or the payload `id`). SavvyCal asks you to "respond quickly with a `200 OK`... enqueue the body in a job queue" and says "If we receive a non-2xx response code, we will retry with exponential backoff", so the same booking can arrive more than once ([savvycal.com/docs/api/webhooks/payloads](https://savvycal.com/docs/api/webhooks/payloads)). The source didn't name the duplicate.
- **Log the booking ID, never the email.**

## Step 4: report

[coreyhaines31/marketingskills, attribution]

- **Config check:** many tools default to last-touch. PostHog's Marketing Analytics scene defaults to last-touch with a 90-day window, verified in PostHog's source code, not its docs ([posthog WEB-ANALYTICS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/WEB-ANALYTICS.md#marketing-analytics)). First-party attribution wants first-touch: build insights on `$initial_*` explicitly, or switch the default.
- **The payoff insight:** the conversion event broken down by `$initial_utm_source` / `$initial_referring_domain` ([posthog METRICS-MODELING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/METRICS-MODELING.md#conversion) has the `argMin` query).
- **Channel to revenue:** the conversion event by channel, joined to revenue or MRR person properties. Some tools compute revenue properties at ingest (person-on-events), so historical events may read 0; use the persons table for current MRR, or tier by plan.
- **Track coverage:** the `journey_linked: false` rate tells you how many conversions bypassed the stitch. Watch it after launch.
- **Store the full touch path, not just `$initial_*`** (refinement from Tessa Kriesel). First-touch alone can't run the multi-touch models; persisting the ordered sequence of touches per person (channel and timestamp each, from an events query or a `touch_path` array) lets you score the same journey position-based, linear or time-decay on your own data ([ATTRIBUTION-MODELS.md](ATTRIBUTION-MODELS.md)).

## The last mile into the CRM

[coreyhaines31/marketingskills, attribution] (This whole step is a production refinement from Tessa Kriesel.) A channel breakdown in an analytics tool is a report; sales and lifecycle act on attribution written onto the record in the CRM, per account.

- **A `source` field, plus `source_confidence` and `source_basis`.** `basis` is the evidence type: `journey_linked` (verified stitch), `self_reported` (survey) or `campaign_window` (the heuristic fallback). `confidence` comes from evidence quality, not the basis alone: a journey-linked touch with clean UTMs is high, the same touch with dirty or missing UTMs lower; a specific self-report can be high, a vague one low.
- **Paid vs non-paid off the medium.** Mark a touch `paid` only from explicit paid mediums (`cpc`, `ppc`, `paid-social`, `display`, `paid`); classify the rest into a small configurable taxonomy rather than a blunt "organic": `owned` (email, push, SMS, though a sponsored newsletter is paid), `earned` (organic search and social, referral, though a partner or affiliate referral is closer to paid), `direct` (no medium: unknown, not organic), `unknown`. UTM conventions are [google-analytics UTM.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/google-analytics/UTM.md).
- **Hand the record to revops:** how pipeline and lifecycle use source, confidence, basis and paid vs non-paid (routing, scoring, nurture, revenue reporting) is [revops SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/revops/SKILL.md).

### Account rollup

[coreyhaines31/marketingskills, attribution] One org is several people with mixed work and personal emails, so person-level attribution scatters the story. Roll each person's source up to the account. Match on email domain, but exclude free-mail domains (`gmail.com`, `yahoo.com`, `outlook.com`, ...), which would collapse unrelated people into one bogus account; for personal-email signups fall back to enrichment, the CRM's contact-to-account link or manual matching. PostHog group analytics is in [posthog IDENTITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/IDENTITY.md#group-analytics).

## Other stacks

[coreyhaines31/marketingskills, attribution] The non-PostHog column is the source's claim, not checked against those vendors' docs, except the Calendly row.

| Piece | PostHog (worked example) | Generalizes to |
|---|---|---|
| Anonymous ID | `distinct_id` / `$device_id` | Segment `anonymousId`, Amplitude `deviceId`, GA4 `client_id` |
| Merge call | `$identify` + `$anon_distinct_id` | Segment `identify` (known `userId`, same `anonymousId`) plus `alias` where needed; Amplitude `setUserId` on the session that still holds the anonymous `deviceId` (Amplitude's Identify API only sets user properties, it does not merge); GA4 `user_id` on the same `client_id` |
| Ingestion | `/batch/` | Segment HTTP API, Amplitude HTTP v2, GA4 Measurement Protocol |
| Third-party passthrough | SavvyCal `metadata[...]` | Calendly, Cal.com metadata, Stripe `client_reference_id` / metadata |
| First-touch properties | `$initial_*` | Segment and Amplitude first touch, GA4 `first_user_*` dimensions |

- **Calendly:** its help lists only the five UTMs (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`) and says "UTM values must be 255 characters or less... If they're longer, they may not be tracked" ([calendly.com/help](https://calendly.com/help/how-to-track-conversions-with-utm-parameters)). The source also lists `salesforce_uuid`, which appears only in Calendly Community posts, and suggests mapping the anonymous ID into a supported UTM such as `utm_term` instead of a free-form `metadata[]` parameter.

The shape never changes: grab the anonymous ID, carry it across the boundary, merge on the far side, break the conversion down by first touch.

## Prove it

The source's checklist, with its acceptance check corrected:

- Click a booking CTA: the URL shows `metadata[<id_param>]=<anon-uuid>`.
- In the console, `posthog.identify('test@x.com')`, then click the same anchor again with a click and a middle-click: the parameter must **not** appear, and the booking path, campaign parameters and fragment are unchanged. `posthog.reset()` afterwards.
- Send a test webhook payload: the response is checked for `ok`, and the person appears merged in PostHog with the booking event on it. The source said to "expect `{"status":"Ok"}`"; PostHog's capture docs don't document that body, and a 200 alone doesn't prove the events were accepted.
- Make the ingestion call time out or return 503: the booking still succeeds, the log line carries only the booking ID and status, and no payload, email or raw exception is logged.
- Send the same webhook twice: one conversion event, not two.
- After shipping, the first real webhook log shows `journey_linked: true`.
- Start on the marketing site, sign up in the app: the person carries the original `$initial_utm_source`.
