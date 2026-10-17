---
name: skill-routing
description: "Lookup table mapping changed files to the engineering-paved-path skills that govern them, by path glob and import signal. Used by implementer and reviewer agents to load only the skills a diff needs. Not for general questions."
metadata:
  tags: routing, dispatcher, skills, lookup
---

# Skill routing

This table tells an agent which `engineering-paved-path` skills to load for a set of
changed or planned files. It holds no domain rules itself; the skills it points to do.

## Repo override

1. If `.claude/sdd-engineering.json` sets `skillRouting` to a markdown file in the repo,
   **that table replaces this one** entirely.
2. Otherwise use this table, plus any extra rows the repo's architecture docs
   (`ARCHITECTURE.md`, `docs/architecture/**`, a package's `AGENTS.md` / `CLAUDE.md`)
   define for its own paths. Repo rows win on conflict.
3. Paths in this table assume common layouts. Match on the import signals as well as
   the globs, so a repo with different folder names still routes correctly.

## Routing table

A file is routed to **every** row it matches.

| Files (glob or import signal) | Skills |
|---|---|
| Backend module files: `**/modules/**`, `**/adapters/**`, `**/platform/**`, `**/db/**`, `**/services/**`, `**/repositories/**` (non-test `.ts`) | `engineering-paved-path:onion-architecture` |
| Route or server-plugin files (`**/routes.ts`, `**/routes/**`, `**/plugins/**`, `**/app.ts`, `**/server.ts`) or any file importing `fastify`, `fastify-*`, `@fastify/*` | + `engineering-paved-path:fastify-best-practices` |
| Files importing `drizzle-orm`, files under `**/db/**`, `**/repository*.ts`, `drizzle.config.*` | + `engineering-paved-path:drizzle-orm-patterns` |
| Schema and migration files: `**/db/schema*`, `**/migrations/**`, `**/*.sql` | + `engineering-paved-path:postgresql-table-design` |
| Any file importing `zod` (or a shared contracts package built on it) | `engineering-paved-path:zod` |
| React components: `**/*.tsx` (non-test), files importing `react` | `engineering-paved-path:frontend-architecture`, `engineering-paved-path:react-best-practices` |
| Next.js files: `**/app/**/{page,layout,loading,error,not-found,route,template,default}.{ts,tsx}`, `next.config.*`, `middleware.ts`, any file importing `next/*` | + `engineering-paved-path:next-best-practices` |
| Frontend tests: `**/*.test.tsx`, `**/*.spec.tsx`, files importing `@testing-library/react` | `engineering-paved-path:react-testing-library` (+ `frontend-architecture` for test placement) |
| Any `*.ts` / `*.tsx` (either side) | `engineering-paved-path:typescript-expert`, `engineering-paved-path:security` |
| Markdown that adds or edits a diagram (```` ```mermaid ```` fences) | `engineering-paved-path:mermaid-diagram` |
| Docs-only or config-only changes that match nothing above | no skill; say so in the report |

## Rules

- **A skill sees only the files its row matched, never the whole diff.** A backend-only
  change must not load the React skills, and the reverse. This controls cost as much as
  correctness. `typescript-expert` and `security` are the deliberate exception: they
  see every changed source file.
- **Mixed diffs load both sides.** A change that touches backend and frontend files
  loads both skill sets in the same run; each skill still sees only its own side's
  files. List both sets in the report's routing section.
- **Load on demand.** Use the `Skill` tool for each routed skill when you reach the
  first file that needs it. Don't preload the whole set.
- **No match, no guess.** If a file type has no row and the repo docs add none, note
  "no skill covers `<path>`" rather than picking the nearest skill.
- **Keep this table honest.** When a skill is added to or removed from
  `engineering-paved-path`, update this table in the same release.
