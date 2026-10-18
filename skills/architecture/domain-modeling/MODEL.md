# The tactical model inside a context

**Contents:** [Entity or value object](#entity-or-value-object) · [Typed IDs](#typed-ids) · [Always valid: invariants on the object](#always-valid-invariants-on-the-object) · [Five ways to express a business rule](#five-ways-to-express-a-business-rule) · [Encapsulated collections](#encapsulated-collections) · [Aggregates](#aggregates) · [Factories](#factories) · [Domain services and application services](#domain-services-and-application-services) · [From scripts to a model, and from anemic to rich](#from-scripts-to-a-model-and-from-anemic-to-rich) · [Prove it](#prove-it)

## Entity or value object

| | Entity | Value object |
|---|---|---|
| Defined by | An identity that survives changes (`Order`, `Customer`) | Its values (`Money`, `Email`, `DateRange`, `Address`) |
| Equality | Same type and same ID | Same values; equal instances are interchangeable |
| Change | Through methods that keep the identity | Never mutated; replaced by a new value |

Choose a value object when the business treats equal values as interchangeable ($100 is $100 in any account), an entity when it must track one thing through changes (two customers named John are different people). The same concept can be either in different contexts: an address is a value on an order but an entity in a property registry.

Using raw strings and numbers for concepts that carry rules (an email, an amount with a currency, a date range) is **primitive obsession**: the validation gets scattered and the types can't tell an email from a name.

**Equality covers the values that define the concept,** usually all of them, sometimes only some (an address compared without its free-text delivery note). Decide it deliberately.

**In TypeScript, value equality isn't built in:** `===` compares object references. Give each value object an `equals`, or keep it a frozen plain object compared by its fields, and never mutate it.

```ts
export class Money {
  private constructor(readonly amount: number, readonly currency: string) { Object.freeze(this); }

  static create(amount: number, currency: string): Result<Money, MoneyError> {
    if (!Number.isFinite(amount) || amount < 0) return err({ code: "money.negative" });
    const code = currency.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(code)) return err({ code: "money.invalid_currency" });
    return ok(new Money(amount, code));
  }

  static zero(currency: string): Money { return Money.create(0, currency).unwrap(); } // still goes through create

  add(other: Money): Money {
    if (other.currency !== this.currency) throw new Error("MONEY_CURRENCY_MISMATCH");
    return new Money(this.amount + other.amount, this.currency);
  }

  equals(other: Money): boolean { return this.amount === other.amount && this.currency === other.currency; }
}
```

- **Every public way to create one goes through the same validation,** including convenience constructors like `zero`.
- **Value objects pay off** when the rules are non-trivial, several primitives travel together (an address, a date range), or the same validation is repeated in many places. Two or three uses of a simple rule can do without.
- **They make signatures honest:** `price(apartment, period: DateRange)` instead of `price(apartment, start, end)`.
- **A value object holding a collection** (a schedule of time slots) copies and sorts its input at creation, validates the whole (no overlaps), exposes it read-only, and compares contents, not array references.
- **Money in production:** store amounts in integer minor units or a decimal type, never floating point, and validate against the currencies you support. Ranges are clearer half-open (`start < other.end && other.start < end`), so touching ranges don't overlap.
- **Storing them:** flatten a value object into columns of its owner's table (`total_amount`, `total_currency`, `shipping_street`), or a `jsonb` column for a small group; rebuild it through its factory when loading. In Convex, a nested object field validated with `v.object(...)`.
- **An email value object:** trim, reject empty, cap at 254 characters, parse it, and require the parsed address to equal the trimmed input (that rejects display-name forms like `"Ann" <ann@x.com>`); keep the user's casing. Parsing proves syntax only, not that the mailbox exists or belongs to the user; that needs a verification flow.
- **Decide the rounding rule explicitly** where money is computed (to 2 decimals, half away from zero, or banker's rounding) and apply it in one place, so a discount gives the same total on every path.

## Typed IDs

Several string or UUID parameters (`assign(orderId, customerId)`) are a swap waiting to happen, and the compiler can't see it. Brand them:

```ts
export const OrderId = z.string().uuid().brand<"OrderId">();
export type OrderId = z.infer<typeof OrderId>;
export const CustomerId = z.string().uuid().brand<"CustomerId">();
export type CustomerId = z.infer<typeof CustomerId>;

assignOrder(orderId, customerId);   // swapping them is now a compile error
```

- Brands exist only at compile time; a value gets one by being parsed at the boundary (request, route parameter, queue message), which is also where you validate it.
- **Convex already does this:** `v.id("orders")` gives `Id<"orders">`, which can't be passed where `Id<"customers">` is expected.
- **Reject empty and all-zero IDs at the boundary;** a placeholder value that type-checks still flows into the database. Effect users can do the same with `Brand` or `Schema.brand`.
- Time-ordered UUIDs (version 7) can help index locality depending on how your database stores them; measure before switching.
- Worth it when functions take several IDs of the same primitive, when you've had swap bugs, or when aggregates reference each other by ID. Start with the key aggregates.

## Always valid: invariants on the object

An **invariant** is a rule that holds for as long as the object exists, not only when a validator ran: an order's total equals the sum of its lines; a subscription is in exactly one state; a published course has at least one lesson. When a class accepts any combination of values, every caller must remember every rule, and the copy in a new endpoint is the one that forgets.

Three moves:

1. **Block invalid construction:** a private constructor and one factory that validates.
2. **Guard every transition:** no setters; each change is a method that checks whether it's allowed now.
3. **Guard the aggregate:** rules that span children live on the root, and children change only through it.

The old TS illustration exposed mutable child objects through a copied array; see [Encapsulated collections](#encapsulated-collections) for the shallow-copy limitation and official references.

**Boundary validation and invariants are both needed.** Request validation (a zod schema on the input) rejects malformed data early with field-level errors. Invariants are what the domain guarantees regardless of caller: a background job, a queue consumer or a future teammate calling `Order.create` directly still can't break them. Some checks appear in both places on purpose; the domain must never depend on the boundary having run.

**First error or all errors:** a transition usually stops at the first broken rule; a method that accepts a batch (adding several exercises to a workout, each needing a distance or a duration) should collect every invalid item and return them together, then apply nothing if any failed.

**Entities need a real identity:** reject an empty or placeholder ID in the constructor, and compare entities by type and ID, never by their fields.

**Results or exceptions:** return a typed failure for an expected outcome the caller can act on (shipping an unpaid order from a user action); throw for programmer errors that should be unreachable. See the `refactoring` skill's ERRORS.md.

**Persistence bypasses factories.** Rows loaded from the database, imports and old data written under older rules don't pass through `create`. Keep database constraints for what must hold in storage, and decide a rehydration policy (validate on load, or migrate old rows).

**What you can delete afterwards:** repeated format checks once a value object exists, re-validating the same local rules before every save, defensive copies scattered around callers. What stays: not-found checks, null guards at boundaries, and concurrency protection, since two valid in-memory objects can still be conflicting writes.

**Tests get simpler:** factories make impossible states impossible in tests too. A small builder that composes the public factories keeps setup short.

## Five ways to express a business rule

| Tool | Use for |
|---|---|
| **Guard clause** in the method | One or two simple checks, or conditions that mean a programming error |
| **Rule object** | A rule reused across operations or complex enough for its own tests |
| **Result** from the method | Expected failures the caller must handle, with stable error codes |
| **Value object** | Structural constraints on one value or a few related values |
| **Factory** | Rules that must hold at creation |

A rule object has a name, a message and one check, and is tested with only the state it needs:

```ts
type BusinessRule = { code: string; isBroken: () => boolean };

const orderMustHaveLines = (lines: readonly OrderLine[]): BusinessRule =>
  ({ code: "order.no_lines", isBroken: () => lines.length === 0 });
const orderMustBeDraft = (status: OrderStatus): BusinessRule =>
  ({ code: "order.not_draft", isBroken: () => status !== "draft" });

function firstBroken(...rules: BusinessRule[]): string | null {
  return rules.find((r) => r.isBroken())?.code ?? null;
}

confirm(): Result<void, OrderError> {
  const broken = firstBroken(orderMustBeDraft(this.#status), orderMustHaveLines(this.#lines));
  if (broken) return err({ code: broken });
  this.#status = "confirmed";
  return ok();
}
```

They compose: value objects for structure, a factory for creation, result-returning methods for transitions, and guard clauses inside private helpers. **Input validation asks "is this data well-formed?"**; **business rules ask "is this allowed right now?"** and usually depend on current state, so they belong in the model. Rules across aggregates or requests still need the database (constraints, conditional updates) to hold under concurrency.

## Encapsulated collections

A public mutable array lets anyone `push`, `splice` or clear it, skipping every rule and every event. TypeScript's `readonly` is compile-time only: returning the internal array typed as `readonly OrderLine[]` still hands out the real array, and a cast or plain JavaScript can mutate it.

- Keep the collection private and route changes through the root. A copied or frozen container still shares object-valued children unless those children are also protected. The old spread-copy example protected the array structure only; do not claim it prevents child mutation. [milan-jovanovic, encapsulating-collections-domain-entities; https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax; https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze]
- **Children are protected too:** a line's quantity changes through the root, never through a mutable child reference returned to a caller. Unexported constructors or mutators alone do not protect public mutable object properties. [milan-jovanovic, encapsulating-collections-domain-entities; https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax]
- **Guard numeric overflow:** JavaScript numbers lose precision past `Number.MAX_SAFE_INTEGER`; check `Number.isSafeInteger` on quantities and minor-unit amounts after arithmetic, or use `bigint` for money totals.
- **Typical root rules:** merge a repeated product into the existing line; reject it if the price differs; cap the number of distinct lines but still let an existing line grow; compute the new total before changing anything, so a failure leaves no partial update.
- **Persistence:** map the private state explicitly in the repository (rows in, aggregate out, and back), loading the children each operation needs.
- **Test through the public API:** adding works, the cap returns a failure, a repeated product increases the quantity.

## Aggregates

An aggregate is a cluster of objects changed as one unit: a **root** that is the only entry point, a **consistency boundary** whose rules hold after every operation, and children reachable only through the root.

**The four rules:**
1. **Protect the invariants inside the boundary,** on the root (draft-only edits, positive quantities, a total that always matches the lines).
2. **Keep it small.** A `Customer` holding all its orders, addresses, payment methods and cart is expensive to load and a magnet for conflicting writes. Make each its own aggregate.
3. **Reference other aggregates by ID** (`order.customerId`), not by holding the object, so loading and saving each stays explicit. A use case that needs both loads both in the application layer.
4. **Update other aggregates later, through events,** when the business accepts the delay: the order completes now; loyalty points arrive a moment later.

**Finding the boundary:**
- What must be consistent immediately? Same aggregate.
- What can be eventually consistent? Separate aggregate, updated by an event.
- What changes together? Group it.
- What's the smallest unit you can lock without breaking a rule? That's the target size.

**One aggregate per transaction is a default, not a law.** If the business can't tolerate the intermediate state (confirming an order and reducing stock must happen together), one transaction across both can be right; if that need keeps coming up, revisit the boundaries. The alternative is a pending state: the order requests stock, a handler reserves it with concurrency protection, then confirms or rejects the order.

**Mistakes:** an aggregate with hundreds of children (review loading cost and which children really share an invariant before splitting); exposing children for direct edits; choosing eventual consistency the business never agreed to; CRUD on children (`order.lines.push`) instead of domain methods.

**Repositories exist per aggregate root,** on the command side, and load the children each operation needs. Read-only queries can project child data directly; there's no `LineItemRepository`.

**Concurrency:** guarded methods protect one in-memory instance. Two requests that loaded the same aggregate can both pass. Give the aggregate a version that changes on every modification, including child-only edits, and save with `update ... where id = $1 and version = $2`; on zero affected rows, reload and re-run the command. In Convex, a mutation that loads and saves the aggregate is already serializable and retried on conflict.

## Factories

Creation often validates rules, sets defaults, creates children and records an event, and that logic doesn't belong in the caller.

- **A static factory on the aggregate** (`Order.create(customerId, pricedItems, now)`) for creation within one model. It takes already-priced input: the application resolves trusted catalog prices first; the factory never trusts a client-sent price.
- **A separate factory or application function** when creation needs repositories, external services or async lookups (load products, compute prices, reject duplicate products in the request), ending with the aggregate's own factory, which still validates the result. A stock check there is advisory: stock can change before the save, so reserve it with concurrency protection.
- **An aggregate as factory for its children** (a cart creates its own items) and sometimes for another aggregate (`auction.placeBid(...)` validates bid rules and returns a `Bid`). Returning a new aggregate doesn't save it: persist both atomically with concurrency protection, or use a pending workflow.
- **Choosing among subtypes** (checking, savings, premium accounts) is a plain switch in a factory function.
- **Skip the factory** when construction just sets fields, has no rules and raises no events.
- **Inject the clock** (`now`) instead of reading it inside, so creation is testable.

## Domain services and application services

**An application service orchestrates a use case. A domain service makes a business decision.**

| | Application service (a command handler, a Convex mutation, a server action) | Domain service |
|---|---|---|
| Does | Load, call the domain, save, trigger side effects | Decide a rule that spans aggregates or doesn't fit one entity |
| Knows | Requests, transactions, repositories, the outside world | Only domain types |
| Contains rules | No | Yes |
| Tests | Orchestration and failure handling | Decisions, with plain objects |

```ts
// Domain: a decision over two accounts, no I/O
export function transfer(source: Account, destination: Account, amount: Money): Result<void, TransferError> {
  if (source.id === destination.id) return err({ code: "transfer.same_account" });
  if (amount.amount <= 0 || !destination.canDeposit(amount)) return err({ code: "transfer.invalid" });
  const withdrawn = source.withdraw(amount);       // check the destination first: no half-applied transfer
  if (!withdrawn.ok) return withdrawn;
  destination.deposit(amount);
  return ok();
}

// Application: everything around the decision
export async function transferMoney(cmd: TransferCommand, deps: Deps): Promise<Result<void, TransferError>> {
  const [source, destination] = await Promise.all([deps.accounts.get(cmd.sourceId), deps.accounts.get(cmd.destinationId)]);
  if (!source || !destination) return err({ code: "transfer.account_not_found" });
  const result = transfer(source, destination, cmd.amount);
  if (!result.ok) return result;
  await deps.accounts.saveAll([source, destination]);  // one transaction, with version checks on both
  return ok();
}
```

- **Three review questions:** does it coordinate infrastructure? (application). Would a domain expert recognize the logic read aloud without the plumbing? (domain). Does its test check a decision or the order of calls? A mock's presence doesn't decide the layer.
- **The most common finding:** an "application service" with an `if` chain implementing a pricing or eligibility rule. Extract the decision: onto the entity if it fits one aggregate, into a domain service if it spans several.
- **When a domain service is right:** the rule spans several aggregates (a transfer between two accounts), needs data no single entity has (exchange rates, current pricing rules), or is a domain concept that isn't an entity or value (a pricing policy reused by orders, quotes and subscriptions, applying a promotion and then a loyalty discount in a defined order).
- **What the split buys:** the same rule works from the API, a batch job and an admin tool because it doesn't know who called it; decisions test with plain objects while orchestration tests cover loading and failures; and changing infrastructure never touches the rules.
- **Entity first, domain service second.** A codebase where every rule lives in services has rebuilt the anemic model with extra steps. Name services after domain concepts (`pricing`, `moneyTransfer`, `availability`), not `OrderHelper` or `OrderManager`; keep them stateless.
- **A domain service may read data a rule needs** through a domain-defined interface (an email uniqueness check), sparingly. Prefer checking in the application layer, and always back uniqueness with a unique index on the normalized value, mapping the duplicate-key error to a conflict result (and exclude the current user when they change their own email). A domain service that loads and saves aggregates for a use case is orchestration in the wrong place.
- **Passing a policy into an aggregate method** (`order.applyDiscount(policy)`) keeps the entity synchronous and testable; if the policy needs I/O, fetch the data in the application layer and pass the result, accepting that the caller must supply fresh data.
- **Transactions and side effects stay in the application layer.** Atomic writes still don't stop two requests spending the same balance: use version checks or conditional updates and re-evaluate on conflict. Transfers across separate stores need a workflow (EVENTS.md), not a domain service.

## From scripts to a model, and from anemic to rich

Signs of an anemic model: entities with public setters and no behavior, exposed mutable collections, every rule in a service. It costs discoverability (what can I do with an order?), duplication and encapsulation. It's fine for CRUD, data-centric tools and areas with no invariants.

**Refactor in slices, one rule at a time, keeping tests on observable behavior** (if an input produced USD 135 before, it still does):

1. **Hide the setters** (`#status` with a getter). Everything that wrote it directly stops compiling: that's the list of places to fix.
2. **Add domain methods** for each write you found: `order.cancel(reason)` instead of `orderService.cancel(order)` or `order.status = "cancelled"`.
3. **Protect collections:** private array, methods for changes.
4. **Replace primitives with value objects** where rules live (`Money`, `Email`, `DateRange`).
5. **Add factories** for creation with rules.
6. **Move validation into the methods,** returning typed results with a catalog of error codes, which doubles as documentation of the domain.
   Example: an invitation handler that built `{ status: "pending", ... }` itself and pushed it onto `gathering.invitations` becomes `gathering.sendInvitation(member)`, which rejects inviting the creator or a gathering in the past, creates the pending invitation itself (the invitation's constructor isn't exported), and records `InvitationSent`.
7. **Move side effects out:** a handler that saves and then sends an email isn't atomic (the save can succeed and the email fail, and it slows the request). Raise a domain event in the method and send the email from a background handler that can retry (EVENTS.md).

Two principles guide each step: **protect invariants close to the data**, and **tell, don't ask**: instead of a service asking an object for its state and then changing it (`if (order.status === "draft") order.lines.push(...)`), tell the object what you want (`order.addLine(...)`) and let it check its own rules. The application layer should read as intent ("place order"), not mechanics ("compute totals, check credit, write rows").

Passing a service into a domain method (`Order.create(customer, lines, pricing, inventory)`) keeps a domain workflow in the domain; use it selectively, only when the operation clearly belongs there. Checking stock inside the order couples ordering to inventory; some domains instead accept the order and validate stock asynchronously through an event.

The handler that remains reads like a story: load, call the domain, save. In one example a 44-line method became 14 with no business logic left in it.

## Prove it

- Create a loan period that rejects an end before its start, and test construction plus every public mutation.
- Model a reservation and list every way it can change state; for each, show the capacity and deadline rules still hold, including two simultaneous creations (the database decides).
- Try to bypass the root: mutate a returned child array, edit a child directly, construct with invalid values. Each attempt must fail or be impossible.
