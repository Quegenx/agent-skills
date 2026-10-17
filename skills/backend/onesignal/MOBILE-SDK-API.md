# Mobile SDK API

The calls a React Native or Flutter app makes after setup: logging, notification click and foreground handling, clearing notifications, in-app message triggers, Live Activities, outcomes, location and consent. Call `initialize` during startup, with consent and log level set before it. Setup is [SETUP-MOBILE.md](SETUP-MOBILE.md); `login`, aliases, tags and the user and push subscription observers are [USER-MODEL.md](USER-MODEL.md); permission calls are [PERMISSIONS.md](PERMISSIONS.md).

## Initialize, log, consent

- **`OneSignal.initialize("ONESIGNAL_APP_ID");`** (RN and Flutter) during startup. To delay it, use the privacy methods.
- **`setLogLevel` goes before `initialize`.** Levels `None`, `Fatal`, `Error`, `Warn`, `Info`, `Debug`, `Verbose`. RN `OneSignal.Debug.setLogLevel(LogLevel.Verbose);`, Flutter `OneSignal.Debug.setLogLevel(OSLogLevel.verbose);`. The debug log page shows `6` instead of `LogLevel.Verbose` for RN.
- **`setAlertLevel`** shows logs as alert dialogs: RN `OneSignal.Debug.setAlertLevel(LogLevel.Verbose);`, Flutter `OneSignal.Debug.setAlertLevel(OSLogLevel.none);`. Remove it before submitting to the app store.
- **Consent goes before `initialize`.** RN `OneSignal.setConsentRequired(true);` then `OneSignal.setConsentGiven(true);`; Flutter `OneSignal.consentRequired(true);` then `OneSignal.consentGiven(true);`. Without consent no data is sent and no Subscription is created; setting it to false later stops updates (stored data is unchanged). Consent before init also keeps a paywalled app from creating MAUs.

```javascript
// Call BEFORE OneSignal.initialize()
OneSignal.setConsentRequired(true);
OneSignal.initialize('YOUR_APP_ID');

// Later, after the user grants consent (e.g., via a consent dialog)
OneSignal.setConsentGiven(true);
```

## Notification click

