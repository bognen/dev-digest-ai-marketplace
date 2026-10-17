---
type: llm
weight: 2
---

The review must report every planted layering violation below. A violation counts as reported when the response names the right file and either a line within one line of a listed location or a description that clearly matches.

- POST charge handler sums charges, decides settlement, applies discount, retries, calls several service methods. (`modules/billing/routes.ts:26-46`)
- Stripe adapter imports from modules/billing/types. (`adapters/stripe/index.ts:2-3`)
- Billing service imports ledger/helpers.js. (`modules/billing/service.ts:3`)

PASS if every violation above is reported. FAIL if any is missing.
