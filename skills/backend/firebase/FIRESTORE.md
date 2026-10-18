# Firestore Core

From [firebase/agent-skills, firebase-firestore/SKILL.md; references/standard/web_sdk_usage.md; references/standard/flutter_setup.md; references/standard/indexes.md].

## Choose the database contract

[Firestore edition comparison](https://firebase.google.com/docs/firestore/compare-editions-for-native-mode)

- Record edition and database identity, not just Native mode. Standard and Enterprise both support Native mode.
- Core operations cover documents, CRUD, real-time listeners and offline persistence; Pipeline operations are a separate Enterprise query branch.
- Standard queries require indexes, with automatic single-field indexes and separately managed composites. Enterprise indexing differs; read [FIRESTORE-PIPELINES.md](FIRESTORE-PIPELINES.md).
- Avoid importing an index or pricing assumption from the wrong edition.

## Client data flow

[firebase/agent-skills, firebase-firestore/references/standard/web_sdk_usage.md; references/standard/flutter_setup.md]

- Reuse initialized app/database instances. Web uses modular collection/document/query operations; Flutter uses its Firestore SDK.
- Choose explicit document identity versus generated identity according to the actual data contract.
- Compose query filters, ordering and pagination against the intended indexes. Keep database values and app-model conversions explicit.
- A listener is a lifecycle resource. Create/retain it for the intended owner and dispose/cancel it when that owner ends.
- Preserve loading, empty, permission-denied and failed reads as different outcomes. The supplied Flutter fallbacks must not turn failures into fabricated successful data.
- Use transactions or batched writes for their supported atomic operations; authorization still comes from [Security Rules](SECURITY-RULES.md).

## Query authorization

Use the canonical [query-authorization rule](SECURITY-RULES.md#documents-and-atomic-work) when selecting client queries; that topic owns rule/filter semantics and the client access boundary. [firebase/agent-skills, firebase-firestore/SKILL.md]

## Prove it

The edition/database, query/index assumptions and authorization constraints are explicit; listeners have one lifecycle owner; errors are not reported as empty successful reads; atomic work uses the intended transaction or batch contract. [firebase/agent-skills, firebase-firestore/SKILL.md]
