---
type: llm
---

The review must not report any of the following as layering violations. Mentioning them under a "not violations" or "other observations" heading is fine.

Allowed patterns that look like violations:
- `modules/projects/service.ts:2-4`: platform logger/errors and own concrete repository imports
- `modules/sync/service.ts:1`: type-only import through projects/index.ts (public surface)
- `modules/sync/routes.ts`: route wiring a cross-module lookup through the Container
- `modules/projects/routes.ts:10-16`: route building the service from app.container
- `modules/projects/constants.ts`: string that mentions fastify

Files with no layering problem:
- `modules/_shared/context.ts`
- `modules/projects/index.ts`
- `modules/projects/types.ts`
- `modules/projects/constants.ts`
- `modules/projects/status.ts`
- `modules/projects/repository.ts`
- `modules/sync/index.ts`
- `modules/sync/types.ts`
- `modules/sync/routes.ts`
- `platform/logger.ts`
- `db/schema.ts`

Real non-layering defects (reporting them as non-layering observations is neutral):
- (none)

PASS if none of the items above is listed as a layering finding. FAIL otherwise.
