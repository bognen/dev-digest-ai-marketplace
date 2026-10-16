# Spec: SDD plugin suite (v1.0.0)

Status: draft · Source: `C:\Projects\Agentic AI\dev-digest\.claude` (DevDigest AI inventory)

## 1. Goal

Extract the DevDigest Spec-Driven Development (SDD) workflow into four marketplace plugins.
Three of them are reusable dependencies. The fourth, `sdd-engineering`, is the workflow itself.
None of them may depend on DevDigest paths, module names or files the plugin does not document.

```
sdd-engineering@1.0.0
├── engineering-paved-path@^1.0.0
├── research-tools@^1.0.0
└── architecture-review@^1.0.0
    └── engineering-paved-path@^1.0.0
```

## 2. Inventory triage

| Group | DevDigest components | Destination |
|---|---|---|
| **Reusable** | agents `spec-creator`, `implementation-planner`, `implementer`, `plan-verifier`, `researcher`, `architecture-reviewer`; skills `run-plan`, `workflow-retro`, `engineering-insights`, `mermaid-diagram`, `onion-architecture`, `frontend-architecture`, `security`, `typescript-expert`, `react-best-practices`, `next-best-practices`, `react-testing-library`, `fastify-best-practices`, `drizzle-orm-patterns`, `postgresql-table-design`, `zod`; hooks `spec-creator-guard`, `planner-guard`; evals `evals/agents/architecture-reviewer`, `evals/workflow/*` | The four plugins (section 3), after the editorial pass (section 5) |
| **Project-specific** | every `CLAUDE.md` / `AGENTS.md` / `INSIGHTS.md`, `specs/`, `docs/plans/`, `pr-self-review` (DevDigest invariants such as the `.js` suffix and module registration), the Phase 4 routing table, `scripts/verify-changed.sh`, `hooks/commit-test-gate.mjs`, `skills-lock.json` | Stays in DevDigest. The plugins read the repo's equivalents through the repo contract (section 4). |
| **Optional integrations** | `.mcp.json` → `devdigest` MCP server, the OpenRouter/LiteLLM eval backend | Not shipped in v1 |
| **Local artifacts** | `settings.local.json`, `scheduled_tasks.lock`, `evals/results/`, `evals/node_modules/`, `__pycache__`, `to_analyze/`, `.devdigest/` | Never copied |
| **Deferred** (reusable, not in v1) | agents `orchestrator`, `brainstorm`, `doc-writer`, `test-writer`, `security-reviewer`; skill `dependency-checker` | Candidates for 1.x minor releases |

## 3. Plugins

### 3.1 `engineering-paved-path`: shared technical skills

This is the only home for technical skills. Agents in other plugins call them by namespace
(`engineering-paved-path:<skill>`) and never copy them.

A skill is included only when a v1 agent or skill uses it. Proposed v1 set:

| Skill (canonical name) | From | Consumer in v1 |
|---|---|---|
| `onion-architecture` | `onion-architecture`, with the DevDigest examples moved into its evals | `implementation-planner`, `architecture-reviewer` (frontmatter `skills:`) |
| `frontend-architecture` | `frontend-architecture` | `implementation-planner`, `architecture-reviewer` |
| `mermaid-diagram` | `mermaid-diagram` | `spec-creator` |
| `security` | `security` | `implementer` (every changed source file) |
| `typescript` | `typescript-expert` | `implementer` (every `*.ts` / `*.tsx`) |
| `react-best-practices`, `next-best-practices`, `react-testing-library` | same | `implementer` through routing; `next-best-practices` is also preloaded by `architecture-reviewer` (RSC boundary) |
| `fastify-best-practices`, `drizzle-orm-patterns`, `postgresql-table-design`, `zod` | same | `implementer` through routing; `fastify-best-practices` is also preloaded by `architecture-reviewer` |

Also included:

- `skills/skill-routing/` is a reference skill that maps file globs and imports to the skills above. It replaces the routing table that lived in `pr-self-review` Phase 4. A repo can override it (section 4). The plugin that owns the skills also owns their routing.
- `evals/` holds the static quality gate for each skill, such as frontmatter and link checks.

> **Decided:** the stack skills (React, Next.js, Fastify, Drizzle, PostgreSQL, Zod) stay in the paved path. Their consumer is the implementer's routing.

### 3.2 `research-tools`: `researcher` agent

- A generic, read-only investigator for the repo or the web. It returns findings with evidence and lists what it could not find.
- Tools: `Read, Grep, Glob, Bash, WebFetch, WebSearch, AskUserQuestion`. Bash is kept for `git log/blame/show`. The prompt keeps it read-only. No hook enforces this, which is documented in SECURITY notes.
- It has no dependencies and no skills.

### 3.3 `architecture-review`: `architecture-reviewer` agent

