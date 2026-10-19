# PlanetScale Postgres operations

Sources: [planetscale/database-skills, postgres, ps-connection-pooling, ps-insights, ps-cli-api-insights and ps-extensions], checked against PlanetScale's current Postgres and CLI documentation. Generic pool semantics remain in [CONNECTIONS.md](CONNECTIONS.md); query plans and index choices remain in [performance-and-caching QUERIES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/QUERIES.md).

## Identify the connection target

[https://planetscale.com/docs/postgres/connecting/pgbouncer]

- Distinguish a direct connection, the local PgBouncer and a dedicated PgBouncer target. The local pool on port 6432 routes to the primary; a dedicated replica pool is a different target and can serve replica traffic. Do not generalize local-pool behavior to every 6432 endpoint.
- Use the generated credential and documented username suffix for the chosen target. Preserve the full connection identity rather than replacing a suffix from a generic Postgres example.
- Current PlanetScale PgBouncer documents `max_prepared_statements`, default 200, for protocol-level named statements. The source's blanket prohibition across transactions is stale; SQL PREPARE/EXECUTE remains different. Generic version/configuration rules: [CONNECTIONS.md](CONNECTIONS.md#pool-modes-and-what-they-forbid).
- Verify the actual host, primary/replica role and credentials before an operation. Pooling does not change which database or privilege scope was selected.

## Inspect before changing

[planetscale/database-skills, postgres, ps-insights and ps-cli-api-insights]

Start with the selected database's schema and query evidence, current permissions and actual slow-query symptoms. Use existing [monitoring queries](MONITORING.md) and [query-plan discipline](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/QUERIES.md#the-rules) for generic diagnosis; provider reports supplement that evidence.

[https://planetscale.com/docs/cli/insights]

Current CLI exposes `pscale insights` for queries, errors, anomalies and recommendations, and `pscale inspect` for inspection. Discover installed command help and required project permissions before using a command; fixed MCP tool names from the source do not establish a connected server's schema.

[https://planetscale.com/docs/api/reference/list_generated_query_patterns_reports]

The query-patterns collection path is `/organizations/{organization}/databases/{database}/branches/{branch}/query-patterns`; the source used `query-patterns-reports`. The branch segment identifies the selected database resource. It is not an instruction to create a branch or import a GitHub lifecycle workflow.

## Extensions and operational scope

[planetscale/database-skills, postgres, ps-extensions]

Check current extension availability, deployment configuration and permissions before planning an install or depending on an extension. A source list is not a promise that every hosted database exposes it. Installation, restart and destructive maintenance need the existing [Postgres authorization boundary](SKILL.md#the-rules); a provider comparison does not authorize provisioning or a hosting move.

## Prove it

The selected target is identified as direct/local/dedicated and primary/replica; the pooler version and prepared-statement policy match the driver; inspection uses actual query/schema evidence and permitted operations; API/resource identities are explicit; and extension availability was verified for the chosen deployment.
