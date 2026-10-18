# Project and client setup

From [firebase/agent-skills, firebase-basics/SKILL.md; references/local-env-setup.md; references/web_setup.md; references/flutter_setup.md].

## Inspect before initializing

[firebase/agent-skills, firebase-basics/SKILL.md; references/firebase-service-init.md]

- Identify the intended project, registered target app and actual platform. Inspect firebase.json, .firebaserc and existing SDK initialization before creating duplicates.
- Inspect package files and installed tooling. Prefer existing project tooling; a missing registry download is not a reason to install unrelated system packages.
- Use the current CLI's selected project or explicit project selection. A login is not proof that the intended project is active.
- Initialize only the service needed by the task. Preserve unrelated service configuration and existing registered app identifiers.

## Web and Flutter

[firebase/agent-skills, firebase-basics/references/web_setup.md; references/flutter_setup.md]

- Web uses the Firebase JS SDK and its modular API. Reuse the app's configured FirebaseApp rather than scattering initialization through components.
- Flutter uses Firebase Core and FlutterFire configuration for the supported target platforms. Initialize Firebase before using dependent services.
- Keep platform configuration associated with the correct registered app. Do not substitute an unrelated fixture/project.
- Add the requested service's SDK only after checking existing dependencies and the actual generated configuration.

## Local versus deployed work

[firebase/agent-skills, firebase-basics/references/local-env-setup.md; firebase-data-connect/reference/config.md]

- Distinguish emulator addresses from deployed services. Configure emulator routing before operations and keep local seed data local.
- Review project/configuration differences before deploying a selected service. An emulator result does not prove a production deployment changed.
- A skill/plugin installation is separate from service setup. This repository does not require vendor plugin scaffolding.

## Prove it

The project, app and platform match the user's task; existing configuration was reused; emulator versus deployed routing is explicit; and any blocked provisioning step is reported rather than silently skipped. [firebase/agent-skills, firebase-basics/SKILL.md]
