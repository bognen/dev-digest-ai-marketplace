---
type: llm
---

The review must not report any of the following as layering violations. Mentioning them under a "not violations" or "other observations" heading is fine.

Allowed patterns that look like violations:
- `modules/billing/service.ts:4`: service imports its own concrete repository
- `modules/billing/service.ts:2`: AppError family import
- `modules/billing/routes.ts:15-19`: route building the service from app.container

Files with no layering problem:
- `modules/billing/repository.ts`
- `modules/billing/types.ts`
- `modules/ledger/index.ts`
- `modules/ledger/types.ts`
- `db/schema.ts`

Real non-layering defects (reporting them as non-layering observations is neutral):
- route imports discountedAmount (part of double discount)
- discount applied twice
- discount applied twice

PASS if none of the items above is listed as a layering finding. FAIL otherwise.
