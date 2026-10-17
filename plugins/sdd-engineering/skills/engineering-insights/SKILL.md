---
name: engineering-insights
description: Captures durable engineering lessons (gotchas, dead ends, hard-won decisions) into the INSIGHTS.md file nearest the code they concern, so the next session doesn't rediscover them. Invoke when a coding task finishes, and immediately when you hit a non-obvious bug, dead end or non-default decision.
---

# Engineering Insights

Keep each area's `INSIGHTS.md` a living record of non-obvious lessons — a
distillation, not a session transcript.

## Anti-banality test
Before writing an entry, ask: "Would this be obvious to anyone reading the
code?" If yes, skip it.
- Bad: "Promises can be tricky." Good: "`Promise.all()` on the ingestion
  pipeline times out after 30 elements — use `Promise.allSettled()` in
  batches of 10 (`src/ingest.ts:42`)."
- Bad: "Be careful with async." Good: "Checkout state always goes through
  Zustand (`cartStore.ts`) because the cart is shared by 3 components."

## Target sections (append to the matching one)
1. **What Works** — approaches/patterns that succeeded.
2. **What Doesn't Work** — dead ends, antipatterns.
3. **Codebase Patterns** — conventions, architectural decisions.
4. **Tool & Library Notes** — dependency/tooling quirks.
5. **Recurring Errors & Fixes** — errors seen more than once, and the fix.
6. **Session Notes** — datestamped session summaries.
7. **Open Questions** — unresolved items.

## Entry format
`### YYYY-MM-DD — <Title>` under the matching section, newest first within
that section. Body: 1-4 sentences — the essence + evidence (`file:line`,
commit, or PR) where applicable. Must be actionable to a reader with zero
session context.

## Which file
1. If `.claude/sdd-engineering.json` has an `insights` key, use it: a single path,
   or a list of paths — pick the one whose directory contains the code the lesson
   is about (the deepest match).
2. Otherwise, walk up from the changed file(s) the lesson concerns to the
   repository root and use the first `INSIGHTS.md` found.
3. If none exists, use `./INSIGHTS.md` at the repository root.

Write each insight to exactly one file. A lesson that spans areas goes to the
file of their nearest common directory.

## Rules
- **Append-only.** Never edit or delete a past entry, even a stale one — add
  a new dated entry that corrects it instead.
- **Insert, don't rewrite.** Add the entry with a targeted edit directly under the
  matching section heading. Never regenerate the whole file. If the file doesn't
  exist yet, create it with only the 7-section skeleton, empty.
- **Skip if nothing insight-worthy happened.** Zero entries is a fine outcome.
- **Not a substitute for fixing root causes.** If the same mistake recurs
  because of bad tooling or docs, fix those — don't just re-log it.
- **One writer.** When several agents run in parallel (for example under
  `/run-plan`), they list insights in their reports and the coordinating session
  writes them once.

## Triggers
- **Capture-as-you-go**: the moment you hit a non-obvious bug, dead end, or
  make a non-default decision, add the entry — don't wait to be asked.
- **End-of-task wrap-up**: when the user says "wrap up" / "update insights", or a
  task is ending, review what happened and log what passes the test above.
