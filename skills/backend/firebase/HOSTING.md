# Hosting and App Hosting

From [firebase/agent-skills, firebase-hosting-basics/SKILL.md; references/configuration.md; references/deploying.md; firebase-app-hosting-basics/SKILL.md; references/configuration.md; references/emulation.md].

## Select the hosting product

[firebase/agent-skills, firebase-hosting-basics/SKILL.md; firebase-app-hosting-basics/SKILL.md]

- Firebase Hosting serves configured static assets and supports rewrites to dynamic backends.
- App Hosting is a separate application-backend/deployment workflow. Inspect the supported framework, backend and configuration rather than treating it as another Hosting target.
- Reuse existing configuration and selected project. Deploy only the product/backend in the agreed task.
- Generic React/Next.js behavior belongs in [React](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/react/SKILL.md); generic containers/host migration belongs in [deployment](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/deployment/SKILL.md).

## Hosting route precedence

[Hosting full configuration](https://firebase.google.com/docs/hosting/full-config)

- Response priority is reserved namespace, redirects, exact static content, rewrites, custom 404, then default 404.
- Within redirects or rewrites, the first matching rule wins. Put specific rewrites before a catch-all.
- The source catch-all preceded specific routes, making those later rewrites unreachable for matching requests.
- A rewrite applies when no matching local file/directory exists. It serves destination content without an HTTP redirect.
- Keep a local SPA fallback distinct from a Cloud Function or Cloud Run rewrite; use the correct target fields and region.

## App Hosting configuration and local work

[firebase/agent-skills, firebase-app-hosting-basics/references/configuration.md; references/emulation.md; references/cli_commands.md]

- Inspect the backend's build/run configuration and environment before changing it.
- Keep secrets in the documented secret mechanism rather than printing or committing their values.
- Use the product-specific local/emulation workflow. A local run does not establish that a deployed backend has received the configuration.
- Report actual rollout/deployment state and blockers rather than claiming success from prepared files alone.

## Prove it

The chosen product, project and backend are explicit; route order follows first-match semantics; specific routes are not shadowed by a catch-all; and local versus deployed verification is reported accurately. [firebase/agent-skills, firebase-hosting-basics/SKILL.md; firebase-app-hosting-basics/SKILL.md]
