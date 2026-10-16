#!/usr/bin/env bash
# Workspace with a non-default contract: specs and plans live under rfcs/.
set -euo pipefail
mkdir -p .claude rfcs/plans src/orders
cat > .claude/sdd-engineering.json <<'JSON'
{ "specsDir": "rfcs/", "plansDir": "rfcs/plans/" }
JSON
cat > rfcs/2026-03-01-order-export.md <<'MD'
# Spec: Order export
Spec ID: SPEC-04
Status: approved
Supersedes: —

## Problem and user
Shop admins need a CSV export of orders.

## Goals / Non-goals
Goal: CSV download. Non-goal: other formats.

## User stories
- **US-1** As a shop admin, I want to download my orders as CSV, so that I can reconcile them.

## Acceptance criteria (EARS)
- **AC-1** [Event-driven] [MUST] WHEN an admin requests an export, the system (shall) return a CSV with one row per order and the columns id, date, total.
  Verify: unit — call the exporter with two orders and assert the header and two data rows.

| Source | Covered by |
|---|---|
| US-1 | AC-1 |

## Edge cases
None.
## Non-functional requirements
None.
## Inputs and provenance
User request, 2026-03-01.
## Untrusted inputs
None.
## Open questions
None.
MD
cat > src/orders/service.ts <<'TS'
export interface Order { id: string; date: string; total: number }
export function listOrders(): Order[] { return []; }
TS
