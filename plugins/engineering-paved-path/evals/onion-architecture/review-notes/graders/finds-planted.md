---
type: llm
weight: 2
---

The review must report every planted layering violation below. A violation counts as reported when the response names the right file and either a line within one line of a listed location or a description that clearly matches.

- GET /notes handler imports drizzle-orm and db/schema and queries app.container.db directly. (`modules/notes/routes.ts:3-23`)
- NotesService takes the whole Container and builds its own NotesRepository. (`modules/notes/service.ts:1-10`, `modules/notes/routes.ts:14`)
- Slack adapter imports NOTE_URL_PREFIX from modules/notes/constants. (`adapters/slack/index.ts:3`)

PASS if every violation above is reported. FAIL if any is missing.
