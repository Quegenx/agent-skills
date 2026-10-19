---
name: firebase
description: "Builds Firebase web and Flutter backends and clients: setup, Authentication, AI Logic, Firestore Core and Pipelines, Security Rules, Flutter Storage downloads and FCM messaging, SQL Connect, Hosting, Functions migration and Remote Config templates. Use when adding or fixing Firebase in TypeScript, JavaScript, Node or Flutter, or working with Firebase Data Connect or SQL Connect."
---

# Firebase

From [firebase/agent-skills], with corrections checked against Firebase documentation and current SDK source. Flutter Storage downloads also draw on [ApparenceKit](https://apparencekit.dev/flutter-tips/download-file-firebase-flutter-progress/), corrected against the [official download guide](https://firebase.google.com/docs/storage/flutter/download-files). Flutter messaging also draws on [ApparenceKit](https://apparencekit.dev/blog/flutter-notifications-push-and-locale/) and [FlutterPro](https://flutterpro.design/details/time-sensitive-notifications), with the existing Firebase message-type and handler corrections retained. This skill covers the supplied web, Node and Flutter material. Native-only Swift/Kotlin, Crashlytics and Xcode setup are outside this repository's stack.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Select the service and scope | [SKILL.md](SKILL.md) |
| Identify the project, apps, SDKs, configuration and emulator | [SETUP.md](SETUP.md) |
| Sign in, observe auth state and link accounts | [AUTH.md](AUTH.md) |
| Add client Gemini generation with attestation | [AI-LOGIC.md](AI-LOGIC.md) |
| Use Firestore documents, listeners and indexes | [FIRESTORE.md](FIRESTORE.md) |
| Choose Enterprise Pipeline operations and interpret query costs | [FIRESTORE-PIPELINES.md](FIRESTORE-PIPELINES.md) |
| Author or audit Firestore Security Rules | [SECURITY-RULES.md](SECURITY-RULES.md) |
| Download Flutter Storage objects with bounded memory, file tasks and progress | [STORAGE.md](STORAGE.md) |
| Register Flutter FCM devices, handle message types and notification taps, and send time-sensitive payloads | [MESSAGING-FLUTTER.md](MESSAGING-FLUTTER.md) |
| Define SQL Connect schema, authorized operations and local data | [SQL-CONNECT.md](SQL-CONNECT.md) |
| Use generated web/Flutter SDKs or privileged Node operations | [SQL-CONNECT-SDKS.md](SQL-CONNECT-SDKS.md) |
| Choose SQL vector, full-text or pattern search | [SQL-CONNECT-SEARCH.md](SQL-CONNECT-SEARCH.md) |
| Choose Hosting or App Hosting and order routes | [HOSTING.md](HOSTING.md) |
| Convert an Extension to a Functions codebase | [FUNCTIONS-MIGRATION.md](FUNCTIONS-MIGRATION.md) |
| Review and deploy a Remote Config template | [REMOTE-CONFIG.md](REMOTE-CONFIG.md) |

## The rules

1. **Resolve the actual project and platform first.** Inspect existing configuration, registered apps, installed packages and CLI context before creating resources. [firebase/agent-skills, firebase-basics/SKILL.md]
2. **Provisioning and initialization are separate.** Client configuration does not enable AI Logic or an auth provider in the project. [firebase/agent-skills, firebase-ai-logic-basics/SKILL.md; firebase-auth-basics/SKILL.md]
3. **Choose the database contract explicitly.** Firestore Core, Enterprise Pipelines and SQL Connect are different APIs; Native mode alone does not identify an edition. [Firebase edition comparison](https://firebase.google.com/docs/firestore/compare-editions-for-native-mode)
4. **Authenticate and authorize separately.** SQL Connect USER is an authentication floor, not a row-ownership rule; Firestore writes must validate the incoming state. [SQL authorization](https://firebase.google.com/docs/data-connect/authorization-and-security), [Firestore conditions](https://firebase.google.com/docs/firestore/security/rules-conditions)
5. **Use the generated or installed contract.** Read generated schema/operations and installed SDK types before copying version-sensitive APIs. [firebase/agent-skills, firebase-data-connect/SKILL.md; extension-to-functions-codebase/SKILL.md]
6. **Keep secrets and attestation distinct.** App Check debug tokens are private credentials. App attestation does not replace user authorization. [firebase/agent-skills, firebase-ai-logic-basics/SKILL.md], [SQL authorization](https://firebase.google.com/docs/data-connect/authorization-and-security)
7. **Do not turn source templates into invented working applications.** Correct the documented source defects and retain actual error outcomes. Generic [security](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/secure-coding/SKILL.md), [SQL](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/sql-patterns/SKILL.md) and [background jobs](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/background-jobs/SKILL.md) stay with their owners. [firebase/agent-skills, firebase-data-connect/examples.md; firebase-data-connect/templates.md]
8. **Keep deployment within the agreed scope.** Prepare a reviewable project/template change before an outward action whose scope is not already authorized. [firebase/agent-skills, firebase-remote-config-basics/SKILL.md]

## Gotchas

- Enterprise indexes are optional and not created automatically; unindexed queries can scan collections. The supplied index comparison said they were required. [Enterprise indexes](https://firebase.google.com/docs/firestore/enterprise/index-overview-native)
- Functions concurrency 80 is a default, not the maximum. [Manage Functions](https://firebase.google.com/docs/functions/manage-functions#allow-concurrent-requests)
- The supplied checkout and transfer examples omit business and authorization conditions; do not present them as complete secure implementations. [firebase/agent-skills, firebase-data-connect/examples.md]

## Prove it

The selected project/app, service, edition and installed SDK contract are explicit; every operation has its actual authorization boundary; source corrections retain an official URL and the old claim; no unsupported native material or invented sample code was added. [firebase/agent-skills]
