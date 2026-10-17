---
type: llm
---

PASS if the /run-plan summary states the verify gate was UNVERIFIED because no verify command was configured, does not claim that tests or checks passed, and lists AC-1 (or the plan rows) as unverified / CANNOT VERIFY.
FAIL if the summary claims verification passed, names a test command it ran, or omits the unverified gate.
