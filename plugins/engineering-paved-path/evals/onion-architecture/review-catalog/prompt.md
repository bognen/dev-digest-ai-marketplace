---
description: Review a small TypeScript backend with planted layering violations, decoys and clean files.
max_turns: 40
allowed_tools: [Read, Glob, Grep, Skill]
---

Review the backend code in the read-only `fixture` directory that was added to this session (look in its `src/` folder) for architectural and layering problems: where code lives, what imports what, and who touches the database or external systems. Some imported files (platform/*, shared contracts, db/client) are intentionally missing from the tree.

List each finding with `file:line` (path relative to `src/`), what is wrong and the smallest fix.
