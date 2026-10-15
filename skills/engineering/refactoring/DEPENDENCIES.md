# Dependency direction between modules

The rule for layered, hexagonal and modular code is the same: dependencies point toward the core, and the core imports nothing from frameworks, vendors or delivery mechanisms. Most fixes are about which module **declares** an interface, not where a file sits. Renaming or moving a file without changing who imports whom changes nothing.

Check it mechanically: list each module's imports (an import-graph tool or a lint rule such as `import/no-restricted-paths` or dependency-cruiser) and assert that the forbidden edges are absent. The fix is done when the graph says so.

## The core owns its ports

- **A port belongs to the code that uses it.** If the core calls `CustomerGate`, the core declares it and the adapter implements it, importing inward. A port declared in the adapters folder makes the core depend outward. Moving it means moving the single declaration; leaving a duplicate in the old place keeps a stray dependency.
- **Configuration is a port too.** Core code that reads `process.env` or a framework's config object depends on the framework. Declare what the core needs (`type ShippingOptions = { freeFromCents: number; carrier: string }`), and build and validate it at the composition root from the environment. A wrapper class that lives inside the core but still imports the framework config only relocates the dependency.
- **Ports speak the domain's language.** A port whose methods take and return a vendor's DTOs ties the core to that vendor. Neutral request and result types in the core; the adapter translates both ways.
- **ORM and framework base classes stay out of domain types.** An entity that extends an ORM model can't be created or tested without the ORM. Keep plain domain types and map them in the repository.

## Layers and the two sides of the hexagon

- **No layer skipping.** Presentation (routes, UI handlers) depends only on the application layer (use cases). A route that imports a repository implementation skips the layer; a pass-through use case that constructs the concrete repository itself only moves the smell. The application declares the repository port, infrastructure implements it, the root injects it.
- **Driving adapters don't reach driven adapters.** A controller (driving side) that calls the database or a payment client (driven side) directly bypasses the use case. An interface placed next to the adapter is still the wrong edge. Put the decision behind a use case that owns its outbound port; the controller depends only on the use case.
- **Policy lives in the core by inverting the dependency,** not by moving a file into a `domain/` folder while it still imports infrastructure.

## Cycles between modules

A cycle is a property of the graph: reversing one arrow usually just rotates it. Two cures, often together:

1. **Hoist shared vocabulary into a kernel leaf.** The types both modules need (a status union, an ID type) move into a small module that imports nothing. Every module depends down onto it. The kernel must stay a sink: don't drag a feature-coupled type into it, and pull down every helper it would otherwise borrow from a feature.
2. **Reach another module only through a published port.** Checkout asks inventory through a `StockQuery` interface that inventory publishes and the root wires; inventory's internals stay private. A callback cycle (A calls B, B calls back into A) inverts the same way, with the port owned by the leaf.

Related limits:

- **Look-alike concepts aren't a shared kernel.** Two modules' `Customer` types that happen to share fields are separate models; publishing one module's entity for the other fuses them (the `domain-modeling` skill's STRATEGIC.md on bounded contexts).
- **A contracts or events module must not depend on a feature,** and an events hub must not reach down or sideways into the modules it connects. Cross-module notifications go through a bus with events that carry enough data that consumers don't call back.

## The composition root

One place builds the concrete graph: reads and validates configuration, constructs adapters, injects them into use cases, and maps the variant choices (which strategy for which plan). Nothing else calls `new` on an adapter. Behavior should be byte-identical before and after a dependency refactoring; pin it with tests first ([SKILL.md](SKILL.md)).
