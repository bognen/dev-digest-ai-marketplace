#!/usr/bin/env node
// PreToolUse guard (Write|Edit) for the implementation-planner agent. Other callers pass through.
// Allows only a Development Plan directly inside plansDir (default docs/plans/, from
// .claude/sdd-engineering.json), named *-plan.md.
// Blocks edits to a plan whose Status is anything but draft, and any write whose new
// content sets a non-draft status (only a human approves a plan).
import {
  block, configDir, currentStatus, insideDir, isAgent, newContent, projectRoot, readInput, targetPath,
} from './guard-lib.mjs';

const FROZEN = /^(?:Plan )?Status:\s*(approved|in-progress|implemented|done)\b/im;

const input = await readInput();
if (input && !isAgent(input, 'implementation-planner')) process.exit(0);
if (!input) block('plan-guard: unreadable hook input; blocking the write to be safe.');

const root = projectRoot(input);
const plansDir = configDir(root, 'plansDir', 'docs/plans/');
const { abs, rel } = targetPath(root, input);

if (!insideDir(rel, plansDir, /^[^/]+-plan\.md$/i)) {
  block(
    `implementation-planner may only write a plan file ${plansDir}*-plan.md, never a spec or code ` +
      `(set "plansDir" in .claude/sdd-engineering.json to change it). Blocked: ${rel || '(no file_path)'}`,
  );
}

const status = currentStatus(abs);
if (status && status !== 'draft') {
  block(`${rel} is Status: ${status}; only draft plans can be edited. Ask the user before writing a new plan.`);
}
if (FROZEN.test(newContent(input))) {
  block('implementation-planner may only write "Status: draft"; only a human approves a plan.');
}
process.exit(0);
