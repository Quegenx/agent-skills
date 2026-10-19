# Conversion tracking on a website

How to install each ad platform's tag on a website, define conversion events, deduplicate browser and server events, and validate it all before spending. From [coreyhaines31/marketingskills, ads, conversion-tracking.md] (MIT); stale lines are corrected where marked. App SDKs, the Conversions API for app events and SKAN are in [app-growth META-ADS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/META-ADS.md#measurement-sdk-conversions-api-mmp) and [app-growth ANALYTICS-AND-ATTRIBUTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/ANALYTICS-AND-ATTRIBUTION.md). Consent before any tag fires (Google's consent mode included) is in [cookie-consent](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/cookie-consent/SKILL.md); GA4 itself in [google-analytics](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/google-analytics/SKILL.md).

**Contents:** [Why first](#why-first) · [The tags](#the-tags) · [Google Ads](#google-ads) · [Meta](#meta) · [LinkedIn](#linkedin) · [TikTok](#tiktok) · [Validation](#validation) · [Common mistakes](#common-mistakes) · [When to add server-side](#when-to-add-server-side) · [Prove it](#prove-it)

## Why first

Without conversion tracking, platforms can't optimize for your goal, ROAS and CPA are guesses, retargeting audiences can't build, and budget goes to impressions that don't convert. Get it right before spending a dollar. Then make sure the conversions the bidder learns from are the right ones ([GOOGLE-ADS-AUDIT.md](GOOGLE-ADS-AUDIT.md#conversion-signal-audit)).

## The tags

| Platform | Tag | Server-side | Key events |
|---|---|---|---|
| Google Ads | Google tag (gtag.js) | Enhanced Conversions | purchase, sign_up, generate_lead |
| Meta | Meta Pixel | Conversions API | Purchase, Lead, ViewContent, AddToCart |
| LinkedIn | Insight Tag | Conversions API | conversion (URL or event-based) |
| TikTok | TikTok Pixel | Events API | Purchase, ViewContent, AddToCart, CompleteRegistration |
| X | X Pixel (the source says "Twitter Pixel") | none listed | Purchase, SignUp, Download |

## Google Ads

Google tag on every page, in `<head>`; replace `AW-XXXXXXXXX` with your Conversion ID from Google Ads > Tools > Conversions:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-XXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'AW-XXXXXXXXX');
</script>
```

Where consent is required, the `gtag('consent', 'default', ...)` call with all four parameters (and `url_passthrough` if the banner loads late) goes before this `config`: see [google-analytics CONSENT-MODE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/google-analytics/CONSENT-MODE.md#the-default-on-every-page) rather than restating it here.

Conversion actions (Goals > Conversions > New conversion action):

| Conversion | Category | Value | Count |
|---|---|---|---|
| Purchase | Purchase | Dynamic (order value) | Every |
| Sign up / Lead | Sign-up | Fixed (estimated value) | One |
| Demo request | Lead | Fixed (estimated value) | One |
| Free trial start | Sign-up | Fixed (estimated value) | One |

```javascript
// Purchase
gtag('event', 'conversion', {
  'send_to': 'AW-XXXXXXXXX/CONVERSION_LABEL',
  'value': 99.00,
  'currency': 'USD',
  'transaction_id': 'ORDER-123'
});

// Lead / sign up
gtag('event', 'conversion', {
  'send_to': 'AW-XXXXXXXXX/CONVERSION_LABEL',
  'value': 50.00,
  'currency': 'USD'
});
```

**Enhanced Conversions** send hashed first-party data (email, phone) to improve attribution; turn them on in Goals > Settings > Enhanced conversions:

```javascript
gtag('set', 'user_data', {
  'email': 'user@example.com',      // auto-hashed by gtag
  'phone_number': '+11234567890'
});
```

**Through Google Tag Manager instead:** install the container on all pages, create Google Ads conversion tags, trigger them on the conversion events (form submits, purchases), pass dynamic values (amount, transaction ID) through the data layer, and test in Preview mode before publishing.

**Offline conversions:** import CRM outcomes against the GCLID ([GOOGLE-SEARCH.md](GOOGLE-SEARCH.md#offline-conversions)).

## Meta

Meta Pixel on every page, in `<head>`; `YOUR_PIXEL_ID` from Events Manager:

```html
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'YOUR_PIXEL_ID');
  fbq('track', 'PageView');
</script>
```

```javascript
fbq('track', 'ViewContent', { content_name: 'Pro Plan', content_category: 'Pricing', value: 29.00, currency: 'USD' });
fbq('track', 'Lead', { content_name: 'Demo Request', value: 50.00, currency: 'USD' });
fbq('track', 'Purchase', { value: 99.00, currency: 'USD', content_type: 'product', contents: [{ id: 'pro-plan', quantity: 1 }] });
fbq('track', 'AddToCart', { content_ids: ['SKU-123'], content_type: 'product', value: 49.00, currency: 'USD' });
```

**Conversions API** (server-side, alongside the pixel): a direct integration from your server, a partner integration (Shopify, WooCommerce, Segment and others), or Meta's managed Conversions API Gateway. Send the same events from the pixel and the server with a shared `event_id` so Meta keeps one, the rule app-growth also states for apps ([app-growth META-ADS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/META-ADS.md#conversions-api-for-app-events)).

**Aggregated Event Measurement.** The source says it is "Required for iOS 14+ tracking" and to verify your domain and "Configure and prioritize your top 8 events ... Purchase should typically be #1, Lead #2". Jon Loomer (jonloomer.com) reports that in 2025 Meta stopped requiring web event prioritization and domain verification for AEM and removed the AEM tab; no Meta help page confirmed it. Check Events Manager before configuring either.

## LinkedIn

Insight Tag on every page, before `</body>`:

```html
<script type="text/javascript">
  _linkedin_partner_id = "YOUR_PARTNER_ID";
  window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
  window._linkedin_data_partner_ids.push(_linkedin_partner_id);
  (function(l) {
    if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
    window.lintrk.q=[]}
    var s = document.getElementsByTagName("script")[0];
    var b = document.createElement("script");
    b.type = "text/javascript";b.async = true;
    b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
    s.parentNode.insertBefore(b, s);})(window.lintrk);
