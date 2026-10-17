# engineering-paved-path

Shared technical skills for TypeScript web stacks: backend and frontend architecture, security, TypeScript, React, Next.js, Fastify, Drizzle, PostgreSQL, Zod and Mermaid. It also includes a routing table that maps changed files to the skills that govern them. This plugin is the **only home** for these skills in the marketplace. Other plugins depend on it and call its skills by namespace instead of copying them.

## Install

```bash
/plugin install engineering-paved-path@dev-digest-ai-marketplace
```

You rarely need to install it by hand: `architecture-review` and `sdd-engineering` declare it as a dependency, so installing either one pulls it in.

## Updates

Auto-update is off for this marketplace until you turn it on: `/plugin` → **Marketplaces** → `dev-digest-ai-marketplace` → **Enable auto-update**. It does not run at startup. In an interactive session, after your first message, Claude Code waits a random delay of up to ten minutes, refreshes the marketplace and updates any plugin whose `plugin.json` version changed. It then shows `Plugin updated: engineering-paved-path · Run /reload-plugins to apply`.

To update straight away instead, run this from your shell:

```bash
claude plugin marketplace update dev-digest-ai-marketplace
claude plugin update engineering-paved-path@dev-digest-ai-marketplace
```

## What it contains

Skills only. There are no agents, hooks, MCP servers or network calls.

| Skill | Scope | Used by |
|---|---|---|
| [`onion-architecture`](skills/onion-architecture/SKILL.md) | Backend layering: the dependency rule, ring map, ports and adapters, repositories and mappers, `Deps` wiring, review sweep, optional dependency-cruiser setup | `implementation-planner`, `architecture-reviewer` (preloaded); `implementer` (routed) |
| [`frontend-architecture`](skills/frontend-architecture/SKILL.md) | Where code lives in a React + Next.js App Router app: thin pages, colocated `_components/`, shared components, hooks, constants, tests | `implementation-planner`, `architecture-reviewer` (preloaded); `implementer` (routed) |
| [`mermaid-diagram`](skills/mermaid-diagram/SKILL.md) | Mermaid diagrams in markdown (flowcharts, sequence, ERD, state) | `spec-creator` (preloaded) |
| [`skill-routing`](skills/skill-routing/SKILL.md) | Lookup table: changed file → skills, by glob and import signal | `implementer` |
| [`security`](skills/security/SKILL.md) | OWASP Top 10:2025, auth, injection, uploads, secrets | `implementer` (every source file) |
| [`typescript-expert`](skills/typescript-expert/SKILL.md) | Type-level programming, performance, tooling, migrations | `implementer` (every `.ts` / `.tsx`) |
| [`react-best-practices`](skills/react-best-practices/SKILL.md) | React anti-patterns, state management, hooks rules | `implementer` (routed) |
| [`next-best-practices`](skills/next-best-practices/SKILL.md) | Next.js App Router, RSC boundaries, data fetching, optimization | `implementer` (routed); `architecture-reviewer` (preloaded) |
| [`react-testing-library`](skills/react-testing-library/SKILL.md) | React Testing Library with Vitest | `implementer` (routed) |
| [`fastify-best-practices`](skills/fastify-best-practices/SKILL.md) | Fastify routes, plugins, schema validation, error handling | `implementer` (routed); `architecture-reviewer` (preloaded) |
| [`drizzle-orm-patterns`](skills/drizzle-orm-patterns/SKILL.md) | Drizzle schema, queries, relations, transactions, migrations | `implementer` (routed) |
| [`postgresql-table-design`](skills/postgresql-table-design/SKILL.md) | PostgreSQL schema design, data types, indexing, constraints | `implementer` (routed) |
| [`zod`](skills/zod/SKILL.md) | Zod validation, parsing, error handling, type inference | `implementer` (routed) |

"Preloaded" means the agent lists the skill in its `skills:` frontmatter. "Routed" means the agent loads it on demand when a changed file matches a row in `skill-routing`. Every skill also works on its own: Claude loads it when your request matches its description.

