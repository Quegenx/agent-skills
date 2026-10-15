---
name: domain-modeling
description: Models business domains so the rules live in one trustworthy place - deciding whether a domain model is worth it at all (transaction script vs rich model), strategic design first (bounded contexts, subdomains, ubiquitous language and a glossary, context maps, anti-corruption layers, EventStorming), then the tactical model inside a context (entities vs value objects, branded IDs, always-valid objects with private constructors and factories, guarded state transitions returning results, business rule objects, encapsulated collections, small aggregates referenced by ID, domain vs application services), and the event side (domain vs integration events, dispatch after commit through an outbox, idempotent consumers, sagas vs process managers, event sourcing with expected versions and projections, CQRS without a mediator library). TypeScript with Convex, Supabase/Postgres and Effect. Use when designing or reviewing business logic, splitting a system into modules, naming things with domain experts, fixing rules scattered across handlers, choosing aggregate boundaries, raising or handling domain events, coordinating multi-step workflows, or considering CQRS or event sourcing.
---

# Domain modeling

Put each business rule in one place that every path must go through, and draw boundaries where the language and the rules change. The patterns below are tools, not a template: a settings screen stays simple CRUD, an ordering or billing flow earns the full model. Pick the file:

| The job | Read |
|---|---|
| Boundaries, language, how contexts relate and translate, running an EventStorming workshop | [STRATEGIC.md](STRATEGIC.md) |
| Entities, value objects, IDs, invariants, aggregates, factories, services, moving from scripts to a model | [MODEL.md](MODEL.md) |
| Domain and integration events, outbox, sagas and process managers, event sourcing, CQRS | [EVENTS.md](EVENTS.md) |

For reshaping existing code in small safe steps, also use the `refactoring` skill; for typed errors, its ERRORS.md.

Domain modeling is a set of patterns, not a framework: plain TypeScript types, functions and classes are enough. It's also not the same thing as Clean Architecture: Clean Architecture organizes which layers may depend on which; domain modeling decides what the innermost layer contains. They combine well, with the domain model at the center depending on nothing.

**The building blocks, for orientation:** entity (identity and lifecycle), value object (defined by its values), aggregate (consistency boundary with a root), domain event (a fact that happened), domain service (a rule that fits no single entity), repository (loads and saves an aggregate), factory (valid creation), specification (a named, reusable query or selection rule such as `premiumCustomers`, worth an abstraction only when the same criteria are reused in several places). Use the ones the rules call for, not all of them.

## Is a domain model worth it here?

Ask three questions: is the logic complex enough that getting it wrong has real consequences? Are there people who can explain the rules? Will the rules keep changing? All three yes: model it. Otherwise a **transaction script** (one function per operation: load, validate, apply, save) is the right tool, with shared calculations extracted when they repeat. You don't pick one style for the whole system: the order workflow can be a rich model while the reporting endpoint is a script.

Move toward a model when the pressure shows: several operations must keep the same rule, an object has a lifecycle (draft, placed, shipped), or the same check is copied into a third handler. Scripts are a good way to start each vertical slice; when one script needs another's logic, don't call one script from another (it couples two use cases and their transactions): move the shared rule down into the domain object both use.

Plain data records used on purpose by simple scripts and read models are a valid choice. The anemic model is a problem only when you pay for domain layers and objects but still can't enforce the rules.

## The rules under all of them

1. **Strategic before tactical.** Perfectly modeled classes inside the wrong boundary still couple the wrong things. Find the contexts and the language first.
2. **The code speaks the business's words.** `placeOrder`, `cancel(reason)`, `ship(warehouseId)`, not `insertRecord`, `updateStatus`, `process`. One context, one meaning per word.
3. **An object never exists in an invalid state.** Creation goes through a factory that checks the rules; every change goes through a method that checks the transition. No public setters on anything with rules.
4. **Rules live with the state they protect.** A rule copied into three handlers drifts into three rules. Application code orchestrates (load, call, save, notify) and decides nothing.
5. **In-memory rules don't stop concurrent writes.** Two requests can both pass the same check. Back every invariant that spans requests with the database: a unique constraint, a conditional update, an expected version, or a serializable transaction (a Convex mutation).
6. **Small aggregates, referenced by ID.** One aggregate per transaction by default; other aggregates update later through reliable events, unless the business can't accept the intermediate state.
7. **A recorded event is not a delivered event.** Persist changes and outgoing events together (an outbox, or scheduling inside the same Convex mutation), deliver after commit, and make every handler idempotent.
8. **Trust no caller-supplied price, total or status.** Load authoritative values (catalog prices, current state) in the application layer and pass them in.

## Reviewing a model

Report the most damaging first:
1. Rules that can be bypassed: public setters, mutable exposed collections, constructors that skip validation, a second code path that doesn't call the guarded method.
2. Invariants enforced only in memory where concurrent requests can break them.
3. Side effects (email, messages, other aggregates) done inline in a way that isn't atomic with the save, or events that can be lost or applied twice.
4. Business decisions in handlers, controllers or "services" that should be on the entity or in a domain service.
5. One model shared across contexts (a 50-field `Customer`), or a context importing another's tables or vocabulary.
6. Names that don't match the business, and CRUD verbs for domain operations.

Each finding names the rule, the path that breaks it, and the fix.
