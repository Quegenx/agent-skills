# User model

OneSignal stores people as Users, each with up to 20 Subscriptions (one per destination: an app install, a browser profile, an email address, a phone number). The decision that settles most outcomes is the External ID: until you call `OneSignal.login(externalId)`, every Subscription is its own anonymous User with its own OneSignal ID, so a person on web, iOS and email is three Users, which can send duplicate or conflicting messages across channels. Call `login` early and on every start, and call `logout` when the person signs out.

**Contents:** [Users and IDs](#users-and-ids) · [login and logout](#login-and-logout) · [Aliases](#aliases) · [Subscriptions](#subscriptions) · [Subscription status and notification_types](#subscription-status-and-notification_types) · [Email and SMS from the SDK](#email-and-sms-from-the-sdk) · [Observers](#observers) · [Tags](#tags) · [Custom events and language](#custom-events-and-language) · [Identity Verification](#identity-verification) · [Deleting users](#deleting-users) · [Prove it](#prove-it)

## Users and IDs

- **OneSignal ID:** every User gets one automatically (UUID v4). It is auto-managed and read-only, and it can change: it is created on first mobile app open (or after reinstall), on a new web push Subscription, by the Create user API or CSV import, when a browser cache is cleared and the visitor returns, and by `OneSignal.logout`. After `login`, the current Subscription's OneSignal ID is replaced by the one already tied to that External ID.
- **Never persist the OneSignal ID** as a permanent user identifier. Use your own ID as the External ID.
- **External ID:** your stable identifier (internal user ID or email), a reserved alias, max **128 characters**. "Always assign an External ID." Set it with `OneSignal.login` (recommended), the Create user API or the Transfer subscription API; `OneSignal.logout` removes it. Use the External ID to identify individual users, not tags.
- **Restricted External IDs** are rejected (assignment fails and the User stays as it was): `NA`, `NULL`, `null`, `none`, `not set`, `unknown`, `undefined`, `0`, `1`, `-1`, `NaN`, `00000000-0000-0000-0000-000000000000`, `-`, `ok`, `all`, `123ABC`, `UNQUALIFIED`, `INVALID_USER`.
- **Anonymous vs identified:** with no External ID, web push, mobile, email and SMS Subscriptions are four Users. With the same External ID they merge under one OneSignal ID.
- **Properties follow the User, status follows the Subscription.** Tags, language and External ID live on the User; opted-in or opted-out lives on each Subscription. When a Subscription moves to another User (anonymous to identified, or UserA to UserB) it takes on the new User's properties: UserA had `premium=true`, UserB has `premium=false`, the moved Subscription now reflects `premium=false`.
- **User properties:** External ID, OneSignal ID, Aliases, Channel, Country (ISO 3166-1 Alpha-2), Email (most recent Email Subscription), First session, IP Address (latest updated Subscription), Language (ISO 639-1), Last session, Location (if tracking is on), Phone (most recent SMS Subscription), Tags, Test User name (`test_user_name` in the API), Timezone (`timezone_id`, IANA, set by the SDK, updatable via API).
- **A session** is counted each time the app opens after being backgrounded 30+ seconds, or on a fresh launch.
- **`onesignal_id` vs Subscription ID:** `onesignal_id` is user-level across devices; the Subscription ID (`User.pushSubscription.id`) is the device-level push channel.
- **Read the IDs:** web `OneSignal.User.onesignalId` and `OneSignal.User.externalId` (either may be `null` if read too early); RN and Flutter `await OneSignal.User.getOnesignalId();` and `await OneSignal.User.getExternalId();` (may be `null` before init). Use the user state observer instead of polling.
- **MAU** counts a **mobile** Subscription with at least one session in the billing cycle (first opens, reinstalls and users imported via API included; web push, email and SMS do not count; status does not matter). Behind a paywall, call `setConsentRequired()` before init so no Subscription is created, then `setConsentGiven()` when ready (see [SETUP-WEB.md](SETUP-WEB.md) and [SETUP-MOBILE.md](SETUP-MOBILE.md)).

## login and logout

| Call | Web | React Native / Flutter |
|---|---|---|
| Identify | `await OneSignal.login("external_id")` inside `OneSignalDeferred.push` | `OneSignal.login("external_id");` |
| Sign out | `OneSignal.logout()` | `OneSignal.logout();` |

```javascript
OneSignalDeferred.push(async function(OneSignal) {
  await OneSignal.login("external_id");
});
```

- **When:** at signup, on every login, and on session resume. Web: **every page load** once the user's ID is known. Mobile: **every time the app starts** once the ID is known (if already logged in with that ID the call is effectively a no-op). Call again on account switch. Calling it late or sporadically breaks attribution and can leave Subscriptions split across several OneSignal IDs.
- **Only for identified users.** Do not call `login` for anonymous users (they are tracked by `onesignal_id`), and not before you have a stable identifier.
- **External ID already exists:** the SDK switches to that User and discards the current `onesignal_id`. **Anonymous data collected before login is not merged and is discarded** (tags, session data, email and SMS Subscriptions, other local properties). A `409 Conflict` in the network log or console is expected and can be ignored; it is not usually a promise rejection to handle.
- **External ID is new:** a new User is created with the current `onesignal_id` and the anonymous data is kept.
- **No retry logic needed:** the SDK retries `login` on network failures and server errors.
- **`logout()`** removes the External ID from the current Subscription only (the web push or mobile Subscription on this device, not the user's other Subscriptions), removes the previous User's properties (Tags, Aliases) here and assigns a new anonymous OneSignal ID. On web, use it when the user signs out and you no longer want targeted transactional messages to that browser.
- **Switching users:** `logout` first, then `login` with the new External ID. Several people on one device each get `login` with their own External ID.
- **Stop push to logged-out users:** call `optOut()` after `logout()` (sets `notification_types` to `-2`), then `optIn()` on the next login.
- **Reinstall or cleared cache** creates a new OneSignal ID and Subscription; `login` links the new Subscription back. The same person showing up as several Users means a reinstall or cleared browser data without an External ID: call `OneSignal.login` with the same External ID after each install and sign-in.

## Aliases

- **An alias is `alias_label : alias_id`:** the label is a static key across users (`facebook_id`, `firebase_id`, `crm_user_id`), the id is that user's value. Uses: identify users across platforms, target transactional messages through the Create message API ([REST-API.md](REST-API.md)), and fetch, update or delete users through the User APIs.
- **Set the External ID first.** Aliases do not link Subscriptions together; they rely on `external_id`. Without `login()` first, aliases won't sync across Subscriptions.
- **Limits:** up to **10 aliases per user**; each key and value max **128 characters**.
- **Methods (web, RN, Flutter):** `OneSignal.User.addAlias(label, id)`, `addAliases({ label1: id1, label2: id2 })`, `removeAlias(label)`, `removeAliases([labels])`. Flutter takes a `<String, String>{}` map and a `<String>[]` list. `logout()` removes the External ID and its aliases for that device or session.

```javascript
OneSignal.login("user_123");

OneSignal.User.addAliases({
  facebook_id: "3453443",
  firebase_id: "test3555"
});

// Later, when the user logs out
OneSignal.logout();
```

- **Best practices:** stable, descriptive labels (`crm_user_id`, `legacy_user_id`); no sensitive values such as emails or phone numbers; `logout()` to clean up aliases on sign-out or user switch.

## Subscriptions

- **A Subscription is one destination** (email address, phone number, web browser, or app on a device). It belongs to one User at a time and tracks its own status. Up to 20 per User, several of the same type allowed.
- **The 21st Subscription:** OneSignal removes the External ID from the oldest Subscription (by last session) and gives it a new OneSignal ID (a new anonymous User). At least 3 Email and 3 SMS Subscriptions are retained.

| Type | Channels |
|---|---|
| Email | email |
| SMS | SMS, MMS, RCS |
| Web Push | web push |
| Mobile | mobile push, in-app messages, Live Activities |

- **Mobile channels are independent:** a user who declines push can still receive in-app messages. A Mobile Subscription's status describes push only.
- **Properties:** Subscription ID (UUID); Type (`Email`, `SMS`, `Web Push`, `Mobile`); Subscription Status; Push Token (iOS APNs: 64 hex chars `0-9,a-f`; Android FCM: typically 163 chars, alphanumeric, may contain hyphens, colons, underscores); Email; Phone Number (E.164); Device (e.g. `armv81` for web push on Android); App Version (Android `versionCode`, iOS `CFBundleShortVersionString`); SDK Version. Activity: Last Session, First Session, Sessions count, Usage Duration (seconds; only tracked when a session exceeds 60s), IP Address (not collected in the EU). Language Code comes from the device at Subscription creation; Timezone ID from the device at last interaction; Country from IP.
- **Mobile:** created automatically when the user installs and opens the app with the SDK; tied to device and push token; a reinstall creates a new Subscription. Creating or updating it through the Users and Subscriptions APIs is possible "but the mobile SDK is recommended for most use cases". It stops receiving on uninstall, push disabled in settings and the app never reopened, or token expiry (status set Unsubscribed at send time). Re-enabling push in settings makes it Subscribed with an updated token on next app open.
- **Web Push:** one browser profile on one device. Created when the user clicks "Allow" on the native prompt, or after clearing browser data and revisiting. Its Subscription ID never changes. **It cannot be created through the REST API** (only updated). Users who clear browser data are re-subscribed automatically if auto-resubscribe is on. Call `login` on each site open or inside the Subscription change listener.
- **Email:** unique per app (deleting and re-adding gives a new Subscription ID); include `external_id` when creating; defaults to Subscribed. Create via SDK `addEmail` or the email prompt (after `login`), Create user or Create email API, or CSV. See [EMAIL-AND-SMS.md](EMAIL-AND-SMS.md).
- **SMS:** E.164 (e.g. `+14155551234`); `addSms` or the SMS prompt after `login`, Create user or Create SMS API, or CSV. Unsubscribe via "STOP", resubscribe via "START". Re-subscribing SMS without consent violates CTIA rules.
- **Importing from another provider:** the Create user API and the Create Subscription API.
- **Free plans** automatically delete Subscriptions with no activity for **18+ months**.
- **Find a Subscription ID:** web console `OneSignal.User.PushSubscription.id`; mobile web via `chrome://inspect/#devices`; a mobile app without code: background and foreground the app six times within 30 seconds to copy it to the clipboard.
- **"Can't find my Subscription":** the SDK is not initialized on that page or screen, the wrong ID type, or a different OneSignal app (staging vs production).

## Subscription status and notification_types

- **Statuses:** **Subscribed**; **Unsubscribed** (opted out or lost a valid token); **Never Subscribed** (mobile only: never prompted or never granted). With iOS Provisional push all iOS Subscriptions start Subscribed. Email unsubscribes through the unsubscribe link (overridable for transactional email); SMS through "STOP".
- **In the API** `invalid_identifier: true` means unsubscribed; read `notification_types` for the reason.

| `notification_types` | Meaning |
|---|---|
| `1` or positive | Subscribed. Above `1` only on iOS, a bitmask: `1` Badge, `2` Sound, `4` Alert, `8` CarPlay, `16` Critical Alert, `32` Provides App Notification Settings, `64` Provisional, `128` Announcement (deprecated iOS 15), `256` Time Sensitive (e.g. `47` = 32+8+4+2+1) |
| `0`, `-99` | Never Subscribed |
| `-2` | Unsubscribed (Opted Out) by `optOut()` or API `enabled: false`; re-enable with `optIn()` |
| `-3`, `-5` | Android Support Library Error |
| `-4`, `-8`, `-11`, `-12`, `-29` | Google Play Services Library Error |
| `-6` | Invalid Google Project Number (FCMv1 Sender ID doesn't match the token's original) |
| `-7`, `-9` | Outdated Google Play Services App |
| `-10` | Not Subscribed (uninstalled or unsubscribed in device settings; web: blocked notifications, cleared all data and workers) |
| `-13` | iOS `missing_push_capability` |
| `-14`, `-16`, `-17`, `-30` | iOS APNs Errors |
| `-15` | iOS Simulator Error (the iOS Simulator requires iOS 16.4+) |
| `-18` | Never Prompted |
| `-19` | Prompted But Never Answered |
| `-20`, `-21` | `temp_web_record` (web permission revoked, `pushsubscriptionchange`) |
| `-22` | Manually Unsubscribed via dashboard |
| `-23`, `-24` | Web Service Worker Error |
| `-25` to `-28` | Huawei HMS PushKit Error |
| `-31` | Disabled via REST API |
| `-98` | SMS awaiting double opt-in |

- **When statuses update:** (1) on app or site open the SDK checks token and permission and updates immediately (catch it with the push subscription observer to sync to your database); (2) at send time, when the push service reports an invalid token. Detection typically takes 2+ messages: message 1 delivered, user unsubscribes; message 2 accepted by the push service and reported "Delivered"; message 3 rejected, Subscription marked Unsubscribed; message 4+ not attempted.
- **Send to all users at least once or twice a month** so unsubscribes are detected gradually instead of in one spike.
- **Apple delays unsubscribe reporting by 14+ days**, several weeks if the user never reopens the app.
- **Chromium** (blog post, October 2025) automatically revokes push permission for users with low site engagement who receive a high volume of notifications; low engagement appears to be about 30 days of inactivity.
- **Track unsubscribes** through Event Streams, Push reports, or the SDK push subscription observer.

## Email and SMS from the SDK

- **Call `login()` first.** `OneSignal.User.addEmail` and `addSms` attach to the current OneSignal ID; called before `login` they land on the anonymous User and must be called again after `login`.
- **Status codes:** **200 OK** already belongs to the current user; **201 Created** new Subscription; **202 Accepted** existed and moved to the current user. An existing email or phone is added to the existing user, no duplicates.
- **`removeEmail(email)` / `removeSms(number)`** remove it from the current user, remove the External ID from that Subscription and give it a new OneSignal ID.
- **Ask for explicit consent** before adding email or SMS, and offer channel preferences.

## Observers

| Event | Web | React Native | Flutter |
|---|---|---|---|
| User state (External ID set, user switched) | `OneSignal.User.addEventListener('change', fn)` | `OneSignal.User.addEventListener("change", listener)` / `removeEventListener` | `OneSignal.User.addObserver(fn)` / `removeObserver` |
| Push subscription | `OneSignal.User.PushSubscription.addEventListener("change", fn)` | `OneSignal.User.pushSubscription.addEventListener('change', fn)` / `removeEventListener` | `OneSignal.User.pushSubscription.addObserver(fn)` / `removeObserver` |

- **The push subscription observer fires** on a new token (FCM, APNs or browser), Subscription ID assignment, an `optedIn` change, and permission toggled in browser or OS settings followed by a return to the app. The event carries `previous` and `current`, each with `id`, `token`, `optedIn`.
- **Read IDs and tokens:** web `User.PushSubscription.id` and `.token`; RN `await OneSignal.User.pushSubscription.getIdAsync();` and `getTokenAsync();`; Flutter `OneSignal.User.pushSubscription.id` and `.token`. All may be `null` early; use the observer.
- **Web with `autoResubscribe: true`:** returning visitors can fire `change` with `optedIn: true` on both sides. For new-subscription analytics test `event.current.token && !event.previous.token`:

```javascript
function pushSubscriptionChangeListener(event) {
  if (!event.current.token || event.previous.token) {
    return;
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "onesignal_push_subscribed",
    onesignal_subscription_id: event.current.id,
  });
}

OneSignalDeferred.push(function(OneSignal) {
  OneSignal.User.PushSubscription.addEventListener("change", pushSubscriptionChangeListener);
});
```

React Native user state:

```javascript
const listener = (event: UserChangedState) => {
    console.log("User changed: " + (event));
};

OneSignal.User.addEventListener("change", listener);
// Remove the listener
OneSignal.User.removeEventListener("change", listener);
```

Flutter user state:

```dart
OneSignal.User.addObserver((state) {
	var userState = state.jsonRepresentation();
    print('OneSignal user changed: $userState');
});

/// Remove a user state observer that has been previously added.
OneSignal.User.removeObserver(observer);
```

## Tags

- **Avoid PII** in tags or tag-derived criteria [OneSignal segmentation reference]. Identify users with External ID rather than tags ([Users and IDs](#users-and-ids)).

- **Tags are key-value pairs on the User** for traits and behaviors used in segmentation and personalization, not full profiles or logs. They have lifetime retention.
- **All values are strings:** labels (`"free"`, `"VIP"`), numbers (`"42"`, `"3.14"`, which enables numeric filters), timestamps (`"1685400000"`, Unix **seconds**, for Time Operators), booleans (`"true"`/`"false"` or `"1"`/`"0"`, the latter to reduce payload). Arrays, objects, nested values and JSON blobs are not supported: use Custom Events.
- **Restricted keys:** `message`, `notification`, `subscription`, `user`, `template`, `app`, `org`, `dynamic_content`, `data_feed`, `journey`, `custom_data`.
- **Tags vs custom events:** tags are user properties (static, lifetime retention, segmentation and personalization); custom events are actions (JSON, retention per event, also Journey triggers and Wait Until steps, see [JOURNEYS.md](JOURNEYS.md)). Use tags for static properties, custom events for real-time and complex flows.
- **The limit is per user and depends on the plan** (no limit on distinct tag keys per app). At or above the limit you **can't add** new tags (delete first, in a separate request); updating existing tags still works. With a limit of 20: 19 tags plus 1 new works, plus 2 fails; 20 tags plus a new one fails, an update works. **Exceeding the limit makes SDK tag operations fail silently.** Check usage under **Audience > Users & subscriptions > Tags column** or an export.
- **Ways to set:** SDK methods (recommended), REST Update user, Journeys, CSV Import (with `external_id` or `subscription_id`), web category prompts (see [PERMISSIONS.md](PERMISSIONS.md)), in-app click actions, integrations.

| Operation | Web | React Native | Flutter |
|---|---|---|---|
| Add one | `OneSignal.User.addTag(k, v)` | `OneSignal.User.addTag('KEY', 'VALUE');` | `OneSignal.User.addTagWithKey("KEY", "VALUE");` |
| Add many | `addTags({})` | `OneSignal.User.addTags({my_tag1: 'my_value', my_tag2: 'my_value2'});` | `OneSignal.User.addTags(tags);` |
| Remove | `removeTag(k)`, `removeTags([])` | `removeTag`, `removeTags([...])` | `removeTag`, `removeTags([...])` |
| Read | `getTags()` | `await OneSignal.User.getTags();` | `await OneSignal.User.getTags();` |

- **Values are replaced** if the key exists. `getTags()` returns the local copy, refreshed from the server during `login()` or new sessions.
- **Tags not showing:** network (mobile SDK v5+ caches and retries); the Web SDK needs the User to exist first (created on web push subscribe or `addEmail`/`addSms`; call `login`); tags set as the page navigates away are lost; after clearing browser data tags come back only if `login` is called again or the tags are re-set.

### Tags in message content

- **Liquid renders at send time** from data stored in OneSignal (tags, External ID, Subscription fields): `Hi {{ first_name | default: "friend" }}!`. Objects include `user.tags` (or bare `{{ first_name }}`), `user.language`, `user.country`, `user.external_id`, `user.onesignal_id`, `subscription.email`, `subscription.phone_number`. Values fetched or computed at send time need Data Feeds or API `custom_data`; the full Liquid reference is [PERSONALIZATION.md](PERSONALIZATION.md).
- **The push `data` field does not support Liquid.**
- **In-app messages support only tag substitution,** and the tags must be set before the user starts a new app session; it doesn't render in "Send Test Message" test sends (see [IN-APP-MESSAGES.md](IN-APP-MESSAGES.md)).
- **Tags are strings in Liquid too:** convert with `{% assign item_count = cart_items_count | plus: 0 %}`.

## Custom events and language

- **`OneSignal.User.trackEvent(name, properties?)`** records an action; properties must be JSON-serializable, nesting allowed. The SDK adds a reserved `os_sdk` key (e.g. `{"os_sdk": {"device_os": "138", "type": "ChromePush", "device_model": "MacIntel", "sdk": "160500"}}`). The user should be logged in.
- **Minimum SDKs:** Web `160500`; React Native `5.3.0`; Flutter `5.4.0`. On web call it on the deferred `OneSignal` instance, not `window.OneSignal`.

```javascript
OneSignalDeferred.push(async function (OneSignal) {
  await OneSignal.init({ appId: "ONESIGNAL_APP_ID" });

  const properties = {
    promo_code: "NEW50",
    membership_details: {
      vip: true,
      products_viewed_count: 15,
    },
  };
  OneSignal.User.trackEvent("started_free_trial", properties);

  // Event name only (no properties)
  OneSignal.User.trackEvent("my_event_name");
});
```

- **Language:** `OneSignal.User.setLanguage("en")` (ISO 639-1); web also `OneSignal.User.getLanguage()`.

## Identity Verification

- **JWT on `login`** (beta) secures logging in, adding email and SMS, and changing identities and aliases. It is **mobile only**: with the app-level toggle on, web `login`, `addEmail` and `addSms` fail, so never enable it on an app with an active Web SDK integration.
- **The developer overview calls it** "optional but strongly recommended for production apps. Without it, any client can call `login` with an arbitrary External ID." That conflicts with the next point for this stack; confirm in the current docs.
- **Not usable from this stack yet:** native Android **5.9.0+** and iOS **5.8.0+** support it; **Flutter, React Native, Unity and Cordova do not expose `login(externalId, token)` yet.** The toggle is app-wide: don't enable it until every client calling `login` can send a JWT.
- **Enable:** contact `support@onesignal.com` so **Identity Verification** appears under **Settings > Keys & IDs**; **Generate New Keys**; download the PEM private key (not an App API key); turn on the **Token Identity Verification** toggle last.
- **Sign on your server, never on the device,** after authenticating the user. Claims: `iss` (App ID, required), `exp` (Unix **seconds**, required), an `identity` object with `external_id` (must match `login`), and an optional `subscriptions` array of `{type: "Email"|"SMS", token: <email or E.164>}` (include it before `addEmail`/`addSms`). Algorithm **ES256** only.

```javascript
import jwt from "jsonwebtoken";

const APP_ID = process.env.ONESIGNAL_APP_ID;
const IDENTITY_VERIFICATION_SECRET =
  process.env.ONESIGNAL_IDENTITY_VERIFICATION_SECRET_KEY;

function signOneSignalJWT(externalId, subscriptions) {
  const payload = {
    iss: APP_ID,
    exp: Math.floor(Date.now() / 1000) + 3600,
    identity: {
      external_id: externalId,
    },
  };

  if (subscriptions) {
    payload.subscriptions = subscriptions;
  }

  return jwt.sign(payload, IDENTITY_VERIFICATION_SECRET, {
    algorithm: "ES256",
  });
}

const onesignalJWT = signOneSignalJWT("YOUR_EXTERNAL_ID");
```

- **Keep PEM line breaks intact.** Env systems strip newlines: preserve `\n`, or base64-encode and decode at runtime.
- **SDK flow:** `login(externalId, jwt)` (the second argument is ignored until the toggle is on; afterward `login` without a valid JWT fails); `addUserJwtInvalidatedListener` fetches a new token and calls `updateUserJwt(externalId, jwt)`; to add email or SMS later, mint a JWT with `subscriptions`, `updateUserJwt`, then `addEmail`/`addSms`.
- **With it on, `logout()` disables the push Subscription** (it stays associated with the user); `login` with a JWT restores the status, no `optIn()` needed.
- **REST:** the gated user, alias and subscription endpoints take `Authorization: Bearer YOUR_ONESIGNAL_JWT` ([REST-API.md](REST-API.md)).
- **Troubleshooting:** `login` does nothing = JWT missing, expired or not ES256; gated REST `401 Unauthorized` = missing or invalid Bearer JWT, or a mismatched `identity.external_id`; `exp` rejected = milliseconds instead of seconds.
- **Not this feature:** the legacy toggle "Identity Verification for email + external_id" is for SDK v3/v4.

## Deleting users

- **Manual delete** (dashboard or Delete user API) removes all Subscriptions, aliases and properties.
- **Automatic delete** happens when the last Subscription is deleted and the User has no External ID or Aliases. Identified Users are kept with zero Subscriptions, and a later `login` reconnects them with properties preserved. Assign an External ID before deleting the last Subscription to keep Tags.

## Prove it

- After sign-in, **Audience > Users & subscriptions** shows the person's web, mobile and email Subscriptions under one OneSignal ID with your External ID, not as separate anonymous Users.
- `login` runs on every page load (web) or app start (mobile) and on account switch; a `409 Conflict` in the log after `login` is expected, not an error.
- Signing out calls `logout()` (and `optOut()` if logged-out users must get no push); the Subscription then shows no External ID.
- `addEmail`/`addSms` run after `login`; the response is 200, 201 or 202.
- No External ID is a restricted value (`null`, `0`, `undefined`, `unknown` and the rest) or longer than 128 characters; aliases are set after `login`, at most 10, no emails or phone numbers.
- Every tag value is a string, timestamps are Unix seconds, no key is restricted, and a user's tag count stays under the plan limit (tag writes over it fail silently).
- Code never stores the OneSignal ID as the user's identifier.
