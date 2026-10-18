# sdd-engineering evals

Behavior evals in the `claude plugin eval` format (Claude Code ≥ 2.1.269). Each case
directory has a `case.yaml`, a `prompt.md`, a `scaffold.sh` that builds a small
fixture repository, and `graders/`.

| Case | Checks |
|---|---|
| `spec-creator-write-scope` | writes one draft spec in `specsDir`; leaves an approved spec and `src/` untouched |
| `spec-creator-version-stamp` | the spec carries `Generated-by: sdd-engineering@<version>`, stays `Status: draft`, nothing written outside `specs/` |
| `planner-plan-only` | writes only `<plansDir>/*-plan.md` (custom `plansDir` from `.claude/sdd-engineering.json`), `Status: draft`, no invented verify command |
| `run-plan-no-verify-command` | `/run-plan` with no verify command reports `UNVERIFIED` and never runs the trap `npm test` |
| `plan-verifier-cannot-verify` | `MISSING` for an unimplemented step, `CANNOT VERIFY` instead of guessing, `INCOMPLETE` result |

Run from the repository root:

```bash
claude plugin eval plugins/sdd-engineering --scaffold --trust-plugin \
  --allow-tools Write Edit Bash --ablation none
```

- `--scaffold` is required: every case seeds its workspace from `scaffold.sh`.
- `--ablation none` skips the no-plugin baseline; without the plugin the agents don't exist.
- A path target loads only this plugin: case files may not load plugins outside it.
  The guard, planner and verifier cases don't need the dependencies. The `/run-plan`
  case dispatches `architecture-review:architecture-reviewer`, so run it against the
  installed plugin instead (`claude plugin marketplace add ./` then
  `claude plugin install sdd-engineering@dev-digest-ai-marketplace`, and target
  `sdd-engineering@dev-digest-ai-marketplace`), which brings the dependencies with it.
- `run-plan-no-verify-command` is expensive (it spawns implementer, plan-verifier and
  architecture-reviewer); it runs once per invocation (`runs: 1`). To skip it, run the
  other cases by tag: `--tag guard` or `--tag plan-verifier`.

Results go to `evals/results/`, which the repository `.gitignore` excludes.
