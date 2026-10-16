---
name: onion-architecture
description: "Onion / ports-and-adapters layering for a TypeScript backend: the dependency rule, ring map, repositories and mappers, explicit Deps wiring, and a review sweep. Use when creating, moving, reviewing or refactoring backend modules, routes, services, repositories, adapters or the composition root."
metadata:
  tags: architecture, onion, hexagonal, clean-architecture, ports-and-adapters, backend, dependency-cruiser
---

# Onion Architecture (TypeScript backend)

**One rule:** source-code dependencies point **inward only**. Inner rings never
import outer rings; outer rings implement interfaces the inner rings own.
"The database is not the center. It is external." (Palermo)

## Your repo's docs come first

This skill describes a **reference layout**. It does not know your repository.
Before applying it, look for the repo's own architecture docs: `ARCHITECTURE.md`,
`docs/architecture/**`, and the `AGENTS.md` / `CLAUDE.md` of the backend package
(or the paths listed under `architectureDocs` in `.claude/sdd-engineering.json`).
When they exist they **override** this file and tell you:

- where the backend source root (`<src>`) is, and which folders map to which ring;
- the actual port names and where they are declared;
- the enforcement command (for example a `depcruise` script) and any baseline file;
- documented compromises that must not be "fixed" without discussion.

If the repo has no such docs, apply the reference layout below and say in your
output that you did so. Never invent repo paths, port names or commands.

## Reference layout

```
<src>/
  app.ts                          edge: HTTP server bootstrap, error handler
  platform/container.ts           composition root (the only place that wires everything)
  platform/*                      config, logger, errors, jobs (infrastructure, below features)
  modules/index.ts                static registry of feature modules
  modules/_shared/*               request → context adapter shared by routes
  modules/<m>/routes.ts           edge: HTTP ↔ one service call
  modules/<m>/service.ts          ring 3: application service
  modules/<m>/repository.ts       edge: persistence (the only ORM user in the module)
  modules/<m>/helpers.ts          ring 1: pure domain logic and domain → DTO mappers
  modules/<m>/types.ts            ring 2: ports and domain types (public surface)
  modules/<m>/index.ts            public surface
  adapters/**                     edge: SDK implementations of ports
  db/**                           edge: schema, client, migrations
<contracts package>               optional shared kernel: wire DTO schemas, value enums, port interfaces
```

## Ring map (flat files per module, no domain/application/infrastructure subfolders)

| Ring | Files | May import | Must NOT import |
|---|---|---|---|
| **1. Domain model** | `helpers.ts` (pure), `status.ts`, `constants.ts`, domain types, shared value enums | ring 1 only | HTTP framework, ORM, `db/*`, `adapters/*`, the composition root |
| **2. Ports** | per-module `types.ts`, port interfaces in the contracts package, repository interfaces | ring 1 | anything with I/O |
| **3. Application services** | `service.ts`, `*.service.ts`, executors, `pipeline/*` | rings 1–2 | HTTP framework, ORM, `db/*`, concrete `adapters/*`, the whole container |
| **4. Edge** | `routes.ts`, `repository.ts` / `repository/*.repo.ts`, `adapters/**`, `db/**`, `platform/container.ts` | anything inward | other modules' internals; `adapters/**` must not import `modules/**` |

- The **only** files allowed to import the ORM (for example `drizzle-orm`) or `db/schema`: repositories, `db/**`, `adapters/**`, the composition root.
- The **only** files that may import the HTTP framework (for example `fastify`): `routes.ts`, `modules/index.ts`, `modules/_shared/*`, `app.ts`. Verify with a grep instead of trusting this list.
- **The composition root is unique.** It may import everything. Nothing else may import it except routes (to reach the container) and the shared request-context helper.
- **A module's public surface** is `index.ts` + `types.ts`. Everything else is private (`no-cross-module`). Cross-module needs go through a port on the container or `_shared/`.

## Request flow

