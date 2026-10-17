# Notifications and permissions

How a Flutter app asks for runtime permissions without losing users, picks photos with no permission at all, primes the notification prompt, wires FCM push (`firebase_messaging`) with local notifications, marks iOS notifications time-sensitive, and keeps scheduled notifications right when the timezone or clock changes. Sources: FlutterPro tips by Kamran Bekirov (flutterpro.design) and ApparenceKit tips and blog posts (apparencekit.dev), checked against pub.dev and Firebase docs where a snippet was flagged. Device timezone lookup, status bar, screenshots and home widgets are in [DEVICE-FEATURES.md](DEVICE-FEATURES.md). OneSignal's own prompt flow is [backend/onesignal/PERMISSIONS.md](../../backend/onesignal/PERMISSIONS.md).

**Contents:** [Runtime permissions](#runtime-permissions) · [Denied: explain, then open Settings](#denied-explain-then-open-settings) · [Pick photos without a permission](#pick-photos-without-a-permission) · [When to ask for notifications](#when-to-ask-for-notifications) · [The priming screen](#the-priming-screen) · [FCM: push is not a notification](#fcm-push-is-not-a-notification) · [FCM: register the device](#fcm-register-the-device) · [FCM: the three handlers](#fcm-the-three-handlers) · [FCM: show it in the foreground](#fcm-show-it-in-the-foreground) · [FCM: sending, topics, APNs key](#fcm-sending-topics-apns-key) · [Open a URL on notification tap](#open-a-url-on-notification-tap) · [Time-sensitive notifications on iOS](#time-sensitive-notifications-on-ios) · [Reschedule on timezone or clock change](#reschedule-on-timezone-or-clock-change) · [Prove it](#prove-it)

## Runtime permissions

[ApparenceKit](https://apparencekit.dev/flutter-tips/check-app-permissions-flutter/): iOS and Android require you to ask the user before the app takes pictures, saves to the photo gallery or records sound. Use the `permission_handler` package (https://pub.dev/packages/permission_handler).

```dart
import 'package:permission_handler/permission_handler.dart';
```

Request one, request several, or read the status without prompting (verbatim):

```dart
// Request one permission
[Permission.camera].request();
```

```dart
// Request multiple permissions (chaining requests)
[Permission.camera, Permission.microphone].request();
```

```dart
// Simply check the status of the permission
final cameraPermission = await Permission.camera.status;
final microphonePermission = await Permission.microphone.status;
```

- **The official form** ([permission_handler 13.0.2](https://pub.dev/packages/permission_handler)): one permission is requested on the permission itself, and the list form returns a map of statuses. The article's list form for a single permission works but discards the result. Official:
  ```dart
  if (await Permission.contacts.request().isGranted) {
    // Either the permission was already granted before or the user just granted it.
  }
  Map<Permission, PermissionStatus> statuses = await [
    Permission.location,
    Permission.storage,
  ].request();
  ```
- **Gate the feature widget, not the screen.** "It's best practice to embed permission checks directly into your UI flow." Wrap the feature in a permission widget that builds the feature only once permissions are handled (verbatim; `CameraPermission` is the article's own widget, `CameraAwesomeBuilder` is from the author's CamerAwesome package):
  ```dart
  @override
  Widget build(BuildContext context) {
    return CameraPermission(
      child: CameraAwesomeBuilder.custom(
        builder: (state, preview) {
          // This part of your UI will only build if permissions are handled
          // ...
        }
      )
    );
  }
  ```

## Denied: explain, then open Settings

- **Never a black screen.** [ApparenceKit](https://apparencekit.dev/blog/app-showcase-uly/), from the author's Uly app: "If the user refused the permissions we shows a nice message to explain why we need it, and a button to go to the settings. That way you don't show a black screen where you could lose people."
- **Why Settings:** after a deny, apps "(especially on iOS) often cannot re-prompt", so guide the user to the app's OS settings page to enable it by hand [ApparenceKit](https://apparencekit.dev/flutter-tips/open-os-app-settings/).
- **Two ways to open it** [ApparenceKit](https://apparencekit.dev/flutter-tips/open-os-app-settings/): `url_launcher` with platform URIs (`app-settings:` on iOS, `package:your.app.id` on Android), or the "more straightforward" `openAppSettings()` from `permission_handler`. The article has no code; the [permission_handler README](https://pub.dev/packages/permission_handler) shows it after a permanent deny:
  ```dart
  if (await Permission.speech.request().isPermanentlyDenied) {
    openAppSettings();
  }
  ```
- **Notifications too:** "Every OS now handles notifications permissions for each apps. If a user refuse them, he has to go in his OS settings to enable them", so you don't need your own notification settings page for the permission itself [ApparenceKit](https://apparencekit.dev/blog/flutter-notifications-push-and-locale/). OneSignal's equivalent is `requestPermission(fallbackToSettings: true)` ([PERMISSIONS.md](../../backend/onesignal/PERMISSIONS.md#mobile-programmatic-prompting)).

## Pick photos without a permission

[FlutterPro](https://flutterpro.design/details/native-photo-picker): to pick a photo, use the native photo picker instead of asking for gallery permission. It opens outside the app, the user picks a photo, and the app gets only that photo: no permission dialog, no "Allow access to all your photos", no trip to Settings after a deny.

`image_picker` (https://pub.dev/packages/image_picker) uses it on iOS out of the box. On Android turn it on once at startup (verbatim):

```dart
final ImagePickerPlatform picker = ImagePickerPlatform.instance;
  
if (picker is ImagePickerAndroid) {
  picker.useAndroidPhotoPicker = true;
}
```

Then picking is one line, with no permission code around it:

```dart
final XFile? photo = await ImagePicker().pickImage(
  source: .gallery,
);
```

- **`source: .gallery`** is a dot shorthand, which needs Dart 3.10 ([dart/LANGUAGE.md](../dart/LANGUAGE.md#dot-shorthands)); on older SDKs write `ImageSource.gallery`.
- **Android versions** ([image_picker_android 0.8.13+25](https://pub.dev/packages/image_picker_android)): "On Android 16 and above, gallery image, video, and mixed-media picks always use the Android Photo Picker. `ImagePickerAndroid.useAndroidPhotoPicker` has no effect on those versions." On Android 15 and below the flag turns it on; set it "before calling any `image_picker` APIs", and it is also required for the `limit` option. The imports are `package:image_picker_android/image_picker_android.dart` and `package:image_picker_platform_interface/image_picker_platform_interface.dart`.
- **Ask for gallery permission only when the app needs the whole library,** like a backup app [FlutterPro](https://flutterpro.design/details/native-photo-picker). Google Play says the same for `READ_MEDIA_IMAGES` ([google-play/POLICY-AND-PREFLIGHT.md](../google-play/POLICY-AND-PREFLIGHT.md)).

## When to ask for notifications

You get one shot at the system dialog. "On iOS, after "Don't Allow" it never shows again, the user has to dig it out of Settings. Android 13+ is close, two denies and it's permanent" [FlutterPro](https://flutterpro.design/details/notification-permission-priming). The sources disagree on the moment; this is timing opinion, so each is tagged:

- **After a value moment** [FlutterPro](https://flutterpro.design/details/notification-permission-priming): "Don't ask for notification permission when the app opens. The user just got here, they have no reason to say yes." Ask when the benefit is obvious: right after an order is placed, for "Get order status updates"; in the author's prayer-times app, when the user configures prayer times, with examples of the daily reminders for the 5 prayers.
- **At launch or after sign-in** [ApparenceKit](https://apparencekit.dev/blog/flutter-notifications-push-and-locale/): "For notifications I like to ask it right after app launches or after he has signed in. And that's the same on iOS, Android and web."
- **After a value moment, never first launch** (OneSignal, [PERMISSIONS.md](../../backend/onesignal/PERMISSIONS.md#principles)) and **after activation, never on cold open** ([app-growth/RETENTION-AND-MONETIZATION.md](../app-growth/RETENTION-AND-MONETIZATION.md)).

How often to re-ask also differs:

- **Stop after two skips** [FlutterPro](https://flutterpro.design/details/notification-permission-priming): "If the user skips twice, stop asking. They can turn notifications on from your settings page when they want them."
- **Re-ask on a cadence** (OneSignal, [PERMISSIONS.md](../../backend/onesignal/PERMISSIONS.md#mobile-in-app-soft-prompt)): e.g. every 2 weeks, up to `20` times.

## The priming screen

[FlutterPro](https://flutterpro.design/details/notification-permission-priming): don't show the system dialog directly. Show your own page or modal first, with the concrete benefit and two buttons, "Enable notifications" and "Skip". Only the enable tap triggers the system dialog (verbatim):

```dart
Future<void> _onEnableTap() async {
  final PermissionStatus status = await Permission.notification.request();
  ...
}
```

"This layer is what protects the one shot. A "Skip" costs nothing, you can ask again later at another good moment. A deny on the system dialog is forever."

## FCM: push is not a notification

[ApparenceKit](https://apparencekit.dev/blog/flutter-notifications-push-and-locale/):

- **A push message does not show anything by itself.** "Every time you receive a push notification, your phone will not show a local notification. That's up to you to show it or not." A push can also update the app in realtime with no visible message; in a chat app the push arrives, then the app shows a local notification for the new message.
- **Ask permission through the plugin** (verbatim; see [When to ask](#when-to-ask-for-notifications) for the timing):
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
- **`onBackgroundMessage`:** the app is in the background; Firebase shows the notification itself, so usually nothing to do. The handler must be a top-level function, not inside a class, "Either it won't work."
- **`onMessageOpenedApp`:** the user tapped a notification; use it to redirect the user.
- **Official additions** ([Firebase: receive messages in Flutter](https://firebase.google.com/docs/cloud-messaging/flutter/receive)): the background handler "must not be an anonymous function", and from Flutter 3.3.0 it "must be annotated with `@pragma('vm:entry-point')` right above the function declaration":
  ```dart
  @pragma('vm:entry-point')
  Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  ```
  `onMessageOpenedApp` only covers opening from the background; a tap that launches the app from terminated arrives through `getInitialMessage()`, and the doc says to handle both.
- **Android parsing:** "Android notification deserialization should be made from RemoteMessage.notification property" [ApparenceKit CLI 3.0.0](https://apparencekit.dev/blog/apparencekit-cli-3-update/).

## FCM: show it in the foreground

- **Firebase shows notifications automatically except in the foreground,** so show a local notification yourself there with `flutter_local_notifications` (https://pub.dev/packages/flutter_local_notifications) [ApparenceKit](https://apparencekit.dev/blog/flutter-notifications-push-and-locale/). Official ([Firebase](https://firebase.google.com/docs/cloud-messaging/flutter/receive)): foreground notification messages "won't display a visible notification by default, on both Android and iOS"; on Android "you must create a "High Priority" notification channel", and on iOS you can change the app's presentation options.
- **Build the notification from `message.data` and publish it to an app-wide queue** that any part of the app can listen to [ApparenceKit](https://apparencekit.dev/blog/flutter-notifications-push-and-locale/) (verbatim; `Notification.from` and the publisher are the kit's own classes):
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
- **APNs Auth Key:** iOS needs it uploaded to Firebase under Project settings > Cloud Messaging. "You can't have more than two keys and you can download it only once. So keep this file in a safe place. You can use the same key for all your apps." The `.p8` steps are also in [backend/onesignal/SETUP-MOBILE.md](../../backend/onesignal/SETUP-MOBILE.md).

## Open a URL on notification tap

[ApparenceKit](https://apparencekit.dev/flutter-tips/launch-web-page-on-push-notification-tap/) (the article has no code): send the URL in the push data. On tap, read the data, check that it is a link notification with a `url` key, and open it with a URL-launching package, inside a `try...catch` so a bad link can't crash the app. The tap arrives through `onMessageOpenedApp` ([handlers](#fcm-the-three-handlers)).

## Time-sensitive notifications on iOS

[FlutterPro](https://flutterpro.design/details/time-sensitive-notifications):

- **What it does:** since iOS 15, time-sensitive notifications are delivered immediately, break through Focus and scheduled summaries, and stay in Notification Center until the user opens them.
- **Enable the capability first,** "otherwise iOS ignores the level and treats the notification as a normal one": Xcode > Runner target > Signing & Capabilities > add **Time Sensitive Notifications**. No extra prompt; the regular notification permission covers it.
- **Local notifications** with `flutter_local_notifications`, one parameter in the iOS details (verbatim):
  ```dart
  await notifications.show(
    0,
    'Your order is arriving',
    'Meet the courier at the door',
    const NotificationDetails(
      iOS: DarwinNotificationDetails(
        interruptionLevel: InterruptionLevel.timeSensitive,
      ),
    ),
  );
  ```
  The [flutter_local_notifications 22.3.2 README](https://pub.dev/packages/flutter_local_notifications) shows `show` both with positional `id, title, body, details` and, in its grouping example, with named `id:` and `notificationDetails:`; match the signature of the version you install.
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
- **Use it for events that expire in minutes:** a courier arriving, a ride pulling up, a login code, a reservation about to be released. "Order shipped", price drops and likes are not time-sensitive; send them as normal notifications. OneSignal's field for the same level is in [MESSAGING-PRACTICES.md](../../backend/onesignal/MESSAGING-PRACTICES.md#ios-interruption-levels-and-relevance).

## Reschedule on timezone or clock change

[FlutterPro](https://flutterpro.design/details/timezone-change):

- **The bug:** `zonedSchedule` turns your `TZDateTime` into a UTC moment and gives that to the OS, which keeps only that moment, not the local time you meant. When the user flies to another country, or clocks shift for daylight saving, it still fires at the old UTC moment, and the local time is wrong.
- **Detect it with two values:** the timezone name (like `Europe/London`) changes when the user travels; the current UTC offset (like `+01:00`) changes with daylight saving. Save both after each scheduling pass; on resume, read them again with `flutter_timezone` and compare (verbatim):
  ```dart
  Future<void> handleClockShift() async {
    final String name = (await FlutterTimezone.getLocalTimezone()).identifier;
    tz.setLocalLocation(tz.getLocation(name));
    
    final int offset = tz.TZDateTime.now(tz.local).timeZoneOffset.inMilliseconds;
    
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    final String? lastName = prefs.getString('last-tz-name');
    final int? lastOffset = prefs.getInt('last-tz-offset');
    
    if (lastName != null && (lastName != name || lastOffset != offset)) {
      await flutterLocalNotificationsPlugin.cancelAll();
      // also clear any local record you keep of "what's already scheduled"
      await rescheduleAllNotifications();
    }
    
    // Save current values for next comparison
    await prefs.setString('last-tz-name', name);
    await prefs.setInt('last-tz-offset', offset);
  }
  ```
  `.identifier` matches `flutter_timezone` 5.x, where `getLocalTimezone()` returns a `TimezoneInfo` whose `identifier` is "The standardized IANA identifier for this timezone" ([TimezoneInfo](https://pub.dev/documentation/flutter_timezone/latest/timezone_info/TimezoneInfo-class.html)).
- **Run it on app open and on resume** (`AppLifecycleListener.onResume`): users background the app more than they close it.
- **It only runs when the user comes back.** If hours of wrong notifications matter (medication reminders, alarms), also reschedule once a day in the background.
- **Why not `DateTime` alone:** see [DEVICE-FEATURES.md](DEVICE-FEATURES.md#device-timezone).

## Prove it

- Search for `.request()` on `Permission.` and `requestPermission()`: each runs from a user action on a priming screen or a value moment (or at launch, if the team chose ApparenceKit's timing and said so), never unguarded in `main()` by accident.
- Deny every permission on a real device: each gated feature shows an explanation and an "open settings" button that lands on the app's settings page, never a blank or black screen.
- Search for `READ_MEDIA_IMAGES`: the app either needs the whole library or uses `image_picker` with the system picker.
- Grep the `onBackgroundMessage` handler: top-level, not anonymous, with `@pragma('vm:entry-point')`.
- Send a push with the app in the foreground, background and terminated: it shows in all three, and a tap routes correctly from background (`onMessageOpenedApp`) and terminated (`getInitialMessage`).
- Log out on one of two devices: only that device's token is removed.
- With the Time Sensitive Notifications capability on, send a time-sensitive push in a Focus mode: it breaks through. Only minute-scale events use the level.
- Change the device timezone, return to the app, and check that pending scheduled notifications fire at the intended local time.
