# Authentication

From [firebase/agent-skills, firebase-auth-basics/SKILL.md; references/client_sdk_web.md; references/flutter_setup.md; references/security_rules.md].

## Provider and session lifecycle

[firebase/agent-skills, firebase-auth-basics/SKILL.md; references/client_sdk_web.md; references/flutter_setup.md]

- Enable the required sign-in provider in the selected project and configure that provider for the registered app.
- Observe the SDK's auth-state stream/listener for signed-in versus signed-out UI; account for initial/loading state rather than assuming a current user exists.
- Keep sign-in, cancellation, provider errors and sign-out outcomes distinct. Do not report successful logout after swallowing an auth error.
- Client session state identifies a user. Enforce the resource's access policy on the service side through [Security Rules](SECURITY-RULES.md) or [SQL operations](SQL-CONNECT.md).

## Flutter Google Sign-In

[Google Sign-In reference](https://pub.dev/documentation/google_sign_in/latest/index.html)

- Initialization is asynchronous. Complete GoogleSignIn initialization before starting dependent authentication/authorization work; event subscription and lightweight authentication follow that initialization.
- The supplied setup invoked initialization without waiting, allowing dependent work to race it. The official example sequences subsequent work after initialization.
- Use the platform-supported user-initiated sign-in route. supportsAuthenticate distinguishes platforms that can use authenticate from platform-specific button flows.
- authorizeScopes returns client authorization to Google services. Its access token is not a server authorization code. The source described this client-token operation as server authorization.
- Preserve user-interaction requirements when requesting additional scopes.

## Anonymous-account upgrade

[Firebase Flutter anonymous auth](https://firebase.google.com/docs/auth/flutter/anonymous-auth), [web anonymous auth](https://firebase.google.com/docs/auth/web/anonymous-auth)

- Anonymous sign-in is an explicitly enabled provider path, not a prerequisite for every Firebase feature.
- To retain an anonymous user's data while moving to a permanent credential, link the credential to the current user.
- Handle already-linked, invalid and already-in-use credentials as their actual collision cases; do not silently create an unrelated account or claim a merge succeeded.
- SQL Connect USER excludes anonymous users; select the documented access level for the intended policy. [SQL authorization](https://firebase.google.com/docs/data-connect/authorization-and-security)

## Prove it

Provider configuration matches the selected app, asynchronous initialization precedes dependent calls, auth-state UI follows SDK state, and account linking/error outcomes are explicit. Service-side authorization remains independent of the client session. [firebase/agent-skills, firebase-auth-basics/SKILL.md]
