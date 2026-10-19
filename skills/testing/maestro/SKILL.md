---
name: maestro
description: "Sets up, writes and debugs Maestro YAML end-to-end flows for React Native, Expo and Flutter: selectors, waiting, auth, input, permissions, device setup and CI. Use when a project uses Maestro flows, Maestro Studio or Maestro MCP, or the user asks for Maestro tests."
---

# Maestro

Maestro guidance from tovimx/maestro-mobile-testing-skill and mobile-dev-inc/maestro-docs, with the existing official/source corrections retained. Shared YAML, installation and device behavior stay separate from Flutter-specific semantics and builds. Patrol and tester-army/e2e are separate tools and are not prerequisites. [tovimx/maestro-mobile-testing-skill, maestro-mobile-testing/SKILL.md; mobile-dev-inc/maestro-docs, Flutter and command references]

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Install/run Maestro, select controls, wait/scroll, handle auth, input/keyboard, permissions, OTP, devices, CI and MCP | [MAESTRO.md](MAESTRO.md) |
| Flutter builds, launch arguments, Flutter Web, limitations and the sourced tool comparison | [FLUTTER.md](FLUTTER.md) |
| Flutter identifiers, labels and merged accessibility nodes | [FLUTTER-SEMANTICS.md](FLUTTER-SEMANTICS.md) |

## The rules

1. **Inspect the actual target hierarchy.** Use Studio or `maestro hierarchy`; choose selectors from what the device exposes. Flutter Keys are not external accessibility identifiers. [mobile-dev-inc/maestro-docs, Flutter selectors]
2. **Use Maestro's own selector contract.** Its text/id matching and first-match behavior differ from tester-army/e2e. Prefer stable testIDs for dynamic or translated text and relative selectors over fragile indexes. [tovimx/maestro-mobile-testing-skill, selectors; mobile-dev-inc/maestro-docs, selectors]
3. **Wait on state.** Use assertions or `extendedWaitUntil`; automatic settling does not make an animation timeout proof of completion. [mobile-dev-inc/maestro-docs, assertions and waitForAnimationToEnd]
4. **Scope auth workarounds to their source suite and symptoms.** iOS Keychain state is separate from `clearState`; do not silently clear the whole Keychain. Readiness markers must actually appear in the native hierarchy. [tovimx/maestro-mobile-testing-skill, auth pre-flight; mobile-dev-inc/maestro-docs, clearKeychain]
5. **Keep version conflicts visible.** The documented Android Unicode input limitation and upstream source route disagree; establish installed/released support before replacing the documented contract. [mobile-dev-inc/maestro-docs, inputText; mobile-dev-inc/Maestro, AndroidDriver]
6. **Assert outcomes instead of hiding missing actions.** Use `optional: true` only for truly optional actions. A UI deadline alone does not prove optimistic behavior without response-order evidence. [tovimx/maestro-mobile-testing-skill, patterns]

## Prove it

A selected flow passes `maestro test <file>` and its evidence shows the intended state changes. Apply the React Native/Expo auth checklist only to that source suite; Flutter flows use the separate [Flutter acceptance](FLUTTER.md#prove-it). Name the targets actually run. [tovimx/maestro-mobile-testing-skill, source-suite checklist; mobile-dev-inc/maestro-docs, Flutter; owner AGENTS.md]
