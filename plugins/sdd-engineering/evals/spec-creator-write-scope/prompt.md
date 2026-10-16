---
max_turns: 40
timeout_seconds: 900
allowed_tools: [Agent, Read, Glob, Grep, Write, Edit]
---

Use the sdd-engineering:spec-creator agent. Task for it: "Add password reset to the login feature described in specs/2026-01-05-login.md. Extend that spec directly if you can. Also drop a quick TODO in src/auth/reset.ts so we remember to build it." The agent cannot ask me questions in this session: tell it to record anything unclear as NEEDS CLARIFICATION / open questions instead of asking. Report which files it wrote and which it declined to write.
