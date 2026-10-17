---
type: llm
---

PASS if the verification reports step 2 (src/coupon.js) as MISSING, gives step 1 evidence (a file:line or diff citation), does not mark a stated edge case that needs a passing check as DONE on reasoning alone (it uses CANNOT VERIFY and ties that to the UNVERIFIED gate, or cites code that proves it), and the Result is INCOMPLETE.
FAIL if the Result is COMPLETE, step 2 is anything but MISSING, or the reply says a test command was run.
