# Design principles as refactorings

Each entry is a smell you can see in code, the move that fixes it, and the half-fix that looks like progress but keeps the problem. TypeScript; "the composition root" is the one place (app startup, a server entry, an Effect `Layer`) that constructs concrete implementations and wires them together.

## Who constructs what

**Depend on an abstraction, and let someone else choose it.** Typing a field as an interface but still writing `new SmtpMailer()` inside the class keeps the coupling: whoever writes `new` chooses. Take the collaborator in the constructor (or as an Effect service) and construct concretes only at the composition root. Don't hide a default inside (`mailer ?? new SmtpMailer()`, `discount ??= new NoDiscount()`): the default is wiring, and it belongs at the root.

**Retire the service locator.** `Container.get("mailer")` inside a method hides the dependency and makes order of registration matter. Caching the lookup in a field is the same coupling. Ask for the dependency in the constructor and delete the locator.

**Give global state an owner.** A module-level mutable counter (`export let nextId = 0`) is shared by every test and request; making it non-exported is still global. Move it into an instance created once per run and passed to whoever needs it. Module-level constants that never change are fine.

**Own a resource's lifetime.** A function that needs a lease, connection or file handle gets a fresh one from an injected factory per run, and releases it exactly once, even on failure (`try/finally`, `await using` with `Symbol.asyncDispose`, Effect's `acquireRelease`). Don't cache the resource in a field, and don't dispose the factory you were given.

## Replacing conditionals with objects

Use these when each case carries real behavior that varies independently; a lookup table or an exhaustive `switch` (see [SKILL.md](SKILL.md)) is enough when cases differ only in data.

- **Strategy over a switch:** a fee or pricing rule chosen by plan becomes an injected function or object. A factory method inside the class that still names every concrete is the switch in a new place; the plan-to-strategy mapping lives at the root.
- **Composition over subclassing per flavor:** `PremiumAccount extends Account` for each fee rule multiplies classes; inject the fee policy into one `Account`.
- **Null object instead of `if (discount)`:** a `noDiscount` that returns the price unchanged, injected by the root, removes the branch from every caller.
- **Decorators instead of boolean flags:** `announce(msg, { loud, timestamped, logged })` becomes wrappers that each take any announcer: `logged(timestamped(loud(base)))`. The root composes them, and the order is part of the behavior.
- **Composite for rule trees:** `all`, `any`, `not` and `min(n, ...)` each implement the same `evaluate` as a leaf rule, so the engine only knows the interface. Copy child lists at construction so caller mutation can't change a built rule; short-circuit in order and evaluate each reached child once; an empty `all` is true and an empty `any` false.
- **State objects:** each state's `step(action)` returns the next state and a message; the workflow adopts what it's given and knows no concrete states. Unlisted actions are ignored or rejected explicitly.
- **Visitor when the kinds are stable and operations keep growing:** a `switch` with a silent `default: return 0` for each new operation forgets new kinds without a sound. An exhaustive `switch` over a discriminated union with a `never` check gives TypeScript the same guarantee as a visitor: adding a kind breaks the build everywhere it isn't handled.
- **Command with undo that reverses what happened:** record the actual effect at execution (the quantity really shipped, the value really replaced), not at construction or from the request. A relative command reverses the quantity it actually moved; an absolute replacement restores the value it replaced. Restoring a whole saved figure after later adjustments can erase that later work, so distinguish selective undo from newest-first history. Keep a history stack of commands; undoing with an empty history reports nothing-to-undo. [katabench, coding-exercises/design-principles/undo-what-actually-happened.md]
- **Memento for checkpoints:** the editor creates and reads an opaque, immutable snapshot of values (not live references); the history stores snapshots without inspecting them, and one snapshot can restore more than once.

## Honest contracts

- **Liskov:** a base type that promises `renew()` while one subtype throws "not supported" is lying. Split the capability (`Membership`, `RenewableMembership`) and have the service accept only the capability it uses, with no type checks.
- **Interface segregation:** an `IMachine` with `print` and `scan` forces an inkjet to throw from `scan`. Split `Printer` and `Scanner`; don't recombine them into a bundle type that every implementer must satisfy.
- **Command-query separation:** `peek()` that also consumes surprises the caller. A read-only view (`peek`, the same answer on every call) and a separate `consume`; hand the preview code only the view.
- **TypeScript compatibility is structural.** Compatible public instance members can satisfy an interface without an explicit `implements` declaration. Requiring that declaration can be a project style/check policy, not a language prerequisite. The old line said a matching class was not a `Notifier` until it declared `implements Notifier`. [Official TypeScript compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)
- **Law of Demeter:** `order.customer.address.city` couples the caller to three shapes. Local variables don't fix it, and moving the whole chain into `Order` doesn't either. Ask each object for what it owns (`order.shippingCity()` asks the customer, who asks the address).
- **Observers:** a coordinator with a field per listener isn't open; keep a readonly list of observers and notify every one. Per instance, not a shared static list.

