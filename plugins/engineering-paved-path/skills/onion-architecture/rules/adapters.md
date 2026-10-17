# Adapters: every external system is behind a port

Ports (interfaces owned by the inner rings) live in a module's `types.ts` or in the shared contracts package; adapters (implementations) live in `<src>/adapters/**`. This is Ports & Adapters (Hexagonal) fused into the Onion: the inner rings **define** what they need; the edge **provides** it.

## Typical port ↔ adapter pairs

Your repo's architecture docs list the real ones. Typical examples:

| Port (inner ring) | Adapter (`adapters/**`) | SDK / tool |
|---|---|---|
| `LLMProvider` | `llm/openai.ts`, `llm/anthropic.ts` | `openai`, `@anthropic-ai/sdk` |
| `Embedder` | `embedder/openai.ts` | `openai` |
| `VcsClient` (for example `GitHubClient`) | `github/octokit.ts` | `octokit` |
| `GitClient` | `git/simple-git.ts` | `simple-git` |
| `CodeSearch` | `search/ripgrep.ts` | `@vscode/ripgrep` |
| `SecretsProvider` | `secrets/env.ts`, `secrets/aws.ts` | environment, a secrets manager |
| `JobQueue`, `EventBus` | `jobs/p-queue.ts`, `bus/memory.ts` | `p-queue`, in-memory emitter |

## Rules

1. **Port first.** Before adding an SDK call, add or extend the port in domain vocabulary (`listPullRequests(repo): PrMeta[]`), not SDK vocabulary (`octokit.rest.pulls.list`).
2. **Adapter = translator.** It owns protocol concerns (auth, retries, pagination, rate limits) and **maps SDK types ↔ domain types** in one place. SDK types must not appear in a port signature or escape the adapter.
3. **Adapters never import `modules/**`, the composition root, or seed data** (`adapters-no-modules`). If both sides need a constant, move it to a neutral location (`adapters/` or the contracts package).
4. **Application services never import a concrete adapter** (`inner-no-outer`). If one does, introduce a port in the module's `types.ts` and inject the adapter.
5. **Secrets only via a `SecretsProvider` port.** Adapters receive keys/tokens from the composition root's factories (`llm(id)`, `github()`); they never read env or files themselves.
6. **Errors:** adapters translate SDK failures into domain errors (for example `ExternalServiceError`, `ConfigError`). No raw SDK error escapes into services.
7. **Every port has a fake** and a test seam in the composition root (an overrides object). Unit tests inject the fake; no test hits the network.
8. **Degradation is a service decision.** Adapters throw; the *service* decides whether to serve persisted data when an external system is unavailable.
9. **Pure engines stay pure.** A library package that holds core logic (for example a review or pricing engine) receives its ports by injection and never gets the DB, network or filesystem.
10. **Jobs and streaming are infrastructure.** Services depend on a tiny `jobs.enqueue(...)` / `bus.publish(...)` port ([platform-di.md](platform-di.md)).

## Sources

Microsoft, [Anti-Corruption Layer pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/anti-corruption-layer) · Alistair Cockburn, [Hexagonal (Ports & Adapters)](https://alistair.cockburn.us/hexagonal-architecture/) · Palermo, [The Onion Architecture](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/).
