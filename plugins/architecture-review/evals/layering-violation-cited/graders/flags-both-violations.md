---
type: llm
---

PASS only if all of these hold:
- It flags `app/src/modules/checkout/domain/checkout.ts` importing `FastifyReply` from "fastify" as a dependency-direction violation, citing the rule id `inward-only-dependencies` and a line number.
- It flags `new PgCheckoutRepository()` in `app/src/modules/checkout/service.ts` as a DI violation, citing the rule id `di-discipline` and a line number.
- Each finding has a severity (critical, major or minor) and quotes the offending line verbatim.
FAIL if either violation is missing, if a finding has no rule id from ARCHITECTURE.md, or if a finding has no file:line.
