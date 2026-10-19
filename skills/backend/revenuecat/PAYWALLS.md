# Paywalls

RevenueCat Paywalls are paywall screens built in the dashboard and rendered natively by the RevenueCatUI SDKs (`purchases_ui_flutter`, `react-native-purchases-ui`), so design, copy and packages change without an app release and variants can be A/B tested with Experiments. Existing-subscriber management is in [CUSTOMER-CENTER.md](CUSTOMER-CENTER.md). Most outcomes come down to two things: the offering the app shows must have a published paywall attached (otherwise the SDK renders a default fallback layout), and the RevenueCatUI component owns the purchase, so the app reacts to its results and never calls `purchase` alongside it. SDK setup is in [FLUTTER.md](FLUTTER.md) and [REACT-NATIVE.md](REACT-NATIVE.md); offerings and entitlements in [CONCEPTS.md](CONCEPTS.md); testing in [TESTING.md](TESTING.md); paywall render problems in [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

**Contents:** [Choose how the paywall is built](#choose-how-the-paywall-is-built) · [How RevenueCat Paywalls work](#how-revenuecat-paywalls-work) · [Requirements and SDK versions](#requirements-and-sdk-versions) · [Present a paywall in Flutter](#present-a-paywall-in-flutter) · [Present a paywall in React Native](#present-a-paywall-in-react-native) · [Present a paywall on the web](#present-a-paywall-on-the-web) · [Paywall options](#paywall-options) · [Test a paywall](#test-a-paywall) · [Create and edit the dashboard paywall](#create-and-edit-the-dashboard-paywall) · [Paywall design rules](#paywall-design-rules) · [Customer Center](#customer-center) · [Prove it](#prove-it)

## Choose how the paywall is built

This is a product decision, not an implementation detail: settle it before writing any paywall code.

| | RevenueCat Paywall (recommended default) | Custom paywall in code |
|---|---|---|
| Built in | Dashboard paywall builder; rendered by RevenueCatUI | Your UI; packages and prices from `getOfferings()`; purchase via the purchase flow in [FLUTTER.md](FLUTTER.md) / [REACT-NATIVE.md](REACT-NATIVE.md) |
| Design changes | No app release; refine later in the builder | Every change ships in an app release |
| A/B testing | Paywall variants with RevenueCat Experiments | Paywall design can't be tested; price and offering tests still work because packages come from the offering |

- **Pick in this order.** (1) The user already said which: use it. (2) No paywall screen exists: recommend a RevenueCat Paywall. (3) The app already has a paywall or subscription screen (plans or prices, a subscribe or upgrade button, hard-coded prices or product IDs): recommend keeping it, wired to offerings, and mention a RevenueCat Paywall could replace it.
- **Ask once if you can:** one question with both options, recommended first, each with a one-line trade-off. If non-interactive, take the recommendation and say in the summary which path you took and how to switch.
- **Don't hand-code a paywall screen by default** just because it keeps the work in code.
- **Products, entitlements and offerings must exist first.** Check them before building; see [CONCEPTS.md](CONCEPTS.md).

## How RevenueCat Paywalls work

- **One paywall per offering.** A paywall is an optional feature of an offering; an offering can have at most one attached RevenueCat Paywall. It can be a single screen or a multi-step flow, built from templates, from scratch, or with the AI editor.
- **No attached or published paywall means the fallback.** If the offering has no paywall (or an unsupported one), RevenueCatUI shows a default paywall layout listing all packages, which is not what you want in production. A new paywall is an unpublished draft, and the app renders the fallback until a paywall is published and attached to the offering.
- **Gate on the entitlement, not the offering.** Users purchase a package in an offering and get access through an entitlement (typically `"premium"` or `"pro"`).
- **RevenueCatUI owns the purchase.** Do not call `Purchases.purchase(...)` or `purchasePackage(...)` inside paywall callbacks or around the present call; a second purchase path can double charge. Listen for the dismiss and purchase-completed callbacks instead. A fully custom UI does not use RevenueCatUI.
- **Restore is built in.** RevenueCat Paywalls include a Restore Purchases button by default.
- **Three presentation patterns:** a first-launch modal for users without the entitlement (the "present if needed" helper); a gated premium screen where the paywall opens before the screen loads; a conditional present on a CTA tap (for example "Upgrade" in settings).
- **Caching.** Paywalls prewarm at configure (offerings, images, intro eligibility); everything except images is session-only, not persisted to disk.
- **Multi-step paywalls** need no extra code; the impression is recorded at the step that contains packages. Navigation: sheets need no close button; full-screen views need a close or back button unless it is a hard paywall.
- **Changes from the legacy paywalls.** No footer paywalls (legacy only, via `.originalTemplatePaywallFooter()`), no font provider, and `displayCloseButton` has no effect: it only affects original template paywalls, and current paywalls render their own close affordance. The paywall skill still passes `displayCloseButton: true` when presenting modally and says to skip it behind a sheet with its own grabber or inside a navigation controller.
- **Analytics.** Paywall analytics emit `paywall_component_interacted` events; integrations (Amplitude, Mixpanel, PostHog, Segment, your server) are optional.
- **Native-only hooks.** Purchase and restore interception (`onPurchaseInitiated`, `onRestoreInitiated` with `resume(true/false)`) exists only in the native iOS and Android SDKs.

## Requirements and SDK versions

- **Platforms:** iOS 15.0+, Android 7.0 (API 24)+, Mac Catalyst 15.0+, macOS 12.0+, Web (Web Purchase Links). Not watchOS, tvOS, visionOS. RevenueCatUI in Flutter and React Native targets iOS and Android only.
- **Flutter.** Add `purchases_ui_flutter` next to `purchases_flutter`, `flutter pub get`, `cd ios && pod install && cd ..`. It needs iOS 15 (`ios/Podfile`: `platform :ios, '15.0'`) although the base SDK needs 13.0. On Android it uses Jetpack Compose wrapped by the Flutter embedding, and `MainActivity` must subclass `FlutterFragmentActivity` (snippet in [FLUTTER.md](FLUTTER.md)). Android minSdk: the paywall skill says 21 for `purchases_ui_flutter`; the docs' platform list says API 24.
- **React Native and Expo.** `npm install react-native-purchases-ui` then `cd ios && pod install && cd ..`, or `npx expo install react-native-purchases-ui`. It links native code (`RevenueCatUI` on iOS, `purchases-ui` Compose on Android), so it does not run in Expo Go; make a dev build with `npx expo prebuild` or `eas build --profile development`. Targets iOS 15+, Android minSdk 24.
- **Minimum SDKs: two docs pages disagree.** Confirm in https://www.revenuecat.com/docs/tools/paywalls.md.

| Requirement | purchases-flutter | react-native-purchases | purchases-js |
|---|---|---|---|
| Paywalls (overview page "minimum recommended") | 8.10.1 | 8.11.3 | |
| Paywalls (installation page) | 8.5.0 | 8.6.1 | 0.19.0 |
| Multi-step paywalls (older SDKs show only the final screen, or use "Fallback paywalls by SDK version") | 10.7.0 | 10.6.0 | 1.50.0 |
| `offer_price_with_zero` variables (older fall back to `offer_price`) | 10.13.1 | 10.10.1 | not yet |
| Exit offers | 9.10.5 | 9.6.15 | |
| Custom variables | `purchases_ui_flutter` 9.12.0 | | |

## Present a paywall in Flutter

- **Imperative for a one-shot modal, widget to embed.** Prefer `RevenueCatUI.presentPaywall(...)`; use the `PaywallView` widget inside a Flutter route.

```dart
import 'package:purchases_flutter/purchases_flutter.dart';
import 'package:purchases_ui_flutter/purchases_ui_flutter.dart';

Future<void> openPaywall() async {
  final result = await RevenueCatUI.presentPaywall(
    displayCloseButton: true,
  );

  switch (result) {
    case PaywallResult.purchased:
    case PaywallResult.restored:
      // entitlement granted
      break;
    case PaywallResult.cancelled:
      // user dismissed
      break;
    case PaywallResult.error:
    case PaywallResult.notPresented:
      break;
  }
}
```

- **Present only if the entitlement is missing.** `notPresented` is returned only by `presentPaywallIfNeeded`, when the entitlement is already active.

```dart
final result = await RevenueCatUI.presentPaywallIfNeeded(
  'premium',
  displayCloseButton: true,
);

if (result == PaywallResult.purchased || result == PaywallResult.notPresented) {
  // user has access
}
```

- **Embedded widget.** Callbacks: `onPurchaseStarted`, `onPurchaseCompleted`, `onPurchaseError`, `onRestoreCompleted`, `onRestoreError`, `onDismiss`. `PaywallView` is a `StatelessWidget` hosting a native platform view: never constrain its height to zero; let it fill the available space. The docs say to avoid placing it inside a modal or bottom sheet (e.g. `showModalBottomSheet`) and include it directly in your widget.

```dart
import 'package:flutter/material.dart';
import 'package:purchases_ui_flutter/purchases_ui_flutter.dart';

class PremiumPage extends StatelessWidget {
  const PremiumPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: PaywallView(
        displayCloseButton: true,
        onPurchaseCompleted: (customerInfo, storeTransaction) {
          Navigator.of(context).pop(true);
        },
        onDismiss: () => Navigator.of(context).pop(false),
        onPurchaseError: (error) {
          // surface the error
        },
      ),
    );
  }
}
```

- **A specific offering.** Both the methods and the widget take an `offering:` parameter with an `Offering` from `Purchases.getOfferings()`.
- **Flutter Web:** `presentPaywall` is not yet supported on web.

## Present a paywall in React Native

- **The API.** The default import is a class `RevenueCatUI` with static methods `presentPaywall`, `presentPaywallIfNeeded`, `presentCustomerCenter` and static components `Paywall`, `CustomerCenterView`.

```tsx
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

async function openPaywall() {
  const result = await RevenueCatUI.presentPaywall({
    displayCloseButton: true,
  });

  switch (result) {
    case PAYWALL_RESULT.PURCHASED:
    case PAYWALL_RESULT.RESTORED:
      // entitlement granted
      break;
    case PAYWALL_RESULT.CANCELLED:
      // user dismissed
      break;
    case PAYWALL_RESULT.ERROR:
    case PAYWALL_RESULT.NOT_PRESENTED:
      break;
  }
}
```

```tsx
const result = await RevenueCatUI.presentPaywallIfNeeded({
  requiredEntitlementIdentifier: 'premium',
  displayCloseButton: true,
});

if (
  result === PAYWALL_RESULT.PURCHASED ||
  result === PAYWALL_RESULT.NOT_PRESENTED
) {
  // user has access
}
```

- **A specific offering.** `RevenueCatUI.presentPaywall({ offering })`, or `options={{ offering, displayCloseButton: true }}` on the component, with `offering` from `await Purchases.getOfferings()`.
- **Embedded component.** `<RevenueCatUI.Paywall />` is a native view host: it needs a non-zero size, so wrap it in `<View style={{ flex: 1 }} />` or give it an explicit height. Listeners: `onPurchaseStarted`, `onPurchaseCompleted`, `onPurchaseError`, `onPurchaseCancelled`, `onRestoreStarted`, `onRestoreCompleted` (may fire even if no entitlements were granted), `onRestoreError`, `onDismiss` (called when the close button is pressed, if enabled, or when a purchase succeeds).

```tsx
import { View } from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';

export function PremiumScreen({ navigation }) {
  return (
    <View style={{ flex: 1 }}>
      <RevenueCatUI.Paywall
        options={{ displayCloseButton: true }}
        onPurchaseCompleted={({ customerInfo }) => {
          navigation.goBack();
        }}
        onDismiss={() => navigation.goBack()}
        onPurchaseError={({ error }) => {
          // surface the error
        }}
      />
    </View>
  );
}
```

## Present a paywall on the web

- **purchases-js.** Install `@revenuecat/purchases-js` and call `await purchases.presentPaywall({ htmlTarget: paywallContainer, offering: offeringToUse })`; omit `offering` for `current`. The SDK renders the paywall, runs the purchase and resolves with the result. Max width 968px.

## Paywall options

- **Custom variables** (string, number, boolean) drive text and visibility rules. Keys start with a letter and contain letters, numbers and underscores; reference them in the paywall as `{{ custom.variable_name }}`. React Native: `RevenueCatUI.presentPaywall({ customVariables: { 'player_name': CustomVariableValue.string('John'), 'level': CustomVariableValue.number(42), 'is_premium': CustomVariableValue.boolean(true) } })` or `options={{ customVariables: {...} }}`. Flutter: `RevenueCatUI.presentPaywall(customVariables: {...})` or `PaywallView(customVariables: {...})`.
- **Locale.** Flutter: `..preferredUILocaleOverride = 'es-ES'` in the configuration or `await Purchases.overridePreferredUILocale('de-DE');`. React Native: `preferredUILocaleOverride: 'es-ES'` in configure or `await Purchases.overridePreferredLocale('de-DE');`.
- **Custom fonts.** Upload them to RevenueCat; in hybrid apps also add the font files to the Android project (`res/font`, filename = font name) and the iOS project (Info.plist "Fonts provided by the application") for performance.
- **Exit offers** are configured in the paywall editor with no code, but work only with `presentPaywall` / `presentPaywallIfNeeded`, not with an embedded `PaywallView` or `<RevenueCatUI.Paywall>`.

## Test a paywall

- **Preview.** The RevenueCat iOS app (v1.2+) previews paywalls, drafts included, with preview values for prices. In-app preview through a custom URL scheme is native only for now (hybrid SDK support is "coming soon").
- **Show a paywall to one tester.** Override a customer's current offering in their Customer Profile, or add a Targeting rule "App Version equals X.Y.Z" for internal builds.
- **Check:** device sizes, every purchase flow, localization, variables, light and dark mode, and every multi-step navigation. Full testing setup: [TESTING.md](TESTING.md).

## Create and edit the dashboard paywall

Tools are the RevenueCat MCP server or the `rc` CLI (`rc paywalls generate --prompt "..."`, `rc paywalls edit --prompt "..."`, `rc paywalls rewind --session <id>`, `rc paywalls publish`, `rc paywalls show`). Prefer MCP for screenshots or a structured `get-paywall` read.

- **A null `paywall_id` proves no attached RevenueCat paywall, not custom app UI.** RevenueCatUI can render its default fallback; the app may instead use custom UI or show no purchase UI. Inspect code or observable evidence before choosing a branch. The old source inferred client-side UI from null alone. [https://www.revenuecat.com/docs/tools/paywalls/displaying-paywalls#default-paywall]
- **Create.** `create-paywall-ai` (MCP) or `rc paywalls generate` creates a **draft only**, asynchronously: poll `get-paywall-ai-task` about every 30 s (image-heavy creation can take 5 to 10 minutes) and don't re-call unless it fails. Prefer attaching to an existing offering; gather context with `list-offerings`, `get-offering`, `get-offering-prices`, `list-products`, `list-apps`, `get-app`, `get-project-ui-config`, `list-paywalls`. Pass concise `codebase_context` (premium features, brand colors, visual direction, tone, products, audience) and `app_context`. If no offering is clear or the user declines, create an unattached draft.
- **Write a concrete prompt:** app identity, audience, core value proposition, product durations, trials, price points, existing paywall patterns, brand colors and fonts, the user's design direction; enough for a one-shot draft. Never ask the tool to publish.
- **An offering that already has a paywall** (`paywall_id` set) must not be passed as `offering_id` to `create-paywall-ai`. Duplicate it ("same as", "like", "copy", "mirror"), edit it, or use a different or unattached offering for a genuinely different design. Never present an unattached draft as satisfying a duplication request.
- **Duplicate, don't regenerate.** For copy requests use `duplicate-paywall`, not `create-paywall-ai` (which regenerates from text, losing images, exact structure and anything unmentioned). It copies the draft by default, or the published version with `source_version: published` (fails if never published). When `get-paywall` shows a non-null `published_at`, pass `source_version: published`; use `draft` only for explicitly requested in-progress edits or never-published sources, and say which version you copied. Pass `offering` (`lookup_key`, `display_name`) to also duplicate the source's offering (packages only) and attach the copy; for an offering-first request use `duplicate-offering` (copies packages and the attached paywall). Then apply differences with `edit-paywall-ai` and describe the result as a copy. Multipage paywalls can't be duplicated; a fallback `create-paywall-ai` is a reconstruction (images will differ) and must be described that way.
- **Edit only on explicit request.** `edit-paywall-ai` is async: poll `get-paywall-ai-task` with the task ID about every 10 to 15 s (image-generation edits can take several minutes) and don't re-call unless it fails. Pass images attached to the current message if the schema accepts them; images from earlier messages are not attached, so ask again. Manual edit link: `https://app.revenuecat.com/projects/{project id without leading proj prefix}/paywalls/{paywall ID starting with pw}/builder` (the builder's conversational AI editor is in the left toolbar, not directly linkable).
- **Undo.** No MCP tool restores a version: the user restores an older version in the paywall editor, and `rc paywalls rewind --session <id>` undoes the last editor action. Restoring does not publish.
- **Publish only within explicit authorization.** New/duplicated paywalls are drafts for review; preparing an experiment treatment is not an automatic exception. Nondefault offerings can be retrieved directly or selected by targeting, so publication is not inherently isolated until experiment start. The old source claimed the contrary. [RevenueCat/ai-toolkit, revenuecat-experiments; user standing authorization rule; https://www.revenuecat.com/docs/getting-started/displaying-products#custom-offering-identifiers; https://www.revenuecat.com/docs/tools/targeting]
- **Evaluate.** `render-paywall-screenshot` renders above-the-fold content statically, for the agent, not the user; it cannot verify configuration-dependent details. For exact configuration (default package, component bindings, offer-conditional content) use `get-paywall` with `expand: ["components"]` (without it, component configuration is omitted). Both read the draft when one exists, else the published version, and cover one paywall, not workflows or multipage paywalls. If a tool answer conflicts with what the user sees, check `get-paywall` before disputing; if `get-paywall` fails, report only what is explicitly visible in a screenshot and say configuration was not verified. General advice needs no tools.

## Paywall design rules

- **RevenueCat says Apple App Review rejects** (rejection or store ban): a trial toggle; a delayed close button; a second offer on dismiss or purchase cancel (showing the same product after cancel has been rejected); selling non-IAP digital goods in the app (Stripe or other non-IAP SDKs, or an in-app webview). The [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) contain no literal rule against a second offer on dismiss (checked 2026-10-18), so treat that item as RevenueCat's report of rejections; digital goods outside IAP are Apple's own rule (3.1.1). This line used to say "Apple App Review disallows", stating RevenueCat's list as Apple's. Linking out to a web purchase in an external browser is a different (US) path; the purchase must not happen inside the app.
- **Placement.** Try the beginning or end of onboarding, feature gates and similar moments; onboarding paywalls tend to be very successful (most potential customers, highest motivation just after download).
- **Always experiment.** Thousands of new users a day: A/B test with RevenueCat Experiments. Hundreds: directional tests. Fewer: ship and watch conversion over time.
- **More reading.** Search the RevenueCat blog and docs for paywall best practices; any docs page is Markdown at its URL with `.md` appended.

These are [RevenueCat/ai-toolkit, revenuecat-paywall-design] conversion heuristics. The source ranks conversion over aesthetics and prescribes unique CTA hues and spacing; the owner's [app-ui](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/SKILL.md#the-rules), landing-page-ui and agent-chat-ui retain their production components, variants and tokens. Apply the heuristics only within those approved designs; report a conflict before a specific production change.

Audit in the source's order, subject to that owner-design boundary:

1. **CTA button.** Its color matters most: if it shares a hue with any other colored element (icons, badges, borders, card accents), change it to a contrasting color nothing else uses. Replace generic copy ("Continue", "Subscribe") with a specific action ("Start Yearly Plan", "Get Unlimited Access"); with a free trial, use trial language ("Start Free Trial", "Try for Free").
2. **Plan cards.** The recommended plan needs at least two of: a different background color, a colored border, a "Best Value" / "Most Popular" badge, a larger or elevated card. A default plan must be selected; equal-weight cards cause decision paralysis. For tier counts, [coreyhaines31/marketingskills, pricing] calls 3 tiers "Industry standard" and 4+ a "Decision paralysis" risk ([pricing-strategy TIERS-AND-TRIALS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/pricing-strategy/TIERS-AND-TRIALS.md)). Move badges that overlap content.
3. **Price anchoring** (multiple plans). One concrete savings signal (computed discount, free-period callout, per-period comparison); vague phrases don't count; never hard-code discount percentages or savings amounts; don't stack signals.
4. **Price visibility.** Every package card must show its price.
5. **Content reduction.** More than 4 to 5 rows between headline and packages/CTA: remove the weakest.
6. **Layout.** Packages and CTA above the fold; an always-visible purchase action is strongest; never remove the purchase button or privacy footer; keep the package group and button adjacent, with at least 12px between them.
7. **Trust signals (required).** A short reassurance line between button and privacy footer ("Cancel anytime", "No commitment", trial terms). Order: packages, purchase button, reassurance text, privacy footer. With a trial, put terms near the CTA (e.g. "7-day free trial, then $X/month").
8. **Trial presentation.** State the trial in the CTA, in the headline, CTA or both, never only in legal text; for 7+ day trials with a trial-timeline layout, show clear start, reminder and charge dates.
9. **Anti-patterns.** Generic CTA copy; identical feature lists on several plan cards (compare on price only); negative-only value props ("No ads, No interruptions, No limits"); legal text as primary content (put it behind links, not in the privacy footer); a missing CTA; a missing privacy footer with Terms and Privacy Policy links (App Store compliance).
10. **Copy, last.** Outcome-led over feature-led ("Access all features" to "Master any language"); paragraphs over two lines become shorter or bullets; headlines address the user ("AI-powered photo editor" to "Make every photo stunning").

## Customer Center

Existing-subscriber management is in [CUSTOMER-CENTER.md](CUSTOMER-CENTER.md), including dashboard configuration, callbacks and Flutter/React Native views.

## Prove it

1. The app builds with the UI package (iOS 15 target; Flutter `MainActivity` extends `FlutterFragmentActivity`; Expo runs a development build).
2. The paywall renders the dashboard design, not the default fallback layout. If you see the fallback, the offering has no published paywall attached: fix it in the dashboard.
3. A sandbox purchase from the paywall dismisses it and fires purchase-completed (or resolves `purchased` / `PURCHASED`); afterwards `customerInfo.entitlements.active['premium']` exists. Closing without buying fires dismiss / `cancelled`.
4. No code path calls `purchasePackage` or `purchase` alongside a RevenueCatUI paywall.
5. Embedded `PaywallView` and `<RevenueCatUI.Paywall>` have non-zero size.

6. Paywall audit: CTA color unique, every package shows its price, packages and CTA above the fold, reassurance line and privacy footer with Terms and Privacy Policy present, none of the App Review disallowed patterns.
