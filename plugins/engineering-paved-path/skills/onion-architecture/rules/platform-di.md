# Platform & DI: one composition root, narrow dependencies

## The container

`platform/container.ts` is the **composition root**: it builds the DB client, secrets, auth, job queue and event bus, lazily builds adapters, exposes async factories (`github()`, `llm(id)`, `embedder()`), and shared repositories. An overrides object is the test seam. That is **correct and stays**.

The problem is never the container; it is passing the **whole container into services** (service locator). Any service can then reach the DB and every port, the dependency rule can't be checked, and unit tests need a fake container.

## Rules

1. **Only routes, the shared request-context helper and the composition root may reference the container.** Enforced by `inner-no-container`.
2. **Services take an explicit `Deps` object** of ports and factories, defined next to the service:
   ```ts
   export interface OrdersServiceDeps {
     repo: OrdersRepo;                        // port (module types.ts)
     llm: (id: Provider) => Promise<LLMProvider>;
     clock?: () => Date;                      // only if needed
   }
   export class OrdersService { constructor(private deps: OrdersServiceDeps) {} }
   ```
   The routes plugin (or the container) assembles it: `new OrdersService({ repo: c.ordersRepo, llm: (id) => c.llm(id) })`.
3. **Pass factories, not resolved clients, for lazy or optional deps** (`github: () => Promise<GitHubClient>`), so "no token configured" stays a runtime, per-request outcome and offline mode keeps working.
4. **No `new Repository(db)` inside services.** Repositories are constructed in the container or the routes plugin and injected.
5. **Break container ↔ service cycles.** With `Deps`, the service no longer imports the container, so the cycle disappears.
6. **`platform/*` other than the container must not import `modules/**`** (`platform-not-inward`). A job runner that touches the DB is an infrastructure adapter behind a small port (`jobs.enqueue(name, fn)`): move it under `adapters/` or exempt it explicitly, with a comment, in the enforcement config. Do not silently grow the exemption list.
7. **Logging (structured).** The framework logger stays at the edge. Inner rings take a structural `Logger` (`{ info, warn, error }` with an `(obj, msg)` signature). Log with fields (`{ runId, orderId, err }`), not interpolated strings, so runs are traceable. Never log secrets or tokens.
8. **Config:** read once in `platform/config.ts`; pass values via `Deps`, never `process.env` in inner rings.
9. **Test seam:** every new dependency gets an overrides slot (adapters) or is a plain `Deps` field (services).

## Migrating a module

`Deps` interface → constructor takes `Deps` → routes plugin builds it → remove the container import from the service → the baseline shrinks.

## Sources

Palermo: Onion requires DI to wire outer implementations into inner interfaces ([part 1](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/)) · Graça, [DDD, Hexagonal, Onion, Clean, CQRS… How I put it all together](https://herbertograca.com/2017/11/16/explicit-architecture-01-ddd-hexagonal-onion-clean-cqrs-how-i-put-it-all-together/) · Fastify [Plugins guide](https://fastify.dev/docs/latest/Guides/Plugins-Guide/).
