# Operations

Running a Stripe account day to day means reading its disputes, refunds, balance and payouts, reconciling each payout against its balance transactions, and rolling the main numbers into one health view. Everything here is read-only and runs through the Stripe MCP ([AGENT-TOOLS.md](AGENT-TOOLS.md#the-stripe-mcp)): paginate every list with `limit: 100` and `starting_after` until `has_more` is false, remember amounts are in cents, and confirm before any write. Payment flows are in [PAYMENTS.md](PAYMENTS.md), subscriptions and dunning in [BILLING.md](BILLING.md), event handling in [WEBHOOKS.md](WEBHOOKS.md).

All workflows on this page come from a third-party skill set (appeeky/stripe-skills), not from Stripe's own skills or docs. Confirm thresholds and operation names in the current docs.

## Disputes and refunds

- **Pull both lists:** `GetDisputes`, and `GetRefunds` (or charges with `refunded: true`).
- **Group by reason, amount and status** (`needs_response`, `lost`, `won`).
- **Benchmark the dispute rate below 0.75% of charges,** the card network threshold.
- **Report** dispute count, amount and win rate, refund count and amount, and an action item to respond to each `needs_response` dispute before its date.

## Balance and payouts

- **Balance:** `GetBalance` gives available versus pending, per currency.
- **Recent payouts:** `GetPayouts` with `limit: 20`; check each status (`paid`, `in_transit`, `failed`).
- **Activity:** summarize `GetBalanceTransactions` for the last 30 days (charges, fees, refunds), and report the net after fees.

## Reconciliation

1. **Pick the payout** with `GetPayouts`, with its amount and arrival date.
2. **List its balance transactions:** `GetBalanceTransactions` filtered by `payout`.
3. **Check the identity:** gross charges minus Stripe fees minus refunds minus adjustments equals the net payout.
4. **Compute fees:** sum `fee` across the balance transactions and express it as an effective percentage of gross. Break the composition down by type (charges, refunds, adjustments) with count, gross, fees and net.
5. **Flag discrepancies** between the payout net and the expected bank deposit.

- **Affiliate commissions reconcile on their own states:** pending, approved or due, paid, refunded or adjusted, disputed. "Marking a commission paid is not necessarily a money transfer", and "Replayed webhooks and exports must not count a conversion or payment twice" [coreyhaines31/marketingskills, referrals]; the program side is in [../../marketing/referral-programs/AFFILIATES.md](../../marketing/referral-programs/AFFILIATES.md#reconciliation-and-payouts).

## Health dashboard

Run in this order:

1. `get_stripe_account_info`.
2. MRR: active subscriptions, with `past_due` counted as at risk.
3. A subscription status table.
4. The top 5 past-due subscriptions by MRR.
5. Payment failures in the last 30 days.
6. Card mix, active versus `past_due`.
7. The open dispute count from `GetDisputes`.
8. Available balance from `GetBalance`.

- **Headline:** MRR, active subscriptions, and past-due count with the amount at risk.
- **Load `stripe-billing-context.md` if present** to compare against targets.
- **Report a traffic light per area:** MRR trend; churn and past due; payment failures; webhooks and emails (a manual or code check, see [WEBHOOKS.md](WEBHOOKS.md)); fraud and Radar.
- **Close with "Top 3 actions this week".**

## Prove it

- Every list call followed `has_more` with `starting_after` until it was false; no totals came from a capped search.
- The dispute rate is computed as disputes over charges and compared with 0.75%.
- For a reconciled payout, gross charges minus fees, refunds and adjustments equals the payout amount, and any gap with the bank deposit is listed.
- The health report covers all eight steps, shows a traffic light for each of the five areas and ends with three actions.
- No write calls were made during the audit.
