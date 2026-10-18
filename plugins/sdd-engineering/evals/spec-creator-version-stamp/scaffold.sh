#!/usr/bin/env bash
# Workspace: a small Express service with no specs yet.
set -euo pipefail
mkdir -p specs src
cat > package.json <<'JSON'
{ "name": "orders-api", "version": "2.4.0", "private": true, "scripts": { "start": "node dist/server.js" } }
JSON
cat > src/server.ts <<'TS'
import express from 'express';

const app = express();
app.get('/orders', (_req, res) => res.json([]));
app.listen(3000);
TS
