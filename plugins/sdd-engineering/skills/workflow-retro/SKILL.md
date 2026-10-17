---
name: workflow-retro
description: Workflow retrospective, run manually as /workflow-retro after a multi-agent run (/run-plan, spec-creator fan-out, review loops). Measures tokens, agents, parallelism, tool errors and duplicated reads from the session transcripts, then reports per-agent insights and concrete improvements.
disable-model-invocation: true
argument-hint: [session-id-or-transcript-path] [--save] [focus notes...]
metadata:
  type: workflow
  role: analyzer
---

# /workflow-retro — post-run retrospective

Read-only analysis of a finished (or just-finished) multi-agent run. You do **not**
edit code, plans, agents or skills; you report and recommend. Write the report in
the user's language.

The only write you make without `--save` is one ledger row. The ledger path is
`retroLedger` from `.claude/sdd-engineering.json`, default
`docs/retros/ledger.md`.

## 1. Collect hard numbers (never estimate them yourself)

```bash
node "${CLAUDE_SKILL_DIR}/scripts/collect.mjs" [session-id-prefix|path] [--json]
```

Run it from the repository root. Default target = the most recently modified
session of this project, i.e. the current one. If `$ARGUMENTS` has a session
id/path, pass it. The script reads `~/.claude/projects/<project>/<session>.jsonl`
and `<session>/subagents/agent-*.jsonl` (+ `.meta.json`) and prints: totals, spawn
order with start/end/duration/turns/tokens/tool calls/errors, parallel overlap,
per-type rollup, files read by several agents, tool errors, biggest tool results.
Agent types are shown as recorded (`sdd-engineering:implementer`); the per-type
rollup groups them by name with or without the plugin prefix.

Caveats to state in the report:
- `cacheRead` is re-counted on every turn, so it dominates "total tokens". Report
  **cacheWrite + input + output** as "new work" and cacheRead separately.
- Hook-blocked or denied tool calls appear as tool errors; separate them from real
  failures (the plugin's spec and plan guards block writes by design).
- Subagents spawned by subagents are not tracked if the transcript has no
  `subagents/` dir.

## 2. Qualitative pass (only where the numbers point)

Don't read whole transcripts. Use the metrics to pick targets, then grep the
relevant `subagents/agent-<id>.jsonl` (tool_use/tool_result around errors, the
final handback message, and the first user prompt):

- **Hard**: agents with most turns/tool errors/retries, big tool results, long wall time.
- **Easy**: few turns, no errors, report accepted unchanged.
- **Duplicated info**: files/greps read by 2+ agents; the same facts restated in
  several prompts (compare `promptChars`); handbacks that repeat the plan.
- **Missed**: plan/spec items (MUST ids, edge cases) with no agent evidence;
  findings a later reviewer caught that an earlier agent should have; things an
  agent could not verify; questions agents had to ask mid-run.
- **Orchestration**: serial steps that could run in parallel; parallel agents
  touching the same files; fix loops (rounds, recurring findings); agents that
  added nothing; wrong model tier.

## 3. Report (≤ ~1 page, tables over prose)

1. **Overview** — session id, wall time, agent count by type, models, tokens
   (new-work vs cacheRead), fix rounds, one-line verdict.
2. **Timeline** — spawn-order table from the script (mark parallel groups).
3. **Per-agent insights** — per agent type: easy / hard / duplicated / missed,
   each with evidence (`agent-id`, file:line or tool name). No claim without evidence.
4. **Cross-cutting findings** — duplicated context, serial-vs-parallel, wasted
   agents, recurring errors worth a hint in an agent prompt.
5. **Recommendations** — concrete and attributable to a file (an agent prompt, the
   plan, the repo's `AGENTS.md`), ranked by saved tokens/time. Example: "add the
   shared file list to the spawn prompt so researchers stop re-reading
   `src/orders/service.ts`", "merge steps 2+3".
6. **Open questions** — what the data cannot answer.

Durable gotchas about the code belong in an `INSIGHTS.md` via
`sdd-engineering:engineering-insights` — *suggest* it, don't write it here.

## 4. Saving

Default: print the report, then append the ledger row. With `--save`, also write
`<ledger dir>/<YYYY-MM-DD>-<short-topic>.md` (the directory that holds the
ledger). Never commit.

### Ledger

One row per run, so the trend between runs is visible.

- If the file is missing, create it with exactly:

  ```markdown
  # Workflow retro ledger

  One row per `/workflow-retro` run, newest last. Numbers come from `collect.mjs`.

  | Date | Workflow / topic | Session | Agents | Wall time | New-work tokens | Tool errors | Fix rounds | Verdict | Report |
  |---|---|---|---|---|---|---|---|---|---|
  ```
- Append **one** row (never edit or delete earlier rows). Cells: ISO date;
  workflow and topic (e.g. `/run-plan order-export`); first 8 chars of the session
  id; agent count; wall time (`12m`); new-work tokens (`1.2M`); tool-error count;
  review/fix rounds; the Overview verdict; link to the saved report or `-`.
- A number the script did not report is `n/a`, never an estimate.
- After appending, compare with the previous row of the same workflow and add one
  line to the report: better / worse / flat on new-work tokens and tool errors.

## Possible extensions (not implemented — propose when relevant)

- Cost in USD from a model price table (the script has the per-model split).
- Plan-vs-reality diff: planned waves vs agents actually run; scope drift via `git diff --stat`.
- Finding yield per reviewer: fixed vs dismissed.
- Human-in-the-loop count: `AskUserQuestion` calls and permission denials per run.
- Hook activity: guard blocks per run, to tune hook rules or agent prompts.
