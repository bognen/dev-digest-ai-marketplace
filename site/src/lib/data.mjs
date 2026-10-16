// Build-time access to the marketplace catalog. Everything is read from the
// repository through scripts/lib/catalog.mjs, the same code CI validates with.
import { resolve } from 'node:path';
import { buildSiteData } from '../../../scripts/lib/catalog.mjs';
import collections from '../../data/collections.json';
import settings from '../../data/settings.json';
import taxonomy from '../../data/taxonomy.json';

const REPO_ROOT = process.env.REPO_ROOT || resolve(process.cwd(), '..');

let cached;

export function getSiteData() {
  if (!cached) {
    const data = buildSiteData(REPO_ROOT);
    const errors = data.issues.filter((i) => i.level === 'error');
    if (errors.length) {
      throw new Error(`The catalog is invalid; run node scripts/validate-marketplace.mjs\n${errors.map((e) => `  ${e.path}: ${e.message}`).join('\n')}`);
    }
    cached = { ...data, settings, taxonomy, collections: collections.collections };
  }
  return cached;
}

let stars;

// GitHub star count for the header; null when the API is unreachable.
export async function getRepoStars() {
  if (stars !== undefined) return stars;
  const repo = getSiteData().catalog.marketplace.repo;
  stars = null;
  if (!repo) return stars;
  try {
    const headers = { Accept: 'application/vnd.github+json' };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const res = await fetch(`https://api.github.com/repos/${repo}`, { headers, signal: AbortSignal.timeout(4000) });
    if (res.ok) stars = (await res.json()).stargazers_count ?? null;
  } catch {
    // keep null
  }
  return stars;
}

export function url(path = '') {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export function formatDate(iso) {
  return iso ? dateFormat.format(new Date(iso)) : '';
}

export function isWithinDays(iso, days, now = new Date()) {
  return Boolean(iso) && now - new Date(iso) < days * 86_400_000;
}

// en-US month names: en-GB abbreviates September as "Sept".
const shortMonth = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' });

/** "14 Oct", for timelines where the year is implied. */
export function formatShortDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getUTCDate()} ${shortMonth.format(d)}`;
}

export const TYPE_LABELS = { plugin: 'Plugin', skill: 'Skill', agent: 'Agent', command: 'Command', hook: 'Hook', mcp: 'MCP' };
/** Short type codes shown on cards (the design system uses one accent for every type). */
export const TYPE_CODES = { plugin: 'PLUGIN', skill: 'SKILL', agent: 'AGENT', command: 'CMD', hook: 'HOOK', mcp: 'MCP' };
export const CHANGE_LABELS = { new: 'New', updated: 'Updated', deprecated: 'Deprecated', removed: 'Removed' };
/** Tag variant per change kind / status badge. */
export const CHANGE_TAGS = { new: 'tag-accent', updated: 'tag-outline', deprecated: 'tag-neutral', removed: 'tag-neutral', beta: 'tag-neutral' };

export function plural(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}