</script>
```

- **URL-based conversions** fire on a URL such as `/thank-you` (Campaign Manager > Analyze > Conversion Tracking > Create Conversion).
- **Event-based conversions** fire in code: `window.lintrk('track', { conversion_id: YOUR_CONVERSION_ID });`
- **LinkedIn Conversions API** for server-side, through partners (Segment, Tealium) or direct calls; the source says it deduplicates with the Insight Tag when configured correctly.
- Website retargeting audiences only build once the tag is installed and the audience exists ([LINKEDIN-ADS.md](LINKEDIN-ADS.md#retargeting-starts-when-the-audience-exists)).

## TikTok

Pixel on every page, in `<head>`:

```html
<script>
  !function (w, d, t) {
    w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
    ttq.methods=["page","track","identify","instances","debug","on","off",
    "once","ready","alias","group","enableCookie","disableCookie","holdConsent",
    "revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e)
    {t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
    for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
    ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;
    n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
    ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",
    o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,
    ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},
    ttq._o[e]=n||{};var s=document.createElement("script");
    s.type="text/javascript",s.async=!0,s.src=r+"?sdkid="+e+"&lib="+t;
    var a=document.getElementsByTagName("script")[0];
    a.parentNode.insertBefore(s,a)};
    ttq.load('YOUR_PIXEL_ID');
    ttq.page();
  }(window, document, 'ttq');
</script>
```

```javascript
ttq.track('ViewContent', { content_id: 'pro-plan', content_type: 'product', content_name: 'Pro Plan', value: 29.00, currency: 'USD' });
ttq.track('CompleteRegistration', { content_name: 'Free Trial' });
ttq.track('Purchase', { content_id: 'pro-plan', content_type: 'product', value: 99.00, currency: 'USD', quantity: 1 });
ttq.track('AddToCart', { content_id: 'SKU-123', content_type: 'product', value: 49.00, currency: 'USD' });

// Advanced Matching: hashed user data
ttq.identify({ email: 'user@example.com', phone_number: '+11234567890' });
```

The **Events API** is TikTok's server-side channel; deduplicate with the pixel through `event_id`. App events for TikTok are in [app-growth TIKTOK-ADS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/TIKTOK-ADS.md).

## Validation

**In the browser:** the tag fires on every page (a browser extension shows it); conversion events fire after the confirmed action, not on the button click; parameters carry the right currency, amount and content IDs; no duplicate events on one action; events fire on desktop and mobile, including in-app browsers.

**In the platform:** events appear in its event manager or diagnostics; test conversions show the right values; server events deduplicate with browser events. The source's "Event match quality is acceptable (Meta: score > 6)" is a practitioner bar; Meta publishes no threshold that was found.

| Platform | Debugging tool |
|---|---|
| Google | Google Tag Assistant, the DevTools Network tab |
| Meta | Meta Pixel Helper (Chrome extension), Events Manager Test Events |
| LinkedIn | Insight Tag validation in Campaign Manager |
| TikTok | TikTok Pixel Helper (Chrome extension), Events Manager |
| All | GTM Preview mode, if using Tag Manager |

## Common mistakes

- **Firing purchase on the button click** instead of confirmed payment: fire on the success page or after server confirmation.
- **No deduplication** between pixel and server: without a shared `event_id` you double-count.
- **Not testing on mobile:** many tags break in mobile browsers and in-app webviews.
- **Hardcoded test values** left in production.
- **Internal traffic not excluded.**
- **Tags without consent management:** the source notes GDPR and CCPA require consent before tracking pixels fire where they apply ([cookie-consent](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/cookie-consent/SKILL.md)).
- **A tag installed with no conversion actions defined:** it collects data but nothing optimizes.

## When to add server-side

The source says browser-only tracking is increasingly unreliable because of App Tracking Transparency, third-party cookie restrictions and ad blockers (its "30%+ of tech audiences" is unsourced). It recommends the Conversions API or Events API when running Meta or TikTok ads, for tech-savvy audiences, when purchase and revenue attribution must be accurate, or above $5K a month on any platform; and calls it optional for Google-only accounts (Enhanced Conversions cover most gaps), low-spend tests, and LinkedIn-only B2B. Those cut-offs are practitioner.

## Prove it

A test conversion on each platform shows the right value and currency in its event manager, fires once per action on desktop and on a phone's in-app browser, server and browser events share an `event_id` and count once, no tag fires before consent where consent is required, and the platform's conversion count reconciles with the CRM or orders for the same window.
