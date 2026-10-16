---
type: llm
---

The review must not report any of the following as layering violations. Mentioning them under a "not violations" or "other observations" heading is fine.

Allowed patterns that look like violations:
- `modules/orders/service.ts:2`: AppError family import
- `modules/orders/service.ts:4`: type-only import through inventory/index.ts (public surface)
- `modules/orders/routes.ts:9-25`: route building the service from app.container
- `modules/orders/constants.ts`: strings that mention drizzle-orm and fastify

Files with no layering problem:
- `modules/_shared/context.ts`
- `modules/orders/index.ts`
- `modules/orders/types.ts`
- `modules/orders/status.ts`
- `modules/orders/constants.ts`
- `modules/orders/run-executor.ts`
- `modules/orders/pipeline/notify.ts`
- `modules/inventory/index.ts`
- `modules/inventory/types.ts`
- `modules/inventory/helpers.ts`
- `modules/inventory/repository.ts`
- `modules/inventory/service.ts`
- `adapters/warehouse/index.ts`
- `adapters/mocks.ts`
- `db/schema.ts`

Real non-layering defects (reporting them as non-layering observations is neutral):
- (none)

PASS if none of the items above is listed as a layering finding. FAIL otherwise.
