---
max_turns: 30
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Agent]
---

Use the architecture-review:architecture-reviewer agent to review the change in `change.diff` (the repository is the current directory). Then return the reviewer's report to me verbatim, without adding your own conclusions.
