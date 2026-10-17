# Migration and troubleshooting

Two jobs: moving code off the Player Model (Mobile SDK v2 to v4, Web SDK v15, the old player endpoints and legacy keys) onto the User Model, and finding why a notification was not delivered or shown. The User Model migration is **one-way and not backwards compatible**, so every SDK and backend service must be updated before you switch. For delivery problems, "Delivered" only means OneSignal handed the message to FCM, APNs or WNS, not that it displayed. Concepts are in [USER-MODEL.md](USER-MODEL.md); setup is [SETUP-WEB.md](SETUP-WEB.md) and [SETUP-MOBILE.md](SETUP-MOBILE.md); API errors are in [REST-API.md](REST-API.md#responses-and-errors).

**Contents:** Player Model to User Model; Web SDK v15 to v16 method map; Legacy API endpoints and fields; Legacy API keys and base URL; Troubleshooting order; Web push troubleshooting; Web push delivered but not shown; Mobile troubleshooting; Mobile push delivered but not shown; Duplicated notifications; Debug logs; Test users; Prove it.

## Player Model to User Model

- **Who needs it.** Customers on Mobile SDK v2, v3, v4 or Web SDK v15. New customers and those on Mobile v5 or Web v16 skip it.
- **New concepts.** `onesignal_id` (auto-generated, auto-managed, read-only), `external_id` (set via SDK `login()` or the API; a reserved alias; writable, legacy-compatible), and custom aliases ([USER-MODEL.md](USER-MODEL.md)).
- **Test in staging; migrate only after all SDKs and backend services are updated.** The migration is one-way.
- **Step 1: unify users with `external_id`** via SDK `login(externalId)`, Create User / Update User API, or CSV import. OneSignal auto-merges subscriptions under the same External ID.
- **Step 2: update SDKs.** All mobile SDKs **v5+** and the web SDK **v16+** support the User Model. Roll out with Apple Phased Rollout and Google Play Staged Rollout.
- **Step 3: replace deprecated Player Model API calls** (table below).
- **Until then, mixed versions misbehave.** On Mobile v4 or lower or Web v15 or lower, "Discrepancies may occur where the External ID set through the SDK and the External ID set through the API do not generate matching OneSignal IDs." Keep using Add a Device / Edit Tags with External User ID / Edit a Device until migrated.
- **Per-SDK migration guides** (read the one for your SDK):
  - Flutter v5+: `https://github.com/OneSignal/OneSignal-Flutter-SDK/blob/user_model/main/MIGRATION_GUIDE.md`
  - React Native v5+: `https://github.com/OneSignal/react-native-onesignal/blob/major_release_5.0.0/MIGRATION_GUIDE.md`
  - Web v16+: `https://github.com/OneSignal/OneSignal-Website-SDK/blob/160000/MIGRATION_GUIDE.md`
  - React `react-onesignal` v3+: `https://github.com/OneSignal/react-onesignal/blob/main/MigrationGuide.md`
- **Backend:** the Node server SDK is `@onesignal/node-onesignal` ([SERVER-AND-SUPABASE.md](SERVER-AND-SUPABASE.md)).
- **Changing the App ID resets identity.** A new App ID in app init creates a brand new user and push subscription under it when users update and open the app; with the same bundle or package ID the push subscription status carries over, but aliases, tags, email and phone must be re-added.
- **Moving from another push provider.** Import users with Create user and Create Subscription. On Android, remove the old SDK's notification handling in the release; on iOS you can keep sending from the old provider temporarily, then send only from OneSignal. Sending from both causes duplicates.

## Web SDK v15 to v16 method map

- **Service worker:** keep the same file path, change only the URL: `importScripts('https://cdn.onesignal.com/sdks/OneSignalSDKWorker.js');` becomes `importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");`.
- **Init:** the old `<script src="https://cdn.onesignal.com/sdks/OneSignalSDK.js" async>` with `window.OneSignal = window.OneSignal || []; OneSignal.push(function(){ OneSignal.init({appId}) })` becomes:

```html
<script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
<script>
window.OneSignalDeferred = window.OneSignalDeferred || [];
OneSignalDeferred.push(async function(OneSignal) {
  await OneSignal.init({
    appId: "YOUR_APP_ID",
  });
});
</script>
```

| v15 (Player Model) | v16 (User Model) |
|---|---|
| `provideUserConsent(true)` | `setConsentGiven(true)` |
| `showNativePrompt()` | `OneSignal.Notifications.requestPermission()` |
| `registerForPushNotifications()`, `showHttpPrompt()`, `sendSelfNotification()`, `getEmailId()` | Dropped |
| `showSlidedownPrompt()` | `OneSignal.Slidedown.promptPush()` |
| `showCategorySlidedown()` | `OneSignal.Slidedown.promptPushCategories()` |
| `on('permissionPromptDisplay')` | `OneSignal.Notifications.addEventListener('permissionPromptDisplay', ...)` |
| `on('getNotificationPermission')` | `OneSignal.User.PushSubscription.addEventListener('change', ({ optedIn }) => ...)` |
| `on('subscriptionChange')` | `OneSignal.User.PushSubscription.addEventListener('change', ({ token }) => ...)` |
| `on('notificationPermissionChange')` | `OneSignal.Notifications.addEventListener('permissionChange', ...)` |
| `on('popoverShown')` | `OneSignal.Slidedown.addEventListener('slidedownShown', ...)` |
| `on('customPromptClick')` | `OneSignal.Notifications.addEventListener('click', ({notification, result}) => ...)` |
| `on('notificationDisplay')` | `Notifications.addEventListener('foregroundWillDisplay', ...)` |
| `on('notificationDismiss')` | `addEventListener('dismiss', ...)` |
| `isPushNotificationsSupported()` | `OneSignal.Notifications.isPushSupported()` |
| `isPushNotificationsEnabled()` | `OneSignal.User.PushSubscription.optedIn` |
| `setSubscription(false)` | `OneSignal.Notifications.permission = false` (as written on the mapping page) |
| `getUserId()` | `OneSignal.User.PushSubscription.id` |
| `setExternalUserId(id)` / `removeExternalUserId()` / `getExternalUserId()` | `OneSignal.login(id)` / `OneSignal.logout()` / `OneSignal.User.externalId` |
| `sendTag` / `sendTags` / `getTags` | `OneSignal.User.addTag` / `OneSignal.User.addTags` / `OneSignal.User.getTags()` |
| `deleteTag` / `deleteTags` | `OneSignal.User.removeTag` / `OneSignal.User.removeTags([...])` |
| `setEmail` / `logoutEmail()` | `OneSignal.User.addEmail` / `OneSignal.User.removeEmail(email)` |
| `setSMSNumber` / `logoutSMS()` | `OneSignal.User.addSms` / `OneSignal.User.removeSms(number)` |

- **HTTP sites are gone in v16.** `OneSignalSDK: The "My site is not fully HTTPS" option is no longer supported starting with version 16 (User Model)` means users who subscribed on HTTP are actually subscribed to `https://your-label.os.tc`. Fix A: create a new OneSignal app and App ID (keep the old app to notify users to resubscribe). Fix B: keep the App ID and use the Update an App API to set `chrome_web_origin` and `safari_site_origin` to the HTTPS origin, deleting current web push subscribers first to avoid duplicates. Both require users to resubscribe.

## Legacy API endpoints and fields

| Player Model | User Model |
|---|---|
| Add Device (Add a player) | Create User or Create Subscription |
| Edit Device (Edit player) | Update User or Update Subscription |
| Delete Player (Delete player record) | Delete User or Delete Subscription |
| View players, View player, Edit tags with external user id | Deprecated (listed as deprecated in the API index) |
| `include_player_ids` | `include_subscription_ids` (or better, `include_aliases`) |
| `include_external_user_ids` | `include_aliases: { external_id: [...] }` plus `target_channel` |
| Notification-level `external_id` (idempotency) | `idempotency_key` (both names currently work) |
| Event Stream `message.email.sent` / `message.sms.sent` | `message.email.received` / `message.sms.delivered` (old kinds can't be added to new streams) |
| "Identity Verification for email + external_id" toggle (SDK v3/v4) | The JWT Identity Verification beta ([USER-MODEL.md](USER-MODEL.md#identity-verification)) |

- **New User Model endpoints:** Create, View, Update, Delete User; Create Alias, Delete Alias; Create, Update, Delete, Transfer Subscription ([REST-API.md](REST-API.md#users-api)).
- **Supabase guides are still on the Player Model** ([SERVER-AND-SUPABASE.md](SERVER-AND-SUPABASE.md#what-to-change-against-current-docs)).

## Legacy API keys and base URL

- **App and Organization API keys arrived in November 2024.** The legacy User Auth key and the original REST API key are still accepted, but no new ones can be created and their management UI is gone.
- **Migrate:** create a new key, update code, change the base URL from `https://onesignal.com/api/v1/` to `https://api.onesignal.com`, verify in staging, then disable the legacy key.
- **Node SDK:** `createConfiguration({ userKey, appKey })` (beta SDK) becomes `createConfiguration({ restApiKey, organizationApiKey })`.

## Troubleshooting order

1. **Update to the latest SDK** (`https://github.com/OneSignal/sdks`) and re-check setup.
2. **Check credentials before debugging SDK code.** Push can't deliver until FCM, APNs or HMS credentials are configured in OneSignal. Android: FCM credentials and Google Play Services on the test device. Android works but iOS doesn't: APNs, entitlements, provisioning, the Notification Service Extension and App Groups. iOS push works but rich images or confirmed delivery don't: the NSE and App Group ([SETUP-MOBILE.md](SETUP-MOBILE.md)).
3. **Check the subscription.** It must be **Subscribed** in the dashboard and still match the segment filters or direct-send IDs, with a recent last session. Status values and `notification_types` codes are in [USER-MODEL.md](USER-MODEL.md#subscription-status-and-notification_types).
4. **Check the API response.** A `200` with an empty `id` sent nothing ([REST-API.md](REST-API.md#responses-and-errors)).
5. **Only then collect logs.** For support, gather App ID, External ID or Subscription ID, the notification ID or dashboard link, and a debug log.

## Web push troubleshooting

- **Browser support:** Chrome, Firefox, Edge, Opera, Yandex on Windows, macOS, Android and iOS (iOS requires installing the web app); Safari 10+ on macOS and iOS only; Samsung Internet Android/iOS; UC Browser Windows/Android/iOS; Internet Explorer and DuckDuckGo none. Chromium-based browsers appear as "Chrome" in analytics. Localhost testing works only in Chromium-based browsers.
- **Device settings are "the most common cause":** Focus or Do Not Disturb, Low Battery. On macOS, Chrome and Edge show 2 application entries (web push and internal alerts); enable both. On Android, a silent or off browser notification channel hides push.
- **Turn on logging:** `OneSignal.Debug.setLogLevel('trace');` in the console (it returns `undefined`), then close the tab and open a new one (a refresh doesn't trigger all init events). Remote debugging: `chrome://inspect#devices`, Firefox `about:debugging`, iOS Web Inspector via Safari's Develop menu.

| Error | Meaning and fix |
|---|---|
| `Error: SDK already initialized` | `init` called more than once (often a WordPress or Shopify integration plus manual code). Remove the duplicate. |
| `Error: Can only be used on: (URL Set in OneSignal Dashboard)` | The origin doesn't match the dashboard Site URL: protocol (`https://`), domain (`example.com` vs `www.example.com`) and subdomain must all match (**Settings > Push & In-app > Web > Site URL**). |
| `The "My site is not fully HTTPS" option is no longer supported starting with version 16` | See the v16 map above. |
| `Registration of a Service Worker failed.`, `A bad HTTP response code (404)` or `(403)`, `The script has an unsupported MIME type`, `The script resource is behind a redirect, which is disallowed.` | Worker misconfigured. Open the file URL: names are case-sensitive (some servers lowercase them); it must show the `importScripts` line, serve `content-type` `application/javascript`, have no redirects, and sit on the same domain (no CDN or proxy domains). |

- **Diagnostics snippet** (run in the console):

```javascript
function getUserInfo() {
  console.log('getUserInfo()');
  Promise.all([
    OneSignal.Notifications.isPushSupported(),
    OneSignal.Notifications.permission,
    OneSignal.User.PushSubscription.optedIn,
    OneSignal.User.PushSubscription.id
  ]).then(([
    isPushSupported,
    isSubscribed,
    isOptedIn,
    subscriptionId
  ]) => {
    console.log('The current URL of this page: ', location.href);
    console.log('Push is supported on this browser: ', isPushSupported);
    console.log('You are subscribed to notifications in the browser: ', isSubscribed);
    console.log('You are opted-in with OneSignal: ' , isOptedIn);
    console.log('Your OneSignal Subscription ID: ', subscriptionId);
  }).catch(e => {
    console.error('Error getting user info:', e);
  });
}
getUserInfo();
```

  `isOptedIn` false: check whether your site calls `optOut()`.

- **Chrome receive path:** `chrome://gcm-internals` > Start Recording (Connection State: CONNECTED), send a push, and look in "Receive Message Log" for "Data msg received" (none = Chrome isn't receiving; contact support). Then `chrome://serviceworker-internals`, find `Scope: https://your-site.com`, Inspect, and run `OneSignalWorker.log.trace();` in the worker console.
- **Chromium revokes permission on low engagement.** Since an October 2025 Chromium change, push permission is automatically revoked for users with low site engagement who receive a high volume of notifications; low engagement appears to be about 30 days of inactivity.
- **Duplicate web subscriptions:** subscribing on several origins (e.g. `https://example.com` and `https://sub.example.com`) with one App ID gives two subscriptions. Fix: reset per origin, or a new OneSignal app with users resubscribing.

## Web push delivered but not shown

- **Device online and inside TTL.** The default TTL is **3 days**. Firewalls must allow FCM (Chrome, Android) outbound TCP 5228, 5229, 5230 and APNs (Safari, iOS) outbound TCP 5223 and TCP 443 or 2197; test by switching to cellular.
- **Browser settings:** `chrome://settings/content/notifications`, Firefox `about:preferences#privacy`, `edge://settings/content/notifications`, Safari > Settings > Websites > Notifications.
- **Browser closed:** nothing shows until it runs (it pops up then if TTL hasn't expired). Full mobile browser app data or many unread notifications or tabs can block display.
- **Search your code for `.unregister()`,** which deletes service workers. PWAs with their own worker need the multiple-worker setup ([SETUP-WEB.md](SETUP-WEB.md#the-service-worker)).
- **Clean test:** reset the Notifications permission, clear cookies and site data for your site and `onesignal.com`, reopen, allow, read `OneSignal.User.PushSubscription.id`, **Add as test user**, and send via **Messages > New Push > Test & Preview**.

## Mobile troubleshooting

- **Code that blocks push:** `OneSignal.User.pushSubscription.optOut()` or REST `enabled: false` (unsubscribed); `preventDefault()` in the foreground listener or Android service extension. An unconditional `event.preventDefault()` in the foreground listener blocks all foreground notifications (test with the app backgrounded or closed); an Android NSE `preventDefault()` blocks regardless of state.
- **Firebase Messaging or other push SDK conflicts.** Symptom: Delivered in OneSignal but never on the device, the app has `firebase_messaging` or a custom `FirebaseMessagingService`, and push works when Firebase Messaging is removed. Remove legacy receivers like `com.google.firebase.iid.FirebaseInstanceIdReceiver` from `AndroidManifest.xml`, check custom `onMessageReceived` overrides (e.g. Flutter `firebase_messaging`), and avoid `FirebaseMessaging.getToken()` / `deleteToken()`. OneSignal should be the only SDK managing the push token; read it from `User.pushSubscription.token` and observe changes.
- **iOS token is a raw APNs token.** FCM rejects it. If your backend must send iOS via FCM directly, let the Firebase SDK own registration; otherwise send through OneSignal.
- **"APNs Delegate Never Fired" / "APNs 3000"** is an Apple timeout connecting to APNs: common with APNs development environments, several push dependencies or native iOS push APIs, and temporary connectivity (often self-resolves next session after 30+ seconds in background). Remove other push dependencies and native APIs, check the debug log, contact support.
- **App doesn't open from a notification when force-closed:** don't test on a `Debug` build (Flutter: `flutter run --release` or the Release scheme).
- **Closed networks** work only with access to the APNs and FCM gateways.
- **Example projects:** React Native `https://github.com/OneSignal/react-native-onesignal/tree/main/examples`; Flutter `https://github.com/OneSignal/OneSignal-Flutter-SDK/tree/main/examples`.

## Mobile push delivered but not shown

**Delivered** = handed to FCM or APNs. **Confirmed** = the OneSignal SDK on the device received it. Delivered but not Confirmed and not shown: work through this list with the App ID, Message ID and Subscription ID.

- **Permission and status:** notifications enabled in Settings; open the app so the SDK syncs status; the dashboard shows **Subscribed**.
- **Device modes:** turn off Do Not Disturb or Focus (on iOS, swiping away a grouped summary removes those notifications), Low Power Mode, and Android battery optimization (set "Unrestricted" or "Not Optimized").
- **Offline:** TTL default 3 days; firewall ports FCM 5228/5229/5230, APNs 5223 and 443 or 2197.
- **Android Force Stop blocks push until the user reopens the app.** Samsung, Xiaomi and Huawei aggressively force stop on swipe (dontkillmyapp.com). Check with `adb shell dumpsys package com.company.appname | grep stopped` (`stopped=true` = force stopped); logcat shows `W/GCM-DMM: broadcast intent callback: result=CANCELLED forIntent { act=com.google.android.c2dm.intent.RECEIVE ...}`.
- **Android notification categories (channels) disabled;** the default category is "Miscellaneous". Samsung One UI 6.1 automatically disables notification categories for many apps.
- **Doze and App Standby.** High priority bypasses Doze, but FCM deprioritizes apps whose high-priority messages don't produce visible notifications; reserve high priority for time-sensitive messages.
- **Emulators** need a Google Play Store image and a Cold Boot.
- **iOS specifics:** APNs coalescing stores one notification per app while offline (earlier ones are discarded); a custom `UNUserNotificationCenterDelegate` may block foreground display (use the SDK foreground listener); clearing the badge on app open removes notifications from Notification Center.
- **Message config:** check segment filters and direct-send IDs; a repeated **Collapse ID** silently replaces unread notifications.
- **Unsubscribes show up late.** Detection typically takes 2+ messages (the push service accepts one more after the user unsubscribes, then rejects the next), Apple delays unsubscribe reporting by 14+ days, and it can take weeks if the user never reopens. Send to all users at least once or twice a month so unsubscribes surface gradually.
- **Verify:** verbose log, background the app, send a test, confirm OneSignal initialized and the logged `subscription-id` is subscribed and matches the target.

## Duplicated notifications

- **OneSignal already dedupes** per notification per subscription and per device token, idempotency keys protect your API retries, and mobile SDKs skip already processed notifications. Duplicates usually come from your sending pipeline or your app's display code. Apple's iOS 17 duplicate bug was fixed in iOS 17.3.
- **Pipeline causes:** server retries without an idempotency key, backend logic sending twice, still sending from a previous provider during migration.
- **Third-party handlers displaying OneSignal payloads** (FCM `FirebaseMessagingService`, iOS `UNUserNotificationCenterDelegate`): every OneSignal notification has `{"custom": {"i": "the-notification-id"}}`; in non-OneSignal handlers return early when `custom.i` is present. Add your own marker key (e.g. `my_app_notification: true`) to other providers' payloads and filter both ways.
- **Android display rules:** call `display()` only after `preventDefault()`; never both OneSignal `display()` and `NotificationManagerCompat.notify()`; only one of the service extension or the foreground listener displays per app state; call `preventDefault()` synchronously before async work, and finish async work in time or the held notification is dropped. The duplicates page says **30 seconds**; the mobile SDK reference says "about 25 seconds" for the foreground listener. Confirm in the current docs.
- **iOS:** OneSignal sets itself as `UNUserNotificationCenterDelegate` during init; your own delegate or local notifications in response to a push cause duplicates. Use the foreground lifecycle listener with `preventDefault()`.
- **Multiple instances:** Android prod and dev apps both installed; iOS two records with the same token; web multiple origins (above).
- **Not duplicates:** notifications Android restores on app open.

## Debug logs

- **Mobile SDK 5.0.0+.** Set VERBOSE **before** initializing. React Native: `OneSignal.Debug.setLogLevel(LogLevel.Verbose)` (SDK reference and setup pages; the debug log page shows `OneSignal.Debug.setLogLevel(6);`). Flutter: `OneSignal.Debug.setLogLevel(OSLogLevel.verbose);`. Scale: 0 None, 1 Fatal, 2 Errors, 3 Warnings, 4 Info, 5 Debug, 6 Verbose. Remove or reduce verbose logs in production.
- **Capture:** reproduce on a device connected to Android Studio (Run tab) or Xcode (**Window > Devices and Simulators > Open Console**, All Messages) and save the whole log to a `.txt`. iOS crashes must happen while the device is not connected; plug it in afterward. iOS offline logging: redirect stderr/stdout to `Documents/out.log` and retrieve it via **Download Container**.
- **Web:** `OneSignal.Debug.setLogLevel('trace');` (above).

## Test users

- **The test flag lives on the User** and applies to all its subscriptions. Mark one via **Options > Add as test user**, the New User form, or the API's `properties.test_user_name` ([REST-API.md](REST-API.md#users-api)).
- **Find the subscription:** by External ID (preferred), email, phone or Subscription ID. Web: `console.log(OneSignal.User.PushSubscription.id);` (`null` = not subscribed yet). Mobile without code: background and foreground the app six times within 30 seconds to copy `os: <id>` to the clipboard (strip `os: `; `os: no subscription ID yet` = none yet). Needs iOS SDK **5.6.2+** / Android SDK **5.10.1+**, on by default, off with Info.plist `OneSignal_disable_subscription_id_copy` = true or Android `<meta-data android:name="com.onesignal.subscriptionIdCopyDisabled" android:value="true"/>`; it doesn't work without privacy consent. iOS keeps the clipboard value 5 minutes. Mobile web: `chrome://inspect/#devices`.
- **Can't find the subscription:** SDK not initialized on that page or screen, the wrong ID type, or a different OneSignal app (staging vs production).
- **Send to test users:** **Test & Preview > Send Test Push**, the Journeys test users filter, webhook tests, or the API with `include_subscription_ids` or `included_segments: ["Test Users"]` after creating a segment named **Test Users** with the **Test users** filter.
- **The same person many times** = a new User per reinstall or cleared browser data without an External ID. Call `OneSignal.login` with the same External ID after each install and sign-in.

## Prove it

- `grep` the codebase for `include_player_ids`, `include_external_user_ids`, `setExternalUserId`, `OneSignalSDKWorker.js`, `onesignal.com/api/v1` and `userKey`: no hits once migrated.
- Every app and site build in production runs Mobile SDK v5+ or Web SDK v16+ before the User Model switch.
- The diagnostics snippet on your site prints push supported, permission granted, opted in, and a Subscription ID that the dashboard shows as **Subscribed**.
- A test push to a test user marked in the dashboard shows on the device with the app backgrounded, and shows once.
- On Android, `adb shell dumpsys package <your.package> | grep stopped` shows `stopped=false` on the test device.
- A verbose debug log captured before init shows OneSignal initialized and the logged `subscription-id` matching the target.
