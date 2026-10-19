# Notifications and permissions

How a Flutter app asks for runtime permissions without losing users, picks photos with no permission at all, primes the notification prompt, routes FCM delivery to its Firebase owner, marks iOS notifications time-sensitive, and keeps scheduled notifications right when the timezone or clock changes. Sources: FlutterPro tips by Kamran Bekirov (flutterpro.design) and ApparenceKit tips and blog posts (apparencekit.dev), checked against pub.dev and Firebase docs where a snippet was flagged. Device timezone lookup, status bar, screenshots and home widgets are in [DEVICE-FEATURES.md](DEVICE-FEATURES.md). OneSignal's own prompt flow is [onesignal PERMISSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/onesignal/PERMISSIONS.md).

**Contents:** [Runtime permissions](#runtime-permissions) · [Denied: explain, then open Settings](#denied-explain-then-open-settings) · [Pick photos without a permission](#pick-photos-without-a-permission) · [When to ask for notifications](#when-to-ask-for-notifications) · [The priming screen](#the-priming-screen) · [FCM delivery](#fcm-delivery) · [Time-sensitive notifications on iOS](#time-sensitive-notifications-on-ios) · [Reschedule on timezone or clock change](#reschedule-on-timezone-or-clock-change) · [Prove it](#prove-it)

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
- **Notifications too:** "Every OS now handles notifications permissions for each apps. If a user refuse them, he has to go in his OS settings to enable them", so you don't need your own notification settings page for the permission itself [ApparenceKit](https://apparencekit.dev/blog/flutter-notifications-push-and-locale/). OneSignal's equivalent is `requestPermission(fallbackToSettings: true)` ([onesignal PERMISSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/onesignal/PERMISSIONS.md#mobile-programmatic-prompting)).

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

- **`source: .gallery`** is a dot shorthand, which needs Dart 3.10 ([dart LANGUAGE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/dart/LANGUAGE.md#dot-shorthands)); on older SDKs write `ImageSource.gallery`.
- **Android versions** ([image_picker_android 0.8.13+25](https://pub.dev/packages/image_picker_android)): "On Android 16 and above, gallery image, video, and mixed-media picks always use the Android Photo Picker. `ImagePickerAndroid.useAndroidPhotoPicker` has no effect on those versions." On Android 15 and below the flag turns it on; set it "before calling any `image_picker` APIs", and it is also required for the `limit` option. The imports are `package:image_picker_android/image_picker_android.dart` and `package:image_picker_platform_interface/image_picker_platform_interface.dart`.
- **Ask for gallery permission only when the app needs the whole library,** like a backup app [FlutterPro](https://flutterpro.design/details/native-photo-picker). Google Play says the same for `READ_MEDIA_IMAGES` ([google-play POLICY-AND-PREFLIGHT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/google-play/POLICY-AND-PREFLIGHT.md)).

## When to ask for notifications

You get one shot at the system dialog. "On iOS, after "Don't Allow" it never shows again, the user has to dig it out of Settings. Android 13+ is close, two denies and it's permanent" [FlutterPro](https://flutterpro.design/details/notification-permission-priming). The sources disagree on the moment; this is timing opinion, so each is tagged:

- **After a value moment** [FlutterPro](https://flutterpro.design/details/notification-permission-priming): "Don't ask for notification permission when the app opens. The user just got here, they have no reason to say yes." Ask when the benefit is obvious: right after an order is placed, for "Get order status updates"; in the author's prayer-times app, when the user configures prayer times, with examples of the daily reminders for the 5 prayers.
- **At launch or after sign-in** [ApparenceKit](https://apparencekit.dev/blog/flutter-notifications-push-and-locale/): "For notifications I like to ask it right after app launches or after he has signed in. And that's the same on iOS, Android and web."
- **After a value moment, never first launch** (OneSignal, [onesignal PERMISSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/onesignal/PERMISSIONS.md#principles)) and **after activation, never on cold open** ([app-growth RETENTION-AND-MONETIZATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/RETENTION-AND-MONETIZATION.md)).

How often to re-ask also differs:

- **Stop after two skips** [FlutterPro](https://flutterpro.design/details/notification-permission-priming): "If the user skips twice, stop asking. They can turn notifications on from your settings page when they want them."
- **Re-ask on a cadence** (OneSignal, [onesignal PERMISSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/onesignal/PERMISSIONS.md#mobile-in-app-soft-prompt)): e.g. every 2 weeks, up to `20` times.

## The priming screen

[FlutterPro](https://flutterpro.design/details/notification-permission-priming): don't show the system dialog directly. Show your own page or modal first, with the concrete benefit and two buttons, "Enable notifications" and "Skip". Only the enable tap triggers the system dialog (verbatim):

```dart
Future<void> _onEnableTap() async {
  final PermissionStatus status = await Permission.notification.request();
  ...
}
```

"This layer is what protects the one shot. A "Skip" costs nothing, you can ask again later at another good moment. A deny on the system dialog is forever."

## FCM delivery

Registration tokens, foreground/background/terminated handlers, delivery, topics and tap routing are in [Firebase Flutter messaging](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/firebase/MESSAGING-FLUTTER.md). [ApparenceKit](https://apparencekit.dev/blog/flutter-notifications-push-and-locale/)

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
- **FCM push payload:** the server-side APNs payload and the source's Firebase sending qualifications are in [Firebase Flutter messaging](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/firebase/MESSAGING-FLUTTER.md#time-sensitive-fcm-payload). [FlutterPro](https://flutterpro.design/details/time-sensitive-notifications)
- **Use it for events that expire in minutes:** a courier arriving, a ride pulling up, a login code, a reservation about to be released. "Order shipped", price drops and likes are not time-sensitive; send them as normal notifications. OneSignal's field for the same level is in [onesignal MESSAGING-PRACTICES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/onesignal/MESSAGING-PRACTICES.md#ios-interruption-levels-and-relevance).

## Reschedule on timezone or clock change

[FlutterPro](https://flutterpro.design/details/timezone-change):

- **Scheduling contract:** `zonedSchedule` schedules a date and time relative to a timezone. `matchDateTimeComponents` can request daily or weekly component-matching recurrence, similar to calendar triggers on iOS/macOS; behavior depends on the platform and schedule. [zonedSchedule](https://pub.dev/documentation/flutter_local_notifications/latest/flutter_local_notifications/FlutterLocalNotificationsPlugin/zonedSchedule.html). P2 correction: FlutterPro describes every schedule as an OS-stored UTC instant that loses local-time intent. Keep its zone-change detection recipe below without treating that explanation as universal.
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
- With the Time Sensitive Notifications capability on, send a time-sensitive push in a Focus mode: it breaks through. Only minute-scale events use the level.
- Change the device timezone, return to the app, and check that pending scheduled notifications fire at the intended local time.
