# Permission prompts

Nobody receives push until the system prompt is shown and accepted, and that prompt is scarce: iOS shows it **once**, Android (Google and Huawei) **twice**, and browsers back off or block sites that ask too often. So the system prompt goes last, after a soft prompt (an in-app message or a Slidedown) has explained the value and the user has said yes; dismissing a soft prompt costs no system attempt. "Prompting on first launch ... is the single biggest cause of low opt-in rates." Setup is [SETUP-WEB.md](SETUP-WEB.md) and [SETUP-MOBILE.md](SETUP-MOBILE.md); subscription status codes are in [USER-MODEL.md](USER-MODEL.md).

**Contents:** [Principles](#principles) · [Mobile: in-app soft prompt](#mobile-in-app-soft-prompt) · [Mobile: programmatic prompting](#mobile-programmatic-prompting) · [iOS provisional (direct to history)](#ios-provisional-direct-to-history) · [Mobile permission API](#mobile-permission-api) · [Web: prompt types](#web-prompt-types) · [Web: Slidedown in code](#web-slidedown-in-code) · [Web: Subscription Bell and custom link](#web-subscription-bell-and-custom-link) · [Web: native prompt and browser rules](#web-native-prompt-and-browser-rules) · [Web: back-off](#web-back-off) · [Web: when prompts misbehave](#web-when-prompts-misbehave) · [Web push browser behavior](#web-push-browser-behavior) · [Prove it](#prove-it)

## Principles

- **First-launch exception and copy** [OneSignal messaging practices]: apps whose value is obvious within seconds, such as ride-hailing, can be exceptions. Explain the specific value ("Get a heads-up the moment your order leaves the kitchen. That's it, no promos."). The source says copy/timing changes routinely shift opt-in rates by tens of percentage points; that is its reported outcome, not a guarantee.
- **Ask after a value moment,** not on first launch: after add-to-cart, a profile update, sign in, following a topic, or another commitment action.
- **Start iOS on provisional notifications** (the default starting point), then convert with a soft prompt. The messaging-practices source calls this often the highest-conversion path; most Android apps start with a soft prompt. Apple and Google both recommend explaining the value before asking [OneSignal messaging practices].
- **Explain value with a soft prompt** before the system prompt. Soft prompts never subscribe anyone by themselves; they also keep browsers from auto-blocking you.
- **Re-ask users who declined the soft prompt on a cadence** (e.g. every 2 weeks).
  - Flutter community view (opinion), on re-asking and timing: [FlutterPro](https://flutterpro.design/details/notification-permission-priming): "If the user skips twice, stop asking"; the settings page turns them on later. [ApparenceKit](https://apparencekit.dev/blog/apparencekit-4-update/) asks on an onboarding permission page, and [another ApparenceKit post](https://apparencekit.dev/blog/flutter-notifications-push-and-locale/) "right after app launches or after he has signed in", against the value-moment rule above. The plugin-level Flutter version: ../../mobile/flutter-ux/NOTIFICATIONS-AND-PERMISSIONS.md.
- **Iterate copy and timing, one variable at a time.** On web, start with the native prompt for a few months to get a baseline, then experiment.
- **Offer opt-in controls in a preference center,** and topic choices through categories.
- **The native system prompt cannot be customized** on any platform.
- **Android runtime permission exists only on Android 13 (API 33)+** (released August 2022; since August 31, 2023 new apps and updates on Google Play must target API 33+). Android 12 and lower grant permission automatically on install.

## Mobile: in-app soft prompt

The recommended default; it needs no code release.

- **Prerequisite:** the SDK installed with the `OneSignalInAppMessages` package enabled.
- **Remove every start-up prompt first:** any `requestPermission()` or `optIn()` called on app start, native `requestAuthorizationWithOptions`, Android `requestPermissions`, and any direct push token code. The setup samples in [SETUP-MOBILE.md](SETUP-MOBILE.md) call `requestPermission(false)` on launch for testing only.
- **Use the Push Permission Prompt template** (edit the default or create a new one in **Messages > In-App**). Its **Push Permission Prompt** click action shows the system prompt; if the user already declined the maximum times, it opens the app's notification settings (equal to `requestPermission(fallbackToSettings: true)`). Messages with this click action are never shown to users who already allowed notifications, so the audience can be **Show to all users**.
- **Triggers, lowest to highest conversion:** on app open (rarely optimal); after session time (a good default); a specific user event (best); programmatically through the in-app trigger SDK methods ([MOBILE-SDK-API.md](MOBILE-SDK-API.md#in-app-message-triggers)).
- **Frequency:** only once (low conversion); every time (too aggressive); **Multiple times (recommended)**, e.g. `20` times with a `2 weeks` gap; loosen to `30 days` or `60 days` for low-engagement or utility apps.
- **Example strategy:**
  - Phase 1 (iOS only): turn on **Settings > Apple iOS > Advanced Configuration > Enable iOS 12 direct to history**; send 2 to 3 high-quality notifications in week one.
  - Phase 2: the soft prompt in **Messages > In-App**, audience **Show to all users**, triggered on a high-signal event (acting on a provisional notification, following a topic, add-to-cart, 5 minutes of session time), a CTA with the **Push Permission Prompt** click action, schedule **Multiple times**, max `20` per user, gap `2 weeks` (about 10 months).
  - Phase 3: after 1 to 2 weeks check conversion; instrument soft prompt clicks, dismissals and the system outcome; change one variable at a time.
  - Android and Huawei skip phase 1.
- **Track it:** the in-app click listener (soft prompt button), the in-app lifecycle listener (impressions and dismissals), and the push permission observer (the system prompt's result).
- Building in-app messages is [IN-APP-MESSAGES.md](IN-APP-MESSAGES.md).

## Mobile: programmatic prompting

- **For preference centers, profile screens and in-app events,** call `requestPermission()` or `optIn()` from your own UI.
- **Pass `fallbackToSettings: true`.** `OneSignal.Notifications.requestPermission(true);` (RN and Flutter) shows a fallback prompt linking to Settings after denials beyond the OS limit.
- **After `optOut()` (`notification_types: -2`), `requestPermission()` alone will not change the status.** Use `optIn()`: it requests permission **and** clears the opt-out. `optIn()` with a valid token subscribes; with no valid token it shows the permission prompt; past the OS limit (**once iOS, twice Android**) it shows the fallback prompt.

## iOS provisional (direct to history)

- **iOS 12+.** Provisional notifications have no banner, no sound and no lock-screen alert; they go to Notification Center only. Users tap **Keep...** then **Deliver Quietly** (stays silent, removes the Keep/Turn Off prompts) or **Turn Off** (unsubscribes from all).
- **Toggle:** **Settings > Apple iOS > Advanced Configuration > Enable iOS 12 direct to history**, **unchecked by default**. Requires OneSignal SDK 2.9.0 or newer.
- **Effect:** iOS 12+ subscribers get provisional permission automatically the next time they open the app, with no prompt, and all iOS Subscriptions start Subscribed (`notification_types` bit `64` = Provisional).
- **If the user then denies the standard prompt, all push (provisional included) is turned off.**

## Mobile permission API

| Call | React Native | Flutter |
|---|---|---|
| Request | `OneSignal.Notifications.requestPermission(true);` | `OneSignal.Notifications.requestPermission(true);` |
| App permission | `await OneSignal.Notifications.getPermissionAsync();` | `OneSignal.Notifications.permission` |
| Can still ask (false = already denied) | `await OneSignal.Notifications.canRequestPermissionAsync();` | `OneSignal.Notifications.canRequestPermission` |
| iOS native state | `await OneSignal.Notifications.permissionNative()` | `await OneSignal.Notifications.permissionNative()` |
| Permission observer | `OneSignal.Notifications.addEventListener('permissionChange', onPermissionChange)` | `OneSignal.Notifications.addPermissionObserver(observer)` / `removePermissionObserver(observer)` |
| Opt out / in | `OneSignal.User.pushSubscription.optOut();` / `.optIn();` | `OneSignal.User.pushSubscription.optOut();` / `.optIn();` |
| Opted in? | `await OneSignal.User.pushSubscription.getOptedInAsync();` | `OneSignal.User.pushSubscription.optedIn` |

- **The permission getter is app-level permission only;** it does not reflect `optOut()`. Use `optedIn` for that.
- **iOS `permissionNative`:** `0` NotDetermined, `1` Denied, `2` Authorized, `3` Provisional (iOS 12+), `4` Ephemeral (iOS 14+).

## Web: prompt types

- **The browser's native prompt must be shown and "Allow" clicked** to subscribe. Browsers recommend being selective; OneSignal encourages soft prompts that launch the native prompt only after interest.
- **Dashboard (Typical Site):** **Settings > Push & In-App > Web Settings > Permission Prompt Setup > Add Prompt**. Types: Slidedown (push, optional categories), Email/Phone prompt, Subscription Bell, Custom link, Native permission prompt. Custom Code sets the same through `promptOptions` and `notifyButton` in `init`.
- **Slidedown:** top center on desktop, bottom center on mobile. Action message up to 90 characters, buttons up to 15; font, size and colors are not customizable. **It does not replace the native browser prompt.**
- **Categories:** up to 10; each is stored as a Data Tag with `1` (selected) or `0` (not selected). Key convention `cat_<category>` (lower case, underscores), e.g. `cat_breaking_news`, `cat_sports`. Re-showing it to a subscribed user shows the update text.
- **Email and phone prompt:** built-in validation; creates Email and/or SMS Subscriptions. Custom Code `type` `email`, `sms` or `smsAndEmail`.
- **Auto prompt delays:** **Page Views** AND **Seconds on Page** (both must be met). An auto prompt nobody interacts with keeps showing on each page load until clicked or dismissed. For manual control, turn off Auto Prompt and call the SDK methods.
- **Default Icon** in **Settings > Push & In-App > Web**: PNG, JPG or non-animated GIF, recommended `256×256`; unset shows a generic bell.

## Web: Slidedown in code

- **`promptOptions.slidedown.prompts` is an array.** `type`, `autoPrompt`, `delay`, `text` and `categories` go on each entry, not at the top level next to `appId`.
- **Types:** `push`, `category` (up to 10 categories), `email`, `sms`, `smsAndEmail`. `autoPrompt: true` shows it per `delay`; `false` shows it only through the Slidedown API. `delay: { pageViews: 3, timeDelay: 20 }` = after the 3rd page view and 20 seconds.
- **Text keys:** `actionMessage` (max 90 chars), `acceptButton` (max 15), `cancelButton` (max 15), `emailLabel`, `smsLabel`, `confirmMessage`, `updateMessage`, `positiveUpdateButton`, `negativeUpdateButton`. Categories: `categories: [ {tag: "local_news", label: "Local News"} ]`.

```javascript
<script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
<script>
window.OneSignalDeferred = window.OneSignalDeferred || [];
OneSignalDeferred.push(async function(OneSignal) {
  await OneSignal.init({
    appId: "YOUR_APP_ID",
    notifyButton: {
      enable: true,
    },
    promptOptions: {
      slidedown: {
        prompts: [{
            type: "smsAndEmail",
            autoPrompt: false,
            text: {
              emailLabel: "Insert Email Address",
              smsLabel: "Insert Phone Number",
              acceptButton: "Submit",
              cancelButton: "No Thanks",
              actionMessage: "Receive the latest news, updates and offers as they happen.",
              updateMessage: "Update your push notification subscription preferences.",
              confirmMessage: "Thank You!",
              positiveUpdateButton: "Save Preferences",
              negativeUpdateButton: "Cancel",
            },
            delay: {
              pageViews: 1,
              timeDelay: 20
            },
          },
          {
            type: "category",
            autoPrompt: true,
            text: {
              actionMessage: "We'd like to show you notifications for the latest news and updates.",
              acceptButton: "Allow",
              cancelButton: "Cancel",

              /* CATEGORY SLIDEDOWN SPECIFIC TEXT */
              negativeUpdateButton: "Cancel",
              positiveUpdateButton: "Save Preferences",
              updateMessage: "Update your push notification subscription preferences.",
            },
            delay: {
              pageViews: 3,
              timeDelay: 20
            },
            categories: [{
                tag: "politics",
                label: "Politics"
              },
              {
                tag: "local_news",
                label: "Local News"
              },
              {
                tag: "world_news",
                label: "World News",
              },
              {
                tag: "culture",
                label: "Culture"
              },
            ]
          }
        ]
      }
    }
  });
});
</script>
```

- **Slidedown methods:** `OneSignal.Slidedown.promptPush()`, `promptPushCategories()` (also triggers the native prompt if not yet granted), `promptSms()`, `promptEmail()`, `promptSmsAndEmail()`, each taking `options`; `OneSignal.Slidedown.addEventListener('slidedownShown', fn)`. With `react-onesignal`, call them after `init` resolves.
- **Native prompt directly:** turn off Auto Prompt and call `OneSignal.Notifications.requestPermission()` (subject to browser back-off). Call `isPushSupported()` before prompting programmatically.
- **Event-name source difference:** messaging practices names `slidedown`; the permission/SDK reference names `slidedownShown` below. Preserve the source distinction when choosing the listener [OneSignal messaging practices].
- **Track prompts** with the `permissionPromptDisplay` and `permissionChange` Notifications events and the `slidedownShown` event.
- **Localization:** with Custom Code, detect the browser language and init with different text; the native prompt translates itself. A/B testing prompts: Custom Code plus the Subscription change event plus tags.

## Web: Subscription Bell and custom link

- **Subscription Bell** (`notifyButton`, disabled by default): a bottom-corner widget that opens the native prompt for unsubscribed users. You cannot change its icon image, place it in a top corner, or disable it per page. Options: `enable`, `displayPredicate`, `size` (`'small'|'medium'|'large'`), `theme` (`'default'` or `'inverse'`), `position` (`'bottom-left'|'bottom-right'`), `offset`, `prenotify`, `showCredit`, `text`, `colors`.
- **Bell `text` keys:** `'launcher.button.aria-label'` (default `'Manage notifications'`), `'tip.state.unsubscribed'`, `'tip.state.subscribed'`, `'tip.state.blocked'`, `'message.prenotify'`, `'message.action.subscribed'`, `'message.action.resubscribed'`, `'message.action.unsubscribed'`, `'dialog.main.title'`, `'dialog.main.button.subscribe'`, `'dialog.main.button.unsubscribe'`, `'dialog.blocked.title'`, `'dialog.blocked.message'`.
- **Bell `colors` keys:** `'circle.background'`, `'circle.foreground'`, `'badge.background'`, `'badge.foreground'`, `'badge.bordercolor'`, `'pulse.color'`, `'dialog.button.background.hovering'`, `'dialog.button.background.active'`, `'dialog.button.background'`, `'dialog.button.foreground'`.
- **`displayPredicate` can return `false` or a Promise of false** to hide the Bell [OneSignal messaging practices].
- **Hide the Bell once subscribed:**

```javascript
notifyButton: {
    /* Your other Subscription Bell settings here ... */
    enable: true,
    displayPredicate: function() {
      /* The user is subscribed, so we want to return "false" to hide the Subscription Bell */
      return !OneSignal.Notifications.permission
    },
}
```

- **Custom link** (Custom Code): `promptOptions.customlink` with `enabled: true`, `style` (`"button"` or `"link"`), `size`, `color: { button, text }`, `text: { subscribe, unsubscribe, explanation }`, `unsubscribeEnabled`. Render into `<div class='onesignal-customlink-container'></div>`. CSS classes: `onesignal-customlink-container`, `onesignal-customlink-subscribe`, `onesignal-customlink-explanation`, `state-subscribed`, `state-unsubscribed`, `button`, `link`, `small`, `medium`, `large`, `hide`; every element also has `onesignal-reset`.

### Subscription Bell initialization example

The messaging-practices source’s complete initialization example is retained here; the `offset`, `text` and `colors` keys were omitted there. The Bell suits returning visitors and people who dismissed a prompt.

```html
<script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
<script>
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  OneSignalDeferred.push(function(OneSignal) {
    OneSignal.init({
      appId: "YOUR_APP_ID",
      notifyButton: {
        enable: true,
        size: 'medium',
        theme: 'default',
        position: 'bottom-right',
        showCredit: false,
        displayPredicate: function() {
          return !OneSignal.Notifications.permission;
        }
      }
    });
  });
</script>
```

(Trimmed from the full docs example: the `offset`, `text` and `colors` keys are omitted.)

## Web: native prompt and browser rules

- **Required and not customizable;** it is triggered automatically after the soft prompts.
- **Chrome 80+** uses a quieter UI for users who frequently deny and for sites with high denial rates. Chrome back-off on "X": after 3 attempts it is suppressed for **7 days**.
- **Typical Site native prompt config** automatically shows the Slide Prompt on Chrome mobile (a deliberate double prompt on Android) and on Firefox.
- **User gesture required:** Firefox 72+ and Safari 12.1+. The Typical Site native prompt config won't work on Safari.
- **Edge** is trust-based: untrusted sites get a bell icon in the browser bar.
- **iOS:** only from a tap inside a Home Screen web app ([SETUP-WEB.md](SETUP-WEB.md#ios-web-push-home-screen-web-app)). Calling `Notification.requestPermission()` yourself skips the OneSignal subscription.

- **Source difference on Safari auto-prompts:** messaging practices says Typical Site auto-shows Slidedown on Chrome mobile, Firefox and Safari; the permission reference above says Typical Site native prompt config does not work on Safari. Keep the explicit user-gesture and iOS setup requirements; confirm the selected setup in the current dashboard.

## Web: back-off

| Prompt | After 1st dismissal | 2nd | 3rd and later |
|---|---|---|---|
| Slidedown (Push, Category, Email/Phone) | 3 days | 7 days | 30 days |

- **The web SDK reference says** dismissed Slidedown calls are ignored for "at least three days" and further declines lengthen the wait; the permission prompts page gives the 3 / 7 / 30 day schedule above.
- **Bypass it** with the Slidedown methods and `{force: true}`, bound to a UI event such as a button click. The native prompt's back-off is browser-controlled and cannot be bypassed. Clearing cookies or browser data resets the cycle.

## Web: when prompts misbehave

- **Native prompt doesn't show:** the browser blocked the site (`chrome://settings/content/notifications`), the user already allowed or subscribed, Incognito/Private/Guest mode, an unsupported browser, or the iOS requirements are not met.
- **Slide prompt keeps showing:** incognito, or it is triggered programmatically without Auto Prompt.
- **Incognito:** the Slidedown can still appear with `autoPrompt: true` but subscriptions typically don't persist, and `isPushSupported()` does not detect private browsing.
- **In-app webviews** (Instagram, TikTok, Facebook) do not support web push.

## Web push browser behavior

- **Permission states:** Default, Granted, Denied (temporary after repeated "x", permanent after Block or a settings change). Clearing cookies or site data stops notifications temporarily, but the user may be re-subscribed automatically on return if permission was not removed.
- **Browser closed:** Chrome, Firefox, Opera and Edge receive with the browser closed on Android and Windows, not on macOS; Safari does on macOS. Subscribers have up to 3 days to retrieve the last known missing notification before it expires.
- **Test a prompt like a first-time visitor:** not in incognito. Reset the permission, delete site data, prompt and Allow, check the console, read `OneSignal.User.PushSubscription.id` in the console, add that subscription to Test Users, then send via Test & Preview > Send Test Push.

The browser-closed claim above differs from the browser-closed troubleshooting limitation in [MIGRATION-AND-TROUBLESHOOTING.md](MIGRATION-AND-TROUBLESHOOTING.md); both source claims remain attributed and require platform-specific confirmation.

## Prove it

- No `requestPermission()` or `optIn()` runs on app start or page load in the production build; the first system prompt appears only after a soft prompt's "yes" or a user action.
- Mobile: an in-app message with the **Push Permission Prompt** click action exists, triggered on session time or a user event, frequency **Multiple times** with a gap of 2 weeks or more; it does not appear for a user who already allowed notifications.
- Programmatic prompts pass `fallbackToSettings: true`, and preference-center re-enables call `optIn()`, not `requestPermission()` alone.
- iOS provisional: with **Enable iOS 12 direct to history** on, a fresh install shows as Subscribed with no prompt and `notification_types` includes bit `64`.
- Web: `promptOptions.slidedown.prompts` is an array with `type` on each entry; action message 90 characters or less, buttons 15 or less; any `{force: true}` call runs from a click handler.
- Web: category choices land as `cat_*` tags with `1`/`0` on the User.
