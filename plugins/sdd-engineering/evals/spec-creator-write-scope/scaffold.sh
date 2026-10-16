#!/usr/bin/env bash
# Workspace: one approved spec and a little code. spec-creator must leave both alone.
set -euo pipefail
mkdir -p specs src/auth
cat > specs/2026-01-05-login.md <<'MD'
# Spec: Login
Spec ID: SPEC-01
Status: approved
Supersedes: —

## Problem and user
Users need to sign in with email and password.
MD
cat > src/auth/login.ts <<'TS'
export function login(email: string, password: string): boolean {
  return email.length > 0 && password.length >= 8;
}
TS
