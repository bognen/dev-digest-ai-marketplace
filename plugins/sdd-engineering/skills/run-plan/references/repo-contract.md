# Repo contract — `.claude/sdd-engineering.json`

The only repository file `sdd-engineering` reads by a fixed path. It is optional;
every key has a default. Apart from it, agents read the repo's `CLAUDE.md` /
`AGENTS.md` as normal project context, and whatever files the user or the plan
points them at.

| Key | Type | Default | Read by |
|---|---|---|---|
| `specsDir` | string | `specs/` | spec-creator, spec guard hook, implementation-planner |
| `plansDir` | string | `docs/plans/` (files named `*-plan.md`) | implementation-planner, plan guard hook, /run-plan |
| `verifyCommand` | string | none | /run-plan, implementer, plan-verifier |
| `architectureDocs` | string[] | `["ARCHITECTURE.md", "docs/architecture/**"]` | implementation-planner, /run-plan → architecture-reviewer |
| `skillRouting` | string | `engineering-paved-path:skill-routing` | implementation-planner, implementer |
| `insights` | string \| string[] | nearest `INSIGHTS.md` to the changed files, else `./INSIGHTS.md` | engineering-insights, implementation-planner |
| `retroLedger` | string | `docs/retros/ledger.md` | /workflow-retro |

Paths are relative to the repository root and use forward slashes.

```json
{
  "specsDir": "specs/",
  "plansDir": "docs/plans/",
  "verifyCommand": "npm run typecheck && npm test -- --changed",
  "architectureDocs": ["ARCHITECTURE.md", "docs/architecture/**"],
  "skillRouting": "engineering-paved-path:skill-routing",
  "insights": ["apps/web/INSIGHTS.md", "services/api/INSIGHTS.md"],
  "retroLedger": "docs/retros/ledger.md"
}
```

## No verify command

`/run-plan` resolves the command as `--verify` → `verifyCommand` → ask the user
once. With none, the gate is recorded as `UNVERIFIED (no verify command)`, the
implementer reports the same, `plan-verifier` marks every row that needed a check
`CANNOT VERIFY`, and the final report lists it. No component guesses a command.
