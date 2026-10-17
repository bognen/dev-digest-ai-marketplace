# Examples: good/bad pairs

Illustrative snippets in the reference layout (`<src>/modules/<m>/…`). Names are invented.

## 1. Route does persistence (BAD → GOOD)

**Bad**: `modules/orders/routes.ts` (violates `routes-no-persistence`):

```ts
import { and, eq } from 'drizzle-orm';
import * as t from '../../db/schema.js';

app.get('/stores/:id/orders', { schema: { params: IdParams } }, async (req) => {
  const { tenantId } = await getContext(container, req);
  const [store] = await container.db.select().from(t.stores)
    .where(and(eq(t.stores.tenantId, tenantId), eq(t.stores.id, req.params.id)));
  if (!store) throw new NotFoundError('Store not found');
  const shop = await container.shopApi().catch(() => null);   // degrade decision in the route
  for (const o of await shop.listOrders(...))
    await container.db.insert(t.orders).values({ … });       // upsert copy #1
  // …aggregation of totals per order, also in the route
});
```

**Good**:

```ts
// orders/routes.ts (ring 4, edge)
app.get('/stores/:id/orders', { schema: { params: IdParams } }, async (req) => {
  const { tenantId } = await getContext(app.container, req);
  return service.listOrders(tenantId, req.params.id);
});

// orders/service.ts (ring 3): no fastify, no drizzle
async listOrders(tenantId: string, storeId: string): Promise<OrderSummary[]> {
  const store = await this.deps.repo.getStore(tenantId, storeId);
  if (!store) throw new NotFoundError('Store not found');
  const shop = await this.deps.shopApi().catch((err) => { this.deps.log.warn({ err }, 'shop API unavailable; serving persisted orders'); return null; });
  if (shop) await this.syncFromShop(tenantId, store, shop);     // uses repo.upsertOrder (single copy)
  return this.deps.repo.listWithTotals(tenantId, storeId);
}

// orders/repository.ts (ring 4): the only file importing drizzle + schema
```

## 2. ORM row type leaks inward (BAD → GOOD)

**Bad**: `modules/stores/helpers.ts` (`inner-no-outer`: a ring-1 file depends on the schema):

```ts
import * as t from '../../db/schema.js';
export function toStoreDto(row: typeof t.stores.$inferSelect): StoreDto { … }
```

**Good**: the repository maps row → domain; the helper maps domain → DTO:

```ts
// stores/types.ts (ring 2)
export interface StoreRecord { id: string; tenantId: string; name: string; currency: string; lastSyncedAt: Date | null }

// stores/repository.ts (ring 4)
private toRecord(row: typeof t.stores.$inferSelect): StoreRecord { return { id: row.id, … }; }
async getById(tenantId: string, id: string): Promise<StoreRecord | undefined> { … return row && this.toRecord(row); }

// stores/helpers.ts (ring 1, pure)
export function toStoreDto(s: StoreRecord): StoreDto { return { id: s.id, last_synced_at: s.lastSyncedAt?.toISOString() ?? null, … }; }
```

## 3. Whole container vs explicit `Deps` (BAD → GOOD)

**Bad**: `modules/orders/service.ts` (`inner-no-container`; the service builds its own repository):

```ts
import type { Container } from '../../platform/container.js';
constructor(private container: Container) { this.repo = new OrdersRepository(container.db); }
```

**Good**:

```ts
export interface OrdersServiceDeps { repo: OrdersRepo; llm: (id: Provider) => Promise<LLMProvider> }
export class OrdersService { constructor(private deps: OrdersServiceDeps) {} }

// routes plugin (edge) or the container assembles it
const service = new OrdersService({ repo: app.container.ordersRepo, llm: (id) => app.container.llm(id) });
```

Unit test, with no Fastify and no DB:

```ts
const svc = new OrdersService({ repo: new InMemoryOrdersRepo(), llm: async () => fakeLlm });
```

## 4. Adapter reaching into a feature module (BAD → GOOD)

**Bad**: `adapters/search/index.ts` imports `../../modules/catalog/constants.js` (`adapters-no-modules`).

**Good**: move the shared constants to `adapters/search/constants.ts` (or the contracts package) and have `catalog/constants.ts` import from there, so the arrow points edge → inner, never inner ← edge.

## 5. Application service imports a concrete adapter (BAD → GOOD)

**Bad**: `catalog/pipeline/reindex.ts` → `adapters/search/index.ts` (`inner-no-outer`).

**Good**: a port in `catalog/types.ts`:

```ts
export interface SearchIndexer { index(docs: CatalogDoc[]): Promise<void> }
```

`ElasticIndexer implements SearchIndexer` in `adapters/search`; the container injects it into the service's deps; `pipeline/*` receive `{ indexer, repo }`, never the container.

## 6. Good shapes to keep

- Module layout `routes.ts` → `service.ts` → `repository.ts` + pure `helpers.ts`/`constants.ts`.
- Ports declared inward + fakes for every port + a container overrides object.
- A structural `Logger` type in services (no framework logger).
- A facade port over a complex subsystem, injectable via overrides.
- A pure core library that receives only injected ports.
