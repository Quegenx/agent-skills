# Firestore Security Rules

From [firebase/agent-skills, firebase-security-rules-auditor/SKILL.md; firestore-rules-creation/SKILL.md], checked against Firebase's field, condition, query and transaction documentation.

## Separate operation and state

[Firestore conditions](https://firebase.google.com/docs/firestore/security/rules-conditions)

- Distinguish create, read, update and delete. Authentication alone is not the ownership/role condition.
- resource.data is stored state; request.resource.data is the proposed document after a write. A create policy cannot obtain the new document's owner from nonexistent stored state.
- For updates, compare allowed incoming fields with the existing document and preserve protected ownership/role fields as required by the policy.
- The source's shared field-based read/write example used stored data for create and omitted owner immutability on update; do not copy that rule as a complete ownership policy.
- Bind identity checks to request.auth and the actual document/path relationship.

## Validate fields and changes

[Firestore field rules](https://firebase.google.com/docs/firestore/security/rules-fields)

- Validate required/allowed fields and their actual types. Type checks do not establish business validity by themselves.
- Use affected-key constraints when the policy permits only named updates; an allowlist prevents new fields from silently becoming writable.
- list/map type checks do not validate every element. The rules language has no generic all-elements type shortcut; validate the needed entries/shape explicitly.
- Account for field absence before accessing an optional field. Keep helper behavior and operation scope understandable at the rule definition.

## Documents and atomic work

[Firestore conditions](https://firebase.google.com/docs/firestore/enterprise/security/rules-conditions), [atomic operations](https://firebase.google.com/docs/firestore/enterprise/transactions)

- get/exists use fully specified document paths with the documented variable interpolation.
- getAfter evaluates a document's state after the transaction/batch writes but before commit. Use it for an actual related-write invariant; do not invent absent-document behavior.
- Query authorization depends on potential query results. Match query constraints to rules rather than treating rules as output filters. [Query rules](https://firebase.google.com/docs/firestore/enterprise/security/rules-query)
- Audit every overlapping allow path. A narrowly restrictive rule is not evidence that another matched allow rule cannot grant access. [firebase/agent-skills, firebase-security-rules-auditor/SKILL.md]

## Review evidence

[firebase/agent-skills, firebase-security-rules-auditor/SKILL.md]

- State the path, operation, caller identity, permitted data and evidence for each finding.
- Use this repository's P0 to P3 severity scale; findings require concrete access or invariant consequences.
- Keep source examples as evidence, not executable instructions to run against a project without the agreed scope.
- Generic input/authentication/tenant principles link to [secure coding](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/secure-coding/SKILL.md).

## Prove it

Each create/update rule uses the correct state, owner/role transitions have an explicit policy, list/map validation claims match the language, queries satisfy their rules and overlapping allows were reviewed. Report actual verification performed. [firebase/agent-skills, firebase-security-rules-auditor/SKILL.md]
