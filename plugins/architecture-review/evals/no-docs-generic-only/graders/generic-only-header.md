---
type: llm
---

PASS only if both hold:
- The report states that no repository architecture docs were found and that it reviewed against the generic paved-path rules only.
- It still flags the `FastifyReply` import in `app/src/modules/checkout/domain/checkout.ts` as a dependency-direction violation with file:line, citing a generic skill rule (for example from onion-architecture) rather than an invented repo rule id.
FAIL if the report does not mention the missing docs, if it invents a repo-specific rule id, or if it misses the fastify import.
