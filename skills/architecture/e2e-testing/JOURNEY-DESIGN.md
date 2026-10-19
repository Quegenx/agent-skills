# Designing an end-to-end journey

The journey contract below comes from the owner's AGENTS.md. The Flutter tool comparison preserves the tagged views from mobile-dev-inc/maestro-docs, leancodepl/patrol and tester-army/e2e; each tool's implementation stays in its own skill.

## Journey contract

[owner AGENTS.md, End-to-End and Acceptance Tests]

- Cover one coherent user journey per test.
- Write steps as plain-language instructions a teammate could follow without reading the implementation. Describe user intent and observable outcomes, not selectors, component names, internal APIs, or arbitrary waits.
- Give each step one purpose and stopping point. Keep actions and assertions separate. Use visible labels and business context to disambiguate actions.
- Make every assertion specific enough to pass or fail objectively. Require exact wording only when the wording is part of the behavior.
- Keep secrets out of test definitions, output, and reports.
- Report the exact validation performed and its actual result. Do not claim coverage for tests that were not created, updated, and run.

## Choosing a Flutter tool

[mobile-dev-inc/maestro-docs, Flutter comparison; leancodepl/patrol, comparison; tester-army/e2e, mobile engine]

| | Patrol | Maestro | e2e (`@e2e-dev/mobile`) |
|---|---|---|---|
| Where the test runs | Dart code inside the app process | outside, through a companion driver app on the device | outside, through `agent-device` |
| How it finds widgets | Keys | Semantics labels and identifiers in the accessibility tree | the accessibility tree; `testId` is the accessibility identifier (iOS) or resource id (Android) |
| App changes | `patrol` dependency, native setup ([patrol: PATROL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/patrol/PATROL.md)) | none in `pubspec.yaml`; tests the compiled APK or IPA | none in the app; a separate `e2e/` test project beside it |
| Tests are | Dart | YAML flows | TypeScript, with optional agent steps |
| Physical iPhone | see [patrol: PATROL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/patrol/PATROL.md) | official CLI on simulators only | yes, but permissions, `clearState`, location, appearance, biometrics and keychain are simulator-only |

- **Pick Maestro or e2e when the test must stay outside the app:** Maestro tests "remain stable across Flutter version updates because Maestro does not depend on the internal widget tree", and reaches system flows like push notifications and permission dialogs, which "in-app Dart frameworks cannot reach".
- **Comparison conflict:** Maestro's quoted framing above says in-app Dart frameworks cannot reach system flows; Patrol's guide documents Dart-driven native permission dialogs and platform automation. Preserve both source views, and use Patrol's own guide for its capabilities rather than interpreting the Maestro quote as a Patrol restriction. [mobile-dev-inc/maestro-docs, Flutter comparison; leancodepl/patrol, native automation]
- **Maestro's own comparison** (from the tool's maker): Maestro supports native dialogs and release builds; Flutter Driver is debug or profile only with no native dialogs; Maestro's element selection is "Accessibility labels/IDs only".
- **Patrol vs Maestro, from Patrol's maker** (LeanCode, so not neutral; this is the only comparison of the two in the sources): Patrol tests are Dart inside the app process and select by Keys, Maestro drives from outside through the accessibility tree; "On iOS, Maestro's official CLI runs on simulators only", and physical iOS has been the most requested Maestro feature since January 2023 (#686); Maestro installs in one line, Patrol takes more setup; Patrol toggles Wi-Fi, cellular and Bluetooth on both platforms, Maestro offers airplane mode on Android only.
- **e2e** mixes exact locator steps with agent goals, and its agent can drive a screen with no accessibility nodes from screenshots. Its network controls are Android only too: `device.setNetwork('offline')` and `device.setAirplaneMode(true)` fail with `UNSUPPORTED_CAPABILITY` on iOS, and airplane mode needs Android 11+. Its docs do not mention Patrol.
- **Porting Maestro flows to e2e** is [tester-army-e2e: SUITE-MIGRATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/architecture/tester-army-e2e/SUITE-MIGRATION.md); the e2e runner in general is [tester-army-e2e: RUNNER-SETUP.md](https://github.com/Quegenx/agent-skills/blob/main/skills/architecture/tester-army-e2e/RUNNER-SETUP.md).

## Prove it

The journey names the user intent, separate actions and observable checks. The chosen installed framework and the evidence actually obtained are explicit; missing execution is reported as unverified. Framework setup, selectors, repeat counts and CLI flags come from that framework's own skill, not another runner's defaults. [owner AGENTS.md, End-to-End and Acceptance Tests; tester-army/e2e, mobile engine; leancodepl/patrol, test setup; mobile-dev-inc/maestro-docs, setup]
