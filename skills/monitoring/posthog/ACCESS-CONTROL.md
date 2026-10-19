# Access control

PostHog membership, effective permissions and access-rule workflows, moved from the ingestion guide. [PostHog skills, INGESTION-AND-COSTS.md]

## Member access

[PostHog skills, INGESTION-AND-COSTS.md]

- **Plans:** Free and pay-as-you-go have no access control and the tools aren't offered (suggest Boost: https://posthog.com/platform-packages). Boost and Scale include default levels and single-member rules on project, tools, objects and properties. Roles exist on every plan, but role rules are Enterprise only (set, enforced, and the three role access tools offered only there). A `source_subject` of `role` in `members-list` proves role rules are enforced; otherwise ask whether the org is on Enterprise.
- **Writes:** read the current rule, explain the change, prepare, and call execute only after the user confirms.
- **Scopes,** broad to narrow: project, then tool (`dashboard`, `insight`, `feature_flag`, `notebook`, `experiment`, `warehouse_objects`, ...), then single objects, then person and event properties. Tool names are the keys of `resources` in a members-list entry.
- **Subjects:** one member, one role, or everyone (the default).

| Scope | Levels |
|---|---|
| Project | `none` blocks; `member` views and edits what other rules permit; `admin` also edits project settings, manages access rules, deletes the project |
| Tool and object | `none` < `viewer` < `editor` < `manager` (manager also manages the tool's or object's access rules) |
| Property | `none` hides, `read`, `read_write`; every property is `read_write` unless a rule exists |

- **Bounds:** `minimum` and `maximum` per tool on `defaults-get`; a tool with `minimum` `viewer` can never be `none`.
- **Bypasses:** org admins and owners have full access everywhere and no rule applies (`organization_level`: 1 member, 8 admin, 15 owner). Creators have full access to objects they created only.
- **Two resolution modes,** and the tools don't say which is active: most-specific-first (member, then role, then default; object before tool) or legacy (the highest of the member's own and role rules). Trust `effective_access_level`, never recompute it; explain it from `inherited_access`.
- **Tools** (all take an optional project id, default to the active project): `posthog:access-control-members-list` (`member_id` narrows), `posthog:access-control-roles-list` (`role_id`), `posthog:access-control-defaults-get`, `posthog:access-control-default-rule-set-prepare` / `-execute`, `posthog:access-control-member-rule-set-prepare` / `-execute`, `posthog:access-control-role-rule-set-prepare` / `-execute`, `posthog:access-control-member-objects-list`, `posthog:access-control-member-properties-list`, `posthog:access-control-role-objects-list`, `posthog:access-control-role-properties-list`, `posthog:access-control-default-objects-list`, `posthog:access-control-default-properties-list`, `posthog:org-members-list`, `posthog:roles-list`, `posthog:role-members-list`.
- **`member_id` is the organization membership id** (`id` from `org-members-list`, or `organization_membership_id` from `members-list`), not the user id or uuid. `role_id` is `id` from `roles-list`.
- **A tool-level question is one `members-list` call with `member_id`:** its `effective_access_level` is complete (includes roles, default and bypasses).
- **An object question, stopping at the first hit:** `organization_level` 8 or 15; creator (fetch the object with its get tool, e.g. `dashboard-get`, `insight-get`, and compare `created_by.uuid` with `user.uuid`); a rule on the object (collect `member-objects-list`, `role-objects-list` per `role_ids`, `default-objects-list`; ask before walking many roles); no rule means the tool-level answer. Properties work the same way minus the creator check.
- **Several rules on one object:** report all with their subjects; which one is enforced depends on the mode, so don't guess.
- **"Who can ...":** `members-list` without `member_id`, filtered on `resources.<tool>.effective_access_level`. There is no pagination; for large orgs ask which people first.

| Field | Meaning |
|---|---|
| `access_level` | The subject's own stored rule; `null` means none of its own |
| `effective_access_level` | What is enforced; `null` means nothing resolves, not "no access" |
| `inherited_access` | The fallback and its source; `null` when nothing supplies one |
| `inherited_access.source` | `resource`/`parent_resource` (tool rule), `object`/`parent_object` (object rule), `system_default`, bypasses `org_admin` and `creator`, `org_membership` only when the object is the organization |
| `inherited_access.source_subject` | `member`, `role`, `default`; `null` for a bypass or the PostHog default |

- **Phrasings:** `org_admin`: "full access". Set and equal: "explicit rule: editor". `null` + `role`: "editor access, based on a role" (name it via `roles-list`). `null` + `default`: "viewer access, based on the project default". `system_default`: "No rule is set anywhere, so the PostHog default applies." Effective `null`: "Nothing resolves for this tool here."
- **Gotchas:** an empty object or property list means no rules of that kind, not no access. A project default of `none` doesn't remove explicit member or role grants. A member missing from `members-list` isn't proof of no access (a non-admin caller where members can't see each other sees only project-scoped members). `can_edit` describes the caller. `available_project_levels` and `available_resource_levels` are vocabulary, lowest first: use them to compare. `object_rule_resources` on `defaults-get` lists the tools that accept object rules.

## Prove it

[PostHog skills, INGESTION-AND-COSTS.md]

- For an access question, the answer matches `effective_access_level` from `access-control-members-list` with that `member_id`.
