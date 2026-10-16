---
type: llm
weight: 2
---

The review must report every planted layering violation below. A violation counts as reported when the response names the right file and either a line within one line of a listed location or a description that clearly matches.

- listByCarrier imports drizzle-orm and db/schema and queries the database in the service. (`modules/shipments/service.ts:1-4`, `modules/shipments/service.ts:12-13`, `modules/shipments/service.ts:26-31`, `modules/shipments/routes.ts:12`)
- GET /shipments/:id/events calls app.container.carrier().track in the handler. (`modules/shipments/routes.ts:30-35`)
- Pure helper imports CARRIER_BASE_URL from adapters/carrier. (`modules/shipments/helpers.ts:1-6`)

PASS if every violation above is reported. FAIL if any is missing.
