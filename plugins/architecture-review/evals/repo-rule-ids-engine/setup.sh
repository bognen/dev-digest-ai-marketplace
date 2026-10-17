#!/usr/bin/env bash
# Writes the fixture repository into the empty eval workspace.
set -euo pipefail
cat > change.diff <<'FIXTURE_0'
diff --git a/packages/engine/src/pipeline/run.ts b/packages/engine/src/pipeline/run.ts
index ccccccc..ddddddd 100644
--- a/packages/engine/src/pipeline/run.ts
+++ b/packages/engine/src/pipeline/run.ts
@@ -1,4 +1,5 @@
 import type { PipelineInput, Finding } from "./types.js";
+import { readFileSync } from "node:fs";
 import { draftFindings } from "./draft.js";
 import { dedupe } from "./dedupe.js";
 import { groundFindings } from "./ground.js";
@@ -6,9 +7,10 @@ import { groundFindings } from "./ground.js";
 export async function runPipeline(input: PipelineInput): Promise<Finding[]> {
   const llm = input.llm;
+  const prompt = readFileSync(input.promptPath, "utf8");
   const drafted = await draftFindings(input, llm);
   const deduped = dedupe(drafted);
-  const grounded = await groundFindings(deduped, input.diff);
-  return grounded;
+  return deduped;
 }
FIXTURE_0
mkdir -p packages/engine
cat > packages/engine/AGENTS.md <<'FIXTURE_1'
# packages/engine

A pure review engine. It is called with an injected `LLMProvider` and returns findings.

## Contracts

- `engine-zero-io`: the engine performs no I/O. No `node:fs`, no network, no database, no process spawning. Everything it needs arrives in `PipelineInput`; the only side channel is the injected `LLMProvider`.
- `engine-ground-findings-gate`: every finding the pipeline returns must pass `groundFindings()` first. Returning drafted or deduplicated findings without grounding is forbidden.
FIXTURE_1
