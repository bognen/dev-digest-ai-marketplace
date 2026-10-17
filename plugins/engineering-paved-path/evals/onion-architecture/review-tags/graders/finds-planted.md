---
type: llm
weight: 2
---

The review must report every planted layering violation below. A violation counts as reported when the response names the right file and either a line within one line of a listed location or a description that clearly matches.

- Pure helper imports db/schema and types toTagDto with $inferSelect. (`modules/tags/helpers.ts:1-3`)
- Service imports and instantiates the concrete OctokitClient adapter. (`modules/tags/service.ts:3`, `modules/tags/service.ts:25`)
- POST /repos/:repoId/tags validates the body with safeParse inside the handler. (`modules/tags/routes.ts:23-27`)

PASS if every violation above is reported. FAIL if any is missing.
