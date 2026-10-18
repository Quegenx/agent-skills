# Remote Config templates

From [firebase/agent-skills, firebase-remote-config-basics/SKILL.md]. The supplied platform setup files are native-only; this topic retains the supported CLI/template workflow and the product's loading distinction without inventing web/Flutter SDK examples.

## Inspect and prepare

[firebase/agent-skills, firebase-remote-config-basics/SKILL.md]

- Identify the actual project and app before retrieving a template. Inspect login and selected project when CLI context is missing.
- Download the current template to a local reviewable JSON file; keep conditions and parameters tied to their intended audience.
- Preserve existing configuration. A missing registry download is not a reason to silently install global tooling or switch projects.
- Prepare the proposed template/configuration change before requesting any missing deployment authority.

## Publish only within scope

[firebase/agent-skills, firebase-remote-config-basics/SKILL.md]

- The source separates local editing from user review and deployment. Follow the user's existing authorization; when publication is not already authorized, ask for that concrete prepared change.
- Ensure firebase.json maps the selected local template before deploying the Remote Config service.
- Verify the resulting version history after an authorized deployment; prepared JSON is not evidence of a live change.
- This maintenance skill does not authorize changing production feature flags merely because their template can be downloaded.

## Loading is a product decision

[Remote Config loading strategies](https://firebase.google.com/docs/remote-config/loading)

- Set local defaults so startup/offline behavior does not depend on the first network fetch.
- Fetching remote values and activating them are separate decisions. Choose when a newly fetched value can affect the current session.
- The source favors activating previously fetched values on startup and fetching later values in the background for the next startup.
- Do not turn a real-time listener into a promise that every visible setting should change immediately. Preserve the intended activation boundary.
- AI model selection can use a reviewed Remote Config parameter; see [AI-LOGIC.md](AI-LOGIC.md).

## Prove it

The local template and target project are explicit, conditions/parameters have the intended audience, deployment remains within authorization, actual version state is reported and loading/activation behavior has local defaults. [firebase/agent-skills, firebase-remote-config-basics/SKILL.md]
