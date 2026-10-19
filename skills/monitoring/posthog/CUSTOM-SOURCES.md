# Custom PostHog REST sources

Use when no native warehouse connector fits and a custom REST manifest is required. Existing source operation, sync tuning and recovery stay in [DATA-WAREHOUSE.md](DATA-WAREHOUSE.md). [existing skills/monitoring/posthog/DATA-WAREHOUSE.md]

## Custom REST source

[existing DATA-WAREHOUSE.md, Custom REST source]

- **Alpha.** At most 50 resources per manifest; at most 5 Custom sources per project. The manifest is a `RESTAPIConfig`, the same shape as the built-in REST connectors (Intercom, Attio, Sentry).
- **Step 0: look for a native connector** with `external-data-sources-wizard`. PostHog ships hundreds; if one matches, use the native setup.
- **Tools:** `external-data-sources-wizard`, `external-data-sources-db-schema` (validate and list; returns `detected_primary_keys`, `incremental_fields`), `external-data-sources-preview-resource` (live sample), `data-warehouse-source-setup` (enables all resources), `external-data-sources-create` (a subset via `schemas`), `external-data-schemas-list`.
- **Validate** (structure, fan-out graph, and the credential via a bounded live probe): `{ source_type: "Custom", manifest_json: "<stringified manifest>", auth_token: "<credential>" }`. A 400 `message` is plain English, for example `resources[0].endpoint.path: must not be empty`.
- **Always preview before creating;** skipping it is the most common way to sync zero or malformed rows. Call `{ source_type: "Custom", payload: { manifest_json, auth_token }, resource_name: "<name>", limit: 10 }`. It returns rows plus inferred `columns`; a live failure returns `error` with empty `rows`. Check `data_selector` (rows like `[{ "data": [...] }]` mean you pointed at the envelope), that `primary_key` exists and is unique, and that `cursor_path` is present and sortable.
- **Create:** `{ source_type: "Custom", payload: { manifest_json, auth_token }, prefix: "<short_name>" }`. Incremental where a cursor is declared, else full refresh; tables are `{prefix}_{resource_name}`.
- **Secrets go in payload keys by `client.auth.type`:** `auth_token` (bearer), `auth_api_key` (api_key), `auth_password` (http_basic), `auth_oauth2_client_secret` (plus `auth_oauth2_refresh_token` for the refresh_token grant). Inline secrets in the manifest are rejected; PostHog redacts them from responses.
- **GET and POST only;** PUT, PATCH and DELETE are rejected. One level of fan-out.

Skeleton (verbatim):

```json
{
  "client": {
    "base_url": "https://api.example.com/v1",
    "auth": { "type": "bearer" }
  },
  "resources": [
    {
      "name": "users",
      "primary_key": "id",
      "endpoint": {
        "path": "/users",
        "data_selector": "data",
        "paginator": { "type": "json_response", "next_url_path": "next" },
        "incremental": { "cursor_path": "updated_at", "start_param": "since" }
      }
    }
  ]
}
```

### Manifest grammar

- **Top level:** `client` {`base_url`, `auth`, `headers` (static, every request), `paginator` (default for all resources, overridable per endpoint)}, `resource_defaults.endpoint`, `resources` (required, 1 to 50). Unknown keys are ignored.
- **`client.base_url`** is required; on PostHog Cloud it must be `https://`; internal or private hosts are rejected (SSRF guard).
- **`resource_defaults.endpoint`** merges into every resource; `incremental` is not allowed there.
- **Auth blocks:** `{ "type": "bearer" }` sends `Authorization: Bearer <token>`; `{ "type": "api_key", "name": "X-Api-Key", "location": "header" }`; `{ "type": "api_key", "name": "api_key", "location": "query" }` sends `?api_key=<key>`; `{ "type": "http_basic", "username": "user" }`; `{ "type": "oauth2", ... }` sends the minted token as Bearer. `location` is `header`, `query`, `param` or `cookie` (`query` and `param` are synonyms; prefer `query`). No auth: omit `auth`.

