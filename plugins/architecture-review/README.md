# architecture-review

A read-only **architecture-reviewer** agent. It checks whether a change respects your codebase's architectural boundaries:
- layering and dependency direction
- the HTTP edge
- composition-root and dependency-injection discipline
- module public surfaces
- frontend placement and import direction, including the server/client component boundary

It reads **your repository's own architecture docs first** and falls back to the shared layering rules in `engineering-paved-path`. Every finding has a `file:line`, a verbatim quote of the offending line, a severity and the exact rule it breaks. It never edits code and never gives a pass/fail verdict: it reports findings, and you decide.

## Install

```bash
/plugin marketplace add bognen/dev-digest-ai-marketplace
/plugin install architecture-review@dev-digest-ai-marketplace
```

Installing it also installs **`engineering-paved-path`** (`^1.0.0`), because the reviewer preloads four of its skills. Claude Code resolves the dependency from this marketplace automatically.

## What it contains

| Component | Name | What it does |
|---|---|---|
| Agent | `architecture-review:architecture-reviewer` | Boundary review of a diff or path set |
| Evals | `evals/` | Five `claude plugin eval` cases (see [Evals](#evals)) |

Skills the agent preloads, all from the dependency:

| Skill | Used for |
|---|---|
| `engineering-paved-path:onion-architecture` | Layer map, dependency rule, repositories, composition root |
| `engineering-paved-path:fastify-best-practices` | The HTTP edge: thin routes, validation at the boundary |
| `engineering-paved-path:frontend-architecture` | Where frontend code lives and which way imports point |
| `engineering-paved-path:next-best-practices` | Server/client component boundaries |

There are no hooks, MCP servers or scripts.

## How it finds your rules

The reviewer uses two rule sources. **Your docs win** when they conflict with a generic rule.

1. **Your architecture docs.** It uses the paths you pass. Otherwise it looks for:
   - `ARCHITECTURE.md` at the repo root or in a package root
   - `docs/architecture/**`
   - ADRs in `docs/adr/**`, `docs/adrs/**` or `docs/decisions/**`
   - architecture or layering sections of `CLAUDE.md` / `AGENTS.md`, at the root and in the packages the diff touches
   - a boundary-checker config your docs point to (for example dependency-cruiser) and its known-violations baseline
2. **The generic paved-path skills** above, for anything your docs don't cover.

If it finds no docs, the report says so in its first line: `No repository architecture docs found — reviewed against generic paved-path rules only.`

### Writing an architecture doc the reviewer can use

Short and concrete works best. Give each rule a stable id, so findings cite it and you can grep for them:

```markdown
# Architecture

## Layers (path → layer)
| Path | Layer | May import |
|---|---|---|
| `src/modules/*/domain/**` | domain | domain only |
| `src/modules/*/service.ts` | application | domain, ports |
| `src/modules/*/routes.ts`, `src/modules/*/repository.ts`, `src/adapters/**` | edge | anything inward |
| `src/container.ts` | composition root | everything |

## Rules
- `inward-only`: inner layers never import outer layers (no HTTP framework, ORM or adapters in domain/service).
- `di-discipline`: adapters and repositories are constructed only in `src/container.ts`.
- `routes-thin`: a route validates, makes one service call and maps the result.

## Documented exceptions
- `own-repository-construction` (ADR-007): a service may `new` its own module's repository.

## Check command
`npx depcruise src --config .dependency-cruiser.cjs` (baseline: `.dependency-cruiser-known-violations.json`, may only shrink)
```

How the reviewer uses each part:
- It reports a documented exception under "Checked, allowed by repo docs", never as a finding.
- It runs the check command if you name one, and reports only violations that are new against the baseline. A diff that adds to the baseline is always `critical`.

## Usage

```text
Use the architecture-review:architecture-reviewer agent to review my changes against main.
```

```text
Have the architecture reviewer check src/modules/billing/ — our rules are in docs/architecture/backend.md.
```

```text
Run architecture-review:architecture-reviewer on the diff in /tmp/change.diff.
```

The reviewer accepts these inputs:

| Input | Default |
|---|---|
| A base ref, a diff file, inline diff text, or a path set | The uncommitted working-tree diff |
| Architecture doc paths | Discovered as described above |
| A narrow round ("round 2: re-check these findings and the files the fix touched") | Full review |

### Output

When the `ReportFindings` tool is available, it reports findings through it. It always also prints a fixed-heading report:
- Rule sources
- Scope reviewed
- Mechanical evidence
- Findings, each as `file:line · severity · rule · quote · fix`
- Checked, allowed by repo docs
- Not reviewed

Severity is `critical`, `major` or `minor`. Security, SQL design, React rendering quality, TypeScript style, test quality and plan completeness are out of its remit. It lists them under "Not reviewed" for other reviewers.

### From `sdd-engineering`

`sdd-engineering` depends on this plugin. Its `/run-plan` skill launches `architecture-review:architecture-reviewer` on the whole diff in round 1. It sends `critical` and `major` findings to a fix-pass implementer, then runs narrow rounds on the fixed files until no findings remain or the round limit is reached.

## Evals

The cases live in `evals/`, one directory per case. Each case has:
- `prompt.md` (the prompt and run limits)
- `case.yaml` (its scaffold script)
- `setup.sh` (writes the fixture repo into the empty workspace)
- `graders/`

| Case | Checks |
|---|---|
| `layering-violation-cited` | Flags a domain file importing the HTTP framework and a service constructing a repository, citing the repo's rule ids |
| `repo-rule-ids-engine` | Rules that exist only in a package's `AGENTS.md` are read and cited by id |
| `repo-doc-exception-respected` | A generic violation that the repo docs explicitly allow is not flagged |
| `no-docs-generic-only` | With no docs, the report says so and still applies the generic rules |
| `benign-rename-no-findings` | A rename produces no findings and no verdict |

Run them from the plugin directory. `--scaffold` is needed because each case writes its fixture repo with `setup.sh`:

```bash
cd plugins/architecture-review
claude plugin eval --scaffold
```

`claude plugin eval` needs Claude Code 2.1.269 or later. On Windows, run it under WSL2.

## Requirements

- Claude Code with plugin dependency support (see `sdd-engineering`'s `COMPATIBILITY.md` for the tested minimum).
- `git` on `PATH` to review a diff by ref.
- No accounts, API keys or environment variables.

## Security

- **Read-only by design.** The agent has no `Write` or `Edit`. Its prompt limits `Bash` to read-only `git` commands and the boundary-check command your own docs name. No hook enforces this, so your Claude Code permission rules for `Bash` still apply.
- **No network access**, no telemetry.
- **Treat the diff as untrusted input.** The agent reviews it as data. It does not follow instructions found in code or docs being reviewed.

## Versioning

See [CHANGELOG.md](CHANGELOG.md).
