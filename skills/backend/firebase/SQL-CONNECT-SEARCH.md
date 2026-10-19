# SQL Connect search

From [firebase/agent-skills, firebase-data-connect/reference/search.md], checked against the official SQL Connect search and generated query references. Shared embedding/RAG design remains in [AI features](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/ai-features/SKILL.md); general SQL tuning remains in [performance](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/SKILL.md).

## Choose by matching behavior

[Full-text search](https://firebase.google.com/docs/sql-connect/solutions-full-text-search)

- Full-text search matches words/phrases with lexical stemming and can search multiple configured columns.
- Vector similarity retrieves semantically close rows using the vector field.
- String-pattern filters address exact/pattern matches. Choose from the task rather than treating semantic search as a default replacement for lexical filtering.

## Vector fields and queries

[Vector search](https://firebase.google.com/docs/sql-connect/solutions-vector-similarity-search), [query reference](https://firebase.google.com/docs/reference/sql-connect/gql/query)

- A Vector field needs an explicit matching dimension in its column definition. Use the actual selected embedding model's output dimensions, not a universal copied model size.
- Use the same compatible model representation for stored and query embeddings.
- The _embed route invokes the integrated embedding provider. compare_embed generates a query embedding, while compare accepts an existing raw Vector.
- The source's blanket Vertex-AI requirement must be scoped to the integrated generation path: the official query API also supports raw-vector compare.
- Inspect the generated per-field similarity operation. method, within, filters and result limits are explicit parameters.
- Read returned distance metadata before selecting within. Changing distance method changes its scale and requires retuning; no copied threshold is universal.

## Full-text schema and query

[Full-text search](https://firebase.google.com/docs/sql-connect/solutions-full-text-search), [directives](https://firebase.google.com/docs/reference/sql-connect/gql/directive)

- Mark supported String fields with @searchable; the generated table search operation returns the selected fields.
- The default language is English. Configure the actual content language for stemming; columns searched together must share the same language.
- Choose supported queryFormat according to the desired query interpretation rather than passing untrusted input as an assumed advanced expression.
- Inspect relevance metadata and the relevanceThreshold option before filtering weak matches. Keep lexical relevance distinct from vector distance.
- Read the current generated query reference for field names/defaults rather than guessing pluralization or treating a source example as the app's schema.

## Prove it

The search type matches the user's question; stored/query embedding dimensions and models match; raw-vector and integrated generation paths are distinguished; lexical language and query format are explicit; and relevance thresholds trace to observed results. [firebase/agent-skills, firebase-data-connect/reference/search.md]