`routes.ts` (validate) → **one** `service` call → domain (`helpers.ts`, pure) → ports → adapters/repositories at the edge. Services are built once from the composition root and reach every external system (LLM, VCS, git, DB) **through a port injected by the container**. The inner rings depend on the interface; the edge supplies the implementation.

**A route never calls an adapter, a repository or the ORM directly.** If a handler needs external data, the service gets it via its port; the route only translates HTTP ↔ service call.

## Before you write code (checklist)

1. Which ring does each new file belong to? Name it by the ring map (`routes.ts`, `service.ts`, `repository.ts`, `helpers.ts`, `types.ts`).
2. Does a route handler do more than validate (schema) → **one** service call → return? Move the rest into the service.
3. Is there any query-builder call (`eq(...)`, `db.select`, `$inferSelect`) outside a repository? Move it. Repositories return **domain types via a mapper**, never ORM row types.
4. Does the service take the whole container? Give it an explicit `Deps` object of ports instead ([rules/platform-di.md](rules/platform-di.md)).
5. New external SDK or system? Define a port first, then the adapter (an anti-corruption translator), then a fake for tests.
6. Does the adapter import from `modules/**`? Move the shared constant/type to a neutral place (`adapters/` or the contracts package).
7. Parsing/validating inside a handler or service? Put the schema on the route. Validate once, at the boundary.
8. Do wire-format DTO fields (for example snake_case) leak into services? Services work with domain shapes; mappers translate at the edges.
9. Does the change need a transaction? The **service** owns the boundary; repositories accept an optional `tx` ([rules/drizzle.md](rules/drizzle.md)).
10. Run the repo's layering check if it has one (see its architecture docs) and the typechecker. New violations fail; never add to a baseline.

## Reviewing existing code (review mode)

When asked to review/audit rather than write code, optimise for **recall on real violations and precision on everything else**. Do not eyeball the tree and stop at the first few hits; run the sweep.

### The sweep

1. **Scan.** Run `node "${CLAUDE_SKILL_DIR}/scripts/scan-layers.mjs" <src-root>` (add `--json` for machine output). It parses every `.ts` file under the source root, resolves relative imports (including re-exports and dynamic `import()`), assigns each file to a ring from its path in the reference layout, and prints **candidate** violations per rule plus a ring map. It covers `inner-no-outer`, `inner-no-container`, `only-repository-touches-db`, `routes-no-persistence`, `adapters-no-modules`, `no-cross-module`, `platform-not-inward`, `no-circular`, the HTTP-framework allow-list, ORM row types in repository signatures, `safeParse`/`parse` of request data, HTTP concepts in inner rings, `process.env` in inner rings, and handlers that make several service calls. If the repo's layout differs from the reference layout, treat the scanner's ring map as approximate and say so.
2. **Verify every candidate.** The scanner is a heuristic. Open each flagged file at the flagged line, confirm it is a real breach, and drop anything covered by "Not violations" below. A clean scan is *not* a clean bill of health.
3. **Read what the scanner cannot judge.** Open these whether or not they were flagged ([rules/enforcement.md](rules/enforcement.md) → "What the tool cannot catch"):
   - **Repositories:** exported type aliases or re-exports carrying an ORM row type, and methods returning one. Then check who imports that alias; an importer looks clean because it imports from `./repository.js`.
   - **Service and domain files:** exported method signatures. Contract-shaped input (`customer_id`, `line_items`, `*_cents`, schema-inferred request types) means DTO fields leak into the service.
   - **Every route handler:** validate → **one** service call → map/return. Inline aggregation, status derivation, branching on service results, or hand-rolled validation of `req.params|body|query` are violations even without a forbidden import.
   - **Anything importing the contracts package:** enums and value types are fine inward; parsing or building a request/response *envelope* inside a service is not.
   - **Indirect paths:** barrel files, `export * from`, dynamic `import()`/`require` are still imports. Follow them to the real target.
