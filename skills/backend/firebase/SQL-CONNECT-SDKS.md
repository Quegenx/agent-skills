# SQL Connect clients and Node administration

From [firebase/agent-skills, firebase-data-connect/reference/sdk_web.md; reference/sdk_flutter.md; reference/sdk_admin_node.md; reference/realtime.md].

## Generate the application contract

[firebase/agent-skills, firebase-data-connect/SKILL.md; reference/config.md; reference/sdk_web.md; reference/sdk_flutter.md]

- Configure the supported client SDK output for the actual application and regenerate it after operation changes.
- Client methods call server-defined operations. Deploy the intended operation contract and preserve compatibility with clients already using it.
- Keep generated code and user application logic separate. Do not hand-edit generated SDK files as a substitute for changing schema/operations.
- Configure emulator routing explicitly for local work; do not accidentally route production operations to a local emulator or vice versa.

## Web and Flutter

[firebase/agent-skills, firebase-data-connect/reference/sdk_web.md; reference/sdk_flutter.md]

- Web uses generated operation functions or references with the Firebase data-connect SDK. Inspect the actual generated response wrapper before reading data.
- Flutter uses the generated connector and operation execution methods; optional operation arguments use the generated builder contract.
- Preserve unknown enumeration values when schema/client versions differ. Web requires an explicit unknown branch; Flutter's generated enum wrapper exposes known/unknown representation.
- Subscriptions and cache policies are installed-SDK contracts. Inspect their actual observer names, unsubscribe/cancel behavior and query reference types before use.
- The source offers TanStack-generated React hooks and native caching/subscriptions as alternative client approaches. Keep one owner for a given operation's state and link general React rules to [React](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/react/SKILL.md).
- Do not copy unverified polling intervals, caching storage promises or new API minima. Source native-only SDK examples remain excluded.

## Privileged Node operations

[Admin DataConnect API](https://firebase.google.com/docs/reference/admin/node/firebase-admin.data-connect.dataconnect)

- Use the Admin SDK's selected service/connector contract on the server. Do not treat it as a client-side authorization boundary.
- executeQuery/executeMutation without auth impersonation run with admin privileges and ignore auth directives.
- If evaluating a user policy, use the documented explicit auth-evaluation option rather than assuming an admin request represents the current client.
- Keep arbitrary administrative GraphQL access separate from the generated client operations. A server method's existence does not authorize its exposure as an app endpoint.

## Prove it

Generated and deployed operations match the intended contract, client parsing follows actual generated types, subscriptions have cleanup, unknown enum values have an outcome and privileged Node access is not mistaken for enforced client authorization. [firebase/agent-skills, firebase-data-connect/SKILL.md]
