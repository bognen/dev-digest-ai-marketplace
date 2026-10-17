# Cost baseline: sdd-engineering

What one run of the SDD workflow costs, how good it is, and whether a change made it cheaper without making it worse.

**Status: method ready, not measured yet.** The tables below fill in from `docs/cost/<label>.json` once the scenario has run.

## Scenario

The scenario is fixed in [`scripts/cost/scenario.json`](../scripts/cost/scenario.json). Change it only together with a new baseline; numbers from different scenarios are not comparable.

| | |
|---|---|
| Plugin | `plugins/sdd-engineering` (version and commit SHA are recorded per measurement) |
| Evaluation set | The plugin's four eval cases: `spec-creator-write-scope`, `planner-plan-only`, `run-plan-no-verify-command`, `plan-verifier-cannot-verify` |
| Runs | 3 per case, 12 per measurement |
| Model | Main session `claude-sonnet-5-5` (`--model`). Subagents keep the model in their frontmatter: `spec-creator` and `implementation-planner` on `opus`, `implementer` and `plan-verifier` on `sonnet`. The models each run actually used are recorded from its trace. |
| Grading | The cases' own graders; LLM graders on the default judge model. Judge cost is reported separately and is not part of the workflow cost. |

Together the cases cover each stage of the workflow: spec, plan, `/run-plan` with its verify gate, and final verification.

## What is measured

Per run, from the `claude plugin eval --json` result and the run's stream-json trace:

| Metric | Source |
|---|---|
| Input, output, cache-read and cache-write tokens | Trace `result.modelUsage`, summed across models (subagents included) |
| API calls | Distinct assistant message ids in the trace |
| Tool calls | `tool_use` blocks in the trace, also counted per tool |
| Cost | Trace `result.total_cost_usd`: the agent's cost at list price, without judge calls |
| Latency | Trace `result.duration_ms` |
| Pass | The run's `passed`, and no `error` |
| Critical errors | A failed critical grader (table below), or a run that ended with an error |

Reported per case and for the whole scenario: median cost, median latency, median tokens and calls, pass rate, and **cost per successful workflow** (all agent cost divided by passing runs).

### Critical graders

A critical grader checks a safety or honesty property. Its failure is a **critical false negative**: the workflow did something it must never do, whatever the score.

| Case | Critical graders | What they protect |
|---|---|---|
| `spec-creator-write-scope` | `approved-spec-untouched`, `nothing-outside-specs` | spec-creator never edits an approved spec or writes outside `specsDir` |
| `planner-plan-only` | `no-code-or-other-files`, `plan-is-draft` | the planner writes only a draft `*-plan.md` |
| `run-plan-no-verify-command` | `trap-not-run`, `no-guessed-test-command` | `/run-plan` never guesses a verify command |
| `plan-verifier-cannot-verify` | `no-guessed-test-command` | plan-verifier reports `CANNOT VERIFY` instead of guessing |

## Quality gate

An optimization is accepted only when all of these hold:

1. No run errored in either measurement (an errored measurement is rerun, not compared).
2. The pass rate is not lower than the baseline.
3. No critical grader fails after the change that did not fail before.
4. Cost or latency is lower **beyond noise**: the 95% bootstrap interval of the difference in medians lies entirely below 0.

When 1–3 pass and 4 does not, the result is recorded as **no saving beyond noise**. A smaller median inside the noise is not a saving.

## How to run it

The cases grant Bash, and `claude plugin eval` refuses to run a shell tool it cannot sandbox. On Windows this means WSL2. One-time setup inside WSL:

```bash
sudo apt install -y bubblewrap socat nodejs
claude            # log in once
```

Then, from a clone of this repo:

```bash
scripts/cost/run-scenario.sh baseline                     # writes docs/cost/baseline.json
# make the one change, commit it, then:
scripts/cost/run-scenario.sh optimized                    # writes docs/cost/optimized.json
node scripts/cost/measure.mjs compare docs/cost/baseline.json docs/cost/optimized.json
```

Each measurement is 12 real agent runs on your credential. `MAX_COST_USD` (default 25) caps each case's eval call. Commit the plugin before measuring: the record stores the commit SHA, and flags uncommitted changes in the plugin.

## Baseline

_Not measured yet._ Paste the summary that `run-scenario.sh baseline` prints:

- Plugin and commit:
- Claude Code version:
- Models used:

| Case | Runs | Pass rate | Median cost | Cost per success | Median latency | Input | Output | Cache read | Cache write | API calls | Tool calls | Critical failures |
|---|---|---|---|---|---|---|---|---|---|---|---|---|

## Optimization

_Not chosen yet._ The candidate is to remove instructions that the agent prompts repeat and move those details into skill references that load only when needed. Change only that. Keep the models and the skill routing as they are, so that any difference can be attributed to the change.

- Change:
- Commit:
- Expected effect: fewer input and cache tokens per run.

## After the optimization

_Not measured yet._ Paste the output of `measure.mjs compare`.

## Result

_Not measured yet._ One of: **success**, **no saving beyond noise**, **failed quality gate**, with the numbers that decide it.
