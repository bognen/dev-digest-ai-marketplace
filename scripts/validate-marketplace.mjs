#!/usr/bin/env node
// Marketplace policy checks that `claude plugin validate` does not cover:
// sorted/unique entries, existing sources, name and folder agreement, version
// only in plugin.json, taxonomy categories/tags, frontmatter, README, pinned
// external sources and no stray files in .claude-plugin/.
//
// Usage: node scripts/validate-marketplace.mjs [--json]
// Exit code: 0 = no errors (warnings allowed), 1 = errors found.

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate } from './lib/catalog.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { model, issues } = validate(root);
const errors = issues.filter((i) => i.level === 'error');
const warnings = issues.filter((i) => i.level === 'warning');

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ errors, warnings }, null, 2));
} else {
  const plugins = model.plugins.length;
  const artifacts = model.artifacts.filter((a) => a.type !== 'plugin').length;
  console.log(`Checked ${plugins} plugin(s) and ${artifacts} component(s).`);
  for (const i of warnings) console.log(`  ⚠ ${i.path}: ${i.message}`);
  for (const i of errors) console.log(`  ✘ ${i.path}: ${i.message}`);
  console.log(errors.length ? `✘ ${errors.length} error(s), ${warnings.length} warning(s)` : `✔ Passed with ${warnings.length} warning(s)`);
}

process.exit(errors.length ? 1 : 0);