## Using the skills from another plugin

Reference skills by their namespaced name:

```yaml
# agents/my-reviewer.md in a plugin that depends on engineering-paved-path
skills:
  - engineering-paved-path:onion-architecture
  - engineering-paved-path:frontend-architecture
```

Declare the dependency in that plugin's `.claude-plugin/plugin.json`:

```json
"dependencies": [{ "name": "engineering-paved-path", "version": "^1.0.0" }]
```

## Adapting it to your repository

The architecture skills describe a **reference layout**. They never assume your paths. Your repository adapts them in two ways:

1. **Architecture docs.** `onion-architecture` and `frontend-architecture` read `ARCHITECTURE.md`, `docs/architecture/**` and the package's `AGENTS.md` / `CLAUDE.md` first. Whatever those say about paths, ports, enforcement commands and accepted compromises overrides the reference layout.
2. **Routing.** `skill-routing` maps files to skills by common globs and import signals. To replace the table, create `.claude/sdd-engineering.json` with `{ "skillRouting": "docs/skill-routing.md" }` and write your own table there. To add rows instead, put them in your architecture docs.

Example `.claude/sdd-engineering.json` keys this plugin reads:

```json
{
  "architectureDocs": ["ARCHITECTURE.md", "docs/architecture/**"],
  "skillRouting": "docs/skill-routing.md"
}
```

## Requirements

- Claude Code 2.1.110 or later.
- `onion-architecture`'s layer scanner needs Node.js 18+ and is run as `node "${CLAUDE_SKILL_DIR}/scripts/scan-layers.mjs" <src-root>`. It has no dependencies and only reads files.
- `typescript-expert` ships an optional `scripts/ts_diagnostic.py` that needs Python 3.
- No accounts, credentials or environment variables.

## Usage examples

- "Where should the order-summary component live? It's used by the checkout page only."
- "Review `apps/api/src/modules/billing` for layering violations."
- "Add a Drizzle repository for invoices with a transaction across two tables."
- "Which skills apply to the files in my current diff?" (uses `skill-routing`)
- "Draw a sequence diagram of the sign-in flow."

## Evals

`evals/onion-architecture/` holds eight review cases in `claude plugin eval` format. Each one is a small backend fixture with planted layering violations, decoys and clean files. `expected-findings.json` is the ground truth. Run them with:

```bash
claude plugin eval plugins/engineering-paved-path --case 'onion-review-*'
```

## Upstream sources and attribution

Several skills were adapted from public skill repositories. Check each upstream repository's license before you redistribute changes.

| Skill | Upstream |
|---|---|
| `fastify-best-practices` | [mcollina/skills](https://github.com/mcollina/skills) (`skills/fastify`) |
| `next-best-practices` | [vercel-labs/next-skills](https://github.com/vercel-labs/next-skills) |
| `drizzle-orm-patterns` | [giuseppe-trisciuoglio/developer-kit](https://github.com/giuseppe-trisciuoglio/developer-kit) (`plugins/developer-kit-typescript`) |
| `postgresql-table-design` | [wshobson/agents](https://github.com/wshobson/agents) (`plugins/database-design/skills/postgresql`) |
| `typescript-expert` | [sickn33/antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills) |
| `zod` | [pproenca/dot-skills](https://github.com/pproenca/dot-skills) (`skills/.curated/zod`) |
| `security` | Written for this suite from OWASP sources and the community skills listed in its `references.md` ([getsentry/skills](https://github.com/getsentry/skills), [agamm/claude-code-owasp](https://github.com/agamm/claude-code-owasp), [trailofbits/skills](https://github.com/trailofbits/skills)) |
| `onion-architecture`, `frontend-architecture`, `react-best-practices`, `react-testing-library`, `mermaid-diagram`, `skill-routing` | Written for this suite; sources are cited in each skill's `references.md` where present |
