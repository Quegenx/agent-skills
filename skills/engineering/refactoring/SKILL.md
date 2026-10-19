---
name: refactoring
description: "Restructures code without changing behavior, in small tested steps, with typed errors, clean dependency direction, deep module interfaces and evidence-based duplication removal. Use when code is hard to read, test or change, or when asked to refactor."
---

# Refactoring

Refactoring changes the structure of code and keeps its behavior. One step does little; a sequence of small steps transforms the code, and each step is easy to check. For removing AI slop (narrating comments, bloated names, needless wrappers), use the `anti-slop-code` skill; this one is about reshaping working code.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Expected failures as typed values instead of exceptions | [ERRORS.md](ERRORS.md) |
| Pure calculations, immutable updates, composable rules | [FUNCTIONAL.md](FUNCTIONAL.md) |
| Design principles as moves: injection and the composition root, strategy, null object, decorator, composite, state, command, memento, Liskov, interface segregation, CQS, Demeter, typestate, deleting speculative layers | [DESIGN.md](DESIGN.md) |
| Dependency direction: ports owned by the core, configuration as a port, layer skips, driving vs driven adapters, breaking cycles with a kernel leaf and published ports | [DEPENDENCIES.md](DEPENDENCIES.md) |
| Deep module interfaces, deletion test, leverage and locality, dependency seams and alternative designs | [DEEP-MODULES.md](DEEP-MODULES.md) |
| Duplication evidence with jscpd, Deslop and truffler, safe extraction, clone comparison and migration candidates | [DUPLICATION.md](DUPLICATION.md) |
| Dependency usage across imports, configuration and external consumers; measured upgrade/removal decisions | [DEPENDENCY-AUDIT.md](DEPENDENCY-AUDIT.md) |

## The rules

1. **Pin the behavior first.** Before touching the structure, have tests for the accepted, rejected and boundary cases of the code you're changing. Run them after every step. A "refactor" that changes behavior is a bug with a nice diff.
2. **One transformation per step,** each one small enough to review alone. Stop when the goals are met (readable, testable, changeable), not when no technique is left.
3. **Name the goal before starting:** what makes this code hard to read, test or extend? List what the function actually does (validates, loads, calculates, decides, saves) before moving anything.
4. **Keep the evaluation order** where it matters: which check fails first decides the error the caller sees, and a side effect moved earlier or later changes behavior.
5. **Readability first, then measure.** A helper call or an array method is rarely the bottleneck; when speed does matter, measure the real input (the `performance-and-caching` skill).

## Techniques, smallest first

**Guard clauses instead of nesting.** Four levels of `if` become a flat list of early returns, and conditions that lead to the same outcome merge into one:

```ts
if (!order || !order.isVerified || order.items.length === 0) return notProcessable();
if (order.items.length > MAX_LINE_ITEMS) return tooManyLineItems(order.id);
if (order.status !== "ready_to_process") return notReady(order.id);
```

**Name a complex condition.** When a merged condition stops being obvious, give it a name: `if (!isProcessable(order))`. The name says why, the body says how.

**Name magic numbers and strings.** `15` becomes `MAX_LINE_ITEMS`; a status compared as a free string becomes a union (`type OrderStatus = "pending" | "ready_to_process" | "processed"`) or an `as const` object, so a typo is a compile error and a rename reaches every use.

**Extract a function** for a block with one purpose: validation into `validateNewCustomer`, a calculation that isn't validation (`ageOn(dateOfBirth, today)`) into its own function. Duplicated blocks usually collapse into one extracted function with a parameter.

Preserve the original validation predicate when extracting it. The source checks null or empty names; the removed TypeScript illustration added `.trim()`, changing acceptance of whitespace-only names, and an `isEmail` predicate absent from the source. The source contains C# examples, not that TypeScript implementation. [milan-jovanovic, code-quality/5-awesome-csharp-refactoring-tips.md]

