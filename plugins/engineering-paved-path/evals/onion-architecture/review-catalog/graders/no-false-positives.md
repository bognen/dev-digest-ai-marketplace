---
type: llm
---

The review must not report any of the following as layering violations. Mentioning them under a "not violations" or "other observations" heading is fine.

Allowed patterns that look like violations:
- `modules/catalog/service.ts:3-5`: platform errors/logger and type-only import via pricing/index.ts
- `modules/catalog/service.ts:7`: service imports its own concrete repository
- `modules/catalog/routes.ts:11-19`: route building the service from app.container
- `modules/catalog/routes.ts:3`: ValidationError import (AppError family)

Files with no layering problem:
- `adapters/index.ts`
- `adapters/mocks.ts`
- `modules/_shared/context.ts`
- `modules/pricing/index.ts`
- `modules/pricing/types.ts`
- `modules/catalog/index.ts`
- `modules/catalog/types.ts`
- `modules/catalog/helpers.ts`
- `modules/catalog/repository.ts`
- `vendor/shared/adapters.ts`
- `db/schema.ts`

Real non-layering defects (reporting them as non-layering observations is neutral):
- (none)

PASS if none of the items above is listed as a layering finding. FAIL otherwise.
