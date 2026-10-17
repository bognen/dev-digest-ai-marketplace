---
type: llm
---

The review must not report any of the following as layering violations. Mentioning them under a "not violations" or "other observations" heading is fine.

Allowed patterns that look like violations:
- `modules/shipments/service.ts:2`: @acme/contracts CarrierCode (shared kernel)
- `modules/shipments/service.ts:5`: AppError family import
- `modules/shipments/service.ts:7`: service imports its own concrete repository
- `modules/shipments/service.ts:36-40`: ExternalServiceError wrapping
- `modules/shipments/routes.ts:10-14`: route building the service from app.container

Files with no layering problem:
- `modules/shipments/repository.ts`
- `modules/shipments/types.ts`
- `adapters/carrier/index.ts`
- `db/schema.ts`

Real non-layering defects (reporting them as non-layering observations is neutral):
- unchecked cast
- catch discards cause

PASS if none of the items above is listed as a layering finding. FAIL otherwise.
