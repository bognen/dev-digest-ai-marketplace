#!/usr/bin/env bash
# Writes the fixture repository into the empty eval workspace.
set -euo pipefail
cat > change.diff <<'FIXTURE_0'
diff --git a/app/src/modules/checkout/domain/checkout.ts b/app/src/modules/checkout/domain/checkout.ts
index 1111111..2222222 100644
--- a/app/src/modules/checkout/domain/checkout.ts
+++ b/app/src/modules/checkout/domain/checkout.ts
@@ -1,5 +1,6 @@
+import type { FastifyReply } from "fastify";
 export interface CheckoutOrder {
   id: string;
   total: number;
 }

-export function priceOrder(order: CheckoutOrder): number {
+export function priceOrder(order: CheckoutOrder, reply?: FastifyReply): number {
   return order.total;
 }

diff --git a/app/src/modules/checkout/service.ts b/app/src/modules/checkout/service.ts
index 3333333..4444444 100644
--- a/app/src/modules/checkout/service.ts
+++ b/app/src/modules/checkout/service.ts
@@ -1,10 +1,14 @@
 import { priceOrder } from "./domain/checkout.js";
+import { PgCheckoutRepository } from "./repository.js";

 export class CheckoutService {
+  private repo = new PgCheckoutRepository();
+
   async checkout(order: { id: string; total: number }) {
     const price = priceOrder(order);
+    await this.repo.save(order.id, price);
     return { price };
   }
 }
FIXTURE_0
cat > ARCHITECTURE.md <<'FIXTURE_1'
# Architecture

The backend in `app/src` follows an onion layout. Each module under `app/src/modules/<name>/` has a domain folder (`domain/`), a service (`service.ts`), a repository (`repository.ts`) and routes (`routes.ts`). `app/src/container.ts` is the only composition root.

## Rules

| Id | Rule |
|---|---|
| `inward-only-dependencies` | Files in `domain/` import nothing from outer layers: no `fastify`, no ORM, no repositories, no adapters. |
| `di-discipline` | Repositories and adapters are constructed only in `app/src/container.ts` and injected into services through their constructor. |
| `routes-thin` | A route handler validates input, makes one service call and maps the result. |

## Check command

None. Boundaries are reviewed by hand.
FIXTURE_1
