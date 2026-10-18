# Firestore Pipelines

From [firebase/agent-skills, firebase-firestore/references/enterprise/data_model.md; references/enterprise/web_sdk_usage.md; references/enterprise/indexes.md], corrected against the official Enterprise docs and JS SDK.

## Edition and API entry point

[Enterprise Native mode](https://firebase.google.com/docs/firestore/enterprise/pipelines-overview), [SDK pipeline source](https://github.com/firebase/firebase-js-sdk/blob/main/packages/firestore/pipelines/pipelines.ts)

- Pipelines belong to the Enterprise query contract. Do not infer Enterprise from Native mode alone.
- db.pipeline() is a real API in the documented pipeline SDK surface. Inspect the installed package's pipeline entry point and preview/version requirements before importing it.
- Core and Pipeline operations coexist but are different query APIs. Do not rewrite a Core query by guessing similarly named pipeline stages.

## Build the requested query

[Firebase Pipeline API](https://github.com/firebase/firebase-js-sdk/blob/main/common/api-review/firestore-pipelines.api.md)

- Start from the actual source: collection, collection group, database, explicit documents or a supported existing query.
- Compose supported selection, filtering and aggregation stages using the installed expression API.
- Keep source selection and projected fields explicit; use the actual returned result contract.
- Choose the user's web or Flutter SDK branch from the supplied guide and verify platform support instead of translating native-only examples.

## Indexes, scans and cost

[Enterprise index overview](https://firebase.google.com/docs/firestore/enterprise/index-overview-native), [edition comparison](https://firebase.google.com/docs/firestore/compare-editions-for-native-mode)

- Enterprise indexes are optional and not automatically created. The supplied comparison treated indexes as required.
- A query without a useful index can scan a collection and grow expensive/slow. Optional does not mean unnecessary.
- Use Query Explain/Insights to identify the actual query work before adding indexes; indexes add storage and write work.
- Keep byte-tranche billing and real-time update treatment separate from Standard document-operation pricing. Do not carry over a sampled regional price as universal.
- The documented forceIndex primary option requests a scan; it is not a default performance improvement. [Query optimization](https://firebase.google.com/docs/firestore/enterprise/optimize-query-performance)

## Prove it

The edition and installed pipeline API are verified, source/stages match the question, and any performance claim cites the actual query work. No automatic-index or Standard-pricing assumption leaked into Enterprise guidance. [firebase/agent-skills, firebase-firestore/SKILL.md]