- Remove the hardcoded checks for `server/` onion layering, `reviewer-core` purity and `@devdigest/*`. The reviewer gets its rules from two places, in this order:
  1. The repo's own architecture docs. The caller passes their paths (`/run-plan` passes `architectureDocs`). Run on its own, the reviewer looks for `ARCHITECTURE.md`, `docs/architecture/**`, `docs/adr/**` and the architecture sections of `CLAUDE.md` / `AGENTS.md`. These docs win when they conflict with the generic rules.
  2. The generic rules in `engineering-paved-path:onion-architecture` and `:frontend-architecture`.
- If no architecture docs are found, it reviews against the generic skills only and says so in the report header.
- Output: evidence-backed findings with a `file:line` for each. It uses `ReportFindings` when that tool is available and a fixed markdown table when it is not. It gives no PASS or BLOCK verdict.
- `evals/` contains the cases ported from `dev-digest/evals/agents/architecture-reviewer`, with fixtures rewritten so that they include no DevDigest names.

### 3.4 `sdd-engineering`: the workflow

```
plugins/sdd-engineering/
├── .claude-plugin/plugin.json      # name, version, dependencies (section 6); no credentials
├── agents/
│   ├── spec-creator.md             # writes Status: draft specs into specsDir
│   ├── implementation-planner.md   # reads an approved spec, writes a plan into plansDir
│   ├── implementer.md              # runs plan steps and loads skills through routing
│   └── plan-verifier.md            # read-only closed-list check, modes: steps | final
├── skills/
│   ├── run-plan/                   # /run-plan dispatcher (manual only)
│   ├── workflow-retro/             # /workflow-retro, includes scripts/collect.mjs
│   └── engineering-insights/       # writes lessons into the configured INSIGHTS files
├── hooks/
│   ├── hooks.json                  # PreToolUse Write|Edit → path guards
│   └── (scripts in scripts/)
├── scripts/
│   ├── spec-guard.mjs              # was spec-creator-guard.mjs
│   └── plan-guard.mjs              # was planner-guard.mjs
├── evals/                          # behavior evals (section 7)
├── README.md                       # how the pieces fit together (section 8)
├── CHANGELOG.md                    # Keep a Changelog, feeds What's New
└── COMPATIBILITY.md                # Claude Code >= 2.1.110 plus any feature-specific minimums
```

How the workflow runs:

```
idea ──► spec-creator ──(human sets Status: approved)──► implementation-planner
          │  fans out research-tools:researcher               │ loads paved-path architecture skills
          ▼                                                    ▼
      <specsDir>/<name>.md                              <plansDir>/<name>-plan.md
                                                               │ (human approves)
                                                               ▼
/run-plan <plan> ─► waves of implementer ─► verify gate ─► plan-verifier (steps)
                 ─► architecture-review:architecture-reviewer ⇄ fix passes ─► plan-verifier (final)
/workflow-retro  ─► metrics from transcripts + one ledger row
engineering-insights ─► invoked at the end of a task or when a gotcha is hit
```

Components in this plugin reference each other by their full names, for example
`sdd-engineering:implementer`. Dependency components always use their namespace:
`research-tools:researcher` (`spec-creator` has the plain `Agent` tool and names `research-tools:researcher` in its prompt, because `Agent(type)` allowlists are ignored inside subagents), and
`architecture-review:architecture-reviewer` (`run-plan`).

## 4. Repo contract (explicit inputs that replace DevDigest assumptions)

The plugins read only the following repo files. Each plugin README must list them.

`.claude/sdd-engineering.json` is optional. Every key has a default:

| Key | Default | Used by |
|---|---|---|
| `specsDir` | `specs/` | spec-creator, spec-guard, implementation-planner |
| `plansDir` | `docs/plans/` (plan files are named `*-plan.md`) | implementation-planner, plan-guard, run-plan |
| `verifyCommand` | none | run-plan gate, implementer, plan-verifier |
| `architectureDocs` | `ARCHITECTURE.md`, `docs/architecture/**` | architecture-reviewer, implementation-planner |
| `skillRouting` | `engineering-paved-path:skill-routing` | implementer |
| `insights` | `INSIGHTS.md` nearest to each changed file, falling back to `./INSIGHTS.md` | engineering-insights, planner, implementer |
| `retroLedger` | `docs/retros/ledger.md` | workflow-retro |

The repo's `CLAUDE.md` and `AGENTS.md` are also read as ordinary project context. No plugin
reads any other file by a hardcoded path.

**When no test or verify command is found:** `run-plan` first uses `--verify "<cmd>"`, then
`verifyCommand`. If neither is set, it asks the user once. If the user gives no command, the
gate is recorded as `UNVERIFIED (no verify command)`, `plan-verifier` reports `CANNOT VERIFY`
for every row that needed it, and the final summary lists it under the gaps. The workflow never
guesses a command such as `npm test`.

## 5. Editorial pass (applies to every copied file)

