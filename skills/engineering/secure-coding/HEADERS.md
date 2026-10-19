# Response security headers

The headers a site sends tell the browser how strictly to treat it: HTTPS only, which scripts may run, who may frame it, what to sniff, what to leak in `Referer`. This file sets them by value and checks them by value. The rules come from MDN's practical implementation guides ([index](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides)) and MDN's header reference; where an audit tool says otherwise, both are named. The tools: Audit Kit (`ak security`, MIT, [audit-kit]) and FreeScan's public security checks ([freescan], no licence, restated). A site audit that runs these checks is in [site-audit SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/site-audit/SKILL.md); consent-banner scripts under a CSP are in [cookie-consent BANNER-UI.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/cookie-consent/BANNER-UI.md).

## Order of work

MDN lists the guides "in the order that we recommend implementing the security features they describe", by security impact and ease ([index](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides)). The ones this file covers, in that order:

| Feature | MDN impact | MDN difficulty | Here |
|---|---|---|---|
| Load every resource over HTTPS | Maximum | Low | [HTTPS](#https-redirects-and-mixed-content) |
| Redirect HTTP to HTTPS | Maximum | Low | [HTTPS](#https-redirects-and-mixed-content) |
| HSTS | High | Low | [HSTS](#hsts) |
| Clickjacking (framing) | High | Low | [Framing](#framing) |
| Secure cookies | High | Medium | [Cookies](#cookies) |
| MIME type verification | Low | Low | [nosniff](#nosniff) |
| CSP | High | High | [CSP](#content-security-policy) |
| CORS | High | Low | [PARSERS.md](PARSERS.md) (the CORS bullet) |
| Referrer policy | Low | Low | [Referrer-Policy](#referrer-policy) |

## HTTPS, redirects and mixed content

- **Every resource over HTTPS.** "Verify that all resources are loaded over HTTPS prior to deployment." Active content (scripts) over HTTP is blocked; passive content (images) still degrades the page and "can allow active attackers to deface websites or phish users" ([TLS guide](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/TLS)). FreeScan adds what audits miss: CSS, web app manifests and requests created by JavaScript are subresources too, while an `http://` URL printed as text is not a request [freescan].
- **Port 80 redirects to the same resource on HTTPS,** on the same host: "sites should avoid redirections from HTTP on one host to HTTPS on a different host, as this prevents `Strict-Transport-Security` from being set for the first host". Redirect `http://example.com/` to `https://example.com/` first, then to the other host. "APIs or websites not intended for public access should entirely disable the use of HTTP." ([TLS guide](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/TLS))

```nginx
server {
  listen 80;
  return 301 https://$host$request_uri;
}
```

- **The final URL is HTTPS, with no loop, and the certificate covers every public hostname;** canonicals and internal links use HTTPS [freescan].
- **Form actions stay HTTPS through every redirect.** A form with no `action` inherits the page's transport; never build an action URL from a client-supplied value [freescan].

## HSTS

[MDN Strict-Transport-Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security), [TLS guide](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/TLS):

```http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

- `max-age` "of at least six months (`15768000`). Longer periods, such as two years (`63072000`), are recommended. Once this value is set, the site must continue to support HTTPS until the expiry time is reached."
- `includeSubDomains` "if possible": "Careful testing is needed when setting this directive because it could disable sites on subdomains that don't yet have HTTPS enabled." FreeScan's version of the same rule: turn HSTS on only after HTTPS works across the whole host scope it will cover [freescan].
- `preload` needs `max-age` of at least `31536000` (one year) and `includeSubDomains`. The preload list "is not part of the HSTS specification and should not be treated as official".
- **Send it over HTTPS only;** browsers ignore it over HTTP. The HTTP-to-HTTPS redirect itself "must not include the `Strict-Transport-Security` header".
- **Each subdomain sends its own header** even when the parent uses `includeSubDomains`, "because a browser may contact a subdomain host before the superdomain" (`www.example.com` should send it too).
- To turn it off, send `max-age=0` over HTTPS; "you cannot disable HSTS over insecure HTTP."

## Content Security Policy

[MDN CSP guide](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/CSP):

- **Prefer a strict CSP:** nonce- or hash-based `script-src`, which also blocks inline event handlers and `eval()`, plus `object-src 'none'` and `base-uri 'none'`. "Strict CSPs are preferred over location-based policies, also called allowlist policies", which "often end up allowing unsafe domains". Use nonces when you generate the page per request, hashes for static content; add `strict-dynamic` so scripts your trusted script loads also run.
- **Test with `Content-Security-Policy-Report-Only` first,** with `report-to` (preferred) and `report-uri` (both, since `report-to` "does not yet have full cross-browser support").
- **Avoid unsafe sources:** `unsafe-inline`, `data:` in `script-src`, `object-src` or `default-src`, "overly broad sources or form submission targets". If a strict policy won't work, "an allowlist-based CSP is much better than none".
- **A header beats a `<meta>`;** if you must use `<meta http-equiv="Content-Security-Policy">`, it "should be the first `<meta>` element" in `<head>`. `frame-ancestors` is "not supported in the `<meta>` element" ([frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors)).
- CSP is "one part of a complete strategy" against XSS; output encoding ([CATALOG.md](CATALOG.md#html-output-stored-xss)) still applies.
- **Roll it out like a migration** [freescan]: inventory the origins the site really loads from (scripts, styles, fonts, images, frames, `connect-src` endpoints) before writing the policy, release restrictive policies with monitoring and a rollback path, and check the browser console for violations on the final response after redirects.

FreeScan's passing example, `Content-Security-Policy: default-src 'self'; frame-ancestors 'none'`, is an allowlist policy; MDN ranks a strict nonce or hash policy above it. Its `frame-ancestors` part matters on its own: `frame-ancestors` "does not fall back to the `default-src` setting. A policy that declares `default-src 'none'` still allows the resource to be embedded by anyone" ([frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors)).

## Framing

Pick one of these unless the page is meant to be embedded:

```http
Content-Security-Policy: frame-ancestors 'none';
X-Frame-Options: DENY
```

- `frame-ancestors 'none'` "is similar to `X-Frame-Options: deny` (which is also supported in older browsers)". For anything beyond deny or same-origin, MDN points to `frame-ancestors`: "For more comprehensive options than offered by this header, see the `frame-ancestors` directive" ([X-Frame-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Frame-Options)).
- `X-Frame-Options: ALLOW-FROM` "is an obsolete directive"; browsers that see it "will ignore the header completely". `X-Frame-Options` in a `<meta>` "has no effect".
- With nested frames, `frame-ancestors` checks every ancestor, so allow all of them in the leaf frame's policy.

Audit Kit deducts 10 points for a missing `X-Frame-Options` even when `frame-ancestors` is set [audit-kit]. MDN calls `frame-ancestors` the more comprehensive option, and notes that `X-Frame-Options` "is also supported in older browsers" ([frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors)).

## nosniff

```http
X-Content-Type-Options: nosniff
```

"All sites must set the `X-Content-Type-Options` header with a value of `nosniff`, and set appropriate MIME types for the files they serve" ([MIME guide](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/MIME_types)). It blocks a `script` or `style` response whose type doesn't match, and stops a `text/plain` upload from being rendered as HTML ([X-Content-Type-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Content-Type-Options)). It pairs with the content-type rules in [CATALOG.md](CATALOG.md#content-types).

## Referrer-Policy

MDN lists the useful values from strictest down, "Choose the strictest one that still allows your site to function properly": `no-referrer`, `same-origin`, `strict-origin`, `strict-origin-when-cross-origin` ("This is the default value") ([referrer guide](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Referrer_policy)). The header matters when URLs carry internal paths or parameters with sensitive information. Audit Kit deducts 5 points when the header is absent [audit-kit]; the browser default is already `strict-origin-when-cross-origin`, and MDN rates the feature's impact Low ([index](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides)).

## Cookies

MDN's rules ([cookies guide](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Cookies)):

- **`Secure` always.** **`HttpOnly`** "on all cookies that don't require access from JavaScript"; session identifiers in particular "should not have JavaScript access".
- **`SameSite=Strict` or `Lax`;** a partial CSRF defence, so state-changing requests still need CSRF protection ([AUTH.md](AUTH.md)).
- **Name prefixes:** `__Host-` for a cookie used only on one host with `Path=/`, `__Secure-` for the rest.
- **Expire early,** prefer `Max-Age` ("less error-prone, and takes precedence when both are set"); the narrowest `Domain` and `Path`.

```http
Set-Cookie: __Host-session=...; Max-Age=2592000; Path=/; Secure; HttpOnly; SameSite=Lax
```

Classify each cookie by purpose before flagging it: `HttpOnly` belongs on every cookie client code doesn't need, and a CDN may set a separate, harmless cookie [freescan]. Audit Kit's rule is blunter, "Add Secure, HttpOnly, and SameSite to every cookie" [audit-kit]. The repo keeps the purpose-based rule, because Supabase's browser client must read its session cookie: "With client JavaScript the browser must read and refresh the session (it needs the refresh token), so HttpOnly is not necessary" ([supabase AUTH-SESSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/supabase/AUTH-SESSIONS.md)). A blanket `HttpOnly` check flags that cookie.

## Headers to drop or narrow

- **`X-Powered-By`** is "a non-standard header for identifying the application or framework that generated the response" ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Powered-By)); FreeScan lists it as failing evidence [freescan]. Turn it off in the framework (Express sends `X-Powered-By: express`).
- **`Access-Control-Allow-Origin: *`** lets "requesting code from any origin" read the response and can't be combined with credentials ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Allow-Origin)); FreeScan lists it as failing evidence on a page [freescan]. It is right for a truly public resource; anything else answers with an allowlisted origin ([PARSERS.md](PARSERS.md), the CORS bullet).

## Exposed files

A deployed `.env` or `.git` directory hands out secrets and source [freescan]:

- **Probe, on a site you own or are authorized to test:** `GET /.env` and `GET /.git/config` should return 404 (or a WAF block, which is also a safe result). A custom error page served with status 200 can look like exposure, so read the body before calling it one.
- **Fix:** remove the files from the web root, block dotfiles and repository paths at the edge ([deployment SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/deployment/SKILL.md#moving-to-a-new-host-without-downtime) ports such rules on a host move), and **rotate every credential that may have been retrievable**; deleting the file does not un-leak it ([SECRETS-AND-NETWORK.md](SECRETS-AND-NETWORK.md)).
- Probing paths on someone else's site is a different act: see the probe-by-ownership rule in [web-scraping CRAWLING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-automation/web-scraping/CRAWLING.md#guardrails).

## Checking headers

- **Check values, not presence.** Audit Kit tests each header with `headers.has(...)`, so `max-age=0` HSTS or a CSP with `unsafe-inline` passes, and it matches cookie flags by substring, so `value.includes("secure")` is satisfied by a cookie named `insecure_x` [audit-kit]. Parse the header and compare the directives you require.
- **Read the final response after redirects** [freescan], from outside the admin session, on the production hostname.
- MDN's guides are written against the [HTTP Observatory](https://developer.mozilla.org/en-US/observatory), which grades a site and links each finding to its guide ([index](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides)).

## Prove it

Fetch the production home page and one deep page with redirects followed and print the final URL and headers: the final URL is HTTPS and `http://` reached it in one same-host 301; `Strict-Transport-Security` has `max-age` of at least `15768000` and is absent from the HTTP redirect; `X-Content-Type-Options: nosniff`; framing is restricted by `frame-ancestors` or `X-Frame-Options`; the CSP has no `unsafe-inline` and ran in report-only mode before it was enforced, with no console violations left; there is no `X-Powered-By`; each `Set-Cookie` is `Secure` and `SameSite`, and `HttpOnly` unless client code reads it, with the reason written down; `/.env` and `/.git/config` return 404 or a block.
