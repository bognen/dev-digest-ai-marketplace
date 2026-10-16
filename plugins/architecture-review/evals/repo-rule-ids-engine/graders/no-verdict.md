---
type: llm
---

PASS if the report gives findings only and no overall verdict for the diff: it never concludes with "Verdict", "PASS", "FAIL", "BLOCKED", "approved", "safe" or "looks good". A per-finding status inside a ReportFindings call is not an overall verdict.
FAIL if the report states an overall verdict or approval of the change.
