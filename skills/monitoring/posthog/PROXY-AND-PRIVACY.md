# Proxy and privacy

Proxy routing determines where SDK requests go; you, as controller, decide what is collected and when: PostHog provides opt-in and opt-out, cookieless mode, EU hosting, transformations and deletion, and on opt-out you must stop all capture and processing. Init options are in [CONFIG-WEB.md](CONFIG-WEB.md); framework setup in [SETUP-WEB.md](SETUP-WEB.md) and [SETUP-NEXTJS.md](SETUP-NEXTJS.md); replay masking in [SESSION-REPLAY.md](SESSION-REPLAY.md).

**Contents:** [Proxy: how it works](#proxy-how-it-works) · [Managed proxy](#managed-proxy) · [Your own proxy](#your-own-proxy) · [Next.js](#nextjs) · [Vercel](#vercel) · [Cloudflare](#cloudflare) · [Vite dev proxy](#vite-dev-proxy) · [Proxy troubleshooting](#proxy-troubleshooting) · [Network allowlists](#network-allowlists) · [Keys, hosting and agreements](#keys-hosting-and-agreements) · [Consent](#consent) · [Cookieless mode](#cookieless-mode) · [Collection controls](#collection-controls) · [Storage, transformations and deletion](#storage-transformations-and-deletion) · [Prove it](#prove-it)

## Proxy: how it works

- **Two upstreams.** `/static/*` and `/array/*` go to the assets host, everything else to the API host. US: `us-assets.i.posthog.com` and `us.i.posthog.com`. EU: `eu-assets.i.posthog.com` and `eu.i.posthog.com`. `/array/{token}/config.js` (remote config) belongs on the assets host, which keeps its `cache-control`.
- **Set both hosts in the SDK.** `api_host` is the proxy; `ui_host` is `https://us.posthog.com` or `https://eu.posthog.com`, or the toolbar and recordings player break:

```javascript
posthog.init("<ph_project_token>", {
  api_host: "https://yoursubdomain.myapp.com",
  ui_host: "https://us.posthog.com",
});
```

- **Flags on their own host:** `flags_api_host` sends flag requests through a separate proxy host, so blocking analytics doesn't block flags.
- **Strip credentials.** A proxy forwards all headers, cookies included, by default: delete `cookie` and `authorization`, or use `persistence: 'localStorage'`. Ingestion authenticates with the project token in the body.
- **What PostHog asks blockers to block:** only `https://us.i.posthog.com/i/v0/e` and `https://eu.i.posthog.com/i/v0/e`, not `/flags` or `*-assets.i.posthog.com/static/`, which sites need to work.

## Managed proxy

- **Free on PostHog Cloud,** routed through Cloudflare (a subprocessor). Not HIPAA-compliant: the BAA doesn't cover it.
- **Steps:** organization settings > proxy (`https://app.posthog.com/settings/organization-proxy`) > new managed proxy > choose a subdomain; add a CNAME to the generated target (like `4854cf84789d8596ad01.proxy-us.posthog.com`); if the DNS provider proxies (Cloudflare orange cloud), switch it to gray. Status goes waiting, issuing, live: typically 2 to 5 minutes, up to 30, hours for a changed CNAME.
- **Diagnose (the "..." menu > Diagnose)** checks the DNS CNAME, certificate status, CAA records (allow `pki.goog`, `letsencrypt.org`, `ssl.com`), the HTTP-01 challenge (port 80 open, no HTTP to HTTPS redirect on the verification path), a live event probe and certificate expiry. A Cloudflare Enterprise zone hold breaks it: use your own Cloudflare Worker.
- **It strips the `Cookie` header.** Keep cookies off the proxy subdomain by omitting `Domain` or using the `__Host-` prefix.
- **EU edge termination isn't contractually enforced** (Cloudflare anycast, no Regional Services or Data Localization Suite). Nothing is stored, logged or cached at the edge; for strictly EU-only edges, run your own proxy.

## Your own proxy

- **Requirements:** set the `Host` header to the PostHog domain (else 401), allow `GET` and `POST`, accept 64MB request bodies (recordings), forward `X-Forwarded-For` with the original client IP.
- **PostHog can't troubleshoot it,** and all traffic (events, recordings, flags, assets) counts against your provider's bandwidth and invocations (Vercel, Netlify, CloudFront, Railway).

## Next.js

### Rewrites (`next.config.js`)

```javascript
// next.config.js
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/yourpath/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/yourpath/array/:path*',
        destination: 'https://us-assets.i.posthog.com/array/:path*',
      },
      {
        source: '/yourpath/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ]
  },
  skipTrailingSlashRedirect: true,
}

module.exports = nextConfig
```

- **The static and array rules must come before the catch-all.** `skipTrailingSlashRedirect` is required because the API uses trailing slashes (`/e/`); check canonical links and the sitemap for SEO effects.
- **SDK:** `posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, { api_host: '/yourpath', ui_host: 'https://us.posthog.com' })`. Restart the dev server: the config isn't hot-reloaded. The example apps use `/ingest` as the path.
- **On Vercel it costs** Fast Data Transfer and Edge Requests, and recordings are often 1 to 5 MB per session: prefer the managed proxy or Cloudflare Workers.
- **An existing `middleware.ts` or `proxy.ts` (next-intl, NextAuth) can swallow the proxy:** its matcher catches `/yourpath/e`, `/yourpath/flags`, `/yourpath/s` (for example `POST /yourpath/s` redirects 307 to `/en/yourpath/s` and 404s) while `/yourpath/static/*.js` still loads, so PostHog "looks connected". Exclude the path: `matcher: ['/((?!api|yourpath|_next|_vercel|.*\\..*).*)']`.
- **Heroku and Netlify rewrites may return 503 or 400:** use the proxy file.

### Proxy file (middleware)

Use it when rewrites return 503 or 400, or when you need to modify headers. Next.js 16 renamed `middleware.js` to `proxy.js` (export `proxy`); Next.js 15 and earlier use `middleware.js` with `middleware`; codemod `npx @next/codemod@canary middleware-to-proxy .`. Requires Next.js 12.2+; the file sits at the project root beside `app` or `pages`.

- **Forward request headers through the request override.** After removing `cookie` and `authorization`, pass the sanitized headers through `request.headers` in the rewrite options; top-level `headers` sets response headers. The old example passed the request headers as top-level `headers`, so it did not implement the claimed upstream sanitization. [Next.js, https://nextjs.org/docs/app/api-reference/functions/next-response#next]

- **Still set `skipTrailingSlashRedirect: true`** in `next.config.js`.
- **With current Clerk,** compose the proxy by returning the other middleware from the `clerkMiddleware()` callback, using framework path matching for non-auth routing. Enforce authorization at the resources that need it. The old line used `authMiddleware`, `beforeAuth` and `ignoredRoutes`; current composition is documented at https://clerk.com/docs/reference/nextjs/clerk-middleware.
- **Each invocation on Vercel is an Edge Request.**
- **`@posthog/next`** has a built-in proxy option ([SETUP-NEXTJS.md](SETUP-NEXTJS.md#posthognext-pre-release)).

## Vercel

```json
{
  "rewrites": [
    {
      "source": "/yourpath/static/:path(.*)",
      "destination": "https://us-assets.i.posthog.com/static/:path"
    },
    {
      "source": "/yourpath/array/:path(.*)",
      "destination": "https://us-assets.i.posthog.com/array/:path"
    },
    {
      "source": "/yourpath/:path(.*)",
      "destination": "https://us.i.posthog.com/:path"
    }
  ]
}
```

- **Never combine `vercel.json` and `next.config.js` PostHog rewrites;** they conflict.
- **Keep the `/array/` rule:** without it remote config falls through to the API, which strips cache headers, and the SDK config goes stale.
- **Use the named parameter `:path(.*)`,** not a bare `(.*)`.
- **401 after deploy** means a region mismatch.

## Cloudflare

- **Workers have no egress fees** and a free tier of 100,000 requests per day. The alternative (DNS plus Page Rules) needs Enterprise.
- **Worker code** (US; for EU swap both hosts), in ES Modules format (otherwise `Unexpected token 'export'`):

```javascript
const API_HOST = "us.i.posthog.com"
const ASSET_HOST = "us-assets.i.posthog.com"

async function handleRequest(request, ctx) {
  const url = new URL(request.url)
  const pathname = url.pathname
  const search = url.search
  const pathWithParams = pathname + search

  if (pathname.startsWith("/static/") || pathname.startsWith("/array/")) {
    return retrieveAsset(request, pathWithParams, ctx)
  } else {
    return forwardRequest(request, pathWithParams)
  }
}

async function retrieveAsset(request, pathname, ctx) {
  let response = await caches.default.match(request)
  if (!response) {
    response = await fetch(`https://${ASSET_HOST}${pathname}`)
    ctx.waitUntil(caches.default.put(request, response.clone()))
  }
  return response
}

async function forwardRequest(request, pathWithSearch) {
  const ip = request.headers.get("CF-Connecting-IP") || ""
  const originHeaders = new Headers(request.headers)
  originHeaders.delete("cookie")
  originHeaders.delete("authorization")
  originHeaders.set("X-Forwarded-For", ip)

  const originRequest = new Request(`https://${API_HOST}${pathWithSearch}`, {
    method: request.method,
    headers: originHeaders,
    body: request.method !== "GET" && request.method !== "HEAD" ? await request.arrayBuffer() : null,
    redirect: request.redirect
  })

  return await fetch(originRequest)
}

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, ctx);
  }
};
```

- **Custom domains:** use the domain configured for your approved first-party routing; do not choose names or domains to evade tracking blockers. [User standing safety instruction]
- **Buffer the body** with `await request.arrayBuffer()`, or custom POST events go missing.
- **Workers limits:** the Cloudflare Free account plan permits a 100MB request body; response bodies have no enforced size limit. The old line said 10MB request and 50MB response. Cache object limits are separate. [Cloudflare, https://developers.cloudflare.com/workers/platform/limits#request-and-response-limits]
- **PostHog message limits from the proxy guide:** events are up to 1MB, recordings up to 64MB per message.
- **SSL mode Full or Full (strict).** Flexible gives a 301, then a CORS error.
- **DNS plus Page Rules (Enterprise):** CNAME `e` to `us-proxy-direct.i.posthog.com` (proxied, orange cloud), and Host Header Override rules in this order: `/static/*` and `/array/*` to `us-assets.i.posthog.com`, `/*` to `us-proxy-direct.i.posthog.com` (else 403).

## Vite dev proxy

The React Router 7 framework, TanStack Router and TanStack Start example apps proxy `/ingest` through the Vite dev server only; the React Router 7 framework example's `api_host` is still the env host, not `/ingest`. `env` comes from `loadEnv(mode, process.cwd(), '')`; the TanStack Start example adds `secure: false` to each rule.

```ts
server: {
  proxy: {
    '/ingest/static': {
      target: 'https://us-assets.i.posthog.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/ingest/, ''),
    },
    '/ingest/array': {
      target: 'https://us-assets.i.posthog.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/ingest/, ''),
    },
    '/ingest': {
      target: env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/ingest/, ''),
    },
  },
},
```

## Proxy troubleshooting

| Symptom | Cause or fix |
|---|---|
| 401 | `Host` header not set, region mismatch, or the body stripped |
| 403 (Cloudflare Page Rules) | Host Header Override rules missing or out of order |
| 405 | Method blocked: allow `GET` and `POST` |
| 502 | Test the upstream with `curl -I https://us.i.posthog.com/flags?v=2`; for SSL errors enable SNI |
| CORS errors | Use a relative `api_host: '/ingest'`; on Cloudflare, SSL mode Flexible |
| All users in one location | Forward the original client IP in `X-Forwarded-For` |
| Large recordings fail | Raise nginx `client_max_body_size` or Apache `LimitRequestBody` |
| Static script loads, no events | A middleware matcher catches the API paths (see [Next.js](#nextjs)) |
| Stale SDK config | The `/array/` rule is missing |

## Network allowlists

- **PostHog has no static ingestion IPs.** For outbound firewalls allow `*.posthog.com`, or `us.i.posthog.com` and `us-assets.i.posthog.com` on port 443 (`eu` for EU), or proxy through a host with a static IP.
- **Inbound (your WAF, for heatmaps and similar):** PostHog's public, stable IPs are EU `3.75.65.221`, `18.197.246.42`, `3.120.223.253` and US `44.205.89.55`, `52.4.194.122`, `44.208.188.173`. Heatmap screenshots come from Browserless with its own IPs (`https://docs.browserless.io/baas/troubleshooting/whitelisting-ips`). Allowlisting doesn't help apps on private addresses (`/docs/session-replay/troubleshooting.md#internal-and-intranet-applications`).

## Keys, hosting and agreements

- **The project token (`phc_`) may be public; a personal API key (`phx_`) must never be.**
- **PostHog Cloud EU** runs in Frankfurt, and user data never leaves EU jurisdiction. For GDPR, PostHog recommends Cloud EU; on Cloud US or self-hosted outside the EU with EU users, anonymize EU personal data with realtime transformations before storage. PostHog Cloud is the processor, you are the controller; breach notification is within 72 hours.
- **Moving from US to EU Cloud:** a support ticket with the "Data pipelines" topic, only for Boost, Scale or Enterprise customers.
- **DPA:** self-serve on any plan including free, at `app.posthog.com/legal` > "+ New" > DPA, signed through PandaDoc; only the in-app generated copy is valid. **BAA:** Boost, Scale or Enterprise.
- **IP capture:** EU Cloud organizations have IP data capture disabled by default for new projects. Set the organization default in Settings > Organization > General ("IP data capture default") and override per project in the project settings ("IP data capture configuration"; the docs place it under Settings > Project > General on one page and Settings > Project > Privacy on another). Changing the organization default doesn't affect existing projects.

## Consent

- **On Cloud, name PostHog as a tool in your consent text.** Cookies on a logged-out website need a cookie banner.
- **APIs:** `posthog.opt_out_capturing()`, `posthog.opt_in_capturing()`, `posthog.has_opted_out_capturing()`, `posthog.has_opted_in_capturing()`, `posthog.clear_opt_in_out_capturing()`. Opt-out blocks all capture, autocapture and replay included, and disables persistence (and SDK persistence entirely with `opt_out_persistence_by_default: true`). `opt_in_capturing({ captureEventName, captureProperties })` sends an `$opt_in` event unless `captureEventName: false`.
- **Start opted out** with `opt_out_capturing_by_default: true`.
- **Always load posthog-js; don't gate the snippet behind consent.** A CMP (OneTrust, Cookiebot, Osano, Usercentrics) that keeps the SDK from loading means it can't count visitors who ignore the banner or honor consent given later, and it is a frequent cause of sudden, large drops in event volume. Load it opted out and wire the CMP callback:

```javascript
posthog.init('<ph_project_token>', {
    api_host: 'https://us.i.posthog.com',
    defaults: '2026-05-30',
    opt_out_capturing_by_default: true,
})

// Wire these into your CMP's consent-change callback
function onConsentChange(hasConsented) {
    if (hasConsented) {
        posthog.opt_in_capturing()
    } else {
        posthog.opt_out_capturing()
    }
}
```

- **Two views on gating the SDK.** PostHog's rule is the one above. [c15t]'s `posthog` helper defaults to `loadMode: 'always'`, which matches it (loads `array.js` before a choice and calls `opt_out_capturing()` while `measurement` has no consent), but its examples use `loadMode: 'after-consent'` with `initOptions: { cookieless_mode: 'never' }`, which waits for measurement permission before requesting the SDK. Pick by whether the site may make any PostHog request before opt-in. Consent managers in general are [cookie-consent SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/cookie-consent/SKILL.md).
- **Guard your own capture calls** [c15t]: "The `posthog` global exists before the SDK loads, so its presence does not mean measurement is allowed."

```ts
export function trackSignupStarted(measurementAllowed: boolean) {
	if (!measurementAllowed) return;
	window.posthog?.capture('signup_started');
}
```

- **An SDK you already initialize, under c15t** [c15t]: init it with `opt_out_capturing_by_default: true` and `cookieless_mode: 'never'` and let a callback-only consent script call `opt_in_capturing()` / `opt_out_capturing()`; "`loadMode: 'disabled'` is not a substitute, because it syncs nothing." The script itself is in [cookie-consent SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/cookie-consent/SKILL.md).
- **Show the banner only while `posthog.get_explicit_consent_status()` returns `'pending'`** (it returns `'granted' | 'denied' | 'pending'` and ignores the default config).
- **`reset()` clears consent too.** With `opt_out_capturing_by_default`, calling `reset()` after `opt_in_capturing()` silently stops capturing: always `reset()` first, then opt in.
- **Consent across subdomains:** consent lives in `localStorage` (one origin) by default. Set `opt_out_capturing_persistence_type: "cookie"` on every subdomain, keep `cross_subdomain_cookie` (default on), the same project token, and the same `consent_persistence_name` if you set one.
- **Switch storage on consent without re-initializing:**

```javascript
const handleCookieConsent = (consent) => {
  posthog.set_config({ persistence: consent === 'yes' ? 'localStorage+cookie' : 'memory' });
  localStorage.setItem('cookie_consent', consent);
};
```

## Cookieless mode

- **Turn on "Cookieless server hash mode"** in Project Settings > Web analytics first; without it cookieless events are ignored.
- **`cookieless_mode: "always"`:** no PostHog data in cookies, `localStorage` or `sessionStorage`, so no cookie banner is needed for PostHog (other cookies may still need one). Users are counted with a privacy-preserving server-side hash. `identify()` isn't blocked, but avoid it (a persistent distinct ID is personal data); `person_profiles: 'never'` makes it a no-op. `alias()` is unsupported (alias events are dropped).
- **`cookieless_mode: "on_reject"`:** show a banner. Nothing is stored until `posthog.opt_in_capturing()`, and no events are captured until consent is given or denied; if denied, users are still counted through the server hash. It replaces wiring opt-in and opt-out yourself. Here `is_capturing()` is true in cookieless mode when the user opted out or defaulted to opt-out. [c15t]'s helper defaults to `initOptions: { cookieless_mode: 'on_reject', defaults: '2026-01-30' }`, so under it "PostHog keeps capturing without cookies after a refusal"; set `cookieless_mode: 'never'` "if a refusal must stop capture."
- **Collection and storage still need configuring separately;** don't send identifying data (such as an email person property) without consent.
- **In server hash mode the IP is stripped before transformations run,** so GeoIP enrichment and bot detection don't enrich events.

## Collection controls

- **Autocapture** collects only `name`, `id` and `class` from `<input>`; `ph-no-capture` excludes an element.
- **Replay, private by default:** mask everything and unmask only elements with `data-capture="true"`:

```javascript
{ maskAllInputs: true, maskTextSelector: "*", maskTextFn: (text, element) => element?.dataset['capture'] === 'true' ? text : '*'.repeat(text.trim().length) }
```

  More in [SESSION-REPLAY.md](SESSION-REPLAY.md).
- **`before_send`** (JavaScript Web SDK only) can remove properties such as `$current_url` before sending ([CONFIG-WEB.md](CONFIG-WEB.md#before_send)).
- **Everything passed to `identify()` is sent to PostHog's servers;** consider compliance before adding person properties.

## Storage, transformations and deletion

- **Realtime transformations before storage:** hash PII properties, disable GeoIP enrichment, drop events by filter, anonymize IPs, or write custom transformations in Hog. The "Discard client IP data" toggle doesn't store the IP, but GeoIP and bot detection still use it before it is discarded.
- **Retention can't be shortened to delete data.**
- **Delete a person through the API** (needs a personal API key): find them with `GET https://us.posthog.com/api/projects/:project_id/persons?email={EMAIL}`, delete with `DELETE https://app.posthog.com/api/projects/<project_id>/persons/<person_uuid>?delete_events=true&delete_recordings=true`, check `GET .../persons/deletion_status?status=pending`. Event deletion runs asynchronously in non-peak times (weekends on Cloud).
- **Access control** exists at organization, project and resource level.

## Prove it

- **Proxy end to end:** in DevTools every PostHog request goes to your domain: `/static/...` and `/array/...` (assets), `/flags`, `/e/` and `/s/` (API), all successful; `curl -I https://us.i.posthog.com/flags?v=2` succeeds from the proxy host.
- **No cookies upstream:** the proxy deletes `cookie` and `authorization` before forwarding.
- **Correct region:** a 401 after deploy is gone once the proxy targets the project's region.
- **Real client IPs:** events show varied locations, not the proxy's.
- **Consent:** before consent `posthog.has_opted_out_capturing()` is true and no `/e/` requests leave the page; after `opt_in_capturing()` an `$opt_in` event arrives; the SDK script loads on every page regardless of consent.
- **Cookieless:** with `cookieless_mode: "always"`, DevTools shows no PostHog cookie or storage entries, and the project's cookieless setting is on.
- **EU projects:** `api_host` (or the proxy upstream) is `eu.i.posthog.com` and `ui_host` is `https://eu.posthog.com`.
