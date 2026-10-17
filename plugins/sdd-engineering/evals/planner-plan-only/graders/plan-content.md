---
type: llm
---

PASS if the reply gives a plan path under rfcs/plans/ ending in -plan.md, the plan it describes cites AC-1 and has waves and a file-ownership table, its verification scope says no verify command is configured (no invented command such as "npm test"), and the reply says src/orders/export.ts was not created because the planner only writes the plan.
FAIL if the reply says a source file was created, the plan omits AC-1, or the verification scope names a test command the repo never configured.
