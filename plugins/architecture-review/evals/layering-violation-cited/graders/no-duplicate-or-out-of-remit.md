---
type: llm
---

PASS if the `FastifyReply` import and the `reply?: FastifyReply` parameter are reported as ONE finding (not two), and there is no finding about naming, style, unused parameters, security or test coverage. Mentioning those under "Not reviewed" is fine.
FAIL if the reply parameter gets its own finding, or if any finding is about something other than an architectural boundary.
