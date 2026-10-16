#!/usr/bin/env node
// PreToolUse guard (Write|Edit) for the spec-creator agent. Other callers pass through.
// Allows only markdown files directly inside specsDir (default specs/, from
// .claude/sdd-engineering.json). Never a plan (*-plan.md).
// Blocks edits to a spec whose Status is approved|implemented, and any write whose
// new content sets either status (only a human promotes a spec).
import {
  block, configDir, currentStatus, insideDir, isAgent, newContent, projectRoot, readInput, targetPath,
} from './guard-lib.mjs';

const input = await readInput();
if (input && !isAgent(input, 'spec-creator')) process.exit(0);
// Malformed input can't be attributed to an agent; fail closed only when it may be ours.
if (!input) block('spec-guard: unreadable hook input; blocking the write to be safe.');

const root = projectRoot(input);
const specsDir = configDir(root, 'specsDir', 'specs/');
const { abs, rel } = targetPath(root, input);

if (!insideDir(rel, specsDir, /^(?!.*-plan\.md$)[^/]+\.md$/i)) {
  block(
    `spec-creator may only write markdown specs directly inside ${specsDir} ` +
      `(set "specsDir" in .claude/sdd-engineering.json to change it). Blocked: ${rel || '(no file_path)'}`,
  );
}

const status = currentStatus(abs);
if (status === 'approved' || status === 'implemented') {
  block(`${rel} is Status: ${status}; approved/implemented specs are frozen. Write a new spec with "Supersedes" instead.`);
}
if (/^Status:\s*(approved|implemented)\b/im.test(newContent(input))) {
  block('spec-creator may only write "Status: draft"; only a human promotes a spec.');
}
process.exit(0);
