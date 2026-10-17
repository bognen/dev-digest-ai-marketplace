# Enforcement: a dependency check and a baseline ratchet

If the repo's architecture docs name a layering check, use that and stop here. Otherwise this is the recommended setup: **dependency-cruiser** as a linter, with a known-violations baseline that may only shrink. ESLint's `eslint-plugin-boundaries` is a fine alternative when the repo already uses ESLint.

## Suggested commands (run in the backend package)

| Command | What it does |
|---|---|
| `npx depcruise src --config .dependency-cruiser.cjs --ignore-known` | Cruise `src/`, ignoring baselined entries. **Exit 1 on any new violation.** Wire it to a script such as `arch:check`. |
| `npx depcruise src --config .dependency-cruiser.cjs --output-type err` | Same, but shows *all* violations including baselined ones. |
| `npx depcruise src --config .dependency-cruiser.cjs --output-type baseline > .dependency-cruiser-known-violations.json` | Regenerates the baseline. **Only after fixing violations.** |

Run the check in CI as its own job.

## Rules (reference layout)

| Rule | Forbids | Ring reasoning |
|---|---|---|
| `routes-no-persistence` | `routes.ts` → ORM, `db/**`, `adapters/**` | the edge delegates to services |
| `inner-no-outer` | helpers/service/executors/`pipeline/**` → HTTP framework, ORM, `db/**`, `adapters/**` | rings 1–3 know only ports |
| `inner-no-container` | same set → `platform/container.ts` | no service locator |
| `only-repository-touches-db` | any other `modules/**`/`platform/**` file → ORM, `db/schema` | persistence is the repository's job |
| `adapters-no-modules` | `adapters/**` → `modules/**`, seed data, `platform/container` | infrastructure doesn't know features |
| `no-cross-module` | `modules/A/**` → `modules/B/**` except `_shared/`, `index.ts`, `types.ts` | modules meet at public surfaces |
| `platform-not-inward` | `platform/**` (except the container) → `modules/**` | platform is below features |
| `no-circular` | import cycles | an inward-only graph is acyclic |

Minimal config sketch:

```js
// .dependency-cruiser.cjs
module.exports = {
  forbidden: [
    { name: 'routes-no-persistence', severity: 'error',
      from: { path: '^src/modules/[^/]+/routes\\.ts$' },
      to: { path: ['^src/db/', '^src/adapters/', 'node_modules/drizzle-orm'] } },
    { name: 'adapters-no-modules', severity: 'error',
      from: { path: '^src/adapters/' }, to: { path: '^src/modules/' } },
    { name: 'no-circular', severity: 'error', from: {}, to: { circular: true } },
    // …one entry per rule in the table above
  ],
  options: { tsPreCompilationDeps: true, tsConfig: { fileName: 'tsconfig.json' } },
};
```

`tsPreCompilationDeps: true` matters: ORM leaks are mostly `import type` / `typeof t.x.$inferSelect`, invisible after TS compilation.

## What the tool cannot catch (review + checklist)

- Row types **re-exported by a repository** (`export type { OrderRow }`). The importer looks clean once it imports from `./repository.js`.
- A route doing real business logic without importing anything forbidden (inline aggregation, building a degraded response).
- Wire-format DTO fields leaking into service signatures.
- A service importing its own module's concrete repository.

## The ratchet

1. The baseline may only **shrink**. A PR that adds an entry is rejected.
2. After a fix, regenerate the baseline and review its `git diff`: it must show removals only.
3. When it is empty, delete the file and the `--ignore-known` flag.
4. Baseline entries for ORM imports can embed the package manager's resolved path. After an ORM upgrade, regenerate once and confirm the *count* is unchanged.

## Paying down existing violations

Fix them in phases, one PR each, in this order: persistence out of routes → stop row-type leakage → narrow dependencies (`Deps` objects, ports for concrete adapters, adapters out of modules) → boundary hygiene the tool cannot detect. Each phase: refactor → typecheck → tests → regenerate baseline → confirm a removals-only diff.

## Sources

dependency-cruiser [rules reference](https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md) · [CLI / known-violations](https://github.com/sverweij/dependency-cruiser/blob/main/doc/cli.md) · Atomic Object, [Dependency Cruiser: Restrict Imports in JavaScript](https://spin.atomicobject.com/dependency-cruiser-imports/) · [eslint-plugin-boundaries](https://www.jsboundaries.dev/docs/overview/).
