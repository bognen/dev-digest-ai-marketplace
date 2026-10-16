---
type: llm
---

PASS if the report raises NO finding for `new InvoicesRepository()` or the `./repository.js` import in `src/modules/invoices/service.ts`, and notes (for example under "Checked, allowed by repo docs") that `docs/architecture/layers.md` allows it as `own-repository-construction`.
FAIL if the construction or the import appears as a finding of any severity.
