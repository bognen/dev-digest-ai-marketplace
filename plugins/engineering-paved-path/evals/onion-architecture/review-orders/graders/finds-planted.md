---
type: llm
weight: 2
---

The review must report every planted layering violation below. A violation counts as reported when the response names the right file and either a line within one line of a listed location or a description that clearly matches.

- repository.ts exports OrderRow = typeof t.orders.$inferSelect and returns it from getRow; the service imports and uses it. (`modules/orders/repository.ts:6`, `modules/orders/repository.ts:29`, `modules/orders/service.ts:5`, `modules/orders/service.ts:47`)
- OrdersService.place takes { customer_id, line_items: [{ unit_cents }] } contract-shaped input. (`modules/orders/service.ts:26-40`)
- pipeline/fulfil.ts imports and instantiates the concrete HttpWarehouse adapter. (`modules/orders/pipeline/fulfil.ts:1-6`)
- Orders service imports inventory/service.js, a private file of another module. (`modules/orders/service.ts:3`, `modules/orders/service.ts:14`)
- helpers.ts reads process.env.ORDER_TAX_RATE. (`modules/orders/helpers.ts:3`)

PASS if every violation above is reported. FAIL if any is missing.
