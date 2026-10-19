# Mobile SDK setup

Mobile setup has two parts, in this order: (1) put platform credentials in OneSignal (an FCM v1 service account for Android, an APNs `.p8` key for iOS), then (2) install and initialize the SDK. Push cannot deliver before the credentials exist, so check them before debugging any SDK code. On iOS the outcome also depends on the Xcode project: Push Notifications and Background Modes capabilities, an App Group, and a Notification Service Extension (NSE) for images, badges and confirmed delivery. This file covers bare React Native, Expo and Flutter; the runtime API (listeners, foreground handling, Live Activities, consent) is in [MOBILE-SDK-API.md](MOBILE-SDK-API.md), users and `login` in [USER-MODEL.md](USER-MODEL.md), prompting in [PERMISSIONS.md](PERMISSIONS.md).

**Contents:** [How it fits together](#how-it-fits-together) · [Android credentials: FCM v1](#android-credentials-fcm-v1) · [iOS credentials: APNs .p8](#ios-credentials-apns-p8) · [React Native (bare)](#react-native-bare) · [iOS project setup (React Native and Flutter)](#ios-project-setup-react-native-and-flutter) · [Expo](#expo) · [Flutter](#flutter) · [Notification Service Extension](#notification-service-extension) · [Testing](#testing) · [Troubleshooting](#troubleshooting) · [Anti-patterns](#anti-patterns) · [Prove it](#prove-it)

## How it fits together

- **One OneSignal app serves iOS, Android, Huawei, Amazon and web** with shared users and segments. iOS and Android do not need separate OneSignal apps.
- **The App ID** is a 36-character UUID in **Dashboard > Settings > Keys & IDs**.
- **Credentials per platform** (**New App/Website** or **Settings > Push & In-App**): Android, Firebase credentials; iOS, **p8 token (recommended)** or p12 certificate; Amazon, API key; Huawei, authorize (Huawei devices on Huawei push services need HMS setup).
- **Routing:** devices with Google Play Services get push via FCM, apps from Huawei AppGallery via HMS; OneSignal defaults to FCM when both are supported.
- **Use the SDK for push.** It handles push tokens, subscription status, permission prompts, notification display and platform payload differences. Some REST operations work without it (creating users, subscriptions, messages), but **in-app messages and Live Activities need the SDK**; the API alone cannot deliver them.
- **Pick the right guide:** React Native for bare React Native apps, Expo for managed Expo apps built with EAS Build, Flutter. "Mobile setup", "push setup" or "SDK setup" means this file unless the request is clearly web push or server REST only.
- **AI install prompts** OneSignal publishes: React Native https://raw.githubusercontent.com/OneSignal/sdk-ai-prompts/main/docs/react-native/ai-prompt.md , Expo https://raw.githubusercontent.com/OneSignal/sdk-ai-prompts/main/docs/react-native-expo/ai-prompt.md

| Package | Install | Init |
|---|---|---|
| `react-native-onesignal` (latest observed 5.5.15, 2026-10-13) | `npm install --save react-native-onesignal` / `yarn add` / `bun add` | `OneSignal.initialize('YOUR_APP_ID')` in `App.tsx`, `App.js` or `index.js` |
| `onesignal-expo-plugin` (latest observed 2.7.2, 2026-10-02) + `react-native-onesignal` | `npx expo install onesignal-expo-plugin` and `npm install --save react-native-onesignal` | same as React Native, in `App.tsx`/`App.js` or `app/_layout.tsx` (Expo Router) |
| `onesignal_flutter` (latest observed 5.7.1, 2026-10-16) | `pubspec.yaml` then `flutter pub get` | `OneSignal.initialize("YOUR_APP_ID")` in `main.dart` |

## Android credentials: FCM v1

- **Needed for Android apps distributed via Google Play.** Not needed for web push on Android or for Huawei AppGallery apps.
- **Service account roles:** `cloudmessaging.messages.create` (role **Firebase Cloud Messaging API Admin**, `roles/firebasecloudmessaging.admin`) and `firebase.projects.get` (role **Firebase Viewer**, `roles/firebase.viewer`). Broader roles (`roles/firebase.admin`, Editor, Owner) also work; prefer the narrow pair for a OneSignal-only account. Check in **Google Cloud Console > IAM & Admin > IAM** (match `client_email`); IAM changes can take a minute.
- **Steps:** Firebase console > project > **Project settings > Cloud Messaging**: make sure **Firebase Cloud Messaging API (V1)** is Enabled (else 3-dot menu > **Manage API in Google Cloud Console** > Enable). **Service accounts > Generate new private key > Generate key**, save the `.json` securely (never share or commit it). In OneSignal: **Settings > Push & In-App > Platforms > Google Android (FCM)** > Activate/Settings > **Select file** > **Save & Continue** (OneSignal validates it).
- **Errors:** **Invalid request** usually means missing roles. "This configuration is for a different Firebase Project" means the key is from another project (different Sender ID): use the original project's key. Switching projects or changing the Sender ID invalidates existing tokens; users stop receiving until they reopen the app. A server key like `AIz...` is the outdated GCM setup: create a new Firebase project and upload a Service Account key.
- **Legacy FCM APIs are fully deprecated; migrate immediately.** Switching to FCM V1 is dashboard-only (no app or SDK change). Check with the View an app API: `fcm_v1_service_account_json` present and non-empty means FCM V1; missing or empty while sending Android push means still legacy.
- **Android also needs a small notification icon,** else the default bell shows.

## iOS credentials: APNs .p8

- **Token-based `.p8` is recommended** (alternative `.p12`). It doesn't expire and works for every app under the account (the same `.p8` can go to several OneSignal apps); a `.p12` is app-specific and expires after one year. **Live Activities need a `.p8`:** "Apple does not support p12 certificates for Live Activities".
- **Requirements:** the Push Notification capability and a paid Apple Developer Account with **Admin** access. Provisioning profiles are required; use Xcode **Automatically manage signing**.
- **Create:** Apple Developer > **Certificates, Identifiers & Profiles > Keys** > **+** > **Apple Push Notifications service (APNs)** with **Sandbox & Production**. OneSignal requires a single team-scoped key valid in both; Sandbox-only or Production-only keys are rejected on save (for two environments create separate OneSignal apps). Register and download the `.p8` (downloadable only once).
  - ApparenceKit adds a limit: "You can't have more than two keys and you can download it only once" ([ApparenceKit](https://apparencekit.dev/blog/flutter-notifications-push-and-locale/)); it is the only source for the two-key number. Uploading the key to Firebase instead: [firebase MESSAGING-FLUTTER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/firebase/MESSAGING-FLUTTER.md#fcm-sending-topics-apns-key).
- **Upload:** **Settings > Push & In-App > Apple iOS (APNs) Settings** > **.p8 Auth Key (Recommended)**: `.p8 File`, `Key ID` (10 chars, e.g. `ABC123DEFG`), `Team ID` (10 chars, e.g. `9A1B2C3D4E`; not the Key ID), `App Bundle ID` (e.g. `com.example.app`).
- **File format:** `-----BEGIN PRIVATE KEY-----`, three 64-char lines, one 8-char line, `-----END PRIVATE KEY-----`. A `.p12` comes from Certificates and does not fit the `.p8` flow. New keys can take **10 to 15 minutes** to propagate.

| Error | Meaning |
|---|---|
| `InvalidProviderToken` (403) | `.p8`, Key ID or Team ID mismatch, or a revoked key. Swapping Key ID and Team ID is the most common cause; if it worked before, the key was most likely revoked: create a new one |
| `TopicDisallowed` / `MissingTopic` | App Bundle ID doesn't match. Use the app target's Bundle ID, not the `.OneSignalNotificationServiceExtension` one; case-sensitive |
| `BadEnvironmentKeyInToken` (403) | Single-environment key. Create a new key with **Sandbox & Production** and **Team Scoped (All Topics)** |

- **Never paste secrets into chat:** API keys, `.p8` keys, `.p12` certificates or other private credentials.

## React Native (bare)

- **Requirements:** a bare React Native app (managed Expo uses the Expo guide); **React Native 0.79+ with the New Architecture enabled**; iOS: macOS with Xcode 14+ (instructions use Xcode 16.2), a device on iOS 15+/iPadOS 15+ or a simulator on iOS 16.2+, CocoaPods 1.16.2+; Android 7.0+ with the Google Play Store (Services).
- **Init** in `App.tsx`, `App.js` or `index.js`:

```javascript
import React, { useEffect } from 'react';
// Include the OneSignal package
import { OneSignal, LogLevel } from 'react-native-onesignal';

export default function App() {
  useEffect(() => {
    // Enable verbose logging for debugging (remove in production)
    OneSignal.Debug.setLogLevel(LogLevel.Verbose);

    // Replace with your OneSignal App ID from Dashboard > Settings > Keys & IDs
    OneSignal.initialize('YOUR_APP_ID');

    // Prompt for push permission on first launch.
    // In production, consider using an in-app message instead for better opt-in rates.
    OneSignal.Notifications.requestPermission(false);

    // Define listeners once so the same reference is used to add and remove them.
    const clickListener = (event) => {
      console.log('OneSignal: notification clicked:', event);
    };

    // In v5, foreground notifications display automatically.
    // Call event.preventDefault() to suppress, then
    // event.getNotification().display() to show after async work.
    const foregroundListener = (event) => {
      console.log('OneSignal: foreground will display:', event);
    };

    OneSignal.Notifications.addEventListener('click', clickListener);
    OneSignal.Notifications.addEventListener('foregroundWillDisplay', foregroundListener);

    // Clean up listeners when the component unmounts to prevent memory leaks.
    // The same listener reference passed to addEventListener must be passed here.
    return () => {
      OneSignal.Notifications.removeEventListener('click', clickListener);
      OneSignal.Notifications.removeEventListener('foregroundWillDisplay', foregroundListener);
    };
  }, []);
}
```

- **Replace the first-launch `requestPermission` in production** with an in-app soft prompt ([PERMISSIONS.md](PERMISSIONS.md)).
- **Same listener reference for add and remove.** Different function references make `removeEventListener` a **silent no-op**. When the listener needs props or state, use `useCallback`:

```javascript
import React, { useCallback, useEffect } from 'react';
import { OneSignal } from 'react-native-onesignal';

export default function App() {
  const clickListener = useCallback((event) => {
    console.log('OneSignal: notification clicked:', event);
    // your deps may vary
  }, []);

  useEffect(() => {
    OneSignal.Notifications.addEventListener('click', clickListener);
    return () => {
      OneSignal.Notifications.removeEventListener('click', clickListener);
    };
  }, [clickListener]);
}
```

- **Excluding the location module** (since 5.5.0): set `ONESIGNAL_DISABLE_LOCATION=true` (case-insensitive, or `1`) before `pod install` and Gradle (`ONESIGNAL_DISABLE_LOCATION=true pod install`, `ONESIGNAL_DISABLE_LOCATION=true ./gradlew assembleDebug`, or CI `env: ONESIGNAL_DISABLE_LOCATION: true`). Then `OneSignal.Location.requestPermission()` and `setShared()` no-op and `isShared()` resolves `false`. Extension targets must use the modular subspec `pod 'OneSignalXCFramework/OneSignal', '>= 5.0.0', '< 6.0'` (the aggregate `pod 'OneSignalXCFramework'` resolves `OneSignalComplete`, which includes `OneSignalLocation`); a Live Activity widget uses `pod 'OneSignalXCFramework/OneSignalLiveActivities', '>= 5.0.0', '< 6.0'`. Reinstall with `pod deintegrate; rm -rf Pods Podfile.lock; ONESIGNAL_DISABLE_LOCATION=true pod install` and verify `rg 'OneSignalXCFramework/(OneSignalLocation|OneSignalComplete)' ios/Podfile.lock` returns nothing. Launch IDEs from a terminal with the variable exported; key CI caches on its value.
- **Then do the iOS project steps below.** The native Android and iOS requirements still apply to React Native.

## iOS project setup (React Native and Flutter)

Work in Xcode on the `.xcworkspace`:

1. **Push Notifications** capability.
   - For iOS time-sensitive notifications, also add **Time Sensitive Notifications**, "otherwise iOS ignores the level and treats the notification as a normal one" ([FlutterPro](https://flutterpro.design/details/time-sensitive-notifications); [flutter-ux NOTIFICATIONS-AND-PERMISSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/NOTIFICATIONS-AND-PERMISSIONS.md#time-sensitive-notifications-on-ios)).
2. **Background Modes > Remote notifications.**
3. **App Groups** with container `group.your_bundle_id.onesignal` (e.g. `group.com.onesignal.MyApp.onesignal`). It must match the bundle ID's spelling and capitalization. Each OneSignal app needs its own App Group; sharing one shares badge count and confirmed receipt data. With an existing custom App Group, add `OneSignal_app_groups_key` to the `Info.plist` of **both** the app target and the NSE target:

```xml
<key>OneSignal_app_groups_key</key>
<string>group.your-custom-group-id</string>
```

4. **File > New > Target... > Notification Service Extension**, named `OneSignalNotificationServiceExtension`; press **Don't Activate**. Set the NSE Minimum Deployment Target to match the app (iOS 15.0+), also in the Podfile.
5. **Add the same App Group to the NSE target.**
6. **Replace `NotificationService.swift`** with OneSignal's:

```swift
import UserNotifications
import OneSignalExtension

class NotificationService: UNNotificationServiceExtension {
    var contentHandler: ((UNNotificationContent) -> Void)?
    var receivedRequest: UNNotificationRequest!
    var bestAttemptContent: UNMutableNotificationContent?

    // Note this extension only runs when `mutable_content` is set
    // Setting an attachment or action buttons automatically sets the property to true
    override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        self.receivedRequest = request
        self.contentHandler = contentHandler
        self.bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)

        if let bestAttemptContent = bestAttemptContent {
            // DEBUGGING: Uncomment the 2 lines below to check this extension is executing
//            print("Running NotificationServiceExtension")
//            bestAttemptContent.body = "[Modified] " + bestAttemptContent.body

            OneSignalExtension.didReceiveNotificationExtensionRequest(self.receivedRequest, with: bestAttemptContent, withContentHandler: self.contentHandler)
        }
    }

    override func serviceExtensionTimeWillExpire() {
        // Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
        if let contentHandler = contentHandler, let bestAttemptContent =  bestAttemptContent {
            OneSignalExtension.serviceExtensionTimeWillExpireRequest(self.receivedRequest, with: self.bestAttemptContent)
            contentHandler(bestAttemptContent)
        }
    }
}
```

7. **Podfile** (skip with Swift Package Manager): `target 'OneSignalNotificationServiceExtension' do pod 'OneSignalXCFramework/OneSignal', '>= 5.0.0', '< 6.0' end` (not the aggregate pod), then `cd ios && pod install`.

| Build error | Fix |
|---|---|
| `ArgumentError - [Xcodeproj] Unable to find compatibility version string for object version 70.` | In `project.pbxproj` change `objectVersion = 70;` to `objectVersion = 55;` |
| `commandPhaseScript Execution exited with a non-zero code` | Delete `Podfile.lock`, `Pods`, `.xcworkspace`; `pod install`; Cmd+Shift+K |
| `Cycle Inside... building could produce unreliable results.` | Xcode 15+: in Build Phases move "Embed Foundation Extensions"/"Embed App Extensions" above "Run Script" |
| `PBXGroup ... PBXFileSystemSynchronizedRootGroup` | Right-click the folder > **Convert to Group** |

## Expo

- **Push does not work in Expo Go.** Create a development build. The plugin README adds: "for iOS, push notifications will **not** work in the Simulator" (the docs page lists an iOS 16.2+ simulator as a test device; confirm in the current docs).
- **Requirements:** a managed Expo app, an Expo development build, **Expo SDK 53+ (React Native 0.79+) with the New Architecture**, EAS CLI; iOS and Android requirements as for React Native.
- **What the plugin is:** an Expo Config Plugin that generates the native files during prebuild (no eject). Supported: `expo run:[android|ios]`, custom dev clients, EAS Build.
- **`onesignal-expo-plugin` must be first in `plugins`** (`npx expo install` adds it automatically). Otherwise: `OneSignal/OneSignal.h file not found`.
- **Required config:** `expo.ios.bundleIdentifier` (must match the p8/p12 config in OneSignal); `expo.ios.infoPlist.UIBackgroundModes: ["remote-notification"]`; `expo.ios.entitlements["aps-environment"]` = `"development"` for testing, `"production"` for TestFlight and the App Store.

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp",
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      },
      "entitlements": {
        "aps-environment": "development"
      }
    },
    "android": {
      "package": "com.yourcompany.yourapp"
    },
    "plugins": [
      [
        "onesignal-expo-plugin",
        {
          "mode": "development"
        }
      ]
    ]
  }
}
```

- **Typed props** since `onesignal-expo-plugin` 2.6.0 via `import withOneSignal from 'onesignal-expo-plugin/plugin';`:

```ts
import { ConfigContext, ExpoConfig } from '@expo/config';
import withOneSignal from 'onesignal-expo-plugin/plugin';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  ios: {
    bundleIdentifier: 'com.yourcompany.yourapp',
    infoPlist: {
      UIBackgroundModes: ['remote-notification'],
    },
    entitlements: {
      'aps-environment': 'development',
    },
  },
  android: {
    package: 'com.yourcompany.yourapp',
  },
  plugins: [
    withOneSignal({
      mode: 'development',
    }),
  ],
});
```

| Prop | Meaning |
|---|---|
| `mode` | Required. `"development"` or `"production"` (APNs environment entitlement) |
| `devTeam` | Deprecated; prefer `ios.appleTeamId` |
| `iPhoneDeploymentTarget` | NSE `IPHONEOS_DEPLOYMENT_TARGET`; match the Podfile, e.g. `"15.0"` |
| `smallIcons` | Android small icons, white silhouette on transparent, 96×96, e.g. `["./assets/ic_stat_onesignal_default.png"]` |
| `largeIcons` | 256×256. Docs: square, color allowed; README: white, transparent |
| `smallIconAccentColor` | e.g. `"#FF0000"` |
| `iosNSEFilePath` | Custom NSE file. Docs: Objective-C, e.g. `"./assets/NotificationService.m"`; README: Swift, e.g. `"./assets/NotificationService.swift"` |
| `appGroupName` | Default `"group.{ios.bundleIdentifier}.onesignal"` |
| `nseBundleIdentifier` | Suffix, default `OneSignalNotificationServiceExtension` |
| `disableNSE` | The NSE is required for badges, confirmed receipt, media attachments, action buttons; disable only for basic push |
| `disableLocation` | Requires `react-native-onesignal` 5.5.1+; writes the Podfile env and `onesignal.disableLocation=true` to Gradle properties |
| `sounds` | `.wav` only, 30 seconds or less, e.g. `["./assets/notification_sound.wav"]` |
| `liveActivities` (README) | `{}` for the default `OneSignalWidget` target (bundle id `{ios.bundleIdentifier}.OneSignalWidget`), or `targetName`, `bundleIdentifierSuffix`, `widgetFilePath`, `deploymentTarget`. Needs an iOS 16.2+ widget target and a `.p8` key |

Where docs and README disagree (`largeIcons`, `iosNSEFilePath`, Simulator), confirm in the current plugin README.

- **App ID from Expo `extra`:** with `{"extra": {"oneSignalAppId": "<YOUR APP ID HERE>"}}`:

```js
import { OneSignal } from 'react-native-onesignal';
import Constants from 'expo-constants';
OneSignal.initialize(Constants.expoConfig.extra.oneSignalAppId);
```

- **Versioning:** set `version` (CFBundleShortVersionString), `ios.buildNumber` (CFBundleVersion) and `ios.bundleIdentifier`; all are copied into the NSE target's plist and entitlements.
- **Build and run:** `npx expo prebuild` or `npx expo prebuild --clean` (EAS runs `npx expo prebuild` at build time if you don't); `npx expo run:ios`, `npx expo run:android`. Dev builds need a development client (`expo install expo-dev-client`, `"developmentClient": true`, `eas build --profile <build profile> --platform ios`, then `expo start --dev-client` and scan the QR). Production ipa goes through the App Store or TestFlight.
- **EAS credentials:** EAS can manage the distribution certificate and provisioning profiles, but the push credential "must be set up separately since you are using OneSignal" (uploaded to OneSignal); the iOS credentials "should use the same credentials setup in your EAS configuration." As of eas-cli `v0.52.0` earlier capability issues are resolved. Legacy complex setup (multiple capabilities): `"credentialsSource": "local"` in `eas.json`; identifiers `<com.example.app>` and `<com.example.app>.OneSignalNotificationServiceExtension`, both with App Group `group.<identifier>.onesignal`, only the main one with Push Notifications; four provisioning profiles (AdHoc and AppStore for both); `credentials.json` entries for both targets; build with `EXPO_NO_CAPABILITY_SYNC` so EAS doesn't overwrite capabilities.

| Expo error | Fix |
|---|---|
| `OneSignal/OneSignal.h file not found` | Put the plugin first |
| `Unable to find onesignal-expo-plugin` | `npx expo install onesignal-expo-plugin` |
| Nothing in Expo Go | Use a development build |
| No iOS push | APNs credentials, and `aps-environment` matching the build type |
| `Bundle identifier mismatch` | `expo.ios.bundleIdentifier` must match the OneSignal APNs config |
| `eas build` fails | Validate plugin config and ordering |
| `Cycle Inside...`, `PBXGroup` | As in the iOS build error table above |

## Flutter

- **Requirements:** **Flutter 3.29.0+**; iOS: Xcode 14+ (instructions use 16.2), an iOS 15+/iPadOS 15+ device or iOS 16.2+ simulator, **Swift Package Manager (opt-in) or CocoaPods 1.16.2+**; Android 7.0+ with the Google Play Store (Services). The Flutter README says "Tested from Android 4.0.3 (API level 15) to Android 12.0 (31)"; the docs require Android 7.0+.
- **Install:** `dependencies: onesignal_flutter: ^5.1.2` (the version shown on the docs page; pub.dev latest observed 5.7.1) in `pubspec.yaml`, then `flutter pub get`.
- **Init** in `main.dart`:

```dart
// Include the OneSignal package
import 'package:onesignal_flutter/onesignal_flutter.dart';

