# SQL Connect schema and operations

From [firebase/agent-skills, firebase-data-connect/SKILL.md; reference/schema.md; reference/operations.md; reference/security.md; reference/config.md; reference/data_seeding.md]. The source calls the product SQL Connect, formerly Data Connect; configuration and SDK identifiers can still use dataconnect.

## Keep schema, connector and generated contract together

[firebase/agent-skills, firebase-data-connect/SKILL.md; reference/config.md; reference/schema.md]

- The schema defines relational tables and relationships; connector files define client queries/mutations and SDK generation.
- Inspect both user schema and generated schema extensions before choosing operation fields.
- Use actual @table/@col/default/reference definitions and their generated types. A referenced key must match the schema's type and identity.
- Prefer the typed GraphQL operation route for ordinary CRUD and relationships. The source reserves native SQL for requested/required advanced database work.
- Treat schema migration, operation deployment and generated SDK compatibility as one reviewed contract change. Generic database migration discipline belongs in [Postgres](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/postgres/SKILL.md).

## Authorize each operation

[SQL Connect authorization](https://firebase.google.com/docs/data-connect/authorization-and-security)

- @auth access levels range from PUBLIC to privileged-only NO_ACCESS. USER excludes anonymous sign-in; USER_ANON includes it.
- USER establishes authenticated access, not ownership of an arbitrary supplied row ID.
- Use server-evaluated auth identity, row filters and applicable @check conditions for resource access and business invariants.
- @redact controls whether an embedded authorization query's results reach the client; it does not itself grant access.
- Keep caller-selectable values distinct from values derived from trusted auth claims.

## Writes, transactions and local data

[firebase/agent-skills, firebase-data-connect/reference/operations.md; reference/data_seeding.md; examples.md; templates.md]

- Choose insert/update/delete/upsert according to the actual operation. Upsert is useful where repeated user-profile synchronization must not create duplicates.
- Use the supported transaction directive for multi-step atomic work and inspect response bindings before using a prior step.
- Local seeds belong in the local development path. Match UUID fields with valid UUID data or the declared generated default.
- The supplied checkout leaves total at zero without complete order-line/cart/stock handling. Its transfer does not establish amount, ownership or balance conditions. Those are incomplete examples, not secure production workflows.
- Do not invent replacement business code or seed fixtures. Retain the sourced operation mechanics and define the actual application contract first.
- Native SQL uses positional parameters for values; never interpolate untrusted values into raw SQL. Read generated/current native-SQL contracts before selecting its escape hatch. [firebase/agent-skills, firebase-data-connect/reference/native_sql.md]

## Prove it

Schema, generated fields, connector operations and target SDK agree; each client operation authorizes the intended rows; atomic invariants are explicit; local seeds match types; and incomplete source templates are not described as complete applications. [firebase/agent-skills, firebase-data-connect/SKILL.md]