1. Remove DevDigest names and paths: `server/`, `client/`, `reviewer-core/`, `e2e/`, `mcp-server/`, `@devdigest/*`, `.devdigest`, and `pr-self-review`.
2. Replace assumptions about repo structure with the keys from section 4.
3. Review the tools for each agent: the verifier and reviewer stay read-only, and `implementation-planner` drops `Bash` unless a step needs it. Record why each agent has the tools it has.
4. Replace local references with namespaced ones.
5. Move the guard hooks out of agent frontmatter. Plugin agents do not support `hooks`, `mcpServers` or `permissionMode`. The guards move to `hooks/hooks.json`, and the scripts apply only when the hook input's `agent_type` is the guarded agent. The hooks docs confirm that `agent_type` is present when a subagent makes the tool call. They don't say which version added it, so COMPATIBILITY.md lists it as a feature to verify.
6. Use `"${CLAUDE_PLUGIN_ROOT}"` for files at plugin level and `${CLAUDE_SKILL_DIR}` for skill scripts such as `workflow-retro/scripts/collect.mjs`.
7. Remove duplicated text. Rules live in skills, and agent prompts link to them. For example, the implementer's routing prose becomes a pointer to `skill-routing`.
8. `run-plan`: drop `--security` and the `test-writer` and `security-reviewer` references from v1. List them as "not in this plugin" in the README.

## 6. Manifests

The manifest for `sdd-engineering` follows the brief. The other three manifests have no
`dependencies`, except `architecture-review`, which depends on
`{ "name": "engineering-paved-path", "version": "^1.0.0" }`.

`.claude-plugin/marketplace.json` lists the four entries, sorted by name. Each entry has only
`name`, `source`, `description`, `category` and `tags`. These are required by
`docs/PLUGIN-GUIDELINES.md` and `scripts/validate-marketplace.mjs`. The entries have no `version`
and no component lists, because `plugin.json` is the source of truth.

| Plugin | category | tags |
|---|---|---|
| architecture-review | development | code-review, refactoring |
| engineering-paved-path | development | typescript, javascript, testing, database |
| research-tools | productivity | debugging, docs |
| sdd-engineering | development | code-review, testing, docs |

Version ranges are resolved against git tags. Release the dependencies first, and tag each one
with `claude plugin tag plugins/<p> --push` (`<p>--v1.0.0`). Then release `sdd-engineering`.

## 7. Evals

- **Static:** frontmatter, links, and a scan for leftover DevDigest names. This check is added to `scripts/validate-marketplace.mjs` as a per-plugin denylist rule.
- **Behavior:**
  - spec-creator only writes inside `specsDir` and never edits an approved spec.
  - The planner only writes `*-plan.md`.
  - run-plan acts as section 4 describes when no verify command exists.
  - plan-verifier returns `CANNOT VERIFY` instead of guessing.
  - The reviewer cites `file:line` and respects repo docs over generic rules.
- **Format:** ported from the vitest + Agent SDK harness to `claude plugin eval` suites, so that they run in CI without the DevDigest `evals/` package. Running the evals requires Claude Code 2.1.269 or later. This is for development and CI only; installing the plugins does not need it. *Open: confirm that `claude plugin eval` graders can express the trace assertions used in `evals/workflow/*`.*

## 8. Docs and versioning

- `sdd-engineering/README.md` covers:
  - the workflow diagram from section 3.4
  - the lifecycle of a spec and a plan: `draft → approved → implemented`, where only a human promotes a spec or plan
  - where the files land, using the repo contract
  - the dependency plugins and what each one provides
  - install steps
  - which agents are deferred
- Every plugin has a `README.md` and a `CHANGELOG.md`. `sdd-engineering` also has `COMPATIBILITY.md`, which records:
  - the Claude Code minimum (>= 2.1.110)
  - the dependency ranges
  - the features used, each with the version that introduced it, such as plugin hook input fields, `disable-model-invocation` and `${CLAUDE_SKILL_DIR}`
- The marketplace-wide release process stays in `docs/RELEASES.md`.

## 9. Acceptance

- `claude plugin validate . --strict` finds 4 plugins, and every manifest name matches its marketplace entry.
- `node scripts/validate-marketplace.mjs` passes, including the DevDigest-name scan.
- After a test install, `claude plugin list --json` shows no `dependency-unsatisfied` or `dependency-version-unsatisfied` errors, and no "has conflicting version requirements" or "has no git tag satisfying" messages.
- Every file can be traced to an owner plugin, a consumer scenario and a reason it is versioned with that plugin. An `OWNERSHIP.md` table in each plugin, or a section in its README, records this.
- The plugins read no file outside their own directory, their dependencies, or the repo contract in section 4.

## 10. Open items for the owner

1. Confirm the canonical skill name `typescript` vs. `typescript-expert`. (Decided: `onion-architecture` keeps its name, and the stack skills stay in the paved path.)
2. Upstream repo links and the screenshots you mentioned. These are needed to check licences and attribution for the skills that came from third-party sources (`fastify-best-practices` has a `tile.json`, `zod` has an `AGENTS.md`).
3. Confirm the eval format (section 7).