void main() {
  runApp(const MyApp());

  // Enable verbose logging for debugging (remove in production)
  OneSignal.Debug.setLogLevel(OSLogLevel.verbose);
  // Initialize with your OneSignal App ID
  OneSignal.initialize("YOUR_APP_ID");
  // Use this method to prompt for push notifications.
  // We recommend removing this method after testing and instead use In-App Messages to prompt for notification permission.
  OneSignal.Notifications.requestPermission(false);

}
```

- **Debug builds lose cold-start clicks.** In `Debug` mode, if the app is force-closed and a notification is clicked, the app won't open and the click listener won't register. Test with `flutter run --release` on a physical device, or set the Xcode scheme to `Release`.
- **iOS:** the same seven steps as React Native ([above](#ios-project-setup-react-native-and-flutter)). With SPM, step 7 (the NSE Podfile target) is skipped. The Flutter docs page's Podfile "Example" tab shows a React Native Podfile (`use_native_modules!`, `use_react_native!`), apparently copied from the React Native page. The README's NSE Podfile example adds `use_frameworks!` inside the extension target.
- **Swift Package Manager:** supported since 5.5.0, off by default: `flutter config --enable-swift-package-manager`. To migrate from CocoaPods: enable SPM, delete `Podfile`, `Podfile.lock` and `Pods/`, remove the CocoaPods include lines from `ios/Flutter/Debug.xcconfig` and `ios/Flutter/Release.xcconfig`, then `flutter run`.
- **Excluding location** (since `onesignal_flutter` 5.6.0): `ONESIGNAL_DISABLE_LOCATION=true` (or `1`) for SPM, CocoaPods and Gradle; `OneSignal.Location` calls are ignored on Android and `OneSignal.Location.isShared()` returns `false`. The plugin then resolves `OneSignalXCFramework/OneSignal` plus `OneSignalXCFramework/OneSignalInAppMessages`; declare that same pair in every extension target:

```ruby
target 'OneSignalNotificationServiceExtension' do
  pod 'OneSignalXCFramework/OneSignal', '>= 5.0.0', '< 6.0'
  pod 'OneSignalXCFramework/OneSignalInAppMessages', '>= 5.0.0', '< 6.0'
