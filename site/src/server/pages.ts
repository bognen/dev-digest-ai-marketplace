// Build time only: turns the catalog and What's New data into the props each
// page needs. Only these props are embedded in the HTML, not the whole catalog.
import { CHANGE_TAGS } from '../lib/site';
import type { ArtifactView, Badge, CardInfo, ChangeView, HomeProps, PageData, RouteId, SearchProps, SiteInfo, WhatsNewProps } from '../types';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface SiteData {
  catalog: any;
  changes: { entries: any[] };
  settings: { badgeWindowDays: number; whatsNewStripCount: number };
  collections: { slug: string; title: string; description?: string; plugins: string[] }[];
  /** Category ids from site/data/taxonomy.json, in display order. */
  categories: string[];
  stars: number | null;
}

const DAY = 86_400_000;
const isWithinDays = (iso: string | null | undefined, days: number, now = Date.now()) => !!iso && now - new Date(iso).getTime() < days * DAY;
const idName = (id: string) => id.split('/').slice(1).join(' ').replace(/^(\w+) /, '$1: ');

function siteInfo(data: SiteData): SiteInfo {
  const { marketplace, artifacts, generatedAt } = data.catalog;
  return {
    name: marketplace.name,
    description: marketplace.description || '',
    repo: marketplace.repo ?? null,
    stars: data.stars,
    generatedAt,
    artifactCount: artifacts.length,
  };
}

/** New / Updated (within settings.badgeWindowDays), Beta and Deprecated badges. */
function badgesFor(data: SiteData, artifact: any): Badge[] {
  if (!artifact) return [];
  const days = data.settings.badgeWindowDays;
  const status = artifact.status;
  const live = status !== 'deprecated';
  const isNew = live && isWithinDays(artifact.addedAt, days);
  const isUpdated = live && !isNew && artifact.updatedAt !== artifact.addedAt && isWithinDays(artifact.updatedAt, days);
  const badges: Badge[] = [];
  if (isNew) badges.push({ kind: 'new', cls: CHANGE_TAGS.new });
  if (isUpdated) badges.push({ kind: 'updated', cls: CHANGE_TAGS.updated });
  if (status === 'beta') badges.push({ kind: 'beta', cls: CHANGE_TAGS.beta });
  if (status === 'deprecated') badges.push({ kind: 'deprecated', cls: CHANGE_TAGS.deprecated });
  return badges;
}

function card(data: SiteData, entry: any): CardInfo {
  const removed = entry.kind === 'removed';
  const artifact = removed ? null : data.catalog.artifacts.find((a: any) => a.id === entry.artifactId);
  const status = artifact?.status;
  const badges = badgesFor(data, artifact);
  return {
    type: entry.type,
    name: entry.title || entry.name,
    plugin: entry.plugin,
    href: artifact?.sourceUrl ?? null,
    badges,
    installable: !!artifact,
    deprecated: status === 'deprecated',
    removed,
  };
}

function change(data: SiteData, entry: any): ChangeView {
  const version =
    entry.kind === 'updated' && entry.toVersion
      ? `${entry.fromVersion ?? '—'} → ${entry.toVersion}`
      : entry.kind === 'new' && entry.toVersion
        ? `v${entry.toVersion}`
        : null;
  return {
    kind: entry.kind,
    type: entry.type,
    plugin: entry.plugin,
    date: entry.date,
    name: entry.title || entry.name,
    version,
    note: entry.note || entry.description || null,
    includes: (entry.includes ?? []).map(idName),
    changed: (entry.changed ?? []).map(idName),
    card: card(data, entry),
  };
}

function homeProps(data: SiteData): HomeProps {
  const { counts, artifacts } = data.catalog;
  const starter = data.collections.find((c) => c.slug === 'starter-pack');
  const plugins = (starter?.plugins ?? [])
    .map((name) => artifacts.find((a: any) => a.type === 'plugin' && a.name === name))
    .filter(Boolean)
    .map((p: any) => ({ name: p.name, description: p.description, installCommand: p.installCommand }));
  return {
    counts: { plugin: counts.plugin, skill: counts.skill, agent: counts.agent, command: counts.command },
    starter: { title: starter?.title ?? null, description: starter?.description ?? null, plugins },
    latest: data.changes.entries.slice(0, data.settings.whatsNewStripCount).map((e) => change(data, e)),
  };
}

function whatsNewProps(data: SiteData): WhatsNewProps {
  const entries = data.changes.entries;
  // Group by week (weeks start on Monday, UTC).
  const weekStart = (iso: string) => {
    const d = new Date(iso);
    const day = (d.getUTCDay() + 6) % 7;
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day)).toISOString();
  };
  const weeks: WhatsNewProps['weeks'] = [];
  for (const entry of entries) {
    const start = weekStart(entry.date);
    if (weeks.at(-1)?.start !== start) weeks.push({ start, entries: [] });
    weeks.at(-1)!.entries.push(change(data, entry));
  }
  return {
    weeks,
    total: entries.length,
    kinds: ['new', 'updated', 'deprecated', 'removed'],
    types: [...new Set<string>(entries.map((e) => e.type))],
    plugins: [...new Set<string>(entries.map((e) => e.plugin))].sort(),
  };
}

const TYPE_ORDER = ['plugin', 'skill', 'agent', 'command', 'hook', 'mcp'];

function searchProps(data: SiteData): SearchProps {
  const all = data.catalog.artifacts;
  const artifacts: ArtifactView[] = all.map((a: any) => ({
    id: a.id,
    type: a.type,
    name: a.title || a.name,
    description: a.description,
    plugin: a.plugin,
    category: a.category,
    tags: a.tags ?? [],
    version: a.version,
    updatedAt: a.updatedAt,
    status: a.status,
    installCommand: a.installCommand,
    href: a.sourceUrl ?? null,
    badges: badgesFor(data, a),
  }));
  const used = (key: 'category' | 'status') => new Set<string>(all.map((a: any) => a[key]).filter(Boolean));
  const categories = used('category');
  return {
    artifacts,
    types: TYPE_ORDER,
    plugins: [...new Set<string>(all.filter((a: any) => a.type === 'plugin').map((a: any) => a.name))],
    // Taxonomy order, plus any category in use that the taxonomy doesn't list.
    categories: [...new Set([...data.categories, ...categories])],
    statuses: [...new Set(['stable', 'beta', 'deprecated', ...used('status')])],
  };
}

export function pageData(route: RouteId, data: SiteData): PageData {
  const site = siteInfo(data);
  if (route === 'home') return { route, site, props: homeProps(data) };
  if (route === 'whats-new') return { route, site, props: whatsNewProps(data) };
  if (route === 'search') return { route, site, props: searchProps(data) };
  return { route, site, props: {} };
}
