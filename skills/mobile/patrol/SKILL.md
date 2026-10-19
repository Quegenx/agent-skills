---
name: patrol
description: "Sets up, writes and debugs Flutter end-to-end tests with Patrol: Dart tests, native automation, test keys, feature modules and platform failures. Use when a Flutter project uses Patrol, patrol_cli or Patrol MCP, or the user asks for Patrol tests."
---

# Patrol

Patrol drives a Flutter app and its native platform from Dart tests. This skill contains the leancodepl/patrol setup, test-authoring, test-key and diagnostic guidance, including existing corrections against Patrol's official documentation. LeanCode's module and key conventions remain source suite style, distinguished from API restrictions. Maestro and tester-army/e2e are separate tools and are not prerequisites. [leancodepl/patrol, patrol-write-test, test keys and setup; https://patrol.leancode.co/documentation]

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Set up Patrol, run tests/MCP, write inline then extract modules, add shared Keys, handle native dialogs and diagnose failures | [PATROL.md](PATROL.md) |

## The rules

1. **Match Patrol and CLI versions against the official compatibility table.** Native automation runs under `patrol test` or `patrol develop`, not `flutter test`. Importing `flutter_test` assertions and finders is allowed. [leancodepl/patrol, setup; https://patrol.leancode.co/documentation/compatibility-table]
2. **Prove the harness first.** The source's first-time setup covers Android: use a minimal self-contained test and a fully booted emulator before app/backend scenarios. Other platforms need their official native setup. [leancodepl/patrol, setup]
3. **Preserve the selected suite style.** LeanCode's convention writes inline first, proves it, moves Patrol calls into modules, and proves it again. Its Keys-only finder convention is not an API restriction. [leancodepl/patrol, patrol-write-test]
4. **Keep Keys shared with the app.** Key only widgets involved in testing, use the feature key files, and avoid unrelated app changes. Accessibility-tree identifiers belong to outside-the-app runners and do not replace Patrol's Keys convention. [leancodepl/patrol, test keys; mobile-dev-inc/maestro-docs, Flutter comparison]
5. **Keep the assertion-style conflict explicit.** LeanCode prefers assertions at the end; the owner's journey contract keeps separate intermediate observable assertions where outcomes matter. Follow the owner's authorized journey contract. [leancodepl/patrol, patrol-write-test; owner AGENTS.md]
6. **Handle native dialogs when triggered and diagnose from the actual error.** Check the installed API before writing it; keep destructive cache cleanup cause-specific and authorized. [leancodepl/patrol, native dialogs and diagnostics; owner AGENTS.md]

## Prove it

Use the Patrol-only acceptance in [PATROL.md](PATROL.md#prove-it), for the platform and suite convention selected. Report exact runs and remaining limitations. Maestro hierarchy checks, tester-army/e2e scripts and Flutter Web setup are not Patrol acceptance steps. [leancodepl/patrol, test setup and patrol-write-test; owner AGENTS.md]
