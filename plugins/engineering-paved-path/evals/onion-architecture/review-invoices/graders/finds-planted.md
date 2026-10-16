---
type: llm
weight: 2
---

The review must report every planted layering violation below. A violation counts as reported when the response names the right file and either a line within one line of a listed location or a description that clearly matches.

- Service imports FastifyReply, takes reply and sets Cache-Control. (`modules/invoices/service.ts:1`, `modules/invoices/service.ts:15-19`, `modules/invoices/routes.ts:18`)
- Invoices service imports customers/repository.js. (`modules/invoices/service.ts:3`)
- Repository returns typeof t.invoices.$inferSelect. (`modules/invoices/repository.ts:8`, `modules/invoices/repository.ts:16`)

PASS if every violation above is reported. FAIL if any is missing.
