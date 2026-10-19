# Operations

Running a Stripe account day to day means reading its disputes, refunds, balance and payouts, reconciling each payout against its balance transactions, and rolling the main numbers into one health view. Everything here is read-only and runs through the Stripe MCP ([AGENT-TOOLS.md](AGENT-TOOLS.md#the-stripe-mcp)): follow the shared [read/pagination/currency contract](AGENT-TOOLS.md#the-stripe-mcp), and confirm before any write. Payment flows are in [PAYMENTS.md](PAYMENTS.md), subscriptions and dunning in [BILLING.md](BILLING.md), event handling in [WEBHOOKS.md](WEBHOOKS.md).

All workflows on this page come from a third-party skill set (appeeky/stripe-skills), not from Stripe's own skills or docs. Confirm thresholds and operation names in the current docs.

## Disputes and refunds

- **Pull both lists:** `GetDisputes`, and `GetRefunds` (or charges with `refunded: true`).
- **Group by reason, amount and status** (`needs_response`, `lost`, `won`).
- **Name the actual monitoring program.** Stripe cites dispute rates above 0.75% as an industry excessive-dispute indicator, not a universal card-network threshold. Applicable programs have their own numerator, denominator, window, counts and regional rules, and intervention can occur earlier. The old source called 0.75% the network threshold. [appeeky/stripe-skills, dispute-refund-audit; https://docs.stripe.com/disputes/measuring; https://docs.stripe.com/data/query-disputes-and-fraud-data]
- **Report** dispute count, amount and win rate, refund count and amount, and an action item to respond to each `needs_response` dispute before its date.

## Balance and payouts

- **Balance:** `GetBalance` gives available versus pending, per currency.
- **Recent payouts:** `GetPayouts` with `limit: 20`; check each status (`paid`, `in_transit`, `failed`).
- **Activity:** summarize `GetBalanceTransactions` for the last 30 days (charges, fees, refunds), and report the net after fees.

## Reconciliation

1. **Pick the payout** with `GetPayouts`, with its amount and arrival date.
2. **List its balance transactions:** `GetBalanceTransactions` filtered by `payout`.
3. **Reconcile signed balance transactions for that payout.** Preserve each documented amount, fee and net sign; do not subtract an already-negative refund or adjustment twice. [appeeky/stripe-skills, payout-reconciliation; https://docs.stripe.com/reports/payout-reconciliation]
4. **Compute fees:** sum `fee` across the balance transactions and express it as an effective percentage of gross. Break the composition down by type (charges, refunds, adjustments) with count, gross, fees and net.
5. **Flag discrepancies** between the payout net and the expected bank deposit.

- **Affiliate commissions reconcile on their own states:** pending, approved or due, paid, refunded or adjusted, disputed. "Marking a commission paid is not necessarily a money transfer", and "Replayed webhooks and exports must not count a conversion or payment twice" [coreyhaines31/marketingskills, referrals]; the program side is in [referral-programs AFFILIATES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/referral-programs/AFFILIATES.md#reconciliation-and-payouts).

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
- **Use shared product context for relevant marketing targets:** `.agents/product-context.md`, as defined in [anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md). Do not create another required billing-context file. [user shared-context rule]
- **Report a traffic light per area:** MRR trend; churn and past due; payment failures; webhooks and emails (a manual or code check, see [WEBHOOKS.md](WEBHOOKS.md)); fraud and Radar.
- **Close with "Top 3 actions this week".**

## Prove it

- Every total follows the shared [endpoint-pagination contract](AGENT-TOOLS.md#the-stripe-mcp), with any host cap or incomplete coverage explicit.
- The dispute metric names its numerator, denominator, window and applicable program; 0.75% is labeled only as Stripe's broad industry indicator. [https://docs.stripe.com/disputes/measuring]
- Signed balance-transaction net amounts reconcile to the selected payout, and any bank-deposit difference remains explicit. [https://docs.stripe.com/reports/payout-reconciliation]
- The health report covers all eight steps, shows a traffic light for each of the five areas and ends with three actions.
- No write calls were made during the audit.
