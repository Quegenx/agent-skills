# Web SDK setup

Web push runs through two files on your origin: the page SDK (`OneSignalSDK.page.js`, v16) and the service worker `OneSignalSDKWorker.js`, which receives and shows notifications even when no tab is open. Most failures come from three things: the site is not HTTPS on the exact origin configured as the Site URL, the service worker is not served from that origin at the path and scope the SDK expects, or the dashboard (Typical Site) and code (Custom Code) configurations are mixed. Prompting is in [PERMISSIONS.md](PERMISSIONS.md); users, login and tags in [USER-MODEL.md](USER-MODEL.md); web push troubleshooting and the v15 to v16 method map in [MIGRATION-AND-TROUBLESHOOTING.md](MIGRATION-AND-TROUBLESHOOTING.md).

**Contents:** [Requirements](#requirements) · [Dashboard setup](#dashboard-setup) · [Typical Site or Custom Code](#typical-site-or-custom-code) · [The page SDK](#the-page-sdk) · [The service worker](#the-service-worker) · [React and Next.js with react-onesignal](#react-and-nextjs-with-react-onesignal) · [Init options](#init-options) · [Notifications API](#notifications-api) · [Privacy consent](#privacy-consent) · [iOS web push (Home Screen web app)](#ios-web-push-home-screen-web-app) · [Local development](#local-development) · [Testing a send](#testing-a-send) · [Prove it](#prove-it)

## Requirements

- **HTTPS.** Web push does not work on HTTP (only `localhost` and `127.0.0.1` are exempt) or in incognito or private modes.
- **Server access** to upload the service worker file to your origin.
- **A single origin.** Same-origin policy: several domains or subdomains need one OneSignal app per origin, or redirect traffic to one origin for subscribing.
- **Browsers:** Chrome, Firefox, Edge, Safari and others. Social media in-app webviews (Instagram, TikTok, Facebook) do not support web push.
- **Safari:** macOS 13+ and iOS 16.4+ use VAPID, handled automatically by OneSignal, no certificate (Apple offers no .p8 for Safari web push). A Safari Web Push `.p12` is only for the legacy Website Push ID path (Safari macOS 12 and earlier, existing legacy subscribers), uploaded in the dashboard, not in `init` (`safari_web_id` is that legacy option).
- **Android web push** needs no FCM Service Account.

## Dashboard setup

- **Settings > Push & In-App > Web.** Integration types: **Typical Site (recommended)**, WordPress, **Custom Code**.
- **Site Name:** default notification title.
- **Site URL:** the exact origin, e.g. `https://yourdomain.com`; avoid `www.` if the site isn't served that way.
- **Auto Resubscribe:** resubscribes users who clear browser data when they return, with no new prompt.
- **Default Icon URL:** square `256×256` PNG, JPG or non-animated GIF; unset shows a generic bell.
- **Welcome notification:** dashboard for Typical Site; `welcomeNotification` in `OneSignal.init()` for Custom Code.
- **Click behavior** (only applies when a same-origin tab is open): **Exact Navigate** (default), Origin Navigate, Exact Focus, Origin Focus. No launch URL opens the homepage. Append `?_osp=do_not_open` to a URL to dismiss without opening a page.
- **Persistence:** Chrome and Edge desktop only; unset means on. Custom Code uses `persistNotification` in `init` (the dashboard toggle does not apply; `persistNotification: false` turns it off). Applies to subscribers who visit after the change.
- **Web Push Webhooks** are separate from Event Streams and cannot be used interchangeably (Event Streams: [SERVER-AND-SUPABASE.md](SERVER-AND-SUPABASE.md#event-streams)).

## Typical Site or Custom Code

- **Typical Site** keeps prompts and settings in the dashboard. **Init options only work with Custom Code**; otherwise they are configured in the dashboard.
- **Custom Code** gives full control in `OneSignal.init()`. Use it only for advanced configuration or programmatic control; "The Custom Code setup is the recommended approach for SPAs built with frameworks like React, Angular, or Vue."
- **Mixing the two does not work.** Typical Site sets a non-root worker path in the dashboard and must not set `serviceWorkerPath` in code; Custom Code must not use the dashboard path fields and passes `serviceWorkerPath` and `serviceWorkerParam` in `init`.

## The page SDK

Put this in `<head>`; call `init()` once on each page:

```html
<script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
<script>
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  OneSignalDeferred.push(async function(OneSignal) {
    await OneSignal.init({
      appId: "YOUR_ONESIGNAL_APP_ID",
    });
  });
</script>
```

- **Wrap every call in `OneSignalDeferred.push(async function (OneSignal) { ... })`** (a non-async function when nothing is awaited). The SDK loads with `defer`; `window.OneSignalDeferred = window.OneSignalDeferred || [];` creates the queue, and when the SDK loads it drains the queue and redefines `.push()` so later pushes run immediately.
- **To delay init,** use the privacy methods below.
- **Debug logging:** `OneSignal.Debug.setLogLevel("trace")`; levels `"trace"`, `"debug"`, `"info"`, `"warn"`, `"error"`.

## The service worker

- **Content** (single line):

```javascript
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
```

- **Required for web push;** it receives and displays notifications even when the user is not on the page. The WordPress plugin and Shopify deploy it for you.
- **Default location:** the SDK looks for `OneSignalSDKWorker.js` at the site root (`https://yourdomain.com/OneSignalSDKWorker.js`). The file may be renamed (e.g. `ossw.js`).
- **Recommended location:** a dedicated subdirectory that never serves pages, such as `/push/onesignal/`. It avoids conflicts with PWA, AMP or caching workers and keeps the path stable. With a PWA, use a subdirectory.
- **Choose a permanent path.** Changing it later requires a migration (below).
- **If it isn't at root and the path isn't configured,** the SDK fetches `/OneSignalSDKWorker.js` and registration fails.
- **Serving rules:** publicly accessible over HTTPS with no authentication or login; `Content-Type: application/javascript; charset=utf-8` (not `text/html`); same origin (it **cannot be hosted on a CDN, a subdomain, or another origin behind a redirect**).
- **Verify** by opening the file's URL: it shows the `importScripts` line. A 404, blank page or login prompt is wrong.
- **Typical Site, non-root:** Advanced Push Settings > **Customize service worker paths and filenames**: Path `/push/onesignal/`, filename `OneSignalSDKWorker.js`, registration scope `/push/onesignal/`.
- **Custom Code, non-root** ("the only way Custom Code tells the SDK a non-root location"):

```html
<script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
<script>
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function(OneSignal) {
    await OneSignal.init({
      appId: "YOUR_ONESIGNAL_APP_ID",
      serviceWorkerPath: "push/onesignal/OneSignalSDKWorker.js",
      serviceWorkerParam: { scope: "/push/onesignal/" },
    });
  });
</script>
```

- **`serviceWorkerPath`** is relative to the site root with **no leading slash**. **`serviceWorkerParam.scope`** must be at or below the directory holding the file (use the same directory), must differ from other workers' scopes, and should never serve user-facing pages.
- **One active worker per scope.** Separate files and scopes are simpler; combine only if required, by adding to the existing worker:

```javascript
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
importScripts("https://yoursite.com/your-other-service-worker.js");
```

- **The browser fetches the registered worker URL** (cached up to 24 hours) each time a push arrives.
- **Moving the worker** (root-scope conflict with a PWA, AMP or caching worker; security policy):
  - Option 1, change the scope only (recommended; the file stays at its URL). If the file is not at the domain root today, keep hosting it at its current URL with the `Service-Worker-Allowed` header for at least one year.
  - Splitting a merged worker: add `// KEEP until YYYY-MM-DD: Required for push delivery to subscribers who have not revisited.` above the import (a date at least one year ahead), create the dedicated worker in a subdirectory, update the config, wait at least one year, delete inactive users, then remove the old import.
  - Option 2, change filename or location: keep the original file at its old URL for at least one year. Removing it causes a 404 on worker update and those subscribers stop receiving.
- **Clearing browser data removes the push subscription;** Auto Resubscribe resubscribes on the next visit.

## React and Next.js with react-onesignal

- **Package:** `react-onesignal` (`npm install --save react-onesignal` or `yarn add react-onesignal`). It works in "practically any JS front-end codebase (not limited to React)". Version 3.0 has breaking changes (it is the user model; see its Migration Guide). npm latest observed: `3.5.6` (2026-06-25).
- **Prerequisite:** a configured OneSignal app with the web platform set up.
- **Init in the root component, client side only** (Next.js App Router example):

```javascript
"use client";

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';

export default function Page() {
  useEffect(() => {
    // Ensure this code runs only on the client side
    if (typeof window !== 'undefined') {
      OneSignal.init({
        appId: 'YOUR_APP_ID',
        // You can add other initialization options here
        notifyButton: {
          enable: true,
        }
      });
    }
  }, []);

  return (
    <div>
      <h1>Hello, world!</h1>
      {/* Rest of your page content */}
    </div>
  );
}
```

- **`init` returns a promise** that resolves when OneSignal has loaded:

```js
const [initialized, setInitialized] = useState(false);
OneSignal.init({ appId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' }).then(() => {
  setInitialized(true);
  OneSignal.Slidedown.promptPush();
  // do other stuff
});
```

- **Service worker:** download https://github.com/OneSignal/OneSignal-Website-SDK/files/11480764/OneSignalSDK-v16-ServiceWorker.zip and put `OneSignalSDKWorker.js` in `public` (served at the root, the default `/OneSignalSDKWorker.js`) or a custom folder (recommended, `/onesignal/OneSignalSDKWorker.js`). In a subdirectory or next to another worker, set `serviceWorkerPath` (e.g. `"onesignal/OneSignalSDKWorker.js"`) and `serviceWorkerParam` (recommended custom sub-path, e.g. `"/onesignal/"`; README example `{ scope: "/js/push/onesignal/" }`). Visit the URL: it must return valid JavaScript.
- **Double init in development:** `<React.StrictMode>` runs effects twice; the error `window.OneSignal already defined as 'object'!` means init ran twice. The docs say to remove `<React.StrictMode>` during development; strict mode does not affect production builds.
- **Full example:** https://github.com/OneSignal/react-onesignal/tree/main/example
- **TypeScript surface:**

```ts
interface IOneSignalOneSignal {
  Slidedown: IOneSignalSlidedown;
  Notifications: IOneSignalNotifications;
  Session: IOneSignalSession;
  User: IOneSignalUser;
  Debug: IOneSignalDebug;
  login(externalId: string, jwtToken?: string): Promise<void>;
  logout(): Promise<void>;
  init(options: IInitObject): Promise<void>;
  setConsentGiven(consent: boolean): Promise<void>;
  setConsentRequired(requiresConsent: boolean): Promise<void>;
}
```

- **Sync and async:** "All user functions are synchronous" (`addAlias`, `addAliases`, `removeAlias`, `removeAliases`, `addEmail`, `removeEmail`, `addSms`, `removeSms`, `addTag`, `addTags`, `removeTag`, `removeTags`). Async: `Notifications.setDefaultUrl`, `setDefaultTitle`, `requestPermission`, every `Slidedown.prompt*`, `PushSubscription.optIn`, `optOut`. Sync: `Notifications.isPushSupported()`.
- **Events:** Notifications `'click'` (NotificationClickEvent), `'foregroundWillDisplay'`, `'dismiss'`, `'permissionChange'` (boolean), `'permissionPromptDisplay'`; Slidedown `'slidedownShown'` (boolean); PushSubscription `'change'`.
- **Not supported (v3 guide):** HTTP environments, AMP.

## Init options

Custom Code only:

| Option | Meaning |
|---|---|
| `appId` | Required |
| `requiresUserPrivacyConsent` | Delays init until `setConsentGiven()` |
| `promptOptions` | Slidedown, category, email, SMS prompts and custom link ([PERMISSIONS.md](PERMISSIONS.md)) |
| `notifyButton` | Subscription Bell ([PERMISSIONS.md](PERMISSIONS.md)) |
| `welcomeNotification` | `disable`, `message` (default `'Thanks for subscribing!'`), `title` (default site title), `url` |
| `persistNotification` | Chrome and Edge desktop; unset = `true` |
| `webhooks` | Web Push Webhooks |
| `autoResubscribe` | **Recommended**; overrides the dashboard setting when set in code |
| `notificationClickHandlerMatch` | `"exact"` (default) or `"origin"` |
| `notificationClickHandlerAction` | `"navigate"` (default) or `"focus"` (only with `"origin"` match) |
| `serviceWorkerParam` | `{ scope: "/myPath/myCustomScope/" }` |
| `serviceWorkerPath` | `"myPath/OneSignalSDKWorker.js"` |
| `allowLocalhostAsSecureOrigin` | Local testing on HTTP localhost |
| `safari_web_id` | Legacy Safari only; not needed for macOS 13+ or iOS 16.4+ |

`react-onesignal` also lists `autoRegister`, `path`, `serviceWorkerUpdaterPath`, `subdomainName` and `[key: string]: any`.

## Notifications API

- **`OneSignal.Notifications.permission`** is the browser permission only (not `optOut`, subscription or token). `permissionNative` is `"default"`, `"granted"` or `"denied"`.
- **Events** via `OneSignal.Notifications.addEventListener`: `permissionChange`, `permissionPromptDisplay`, `click`, `foregroundWillDisplay` (fires on all open tabs with OneSignal), `dismiss` (not fired on click). `removeEventListener` needs the same name and the same handler reference.
- **`Notifications.setDefaultUrl(url)`** (default: site root; a payload URL overrides; Safari differs) and **`setDefaultTitle(title)`** (default: title of the last visited page).
- **`User.PushSubscription`:** `id`, `token`, `optedIn`, `optIn()`, `optOut()`. `optOut()` marks it unsubscribed even with a valid token; `optIn()` subscribes if the token is valid, else tries to show the permission prompt. Uses: no push to logged-out users, a preference center.
- **Outcomes:** `OneSignal.Session.sendOutcome('name', 19.84)`, `sendUniqueOutcome('name')` (once per user).
- **Listeners to wire:** click, foregroundWillDisplay, user state change, permissionChange, push subscription change ([USER-MODEL.md](USER-MODEL.md#observers)).

## Privacy consent

- **`setConsentRequired(true)` must run before `init()`** (same as `requiresUserPrivacyConsent: true`). Until `setConsentGiven(true)`, no data is sent and no Subscription is created. Setting consent back to `false` stops updates for that Subscription; data already stored remains (delete it with the Delete user or Delete subscription APIs).

## iOS web push (Home Screen web app)

- **iOS and iPadOS 16.4+ prompt only inside a Home Screen web app,** after the visitor opens the Home Screen icon and taps a subscribe button. A tab in Safari, Chrome, Edge or Firefox cannot request permission. A Home Screen bookmark opens in the browser and cannot either.
- **Requirements:** iOS/iPadOS 16.4+, HTTPS, the Web SDK and service worker on that origin, a `manifest.json`, the site added to the Home Screen and opened from the icon, a subscribe button tapped inside the web app. Delivery is via APNs using standard Web Push (VAPID), handled by OneSignal. **No Apple Developer account or APNs key is needed.**
- **Web app vs bookmark:** on iOS 16.4 to 18 it opens as a web app only when the manifest `display` is `standalone` or `fullscreen` (or legacy `<meta name="apple-mobile-web-app-capable" content="yes">`); `browser` or `minimal-ui` save a bookmark; `display_override` does not change the mode there. On iOS 26+/iPadOS 26+ every site opens as a web app by default through the **Open as Web App** switch (turning it off saves a bookmark). iOS has no install button and no `beforeinstallprompt`.

```json
{
  "name": "Your App Name",
  "short_name": "Your App",
  "id": "/",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#E54B4D",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    }
  ]
}
```

- **Manifest rules:** PNG icons 192×192 and 512×512 with `purpose` `any` or omitted; root-relative paths; valid JSON (no comments or trailing commas); served with `Content-Type: application/manifest+json`, HTTP 200, no redirect to another host (`www` vs non-`www` is a different origin); one `<link rel="manifest">` (browsers use the first); add `<link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" />` (180×180 PNG). Check in Chrome DevTools **Application > Manifest**.
- **Keep `id` stable.** A new `id` is a different Home Screen web app with a new permission prompt and a new push subscription.
- **Keep OneSignal's worker as the `push` handler.** The same `OneSignalSDKWorker.js` serves iOS. **Safari revokes notification permission if a push arrives and the service worker does not display a notification.** Declarative Web Push (iOS 18.4) cannot replace the OneSignal worker.
- **Prompt from a tap** (not on page load or a timer): call `OneSignal.Slidedown.promptPush()` or `OneSignal.Notifications.requestPermission()`. Calling `Notification.requestPermission()` yourself skips the OneSignal subscription.
- **In an iOS browser tab** `window.Notification` is undefined, so `isPushSupported()` returns false (expected). Detect the Home Screen app:

```javascript
const isHomeScreenWebApp =
  window.navigator.standalone === true ||
  window.matchMedia("(display-mode: standalone)").matches ||
  window.matchMedia("(display-mode: fullscreen)").matches;
```

- **iPadOS can report a desktop Safari user agent:** treat a Mac that reports touch support as an iPad.
- **Testing:** use a normal tab (Private Browsing can hide Add to Home Screen); add from the same origin as the Site URL (including `https` and `www`); after changing `display`, remove and re-add the icon. Subscribers appear as **web push** Subscriptions, not Apple iOS app Subscriptions. Removing the icon deletes the web app's data and push subscription; clearing Safari data does not. After **Don't Allow**, iOS won't prompt again for that web app until it is removed and re-added.

## Local development

- **Use a separate OneSignal app** from production.
- **The Site URL must match localhost exactly:** `http://localhost`, `https://localhost:3000`, `http://127.0.0.1`, `https://127.0.0.1:5000`. For HTTP localhost select **Treat HTTP localhost as HTTPS for testing**; other hostnames (e.g. `http://mysite.local`) cannot be used. Add `allowLocalhostAsSecureOrigin: true` to `init`.
- **Self-signed HTTPS on Chrome:** start it with `--allow-insecure-localhost`.

## Testing a send

- **Don't test in Incognito or private mode.** In incognito the Slidedown can still appear with `autoPrompt: true`, but subscriptions typically don't persist, and `isPushSupported()` does not detect private browsing.
- **Check the Subscription** under **Audience > Users & subscriptions > Subscriptions**: status Subscribed. Mark yourself with Options > **Add to Test Users**, and create a segment named `Test Users` with the Test Users filter.
- **Send through the API** ([REST-API.md](REST-API.md) for the full request):

```bash
curl -X POST --url 'https://api.onesignal.com/notifications' \
  --header 'content-type: application/json; charset=utf-8' \
  --header 'authorization: Key YOUR_APP_API_KEY' \
  --data '{
    "app_id": "YOUR_APP_ID",
    "target_channel": "push",
    "name": "Testing basic setup",
    "headings": {
      "en": ""
    },
    "contents": {
      "en": "Hello world!"
    },
    "included_segments": [
      "Test Users"
    ],
    "chrome_web_image": "https://avatars.githubusercontent.com/u/11823027?s=200&v=4"
  }'
```

- **Only Chrome shows web push images** (on Windows and Android, not Chrome macOS). Safari does not support confirmed receipt.
- **Nothing shows:** a misplaced service worker, a Site URL that doesn't match, or notifications blocked in the browser. More in [MIGRATION-AND-TROUBLESHOOTING.md](MIGRATION-AND-TROUBLESHOOTING.md).

## Prove it

- Open `https://<origin>/<serviceWorkerPath>` in a browser: it returns the single `importScripts(".../web/v16/OneSignalSDK.sw.js")` line with `Content-Type: application/javascript`, no redirect, no login.
- The Site URL in the dashboard matches the origin exactly (scheme, `www`, port), and the site is HTTPS (or exact localhost with **Treat HTTP localhost as HTTPS for testing**).
- Either the worker path lives only in the dashboard (Typical Site) or only in `init` (Custom Code), never both; `serviceWorkerPath` has no leading slash and the scope sits at or under the file's directory.
- The page loads `OneSignalSDK.page.js` with `defer` and every call goes through `OneSignalDeferred.push`; with `react-onesignal`, `init` runs once in a client-only effect (no `window.OneSignal already defined` error).
- After clicking Allow in a normal window, the Subscription shows Subscribed in **Audience > Users & subscriptions**, and a test send to the `Test Users` segment arrives.
- On iPhone: the manifest has `display: standalone`, the site opened from the Home Screen icon, and the prompt appeared only after tapping a button.
