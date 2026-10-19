# Firebase messaging in Flutter

FCM registration, message handling and sending from [ApparenceKit](https://apparencekit.dev/blog/flutter-notifications-push-and-locale/), plus the time-sensitive payload from [FlutterPro](https://flutterpro.design/details/time-sensitive-notifications). Existing API corrections cite Firebase and pub.dev. Permission timing, priming, denial behavior and local-notification UX remain in [Flutter UX](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/NOTIFICATIONS-AND-PERMISSIONS.md); the kit-specific helpers below are source examples rather than standalone Firebase APIs.

## FCM: push is not a notification

[ApparenceKit](https://apparencekit.dev/blog/flutter-notifications-push-and-locale/):

- **Distinguish notification and data messages.** In the background, FCM displays a notification message on the app's behalf; app code processes data messages. Foreground notification messages do not display a visible notification by default on Android or iOS. [FCM message types](https://firebase.google.com/docs/cloud-messaging/customize-messages/set-message-type), [Flutter receive guide](https://firebase.google.com/docs/cloud-messaging/flutter/receive). P2 correction: ApparenceKit's blanket claim that a push never displays anything by itself, and the old background-handler line saying there is usually nothing to do, omitted the message type.
- **Ask permission through the plugin** (verbatim; see [When to ask](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/NOTIFICATIONS-AND-PERMISSIONS.md#when-to-ask-for-notifications) for the timing):
  ```dart
  import 'package:firebase_messaging/firebase_messaging.dart';

  FirebaseMessaging.instance.requestPermission();
  ```

## FCM: register the device

[ApparenceKit](https://apparencekit.dev/blog/flutter-notifications-push-and-locale/):

1. Ask FCM to register the device; FCM returns a unique registration token; store it in your database.
2. **Tokens expire.** Firebase sometimes refreshes the token; listen for token updates and update the stored one.
3. **Several devices per user:** generate your own unique device ID, keep it in shared preferences, and store tokens in a separate devices table keyed by it, so logout replaces or removes the right token. "You can't use the deviceId from the device as Apple and Google don't like it anymore."
4. **Register on every app start and every login,** skipping when the device is already saved (verbatim):
   ```dart
   Future<void> register(String userId) async {
     final device = await _getFromPrefs();
     if (device != null) {
       return;
     }
     final newDevice = await _deviceApi.get();
     final response = await _deviceApi.register(userId, newDevice);
     await _saveInPrefs(response);
   }
   ```
   ```dart
   import 'package:apparence_kit/core/shared_preferences/shared_preferences.dart';

   Future<void> _saveInPrefs(DeviceEntity device) async {
     final json = device.toJsonForPrefs();
     final data = jsonEncode(json);
     await _prefs.setString(_devicePrefsKey, data);
   }

   Future<DeviceEntity?> _getFromPrefs() async {
     final deviceJson = _prefs.getString(_devicePrefsKey);
     if (deviceJson != null) {
       final deviceMap = jsonDecode(deviceJson) as Map<String, dynamic>;
       return DeviceEntity.fromPrefs(deviceMap);
     }
     return null;
   }
   ```
   ```dart
   // open lib > core > states > user_state.dart

   ...
   try {
       final _ = await _deviceRepository.register(userId);
     } catch (err) {
       _logger.e(err);
       _logger.e('''
         ❌ Your device seems not to be registered.
         Check that you correctly setup a device registration API
         see: `lib/modules/notifications/api/device_api.dart`
       ''');
     }
     _deviceRepository.onTokenUpdate(_onUpdateToken);
   ...
   ```
   `apparence_kit/...`, `DeviceEntity` and `_deviceApi` are the kit's own code; the pattern is the reusable part.

## FCM: the three handlers

[ApparenceKit](https://apparencekit.dev/blog/flutter-notifications-push-and-locale/) (verbatim; init them every time the app starts):

```dart
FirebaseMessaging.onMessage.listen(handler);

FirebaseMessaging.onBackgroundMessage(handler);

FirebaseMessaging.onMessageOpenedApp.listen(handler);
```

- **`onMessage`:** the app is in the foreground and a push arrives.
- **`onBackgroundMessage`:** handles background messages; distinguish notification display from app processing of data as [above](#fcm-push-is-not-a-notification). The handler must be a top-level function, not inside a class. [Firebase](https://firebase.google.com/docs/cloud-messaging/flutter/receive)
- **`onMessageOpenedApp`:** the user tapped a notification; use it to redirect the user.
- **Official additions** ([Firebase: receive messages in Flutter](https://firebase.google.com/docs/cloud-messaging/flutter/receive)): the background handler "must not be an anonymous function", and from Flutter 3.3.0 it "must be annotated with `@pragma('vm:entry-point')` right above the function declaration":
  ```dart
  @pragma('vm:entry-point')
  Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  ```
  `onMessageOpenedApp` only covers opening from the background; a tap that launches the app from terminated arrives through `getInitialMessage()`, and the doc says to handle both.
- **Android parsing:** "Android notification deserialization should be made from RemoteMessage.notification property" [ApparenceKit CLI 3.0.0](https://apparencekit.dev/blog/apparencekit-cli-3-update/).

## FCM: show it in the foreground

- **Foreground presentation:** ApparenceKit uses `flutter_local_notifications` to show a local notification. [ApparenceKit](https://apparencekit.dev/blog/flutter-notifications-push-and-locale/). Follow the [message-type distinction above](#fcm-push-is-not-a-notification); the old "automatically except in the foreground" line was too broad. For visible foreground notifications the [Firebase guide](https://firebase.google.com/docs/cloud-messaging/flutter/receive) calls for a high-priority notification channel on Android and allows changing presentation options on iOS.
- **Build the notification from `message.data` and publish it to an app-wide queue** that any part of the app can listen to [ApparenceKit](https://apparencekit.dev/blog/flutter-notifications-push-and-locale/) (verbatim with indentation normalized; `Notification.from` and the publisher are the kit's own classes):
  ```dart
  @override
  Future<void> init() async {
    await _notificationsApi.requestPermission();
    _notificationsApi.setForegroundHandler(_onMessage);
    ...
  }

  Future<void> _onMessage(RemoteMessage message) async {
    final notification = Notification.from(
      message.data,
      notifierApi: _localNotifier,
      notifierSettings: _notificationSettings,
    );
    _notificationPublisher.publish(notification);
  }
  ```
- **Android settings need channels and priority;** images and sounds are optional [ApparenceKit](https://apparencekit.dev/blog/flutter-notifications-push-and-locale/).
- **The article's conclusion is garbled.** Its bullets "A system notification will shows when the app is in foreground / A local notification will shows when the app is in background" contradict its own body (above); follow the body.

## FCM: sending, topics, APNs key

[ApparenceKit](https://apparencekit.dev/blog/flutter-notifications-push-and-locale/):

- **Sending:** read the users' tokens from your database and send them to the FCM server, which delivers per platform (on iOS it proxies to Apple's push service). "You can't send more than 500 tokens at once" per request (the article gives no date).
- **Topics** send to a group, for example every user about a new feature: `_notificationsApi.registerTopic('general');` (a kit wrapper; the FCM call underneath isn't shown).
- **APNs Auth Key:** iOS needs it uploaded to Firebase under Project settings > Cloud Messaging. "You can't have more than two keys and you can download it only once. So keep this file in a safe place. You can use the same key for all your apps." The `.p8` steps are also in [onesignal SETUP-MOBILE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/onesignal/SETUP-MOBILE.md).

## Open a URL on notification tap

[ApparenceKit](https://apparencekit.dev/flutter-tips/launch-web-page-on-push-notification-tap/) (the article has no code): send the URL in the push data. On tap, read the data, check that it is a link notification with a `url` key, and open it with a URL-launching package, inside a `try...catch` so a bad link can't crash the app. Handle a background tap through `onMessageOpenedApp` and a terminated launch through `getInitialMessage()` ([handlers](#fcm-the-three-handlers), [Firebase receive guide](https://firebase.google.com/docs/cloud-messaging/flutter/receive)); the source named only `onMessageOpenedApp`.

## Time-sensitive FCM payload

[FlutterPro](https://flutterpro.design/details/time-sensitive-notifications). The capability, local-notification example and use-case limits are in [Time-sensitive notifications on iOS](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/NOTIFICATIONS-AND-PERMISSIONS.md#time-sensitive-notifications-on-ios).

- **Push with `firebase_messaging`:** the level lives in the APNs payload, so the server sets it, not the device. With the FCM HTTP v1 API, one key under `aps` (verbatim):
  ```json
  {
    "message": {
      "token": "<device token>",
      "notification": {
        "title": "Your order is arriving",
        "body": "Meet the courier at the door"
      },
      "apns": {
        "payload": {
          "aps": {
            "interruption-level": "time-sensitive"
          }
        }
      }
    }
  }
  ```
  Firebase Admin SDKs support the key too, but where it goes differs per language. The Firebase console can't send it at all, only the API can.

## Prove it

- The `onBackgroundMessage` handler is top-level, not anonymous, and has `@pragma('vm:entry-point')` from Flutter 3.3.0. [Firebase receive guide](https://firebase.google.com/docs/cloud-messaging/flutter/receive)
- Send the selected message type with the app in the foreground, background and terminated: notification display and data handling follow the documented message-type distinction, and taps route correctly from background (`onMessageOpenedApp`) and terminated (`getInitialMessage`). [Firebase receive guide](https://firebase.google.com/docs/cloud-messaging/flutter/receive)
- Log out on one of two devices: only that device's token is removed. [ApparenceKit](https://apparencekit.dev/blog/flutter-notifications-push-and-locale/)
- The time-sensitive payload is used with the capability and minute-scale use cases selected in [Flutter UX](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/NOTIFICATIONS-AND-PERMISSIONS.md#time-sensitive-notifications-on-ios). [FlutterPro](https://flutterpro.design/details/time-sensitive-notifications)
