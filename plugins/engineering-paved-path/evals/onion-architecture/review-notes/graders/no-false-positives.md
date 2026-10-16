---
type: llm
---

The review must not report any of the following as layering violations. Mentioning them under a "not violations" or "other observations" heading is fine.

Allowed patterns that look like violations:
- `modules/notes/service.ts:3`: service imports its own module's concrete repository (documented compromise)
- `modules/notes/service.ts:2`: AppError family import
- `adapters/slack/mock.ts`: colocated mock instead of adapters/mocks.ts (convention, not a layering rule)

Files with no layering problem:
- `modules/notes/repository.ts`
- `modules/notes/helpers.ts`
- `modules/notes/types.ts`
- `modules/notes/constants.ts`
- `adapters/slack/mock.ts`
- `db/schema.ts`

Real non-layering defects (reporting them as non-layering observations is neutral):
- inline DTO omits url
- Slack failure after insert fails the request

PASS if none of the items above is listed as a layering finding. FAIL otherwise.
