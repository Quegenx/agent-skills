---
name: software-architecture
description: "Chooses an application's shape: monolith, modular monolith or services, layers or vertical slices, module boundaries, data ownership, extracting or replacing modules and logic prototypes. Use when structuring a codebase, resolving a state-model question or deciding whether to split it."
---

# Software architecture

Architecture is the set of decisions that are expensive to change: where the boundaries are, which way dependencies point, and which data each part owns. Make two decisions separately:

- **Macro:** how the system splits into modules or services, how they communicate, who owns which data, how it deploys.
- **Micro:** how code is organized inside one module: layers or slices, where use cases, validation and data access live.

The macro decision constrains how modules talk to each other. The micro decision is local: each module can choose its own, because its public boundary protects everyone else.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Clean Architecture layers, the dependency rule, transactions, authorization, logging, caching, mapping, errors, the cost of abstractions | [LAYERS.md](LAYERS.md) |
| Vertical slices: folder structure from 5 to 50+ features, endpoints, validation, cross-cutting wrappers, shared code, testing slices | [SLICES.md](SLICES.md) |
| Modular monolith: boundaries, public APIs, data isolation per module, communication, shared kernel, refactoring an overgrown module | [MODULES.md](MODULES.md) |
| Scaling a monolith, deciding to split, extracting a module into a service | [EVOLVE.md](EVOLVE.md) |
| Legacy replacement: routing seam, source of truth, synchronization, shadow reads and cutover | [System migration](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/system-migration/SKILL.md#rewriting-a-legacy-system) |
| Answering a logic question with a portable model, visible state and guided scenarios | [PROTOTYPES.md](PROTOTYPES.md) |
| Deep module interfaces and dependency seams | [refactoring DEEP-MODULES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/refactoring/DEEP-MODULES.md) |

Related: bounded contexts and context maps are in the `domain-modeling` skill's STRATEGIC.md; domain vs integration events, sagas and CQRS in its EVENTS.md; outbox, inbox and brokers in the `messaging` skill; import-graph rules and breaking cycles in the `refactoring` skill's DEPENDENCIES.md; whole-system components (load balancers, caches, CDNs, queues) in the `system-design` skill.

## The macro decision

Start with one deployable application split into modules (a modular monolith). Boundaries drawn early are guesses, and inside one process a wrong boundary is a refactor; between services it's a migration.

Split a part into a service only when you can answer yes, with evidence, to these:

1. **Measurably different scaling needs** today: 100 times the traffic, a GPU, or memory that forces sizing every instance for its peak. If the whole app runs comfortably on three instances behind a load balancer, there is no scaling problem worth a network boundary.
2. **Teams blocking each other** in one release process: deploy trains, release freezes, one team's half-finished feature holding another's hotfix. Below about two full teams this argument is zero.
3. **A data boundary you can draw:** the candidate owns its tables outright and nobody else reads them, not even for one join. Two candidates that constantly need each other's data are one service cut in half.
4. **A required independent failure or release:** payments must stay up when reporting is down, a compliance scope (PCI, HIPAA) should stay small, an integration ships weekly while the core ships quarterly.
5. **You can afford the platform tax** before any benefit: container platform, CI/CD per service, central logs, distributed tracing, a broker, outbox, idempotent consumers, retries with backoff.

**Four or five yes:** extract one service, the one with the clearest boundary, and run it in production for a while before the next. **Two or three:** a modular monolith gives the boundaries and team ownership without the tax. **Zero or one:** keep the monolith and make it good. A team that can't pay the tax doesn't get cheaper microservices; it gets a distributed monolith (services that share data, deploy together and fail together).

The trade is specific: services turn local complexity into distributed complexity. A method call becomes a network hop that can time out, a transaction becomes a saga, a stack trace becomes a trace across services and a queue, and a request can succeed while its response is lost. Services also follow team lines whether you plan it or not (Conway's law: systems mirror the communication structure of the organization that builds them), so design team ownership and service boundaries together. Choose services for those benefits, not because the monolith's code is messy; messy code split over a network is still messy, and now it's distributed.

## The micro decision

| | Layers (Clean Architecture) | Vertical slices |
|---|---|---|
| Organized by | Technical responsibility, dependencies pointing inward | Feature: one use case's request, logic, data access and response together |
| Wins when | Many features share a rich domain model and invariants; strict compile-time boundaries are required; a large team values one uniform pattern; long-lived | Features are mostly independent or vary widely in complexity; CRUD-heavy; small team or many features built in parallel; fast iteration |
| Main risk | Ceremony for simple features: interfaces, mappers and pass-through services nobody needs | Duplication between features; a single project doesn't stop a handler from reaching anywhere |

Most real projects land on the **hybrid**: features organized as slices, a shared domain model underneath for the rules several features use, and wrappers for cross-cutting concerns. Neither choice is permanent: start with a single project organized by feature, extract a domain layer when real business logic appears, add explicit layers when the rules or team size demand them, and enforce the boundaries with tests.

Signs you need more structure: business rules leaking into route handlers, database code inside domain types, the same rule copied into a third handler. Signs you have too much: a five-endpoint CRUD API with four projects, domain events and a mediator pipeline.

## The rules

1. **Dependencies point toward the policy.** Domain imports nothing from frameworks, databases or vendors; infrastructure implements interfaces the inner code declares.
2. **What changes together lives together.** Group by feature or business capability before technical type; the folder listing should read like what the system does (`orders/place-order.ts`, not `services/order-service.ts`).
3. **Boundaries need enforcement, not folder names.** A folder called `modules/billing` that anyone can import from is not a boundary. Check it with an import-graph rule in CI (dependency-cruiser, `eslint-plugin-boundaries`, `import/no-restricted-paths`), and in the database with a role per module.
4. **Every abstraction must name the change it absorbs.** A payment provider, an external API, the clock: yes. A wrapper over your query builder with one implementation: no.
5. **Atomicity is a use-case property.** The use case decides what commits together; infrastructure supplies the transaction; repositories and route handlers never decide it.
6. **Prefer coarse boundaries while you're learning the domain.** Splitting a module later is cheap; merging two that have grown apart is expensive.

## Drawing it (C4)

Choose the C4 zoom levels that add value, using fixed vocabulary. Official guidance says context and container diagrams are sufficient for most teams; the old line required all four. [https://c4model.com/diagrams]

- **Context:** your system as one box, the people who use it and the external systems it talks to. No technology; anyone in the company should understand it.
- **Container:** an application or data-store runtime boundary with its main technology choices. The old deployable-unit shorthand must not imply one-to-one physical deployment: C4 treats deployment separately, and a container is not necessarily a Docker container. For developers, architects and operations. [https://c4model.com/abstractions/container; https://c4model.com/diagrams/container]
- **Component:** the major building blocks inside one container (modules, with their responsibilities). For developers.
- **Code:** classes or tables; rarely worth drawing except for the most complex parts. Sequence and deployment diagrams fill specific gaps.

Every arrow must trace to a real call, message or query you can point to in code; don't draw relationships inferred from folder names. Keep diagrams as text (Mermaid, Structurizr DSL) in the repository so they change in the same pull request as the code.

## Prove it

- For a proposed split: answer the five questions with numbers (load per module, deploy conflicts in the last quarter, cross-module queries found in code) and state the outcome the score gives.
- For a module: run the import-graph check and show it fails when a feature imports another module's internals; connect as the module's database role and show a query on another module's table is denied.
- For a structure: pick a recent feature and count the files and folders it touched; the chosen structure should make that number smaller, not larger.
