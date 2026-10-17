---
type: llm
weight: 2
---

The review must report every planted layering violation below. A violation counts as reported when the response names the right file and either a line within one line of a listed location or a description that clearly matches.

- helpers.ts (ring 1) imports PROJECT_PAGE_LIMIT from service.ts (ring 3), and service.ts imports helpers.ts: a cycle. (`modules/projects/helpers.ts:1-6`, `modules/projects/service.ts:5`, `modules/projects/service.ts:9`)
- platform/jobs.ts imports modules/projects/repository. (`platform/jobs.ts:3`, `platform/jobs.ts:9-12`)
- ProjectsService imports Db from db/client and opens db.transaction itself. (`modules/projects/service.ts:1`, `modules/projects/service.ts:14`, `modules/projects/service.ts:41-44`, `modules/projects/routes.ts:14`)
- GET /projects/:id/progress computes counts, percentage and health inline in the handler. (`modules/projects/routes.ts:24-33`)
- sync/service.ts does await import('../projects/service.js'). (`modules/sync/service.ts:17`)

PASS if every violation above is reported. FAIL if any is missing.
