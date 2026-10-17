# Compatibility

## Claude Code

**Minimum: 2.1.110.** The plugin uses version-constrained plugin dependencies.
Running the eval suite needs a newer CLI (see below); using the plugin does not.

| Feature used | Where | Minimum version | Status |
|---|---|---|---|
| Plugin `dependencies` with semver ranges, resolved from `<plugin>--v<version>` git tags | `.claude-plugin/plugin.json` | 2.1.110 (lab baseline) | required |
| `agent_type` in `PreToolUse` hook input for subagent tool calls | `scripts/spec-guard.mjs`, `scripts/plan-guard.mjs` | documented; version not stated | documented. Check on 2.1.110 before release. |
| `agent_type` set when an agent runs as the main thread (`claude --agent`) | same guards, for `claude --agent sdd-engineering:spec-creator` | not stated in the docs | verified on 2.1.301. The value is `sdd-engineering:spec-creator`. |
| `${CLAUDE_SKILL_DIR}` substitution in skill content | `skills/workflow-retro/SKILL.md` | not stated in the docs | **verify** on 2.1.110 |
| `${CLAUDE_PLUGIN_ROOT}` in hook commands | `hooks/hooks.json` | before 2.1.110 | required |
| `disable-model-invocation` and `argument-hint` in plugin skills | `/run-plan`, `/workflow-retro` | not stated in the docs | supported per docs |
| Namespaced names in agent `skills:` frontmatter (`engineering-paved-path:onion-architecture`) | `spec-creator`, `implementation-planner`, `architecture-review:architecture-reviewer` | not documented | verified on 2.1.301 for subagents: all 4 of the reviewer's skills were preloaded. **Not preloaded** in main-thread `claude --agent` runs (bare names behave the same), so spec-creator and the planner load them with `Skill` in that mode. |
| `Agent` dispatch of another plugin's agent by namespaced type (`research-tools:researcher`, `architecture-review:architecture-reviewer`) | `spec-creator`, `implementation-planner`, `/run-plan` | documented | required |
| `claude plugin eval` | `evals/` only | 2.1.269 | for maintainers |

Rows marked **verify** must be checked on the minimum version before each
release. If a feature turns out to need a newer version, raise the minimum here
and in the README.

Known platform rule: plugin agents ignore the `hooks`, `mcpServers` and
`permissionMode` frontmatter fields, so this plugin's guards are registered in
`hooks/hooks.json` instead of in agent frontmatter.

## Dependencies

| Plugin | Range | What breaks without it |
|---|---|---|
| `engineering-paved-path` | `^1.0.0` | preloaded architecture skills, skill routing, Mermaid |
| `research-tools` | `^1.0.0` | spec-creator and planner research fan-out |
| `architecture-review` | `^1.0.0` | the `/run-plan` review loop (it also depends on `engineering-paved-path@^1.0.0`; both ranges must resolve to the same tag) |

A major release of a dependency that renames a skill or agent requires a major
release of `sdd-engineering`.

## Runtime

- Node.js 18 or later (hook scripts and `collect.mjs` use ES modules and top-level `await`).
- git.
