#!/usr/bin/env bash
# Writes the fixture repository into the empty eval workspace.
set -euo pipefail
cat > change.diff <<'FIXTURE_0'
diff --git a/app/src/modules/scoring/score.ts b/app/src/modules/scoring/score.ts
index eeeeeee..fffffff 100644
--- a/app/src/modules/scoring/score.ts
+++ b/app/src/modules/scoring/score.ts
@@ -1,10 +1,12 @@
 export interface ScoreRow {
   id: string;
   score: number;
 }

-export function summarize(rows: ScoreRow[]) {
-  return rows.map((r) => ({ id: r.id, score: r.score }));
+// Renamed locals for readability; behaviour unchanged.
+export function summarize(rows: ScoreRow[]) {
+  return rows.map((row) => ({ id: row.id, score: row.score }));
 }
FIXTURE_0