end

target 'OneSignalWidgetExtension' do
  pod 'OneSignalXCFramework/OneSignal', '>= 5.0.0', '< 6.0'
  pod 'OneSignalXCFramework/OneSignalInAppMessages', '>= 5.0.0', '< 6.0'
end
```

- **Don't narrow subspecs per target.** Mismatched sets fail with `error: Multiple commands produce '.../XCFrameworkIntermediates/OneSignalXCFramework/OneSignalCore/OneSignalCore.framework'`. `OneSignalXCFramework/OneSignal` includes `OneSignalLiveActivities`. SPM resolves per target, no change needed.
- **Extension pods without the variable:** the Flutter README says the plugin then resolves the umbrella pod, so extension targets should declare `pod 'OneSignalXCFramework'` and "the app target and every extension target must request an identical subspec set"; the docs page says to use the modular `OneSignalXCFramework/OneSignal` for the NSE and not the aggregate pod. Confirm in the current README.
- **Clear caches after changing the variable:** CocoaPods `pod deintegrate; rm -rf Pods Podfile.lock; ONESIGNAL_DISABLE_LOCATION=true pod install` (verify with `rg`); SPM `flutter clean; rm -rf ios/.build; rm -rf ~/Library/Caches/org.swift.swiftpm ~/Library/Developer/Xcode/DerivedData/*; ONESIGNAL_DISABLE_LOCATION=true flutter build ios` (or Xcode **File > Packages > Reset Package Caches**); Android `ONESIGNAL_DISABLE_LOCATION=true flutter build apk`. On CI key DerivedData, SwiftPM, CocoaPods and Gradle caches on the variable's value.
- **Migrating to v5:** the user-centric SDKs "may not be at 1:1 feature parity with our previous versions yet"; roll out with iOS Phased Rollout or Google Play Staged Rollout. A demo project is in `/example`. See [MIGRATION-AND-TROUBLESHOOTING.md](MIGRATION-AND-TROUBLESHOOTING.md).

## Notification Service Extension

- **The iOS NSE is required for** images and rich media, confirmed receipt, badges, action buttons, and influenced opens with Firebase Analytics. No image on iOS means the NSE is missing.
- **It runs only when `mutable-content` is set** in the payload; OneSignal sets it automatically when you include an attachment or action buttons.
- **Additional `data`** sent via the API arrives in the NSE at `userInfo["custom"]["a"]`.
- **Targets must agree:** the main app target and `OneSignalNotificationServiceExtension` need the same **Supported Destinations** and **Minimum Deployment** (iOS 15.0+), also in the Podfile. The NSE Info `NSExtension`: `NSExtensionPointIdentifier` = `com.apple.usernotifications.service`, `NSExtensionPrincipalClass` = `$(PRODUCT_MODULE_NAME).NotificationService` (Objective-C: `NotificationService`). In the main target **Build Phases > Embed App Extensions**, "Copy only when installing" must **not** be checked.
- **Debug it:** uncomment the logging lines and the `"[Modified] "` prefix on `bestAttemptContent.body`; set the Active Scheme to `OneSignalNotificationServiceExtension`; run on a real device; **Window > Devices and Simulators > Open Console**, **Action > Include Debug Messages**, filter CATEGORY `OneSignalNotificationServiceExtension`.
- **Android service extension** (native code only): a class implementing `INotificationServiceExtension.onNotificationReceived(event)`, annotated `@Keep` (so R8/ProGuard don't rename or remove it), registered in `AndroidManifest.xml` `<application>` as `<meta-data android:name="com.onesignal.NotificationServiceExtension" android:value="<fully qualified class>" />`. `event.preventDefault()` without a later `display()` silently drops the notification.

### Images and badges on the device

- **Image download:** the SDK downloads the image even if the app is closed; if it takes longer than **~25 seconds (enforced by Apple)** the notification shows without the image, with no retry. Android needs no extra config; iOS needs the NSE.
- **Image URLs:** a direct `https://` URL ending with a file extension, no redirects or HTML pages. OneSignal-hosted uploads have a **5MB** limit and **expire after 33 days** (use your own static URL or Templates); a self-hosted image is downloaded once per receiving device. The images-not-showing page says "The image must be less than 5MB in size"; the rich-media page lists **10MB** as the image attachment max (`jpg`, `jpeg`, `png`, `gif`; Android does not support animated GIFs). Confirm in the current docs.
- **HTTP image URLs on iOS** need `NSAppTransportSecurity` `NSAllowsArbitraryLoads`, and Apple may reject the app.
- **Log errors:** `Could not download image!`, `Encountered an error while attempting to download file with URL:`, `OneSignal encountered an exception while downloading file`.
- **Video and custom views** (carousels) need an iOS `UNNotificationContentExtension`; on Android 12+ customize through the Notification Service Extension. Test rich media on real devices, not emulators.
- **iOS badges** need the NSE and App Groups. By default the SDK clears the badge when the app opens and removes the notifications from Notification Center; turn that off in `Info.plist`:

```xml
<key>OneSignal_disable_badge_clearing</key>
<true/>
```

- **iOS cannot read the current badge count;** track it yourself. Android badges follow notification categories (channels); Huawei doesn't auto-clear (send `huawei_badge_set_num: 0`). Badge fields are in [REST-API.md](REST-API.md).

## Testing

- **Android emulator:** **Cold Boot** it. The device needs Google Play Services.
- **Status flow:** before the prompt is accepted the Subscription shows "Never Subscribed"; after Allow, "Subscribed".
- **Test send:** a Test Users segment (see [SETUP-WEB.md](SETUP-WEB.md#testing-a-send)), and include an image to check the NSE: `"ios_attachments": {"onesignal_logo": "<url>"}` and `"big_picture": "<url>"`. No image on iOS means the NSE is missing.
- **In-app test:** users must match the audience before a new session starts; a new session is the app opened after being backgrounded or closed for at least **30 seconds**. **Messages > In-App > New In-App**, Welcome template, audience Test Users, trigger "On app open", frequency "Every time trigger conditions are satisfied", **Make Message Live**.

## Troubleshooting

Check in this order: credentials, then platform setup, then logs, then SDK code.

- **Android works, iOS doesn't:** APNs credentials, entitlements, provisioning, the NSE and App Groups.
- **iOS push works but images or confirmed delivery don't:** the NSE and App Group setup.
- **No Android push:** FCM credentials and whether the device has Google Play Services.
- **iOS:** also physical device or supported simulator constraints.
- **Ask for logs only after the prerequisites check out.** Turn on verbose logging (`OneSignal.Debug.setLogLevel(LogLevel.Verbose)` before `initialize`) for debugging; remove or reduce it in production.

| React Native error | Fix |
|---|---|
| `Unable to find react-native-onesignal` | Install and rebuild |
| `NativeEventEmitter() requires a non-null argument` | Move `OneSignal.initialize()` inside `useEffect` |
| `Unable to resolve module` | `npx react-native start --reset-cache` |
| `[OneSignal] App Group not found` | The same App Group on the app and NSE targets |
| `CocoaPods could not find compatible versions` | Delete `ios/Podfile.lock` and `pod install` |
| Android build fails | `cd android && ./gradlew clean && cd ..` |
| `this.RNOneSignal.onPermissionChanged is not a function` | Enable the New Architecture (RN 0.79+) |

Delivery and duplicate problems are in [MIGRATION-AND-TROUBLESHOOTING.md](MIGRATION-AND-TROUBLESHOOTING.md).

## Anti-patterns

- **Giving generic SDK advice** before asking which platform or framework.
- **Debugging SDK code before checking push credentials.**
- **Saying push will deliver** before APNs, FCM or HMS credentials are configured.
- **Claiming in-app messages or Live Activities can be delivered** by the REST API alone.
- **Inventing SDK methods or setup paths** not in the OneSignal docs.
- **Prompting for permission on first launch in production** instead of a soft prompt.
- **Asking for secrets** (API keys, `.p8`, `.p12`) in chat.

## Prove it

- The dashboard shows FCM v1 (a service account JSON, not an `AIz...` server key) and an APNs `.p8` with Sandbox & Production, the app target's Bundle ID, and Key ID and Team ID not swapped.
- iOS targets: Push Notifications and Background Modes > Remote notifications on the app; the same App Group (`group.<bundle id>.onesignal` or `OneSignal_app_groups_key` in both plists) on the app and `OneSignalNotificationServiceExtension`; matching minimum deployment; NSE pods use `OneSignalXCFramework/OneSignal`, not the aggregate pod.
- Expo: `onesignal-expo-plugin` is first in `plugins`, `mode` and `aps-environment` match the build type, and the app runs from a development build, not Expo Go.
- After accepting the prompt on a real device, the Subscription goes from Never Subscribed to Subscribed, and a test send with `ios_attachments` shows its image on iOS.
- React Native: listeners are added and removed with the same reference; Flutter: cold-start click handling is tested in a release build.
- Verbose logging is off in the production build.