```json
{
  "type": "oauth2",
  "client_id": "my-client-id",
  "token_url": "https://auth.example.com/oauth/token",
  "grant_type": "refresh_token",
  "scopes": "read:orders read:users"
}
```

- **`grant_type`:** `client_credentials` (default) or `refresh_token`. `authorization_code` is not supported; obtain the refresh token out of band. Optional knobs: `access_token_name`, `expires_in_name`, `expiry_date_format` (strptime), `extra_token_request_params` (for example `audience`), `token_request_headers`, `client_auth_method` (`body` default, or `basic`).
- **Keep the whole `client.auth` block identical across db-schema, preview and create.** OAuth2 secrets move into a server-managed credential store on first validation, preview or create, and rotated single-use refresh tokens are persisted server-side, matched by `client_id` + `token_url` + `grant_type`. Changing any field discards the stored rotation and the next mint fails with `invalid_grant`. Never set `auth_oauth2_integration_id` (server-owned; ignored on create). To reconnect, update with re-entered `auth_oauth2_client_secret` / `auth_oauth2_refresh_token`.
- **Endpoint fields:** `path` (required), `method` (`GET` default, or `POST`), `params`, `json` (POST body), `data_selector` (JSONPath such as `"data"` or `"results.items"`; omit only if the body is the array), `paginator`, `incremental`. `primary_key` sits on the resource: `"id"` or `["org_id", "id"]`.
- **A paginator is required for any paginated endpoint.** Omitting it, or `{ "type": "auto" }`, fetches only the first response; there is no auto-detection, so a paginated API silently imports page one.

| Paginator | Options |
|---|---|
| `json_response` | `next_url_path` |
| `header_link` | `links_next_key` (default `next`) |
| `cursor` | `cursor_path`, `cursor_param` |
| `offset` | `limit`, `offset_param`, `limit_param`, `total_path`, `maximum_offset` |
| `page_number` | `base_page`, `page_param`, `total_path`, `maximum_page` |
| `single_page`, `auto` | none |

- **`param_location`** on `cursor`, `offset` and `page_number`: `"query"` (default) or `"json"` with a dotted path like `"variables.offset"` (for GraphQL).
- **Incremental block:** `cursor_path`, `start_param`, `end_param` (optional), `param_location` (child resources in a fan-out can't use `"json"`), `cursor_type` (`datetime` default, `date`, `timestamp`, `integer`, `numeric`, `objectid`), `datetime_format` (strftime; default ISO-8601; set it for strict APIs). Set `cursor_type` when the cursor isn't a datetime. Prefer `updated_at` over `created_at` (it catches edits).
- **Two different `cursor_path`s:** the paginator's (next-page cursor in the envelope) and the incremental one (watermark on each record) are independent.
- **Worked patterns:** Bearer with next-URL and incremental (`links.next`, `updated_since`); API key in query with offset (`limit: 200`, `total_path: "meta.total"`, `cursor_type: "integer"`, `after_id`); HTTP basic with a single page; OAuth2 refresh-token with page_number (`page_param: "page"`, `total_path: "total_pages"`, `modified_since`); Bearer with cursor (`cursor_path: "meta.next_cursor"`, `cursor_param: "cursor"`).

Fan-out with a `resolve` param (verbatim):

```json
{
  "resources": [
    { "name": "forms", "primary_key": "id", "endpoint": { "path": "/forms", "data_selector": "items" } },
    {
      "name": "responses",
      "primary_key": "token",
      "endpoint": {
        "path": "/forms/{form_id}/responses",
        "data_selector": "items",
        "params": { "form_id": { "type": "resolve", "resource": "forms", "field": "id" } }
      }
    }
  ]
}
```

- **Fan-out rules:** the placeholder sits within the path (not at the start); the parent must be top-level; one level; at most one resolve param per resource.

## Prove it

[existing DATA-WAREHOUSE.md, validation and preview workflow]

- Read the wizard schema, validate the manifest, and preview every resource before creating it.
- Confirm real records, a unique primary key and the intended pagination and incremental cursor; never inline credentials in the manifest.