## Making invalid states impossible

Domain definitions live in [domain-modeling MODEL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/architecture/domain-modeling/MODEL.md); the refactoring angle:

- **Immutability must be structural.** Freeze, copy on the way in and out, and offer only methods that return new values. Use the domain model's [encapsulated-collection rules](https://github.com/Quegenx/agent-skills/blob/main/skills/architecture/domain-modeling/MODEL.md#encapsulated-collections) for shared-reference and shallow-copy limitations.
- **Typed IDs and construction:** use [typed IDs](https://github.com/Quegenx/agent-skills/blob/main/skills/architecture/domain-modeling/MODEL.md#typed-ids) and [validated construction](https://github.com/Quegenx/agent-skills/blob/main/skills/architecture/domain-modeling/MODEL.md#always-valid-invariants-on-the-object). Do not add overloads or implicit conversions from plain strings or numbers. Keep construction behind functions: in TypeScript, spreads and object literals (`{ ...order, status: "shipped" }`) bypass the factory.
- **Typestate:** one type per stage (`DraftOrder`, `PaidOrder`, `ShippedOrder`), each with only its own data and moves, and each move returning the next stage, so "ship an unpaid order" doesn't compile. A runtime switch remains only at the untyped edge (parsing stored text), with an explicit reject for unknown values. The existing heuristic is typestate when stages are few and stable, state objects when they change often. The source also distinguishes caller contracts: typestate fits callers holding typed values where an illegal move should not compile; a uniform runtime State protocol fits an untyped event stream where every state must answer each action and reject or ignore unsupported ones. [katabench, coding-exercises/design-principles/make-illegal-states-unrepresentable.md; coding-exercises/design-principles/transition-through-state-objects.md]
- **Expected failure as a result:** a reservation that can be rejected returns `{ ok: false, reason }` instead of throwing and being caught by every caller (see [ERRORS.md](ERRORS.md)). The exact-capacity case succeeds; a zero request is a no-op, decided on purpose.

## Single responsibility and speculative generality

- **Split by who asks for changes:** an importer that parses, deduplicates, stores and formats changes for four reasons. Parser, store, summary data and formatter become separate pieces; lines that fail to parse never reach the store, and the store decides duplicates at insert time (an insert that returns whether it kept the row), not by a check-then-insert.
- **An abstraction is paid for by its second implementation.** A factory, base class, selector or interface with one implementation is a layer to read through. Delete it, and keep the behavior that hid inside it (a cap, a weighting, a rounding rule, a case-insensitive comparison). Don't replace the deleted interface with an extra callback parameter: that's the same layer in another shape.
- **Leaky ports:** a payment port typed in the vendor's request and response objects is the vendor in disguise. Define neutral domain types for the port and translate both ways in the adapter, which only the root constructs. More in [DEPENDENCIES.md](DEPENDENCIES.md).

## Finding the missing owner

[mattpocock/skills, code-review]

- **Feature envy:** a method uses another object's data more than its own. Move the behavior toward the data it operates on.
- **Data clumps:** the same fields or parameters repeatedly travel together. Give that concept one type and pass it together.
- **Shotgun surgery:** one logical change requires scattered edits across many files. Gather the behavior that changes together into one module.

## Prove it

For each ownership change, identify the observed data access, recurring field group or scattered change that motivated it; show where that concept now lives and which callers use it. Interface compatibility claims distinguish TypeScript's structural rules from an explicit project declaration policy. [mattpocock/skills, code-review; https://www.typescriptlang.org/docs/handbook/type-compatibility.html]

For reversible commands, distinguish the recorded relative effect from an absolute replacement and check undo after later adjustments; explain whether callers need typestate guarantees or a uniform runtime action protocol. [katabench, coding-exercises/design-principles/undo-what-actually-happened.md; coding-exercises/design-principles/make-illegal-states-unrepresentable.md]
