---
type: llm
---

The review must not report any of the following as layering violations. Mentioning them under a "not violations" or "other observations" heading is fine.

Allowed patterns that look like violations:
- `modules/tags/routes.ts:11-15`: route building the service from app.container

Files with no layering problem:
- `modules/tags/repository.ts`
- `modules/tags/types.ts`
- `adapters/github/octokit.ts`
- `db/schema.ts`

Real non-layering defects (reporting them as non-layering observations is neutral):
- upsert conflict target is the random primary key
- bumpUsage never called
- inconsistent response shapes
- inconsistent response shapes
- inconsistent response shapes
- no transaction on import

PASS if none of the items above is listed as a layering finding. FAIL otherwise.
