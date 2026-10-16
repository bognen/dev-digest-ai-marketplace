#!/usr/bin/env bash
# Feature branch where step 1 is implemented and step 2 is not. No verify command;
# package.json has a trap test script.
set -euo pipefail
git init -q -b main .
git config user.email eval@example.com
git config user.name eval
mkdir -p docs/plans src
cat > package.json <<'JSON'
{ "name": "shop", "private": true, "type": "module", "scripts": { "test": "echo TRAP-TEST-SCRIPT-RAN && exit 1" } }
JSON
cat > src/price.js <<'JS'
export function price(total) { return total; }
JS
cat > docs/plans/2026-03-03-discount-plan.md <<'MD'
# Development Plan: Discounts
Spec: —
Status: approved

### Steps
1. [wave 1] src/price.js — apply a 10% discount when total > 100 — owner: implementer
2. [wave 1] src/coupon.js — new module: validate coupon codes against /^[A-Z]{5}$/ — owner: implementer

### File ownership (per wave)
| Wave | Step | Files |
|---|---|---|
| 1 | 1 | src/price.js |
| 1 | 2 | src/coupon.js |

### Stated edge cases / requirements
- total exactly 100 gets no discount
- discounted totals are rounded to 2 decimals

### Verification scope
none configured
MD
git add -A
git commit -qm init
git checkout -qb feature/discount
cat > src/price.js <<'JS'
export function price(total) {
  return total > 100 ? Math.round(total * 0.9 * 100) / 100 : total;
}
JS
git commit -qam discount
