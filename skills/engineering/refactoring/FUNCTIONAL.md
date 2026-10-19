# A functional core

The goal isn't purely functional code. It's code whose calculations can be read and tested on their own, with the effects (database, network, clock, notifications) at a thin outer layer. Adopt it one module at a time.

## Pure calculations

A pure function depends only on its arguments and changes nothing outside itself: no database, no API call, no clock, no module-level state. Same input, same output, so it tests with plain values and is safe to call concurrently.

```ts
// impure: hidden state decides the result
class PriceCalculator {
  constructor(private taxRate: number, private activeDiscounts: Discount[]) {}
  price(order: Order) { /* reads this.taxRate, this.activeDiscounts */ }
}

// pure: everything it depends on is a parameter
export function orderPrice(order: Order, taxRate: number, discounts: readonly Discount[]): number {
  const base = order.items.reduce((sum, item) => sum + item.price, 0);
  const afterDiscounts = discounts.reduce((price, d) => price - d.amountOff(price), base);
  return afterDiscounts * (1 + taxRate);
}
```

The orchestration around it loads the inputs, calls the calculation, then saves and notifies. Split a mixed function that way and the hard part (the calculation) needs no mocks.

## Immutable updates

A mutable object lets anyone change it at any time: an item added to a shipped order, a total that no longer matches its items, two callers changing the same object. Return a new value instead, and derive what can be derived:

```ts
type Order = Readonly<{ status: OrderStatus; items: readonly OrderItem[] }>;

export const orderTotal = (order: Order) => order.items.reduce((sum, i) => sum + i.price, 0);

export function addItem(order: Order, item: OrderItem): Order {
  if (order.status !== "created") throw new Error("ORDER_NOT_EDITABLE: items can't be added after creation");
  return { ...order, items: [...order.items, item] };
}
```

- The total is computed, never stored beside the items, so it can't drift from them.
- `readonly` types make an accidental mutation a compile error; `Object.freeze` only guards at runtime and only one level deep.
- The rule (no edits after creation) lives in the one function that changes items. Return a typed error instead of throwing when callers are expected to hit it ([ERRORS.md](ERRORS.md)).

## Rules as composable functions

A validator with hard-coded checks can't vary by country, reuse some rules or combine them differently. Make each rule a small function and build validators from lists of them:

```ts
type Rule<T> = (value: T) => string | null;      // an error message, or null when it passes

const all = <T>(...rules: Rule<T>[]): Rule<T> => (value) => {
  for (const rule of rules) { const error = rule(value); if (error) return error; }
  return null;
};

const baseOrderRules = (minimum: number) => all<Order>(
  (o) => (o.items.length > 0 ? null : "order.empty"),
  (o) => (o.total >= minimum ? null : "order.below_minimum"),
  (o) => (o.shippingAddress ? null : "order.no_shipping_address"),
);

export const orderValidatorFor = (country: "US" | "EU" | "other") =>
  country === "US" ? all(baseOrderRules(25), (o) => (isValidUsAddress(o.shippingAddress) ? null : "order.invalid_us_address"))
  : country === "EU" ? all(baseOrderRules(30), (o) => (isValidVatNumber(o.vatNumber) ? null : "order.invalid_vat"))
  : baseOrderRules(0);
```

- The list makes variations cheap: a rule per country, a shared base, rules reused elsewhere.
- **First error or all errors** is one line apart: stop at the first failing rule (above), or `rules.map((r) => r(value)).filter(Boolean)` to report every problem at once, which is usually better for forms.
- For request input you'd usually express these as a schema (zod or Effect Schema) with refinements; the composition idea is the same.

## Map and flat-map

`array.map` transforms each value inside a container; `array.flatMap` transforms each into a container and flattens the result (`folders.flatMap(listFiles)`). The same two moves chain operations on results that may fail: map the success value, or flat-map into the next step that can fail and stop at the first failure. Effect's `Effect.map` and `Effect.flatMap` (or `Effect.gen`) are exactly this, with the failures tracked in the type.

## Choosing the data structure

Use the canonical [hash-map and set patterns](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/algorithm-patterns/PATTERNS.md#hash-map-or-set-remember-instead-of-rescanning) for duplicate detection, iterable inputs and equality choices.

## Prove it

Split a loan-price calculation from its persistence and notifications. Test the pure calculation with boundary inputs and plain values, no mocks; confirm the input objects are unchanged afterwards. Then compose it into the orchestration and handle a validation failure there.
