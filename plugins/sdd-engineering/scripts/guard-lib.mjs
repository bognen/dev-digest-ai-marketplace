// Shared helpers for the sdd-engineering PreToolUse guards (spec-guard, plan-guard).
// Hook input arrives as JSON on stdin; exit 2 blocks the tool call and feeds
// stderr back to the agent.
import fs from 'node:fs';
import path from 'node:path';

export async function readInput() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// True when the call comes from the named agent, with or without the plugin namespace.
export function isAgent(input, name) {
  const type = String(input?.agent_type ?? '');
  return type === name || type.endsWith(`:${name}`);
}

export function projectRoot(input) {
  return path.resolve(process.env.CLAUDE_PROJECT_DIR || input?.cwd || process.cwd());
}

// Reads one directory key from .claude/sdd-engineering.json, normalised to "a/b/".
export function configDir(root, key, fallback) {
  let value = fallback;
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(root, '.claude', 'sdd-engineering.json'), 'utf8'));
    if (typeof cfg?.[key] === 'string' && cfg[key].trim()) value = cfg[key];
  } catch {
    // Missing or unreadable config: defaults apply.
  }
  const norm = value.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '');
  return norm ? `${norm}/` : '';
}

// Repo-relative, forward-slash path of the file the tool wants to write; '' if none.
export function targetPath(root, input) {
  const filePath = input?.tool_input?.file_path;
  if (!filePath) return { abs: '', rel: '' };
  const abs = path.resolve(root, filePath);
  const rel = path.relative(root, abs).split(path.sep).join('/');
  return { abs, rel };
}

export function newContent(input) {
  const ti = input?.tool_input ?? {};
  return String(ti.content ?? ti.new_string ?? '');
}

export function currentStatus(abs) {
  if (!abs || !fs.existsSync(abs)) return null;
  return /^(?:Plan )?Status:\s*([\w-]+)/im.exec(fs.readFileSync(abs, 'utf8'))?.[1]?.toLowerCase() ?? null;
}

export function block(message) {
  console.error(message);
  process.exit(2);
}

// The file must sit directly in dir (no subfolders) and match the name pattern.
export function insideDir(rel, dir, namePattern) {
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return false;
  if (!rel.startsWith(dir)) return false;
  const name = rel.slice(dir.length);
  return !name.includes('/') && namePattern.test(name);
}
