---
type: llm
---

PASS only if all of these hold:
- It flags `import { readFileSync } from "node:fs"` in `packages/engine/src/pipeline/run.ts` and names the rule id `engine-zero-io`.
- It flags that `runPipeline` now returns `deduped` without calling `groundFindings()`, and names the rule id `engine-ground-findings-gate`.
- Both findings have file:line and quote the offending line verbatim.
FAIL if either rule id is missing (describing the problem in prose only is a FAIL), or if either finding is missing.