**Replace type-based branching with a switch or a table.** An `if / else if` chain on a type field becomes an exhaustive `switch` over a union (the compiler flags a missing case with a `never` check) or a lookup table of functions. Use a strategy object only when cases carry real behavior of their own.

```ts
function creditLimit(type: CompanyType, base: () => number): { hasLimit: boolean; limit?: number } {
  switch (type) {
    case "very_important": return { hasLimit: false };
    case "important":      return { hasLimit: true, limit: base() * 2 };
    case "regular":        return { hasLimit: true, limit: base() };
    default: { const unhandled: never = type; throw new Error(`UNKNOWN_COMPANY_TYPE: ${unhandled}`); }
  }
}
```

**Extract a module** when a rule doesn't belong to the code it sits in (a credit-limit calculation inside "add customer"): one responsibility per module, named after it.

**Inject dependencies instead of constructing them.** Code that does `new CustomerRepository()` or imports a live client inline can't be tested without the real thing. Pass the collaborators in (function parameters, a factory, an Effect service), so tests can hand in fakes. Add an interface only when there's a real boundary; an interface with one implementation, made only for mocking, is the slop the `anti-slop-code` skill removes.

**Push rules into the type that owns them.** Creating a valid customer and asking "is this under the credit limit?" belong with the customer: a `createCustomer(...)` factory that enforces the rules and a `isUnderCreditLimit(customer)` function, so the orchestration reads as steps and the rules have one home. It's a trade-off: the factory may need a dependency (the credit calculator) passed in.

**Return outcomes instead of throwing for expected failures.** See [ERRORS.md](ERRORS.md).

**Replace parallel branches with a rate table.** Fee or discount code that repeats `if (tier === "gold") rate = 0.15` per tier becomes a lookup (`const BASE_RATE = { silver: 0.05, gold: 0.15 } as const`) with an explicit result for an unknown key, one shared path for add-ons, and the cap applied once at the end. Keep the comparison operators exactly as they were: `> 500` must not become `>= 500` on the way.

**Merge duplicated validators into one check.** Five copies of "required, then max length" become one `check(value, field)` that returns a problem or nothing, called in the original order, returning the first problem. Keep the messages and the order: which error a caller sees first is part of the contract, and a later field must not be evaluated earlier than before.

**Dispatch per kind, one handler each.** A long function with interleaved special cases per item kind (the classic inventory-aging kata) becomes a handler per kind, chosen by name, each owning its whole update including its clamp. Move one kind at a time and keep the original order inside each handler (a bonus checked before a counter is decremented stays before it).

**Split a function by phase.** Scoring or formatting code that mixes "tied", "endgame" and "in progress" logic becomes one function per phase plus a lookup array for names, with the original precedence of the phases kept.

**Keep the pipeline order.** When extracting steps, preserve validate, then adjust, then classify: a bonus applied before validation can rescue an invalid input that used to be rejected.

## Pin the behavior of code without tests

When nobody knows exactly what legacy code does, record it: run the original over many generated inputs (every kind, boundary values, a range of counters), store the outputs, and diff the refactored version against them after every step (a characterization or golden-master test). Remove the recording once real tests describe the behavior.

## Quality gates

Complexity per function, nesting depth, function length and duplication are measurable; a refactoring goal can be stated as numbers (no function above a cyclomatic complexity of 10, nesting at most 2) and checked by a linter (`complexity`, `max-depth`, `max-lines-per-function` in ESLint). Meeting the numbers with behavior unchanged is the definition of done; meeting them by changing behavior is not.

**Don't broaden behavior while flattening.** Turning nested checks into guard clauses is a structural change. Adding a `.trim()`, accepting a new format or fixing a suspected bug in the same step changes behavior that callers may depend on; do it as a separate, tested change.

## Prove it

For the code being refactored, preserve the accepted, rejected and boundary cases across the actual steps. Every step passes the same behavior checks unchanged, and for each extraction you can say in one sentence which responsibility it now owns. Report checks not performed.
