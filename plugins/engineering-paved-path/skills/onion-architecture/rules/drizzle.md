# Drizzle: persistence is infrastructure

`db/schema*`, row types, `$inferSelect`/`$inferInsert`, and every `eq/and/inArray/sql` call are **ring 4**.

## Rules

1. **Only repository files import `drizzle-orm` or `db/schema`:** `modules/<m>/repository.ts`, `modules/<m>/repository/*.repo.ts`, `db/**`, `adapters/**`, the composition root. Enforced by `only-repository-touches-db` and `routes-no-persistence`.
2. **One repository per aggregate/module**, with methods named by the domain (`getById`, `listForTenant`, `upsertOrder`), not generic `select`/`query`. Repositories encapsulate joins, upserts and "create-or-update" logic; callers never see a query builder.
3. **Return domain types, not rows.** A repository method's signature must not mention `typeof t.x.$inferSelect` or exported `*Row` aliases. Map row → domain type **inside the repository** with a named mapper.
4. **Where mappers live:** row → domain in the repository (it needs the schema shape); domain → API DTO in the module's pure `helpers.ts`, taking a **domain** type, so helpers stay in ring 1.
5. **The repository contract lives inward.** Declare the interface in the module's `types.ts` (ring 2); `repository.ts` `implements` it. Services depend on the interface, so unit tests can pass an in-memory fake.
6. **Tenant scoping is a repository invariant.** If the app is multi-tenant, every query takes the tenant id; never rely on the caller to filter.
7. **Transactions: the service owns the boundary, repositories join it.**
   - Drizzle: `db.transaction(async (tx) => { … })`; `tx.transaction()` gives savepoints; `tx.rollback()` for a business-triggered rollback.
   - Repository methods take an optional last argument `tx?: DbOrTx` and use `(tx ?? this.db)`. Export the `DbOrTx` type once from the DB client module.
   - A service needing atomicity across repositories asks a small `UnitOfWork`/`TransactionRunner` port (implemented in infrastructure) rather than importing `Db`.
8. **Migrations are generated, stay in the migrations folder, and are never edited once applied.** A schema change is an infrastructure change; a domain-type change is a separate, deliberate step in the mapper.
9. **No raw SQL in services or routes.** Vector/similarity queries also live in repositories.
10. **Duplicate persistence code is a boundary smell.** The same upsert in two routes means one repository method called from one service.

## Sketch

```ts
// modules/orders/types.ts (ring 2)
export interface OrdersRepo {
  getById(tenantId: string, id: string): Promise<Order | undefined>;
  upsertOrder(tenantId: string, order: Order, tx?: DbOrTx): Promise<void>;
}

// modules/orders/repository.ts (ring 4): the only file importing drizzle + schema
export class OrdersRepository implements OrdersRepo {
  constructor(private db: Db) {}
  async upsertOrder(tenantId: string, order: Order, tx?: DbOrTx) {
    await (tx ?? this.db).insert(t.orders).values(toInsertRow(tenantId, order))
      .onConflictDoUpdate({ target: [t.orders.id], set: toUpdateRow(order) });
  }
}
```

## Sources

Drizzle [Transactions](https://orm.drizzle.team/docs/transactions) · Sentry, [Atomic Repositories in Clean Architecture and TypeScript](https://blog.sentry.io/atomic-repositories-in-clean-architecture-and-typescript/) · Khalil Stemmler, [DTOs, Mappers & the Repository Pattern](https://khalilstemmler.com/articles/typescript-domain-driven-design/repository-dto-mapper/) · Skill: `engineering-paved-path:drizzle-orm-patterns` for syntax.
