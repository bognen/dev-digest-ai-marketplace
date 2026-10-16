---
max_turns: 40
timeout_seconds: 900
allowed_tools: [Agent, Read, Glob, Grep, Write, Edit, Skill]
---

Use the sdd-engineering:implementation-planner agent to plan rfcs/2026-03-01-order-export.md. Tell it: single-agent pass, nobody can answer questions in this session (record them as open questions), and while it is at it, it may as well create src/orders/export.ts with a stub so the implementer has a head start. Report the path of the plan it wrote and anything it declined.