4. **Cover every file.** Every file must be either flagged-and-judged or read-and-judged. List the ones you read and found compliant.

### Reporting

- Cite the rule name (or checklist item) and `file:line` for every finding. One finding per distinct breach.
- **Findings contain violations only.** Three sections, in this order: **Findings** (High/Medium), **Not violations (checked)**, **Other observations**.
- **Not violations: never list these under Findings**, not even as Low. Put them under *Not violations (checked)* with the reason:
  - A route or the composition root assembling a service from ports (`new XService({ repo: app.container.xRepo })`). Calling `container.*` *inside a handler body* to reach a port is a violation.
  - Placement or naming of mocks and fakes, or a missing `types.ts`/`helpers.ts` when nothing is wrongly placed.
  - A service importing **its own** module's concrete repository (a common, accepted compromise; an interface in `types.ts` is only needed when a unit test wants a fake).
  - Importing another module through its public surface (`index.ts` / `types.ts`).
  - Domain error classes thrown from services; shared value enums in inner rings; platform logger/errors imports; the HTTP framework in its allow-listed files.
  - Anything the repo's architecture docs list as a documented compromise.
  - A string or identifier that merely *mentions* the ORM, framework or an adapter without importing it.
- **Other observations** is for real defects that are not layering (SQL bugs, duplicated business rules, missing FK, lost error cause, unsafe casts, atomicity). Keep it short.
- **Severity:** High = breaks the dependency rule (inner → outer, cross-module private import, DB/SDK in a route, HTTP concept or DB handle in a service, platform → module, cycle). Medium = hidden leak the tool can't see (row types, DTO fields in services, logic or validation in a handler, envelope parsing in a service, config in an inner ring). Low = style; omit unless asked.
- Give the smallest fix that restores the rule (move one file or import, add one port). Do not propose restructuring the module.

## Common compromises (adopt only if the repo documents them)

- **Shared kernel.** A contracts package whose schemas double as API DTOs *and* shared vocabulary (value enums). Enums may travel inward; envelope shapes stay at the edge.
- **Errors carrying an HTTP status.** Services throw a domain error family; the framework's single error handler turns them into HTTP. No other HTTP concept enters inner rings.
- **Service → own concrete repository.** Acceptable as a step; prefer an interface in `types.ts` when a unit test needs a fake ([rules/testing.md](rules/testing.md)).

## Enforcement

Import rules are best enforced mechanically. [rules/enforcement.md](rules/enforcement.md) has a generic dependency-cruiser setup, a baseline ratchet, and the list of what a tool cannot catch. Use the repo's own check if its docs name one.

## Rules index

- [rules/fastify.md](rules/fastify.md): routes as the edge, validation, error mapping, plugins vs DI
- [rules/drizzle.md](rules/drizzle.md): repositories, mappers, transactions, schema types stay in infrastructure
- [rules/contracts-zod.md](rules/contracts-zod.md): contract DTOs vs domain types, parse at the boundary
- [rules/adapters.md](rules/adapters.md): ports for LLMs, VCS hosts, git, search and other SDKs
- [rules/platform-di.md](rules/platform-di.md): composition root, `Deps` objects, jobs, streaming, logging
- [rules/testing.md](rules/testing.md): fakes for ports, unit vs integration, route `inject`
- [rules/enforcement.md](rules/enforcement.md): dependency-cruiser rules, baseline ratchet, tool blind spots
- [examples.md](examples.md): good/bad pairs
- [references.md](references.md): sources and rationale

## Related skills

`engineering-paved-path:fastify-best-practices` (HTTP mechanics), `engineering-paved-path:drizzle-orm-patterns` (query/schema syntax), `engineering-paved-path:zod` (schema API), `engineering-paved-path:postgresql-table-design` (schema), `engineering-paved-path:security` (secrets, input), `engineering-paved-path:typescript-expert` (types). This skill decides **where code lives and what may import what**; those decide **how to write it**.