- **Fires when a notification opens the app.** The app is already launched: do not relaunch or duplicate navigation.
- RN `OneSignal.Notifications.addEventListener('click', (event) => {...})`; Flutter `OneSignal.Notifications.addClickListener((event) {...})`.
- **RN:** remove with the same function reference (see [SETUP-MOBILE.md](SETUP-MOBILE.md#react-native-bare)). **Flutter:** Debug mode plus a force-closed app prevents the click listener from registering; test in release.

## Foreground notifications

- **OneSignal displays foreground notifications automatically.** `event.preventDefault()` stops the display; you then have about **25 seconds** before calling `display()` (the duplicated-notifications page says "within 30 seconds"; confirm in the current docs). Never calling `display()` after `preventDefault()` silently discards the notification.
- **A custom iOS `UNUserNotificationCenterDelegate` `willPresent` handler** can force display regardless. The listener runs after Notification Service Extensions.

React Native:

```javascript
OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
  console.log("Foreground notification:", event.getNotification().title);

  // Stop the notification from displaying automatically
  // event.preventDefault();

  // Show it manually when ready
  // event.getNotification().display();
});
```

Flutter:

```dart
OneSignal.Notifications.addForegroundWillDisplayListener((event) {
  print("Foreground notification: ${event.notification.title}");

  // Stop the notification from displaying automatically
  // event.preventDefault();

  // Show it manually when ready
  // event.notification.display();
});
```

## Clearing notifications

- **`OneSignal.Notifications.clearAll()`** (RN and Flutter) clears notifications and resets the badge to `0`. Android removes only OneSignal-created notifications and marks them dismissed; iOS removes all delivered notifications, including local ones and other providers'.
- **On Android use OneSignal's methods,** not `NotificationManager.cancel()`/`cancelAll()` (those notifications are restored on restart). In a cross-platform app, gate launch-time clearing to Android.
- **Android only:** `OneSignal.Notifications.removeNotification(id)` (the `androidNotificationId`; store it on arrival, there is no lookup API) and `removeGroupedNotifications("GROUP_KEY")` (`android_group`). On iOS use `collapse_id` to replace a notification, or Apple's `removeDeliveredNotifications(withIdentifiers:)`.

## In-app message triggers

- **In-app messages need no code.** Triggers are local only (not persisted to the backend): `OneSignal.InAppMessages.addTrigger("KEY", "VALUE")`, `addTriggers({...})`, `removeTrigger`, `removeTriggers([...])`, `clearTriggers()`.
- **Pause:** RN `OneSignal.InAppMessages.setPaused(true);`, Flutter `OneSignal.InAppMessages.paused(true);`.
- **Lifecycle:** RN `addEventListener('willDisplay' | 'didDisplay' | 'willDismiss' | 'didDismiss', ...)`; Flutter `addWillDisplayListener`, `addDidDisplayListener`, `addWillDismissListener`, `addDidDismissListener`.
- **Click:** RN `OneSignal.InAppMessages.addEventListener('click', ...)`, Flutter `addClickListener`; the event has `actionId`, `urlTarget`, `url`, `closingMessage`.
- Building and targeting the messages is [IN-APP-MESSAGES.md](IN-APP-MESSAGES.md).

## Live Activities

- **Started in the foreground only;** they appear with the iOS Provisional Authorization UI. They need a `.p8` APNs key and, on Expo, the plugin's `liveActivities` prop ([SETUP-MOBILE.md](SETUP-MOBILE.md#expo)). Call `OneSignal.LiveActivities.setupDefault()` after `initialize` and before any other Live Activity API.

```javascript
import { OneSignal } from 'react-native-onesignal'

//Push To Start
OneSignal.LiveActivities.setupDefault()

//Launching the Live Activity from within the app (not needed for push to start)
const activityId = "my_activity_id"
const attributes = { title: "Sample Title" } ;
const content = { message: { en: "message" } };
OneSignal.LiveActivities.startDefault(activityId, attributes, content);
```

- **Flutter:** `OneSignal.LiveActivities.setupDefault();` and `OneSignal.LiveActivities.startDefault(activityId, {"title": "Welcome!"}, {"message": {"en": "Hello World!"}});`.
- **Enter and exit:** RN `enter('ACTIVITY_ID', token, cb)`, Flutter `enterLiveActivity("ACTIVITY_ID", token)` associates the `activityId` with the temporary push token; `exit('ACTIVITY_ID')`.
- Updating them from the server is [LIVE-ACTIVITIES.md](LIVE-ACTIVITIES.md).

## Outcomes

- **On `OneSignal.Session`** (RN and Flutter): `addOutcome("NAME")`, `addUniqueOutcome("NAME")` (once per session), `addOutcomeWithValue("NAME", 3.14)`.

## Location

- **Three steps:** native permissions and dependencies; `OneSignal.Location.setShared(true)`; `OneSignal.Location.requestPermission()` or an in-app message. Read with `OneSignal.Location.isShared()`.
- **`LocationManager.startGetLocation: not possible, no location dependency found`:** add `implementation 'com.google.android.gms:play-services-location:21.0.1'` to `app/build.gradle`.
- **To remove the location module entirely,** use `ONESIGNAL_DISABLE_LOCATION` ([SETUP-MOBILE.md](SETUP-MOBILE.md)).

## Prove it

- `setConsentRequired`/`consentRequired` and `setLogLevel` run before `initialize`; verbose logging and `setAlertLevel` are gone from the store build.
- Tapping a notification while the app is backgrounded runs the click handler once with no duplicate navigation; on Flutter this is checked in a release build.
- Any `foregroundWillDisplay` handler that calls `preventDefault()` calls `display()` (or deliberately drops) within about 25 seconds.
- Launch-time `clearAll()` is gated to Android, and Android code never calls `NotificationManager.cancelAll()`.
- Live Activity code calls `setupDefault()` right after `initialize`.
