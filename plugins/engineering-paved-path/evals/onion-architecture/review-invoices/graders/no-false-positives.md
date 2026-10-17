---
type: llm
---

The review must not report any of the following as layering violations. Mentioning them under a "not violations" or "other observations" heading is fine.

Allowed patterns that look like violations:
- `modules/invoices/routes.ts:10-14`: route building the service from app.container
- `modules/invoices/service.ts:2`: AppError family import
- `modules/invoices/service.ts:4`: service imports its own concrete repository

Files with no layering problem:
- `modules/invoices/status.ts`
- `modules/invoices/routes.ts`
- `modules/customers/repository.ts`
- `modules/customers/index.ts`
- `modules/customers/types.ts`
- `db/schema.ts`

Real non-layering defects (reporting them as non-layering observations is neutral):
- setStatus takes string
- status enum duplicated
- non-atomic status change
- no foreign key

PASS if none of the items above is listed as a layering finding. FAIL otherwise.
