# Strategic design: boundaries, language, relationships

## Bounded contexts

A bounded context is the boundary inside which one model and its vocabulary apply. The same word means different things across a business: in **Ordering** an order is a purchase request with lines and prices, in **Fulfillment** it's a picking list with warehouse locations, in **Billing** it's an invoice with payment terms. Each context gets its own `Order` type; they don't need to match.

Without boundaries you get the god model: one `Order` with 50 fields that nobody owns, where a change for Billing breaks Fulfillment and every team waits on every other.

**Signals that you've found a boundary:**
- the same word means different things to different people;
- two groups need different data for the same concept;
- the same operation has different rules in different places;
- different teams own the work.

**Subdomain vs bounded context:** a subdomain is part of the problem (the business's natural divisions); a bounded context is part of the solution (a boundary you draw around a model). Ideally one maps to the other; in practice you might start with one context covering several subdomains and split later.

**Subdomain types guide investment, not patterns:**
- **core:** what differentiates the business (a matching or pricing engine): invest most here;
- **supporting:** needed but not differentiating (inventory admin): simpler models;
- **generic:** solved problems (email delivery, authentication): buy or use a service. Classification depends on the business; for an identity provider, authentication is core.

Rule complexity, not the label, decides the implementation: a core area doesn't need every tactical pattern, and a supporting area with tangled rules can still deserve a rich model.

**In code,** a context is a module with its own folder, types and data, and a deliberate public surface:

```
src/modules/
  ordering/     domain/ application/ infrastructure/  public.ts   <- the only thing others import
  fulfillment/  domain/ application/ infrastructure/  public.ts
```

- **Start with a modular monolith:** contexts as modules in one deployable application. You can extract a service later, but you can't easily un-distribute a system. Split a module out only when something concrete forces it (a team blocked on every deploy, a module with its own scaling needs), not because the monolith feels messy. Module structure, data isolation per module and extraction steps: the `software-architecture` skill.
- **Each context owns its data:** its own tables or schema (`ordering.orders`, `fulfillment.orders`), never reading or writing another context's operational tables. In Convex, the context's tables are touched only by its own functions; others call its public functions.
- **When a context needs another's data,** keep a local copy updated from integration events, or call its public API when it needs current data and can accept the availability dependency.
- **Mistakes:** one shared model across contexts; too many tiny contexts (each costs data, events and mapping; start with fewer, larger ones); contexts cut by technical layer ("API context", "database context"); tables shared without a deliberate, small, co-owned agreement.

## Ubiquitous language

The shared vocabulary of developers and domain experts inside one context, used in conversation, documents and code. Every translation between "the customer submits an order" and `insertRecord(dto)` is where misunderstandings and bugs live. You can skip every other pattern and still benefit from this one; you can't skip this one.

- **Write down the experts' words** in conversations and workshops: customer, places an order, ships from the warehouse, payment declined, VIP gets express shipping.
- **Use them everywhere,** not only in type names:
  - commands and functions: `placeOrder`, `upgradeToVip`, one per business operation;
  - events, past tense: `OrderPlaced`, `PaymentDeclined`;
  - statuses: `"placed"`, never `"state2"`;
  - error codes that read like the rule: `order.cannot_cancel_shipped`;
  - module names: the contexts themselves.
- **No invented technical names:** `Order` not `OrderEntity`; `cancelOrder` and `shipOrder` not `updateOrderStatus`; `OrderSummary` not `OrderDTO`; `chargePayment` not `processPayment`; `deactivateAccount` not `flagAsInactive`. CRUD verbs (create, update) describe storage; the business says place, cancel, upgrade.
- **Force precision when the business is vague.** "The order is done": paid, shipped, delivered, or closed after the return window? Often it's three states with different rules: a requirements bug caught before any code.
- **Keep a glossary** as a markdown file in the repository, and update it in the same pull request that renames the code.
- **Each context has its own language.** A Sales `Customer` (credit limit, VIP) and a Support `Customer` (support tier, preferred contact) are different types. Don't merge them.
- **Evolve it:** when "priority shipping" becomes "express shipping", rename the code. When one context starts using "clients", "customers" and "accounts" for overlapping things, it's probably two contexts.
- **Write tests in the language** so an expert can read them: `"a shipped order cannot be cancelled"`.

## Context maps

A context map records how contexts and their teams depend on each other. **Upstream and downstream describe influence, not data flow:** the upstream's model, schema and release schedule flow down, and the downstream absorbs the cost of a breaking change. A third-party payment provider that consumes your webhooks is still upstream of you if it will never change for you.

| Relationship | What it means | Cost and failure mode |
|---|---|---|
| **Partnership** | Two teams succeed or fail together, plan integration jointly, change interfaces by agreement | Ongoing coordination; breaks down when one team's priorities always win |
| **Shared kernel** | A small piece of the model (types, a schema segment) co-owned by both; every change needs both sides | Grows into a dumping ground and the contexts can no longer release separately. Keep it small; if it changes weekly, shrink or split it |
| **Customer-supplier** | The downstream's needs enter the upstream's backlog; versioned contracts, migration windows, consumer-driven contract tests in the supplier's CI | Needs an actual agreement on prioritizing downstream work, not only tests |
| **Conformist** | The downstream adopts the upstream model as is | Cheap at first; every upstream rename ripples through your code. Fine for a peripheral integration. Test: "if this upstream model changes shape next quarter, how many of our files change?" If most of a module, you've conformed on something core |
| **Anti-corruption layer** | The downstream translates the upstream model into its own | Mapping code and contract tests to maintain; protects the local model |
| **Open host service + published language** | One public API and schema (OpenAPI, event schema) offered to all consumers on equal terms, instead of one custom integration each | The published language must evolve like a product, with versioning and deprecation (the `api-design` skill) |
| **Separate ways** | Don't integrate; duplicate the small thing (each module keeps its own country list) | Accepted duplication, in exchange for not coupling release schedules |

**The same patterns apply between modules of one application** (a modular monolith): every pair of communicating modules conforms, translates, shares a kernel or stays separate, and naming which one makes the coupling deliberate.

**Read your own map:** list every pair of communicating contexts and write down who absorbs a breaking change today. Then compare with intent: a core context conforming to an external system should get an anti-corruption layer; a weekly-changing shared kernel should shrink; an integration nobody can justify should go separate ways.

## Anti-corruption layer

A translation boundary that keeps an external system's vocabulary and semantics out of your model. It protects meaning, not just names: an ERP's "active order" might mean accepted, paid or merely entered.

```ts
// Local contract, in your own language (application layer)
export type DeliveryPriority = "standard" | "express" | "rush";
export type ImportedOrder = {
  orderNumber: string; customerNumber: string; priority: DeliveryPriority;
  totalUsd: number; status: "accepted" | "cancelled" | "shipped";
};
export interface OrderImport { get(orderNumber: string): Promise<ImportedOrder | null> }

// Infrastructure: the ERP shape never leaves this file
const LegacyOrderRecord = z.object({
  ORD_NUM: z.string(), CUST_ID: z.string().min(1), ORD_TYP_CD: z.number().int(),
  TOTAL_AMT: z.number().nonnegative(), STAT_CD: z.string(),   // required: missing is not zero
});

const PRIORITY: Record<number, DeliveryPriority> = { 1: "standard", 2: "express", 3: "rush" };
const STATUS: Record<string, ImportedOrder["status"]> = { A: "accepted", C: "cancelled", S: "shipped" };

export const legacyErpOrderImport = (client: LegacyErpClient): OrderImport => ({
  async get(orderNumber) {
    const raw = await client.getOrder(orderNumber);           // null only on a real 404
    if (raw === null) return null;
    const r = LegacyOrderRecord.parse(raw);
    if (r.ORD_NUM !== orderNumber) throw new Error("ERP_ORDER_MISMATCH");
    const priority = PRIORITY[r.ORD_TYP_CD];
    const status = STATUS[r.STAT_CD];
    if (!priority) throw new Error(`ERP_UNSUPPORTED_ORDER_TYPE: ${r.ORD_TYP_CD}`);
    if (!status) throw new Error(`ERP_UNSUPPORTED_STATUS: ${r.STAT_CD}`);
    return { orderNumber: r.ORD_NUM, customerNumber: r.CUST_ID, priority, totalUsd: r.TOTAL_AMT, status };
  },
});
```

- **An unknown code stops translation;** it must never default to a success value. A new code needs an explicit mapping decision.
- **Keep failure kinds distinct:** not found (`null`), timeout or unavailable (retryable error), malformed data (an error to investigate).
- **Make units explicit:** the currency is part of the contract; don't blanket-divide amounts by 100.
- **The imported value is a DTO, not your aggregate.** The import use case decides: create a local order, update a projection, or flag a conflict.
- **Incoming webhooks go through the same boundary:** authenticate, validate, translate into a local command; store the provider's event ID as an idempotency key in the same transaction as the resulting changes and outgoing messages.
- **Translation doesn't decide.** The ACL says the ERP cancelled the order; your aggregate decides whether its order can still be cancelled after shipment.
- **The client handles transport, the ACL handles meaning:** a base URL from required configuration, a timeout on every call, path parameters URL-encoded, a 404 mapped to `null` and other non-2xx responses raised as errors.
- **Translation can enrich from local data** (adding the warehouse location to an incoming order); when the local lookup fails, follow an explicit retry or review policy instead of creating an unusable record.
- **An adapter converts one interface to another; an ACL translates a whole model,** including names, types and meanings, into your context's language.
- Modules in one application often need ACLs between them too, because each module is a context with its own model.
- It can be one module, not a separate service. Skip it when the external contract already matches your model.

## EventStorming

A workshop for discovering a domain as a timeline of events, with the people who do the work. Use it when understanding is the bottleneck: a new domain, before splitting a monolith (so boundaries come from the domain, not the org chart or the schema), onboarding onto a legacy process that lives in three people's heads, or when two departments use the same words differently. It's overkill for a well-understood CRUD feature.

**Why events first:** everyone owns the vocabulary (a warehouse operator won't debate class diagrams but will correct `OrderShipped` into `PickListGenerated`, `OrderPacked`, `CarrierPickedUp`); laying events in time order forces "what happens between these two?", where undocumented workarounds and compensations live; and changes of language or owner between events point at possible boundaries.

**Three levels:** *big picture* maps a whole business line end to end to find hotspots and candidate boundaries (about a day); *process level* zooms into one process and adds commands, policies and read models; *design level* goes down to aggregates and invariants, close enough to start coding (2 to 4 hours each).

**Setup:** a long wall of paper (8 m or more) or an infinite online board, markers, no tables in the way, 6 to 12 people. Domain experts are non-negotiable; without them you're documenting assumptions. A big-picture session takes about a day; process or design sessions on one area take 2 to 4 hours.

**The legend** (agree on it first; big-picture sessions often use only orange, pink and red):

| Color | Meaning |
|---|---|
| Orange | Domain event, past tense, business-relevant: `OrderPlaced` |
| Blue | Command that caused it: `PlaceOrder` |
| Small yellow | Actor (person or role) |
| Pink | External system (payment provider, carrier API) |
| Purple | Policy: "whenever X happens, do Y" |
| Green | Read model: what the actor needs to see to decide |
| Large yellow | Aggregate that accepts the command and emits the event (added last) |
| Red | Hotspot: a question, disagreement or pain point |

**Phases:**
1. **Chaotic exploration (60 to 90 min):** everyone writes events in parallel, roughly in time order. No debate; duplicates show what's salient.
2. **Enforce the timeline (60 min):** walk it left to right together, merge duplicates, fix tense, reorder. Every ordering argument is signal: the order varies, or two people run different processes for the same job. Red sticky on each.
3. **Pivotal events (30 min):** where the language changes and a new cast takes over (`OrderPlaced` ends shopping and starts fulfillment). Mark them: they **suggest** boundaries to check against language, rules, data ownership and teams; they don't decide them.
4. **Process and design level:** for the area that matters most, add commands, policies, read models, and finally aggregates. The sentence to read off the wall: *actor* issues *command* on *aggregate*, which emits *event*; *policy* reacts and issues the next command.

The facilitator invites quieter people in, doesn't dictate the model, and time-boxes disagreements with a named owner for each follow-up.

**What goes wrong:** no experts in the room (reschedule); one senior voice narrates (hand markers to the quiet people who do the work daily); resolving hotspots live (park them with an owner and a follow-up); modeling the ideal process instead of the real one with its workarounds (the gap is your project); no follow-up (photograph the wall, assign owners, record decisions; sometimes the result is a better process with no software at all).

**From wall to code:** pick one use case, list its invariants, implement just enough to test the assumptions with an expert. Workshop events suggest domain or integration events, commands suggest use cases, policies suggest event handlers, process managers or manual tasks. Not every sticky becomes code, and not every event goes on a message bus: only those crossing a boundary, as a deliberate contract. Put the agreed names into the glossary and the code.

## Prove it

Compare a Book in an acquisitions context and a lending context: list the identities, fields and rules of each, then define the small contract that connects them and say which side is upstream. Name one word the two contexts use differently and record it in each glossary.
