#!/usr/bin/env bash
# Writes the fixture repository into the empty eval workspace.
set -euo pipefail
cat > change.diff <<'FIXTURE_0'
diff --git a/src/modules/invoices/service.ts b/src/modules/invoices/service.ts
index 5555555..6666666 100644
--- a/src/modules/invoices/service.ts
+++ b/src/modules/invoices/service.ts
@@ -1,9 +1,13 @@
 import type { Invoice } from "./types.js";
+import { InvoicesRepository } from "./repository.js";

 export class InvoicesService {
+  private repo = new InvoicesRepository();
+
   async markPaid(invoice: Invoice) {
-    return { ...invoice, status: "paid" as const };
+    const paid = { ...invoice, status: "paid" as const };
+    await this.repo.save(paid);
+    return paid;
   }
 }
FIXTURE_0
mkdir -p docs/architecture
cat > docs/architecture/layers.md <<'FIXTURE_1'
# Layers

Modules live in `src/modules/<name>/` with `routes.ts`, `service.ts`, `repository.ts`, `types.ts`.

## Rules

- `inward-only`: `types.ts` and domain helpers import nothing from outer layers.
- `routes-thin`: routes validate, make one service call, and map the result.

## Documented exceptions

- `own-repository-construction` (ADR-007): a service MAY construct **its own module's** repository directly with `new`. We accepted this to avoid a container for single-repository modules. Constructing another module's repository is still forbidden.
FIXTURE_1
